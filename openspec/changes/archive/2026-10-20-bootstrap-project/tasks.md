# Tasks

## 1. Backend: Estructura base y dependencias
- [x] 1.1 Configurar backend/pyproject.toml con FastAPI, uvicorn, pydantic-settings, sqlalchemy, alembic y herramientas de dev (pytest, httpx, ruff) — verify: uv lock && uv sync
- [x] 1.2 Configurar backend/alembic.ini y entorno inicial de alembic en backend/alembic/ — verify: uv run alembic heads

## 2. Backend: API y Health Check
- [x] 2.1 Implementar backend/app/core/config.py y backend/app/main.py con GET /api/health retornando {"status": "ok"} — verify: uv run ruff check . && uv run ruff format --check .
- [x] 2.2 Agregar tests en backend/tests/test_health.py para GET /api/health (200) y ruta inexistente (404) — verify: uv run pytest -q

## 3. Frontend: Estructura base y dependencias
- [x] 3.1 Configurar frontend/package.json, angular.json y tsconfig con Angular 19 standalone — verify: npm ci --no-audit --no-fund
- [x] 3.2 Implementar index.html, main.ts, styles.css y app.config.ts con HttpClient — verify: npx ng build --configuration production

## 4. Frontend: UI y Health Check
- [x] 4.1 Implementar AppComponent con barra de navegación (Inicio, Libros, Usuarios, Iniciar sesión) y router-outlet — verify: npx ng build --configuration production
- [x] 4.2 Implementar HomeComponent en '/' que consulte /api/health y muestre 'API: ok' o 'API: sin conexión' — verify: npx ng build --configuration production

## 5. Verificación de integración
- [x] 5.1 Ejecutar ./scripts/check.sh y confirmar sensores en verde — verify: ./scripts/check.sh
- [x] 5.2 Ejecutar ./scripts/check.sh y registrar el resultado en feature_list.json — verify: ./scripts/check.sh
