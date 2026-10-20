# Proposal

## Why
feat-001 de `docs/PRODUCT.md` (compartida; la maneja **dev-b** mientras dev-a crea la infraestructura en paralelo).
Cubre RNF-08 (disponibilidad: `GET /api/health` y reinicio automático) y deja lista la base técnica para RF-01 a RF-16.

## What Changes
- Esqueleto del backend FastAPI con arquitectura en capas, configuración por variables de entorno, Alembic y tests.
  Las tareas siguen los pasos de `.opencode/commands/scaffold.md` (también se puede ejecutar `/scaffold` directamente).
- Esqueleto del frontend Angular con proxy a `/api`, `HttpClient` y barra de navegación (Inicio, Libros, Usuarios, Iniciar sesión).
- `GET /api/health` y una página de inicio que muestra el estado de la API.
- Verificación local completa con Docker: `./scripts/check.sh --full`.

### Fuera de alcance
- Tablas, roles y lógica de negocio (feat-002 en adelante).

## Capabilities

### New Capabilities
- `platform-health`: estado de la aplicación visible para personas y para los sensores.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Crea `backend/` (excepto su Dockerfile, que ya existe) y `frontend/` (excepto `Dockerfile` y `nginx.conf`).
- Archivos compartidos creados aquí: `app/main.py`, `app.routes.ts`, `app.config.ts`, `tests/conftest.py`.
