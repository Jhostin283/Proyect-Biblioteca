# Proposal

## Why
feat-007 de `docs/PRODUCT.md`, módulo Gestión de Libros (dueño: **dev-b**).
Cubre RF-10 (registrar libro), RF-11 (editar) y RF-12 (eliminar), con las reglas BR-9, BR-10 y BR-11
y los permisos de la sección 3: escritura solo para `librarian` y `admin`.

## What Changes
- `POST /api/books`, `PUT /api/books/{id}`, `DELETE /api/books/{id}` protegidos con `require_roles(Role.librarian, Role.admin)`.
- `GET /api/books/{id}` para cualquier usuario autenticado (con `get_current_user`).
- Validaciones: ISBN de 10 o 13 dígitos y único, título y autor obligatorios, año entre 1450 y el año actual.
- `created_by` se toma del usuario autenticado.
- Páginas Angular `/books/new` y `/books/:id/edit` (protegidas con `roleGuard`) y eliminación con confirmación.
- Tests con la fixture `auth_as(role)`: no dependen de que el login de dev-a esté terminado.

### Fuera de alcance
- Listado paginado, búsqueda, filtro y página de detalle (feat-008).
- Portadas, ejemplares, préstamos y permisos por creador del libro.

## Capabilities

### New Capabilities
- `books`: registro, edición y eliminación de libros con permisos por rol.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-b: `app/api/routes/books.py`, `app/services/book_service.py`, `app/repositories/book_repository.py`,
  `app/schemas/book.py`, `tests/test_books.py`, `frontend/src/app/features/books/**`.
- Usa sin modificar: `app/api/deps.py` (`get_current_user`, `require_roles`) y `core/auth/` (`roleGuard`, `AuthService`) de dev-a.
