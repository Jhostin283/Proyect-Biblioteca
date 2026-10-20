# Tasks

## 1. Variables y plantilla de tfvars

- [x] 1.1 Crear `infra/terraform/variables.tf` con `region` (default `us-east-1`), `key_name` (sin default, validación de no vacío) y `admin_cidr` (sin default, validación de IPv4 `/32` con mensaje que apunte a `curl -s https://checkip.amazonaws.com`) — verify: el archivo define las tres variables con sus `validation` y `terraform validate` las acepta
- [x] 1.2 Crear `infra/terraform/terraform.tfvars.example` con `region`, `key_name` y `admin_cidr` de ejemplo (comentarios en español, sin secretos reales) — verify: `cp terraform.tfvars.example terraform.tfvars` deja un archivo que `terraform validate` acepta

## 2. Provider, AMI y security group

- [x] 2.1 Crear `infra/terraform/main.tf` con el bloque `terraform` (`required_version >= 1.3.0`, provider `hashicorp/aws` `~> 6.0`), el `provider "aws"` con `region = var.region` y el data source `aws_ami` de Ubuntu 24.04 amd64 Canonical (`owners = ["099720109477"]`, `name_regex` gp3/server-24.04, `state = available`) — verify: `terraform -chdir=infra/terraform init -backend=false` resuelve el provider y `validate` no reporta errores en el data source
- [x] 2.2 Añadir en `main.tf` el `aws_security_group.app` (VPC por defecto): ingress 80/TCP desde `0.0.0.0/0`, 22/TCP desde `var.admin_cidr`, egress `-1` total, sin 5432, tags `Name`/`Project`/`ManagedBy` — verify: `terraform -chdir=infra/terraform validate` y en el archivo no existe ninguna regla con `from_port = 5432`

## 3. Instancia y Elastic IP

- [x] 3.1 Añadir en `main.tf` el `aws_instance.app`: t3.micro, AMI del data source, `key_name = var.key_name`, `user_data = file("${path.module}/user-data.sh")`, root block device gp3 de 16 GB cifrado, tags — verify: `terraform -chdir=infra/terraform validate` y el bloque referencia `user-data.sh` sin modificarlo
- [x] 3.2 Añadir en `main.tf` el `aws_eip.app` asociado a la instancia (misma VPC por defecto, tags) — verify: `terraform -chdir=infra/terraform validate` y el recurso no declara `instance` con IP efímera del recurso EC2 como única salida

## 4. Outputs

- [x] 4.1 Crear `infra/terraform/outputs.tf` con `public_ip` (IP de la EIP), `app_url` (`http://` + esa IP) y `ssh_command` (`ssh -i <pem> ubuntu@<ip>`, con la ruta del pem comentada o derivada) — verify: `terraform -chdir=infra/terraform validate` y los tres outputs tienen `description` en español

## 5. Sensores de infraestructura

- [x] 5.1 Ejecutar `./scripts/check.sh` y corregir hasta `CHECK OK` en los pasos de infra (fmt, init sin backend, validate; tflint si está instalado) — verify: `./scripts/check.sh` termina con `CHECK OK` (o falla solo en pasos de backend/frontend aún inexistentes de feat-001)
- [x] 5.2 Confirmar que `terraform -chdir=infra/terraform init -backend=false` genera `.terraform.lock.hcl` y que `.gitignore` no lo excluye (se commitea junto con los `.tf`) — verify: el archivo `infra/terraform/.terraform.lock.hcl` existe y `git check-ignore -v infra/terraform/.terraform.lock.hcl` no lo marca como ignorado

## 6. Despliegue real (lo ejecuta el usuario de dev-a, no el agente)

- [ ] 6.1 Copiar `terraform.tfvars.example` a `terraform.tfvars` y completar `key_name` (par existente en la región) y `admin_cidr` (`<tu-ip-publica>/32`) — verify: `terraform -chdir=infra/terraform plan` no falla por variables faltantes
- [x] 6.2 Ejecutar `terraform -chdir=infra/terraform init` (con credenciales) y `terraform plan -out tfplan`; revisar que propone exactamente 1 instance, 1 security group y 1 eip, sin destrucciones — verify: el resumen del plan dice `3 to add, 0 to change, 0 to destroy`
- [ ] 6.3 Ejecutar `terraform -chdir=infra/terraform apply tfplan` y esperar 2–3 minutos de user-data — verify: `terraform output -raw public_ip` devuelve una IPv4 y `ssh -i <pem> ubuntu@<ip> 'cat /var/log/user-data.done'` existe con `docker compose version` operativo
- [ ] 6.4 Cargar los secrets del repositorio: `EC2_HOST` (output `public_ip`), `EC2_USER` (`ubuntu`) y `EC2_SSH_KEY` (contenido del `.pem`) — verify: `gh secret list` muestra los tres secrets con fecha de actualización de hoy

## 7. Verificación de integración

- [ ] 7.1 Verificar los escenarios observables del spec: `terraform plan` posterior informa «No changes»; desde otra IP el SSH no conecta; `<public_ip>:5432` no acepta conexiones; `http://<public_ip>` responde (aún sin app, conexión aceptada en el puerto 80) — verify: cada comprobación registrada en `progress/dev-a.md` con el resultado
- [x] 7.2 Ejecutar `./scripts/check.sh` y registrar el resultado en `feature_list.json` (`evidence` de feat-006); si `develop` ya tiene feat-001, ejecutar también `./scripts/check.sh --full` — verify: la entrada de feat-006 en `feature_list.json` contiene el comando y su salida resumida (`CHECK OK`)
