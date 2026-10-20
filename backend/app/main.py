from collections.abc import AsyncIterator, Generator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.routes import auth, books, users
from app.core.database import get_db
from app.services.auth_service import ensure_initial_admin


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    # BR-8: al arrancar crea el admin inicial si no existe ninguno.
    # Usa la sesión de get_db (o su override en los tests) y no interrumpe el
    # arranque si la base de datos no responde: el próximo reinicio reintenta.
    session_source = application.dependency_overrides.get(get_db) or get_db
    session_gen: Generator[Session, None, None] = session_source()
    try:
        ensure_initial_admin(next(session_gen))
    except Exception as exc:
        print(f"No se pudo crear el admin inicial: {exc}")
    finally:
        session_gen.close()
    yield


app = FastAPI(
    title="Sistema de Gestión de Libros API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(books.router)

app.include_router(api_router)
