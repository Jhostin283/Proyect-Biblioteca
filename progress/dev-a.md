# Progreso — dev-a (Autenticación y Autorización + Terraform)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-20 19:10
**Feature activa:** ninguna (feat-004 archivada; siguiente: feat-005 add-user-administration)
**Rama:** feature/feat-004-add-role-authorization (commit y push en curso)

## What's Done (hecho)
- feat-003 (`add-user-authentication`) integrado y archivado; `get_current_user` y `require_roles` ya estaban implementados.
- feat-004 implementado:
  - Backend: `GET /api/users` temporal protegido con `require_roles(Role.admin)` en `app/api/routes/users.py`
    (marcador vacío que feat-005 sustituye); `tests/test_authorization.py` con 18 tests de 401/403/200 y BR-6.
  - Frontend: `AuthService` con `UserRole`, `isAuthenticated()` y `restoreSession()`; `SessionNoticeService`;
    `authGuard`/`roleGuard` reales; `authInterceptor` con 401 global y `SKIP_SESSION_REDIRECT`;
    `provideAppInitializer` en `app.config.ts`; guards en `app.routes.ts`; barra de navegación por sesión/rol,
    banner de avisos y "Cerrar sesión" en `app.component.ts`; `/profile` delega el 401 al interceptor.
- **Bug corregido durante 4.1**: `isAuthenticated` con `getToken() && currentUser()` quedaba cacheado en `false`
  porque el cortocircuito no leía el signal cuando no había token. Ahora se lee `currentUser()` primero.
  Además, `ProfileComponent` hacía `logout()` en su propio 401 y borraba el aviso del interceptor; ahora lo delega.

## UI Evidence (comprobación en Chromium headless, 2026-10-20)
| Escenario | Resultado observable |
|---|---|
| `/books` sin sesión | redirige a `/login` |
| Login admin | `/books`, barra con Usuarios y Cerrar sesión, token guardado |
| Recarga con sesión | sigue en `/books` con sesión restaurada |
| Reader en `/users` | redirige a `/books` con "No tienes permiso para esta acción" |
| Reader en `/books/new` | redirige a `/books` con "No tienes permiso para esta acción" |
| Recarga reader | sigue autenticado; barra sin "Usuarios" |
| Cerrar sesión | `/login` y token eliminado |
| Botón "atrás" tras logout (`/books`) | redirige a `/login` |
| Token alterado durante el uso (`/profile`) | `/login` con "Tu sesión expiró" y token eliminado |
| API en vivo | admin `GET /api/users` 200; reader 403; `GET /api/books` sin token 401 |

## Evidence of Completion (evidencia)
- [x] `cd backend && uv run pytest -q` → **77 passed**
- [x] `cd backend && uv run ruff check . && uv run ruff format --check .` → limpio
- [x] `cd frontend && npx ng build` → OK
- [x] `./scripts/check.sh` → **CHECK OK**
- [x] `./scripts/check.sh --full` → **CHECK OK** + **SMOKE OK** (health, SPA, fallback Angular)
- [x] `openspec validate add-role-authorization` → válido

## What's Next (qué sigue)
1. Confirmar el commit y abrir el PR `feature/feat-004-add-role-authorization` → `develop`
   (pedir a dev-b revisión de `app.routes.ts` y `app.config.ts`, archivos compartidos).
2. Siguiente feature de dev-a: feat-005 add-user-administration (sustituye el marcador de `GET /api/users`).

## Archived (archivado)
- `add-role-authorization` movido a `openspec/changes/archive/2026-10-20-add-role-authorization`.
- Spec principal creada y validada: `openspec/specs/authorization/spec.md` (5 requisitos, 12 escenarios).
- feat-004 marcada como `done` en `feature_list.json`.

## Blockers / Risks (bloqueos y riesgos)
- `docker compose --build` depende de `ghcr.io/astral-sh/uv:latest`: el primer intento de `--full` falló por timeout
  de red; el reintento pasó. Si vuelve a fallar, reintentar antes de tocar el Dockerfile (archivo de contrato).
- `GET /api/users` devuelve un marcador vacío hasta feat-005; no confundir con el listado real.

## Notes for Next Session (notas para la próxima sesión)
- No hacer commit sin confirmación del usuario (regla git-discipline).
- `app.routes.ts` y `app.config.ts` son compartidos: el PR los marca para revisión de dev-b.
