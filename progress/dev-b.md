# Progreso — dev-b (Gestión de Libros + GitHub Actions)

## Current State (estado actual)
**Last Updated (última actualización):** 2026-10-21 03:30
**Feature activa:** ninguna — `feat-010` (release) cerrada; el backlog quedó completo (10/10 en `done`).
**Rama:** `develop` y `main` sincronizadas; release `v1.0.1` desplegada en la EC2.

## What's Done (hecho)

### Entorno y flujo
- [x] Configuración del entorno de desarrollo (Node, npm, uv, openspec, git bash).
- [x] Creación y sincronización de rama `develop` como rama base de integración.
- [x] Git Flow: una rama por feature, merge a `develop` y push ordenado.

### Features
- [x] `feat-001` (`bootstrap-project`): rama `feature/feat-001-bootstrap-project`, mergeada a `develop` y subida a origin.
- [x] `feat-002` (`define-domain-contract`, compartida): modelos User/Book, migración Alembic 0001, schemas y deps, mergeada a `develop`.
- [x] `feat-007` (`add-book-management`): CRUD de libros (`POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`), roles `librarian` y `admin`, validaciones de ISBN y año, `created_by` por token, 18 tests backend, Angular `BookService` y `BookFormComponent`.
- [x] `feat-008` (`add-book-search`): listado paginado `{items, total, page, size}`, búsqueda `q` (título o autor con `ilike`), filtro exacto `genre`, `GET /api/books/genres`, validación de `size` 1–50 (422), 28 tests, Angular `BookListComponent` y `BookDetailComponent`.
- [x] `feat-009` (`setup-continuous-deployment`): workflows de GitHub Actions, integración con GHCR, despliegue SSH a la EC2 con smoke test y badges en `README.md`.
- [x] Integración de `feat-009` a `develop` y arranque de `feat-010`.
- [x] `feat-010` (`release-v1`): todo integrado en `main`, versionado con tags y desplegado en la EC2. Marcada `done` en `feature_list.json`.

### CI/CD y calidad (sesión de cierre)
- [x] Suite de tests del frontend con **Karma + Jasmine**: 109 tests, 99,7 % statements / 93,1 % branches (antes no había ninguno).
- [x] Cobertura del backend con `pytest-cov`: 93,8 % (con ramas).
- [x] Umbral obligatorio del **80 %** en backend (`--cov-fail-under=80`) y frontend (`check` en `karma.conf.js`);
      verificado que el job falla si baja del umbral.
- [x] Generación de **dos artefactos** en cada ejecución de la CI: `coverage-backend` y `coverage-frontend`.
- [x] `ci.yml` dejó de dispararse con push: solo corre con `workflow_call` (desde `deploy.yml`) o `workflow_dispatch`.
- [x] `deploy.yml` se dispara **solo con tags `v*`** y el job `guard` exige que el tag esté contenido en `main`.
- [x] Imágenes de GHCR etiquetadas con la versión del tag (`v1.0.1`) además de `latest`.
- [x] `fix(ci)`: soporte para el secret `EC2_IP` además de `EC2_HOST`, y usuario `ubuntu` por defecto.
- [x] Despliegue sin claves de larga duración: rol **OIDC** (`library-g2-github-deploy`) que solo puede abrir/cerrar
      el 22 del security group; el workflow abre el puerto a la IP del runner y lo revoca en `if: always()`.
- [x] Releases: `v1.0.0` (primera versión) y `v1.0.1` (primer despliegue automático correcto).
- [x] Demo de extremo a extremo verificada contra la app desplegada.

## What's In Progress (en curso)
- [x] Ninguna tarea pendiente: todos los checklists de las dos máquinas están completos.

## What's Next (qué sigue)
1. Mantener el flujo actual: commit en `develop` → merge a `main` → `git tag -a vX.Y.Z` → `git push origin vX.Y.Z`.
2. El tag dispara `deploy.yml`: `guard` → CI (sensores + cobertura ≥80 %) → build a GHCR → deploy a la EC2 → smoke.

## Blockers / Risks (bloqueos y riesgos)
- GitHub emite el claim `sub` con IDs inmutables (`repo:owner@id/repo@id:...`); la trust policy acepta el formato
  clásico y el nuevo, siempre limitada a `main` y tags `v*`.
- El thumbprint del proveedor OIDC puede rotar cuando GitHub cambie de CA; si el `assume-role` falla con
  `InvalidIdentityToken`, revisar la cadena de `token.actions.githubusercontent.com`.
- El 22 sigue cerrado al mundo: solo se abre al runner durante el despliegue y se revoca al terminar.
- `./scripts/check.sh --full` puede fallar en local si otros proyectos ocupan los puertos 80/5432.

## Files Modified This Session (archivos modificados)
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `backend/pyproject.toml`, `backend/uv.lock`
- `frontend/karma.conf.js`, `frontend/tsconfig.spec.json`, `frontend/angular.json`
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/src/**/*.spec.ts` (15 archivos de tests)
- `docs/TESTING.md`, `docs/DEPLOYMENT.md`
- `infra/terraform/github_oidc.tf`, `infra/terraform/variables.tf`, `infra/terraform/outputs.tf`
- `feature_list.json`, `progress/dev-a.md`, `progress/dev-b.md`

## Evidence of Completion (evidencia)
- `./scripts/check.sh --full` → **CHECK OK** + **SMOKE OK** (88 tests backend, 109 tests frontend, `ng build`, terraform).
- CI del release `v1.0.1` (run `39534507828`, attempt 2) → **6/6 jobs en verde**: guard, sensores, cobertura backend,
  cobertura frontend, build a GHCR y despliegue.
- Artefactos publicados en el run: `coverage-backend` (89 KB) y `coverage-frontend` (101 KB).
- `http://184.197.133.138` → `200` en `/` y `/api/health` → `{"status":"ok"}`; contenedores `v1.0.1` healthy.
- Demo contra la app desplegada: registro `201`; reader `POST /api/books` → `403`; admin promueve a librarian;
  librarian crea libro → `201`; `GET /api/books?q=cien&genre=Novela` → `total 1`; `/api/books/genres` → `["Novela"]`;
  ISBN duplicado → `409`; año 3000 → `422`; sin token → `401`.

## Notes for Next Session (notas para la próxima sesión)
- Los push a `develop` o `main` ya no ejecutan nada: solo el tag de versión dispara el despliegue.
- Antes de etiquetar, comprobar que `main` incluye lo que se quiere publicar (`git log --oneline origin/main -5`).
- Para inspeccionar un despliegue: `gh run list --workflow=deploy.yml` y `gh run view <id> --log`.
