from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db_registry as _db_registry  # noqa: F401
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.modules.auth.router import router as auth_router
from app.modules.common.router import router as common_router
from app.modules.form_builder.router import router as form_builder_router
from app.modules.forms.router import router as forms_router
from app.modules.users.router import router as users_router

# _db_registry (imported above) registers every module's models on the
# shared mapper registry before any request can trigger a query — without
# it, SQLAlchemy fails the first query that touches a cross-module
# relationship (e.g. Form.sections -> FormSection) because the referenced
# class was never imported. Named with a leading underscore since it's
# imported purely for its import-time side effect, not used directly.

settings = get_settings()

if settings.environment != "local" and settings.auth_mode == "local":
    # The local dev-login stand-in (see app/core/security.py) must never be
    # reachable outside local development — refuse to start rather than
    # silently exposing an unauthenticated way to mint tokens.
    raise RuntimeError(
        "COGNITO_USER_POOL_ID / COGNITO_APP_CLIENT_ID / COGNITO_REGION must be set "
        f"when ENVIRONMENT={settings.environment!r}."
    )

app = FastAPI(title="Formcraft API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(common_router)
app.include_router(users_router)
app.include_router(forms_router)
app.include_router(form_builder_router)

if settings.auth_mode == "local":
    app.include_router(auth_router)
