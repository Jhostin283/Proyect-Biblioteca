# Progreso — dev-b (Gestión de Libros + GitHub Actions)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-20 16:20
**Feature activa:** ninguna (feat-002 completada, lista para merge a develop)
**Rama:** feature/feat-002-define-domain-contract

## What's Done (hecho)
- [x] Configuración del entorno de desarrollo (Node, npm, uv, openspec, git bash).
- [x] Creación y sincronización de rama `develop` como rama base de integración.
- [x] `feat-001` (`bootstrap-project`): rama `feature/feat-001-bootstrap-project`, esqueletos FastAPI y Angular con health check, tests unitarios y build OK, mergeado a `develop` y subido a origin.
- [x] `feat-002` (`define-domain-contract`): modelos SQLAlchemy (`User`, `Role`, `Book`), migración Alembic 0001, schemas compartidos, deps auth stubs, fixture `auth_as`, routers y lazy routes en Angular.

## What's In Progress (en curso)
- [ ] Ninguna

## What's Next (qué sigue)
1. Merge de `feature/feat-002-define-domain-contract` a `develop` y push a origin.
2. Iniciar `feat-007` (`add-book-management`): CRUD de libros en `feature/feat-007-add-book-management`.

## Blockers / Risks (bloqueos y riesgos)
- Ninguno.

## Files Modified This Session (archivos modificados)
- `backend/app/core/database.py`, `backend/app/models/**`, `backend/alembic/versions/0001*`
- `backend/app/schemas/**`, `backend/app/api/deps.py`, `backend/app/api/routes/**`
- `backend/tests/conftest.py`, `backend/app/main.py`
- `frontend/src/app/core/auth/**`, `frontend/src/app/features/**`, `frontend/src/app/app.routes.ts`
- `feature_list.json`, `progress/dev-b.md`

## Evidence of Completion (evidencia)
- [x] `./scripts/check.sh` → CHECK OK (pytest 2 passed, ruff OK, ng build OK)

## Notes for Next Session (notas para la próxima sesión)
- El contrato de dominio ya está completado y probado; podemos implementar el CRUD de libros (`feat-007`) de dev-b de inmediato.
