# Despliegue (Terraform → EC2 · GitHub Actions → GHCR → EC2)

## Topología
- EC2 t3.micro, Ubuntu 24.04, 1 GB de RAM + 2 GB de swap, Docker + Compose v2. La crea Terraform (dev-a).
- Security group de entrada: 22 (solo la IP del admin) y 80 (0.0.0.0/0).
- El servidor solo tiene `~/app/docker-compose.prod.yml` y `~/app/.env`. No hay código fuente.

```text
Navegador ──HTTP:80──► frontend (Nginx) ──/api──► backend (FastAPI :8000) ──► db (PostgreSQL 16)
```

## Pipeline

### Integración continua (`.github/workflows/ci.yml`)
**No se ejecuta con los push.** Solo corre cuando lo invoca `deploy.yml` (al publicar un tag de versión sobre
`main`) o a mano con `workflow_dispatch`:

| Job | Qué hace |
|---|---|
| `check` | `./scripts/check.sh --full` (ruff, pytest, Karma, `ng build`, terraform y smoke con Docker) |
| `coverage-backend` | `pytest --cov --cov-fail-under=80` → publica el artefacto `coverage-backend` |
| `coverage-frontend` | `npm run test:ci` con umbral del 80 % en Karma → publica el artefacto `coverage-frontend` |

Los dos artefactos (`coverage.xml`/`htmlcov` y `frontend/coverage/`) se generan en **cada ejecución** del
workflow y se descargan desde la pestaña *Actions* del run.

### Despliegue (`deploy.yml`)
Producción se despliega **solo al publicar un tag de versión sobre `main`** (`v1.0.1`, `v1.1.0`…); el tag tiene
que apuntar a un commit de `main` y el job `guard` lo verifica. Un push a `develop` o a `main` no dispara nada:
primero se integra, después se etiqueta. `workflow_dispatch` queda para una emergencia manual.

1. `guard`: comprueba que el tag está contenido en `main`.
2. `check`: reutiliza `ci.yml` completo (sensores + las dos coberturas); si la cobertura baja del 80 %, no hay despliegue.
3. `build`: construye `backend` y `frontend` y los sube a `ghcr.io/<owner>/<repo>-backend|frontend` con tags `latest` y `<versión>`.
4. `deploy`: pide un token **OIDC** a GitHub y asume el rol IAM `library-g2-github-deploy`, que solo puede tocar
   las reglas del security group. Abre el 22 **solo a la IP del runner**, copia `docker-compose.prod.yml` por SCP,
   ejecuta `docker compose pull && up -d` y cierra la regla en un paso `if: always()`.
5. `smoke`: `scripts/smoke.sh http://<EC2_HOST>` desde el runner.

El 22 nunca se abre a Internet: la regla temporal se crea al empezar el job y se revoca al terminar (si ya existía,
por ejemplo porque el runner coincide con `admin_cidr`, no se revoca).

### Publicar la primera versión
```bash
# 1. llevar develop a main por Pull Request (CI en verde)
# 2. etiquetar la versión
git checkout main && git pull
git tag -a v1.0.0 -m "Primera versión: gestión de libros"
git push origin v1.0.0
```
Al subir el tag arranca `deploy.yml` y, si sensores y coberturas pasan, la aplicación queda en `http://<EC2_HOST>`.

## Secrets del repositorio (Settings → Secrets and variables → Actions)
Los carga dev-a, que es quien crea la EC2.

| Secret | Valor |
|---|---|
| `EC2_IP` o `EC2_HOST` | IP pública de la instancia (`terraform output -raw public_ip`) |
| `EC2_USER` (opcional) | `ubuntu` (por defecto si no se define) |
| `EC2_SSH_KEY` | Contenido completo de la llave `.pem` |

### Variables (Settings → Secrets and variables → Actions → Variables)
Las crea dev-a después del `terraform apply` (salidas `deploy_role_arn` y `security_group_id`):

| Variable | Valor |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw deploy_role_arn` |
| `AWS_SECURITY_GROUP_ID` | `terraform output -raw security_group_id` |
| `AWS_REGION` (opcional) | `us-east-1` |

```bash
gh variable set AWS_DEPLOY_ROLE_ARN -b "$(terraform -chdir=infra/terraform output -raw deploy_role_arn)"
gh variable set AWS_SECURITY_GROUP_ID -b "$(terraform -chdir=infra/terraform output -raw security_group_id)"
gh variable set AWS_REGION -b "us-east-1"
```

```bash
gh secret set EC2_IP --body "$(terraform -chdir=infra/terraform output -raw public_ip)"
gh secret set EC2_SSH_KEY < ~/keys/<llave>.pem
```

## Crear el servidor

### Opción A (por defecto): Terraform (`infra/terraform/`, solo dev-a)
El agente escribe el código Terraform con un cambio de OpenSpec (skill `terraform-aws`). El usuario lo ejecuta:
```bash
aws configure                                          # una vez; las credenciales nunca van al repo
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars           # key_name = key pair existente, admin_cidr = "<tu-ip>/32"
terraform init
terraform plan -out tfplan                             # revisa: 1 instancia, 1 security group, 1 Elastic IP
terraform apply tfplan
ssh -i ~/keys/<llave>.pem ubuntu@"$(terraform output -raw public_ip)" 'cat /var/log/user-data.done'
```
`user-data.sh` crea el swap, instala Docker y escribe `~/app/.env` con la contraseña de PostgreSQL, el `JWT_SECRET` y la
contraseña del admin inicial, todos aleatorios, en el primer arranque (espera 2 a 3 minutos después del apply).
Esos secretos nunca pasan por el estado de Terraform. Para ver la contraseña del admin: `ssh ... 'cat ~/app/.env'`.

Para borrar todo cuando ya no se necesite: `terraform destroy` (solo el usuario de dev-a; es irreversible).

### Opción B (respaldo): EC2 manual
Si Terraform no está disponible, crea la instancia en la consola (misma configuración) y ejecuta:
```bash
chmod 400 ~/keys/<llave>.pem
scp -i ~/keys/<llave>.pem scripts/setup-ec2.sh ubuntu@<IP>:~
ssh -i ~/keys/<llave>.pem ubuntu@<IP> 'bash setup-ec2.sh'
```

## Límites de memoria (`docker-compose.prod.yml`)
| Servicio | Límite |
|---|---|
| db | 320 MB |
| backend | 256 MB |
| frontend (nginx) | 64 MB |

## Diagnóstico en la EC2
```bash
cd ~/app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
free -h
docker stats --no-stream
```
- 502 en `/api`: el backend no arrancó → revisa sus logs (migración fallida, `DATABASE_URL`).
- `pull access denied`: falló el login en GHCR → revisa el permiso `packages: write` del workflow.
- La instancia no responde: falta el puerto 80 en el security group.
- Nunca compiles Angular en la instancia: 1 GB de RAM no alcanza. Las imágenes se construyen en GitHub Actions.
