from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def liveness() -> dict[str, str]:
    """Plain liveness check — no dependencies, always fast. Proves the API
    process itself is up (used by the frontend connectivity check and by
    infra health checks that shouldn't fail just because the DB is slow)."""
    return {"status": "ok"}


@router.get("/health/db")
def readiness(db: Session = Depends(get_db)) -> dict[str, str]:
    """Readiness check — confirms the database connection actually works."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
