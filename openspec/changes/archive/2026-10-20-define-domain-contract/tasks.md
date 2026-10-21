# Tasks

## 1. Backend: Modelos y Base de Datos
- [x] 1.1 Configurar Base y sesión en backend/app/core/database.py y modelos User, Role, Book en backend/app/models/ — verify: uv run ruff check .
- [x] 1.2 Generar migración única de Alembic para crear tablas users y books — verify: uv run alembic heads

## 2. Backend: Schemas, Dependencias y Fixture de Auth
- [x] 2.1 Implementar schemas compartidos UserRead, BookRead, BookCreate, BookUpdate, Page en backend/app/schemas/ — verify: uv run ruff check .
- [x] 2.2 Implementar firmas y stubs de get_current_user y require_roles en backend/app/api/deps.py — verify: uv run ruff check .
- [x] 2.3 Implementar fixture auth_as en backend/tests/conftest.py y registrar routers vacíos auth, users, books en backend/app/main.py — verify: uv run pytest -q

## 3. Frontend: Rutas y Core de Auth
- [x] 3.1 Crear placeholders de AuthService, authInterceptor, authGuard, roleGuard en frontend/src/app/core/auth/ — verify: npx ng build --configuration production
- [x] 3.2 Configurar rutas lazy en frontend/src/app/app.routes.ts e interceptor en app.config.ts — verify: npx ng build --configuration production

## 4. Verificación de integración
- [x] 4.1 Ejecutar ./scripts/check.sh y validar que todos los sensores pasan — verify: ./scripts/check.sh
