# Proposal

## Why
feat-003 de `docs/PRODUCT.md`, módulo Autenticación y Autorización (dueño: **dev-a**).
Cubre RF-01 (registro), RF-02 (inicio de sesión), RF-03 (perfil), RF-04 (admin inicial) y RNF-01 (seguridad),
con las reglas BR-1 a BR-6 y BR-8. Sin usuarios autenticados, ningún otro requisito del sistema se puede usar.

## What Changes
- `POST /api/auth/register`: crea un usuario `reader` con contraseña hasheada (argon2).
- `POST /api/auth/login`: valida credenciales y devuelve un JWT HS256 que vence a los 60 minutos.
- `GET /api/auth/me`: devuelve el perfil del usuario del token.
- Al arrancar la API, crea el admin inicial con `ADMIN_EMAIL` y `ADMIN_PASSWORD` si no existe ningún admin.
- Páginas Angular `/register`, `/login` y `/profile` (el token se guarda en `localStorage`).

### Fuera de alcance
- Autorización por roles y guards de Angular (feat-004).
- Administración de usuarios (feat-005).
- Refresh tokens, recuperación de contraseña y login social.

## Capabilities

### New Capabilities
- `authentication`: registro, inicio de sesión con JWT, perfil y admin inicial.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-a: `app/core/security.py`, `app/api/routes/auth.py`, `app/services/auth_service.py`,
  `app/repositories/user_repository.py`, `app/schemas/auth.py`, `tests/test_auth.py`,
  `frontend/src/app/features/auth/**`.
- Dependencias: `pyjwt` y `pwdlib[argon2]` (ya previstas en el esqueleto).
