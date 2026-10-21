# Tasks

## 1. Backend: Esquemas, Repositorio y Servicio
- [x] 1.1 Agregar `PaginatedBooksResponse` en `backend/app/schemas/book.py` — verify: uv run ruff check .
- [x] 1.2 Implementar métodos `list_books` y `get_genres` en `backend/app/repositories/book_repository.py` — verify: uv run ruff check .
- [x] 1.3 Implementar métodos `search_books` y `get_genres` en `backend/app/services/book_service.py` — verify: uv run ruff check .

## 2. Backend: Endpoints y Pruebas Unitarias
- [x] 2.1 Implementar endpoints `GET /api/books/genres` y `GET /api/books` con filtros y paginación en `backend/app/api/routes/books.py` — verify: uv run ruff check .
- [x] 2.2 Implementar tests en `backend/tests/test_book_search.py` cubriendo los escenarios de `spec.md` — verify: uv run pytest -q tests/test_book_search.py

## 3. Frontend: Servicio, Catálogo y Vista de Detalle
- [x] 3.1 Extender `BookService` en `frontend/src/app/core/books/book.service.ts` con `getBooks` y `getGenres` — verify: npx ng build --configuration production
- [x] 3.2 Implementar `BookListComponent` en `frontend/src/app/features/books/book-list/book-list.component.ts` con búsqueda, filtro por género, paginación y permisos — verify: npx ng build --configuration production
- [x] 3.3 Implementar `BookDetailComponent` en `frontend/src/app/features/books/book-detail/book-detail.component.ts` con vista de detalle y manejo de 404 — verify: npx ng build --configuration production

## 4. Verificación de integración
- [x] 4.1 Ejecutar `./scripts/check.sh` y validar que todos los sensores pasan — verify: ./scripts/check.sh
