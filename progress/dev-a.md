# Progreso — dev-a (Autenticación y Autorización + Terraform)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-21 03:05
**Feature activa:** feat-010 release (compartida). CI/CD y despliegue automático ya funcionando.
**Rama:** `develop` (main desplegado con `v1.0.1`)

## What's Done (hecho)
- feat-003, feat-004 y feat-005 integrados y archivados en `develop`:
  - Backend: `UserRepository.list_users/update`, `UserUpdate`/`PaginatedUsersResponse`, `user_service` con
    excepciones de dominio (404/409), `GET /api/users?q=&page=&size=` y `PATCH /api/users/{id}` solo admin.
  - Reglas: rol inválido 422 (Pydantic), usuario inexistente 404, BR-7 con los dos mensajes exactos,
    desactivar/reactivar con BR-6 (403 "La cuenta está desactivada").
  - Frontend: `features/users/user.service.ts` y página `/users` con tabla, búsqueda, paginación,
    selector de rol ("Rol actualizado") e interruptor de estado con reversión ante 409.
  - **Bug corregido**: el `<select>` con `[value]` mostraba "Lector" en cualquier fila recién renderizada
    (el binding se aplicaba antes de los `@for`). Ahora cada `<option>` usa `[selected]`.
- feat-006:
  - [x] Planificación OpenSpec: `design.md` y `tasks.md` creados con `/opsx-ff` (proposal y specs ya existían; 4/4 artefactos).
  - [x] Código Terraform en `infra/terraform/`: `main.tf`, `variables.tf`, `outputs.tf`, `terraform.tfvars.example`.
  - [x] Sensores: `./scripts/check.sh` → CHECK OK (fmt, init -backend=false, validate; provider aws 6.69.1; `.terraform.lock.hcl` generado y no ignorado).
  - [x] `apply` ejecutado en sesión anterior: EC2 `i-01a0b287f6e44d807` (t3.micro, running, clave `app-1-key`),
    Elastic IP `184.197.133.138`, SG con 80 público y 22 restringido. State serial 6.
  - [x] Secrets de GitHub cargados: `EC2_IP` y `EC2_SSH_KEY` (2026-10-20).

## UI Evidence (Chromium headless, 2026-10-20 — feat-005)
| Escenario | Resultado observable |
|---|---|
| Admin abre `/users` | lista paginada (10 usuarios, "Página 1 de 1") |
| Buscar "luis" | filtra las filas que contienen Luis |
| Cambiar rol reader → librarian | aviso "Rol actualizado" y el selector queda en Bibliotecario |
| Desactivar usuario | aviso "Usuario desactivado" e interruptor apagado |
| Reactivar usuario | aviso "Usuario activado" e interruptor encendido |
| Admin intenta desactivarse | 409 "No puedes desactivar tu propia cuenta"; el interruptor vuelve a activo |
| Limpiar búsqueda | vuelve al listado completo |
| Selector en fila admin | muestra "Administrador" correctamente tras el fix |

## CI/CD y despliegue (2026-10-21)
- `ci.yml` corre en **cada push a `develop` y `main`**: `check.sh --full` + cobertura backend y frontend con
  umbral del 80 % (Karma 109 tests, 99,7 % statements; pytest 93,8 %) y publica los artefactos
  `coverage-backend` y `coverage-frontend`.
- `deploy.yml` se dispara con **tags `v*`**; el job `guard` exige que el tag esté en `main`.
- Acceso sin claves de AWS: **OIDC** con el rol `library-g2-github-deploy` (Terraform `github_oidc.tf`), que solo
  puede `Authorize/RevokeSecurityGroupIngress` sobre el SG. El workflow abre el 22 solo a la IP del runner y lo
  cierra con `if: always()`.
- Variables del repo: `AWS_DEPLOY_ROLE_ARN`, `AWS_SECURITY_GROUP_ID`, `AWS_REGION`; secrets `EC2_HOST`,
  `EC2_USER`, `EC2_SSH_KEY` (+ `EC2_IP` de respaldo).
- **v1.0.0**: primera versión, desplegada a mano (el deploy automático falló por el SG y luego por el `sub` OIDC).
- **v1.0.1**: primer despliegue **automático** correcto — run `39534507828` (intento 2) en verde: guard, CI
  (sensores + 2 coberturas), build a GHCR y deploy a la EC2. Smoke: `GET /api/health` ok, `GET /` 200.
  El SG quedó limpio (80 a 0.0.0.0/0, 22 solo desde `38.226.159.83/32`).

## What's In Progress (en curso)
- [ ] feat-006: tareas 6.1, 6.3, 6.4 y 7.1 pendientes de cerrar con evidencia.
  - [x] `develop` integrado en la rama (merge 33f7939; conflicto resuelto solo en este archivo).
  - [x] `terraform.tfvars` restaurado con los valores reales (`key_name = "app-1-key"`, `admin_cidr = "38.226.159.83/32"`).
  - [x] `tfplan` regenerado: **0 to add, 1 to change, 0 to destroy** (solo la regla 22 del SG; la instancia no se toca).
  - [x] `terraform apply tfplan` → **0 added, 1 changed, 0 destroyed** (solo la regla 22 del SG, ya con la IP actual).
  - [x] Verificación por SSH: `/var/log/user-data.done` = `2026-10-20T21:22:05+00:00`, `docker compose version`
    2.40.3, `~/app/.env` presente (260 B, 600).
  - [x] `terraform plan -detailed-exitcode` → **"No changes"** (exit 0).
  - [x] Puertos: 22 abierto solo desde `38.226.159.83/32`, 5432 cerrado, 80 acepta conexión pero sin respuesta
    (la app aún no está desplegada).
  - [x] Secrets cargados: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (y `EC2_IP` como respaldo) — verificado con `gh secret list`.
  - [x] Escenarios del spec verificados (7.1): plan «No changes», SG solo con 22 desde `38.226.159.83/32` y
    sin regla 5432, desde la EIP de la propia instancia (otra IP) el 22 no conecta, 5432 rechaza conexiones,
    el 80 llega por el SG pero aún no hay servicio desplegado.
  - [x] Tareas 6.1, 6.3, 6.4 y 7.1 marcadas en `tasks.md`; cambio archivado en
    `openspec/changes/archive/2026-10-20-provision-aws-infrastructure` y spec principal creada en
    `openspec/specs/infrastructure/spec.md`.
  - **Clave SSH (decisión pendiente):** el par `app-1-key` de AWS no tiene `.pem` en ninguna máquina
    (el `~/.ssh/app-1-key.pem` corresponde al par `key_rsa`). Se añadió su clave pública a
    `~ubuntu/.ssh/authorized_keys` para poder entrar; hay que decidir si se recrea la instancia con `key_rsa`
    o se deja así.

## Evidence of Completion (evidencia)
- [x] `cd backend && uv run pytest -q` → **88 passed**
- [x] `cd backend && uv run ruff check . && uv run ruff format --check .` → limpio
- [x] `cd frontend && npx ng build` → OK
- [x] `./scripts/check.sh` → **CHECK OK**
- [x] `./scripts/check.sh --full` → **CHECK OK** + **SMOKE OK** (primer intento con timeout de ghcr.io; el reintento pasó)
- [x] `openspec validate add-user-administration` → válido
- [x] `./scripts/check.sh` (feat-006, rama antes del sync) → **CHECK OK** (terraform fmt, init -backend=false, validate)
- [x] `aws ec2 describe-instances i-01a0b287f6e44d807` → `running 184.197.133.138 app-1-key`
- [x] `terraform output` → `public_ip = 184.197.133.138`, `ssh_command = ssh -i ~/.ssh/app-1-key.pem ubuntu@184.197.133.138`
- [x] `terraform fmt -check -recursive && terraform init && terraform validate` → OK
- [x] `terraform plan -out tfplan` → **0 to add, 1 to change, 0 to destroy** (SG: 22 pasa de 190.43.149.172/32 a 38.226.159.83/32)
- [x] `terraform apply tfplan` → **Apply complete! Resources: 0 added, 1 changed, 0 destroyed**
- [x] `ssh -i ~/.ssh/app-1-key.pem ubuntu@184.197.133.138` → user-data OK, Docker Compose 2.40.3, swap 2 GB
- [x] `nc` a 5432 → cerrado; `curl http://184.197.133.138` → sin respuesta (pendiente del deploy)
- [x] `./scripts/check.sh --full` (2026-10-21) → **CHECK OK** + **SMOKE OK** (`GET / -> 200 (SPA)`, fallback de rutas 200).
  Requirió liberar los puertos 80 y 5432 ocupados por `infra-frontend-1`/`app_fastapi`/`app_postgres` de otros
  proyectos locales; se volvieron a levantar al terminar.
- [x] Pull Request #1 `feature/feat-006-provision-aws-infrastructure` → `develop` (merge rehecho con el cierre del cambio)

## Archived (archivado)
- `provision-aws-infrastructure` movido a `openspec/changes/archive/2026-10-20-provision-aws-infrastructure`.
  Spec principal creada: `openspec/specs/infrastructure/spec.md` (5 requisitos, 11 escenarios). 15/15 tareas.
- `add-user-administration` movido a `openspec/changes/archive/2026-10-20-add-user-administration`.
- Spec principal creada y validada: `openspec/specs/user-administration/spec.md` (5 requisitos, 11 escenarios).
- feat-005 marcada como `done` en `feature_list.json`.

## What's Next (qué sigue)
1. feat-010 (release): `main`, CI en verde, `gh workflow run deploy.yml` y demo con los dos desarrolladores.
   El escenario "Acceso web" del spec de infraestructura se cierra con ese primer despliegue.

## Blockers / Risks (bloqueos y riesgos)
- `docker compose --build` depende de `ghcr.io/astral-sh/uv:latest`; el primer intento de `--full` puede fallar
  por timeout de red. Reintentar antes de tocar el Dockerfile (archivo de contrato).
- Un admin puede desactivar a otro admin y dejar el sistema sin admins: la spec solo protege la cuenta propia.
- **`terraform.tfvars` se había sobrescrito con la plantilla** (`library-g2` / `203.0.113.10/32`): un `plan` así
  proponía `1 to add, 2 to change, 1 to destroy` (reemplazo de la instancia y SSH cortado).
- **La IP pública de dev-a cambió** (`38.226.159.83`); el SG solo permite `190.43.149.172/32`, por eso el SSH
  daba *Connection timed out*. Hay que actualizar `admin_cidr` en cada red nueva.
- El `terraform.tfstate` vive solo en esta máquina (ignorado por git): si se pierde, la EC2 y la EIP quedan
  huérfanas. Sin backend remoto por ahora (fuera del alcance de feat-006).
- `http://184.197.133.138` aún no responde: el workflow de deploy está en `workflow_dispatch` y la app no está
  desplegada, así que el escenario "Acceso web" del spec se cierra con feat-010.
- `ci.yml` y `deploy.yml` siguen en solo `workflow_dispatch`: no hay CI automático en los Pull Requests.

## Notes for Next Session (notas para la próxima sesión)
- No hacer commit sin confirmación del usuario (regla git-discipline).
- No ejecutar `terraform apply` sin confirmación explícita; nunca `destroy` ni comandos `state`.
- No quedan archivos compartidos tocados por feat-003/004/005; `app.routes.ts` ya traía el guard admin.
