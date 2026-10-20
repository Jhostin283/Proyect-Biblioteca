# Proposal

## Why
feat-009 de `docs/PRODUCT.md` (dueño: **dev-b**). Cubre RNF-04 (integración y despliegue continuos) y RNF-06
(el sistema cabe en una t3.micro). Usa la EC2 y los secrets que crea dev-a en feat-006.

## What Changes
- Ajustar y activar los workflows existentes: `ci.yml` (sensores en cada Pull Request) y `deploy.yml`
  (al hacer merge a `main`: build, push a GHCR, despliegue en la EC2 y smoke test).
- Proteger la rama `main`: solo se integra por Pull Request con el check "Sensores" en verde.
- Pasar las variables de autenticación (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) desde `~/app/.env` del servidor.
- Badge de estado del CI en el `README.md`.

### Fuera de alcance
- Entornos de staging, despliegues blue/green, HTTPS y dominio propio.

## Capabilities

### New Capabilities
- `deployment`: integración y despliegue continuos con GitHub Actions hacia la EC2.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-b: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `docs/DEPLOYMENT.md`, badge en `README.md`.
- Requiere de dev-a: la EC2 creada y los secrets `EC2_HOST`, `EC2_USER` y `EC2_SSH_KEY` cargados.
