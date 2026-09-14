from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Shared declarative base — every module's models.py registers its
    tables on this same metadata so Alembic autogenerate and cross-module
    foreign keys resolve correctly without modules importing each other."""


engine = create_engine(get_settings().database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped session.

    Explicitly rolling back on the way out matters: if a route raises after
    a failed flush/commit (e.g. an IntegrityError), the session is left in
    an invalid state. Without this rollback, closing it here can itself
    re-attempt the failed statement and raise a second exception during
    dependency teardown — which happens after the route's own exception was
    already handled and its response sent, so it can't be turned into a
    response; it just propagates to the ASGI server as a bare, unrouted
    error, unlike the first exception it wasn't run through CORSMiddleware.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
