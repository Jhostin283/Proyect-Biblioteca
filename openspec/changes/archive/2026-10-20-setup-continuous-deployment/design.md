# Design: Integración y Despliegue Continuos con GitHub Actions

## Context
Implementación de la capacidad `deployment` correspondiente a `feat-009` (dev-b, módulo de CI/CD).
Automatiza la verificación de sensores en cada Pull Request y el despliegue hacia la instancia AWS EC2 en cada merge a `main`.

## Architecture Decisions

### 1. Flujo de CI (`ci.yml`)
- Activadores (triggers):
  - `pull_request` hacia las ramas `main` y `develop`.
  - `push` a la rama `develop`.
  - Reutilizable mediante `workflow_call` (invocado por `deploy.yml`).
  - Ejecución manual mediante `workflow_dispatch`.
- Entorno de ejecución:
  - `ubuntu-latest`
  - `astral-sh/setup-uv@v6`
  - `actions/setup-node@v4` con `node-version: 24`
  - `hashicorp/setup-terraform@v3` (para `fmt` y `validate`)
  - Ejecuta `./scripts/check.sh --full` (iniciando servicios auxiliares si se requiere docker en el runner).

### 2. Flujo de CD (`deploy.yml`)
- Activadores (triggers):
  - `push` a la rama `main` (después de mergear release/hotfix).
  - Ejecución manual mediante `workflow_dispatch`.
- Fases:
  1. `check`: Llama a `ci.yml` para garantizar que todos los sensores pasen antes de construir.
  2. `build`: Construye y sube las imágenes Docker de backend y frontend a GitHub Container Registry (`ghcr.io`) usando el SHA del commit y `latest`.
  3. `deploy`: Despliega en la instancia EC2 mediante SSH (`EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`). Copia `docker-compose.prod.yml`, actualiza `.env` con las variables de imagen, y ejecuta `docker compose pull && up -d`.
  4. `smoke`: Ejecuta `./scripts/smoke.sh "http://$EC2_HOST"` para verificar que la aplicación esté respondiendo correctamente. En caso de fallo, captura los logs de los contenedores para depuración.

### 3. Badges de estado en README
- Incorporación de los badges de GitHub Actions para `CI` y `Deploy` en el encabezado de `README.md`.
