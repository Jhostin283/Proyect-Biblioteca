# Spec Delta

## Purpose
Exponer el estado de la aplicación para las personas que la usan y para los sensores del harness (smoke test y healthchecks).

## ADDED Requirements

### Requirement: Endpoint de salud
El sistema SHALL responder `GET /api/health` con 200 y `{"status": "ok"}` sin requerir autenticación (RNF-08).

#### Scenario: API en funcionamiento
- **WHEN** se consulta `GET /api/health`
- **THEN** el sistema responde 200 con `{"status": "ok"}`

#### Scenario: Ruta inexistente
- **WHEN** se consulta `GET /api/no-existe`
- **THEN** el sistema responde 404

### Requirement: Página de inicio con el estado de la API
El sistema SHALL mostrar en la página de inicio el estado de la API y una barra de navegación con Inicio, Libros, Usuarios e Iniciar sesión (RNF-08, RNF-09).

#### Scenario: API disponible
- **WHEN** un visitante abre `/`
- **THEN** la página muestra "API: ok"

#### Scenario: API caída
- **GIVEN** que el backend no responde
- **WHEN** un visitante abre `/`
- **THEN** la página muestra "API: sin conexión" en lugar de quedarse en blanco

### Requirement: Rutas de la SPA servidas por Nginx
El sistema SHALL servir la aplicación Angular para cualquier ruta que no empiece con `/api`, de modo que recargar una página interna funcione (RNF-08).

#### Scenario: Recargar una página interna
- **WHEN** un visitante recarga el navegador en `/books`
- **THEN** recibe 200 con la aplicación Angular

#### Scenario: Prefijo de la API
- **WHEN** se consulta `/api/health` a través de Nginx
- **THEN** la petición llega al backend y no a la SPA

### Requirement: Arranque y recuperación con Docker
El sistema SHALL levantarse completo con `docker compose up` (base de datos, backend y frontend), aplicar las migraciones al arrancar y reiniciar los contenedores que fallen (RNF-08).

#### Scenario: Verificación completa
- **WHEN** se ejecuta `./scripts/check.sh --full`
- **THEN** los tres contenedores quedan sanos y el smoke test termina en "SMOKE OK"

#### Scenario: Base de datos no disponible al inicio
- **GIVEN** que PostgreSQL tarda en arrancar
- **WHEN** se levanta el stack
- **THEN** el backend espera a que la base de datos esté sana antes de arrancar
