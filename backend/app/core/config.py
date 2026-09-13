from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, read from environment variables.

    Mirrors the contract documented in .env.example — every variable the
    app reads has a corresponding entry there.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "local"
    database_url: str = (
        "postgresql+psycopg://formcraft:formcraft_local_password@localhost:5432/formcraft"
    )
    cors_origins: str = "http://localhost:5173"

    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""
    cognito_region: str = ""

    # Local-only auth stand-in (see app/core/security.py) so Phase 2 is
    # testable end-to-end before a real Cognito user pool is provisioned.
    # Never used outside `environment == "local"` — see auth_mode below.
    local_auth_secret: str = "local-dev-only-secret-change-me-please-32b"
    local_auth_token_expire_minutes: int = 60 * 24

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cognito_configured(self) -> bool:
        return bool(
            self.cognito_user_pool_id and self.cognito_app_client_id and self.cognito_region
        )

    @property
    def auth_mode(self) -> str:
        """'cognito' when a user pool is configured, otherwise 'local' — the
        local dev-login stand-in. Only ever falls back to 'local' when
        environment == 'local'; see the startup guard in app/main.py."""
        return "cognito" if self.cognito_configured else "local"


@lru_cache
def get_settings() -> Settings:
    return Settings()
