# Design

## Context

feat-006 (dueño: dev-a). Ya existen `infra/terraform/user-data.sh` (archivo de contrato: swap de 2 GB, Docker y `~/app/.env` con secretos aleatorios) y `scripts/check.sh`, que valida `terraform fmt`, `init -backend=false` y `validate` cuando hay `infra/terraform/*.tf`. Hoy solo hay `user-data.sh`; no hay recursos `.tf` ni estado de Terraform en el repositorio (`.gitignore` excluye `*.tfstate`, `*.tfvars` y `tfplan`, e incluye `*.tfvars.example`). El pipeline de feat-009 (dev-b) consumirá los outputs de este cambio como secrets de GitHub (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`). Motivación y alcance: `proposal.md`; requisitos observables: `specs/infrastructure/spec.md` (RNF-02, RNF-03). El único ADR aceptado (0001) no restringe la infraestructura.

## Goals / Non-Goals

**Goals:**
- Código Terraform reproducible en `infra/terraform/` que cree exactamente una instancia EC2 t3.micro (Ubuntu 24.04 amd64, gp3 de 16 GB), un security group (80 público, 22 solo desde `admin_cidr`, sin 5432) y una Elastic IP, iniciada con el `user-data.sh` existente.
- Outputs `public_ip`, `app_url` y `ssh_command` listos para el smoke test y para los secrets del pipeline.
- Validación local con `./scripts/check.sh` (fmt, init sin backend, validate); `plan` y `apply` los ejecuta el usuario (dev-a), nunca el agente.

**Non-Goals:**
- Backend remoto de estado (S3), dominio, HTTPS, balanceador, RDS ni VPC propia (fuera de alcance en la propuesta).
- Modificar `user-data.sh` o desplegar la aplicación (feat-009 / docker compose en la EC2).
- Crear el key pair de AWS en Terraform: se usa un par existente declarado en `key_name`.

## Decisions

### D1. VPC por defecto, sin red propia
La instancia y el security group usan la VPC por defecto de la región (`default` o `subnet_id` por defecto).  
**Alternativa descartada:** VPC propia con subnet pública, IGW y route table (patrón de otros proyectos): añadiría 4+ recursos al plan y el spec exige un plan con exactamente una instancia, un security group y una Elastic IP.  
**Requiere ADR:** no; reversible cambiando el `main.tf` en un futuro cambio si aparece la necesidad de red aislada.

### D2. AMI de Ubuntu 24.04 por data source, no ID fijo
`data "aws_ami"` con `owners = ["099720109477"]` (Canonical), filtro `name = ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*`, `state = available` y arquitectura `x86_64` (patrón confirmado contra la cuenta real en us-east-1 durante el apply; el patrón sin `ubuntu-noble` no devuelve resultados).  
**Alternativa descartada:** hardcodear un AMI ID (queda obsoleta por región y fecha); filtro demasiado amplio (podría elegir una variante no LTS). Si Canonical publica otra variante con el mismo patrón, el siguiente plan pedirá reemplazar la AMI solo si se recrea la instancia; el ID elegido queda en el estado.

### D3. Elastic IP fuera de la instancia
`aws_eip` asociada a `aws_instance` (`association_id` o `depends_on` + `aws_eip_association` implícita vía argumentos del recurso EIP). Al detener/encender la instancia la IP no cambia (spec: escenario «Reinicio de la instancia»).  
**Alternativa descartada:** confiar en la IP pública efímera con `associate_public_ip_address = true`: se pierde al stop/start y rompería el secret `EC2_HOST` del pipeline (feat-009).

### D4. Seguridad group mínimo, sin reglas de salida extra
Ingress: 80/TCP desde `0.0.0.0/0`; 22/TCP desde `var.admin_cidr` (IPv4 `/32`, con validación). Egress: la salida completa por defecto (necesaria para apt, Docker Hub y GHCR). Sin ingress de 5432.  
**Alternativa descartada:** restringir egress a puertos concretos: complicaría user-data y el pull de imágenes sin aportar al requisito (RNF-02 habla de puertos de entrada expuestos).

### D5. user_data en claro vía `file()`
`user_data = file("${path.module}/user-data.sh")`, como indica el propio contrato en el encabezado del script. El script no contiene secretos (los genera en el servidor con `openssl`), por lo que no se filtra nada al estado.  
**Alternativa descartada:** `user_data_base64 = base64encode(file(...))`: defensa útil cuando el contenido es sensible; aquí es ruido y se aleja del comentario de contrato.

### D6. Clave SSH externa (`key_name`), no `aws_key_pair`
Variable `key_name` obligatoria: el par ya existe en la cuenta de AWS y la clave privada vive solo en la máquina de dev-a (`~/keys/*.pem`, ignorada por git).  
**Alternativa descartada:** crear `aws_key_pair` leyendo una `.pub` con `file()`: obligaría a versionar o administrar la clave pública y a sincronizarla con el `.pem` del pipeline; el README y DEPLOYMENT.md ya asumen un par existente.

### D7. Un solo módulo plano en `infra/terraform/`
Archivos: `main.tf` (bloque `terraform`, provider y recursos), `variables.tf`, `outputs.tf`, `terraform.tfvars.example`. El lockfile `.terraform.lock.hcl` se genera con `init` y se commitea (el `.gitignore` ya lo permite).  
**Alternativa descartada:** módulos reutilizables (`modules/`): innecesario con un entorno y un stack; añade complejidad sin beneficiar a feat-009.

### D8. Costos y etiquetas
Tags en todos los recursos etiquetables: `Name`, `Project = "library-g2"`, `ManagedBy = "terraform"`. Mientras exista la instancia hay costo (t3.micro + EIP idle); se elimina con `terraform destroy` (documentado en la propuesta y en `infra/terraform/README.md`).

## Inventario de recursos, variables y outputs

### Recursos de AWS (los 3 del plan)
| Recurso | Tipo | Detalle clave |
|---|---|---|
| `data.aws_ami.ubuntu` | data source | Ubuntu 24.04 LTS amd64 (Canonical), gp3, `most_recent = true` |
| `aws_security_group.app` | SG | ingress 80 (`0.0.0.0/0`) y 22 (`var.admin_cidr`); egress total; sin 5432 |
| `aws_instance.app` | EC2 t3.micro | AMI del data source, `key_name`, `user_data` = `user-data.sh`, root gp3 16 GB cifrado, tags |
| `aws_eip.app` | Elastic IP | asociada a la instancia; sostiene la IP entre stop/start |

### Variables
| Variable | Tipo | Default | Descripción |
|---|---|---|---|
| `region` | string | `"us-east-1"` | Región del provider AWS |
| `key_name` | string | *(sin default)* | Par de claves existente en la región; validación de no vacío |
| `admin_cidr` | string | *(sin default)* | IPv4 `/32` desde la que se permite SSH; validación de formato y de que el host sea IPv4 válido (mensaje con `curl -s https://checkip.amazonaws.com`) |

### Outputs
| Output | Valor | Uso |
|---|---|---|
| `public_ip` | IP de la Elastic IP | secret `EC2_HOST` y `ssh ubuntu@...` |
| `app_url` | `"http://${aws_eip.app.public_ip}"` | smoke test y demo |
| `ssh_command` | `"ssh -i <ruta-local-del-pem> ubuntu@${...}"` con la ruta derivada de `key_name` o documentada en el mensaje del output | copiar y pegar en la terminal de dev-a |

### Archivos que toca el cambio
| Archivo | Acción | Dueño |
|---|---|---|
| `infra/terraform/main.tf` | crear | dev-a |
| `infra/terraform/variables.tf` | crear | dev-a |
| `infra/terraform/outputs.tf` | crear | dev-a |
| `infra/terraform/terraform.tfvars.example` | crear (`region`, `key_name`, `admin_cidr` de ejemplo) | dev-a |
| `infra/terraform/.terraform.lock.hcl` | generar con `terraform init` y commitear | dev-a |
| `infra/terraform/user-data.sh` | **no se modifica** (contrato) | dev-a |

Ningún archivo compartido (no se tocan `docker-compose*.yml`, workflows ni `app/main.py`).

## Procedimiento de plan y apply (lo ejecuta el usuario de dev-a)

```bash
aws configure   # credenciales solo en la máquina de dev-a
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # key_name y admin_cidr = "<tu-ip>/32"
terraform init
terraform plan -out tfplan    # debe listar: 1 instance, 1 security group, 1 eip; sin destroy
terraform apply tfplan
# esperar 2–3 minutos (user-data) y verificar:
ssh -i ~/keys/<llave>.pem ubuntu@"$(terraform output -raw public_ip)" 'cat /var/log/user-data.done'
gh secret set EC2_HOST --body "$(terraform output -raw public_ip)"
gh secret set EC2_USER --body "ubuntu"
gh secret set EC2_SSH_KEY < ~/keys/<llave>.pem
```

El agente solo corre `terraform fmt`, `terraform init -backend=false` y `terraform validate` (vía `./scripts/check.sh`). `plan` con credenciales, `apply` y `destroy` son del usuario (AGENTS.md).

## Risks / Trade-offs

- [La IP de `admin_cidr` cambia y se pierde el SSH] → tfvars no está en git; dev-a actualiza `admin_cidr` y reaplica solo el SG (plan muestra diff de una regla).
- [Elastic IP con costo idle si se olvida el servidor] → recordatorio en README y `terraform destroy` al cerrar el proyecto (feat-010).
- [VPC por defecto ausente en la cuenta/region] → el plan/apply falla de forma explícita; mitigación: usar una región con VPC por defecto (`us-east-1` la tiene) o abrir un cambio con VPC propia (D1).
- [Canonical publica otra AMI que empareja el regex] → el data source solo cambia de ID si se recrea la instancia; si el plan propone reemplazo inesperado, revisar el filtro antes de aplicar.
- [Estado local de Terraform solo en dev-a] → no hay colaboración concurrente sobre el mismo estado; si se pierde el estado, hay que importar o destruir a mano; se asume un solo operador (documentado en PRODUCT.md sección 9).

## Migration Plan

1. **Despliegue:** usuario ejecuta init → plan → apply (procedimiento anterior). Rollback: `terraform destroy -auto-approve` (solo el usuario; irreversible) o stop de la instancia si solo hay que parar el costo.
2. **Verificación:** `./scripts/check.sh` en verde; `terraform plan` posterior informa «No changes»; SSH con `/var/log/user-data.done`; puerto 5432 cerrado; SSH desde otra IP falla.
3. **Integración con feat-009:** dev-b consume `EC2_HOST`/`EC2_USER`/`EC2_SSH_KEY`; si el apply se revierte, esos secrets quedan inválidos y el pipeline de despliegue falla de forma controlada (sin recursos en la cuenta).

## Open Questions

Ninguna: la región, el tipo de instancia, los puertos y los outputs están fijados por el spec y por `docs/DEPLOYMENT.md`.
