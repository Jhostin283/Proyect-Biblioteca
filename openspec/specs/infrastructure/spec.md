# infrastructure Specification

## Purpose
Disponer de un servidor en AWS, creado y destruido con Terraform, donde se despliega la aplicación.

## Requirements

### Requirement: Servidor de la aplicación
La infraestructura SHALL crear una instancia EC2 t3.micro con Ubuntu 24.04 (amd64) y un disco gp3 de 16 GB en la región de la variable `region`, por defecto `us-east-1` (RNF-03).

#### Scenario: Plan inicial
- **GIVEN** credenciales de AWS válidas y `terraform.tfvars` con `key_name` y `admin_cidr`
- **WHEN** dev-a ejecuta `terraform plan`
- **THEN** el plan crea exactamente una instancia, un security group y una Elastic IP, sin destruir nada

#### Scenario: Configuración inválida
- **WHEN** se ejecuta `./scripts/check.sh` con un archivo `.tf` mal formateado o con un argumento inexistente
- **THEN** el sensor falla en `terraform fmt` o en `terraform validate` antes de llegar a AWS

### Requirement: Red mínima expuesta
El security group SHALL permitir entrada solo por el puerto 80 desde cualquier origen y por el puerto 22 desde `admin_cidr`, y MUST NOT exponer el puerto 5432 de PostgreSQL (RNF-02).

#### Scenario: Acceso web
- **WHEN** cualquier persona abre `http://<public_ip>` después del despliegue
- **THEN** recibe la aplicación

#### Scenario: SSH desde otra IP
- **WHEN** alguien intenta `ssh` desde una IP distinta de `admin_cidr`
- **THEN** la conexión no se establece

#### Scenario: Base de datos cerrada
- **WHEN** alguien intenta conectarse a `<public_ip>:5432`
- **THEN** la conexión no se establece

### Requirement: Arranque automático del servidor
La instancia SHALL ejecutar `user-data.sh` en su primer arranque, dejando Docker instalado, 2 GB de swap y `~/app/.env` con secretos aleatorios que nunca pasan por el estado de Terraform (RNF-01, RNF-06).

#### Scenario: Servidor listo
- **GIVEN** que pasaron 3 minutos desde el `terraform apply`
- **WHEN** dev-a ejecuta `ssh ubuntu@<public_ip> 'cat /var/log/user-data.done'`
- **THEN** el archivo existe y `docker compose version` funciona en el servidor

#### Scenario: Secretos fuera del estado
- **WHEN** se busca `JWT_SECRET` o `ADMIN_PASSWORD` en `terraform.tfstate`
- **THEN** no aparecen

### Requirement: Salidas para el despliegue
La infraestructura SHALL exponer los outputs `public_ip`, `app_url` y `ssh_command`, y la IP MUST mantenerse al detener y encender la instancia (Elastic IP) (RNF-03).

#### Scenario: Outputs después del apply
- **WHEN** dev-a ejecuta `terraform output -raw public_ip`
- **THEN** obtiene la IP que se carga como secret `EC2_HOST` en GitHub

#### Scenario: Reinicio de la instancia
- **GIVEN** la instancia detenida y vuelta a encender
- **WHEN** se consulta `terraform output -raw public_ip`
- **THEN** la IP es la misma que antes y `EC2_HOST` sigue siendo válido

### Requirement: Infraestructura reproducible
La infraestructura SHALL poder recrearse desde cero y destruirse por completo solo con comandos de Terraform (RNF-03).

#### Scenario: Plan sin cambios
- **GIVEN** la infraestructura ya creada
- **WHEN** dev-a ejecuta `terraform plan` otra vez
- **THEN** el plan informa "No changes"

#### Scenario: Destrucción completa
- **WHEN** dev-a ejecuta `terraform destroy` al terminar el proyecto
- **THEN** se eliminan la instancia, el security group y la Elastic IP
