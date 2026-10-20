# Design: Búsqueda, Filtro, Paginación y Detalle de Libros

## Context
Implementación de la capacidad `book-search` correspondiente a `feat-008` (Gestión de Libros, dev-b).
Permite a usuarios autenticados consultar el catálogo con búsqueda insensible a mayúsculas/minúsculas por título o autor (`q`), filtrado exacto por género (`genre`), paginación (`page`, `size` entre 1 y 50, por defecto 10) ordenada por título (`title.asc()`), consulta de géneros únicos disponibles (`GET /api/books/genres`) y vista de detalle de cada libro (`/books/:id`).

## Architecture Decisions

### 1. Consultas y Paginación en SQLAlchemy
- La búsqueda de `q` se aplica con `ilike` sobre `Book.title` y `Book.author` combinados con `or_()`.
- El filtro `genre` aplica igualdad exacta sobre `Book.genre`.
- La consulta cuenta el total con `func.count(Book.id)` aplicando los mismos filtros.
- El ordenamiento es siempre alfabético por `Book.title.asc()`.
- La lista de géneros se obtiene con `select(Book.genre).distinct().order_by(Book.genre.asc())`.

### 2. Orden de Rutas en FastAPI
- `GET /api/books/genres` debe definirse antes de `GET /api/books/{id}` en el router de FastAPI para evitar colisión de rutas (evitar que "genres" sea parseado como un ID numérico de libro).

### 3. Esquemas y Respuestas
- Esquema `PaginatedBooksResponse`:
  ```python
  class PaginatedBooksResponse(BaseModel):
      items: list[BookResponse]
      total: int
      page: int
      size: int
  ```
- Parámetros de consulta en FastAPI:
  - `page: int = Query(1, ge=1)`
  - `size: int = Query(10, ge=1, le=50)` -> Si `size > 50` o `page < 1`, FastAPI devuelve 422 automáticamente.

### 4. Interfaz en Angular (Standalone Components)
- `BookListComponent`:
  - Búsqueda reactiva o con botón/cambio por título o autor.
  - Selector de género cargado dinámicamente desde `GET /api/books/genres`.
  - Paginador con información de página actual y botones anterior/siguiente.
  - Mensaje "No se encontraron libros" si `items` está vacío.
  - Botones "Nuevo libro", "Editar" y "Eliminar" condicionados al rol del usuario (`librarian` o `admin`).
- `BookDetailComponent`:
  - Carga el libro por `:id` usando `BookService.getBookById(id)`.
  - Si responde 404, muestra "Libro no encontrado" con botón o enlace para volver a `/books`.
  - Botones "Editar" y "Eliminar" condicionados al rol.
