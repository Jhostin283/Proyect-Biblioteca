# Tasks

## 1. Datos y schemas

- [x] 1.1 Añadir `list_users(db, q, page, size)` y `update(db, user, data)` a `backend/app/repositories/user_repository.py` (filtro `ilike` por email/nombre, orden por `id`, count y offset/limit) — verify: `cd backend && uv run pytest -q` sigue en verde.
- [x] 1.2 Añadir `UserUpdate` (role/is_active opcionales) y `PaginatedUsersResponse` a `backend/app/schemas/user.py` — verify: `cd backend && uv run ruff check . && uv run pytest -q` en verde.

## 2. Lógica y API de usuarios

- [x] 2.1 Crear `backend/app/services/user_service.py` con `list_users`, `update_user` y las excepciones `UserNotFoundError`, `SelfRoleRemovalError` y `SelfDeactivationError` (BR-7) — verify: `cd backend && uv run ruff check .` en limpio.
- [x] 2.2 Reemplazar el marcador de `backend/app/api/routes/users.py` por `GET /api/users` con `q/page/size` y `PATCH /api/users/{id}`, traduciendo las excepciones a 404/409 con los mensajes de la spec — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa (tras el ajuste de 2.3).
- [x] 2.3 Ajustar en `backend/tests/test_authorization.py` la expectativa de `test_admin_can_list_users` para que valide 200 y la forma `{items, total, page, size}` del listado real — verify: `cd backend && uv run pytest tests/test_authorization.py -q` pasa.
- [x] 2.4 Crear `backend/tests/test_users.py` con listado admin, búsqueda `?q=ana`, paginación, 403 de librarian y 401 sin token — verify: `cd backend && uv run pytest tests/test_users.py -q` pasa.
- [x] 2.5 Añadir a `backend/tests/test_users.py` la promoción a librarian (y que el usuario puede crear un libro), rol `superuser` → 422 y usuario inexistente → 404 `"Usuario no encontrado"` — verify: `cd backend && uv run pytest tests/test_users.py -q` pasa.
- [x] 2.6 Añadir a `backend/tests/test_users.py` BR-7 (auto-degradarse y auto-desactivarse → 409 con los mensajes exactos) y el ciclo desactivar → 403 `"La cuenta está desactivada"` → reactivar → login 200 — verify: `cd backend && uv run pytest tests/test_users.py -q` pasa.

## 3. Página de administración en Angular

- [x] 3.1 Crear `frontend/src/app/features/users/user.service.ts` con los tipos `AdminUser`/`PaginatedUsers` y los métodos `list(q, page, size)` y `update(id, changes)` contra rutas relativas `/api/users` — verify: `cd frontend && npx ng build` sin errores.
- [x] 3.2 Implementar `frontend/src/app/features/users/user-list/user-list.component.ts` con tabla, buscador, paginación, selector de rol ("Rol actualizado") e interruptor de estado que revierte y muestra el `detail` ante un 409 (estados de carga, vacío y error) — verify: `cd frontend && npx ng build` sin errores.

## 4. Verificación de integración

- [x] 4.1 Comprobar manualmente en Chromium con el stack levantado: admin entra en `/users`, busca, cambia un rol y ve "Rol actualizado", desactiva y reactiva a otro usuario, e intenta desactivarse a sí mismo viendo el error con el interruptor revertido — verify: los resultados observables quedan anotados en `progress/dev-a.md`.
- [x] 4.2 Ejecutar `./scripts/check.sh` — verify: termina en `CHECK OK` con pytest, ruff y `ng build` en verde.
- [x] 4.3 Ejecutar `./scripts/check.sh --full` y registrar el resultado en `feature_list.json` (feat-005 con su `evidence`) — verify: `CHECK OK` + `SMOKE OK` y la evidencia escrita en `feature_list.json`.

## Workflow follow-up

- Abrir el PR `feature/feat-005-add-user-administration` → `develop`.
- Ejecutar `/opsx-verify add-user-administration`; si no hay problemas CRITICAL, `/opsx-archive add-user-administration` y actualizar `progress/dev-a.md`.
