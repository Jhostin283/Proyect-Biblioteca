# Proposal

## Why
feat-002 de `docs/PRODUCT.md` (compartida; la maneja dev-a y la revisa dev-b). Es la base técnica de RF-01 a RF-16:
fija una sola vez el modelo de datos (sección 4), los roles (sección 3) y la interfaz entre los módulos de
Autenticación y Gestión de Libros (sección 6), para que dev-a y dev-b trabajen en paralelo sin tocar los mismos archivos.

## What Changes
- Modelos `User` (con enum `Role`: `reader`, `librarian`, `admin`) y `Book`, y **una sola migración de Alembic** con ambas tablas.
- Schemas de Pydantic compartidos (`UserRead`, `BookRead`, `Page[T]`).
- `app/api/deps.py` con las firmas de `get_current_user` y `require_roles(*roles)` (implementación temporal que responde 401).
- Fixture `auth_as(role)` en `backend/tests/conftest.py` para que los tests usen cualquier rol sin token real.
- Routers vacíos `auth`, `users` y `books` registrados en `app/main.py` bajo `/api`.
- Frontend: archivos vacíos de `core/auth/` (`AuthService`, `authInterceptor`, `authGuard`, `roleGuard`) ya referenciados,
  y rutas lazy de `/login`, `/register`, `/profile`, `/users` y `/books` con componentes vacíos.

### Fuera de alcance
- La lógica real de login, JWT y roles (feat-003 y feat-004, dev-a).
- La lógica de libros (feat-007 y feat-008, dev-b).

## Capabilities

### New Capabilities
<!-- Ninguna: este cambio es estructural (skip_specs: true). Su comportamiento lo especifican los cambios de cada módulo. -->

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos compartidos (ver `docs/PRODUCT.md` sección 9): `app/main.py`, `app/models/__init__.py`, `alembic/versions/`,
  `tests/conftest.py`, `app.routes.ts`, `app.config.ts`.
- Después de este cambio, ningún desarrollador vuelve a tocar esos archivos fuera de un PR revisado por el otro.
