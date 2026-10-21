# Design

## Context
Ver `proposal.md` (Why) y `specs/books/spec.md`. La base de datos ya cuenta con la tabla `books` y la tabla `users` creadas en `feat-002`. dev-b es el responsable de la gestión de libros.

## Goals / Non-Goals

**Goals:**
- Implementar los endpoints CRUD básicos para libros:
  - `POST /api/books`: crear libro (solo librarian o admin), asignando `created_by` del usuario autenticado (BR-11).
  - `GET /api/books/{id}`: consultar libro por ID (cualquier usuario autenticado).
  - `PUT /api/books/{id}`: actualizar libro (solo librarian o admin).
  - `DELETE /api/books/{id}`: eliminar libro (solo librarian o admin).
- Validar ISBN de 10 o 13 dígitos (422) y unicidad (409 "El ISBN ya está registrado", BR-9).
- Validar año de publicación entre 1450 y el año actual (422 "El año de publicación no es válido", BR-10).
- Proteger con 401 si no hay token y 403 "No tienes permiso para esta acción" si el rol no tiene permiso (reader no puede escribir).
- Crear en Angular el servicio `BookService` y el componente `BookFormComponent` para las rutas `/books/new` y `/books/:id/edit`, con validaciones y confirmación antes de eliminar.

**Non-Goals:**
- Búsqueda, filtrado por género y paginación del catálogo (corresponden a `feat-008`).

## Decisions

### Decision 1: Arquitectura en capas para libros
- `BookRepository`: métodos `get_by_id`, `get_by_isbn`, `create`, `update`, `delete`.
- `BookService`: validación de reglas de negocio (año, colisión de ISBN, mensajes en español con HTTPException).
- `app/api/routes/books.py`: controlador web con dependencias `require_roles(Role.librarian, Role.admin)` y `get_current_user`.
- *Alternativa descartada:* Poner consultas SQLAlchemy directamente en la ruta (descartada por la regla de arquitectura en capas de AGENTS.md).

### Decision 2: Validación de ISBN y año de publicación
- El esquema `BookCreate` y `BookUpdate` validan:
  - ISBN: expresión regular `^(?:\d{10}|\d{13})$` o validador que verifique longitud 10 o 13 numérica.
  - Año: `1450 <= publication_year <= datetime.now().year`.
- *Alternativa descartada:* Validación únicamente a nivel de base de datos (descartada para dar respuestas 422 claras en la API).

### Decision 3: Frontend con ReactiveFormsModule
- `BookFormComponent` utiliza `FormBuilder` y `ReactiveFormsModule`.
- Control de acceso con `roleGuard(['librarian', 'admin'])`.
- Modal / diálogo de confirmación `confirm('¿Seguro que quieres eliminar este libro?')` al eliminar.

## Risks / Trade-offs
- [Condición de carrera al registrar ISBN repetido] → Captura de `IntegrityError` en repositorio devolviendo 409 con el mensaje "El ISBN ya está registrado".
- [Edición manteniendo el mismo ISBN] → Al actualizar, si el ISBN no cambió, no se considera colisión.

## Migration Plan
- No requiere nuevas migraciones; la tabla `books` ya existe con sus restricciones.
