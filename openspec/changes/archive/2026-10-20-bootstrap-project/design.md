# Design

## Context
Ver `proposal.md` (Why). Se necesita crear el esqueleto base para el backend FastAPI y el frontend Angular siguiendo el contrato de `AGENTS.md` y `docs/PRODUCT.md` (RNF-08).

## Goals / Non-Goals

**Goals:**
- Estructurar el backend con FastAPI, Pydantic v2, configuración por variables de entorno con `pydantic-settings`, y endpoint `GET /api/health` respondiendo `{"status": "ok"}`.
- Configurar Alembic para migraciones futuras con PostgreSQL.
- Estructurar el frontend con Angular standalone components y signals, integrando barra de navegación (Inicio, Libros, Usuarios, Iniciar sesión) y verificación del estado de la API en la página de inicio.
- Configurar proxy de desarrollo y compatibilidad con el contenedor Nginx en producción.
- Establecer tests base en pytest y build en Angular que pasen `./scripts/check.sh`.

**Non-Goals:**
- Implementar tablas o modelos de datos de dominio (correspondiente a feat-002).
- Implementar autenticación ni lógica de negocio de libros (feat-003 en adelante).

## Decisions

### Decision 1: Estructura del Backend y Endpoint Health Check
- `app.main:app` como punto de entrada de FastAPI.
- Configuración con `pydantic-settings` (`Settings` leyendo de entorno).
- Inclusión del router de salud bajo el prefijo `/api` (`GET /api/health` -> `{"status": "ok"}`).
- Manejo de rutas inexistentes con 404 estándar de FastAPI.
- *Alternativa descartada:* Endpoint fuera de `/api` (descartada por contrato técnico de AGENTS.md).

### Decision 2: Configuración de Base de Datos y Alembic
- Configuración de SQLAlchemy 2 y `alembic.ini` con `env.py` apuntando a `DATABASE_URL`.
- Permite que `alembic upgrade head` en `Dockerfile` se ejecute de forma transparente aun sin migraciones iniciales.
- *Alternativa descartada:* `Base.metadata.create_all()` en producción (prohibido por AGENTS.md).

### Decision 3: Frontend Angular con Standalone Components
- Angular 19 utilizando standalone components y la función `provideHttpClient(withFetch())`.
- Barra de navegación en `app.component.html` con enlaces a `/` (Inicio), `/books` (Libros), `/users` (Usuarios) y `/login` (Iniciar sesión).
- Componente `HomeComponent` en `/` que consulta `/api/health` vía `HttpClient` y muestra "API: ok" o "API: sin conexión".
- `proxy.conf.json` redirigiendo `/api` a `http://localhost:8000` durante `ng serve`.

## Risks / Trade-offs
- [Versión de Node en entorno local] → Se utiliza Angular 19 compatible con Node 22 LTS instalado en el entorno.
- [Conexión a base de datos en Docker vs local] → Backend maneja `DATABASE_URL` configurable por variable de entorno.

## Migration Plan
- Despliegue de los esqueletos de backend y frontend; no requiere migración de esquema en este paso.
