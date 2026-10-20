# AGENTS.md

Sistema de Gestión de Libros (Grupo 2): FastAPI + Angular + PostgreSQL, Docker, Terraform y despliegue en AWS EC2.
Lo construyen **dos desarrolladores en dos máquinas** que comparten este harness: dev-a (Autenticación y Autorización + Terraform)
y dev-b (Gestión de Libros + GitHub Actions). Alcance y reparto: `docs/PRODUCT.md`.
Este archivo es un índice: los detalles viven en los archivos enlazados.

## Language (idioma)
- Responde al usuario siempre en **español**.
- **Español**: documentación, artefactos de OpenSpec (proposal, specs, design, tasks), ADRs, archivos de estado,
  comentarios del código, mensajes que imprimen los scripts y la app (logs, `echo`, `print`, `detail` de errores, textos de la UI)
  y la descripción de los commits.
- **Inglés**: nombres de archivos y carpetas, identificadores (variables, funciones, clases, tablas, columnas, rutas de la API),
  claves de JSON/YAML y el tipo del commit (`feat:`, `fix:`, ...).
- **Palabras clave obligatorias de OpenSpec en inglés**: `## ADDED Requirements`, `### Requirement:`, `#### Scenario:`,
  `SHALL`/`MUST` y `**GIVEN**`/`**WHEN**`/`**THEN**`. Ejemplo: "El sistema SHALL permitir registrar un libro."
  Con "DEBE" en lugar de SHALL, OpenSpec no reconoce el requisito.

## Startup Workflow (flujo de inicio)
Before writing code / antes de escribir código:
1. **Confirma el directorio** con `pwd`.
2. **Lee este archivo** completo.
3. **Ejecuta `./init.sh`**: revisa herramientas, estado y la verificación base. Si la base falla, arréglala antes de sumar alcance.
4. **Lee `feature_list.json`** (estado de las features, fuente de verdad), **`docs/PRODUCT.md`** (alcance y reparto)
   y **`progress/<owner>.md`** (última sesión de esta máquina; el dueño está en `.harness-owner`).
5. **Lee `session-handoff.md`** si la sesión anterior lo llenó.
6. **Revisa los commits recientes** con `git log --oneline -5` y los cambios activos con `openspec list`.

## Mapa del repositorio
| Ruta | Contenido |
|---|---|
| `docs/PRODUCT.md` | Alcance, modelo de datos, reglas de negocio, contrato de la API y reparto por máquina |
| `openspec/config.yaml` | Stack, arquitectura y reglas para los artefactos (`context`) |
| `openspec/specs/` | Comportamiento vigente del sistema (fuente de verdad de los requisitos) |
| `openspec/changes/` | Cambios en curso: proposal, specs, design, tasks |
| `adr/` | Decisiones de arquitectura (índice en `adr/README.md`) |
| `feature_list.json` | Backlog: `status` y `owner` (`shared`, `dev-a`, `dev-b`), una entrada por cambio de OpenSpec |
| `progress/<owner>.md` / `session-handoff.md` | Continuidad entre sesiones, un archivo de progreso por máquina |
| `backend/` | API FastAPI, punto de entrada `app.main:app` |
| `frontend/` | App Angular + `nginx.conf` (sirve la SPA y redirige `/api`) |
| `infra/terraform/` | Infraestructura AWS como código (EC2 t3.micro); ver la skill `terraform-aws` |
| `scripts/` | Sensores (`check.sh`, `smoke.sh`) y scripts de instalación |
| `docs/` | `PRODUCT.md`, `TESTING.md`, `DEPLOYMENT.md`, `EXAM-PLAYBOOK.md` |

## Working Rules (reglas de trabajo)
- **One feature at a time (una feature a la vez) por máquina**: toma una sola feature sin terminar cuyo `owner` sea
  esta máquina (o `shared`, si ambos están de acuerdo), respetando `dependencies`. Nunca trabajes en features de la otra máquina.
- **Stay in scope (no salgas del alcance)**: toca solo los archivos que exige la feature actual y su cambio de OpenSpec.
- **Verificación obligatoria**: nunca declares algo terminado sin correr los comandos de verificación.
- **Actualiza el estado**: mantén al día `feature_list.json` y tu `progress/<owner>.md`; los archivos valen más que el chat.
- **Deja el repo limpio (clean)**: la próxima sesión debe poder ejecutar `./init.sh` de inmediato.

## Trabajo en dos máquinas
- **Identidad**: `.harness-owner` (ignorado por git) contiene `dev-a` o `dev-b`. `./init.sh` no corre sin él.
- **Ramas**: una por cambio, `feat/<openspec-change>`. Nunca hagas commit directo a `main`: se integra por Pull Request
  con el CI en verde. Ejecuta `/sync` antes de empezar y antes de abrir un PR.
- **Dueños de archivos**: respeta la tabla de `docs/PRODUCT.md` sección 9. Los archivos compartidos (`app/main.py`,
  `app/models/__init__.py`, `alembic/versions/`, `tests/conftest.py`, `app.routes.ts`, `app.config.ts`, `docker-compose*.yml`,
  `.env.example`, `AGENTS.md`, `openspec/config.yaml`, `docs/PRODUCT.md`) solo cambian en features compartidas
  o en un PR que revisa el otro desarrollador.
- **Contrato primero**: las features de A y B empiezan solo cuando `feat-002` (contrato del dominio) está en `main`.
  Implementa contra `docs/PRODUCT.md` secciones 3 a 7; si el contrato debe cambiar, detente y avisa al usuario.
- **Interfaz entre módulos**: las rutas de libros usan `get_current_user` y `require_roles(...)` de `app/api/deps.py`
  (las implementa dev-a). Los tests de dev-b nunca generan tokens reales: usan la fixture `auth_as(role)`.
- **Estado**: actualiza solo tu `progress/<owner>.md` y solo tus entradas de `feature_list.json`.
- **Migraciones**: créalas solo después de `/sync`; si `uv run alembic heads` muestra dos heads, ejecuta
  `uv run alembic merge heads -m "merge heads"`.
- **Terraform**: el estado vive solo en dev-a; en dev-b nunca ejecutes terraform salvo `fmt` y `validate`.
- **GitHub Actions**: los workflows son de dev-b; los secrets de la EC2 los carga dev-a después del `terraform apply`.

## Flujo SDD (OpenSpec)
0. **Los proposal y specs ya existen** en `openspec/changes/<cambio>/` (escritos por el equipo a partir de `docs/PRODUCT.md`).
   No los reescribas ni crees cambios nuevos para esas features: completa `design.md` y `tasks.md` con `/opsx-ff <cambio>`
   (o `/opsx-continue <cambio>` de a uno). Si un spec te parece incorrecto, propone el ajuste con `/opsx-update` y espera confirmación.
1. **Planificación** (`/opsx-explore`, `/opsx-propose`, `/opsx-new`, `/opsx-continue`, `/opsx-ff`, `/opsx-update`):
   solo se escriben artefactos en `openspec/changes/` (y ADRs con `/adr`). Nunca se edita código de la app.
   Al crear un cambio, pon su feature en `in-progress` y llena `openspec_change`.
2. **Implementación**: solo dentro de `/opsx-apply`, con un `tasks.md` revisado.
3. **Cierre**: `/opsx-verify` sin problemas CRITICAL → `/opsx-archive` → feature en `done` con su evidencia.
- **Excepción**: correcciones triviales (lint, typo, test roto) del cambio activo durante `/opsx-apply`.
  Fuera de un cambio, solo si el usuario pide un "fix rápido", y se menciona en el commit.

## Verification Commands (comandos de verificación)
```bash
./init.sh                      # inicio: herramientas + estado + verificación base
./scripts/check.sh             # sensores: ruff, pytest, ng lint/test (si existen), ng build, terraform fmt/validate
./scripts/check.sh --full      # + docker compose up + smoke test con PostgreSQL real
./scripts/smoke.sh http://<host>   # smoke test contra un despliegue
```
Bucle rápido: `cd backend && uv run pytest -q` · `cd frontend && npx ng build`.

## Definition of Done (definición de terminado)
Una tarea o feature está terminada solo cuando se cumple TODO esto:
- **Comportamiento**: el escenario de OpenSpec está implementado y cubierto por un test.
- **Sensores**: `./scripts/check.sh` termina en `CHECK OK` (usa `--full` antes de integrar).
- **Evidence (evidencia)**: el comando y su resultado quedan en `feature_list.json` (`evidence`) o en tu `progress/<owner>.md`.
- **Seguimiento**: la casilla está en `[x]` en `tasks.md` y el repo sigue arrancando con `./init.sh`.

## Contrato técnico (reglas duras)
- Todas las rutas de la API van bajo `/api`; `GET /api/health` siempre existe y responde `{"status": "ok"}`.
- Configuración solo por variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD`); nunca subas secretos.
- Seguridad: contraseñas con hash argon2 (`pwdlib[argon2]`), tokens con `PyJWT` (HS256); nunca devuelvas `hashed_password`.
  Sin token o token inválido → 401; rol insuficiente → 403.
- Todo cambio de modelo lleva una migración de Alembic; nunca `create_all()` en producción.
- El frontend llama a la API con rutas relativas (`/api/...`), nunca `http://localhost:8000`.
- Dentro de Docker el host de la BD es `db`, no `localhost`.
- Archivos de contrato (`docker-compose*.yml`, `*/Dockerfile`, `frontend/nginx.conf`, `.github/workflows/*`, `scripts/*`,
  `init.sh`, `infra/terraform/user-data.sh`): no los modifiques salvo que la tarea lo exija, y explica por qué.
- La EC2 tiene 1 GB de RAM: ningún servicio nuevo (Redis, colas...) sin un cambio aprobado y un ADR.
- La infraestructura vive solo en `infra/terraform/`, cambia solo con cambios de OpenSpec (skill `terraform-aws`) y su dueña es dev-a.
- Terraform: puedes ejecutar `fmt`, `init -backend=false`, `validate` y `plan`. **Nunca** ejecutes `apply` sin confirmación
  explícita del usuario y **nunca** ejecutes `destroy` ni comandos `state` (los ejecuta el usuario).
- Las credenciales de AWS vienen solo del entorno del usuario (`aws configure`); nunca escribas claves, `terraform.tfvars`
  ni archivos de estado en el repositorio.

## Decisiones de arquitectura
- Antes de diseñar algo estructural, lee `adr/README.md` y los ADR aceptados relevantes.
- Un ADR aceptado nunca se edita: se reemplaza con `/adr-supersede`.
- Si detectas una decisión estructural nueva sin ADR, propone `/adr <título>`.

## Git
- Aplica la skill `git-discipline`. Conventional Commits con tipo en inglés y descripción en español
  (ej.: `feat(books): agrega el CRUD de libros`). Nunca hagas commit ni push sin confirmación del usuario.

## End of Session (fin de sesión)
Before ending (antes de terminar una sesión, o ejecuta `/handoff`):
1. Actualiza tu `progress/<owner>.md` con el estado actual, la evidencia y el siguiente paso.
2. Actualiza tus entradas de `feature_list.json` (estado y evidencia).
3. Registra riesgos o bloqueos pendientes (llena `session-handoff.md` en sesiones largas).
4. Propón un commit cuando el trabajo esté en un estado seguro y limpio.

## Escalamiento
- **Decisiones de arquitectura**: revisa `adr/` y `openspec/config.yaml`; si no está, pregunta al usuario.
- **Requisitos poco claros**: usa `/opsx-explore` o la skill `grill-me`; si no basta, pregunta al usuario.
- **Fallos repetidos** (5 intentos): detente, regístralo en tu `progress/<owner>.md` y pide revisión humana.
- **Conflictos de contrato o de dueños**: detente y pregunta; los dos desarrolladores deciden juntos.

## Lecciones aprendidas
- `backend/alembic/` es código generado y está excluido de ruff; nunca lo reformatees para pasar el lint.
- Angular CLI exige Node 24 LTS (o 22.22.3+). Si `ng` falla por la versión de Node, avísalo; no cambies de framework.
- En las specs usa SHALL/MUST en inglés dentro del texto en español; con "DEBE" OpenSpec no reconoce el requisito.
<!-- Agrega una línea por cada error que el agente repita. -->
