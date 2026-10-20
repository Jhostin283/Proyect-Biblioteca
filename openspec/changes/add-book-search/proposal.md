# Proposal

## Why
feat-008 de `docs/PRODUCT.md`, módulo Gestión de Libros (dueño: **dev-b**).
Cubre RF-13 (listado paginado), RF-14 (búsqueda por título o autor), RF-15 (filtro por género), RF-16 (detalle)
y RNF-07 (rendimiento), con la regla BR-12.

## What Changes
- `GET /api/books?q=&genre=&page=&size=` devuelve `{items, total, page, size}` ordenado por título.
- `GET /api/books/genres` devuelve los géneros existentes, sin repetir y en orden alfabético.
- Índices en `title`, `author` y `genre` (ya definidos en el contrato).
- Página `/books` con buscador, filtro por género y paginación; página `/books/:id` con el detalle.
- Botones "Nuevo libro", "Editar" y "Eliminar" visibles solo para `librarian` y `admin` (`AuthService.hasRole()` de dev-a).

### Fuera de alcance
- Búsqueda de texto completo, ordenamiento configurable y exportación del catálogo.

## Capabilities

### New Capabilities
- `book-search`: consulta del catálogo con búsqueda, filtro por género, paginación y detalle.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-b: `app/api/routes/books.py`, `app/services/book_service.py`, `app/repositories/book_repository.py`,
  `app/schemas/book.py`, `tests/test_book_search.py`, `frontend/src/app/features/books/**`.
