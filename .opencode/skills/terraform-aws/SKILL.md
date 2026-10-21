---
name: terraform-aws
description: Convenciones para escribir el código Terraform de infra/terraform/ que crea la EC2 t3.micro en AWS (security group, AMI Ubuntu 24.04, user-data, outputs). Úsala al planificar o implementar un cambio de OpenSpec que toque infraestructura. Solo para dev-a.
---

# Terraform en AWS (host EC2 t3.micro)

El estado de Terraform vive **solo en dev-a**. En dev-b, esta skill solo sirve para revisar código:
nunca ejecutes `init`, `plan`, `apply` ni `destroy` allí.

## Estructura (`infra/terraform/`)
| Archivo | Contenido |
|---|---|
| `versions.tf` | `terraform { required_version = ">= 1.6" }` y `required_providers` con `hashicorp/aws` fijado a una versión mayor |
| `providers.tf` | `provider "aws" { region = var.region }` más `default_tags` (`Project = "library-g2"`, `ManagedBy = "terraform"`) |
| `variables.tf` | `region` (por defecto `us-east-1`), `instance_type` (por defecto `t3.micro`), `key_name` (key pair existente), `admin_cidr` (tu IP como `x.x.x.x/32`), `project` |
| `main.tf` | Data source de la AMI, security group, instancia EC2 y Elastic IP |
| `outputs.tf` | `public_ip`, `app_url`, `ssh_command` |
| `user-data.sh` | Archivo de contrato ya provisto: swap + Docker + `~/app/.env`. No lo reescribas |
| `terraform.tfvars.example` | Valores de ejemplo (se sube al repo). El `terraform.tfvars` real NO se sube |

Las descripciones de variables y outputs (`description = "..."`) y los comentarios van en español.

## Recursos
- **AMI**: `data "aws_ami"` con `most_recent = true`, `owners = ["099720109477"]` (Canonical) y filtro
  `name = "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"` (t3 es x86_64, por eso amd64).
- **Security group**: entrada 22 solo desde `var.admin_cidr`, entrada 80 desde `0.0.0.0/0`, salida total.
  Nunca abras el 22 ni el 5432 al mundo. PostgreSQL nunca se expone.
- **Instancia**: `instance_type = var.instance_type`, `key_name = var.key_name`, el security group,
  `root_block_device { volume_type = "gp3", volume_size = 16 }`,
  `user_data = file("${path.module}/user-data.sh")`, `user_data_replace_on_change = true` y una etiqueta `Name`.
- **Elastic IP** (recomendada): `aws_eip` asociada a la instancia para que `EC2_HOST` no cambie al detener y encender.
  AWS cobra las IPv4 públicas por hora.

## Reglas
- Las credenciales vienen solo del entorno del usuario (`aws configure` / `AWS_PROFILE`). Nunca escribas claves en `.tf`,
  `.tfvars`, scripts ni documentos.
- El agente solo ejecuta `terraform fmt`, `terraform init -backend=false`, `terraform validate` y `terraform plan`.
  `terraform apply` requiere confirmación explícita del usuario; `terraform destroy` lo ejecuta solo el usuario.
- Estado local (`terraform.tfstate`, ignorado por git) en dev-a. Un backend remoto en S3 sería lo ideal
  para dos personas; necesita su propio ADR.
- Todo cambio de recursos pasa por un cambio de OpenSpec. Las tareas se verifican con `./scripts/check.sh`
  (fmt + validate); el `— verify:` de las tareas de apply es el `terraform output` que comprueba el usuario.

## Después del apply (pasos del usuario)
```bash
terraform -chdir=infra/terraform output -raw public_ip
gh secret set EC2_HOST --body "$(terraform -chdir=infra/terraform output -raw public_ip)"
ssh -i ~/keys/<llave>.pem ubuntu@<IP> 'cat /var/log/user-data.done'   # ¿terminó el user-data?
```
