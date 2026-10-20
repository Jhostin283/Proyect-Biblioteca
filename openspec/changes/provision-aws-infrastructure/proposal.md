# Proposal

## Why
feat-006 de `docs/PRODUCT.md` (dueño: **dev-a**). Cubre RNF-02 (solo los puertos 80 y 22 abiertos) y RNF-03
(infraestructura reproducible con Terraform). La EC2 que crea este cambio es donde despliega el pipeline de dev-b (feat-009).

## What Changes
- Código Terraform en `infra/terraform/`: AMI de Ubuntu 24.04, security group, EC2 t3.micro, Elastic IP y outputs.
- La instancia arranca con el `user-data.sh` existente (swap, Docker y `~/app/.env` con secretos aleatorios).
- `terraform.tfvars.example` con las variables que completa dev-a (`key_name`, `admin_cidr`).
- dev-a ejecuta `plan` y `apply` y carga los secrets `EC2_HOST`, `EC2_USER` y `EC2_SSH_KEY` en GitHub.

### Fuera de alcance
- Backend remoto de estado (S3), dominio propio, HTTPS, balanceador y bases de datos administradas (RDS).

## Capabilities

### New Capabilities
- `infrastructure`: servidor de la aplicación en AWS creado con Terraform.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-a: `infra/terraform/*.tf` y `infra/terraform/terraform.tfvars.example`.
- `user-data.sh` es un archivo de contrato: no se modifica.
- Costo: una t3.micro, 16 GB gp3 y una Elastic IP mientras existan; se eliminan con `terraform destroy`.
