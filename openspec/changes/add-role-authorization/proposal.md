# Proposal

## Why
feat-004 de `docs/PRODUCT.md`, módulo Autenticación y Autorización (dueño: **dev-a**).
Cubre RF-05 (restringir la API por rol) y RF-06 (mostrar u ocultar páginas y acciones según la sesión y el rol, y cerrar sesión),
según la tabla de permisos de la sección 3 y la regla BR-6. Es la pieza que usa dev-b para proteger las rutas de libros.

## What Changes
- Implementación real de `get_current_user` y `require_roles(*roles)` en `app/api/deps.py` (definidos en el contrato).
- Respuestas uniformes: 401 "No autenticado" y 403 "No tienes permiso para esta acción".
- Angular: `AuthService` (signal `currentUser`, `login()`, `logout()`, `hasRole()`), `authInterceptor`
  (agrega `Authorization: Bearer`), `authGuard`, `roleGuard(roles)`, manejo de 401 (cierra sesión) y botón "Cerrar sesión".

### Fuera de alcance
- Administración de usuarios (feat-005).
- Permisos por recurso (por ejemplo, "solo el creador edita su libro").

## Capabilities

### New Capabilities
- `authorization`: control de acceso por rol en la API y en la interfaz.

### Modified Capabilities
<!-- Ninguna. -->

## Impact
- Archivos de dev-a: `app/api/deps.py` (implementación), `app/core/security.py`, `tests/test_authorization.py`,
  `frontend/src/app/core/auth/**`, barra de navegación.
- dev-b ya usa `require_roles` y `roleGuard`: no cambian sus firmas.
