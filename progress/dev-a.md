# Progreso — dev-a (Autenticación y Autorización + Terraform)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-20 22:20
**Feature activa:** feat-003 add-user-authentication — IMPLEMENTACIÓN COMPLETA (tasks.md 21/21)
**Rama:** feature/feat-003-add-user-authentication (sin commit aún: espera confirmación del usuario)

## What's Done (hecho)
- feat-006 (Terraform) y feat-002 (contrato) ya estaban en `develop` al iniciar.
- feat-003: artefactos OpenSpec completos (proposal, specs 6/15, design D1-D10, tasks) y las 6 tareas implementadas:
  - Backend: `core/security.py`, `repositories/user_repository.py`, `schemas/auth.py`, `services/auth_service.py`,
    `api/routes/auth.py`, `deps.py:get_current_user` real, admin inicial en `lifespan` de `app/main.py`.
  - Frontend: `core/auth/auth.service.ts` (login/register/me + signals), componentes `/login`, `/register`, `/profile`.
  - Tests: 33 verdes (16 auth + 8 servicio + 7 seguridad + 2 health).
- **D10 (bug encontrado en 6.2)**: `EmailStr` rechazaba `admin@library.local` (dominio special-use) → 422 en login
  del admin y 500 en `/me`. Solución: `EmailField` en `app/schemas/user.py` (email-validator + fallback `.local`,
  aún rechaza malformados); tests de regresión BR-8 añadidos.

## What's In Progress (en curso)
- [ ] Commit propuesto (pendiente confirmación) y PR `feature/feat-003-add-user-authentication` → `develop`.

## What's Next (qué sigue)
1. Confirmar el commit del feat-003 y abrir el PR (CI verde; dev-b revisa `app/main.py` y `app/schemas/user.py`).
2. `/sync`, `/opsx-verify add-user-authentication` y `/opsx-archive add-user-authentication`; feat-003 → `done`.
3. feat-004 add-role-authorization (guards, `require_roles` en UI, interceptor ya listo).

## Blockers / Risks (bloqueos y riesgos)
- En esta máquina los puertos 5432 y 8080 los ocupan otros proyectos; para `check.sh --full` se detuvieron
  `app_postgres` y `glpi-app` (con permiso del usuario). Preguntar si se reinician al terminar.
- `app/schemas/user.py` (archivo de feat-002) se tocó en feat-003 por D10: dev-b debe revisarlo en el PR.

## Files Modified This Session (archivos modificados)
- `backend/app/schemas/auth.py`, `backend/app/schemas/user.py` (D10), `backend/app/core/security.py`,
  `backend/app/repositories/user_repository.py`, `backend/app/services/auth_service.py`,
  `backend/app/api/routes/auth.py`, `backend/app/api/deps.py`, `backend/app/main.py`,
  `backend/tests/test_security.py`, `test_auth_service.py`, `test_auth.py`
- `frontend/src/app/core/auth/auth.service.ts`,
  `frontend/src/app/features/auth/{login,register,profile}/*.ts`
- `openspec/changes/add-user-authentication/{design.md,tasks.md}`, `feature_list.json`

## Evidence of Completion (evidencia)
- [x] `uv run pytest -q` → 33 passed
- [x] `uv run ruff check . && uv run ruff format --check .` → limpio
- [x] `npx ng build` → OK
- [x] `./scripts/check.sh --full` → CHECK OK + SMOKE OK (health, SPA, fallback Angular)
- [x] En vivo (localhost:8080): login `admin@library.local` → 200; `/me` → 200 `role=admin`;
      register `.local` → 201; email malformado → 422
- [x] `npx openspec validate add-user-authentication` → válido

## Notes for Next Session (notas para la próxima sesión)
- No hacer commit sin confirmación del usuario (regla git-discipline).
- Tras archivar feat-003: feat-004 no toca `app.routes.ts` hasta que feat-002's rutas lazy ya existen (sí existen).
