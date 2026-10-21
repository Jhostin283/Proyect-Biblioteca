# Design

## Context
Ver proposal.md (Why). Hay un esqueleto de FastAPI y Angular (feat-001) sin dominio. Dos desarrolladores necesitan
implementar Autenticación (dev-a) y Libros (dev-b) en paralelo, en máquinas distintas.

## Goals / Non-Goals

**Goals:**
- Un único punto de verdad para tablas, roles e interfaz de autenticación.
- Que ninguno de los dos necesite editar `main.py`, `app.routes.ts` ni Alembic durante su trabajo.

**Non-Goals:**
- Implementar login, JWT ni reglas de libros.

## Decisions

### Decision 1: Modelo de datos (SQLAlchemy 2, `Mapped[]`)
```python
class Role(str, enum.Enum):
    reader = "reader"
    librarian = "librarian"
    admin = "admin"

class User(Base):            # tabla users
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role, native_enum=False), default=Role.reader)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

class Book(Base):            # tabla books
    id: Mapped[int] = mapped_column(primary_key=True)
    isbn: Mapped[str] = mapped_column(String(13), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    author: Mapped[str] = mapped_column(String(120), index=True)
    genre: Mapped[str] = mapped_column(String(60), index=True)
    publication_year: Mapped[int]
    description: Mapped[str | None] = mapped_column(Text, default=None)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
```
`native_enum=False` guarda el rol como texto: funciona igual en PostgreSQL y en el SQLite de los tests.
Alternativa descartada: enum nativo de PostgreSQL (rompe los tests con SQLite).

### Decision 2: Interfaz de autenticación (`app/api/deps.py`)
```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    # Temporal hasta feat-004: siempre 401 "No autenticado"
    ...

def require_roles(*roles: Role) -> Callable[..., User]:
    # Devuelve una dependencia que obtiene el usuario con get_current_user
    # y lanza 403 "No tienes permiso para esta acción" si su rol no está en roles
    ...
```
`oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)`.
dev-b protege sus rutas solo con estas dos funciones; dev-a reemplaza el cuerpo de `get_current_user` en feat-004.

### Decision 3: Fixture de pruebas `auth_as(role)` en `tests/conftest.py`
Reemplaza `get_current_user` con un `User` en memoria del rol pedido (plantilla en `docs/TESTING.md`).
Los tests de libros nunca generan tokens reales.

### Decision 4: Registro de routers y rutas
- `app/main.py`: `include_router` de `auth` (prefijo `/auth`), `users` (`/users`) y `books` (`/books`), todos bajo `/api`.
- `app.routes.ts`: rutas lazy a `features/auth/login`, `features/auth/register`, `features/auth/profile`,
  `features/users/user-list`, `features/books/book-list`, `features/books/book-detail`, `features/books/book-form`.
- `app.config.ts`: `provideHttpClient(withInterceptors([authInterceptor]))`.

## Risks / Trade-offs
- [Si una feature necesita otra columna] → se agrega con una migración nueva después de `/sync`; si hay dos heads, `alembic merge heads`.
- [El `get_current_user` temporal devuelve 401 en producción hasta feat-004] → aceptable: el despliegue real llega en feat-009.

## Migration Plan
- Una migración `create users and books tables`. Rollback: `alembic downgrade -1`.
