# Proposal

## Why
feat-005 de `docs/PRODUCT.md`, módulo Autenticación y Autorización (dueño: **dev-a**).
Cubre RF-07 (listar y buscar usuarios), RF-08 (cambiar rol) y RF-09 (activar o desactivar), con las reglas BR-6 y BR-7.
Es la única forma de que existan bibliotecarios, porque el auto-registro siempre crea lectores (BR-5).

## What Changes
- `GET /api/users?q=&page=&size=` (solo admin): listado paginado con búsqueda por email o nombre.
- `PATCH /api/users/{id}` (solo admin): cambia `role` y/o `is_active`.
- Página Angular `/users` (solo admin) con tabla, buscador, selector de rol e interruptor de estado.

### Fuera de alcance
- Crear o eliminar usuarios desde el panel; cambiar email o contraseña de otros usuarios.

## Capabilities

### New Capabilities
- `user-administration`: gestión de roles y estado de las cuentas por parte del administrador.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-a: `app/api/routes/users.py`, `app/services/user_service.py`, `app/repositories/user_repository.py`,
  `app/schemas/user.py`, `tests/test_users.py`, `frontend/src/app/features/users/**`.
