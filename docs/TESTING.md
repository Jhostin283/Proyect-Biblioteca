# Testing

## Qué se testea (mínimo por endpoint)
- Caso de éxito (código y forma de la respuesta).
- Recurso inexistente → 404.
- Entrada inválida → 422.
- Rutas protegidas: sin token → 401; rol insuficiente → 403.
- Reglas de negocio (BR-1 a BR-12) → 409 o 422 con `detail` en español.
- Cada escenario GIVEN/WHEN/THEN de la spec de OpenSpec tiene al menos un test.

## Backend: pytest + TestClient con SQLite en memoria
Los tests NO necesitan PostgreSQL: se reemplaza `get_db`. Plantilla de `backend/tests/conftest.py`:

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    # Base de datos SQLite en memoria, compartida por todas las conexiones del test
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    # La app usa esta sesión de prueba en lugar de la de PostgreSQL
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
```

Los modelos deben importarse antes de `create_all` (impórtalos en `app/models/__init__.py` e importa ese paquete
desde `app/main.py`). Evita tipos exclusivos de PostgreSQL (`ARRAY`, `JSONB`) salvo que la spec los exija.
## Autenticación en los tests (fixture `auth_as`, parte del contrato)
Los tests de libros (dev-b) no generan tokens reales: reemplazan `get_current_user` con un usuario del rol pedido.
Agrega esto a `tests/conftest.py` en el contrato (feat-002):

```python
from app.api.deps import get_current_user
from app.models.user import Role, User


@pytest.fixture()
def auth_as(client):
    # Uso: auth_as(Role.librarian) -> las peticiones siguientes van autenticadas con ese rol
    def _auth(role: Role) -> User:
        user = User(id=1, email=f"{role.value}@test.local", full_name="Usuario de prueba",
                    hashed_password="x", role=role, is_active=True)
        app.dependency_overrides[get_current_user] = lambda: user
        return user
    return _auth
```

Los tests de auth (dev-a) sí prueban el flujo real: registro → login → `Authorization: Bearer <token>` → `/api/auth/me`.
Para el token vencido, genera uno con `exp` en el pasado en lugar de esperar 60 minutos.

Ejecutar: `cd backend && uv run pytest -q`

## Frontend
- Sensor obligatorio: `npx ng build` sin errores (detecta tipos, plantillas e imports rotos).
- Tests unitarios con **Karma + Jasmine** (`frontend/karma.conf.js`); cada `*.spec.ts` vive junto al archivo que prueba.
  Como `package.json` expone `"test:ci"`, `scripts/check.sh` lo ejecuta solo.
- Cobertura obligatoria: `npm run test:ci` genera `frontend/coverage/` y falla si alguna métrica global
  (statements, branches, functions, lines) baja del 80 % (umbral en `karma.conf.js`).

## Cobertura (umbral 80 %)
- Backend: `cd backend && uv run pytest --cov --cov-fail-under=80` → informe en `backend/coverage.xml` y `backend/htmlcov/`.
- Frontend: `cd frontend && npm run test:ci` → informe en `frontend/coverage/`.
- El workflow `.github/workflows/ci.yml` publica dos artefactos descargables: `coverage-backend` y `coverage-frontend`.
- `deploy.yml` reutiliza ese workflow como job `check`, así que el despliegue no arranca si la cobertura baja del 80 %.

## Integración real
`./scripts/check.sh --full` levanta `docker compose` con PostgreSQL, aplica las migraciones al arrancar el backend
y ejecuta `scripts/smoke.sh` contra Nginx. El CI de cada Pull Request corre exactamente lo mismo.
