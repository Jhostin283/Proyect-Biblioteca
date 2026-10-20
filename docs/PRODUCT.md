# Sistema de Gestión de Libros — Documento de producto

Grupo 2 · Dos desarrolladores (dev-a y dev-b), dos máquinas, un solo harness y un solo repositorio.
Este documento es la fuente de verdad del alcance y del reparto. Los requisitos (RF y RNF, sección 2) se agrupan en
features (sección 8); cada feature se convierte en un cambio de OpenSpec (`/opsx-propose <change-name>`) y en una
entrada de `feature_list.json`. Trazabilidad: requisito → feature → cambio de OpenSpec → spec → test.

## 1. Objetivo
Una aplicación web para gestionar un catálogo de libros con usuarios autenticados y permisos por rol,
con infraestructura en AWS creada con Terraform y desplegada automáticamente con GitHub Actions.

## 2. Módulos y responsables
| Módulo | Responsable | Incluye |
|---|---|---|
| Autenticación y Autorización | **dev-a** | Registro, login con JWT, perfil, roles, protección de rutas (API y Angular), administración de usuarios |
| Gestión de Libros | **dev-b** | CRUD de libros, búsqueda, filtro por género, paginación, detalle |
| Infraestructura (Terraform) | **dev-a** | EC2 t3.micro, security group, Elastic IP, user-data |
| Despliegue (GitHub Actions) | **dev-b** | CI en cada Pull Request, despliegue al hacer merge a `main`, smoke test en producción |

### 2.1. Requisitos funcionales
| ID | Requisito | Quién lo usa | Reglas | Feature | Dueño |
|---|---|---|---|---|---|
| RF-01 | Registrar una cuenta con email, nombre completo y contraseña; la cuenta nace con rol `reader` | cualquier visitante | BR-1, BR-2, BR-5 | feat-003 | dev-a |
| RF-02 | Iniciar sesión con email y contraseña y recibir un token de acceso | cualquier usuario | BR-3, BR-4, BR-6 | feat-003 | dev-a |
| RF-03 | Ver el perfil propio (email, nombre, rol) | usuario autenticado | — | feat-003 | dev-a |
| RF-04 | Crear automáticamente el administrador inicial al arrancar el sistema | sistema | BR-8 | feat-003 | dev-a |
| RF-05 | Restringir cada operación de la API según el rol (401 sin sesión, 403 sin permiso) | sistema | sección 3 | feat-004 | dev-a |
| RF-06 | Mostrar u ocultar páginas y botones según la sesión y el rol, y cerrar sesión | usuario autenticado | sección 3 | feat-004 | dev-a |
| RF-07 | Listar y buscar usuarios | admin | — | feat-005 | dev-a |
| RF-08 | Cambiar el rol de un usuario | admin | BR-7 | feat-005 | dev-a |
| RF-09 | Activar o desactivar un usuario | admin | BR-6, BR-7 | feat-005 | dev-a |
| RF-10 | Registrar un libro (ISBN, título, autor, género, año, descripción) | librarian, admin | BR-9, BR-10, BR-11 | feat-007 | dev-b |
| RF-11 | Editar los datos de un libro | librarian, admin | BR-9, BR-10 | feat-007 | dev-b |
| RF-12 | Eliminar un libro, con confirmación en la interfaz | librarian, admin | — | feat-007 | dev-b |
| RF-13 | Listar el catálogo de libros con paginación | usuario autenticado | BR-12 | feat-008 | dev-b |
| RF-14 | Buscar libros por título o autor | usuario autenticado | — | feat-008 | dev-b |
| RF-15 | Filtrar libros por género | usuario autenticado | — | feat-008 | dev-b |
| RF-16 | Ver el detalle de un libro | usuario autenticado | — | feat-008 | dev-b |

### 2.2. Requisitos no funcionales
| ID | Categoría | Requisito | Cómo se verifica | Feature | Dueño |
|---|---|---|---|---|---|
| RNF-01 | Seguridad | Contraseñas con hash argon2; tokens JWT firmados (HS256) que vencen a los 60 min; secretos solo en variables de entorno, nunca en el repositorio | Tests de auth; revisión de `.gitignore` y `/adr-review` | feat-003 | dev-a |
| RNF-02 | Seguridad | En el servidor solo están abiertos el puerto 80 (público) y el 22 (solo la IP del administrador); PostgreSQL nunca se expone | `terraform plan` y security group | feat-006 | dev-a |
| RNF-03 | Infraestructura como código | Toda la infraestructura de AWS se crea y destruye con Terraform, de forma reproducible | `terraform validate` en `check.sh`; `terraform plan` sin cambios después del apply | feat-006 | dev-a |
| RNF-04 | Integración y despliegue continuos | Cada Pull Request ejecuta los sensores; cada merge a `main` despliega automáticamente en la EC2 y ejecuta un smoke test | GitHub Actions en verde | feat-009 | dev-b |
| RNF-05 | Calidad | Cada endpoint tiene tests de éxito, 401, 403, 404 y 422 según corresponda; lint (ruff) y build de Angular sin errores | `./scripts/check.sh` termina en `CHECK OK` | todas | ambos |
| RNF-06 | Capacidad | El sistema completo funciona en una EC2 t3.micro (1 GB de RAM): BD 320 MB, backend 256 MB, Nginx 64 MB | `docker stats` en la EC2 | feat-009 | dev-b |
| RNF-07 | Rendimiento | El listado y la búsqueda de libros responden en menos de 1 segundo con 1 000 libros (índices en `isbn`, `title` y `author`) | Medición con `curl -w '%{time_total}'` | feat-008 | dev-b |
| RNF-08 | Disponibilidad | Los contenedores se reinician solos (`restart: unless-stopped`) y la API expone `GET /api/health` | `docker compose ps` y smoke test | feat-001 | compartido |
| RNF-09 | Usabilidad | Interfaz y mensajes de error en español, con estados de carga, vacío y error en cada página | Revisión en la demo | todas | ambos |
| RNF-10 | Mantenibilidad | Arquitectura en capas; cada cambio documentado en OpenSpec y cada decisión estructural en un ADR | `openspec validate --all` y `/adr-review` | todas | ambos |

## 3. Roles y permisos
| Acción | `reader` | `librarian` | `admin` |
|---|---|---|---|
| Registrarse, iniciar sesión, ver su perfil | ✔ | ✔ | ✔ |
| Listar, buscar y ver libros | ✔ | ✔ | ✔ |
| Crear, editar y eliminar libros | ✖ (403) | ✔ | ✔ |
| Listar usuarios, cambiar roles, activar/desactivar | ✖ (403) | ✖ (403) | ✔ |

Sin token o con token inválido/vencido → 401. Con token válido pero sin el rol necesario → 403.

## 4. Modelo de datos (se define una sola vez en el contrato compartido — feat-002)
```text
User 1 ───< Book (created_by)
```
| Tabla | Campos | Reglas |
|---|---|---|
| `users` | `id`, `email` (único), `full_name`, `hashed_password`, `role` (`reader`/`librarian`/`admin`), `is_active`, `created_at` | Email válido; la contraseña nunca se guarda ni se devuelve en texto plano |
| `books` | `id`, `isbn` (único), `title`, `author`, `genre`, `publication_year`, `description` (opcional), `created_by` (FK a `users.id`), `created_at`, `updated_at` | ISBN de 10 o 13 dígitos; título y autor obligatorios |

## 5. Reglas de negocio
| ID | Módulo | Regla |
|---|---|---|
| BR-1 | Auth | El email de un usuario es único (409 si se repite). |
| BR-2 | Auth | La contraseña tiene al menos 8 caracteres, con al menos una letra y un número (422). |
| BR-3 | Auth | Las contraseñas se guardan con hash (argon2) y nunca aparecen en una respuesta. |
| BR-4 | Auth | El token JWT (HS256) vence a los 60 minutos; el secreto viene de la variable de entorno `JWT_SECRET`. |
| BR-5 | Auth | El auto-registro siempre crea usuarios con rol `reader`; solo un `admin` cambia roles. |
| BR-6 | Auth | Un usuario inactivo no puede iniciar sesión (403) y sus tokens dejan de ser válidos. |
| BR-7 | Auth | Un `admin` no puede quitarse su propio rol ni desactivarse a sí mismo (409). |
| BR-8 | Auth | Al arrancar, si no existe ningún `admin`, se crea uno con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. |
| BR-9 | Libros | El ISBN de un libro es único (409 si se repite). |
| BR-10 | Libros | `publication_year` está entre 1450 y el año actual (422). |
| BR-11 | Libros | `created_by` se toma del usuario autenticado, nunca del cuerpo de la petición. |
| BR-12 | Libros | Los listados se paginan: `page` desde 1 y `size` de 1 a 50 (por defecto 10). |

## 6. Contrato de la API (todas las rutas bajo `/api`, mensajes de error en español)
| Dueño | Método y ruta | Permiso | Propósito | Códigos |
|---|---|---|---|---|
| compartido | `GET /api/health` | público | Estado de la API | 200 |
| dev-a | `POST /api/auth/register` | público | Registro `{email, full_name, password}` → usuario `reader` | 201, 409, 422 |
| dev-a | `POST /api/auth/login` | público | Login `{email, password}` → `{access_token, token_type: "bearer", expires_in}` | 200, 401, 403 |
| dev-a | `GET /api/auth/me` | autenticado | Perfil del usuario actual | 200, 401 |
| dev-a | `GET /api/users?q=&page=&size=` | admin | Listar usuarios | 200, 401, 403 |
| dev-a | `PATCH /api/users/{id}` | admin | Cambiar `role` y/o `is_active` (BR-7) | 200, 401, 403, 404, 409, 422 |
| dev-b | `GET /api/books?q=&genre=&page=&size=` | autenticado | Buscar (título o autor contiene `q`), filtrar y paginar → `{items, total, page, size}` | 200, 401 |
| dev-b | `GET /api/books/genres` | autenticado | Lista de géneros existentes (para el filtro) | 200, 401 |
| dev-b | `GET /api/books/{id}` | autenticado | Detalle del libro | 200, 401, 404 |
| dev-b | `POST /api/books` | librarian, admin | Crear libro | 201, 401, 403, 409, 422 |
| dev-b | `PUT /api/books/{id}` | librarian, admin | Actualizar libro | 200, 401, 403, 404, 409, 422 |
| dev-b | `DELETE /api/books/{id}` | librarian, admin | Eliminar libro | 204, 401, 403, 404 |

### Interfaz entre módulos (backend)
dev-a la implementa y dev-b la usa. Sus firmas se fijan en el contrato (feat-002), en `app/api/deps.py`:
```python
def get_current_user(...) -> User          # 401 si no hay token válido; 403 si el usuario está inactivo
def require_roles(*roles: Role) -> Callable # dependencia que devuelve el usuario o lanza 403
```
dev-b protege sus rutas con `Depends(require_roles(Role.librarian, Role.admin))` o `Depends(get_current_user)` y, en sus tests,
reemplaza `get_current_user` con la fixture `auth_as(role)` de `tests/conftest.py` (ver `docs/TESTING.md`).
Así dev-b avanza en paralelo sin esperar a que el login real esté terminado.

### Interfaz entre módulos (frontend)
| Pieza (en `src/app/core/auth/`) | La implementa | La usa |
|---|---|---|
| `AuthService` (`currentUser` signal, `login()`, `logout()`, `hasRole()`) | dev-a | dev-b (mostrar u ocultar botones de edición) |
| `authInterceptor` (agrega `Authorization: Bearer <token>`) | dev-a | todas las llamadas HTTP |
| `authGuard` y `roleGuard(roles)` | dev-a | rutas de dev-b (`/books/new`, `/books/:id/edit`) |

## 7. Rutas del frontend (Angular, textos en español)
| Dueño | Ruta | Página | Acceso |
|---|---|---|---|
| compartido | `/` | Inicio: estado de la API y accesos | público |
| dev-a | `/login`, `/register` | Inicio de sesión y registro | público |
| dev-a | `/profile` | Perfil del usuario | autenticado |
| dev-a | `/users` | Administración de usuarios (rol y estado) | admin |
| dev-b | `/books` | Catálogo con buscador, filtro por género y paginación | autenticado |
| dev-b | `/books/:id` | Detalle del libro | autenticado |
| dev-b | `/books/new`, `/books/:id/edit` | Formulario de libro | librarian, admin |

## 8. Features y dueños
| ID | Feature | Requisitos | Dueño | Cambio de OpenSpec | Depende de |
|---|---|---|---|---|---|
| feat-001 | Esqueleto del proyecto y health check | RNF-08 | dev-b | `bootstrap-project` | — |
| feat-002 | Contrato: tablas, roles, interfaz de auth, routers y rutas vacías | base de RF-01 a RF-16 | compartido (maneja dev-a, revisa dev-b) | `define-domain-contract` | feat-001 |
| feat-003 | Registro, login con JWT y perfil (BR-1 a BR-6, BR-8) | RF-01 a RF-04, RNF-01 | dev-a | `add-user-authentication` | feat-002 |
| feat-004 | Autorización por roles en la API y en Angular (guards, interceptor) | RF-05, RF-06 | dev-a | `add-role-authorization` | feat-003 |
| feat-005 | Administración de usuarios (BR-7) | RF-07 a RF-09 | dev-a | `add-user-administration` | feat-004 |
| feat-006 | Infraestructura AWS con Terraform | RNF-02, RNF-03 | dev-a | `provision-aws-infrastructure` | — |
| feat-007 | CRUD de libros con permisos por rol (BR-9 a BR-11) | RF-10 a RF-12 | dev-b | `add-book-management` | feat-002 |
| feat-008 | Búsqueda, filtro por género, paginación y detalle (BR-12) | RF-13 a RF-16, RNF-07 | dev-b | `add-book-search` | feat-007 |
| feat-009 | CI/CD con GitHub Actions: checks en PR, deploy al hacer merge, smoke test | RNF-04, RNF-06 | dev-b | `setup-continuous-deployment` | feat-001, feat-006 |
| feat-010 | Release: integración, despliegue y demo | todos | compartido | `release-v1` | todas |

## 8.1. Specs ya escritos (openspec/changes/)
Los requisitos de cada feature ya están redactados como cambios de OpenSpec (proposal + specs). El agente **no los
reescribe**: genera `design.md` y `tasks.md` con `/opsx-ff <cambio>` y luego implementa con `/opsx-apply <cambio>`.

| Cambio | Dueño | Capacidad (spec) | Requisitos | Escenarios |
|---|---|---|---|---|
| `bootstrap-project` | dev-b | `platform-health` | 4 | 8 |
| `define-domain-contract` | dev-a (revisa dev-b) | — (estructural, trae `design.md`) | — | — |
| `provision-aws-infrastructure` | dev-a | `infrastructure` | 5 | 11 |
| `add-user-authentication` | dev-a | `authentication` | 6 | 15 |
| `add-role-authorization` | dev-a | `authorization` | 5 | 12 |
| `add-user-administration` | dev-a | `user-administration` | 5 | 11 |
| `add-book-management` | dev-b | `books` | 8 | 19 |
| `add-book-search` | dev-b | `book-search` | 5 | 13 |
| `setup-continuous-deployment` | dev-b | `deployment` | 6 | 11 |
| **Total** | **dev-a: 21 requisitos y 49 escenarios + contrato · dev-b: 23 requisitos y 51 escenarios** | | | |

## 9. Cómo trabajan las dos máquinas
1. **Fase 0 (≈25 min).** En paralelo: **dev-b** hace feat-001 (esqueleto) y **dev-a** hace feat-006 (Terraform, no depende de nada).
   Luego **dev-a** maneja feat-002 (contrato) y dev-b lo revisa en el Pull Request. El contrato crea:
   - **las tablas `users` y `books` en una sola migración de Alembic** y el enum `Role`;
   - los schemas de Pydantic compartidos;
   - `app/api/deps.py` con las firmas de `get_current_user` y `require_roles`, y la fixture `auth_as(role)` en `tests/conftest.py`;
   - los routers vacíos de `auth`, `users` y `books`, ya registrados en `app/main.py`;
   - las rutas lazy de Angular y los archivos vacíos de `core/auth/`, ya referenciados en `app.routes.ts` y `app.config.ts`.

   Después del merge a `main`, nadie necesita volver a tocar esos archivos compartidos y no habrá dos heads de Alembic.
2. **Fase 1 — en paralelo.**
   - dev-a: feat-003 → feat-004 → feat-005 (Terraform ya quedó listo en la fase 0).
   - dev-b: feat-007 → feat-008 → feat-009 (la EC2 de feat-006 ya existe).

   Cada uno trabaja en una rama `feat/<change-name>` y abre un Pull Request; el CI debe estar en verde para integrar.
   Antes de abrir el PR: `/sync` y `./scripts/check.sh`.
3. **Fase 2 — juntos.** feat-010: integrar todo, desplegar desde `main`, smoke test en la EC2 y demo
   (registrarse, ver que un `reader` no puede crear libros, iniciar sesión como `admin`, cambiar el rol, crear un libro, buscarlo).

### Dueños de archivos (evita conflictos de merge)
| Dueño | Rutas |
|---|---|
| dev-a | `backend/app/**/auth*`, `backend/app/**/user*`, `backend/app/core/security.py`, implementación de `backend/app/api/deps.py`, `frontend/src/app/core/auth/**`, `frontend/src/app/features/auth/**`, `frontend/src/app/features/users/**`, `infra/terraform/**` |
| dev-b | `backend/app/**/book*`, `frontend/src/app/features/books/**`, `.github/workflows/**`, `docs/DEPLOYMENT.md` |
| compartido (solo por PR que revisa el otro) | `app/main.py`, `app/models/__init__.py`, `alembic/versions/**`, `tests/conftest.py`, `app.routes.ts`, `app.config.ts`, `docker-compose*.yml`, `.env.example`, `AGENTS.md`, `openspec/config.yaml`, `docs/PRODUCT.md` |

### Reglas de coordinación
- Una sola feature activa **por dueño** en `feature_list.json`; al empezar, pon `status` y `openspec_change`.
- Las notas de sesión van en `progress/<owner>.md` (un archivo por máquina, así nunca chocan).
- Una columna nueva después del contrato: crea la migración **después** de actualizarte con `main`; si `alembic heads`
  muestra dos heads, ejecuta `uv run alembic merge heads -m "merge heads"` y haz commit.
- El estado de Terraform vive solo en la máquina de dev-a: solo dev-a ejecuta `terraform plan/apply/destroy`
  y carga los secrets `EC2_HOST`, `EC2_USER` y `EC2_SSH_KEY`.
- El despliegue se hace solo desde `main` (lo configura dev-b en feat-009).

## 10. Variables de entorno
| Variable | Uso | Local (`.env`) | Producción (`~/app/.env` en la EC2) |
|---|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | la arma docker compose | la arma docker compose |
| `JWT_SECRET` | Firma de los tokens (BR-4) | valor de ejemplo | aleatorio, lo genera `user-data.sh` |
| `JWT_EXPIRE_MINUTES` | Vigencia del token | 60 | 60 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin inicial (BR-8) | valores de ejemplo | `admin@library.local` y una contraseña aleatoria (`cat ~/app/.env` en la EC2) |

## 11. Fuera de alcance (v1)
Recuperación de contraseña por email, refresh tokens, login con Google, préstamos, subida de portadas, auditoría.
