# Tasks

## 1. Preparación

- [x] 1.1 Ajustar la descripción de feat-004 en `feature_list.json` (la implementación real de `get_current_user` queda en feat-003, ver design D3) — verify: `grep -A1 '"id": "feat-004"' feature_list.json` muestra la descripción sin "implementación real de get_current_user".

## 2. Capa de datos y seguridad

- [x] 2.1 Crear `backend/app/core/security.py` con `hash_password` y `verify_password` (argon2 vía `pwdlib`) — verify: `cd backend && uv run python -c "from app.core.security import hash_password, verify_password; h = hash_password('Lectura2026'); print(h.startswith('\$argon2'), verify_password('Lectura2026', h))"` imprime `True True`.
- [x] 2.2 Agregar `create_access_token` y `decode_token` (HS256, claims `sub`, `iat`, `exp` desde `JWT_SECRET` y `JWT_EXPIRE_MINUTES`) en `backend/app/core/security.py` — verify: `cd backend && uv run python -c "from app.core.security import create_access_token, decode_token; t = create_access_token(1); print(decode_token(t))"` devuelve `1` y un token expirado lanza error.
- [x] 2.3 Crear `backend/app/repositories/user_repository.py` con `get_by_email`, `exists_admin` y `add` (única capa que consulta `users`) — verify: `cd backend && uv run python -c "from app.repositories.user_repository import UserRepository; print(sorted(n for n in dir(UserRepository) if not n.startswith('_')))"` incluye los tres métodos.
- [x] 2.4 Agregar `backend/tests/test_security.py`: round-trip de hash argon2, que el hash no contiene la contraseña, round-trip del token y rechazo de un token firmado con otra clave — verify: `cd backend && uv run pytest tests/test_security.py -q` termina en 0 fallos.

## 3. Lógica de negocio (schemas y servicio)

- [x] 3.1 Crear `backend/app/schemas/auth.py` con `LoginRequest` (`email`, `password`) y `RegisterRequest` (extiende `UserCreate`) con validador BR-2 de la contraseña (≥8 caracteres, una letra y un número, mensaje en español) — verify: `cd backend && uv run python -c "from app.schemas.auth import RegisterRequest; RegisterRequest(email='a@b.co', full_name='Ana', password='Lectura2026'); print('ok')"` y el intento con `"12345678"` lanza `ValidationError` con el mensaje de BR-2.
- [x] 3.2 Crear `backend/app/services/auth_service.py` con `register` (rol fijo `reader`), `authenticate` (contraseña incorrecta, usuario inexistente e inactivo vía excepciones de dominio) y `ensure_initial_admin` (BR-8, idempotente) — verify: `cd backend && uv run python -c "from app.services.auth_service import register, authenticate, ensure_initial_admin; print('ok')"` importa sin errores.
- [x] 3.3 Agregar `backend/tests/test_auth_service.py`: registro crea `reader` con hash argon2, email duplicado lanza `EmailAlreadyRegisteredError`, `authenticate` distingue credenciales inválidas de cuenta inactiva y `ensure_initial_admin` crea el admin solo la primera vez — verify: `cd backend && uv run pytest tests/test_auth_service.py -q` termina en 0 fallos.

## 4. API

- [x] 4.1 Escribir `backend/tests/test_auth.py` con un test por cada escenario de la spec que ocurre en la API (13: registro, hash, login, perfil e admin inicial; los 2 escenarios de interfaz los cubren `ng build` y el smoke test) — verify: `cd backend && uv run pytest tests/test_auth.py --collect-only -q` lista los tests de los 5 requisitos de backend.
- [x] 4.2 Reemplazar el stub de `get_current_user` en `backend/app/api/deps.py` por la implementación real (401 `"No autenticado"` sin token/inválido/vencido; 403 `"La cuenta está desactivada"` si `is_active` es falso) sin cambiar la firma — verify: `cd backend && uv run pytest tests/test_auth.py -q -k "me"` pasa.
- [x] 4.3 Implementar `POST /api/auth/register` en `backend/app/api/routes/auth.py` (201 con `UserRead` y rol `reader`; 409 `"El email ya está registrado"`; 422 de BR-2; campo `role` ignorado) — verify: `cd backend && uv run pytest tests/test_auth.py -q -k "register"` pasa.
- [x] 4.4 Implementar `POST /api/auth/login` en `backend/app/api/routes/auth.py` (200 con `access_token`, `token_type: "bearer"`, `expires_in`; 401 con el mismo mensaje para email inexistente y contraseña errónea; 403 si la cuenta está desactivada) — verify: `cd backend && uv run pytest tests/test_auth.py -q -k "login"` pasa.
- [x] 4.5 Implementar `GET /api/auth/me` en `backend/app/api/routes/auth.py` (200 con el perfil; 401 sin token o token vencido) — verify: `cd backend && uv run pytest tests/test_auth.py -q -k "me"` pasa.
- [x] 4.6 Registrar el `lifespan` que llama a `ensure_initial_admin` en `backend/app/main.py` (archivo compartido: una línea más el import; la sesión respeta `app.dependency_overrides[get_db]`) — verify: `cd backend && uv run pytest tests/test_auth.py -q -k "admin"` pasa y `uv run pytest -q` no deja ningún test roto.

## 5. Interfaz de Angular

- [x] 5.1 Agregar `login()`, `register()` y `me()` a `frontend/src/app/core/auth/auth.service.ts` (rutas relativas `/api/auth/...`, token en `localStorage` con la clave `token`, actualiza `currentUser`) — verify: `cd frontend && npx ng build` termina sin errores TS.
- [x] 5.2 Completar `frontend/src/app/features/auth/login/login.component.ts` con formulario reactivo, error `"Email o contraseña incorrectos"` en español sin recargar y navegación a `/books` al tener token — verify: `cd frontend && npx ng build` termina sin errores TS.
- [x] 5.3 Completar `frontend/src/app/features/auth/register/register.component.ts` con formulario reactivo, muestra el `detail` del 409 y la validación en español del 422, y tras registrar lleva a `/login` — verify: `cd frontend && npx ng build` termina sin errores TS.
- [x] 5.4 Completar `frontend/src/app/features/auth/profile/profile.component.ts`: carga el perfil con `me()` y, ante un 401, hace `logout()` y navega a `/login` — verify: `cd frontend && npx ng build` termina sin errores TS.

## 6. Verificación de integración

- [x] 6.1 Confirmar que ninguna respuesta de `/api/auth/*` incluye `password` ni `hashed_password` y que los códigos y mensajes coinciden con `docs/PRODUCT.md` §6 — verify: `cd backend && uv run pytest tests/test_auth.py -q` en verde y `uv run ruff check . && uv run ruff format --check .` sin observaciones.
- [x] 6.2 Ejecutar `./scripts/check.sh --full` y registrar el resultado en `feature_list.json`
- [x] 6.3 Aceptar en la API los dominios special-use del contrato (`ADMIN_EMAIL=admin@library.local`):
      `EmailField` en `app/schemas/user.py` (fallback para `.local`, aún rechaza emails malformados) y
      `LoginRequest.email`; tests de regresión de BR-8 en `tests/test_auth.py` — verify:
      `uv run pytest tests/test_auth.py -q` en verde y login `admin@library.local` en vivo → 200.

## Workflow follow-up

- Abrir el Pull Request `feature/add-user-authentication` → `develop` con el CI en verde (revisa dev-b `app/main.py`).
- Después de `/sync` y la revisión, ejecutar `/opsx-verify add-user-authentication` y, sin problemas CRITICAL, `/opsx-archive add-user-authentication`.
