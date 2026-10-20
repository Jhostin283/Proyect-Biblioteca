# Despliegue (Terraform → EC2 · GitHub Actions → GHCR → EC2)

## Topología
- EC2 t3.micro, Ubuntu 24.04, 1 GB de RAM + 2 GB de swap, Docker + Compose v2. La crea Terraform (dev-a).
- Security group de entrada: 22 (solo la IP del admin) y 80 (0.0.0.0/0).
- El servidor solo tiene `~/app/docker-compose.prod.yml` y `~/app/.env`. No hay código fuente.

```text
Navegador ──HTTP:80──► frontend (Nginx) ──/api──► backend (FastAPI :8000) ──► db (PostgreSQL 16)
```

## Pipeline (`.github/workflows/deploy.yml`, en cada push a `main`)
Los workflows son de dev-b (feat-009). Con dos máquinas, a `main` solo se llega por Pull Request: cada merge despliega.
1. `check`: ejecuta `./scripts/check.sh --full` (los mismos sensores que en local, reutilizados de `ci.yml`).
2. `build`: construye `backend` y `frontend` y los sube a `ghcr.io/<owner>/<repo>-backend|frontend` con tags `latest` y `<sha>`.
3. `deploy`: copia `docker-compose.prod.yml` por SCP, inicia sesión en GHCR desde el servidor y ejecuta `docker compose pull && up -d`.
4. `smoke`: `scripts/smoke.sh http://<EC2_HOST>` desde el runner.

Cada Pull Request ejecuta `ci.yml` (solo los sensores): es el control antes de integrar.

## Secrets del repositorio (Settings → Secrets and variables → Actions)
Los carga dev-a, que es quien crea la EC2.

| Secret | Valor |
|---|---|
| `EC2_HOST` | IP pública de la instancia (`terraform output -raw public_ip`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contenido completo de la llave `.pem` |

```bash
gh secret set EC2_HOST --body "$(terraform -chdir=infra/terraform output -raw public_ip)"
gh secret set EC2_USER --body "ubuntu"
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
