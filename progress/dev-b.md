# Progreso — dev-b (Gestión de Libros + GitHub Actions)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-20 16:46
**Feature activa:** feat-009 (setup-continuous-deployment - finalizado y listo para mergear)
**Rama:** feature/feat-009-setup-continuous-deployment

## What's Done (hecho)
- [x] Configuración del entorno de desarrollo (Node, npm, uv, openspec, git bash).
- [x] Creación y sincronización de rama `develop` como rama base de integración.
- [x] `feat-001` (`bootstrap-project`): rama `feature/feat-001-bootstrap-project`, mergeado a `develop` y subido a origin.
- [x] `feat-002` (`define-domain-contract`, compartida): rama `feature/feat-002-define-domain-contract`, modelos User/Book, migración Alembic 0001, schemas y deps, mergeado a `develop` y subido a origin.
- [x] `feat-007` (`add-book-management`): CRUD de libros (`POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`), roles `librarian` y `admin`, validaciones de ISBN y año, `created_by` por token, 18 tests backend pasando, Angular `BookService` y `BookFormComponent`, mergeado a `develop` y subido a origin.
- [x] `feat-008` (`add-book-search`): listado paginado `{items, total, page, size}`, búsqueda `q` (título o autor con `ilike`), filtro exacto `genre`, listado alfabético y único `GET /api/books/genres`, validación de `size` entre 1 y 50 (422), 28 tests totales en pytest, Angular `BookListComponent` y `BookDetailComponent`, mergeado a `develop` y subido a origin.
- [x] `feat-009` (`setup-continuous-deployment`): workflows de GitHub Actions activos (`ci.yml` en PRs hacia main/develop y push a develop; `deploy.yml` en push a main), integración con GHCR y despliegue SSH a EC2 con smoke test, badges de estado agregados a `README.md`.

## What's In Progress (en curso)
- [ ] Integración de `feat-009` a `develop` y pase a `feat-010`.

## What's Next (qué sigue)
1. Mergear `feature/feat-009-setup-continuous-deployment` a `develop` y push a origin.
2. Proceder con `feat-010` (`release-v1`): integración compartida y preparación de release v1.0.0.

## Blockers / Risks (bloqueos y riesgos)
- Ninguno.

## Files Modified This Session (archivos modificados)
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `README.md`
- `openspec/specs/deployment/spec.md`
- `openspec/changes/archive/2026-10-20-setup-continuous-deployment/`
- `feature_list.json`
- `progress/dev-b.md`

## Evidence of Completion (evidencia)
- `./scripts/check.sh` → CHECK OK (28 tests backend PASSED, build Angular OK, terraform validate OK).

## Notes for Next Session (notas para la próxima sesión)
- Git Flow estricto: feature branch, merge a `develop` y push ordenado.

## Blockers / Risks (bloqueos y riesgos)
- Ninguno.

## Files Modified This Session (archivos modificados)
- `backend/app/schemas/book.py`
- `backend/app/repositories/book_repository.py`
- `backend/app/services/book_service.py`
- `backend/app/api/routes/books.py`
- `backend/tests/test_book_search.py`
- `frontend/src/app/core/books/book.service.ts`
- `frontend/src/app/features/books/book-list/book-list.component.ts`
- `frontend/src/app/features/books/book-detail/book-detail.component.ts`
- `openspec/specs/book-search/spec.md`
- `openspec/changes/archive/2026-10-20-add-book-search/`
- `feature_list.json`
- `progress/dev-b.md`

## Evidence of Completion (evidencia)
- `./scripts/check.sh` → CHECK OK (28 tests backend PASSED, build Angular OK, terraform validate OK).

## Notes for Next Session (notas para la próxima sesión)
- Git Flow estricto: feature branch, merge a `develop` y push ordenado.
