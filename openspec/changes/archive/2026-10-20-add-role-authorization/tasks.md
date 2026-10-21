# Tasks

## 1. Autorización de la API

- [x] 1.1 Añadir en `backend/app/api/routes/users.py` el `GET /api/users` temporal protegido con `Depends(require_roles(Role.admin))` que responde `{"items": [], "total": 0, "page": 1, "size": 10}` — verify: `cd backend && uv run pytest -q` sigue en verde (sin regresiones).
- [x] 1.2 Crear `backend/tests/test_authorization.py` con los 401 de todas las rutas protegidas (sin token en `GET/POST/PUT/DELETE /api/books`, `GET /api/users` y `GET /api/auth/me`) y el mensaje `"No autenticado"` — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 1.3 Añadir a `backend/tests/test_authorization.py` los casos de token alterado (otro secreto) y token vencido, más el caso de token válido que obtiene 200 en `GET /api/books` — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 1.4 Añadir a `backend/tests/test_authorization.py` el 403 de un `reader` en `POST`, `PUT` y `DELETE /api/books` con el mensaje `"No tienes permiso para esta acción"`, y que un `librarian` puede crear un libro (201) — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 1.5 Añadir a `backend/tests/test_authorization.py` el 403 de un `librarian` en `GET /api/users` y el 200 de un `admin` con la forma paginada del contrato — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 1.6 Añadir a `backend/tests/test_authorization.py` el caso BR-6: usuario real que inicia sesión, se desactiva en la BD y su token vigente recibe 403 `"La cuenta está desactivada"` — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 1.7 Revisar `backend/app/api/deps.py` contra la tabla de permisos (401/403 y mensajes) y confirmar que no requiere cambios — verify: `cd backend && uv run ruff check . && uv run ruff format --check .` en limpio.

## 2. Núcleo de autenticación en Angular

- [x] 2.1 Ampliar `frontend/src/app/core/auth/auth.service.ts` con `UserRole`, `isAuthenticated()` y `restoreSession()` (llama a `/me` si hay token y limpia el token si falla), manteniendo `hasRole(role)` y el resto de la interfaz que usa dev-b — verify: `cd frontend && npx ng build` sin errores.
- [x] 2.2 Crear `frontend/src/app/core/auth/auth-notice.service.ts` con `message` (signal), `show()` y `clear()` para los avisos de sesión y permisos — verify: `cd frontend && npx ng build` sin errores.
- [x] 2.3 Ajustar `frontend/src/app/core/auth/auth.guard.ts` (exige `isAuthenticated()`) y `frontend/src/app/core/auth/role.guard.ts` (roles tipados, aviso `"No tienes permiso para esta acción"` y redirección a `/books`) — verify: `cd frontend && npx ng build` sin errores.
- [x] 2.4 Actualizar `frontend/src/app/core/auth/auth.interceptor.ts` para el 401 global: excluir login y restauración con un `HttpContextToken`, hacer `logout()`, mostrar `"Tu sesión expiró"` y navegar a `/login` — verify: `cd frontend && npx ng build` sin errores.
- [x] 2.5 Ajustar `frontend/src/app/features/auth/login/login.component.ts` para limpiar el aviso al iniciar sesión correctamente y mostrar el mensaje global cuando corresponda — verify: `cd frontend && npx ng build` sin errores.

## 3. Rutas y barra de navegación

- [x] 3.1 Registrar `provideAppInitializer(() => inject(AuthService).restoreSession())` en `frontend/src/app/app.config.ts` (archivo compartido: marcar para revisión de dev-b) — verify: `cd frontend && npx ng build` sin errores.
- [x] 3.2 Aplicar los guards en `frontend/src/app/app.routes.ts` (`/profile`, `/books`, `/books/:id` con `authGuard`; `/books/new`, `/books/:id/edit` con `roleGuard(['librarian','admin'])`; `/users` con `roleGuard(['admin'])`; archivo compartido: marcar para revisión de dev-b) — verify: `cd frontend && npx ng build` sin errores.
- [x] 3.3 Actualizar `frontend/src/app/app.component.ts` con la barra de navegación por sesión/rol, el banner de avisos y el botón "Cerrar sesión" que borra la sesión y navega a `/login` — verify: `cd frontend && npx ng build` sin errores y los enlaces cambian al iniciar y cerrar sesión en una comprobación manual.

## 4. Verificación de integración

- [x] 4.1 Comprobar manualmente en el navegador (con `./scripts/check.sh --full` levantado) los escenarios de interfaz: `/books` sin sesión → `/login`; `reader` en `/users` y `/books/new` → `/books` con `"No tienes permiso para esta acción"`; recarga con sesión → sigue autenticado; logout → token eliminado y `/login`; botón "atrás" tras logout → `/login`; 401 simulado → `"Tu sesión expiró"` — verify: los 6 resultados observables quedan anotados en `progress/dev-a.md`.
- [x] 4.2 Ejecutar `./scripts/check.sh` — verify: termina en `CHECK OK` con pytest, ruff y `ng build` en verde.
- [x] 4.3 Ejecutar `./scripts/check.sh --full` y registrar el resultado en `feature_list.json` (feat-004 con su `evidence`) — verify: `CHECK OK` + `SMOKE OK` y la evidencia escrita en `feature_list.json`.

## Workflow follow-up

- Abrir el PR `feature/feat-004-add-role-authorization` → `develop` y pedir a dev-b la revisión de `app.routes.ts` y `app.config.ts`.
- Ejecutar `/opsx-verify add-role-authorization`; si no hay problemas CRITICAL, `/opsx-archive add-role-authorization` y actualizar `progress/dev-a.md`.
