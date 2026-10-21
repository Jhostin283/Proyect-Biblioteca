# Progreso — dev-a (Autenticación y Autorización + Terraform)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-20 20:42
**Feature activa:** feat-006 `provision-aws-infrastructure` (última que queda de dev-a)
**Rama:** feature/feat-006-provision-aws-infrastructure (integrado `origin/develop` con feat-001…005, 007, 008 y 009)

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

## What's In Progress (en curso)
- [ ] feat-006: tareas 6.1, 6.3, 6.4 y 7.1 pendientes de cerrar con evidencia.
  - [x] `develop` integrado en la rama (merge 33f7939; conflicto resuelto solo en este archivo).
  - [x] `terraform.tfvars` restaurado con los valores reales (`key_name = "app-1-key"`, `admin_cidr = "38.226.159.83/32"`).
  - [x] `tfplan` regenerado: **0 to add, 1 to change, 0 to destroy** (solo la regla 22 del SG; la instancia no se toca).
  - [ ] `terraform apply tfplan` → pendiente de confirmación del usuario.
  - [ ] `EC2_USER`, verificación por SSH y escenarios del spec.

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

## Archived (archivado)
- `add-user-administration` movido a `openspec/changes/archive/2026-10-20-add-user-administration`.
- Spec principal creada y validada: `openspec/specs/user-administration/spec.md` (5 requisitos, 11 escenarios).
- feat-005 marcada como `done` en `feature_list.json`.

## What's Next (qué sigue)
1. Cerrar feat-006: reconciliar `terraform.tfvars`/SG, verificar arranque por SSH, cargar `EC2_USER`,
   registrar 6.1/6.3/6.4/7.1, `/opsx-verify` y PR a `develop`; después `/opsx-archive`.
2. feat-010 (release): `main`, CI en verde, despliegue en la EC2 y demo con los dos desarrolladores.

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

## Notes for Next Session (notas para la próxima sesión)
- No hacer commit sin confirmación del usuario (regla git-discipline).
- No ejecutar `terraform apply` sin confirmación explícita; nunca `destroy` ni comandos `state`.
- No quedan archivos compartidos tocados por feat-003/004/005; `app.routes.ts` ya traía el guard admin.
