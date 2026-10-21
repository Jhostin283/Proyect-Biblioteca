---
name: fullstack-feature
description: Pasos para agregar un recurso CRUD de punta a punta (modelo, migración, schemas, repositorio, servicio, rutas, tests, servicio y vistas de Angular) respetando el contrato del proyecto. Úsala al implementar tareas de OpenSpec que agregan o cambian una entidad.
---

# Recurso CRUD de punta a punta

Orden obligatorio (mantén `./scripts/check.sh` en verde después de cada paso cuando sea posible).
Las carpetas siguen la arquitectura en capas por defecto; adáptalas si un ADR aceptado define otra.
Identificadores en inglés; comentarios, mensajes de error (`detail`) y textos de la UI en español.

1. **Modelo** `backend/app/models/<resource>.py` (SQLAlchemy 2, `Mapped[]`), exportado en `app/models/__init__.py`.
   En este proyecto los modelos `User` y `Book` ya existen desde el contrato (feat-002): no los dupliques.
2. **Migración** (solo si agregas columnas después del contrato): `/sync` primero y luego
   `cd backend && uv run alembic revision --autogenerate -m "agrega <columna> a <tabla>"`.
   Revisa el archivo generado (no vacío, no borra tablas). Si `alembic heads` muestra dos heads, `uv run alembic merge heads`.
3. **Schemas** `app/schemas/<resource>.py`: `XCreate`, `XUpdate` (campos opcionales), `XRead` (`from_attributes=True`),
   con validaciones `Field(...)` que reflejen los escenarios de la spec.
4. **Repositorio** `app/repositories/<resource>_repository.py`: el único lugar con consultas.
5. **Servicio** `app/services/<resource>_service.py`: reglas de negocio (BR-x); recibe una `Session`, sin imports de FastAPI.
6. **Rutas** `app/api/routes/<resources>.py` (el router ya está registrado en `main.py` desde el contrato).
   Protégelas con `Depends(get_current_user)` (lectura) o `Depends(require_roles(Role.librarian, Role.admin))` (escritura):
   | Acción | Método y ruta | Código |
   |---|---|---|
   | Listar | `GET /api/<resources>` | 200 |
   | Obtener | `GET /api/<resources>/{id}` | 200 / 404 |
   | Crear | `POST /api/<resources>` | 201 |
   | Actualizar | `PUT /api/<resources>/{id}` | 200 / 404 |
   | Eliminar | `DELETE /api/<resources>/{id}` | 204 / 404 |
   Conflictos de unicidad o de reglas de negocio → 409, con `detail` en español (ej.: "El ISBN ya está registrado").
7. **Tests** `tests/test_<resources>.py`: éxito, 401, 403, 404 y 422 por endpoint (usa la fixture `auth_as(role)`), más un test por escenario de la spec.
8. `./scripts/check.sh` → `CHECK OK`.
9. **Frontend** (la ruta lazy ya existe en `app.routes.ts` desde el contrato):
   - `core/api/<resource>.model.ts` (interfaces alineadas con `XRead`/`XCreate`).
   - `core/api/<resource>.service.ts` (HttpClient, URL base `/api/<resources>`).
   - `features/<resource>/<resource>-list` (tabla + eliminar) y `<resource>-form` (crear/editar con Reactive Forms
     y las mismas validaciones del backend), con textos en español. Muestra u oculta acciones con `AuthService.hasRole()`
     y protege las rutas de escritura con `roleGuard` (ambos de `core/auth/`, de dev-a).
   - Estados de carga, vacío y error ("Cargando...", "No hay registros", "No se pudo conectar con la API").
10. `./scripts/check.sh` → `CHECK OK`; marca las tareas `[x]` y registra la evidencia.

Errores frecuentes:
- Olvidar importar el modelo en `app/models/__init__.py` → la tabla no existe en tests ni en migraciones.
- Usar `http://localhost:8000` en Angular → falla en producción. Siempre `/api`.
- Devolver el objeto ORM sin `response_model` → se filtran campos internos.
- Devolver cuerpo con 204 en DELETE → usa `Response(status_code=204)`.
