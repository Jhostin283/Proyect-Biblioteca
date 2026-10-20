# Tasks

## 1. Backend: Acceso a Datos y Lógica de Negocio
- [x] 1.1 Implementar backend/app/schemas/book.py con validadores de ISBN y año — verify: uv run ruff check .
- [x] 1.2 Implementar backend/app/repositories/book_repository.py con operaciones CRUD — verify: uv run ruff check .
- [x] 1.3 Implementar backend/app/services/book_service.py con reglas de negocio (BR-9, BR-10, BR-11) — verify: uv run ruff check .

## 2. Backend: API y Pruebas Unitarias
- [x] 2.1 Implementar rutas POST, GET /{id}, PUT /{id}, DELETE /{id} en backend/app/api/routes/books.py — verify: uv run ruff check .
- [x] 2.2 Implementar tests en backend/tests/test_books.py cubriendo los escenarios de spec.md — verify: uv run pytest -q tests/test_books.py

## 3. Frontend: Servicio y Formularios de Libros
- [x] 3.1 Implementar BookService en frontend/src/app/core/books/book.service.ts — verify: npx ng build --configuration production
- [x] 3.2 Implementar BookFormComponent en frontend/src/app/features/books/book-form/book-form.component.ts con formulario y confirmación de eliminación — verify: npx ng build --configuration production

## 4. Verificación de integración
- [x] 4.1 Ejecutar ./scripts/check.sh y validar que todos los sensores pasan — verify: ./scripts/check.sh
