import os
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App meta
    app_title: str = "Inner Circle FastAPI"
    app_version: str = "0.0.1"
    app_description: str = "API for the Inner Circle application."
    app_env: str = "dev"

    # OAuth settings
    secret_key: str = "secretkey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Database settings
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    test_database_url: str = "sqlite+aiosqlite://"

    # Superuser settings
    superuser_username: str = "admin"
    superuser_email: str = "admin@example.com"
    superuser_password: str = "pass1234"
    create_superuser_on_startup: bool = False

    # CORS settings
    cors_allow_origins: list[str] = ["*"]
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    # Media settings
    upload_directory: str = "uploads"
    uploads_mount_path: str = "/uploads"
    base_url: str = "http://localhost:8000"

    # Logs settings
    log_file: str | None = "requests.log"
    log_max_bytes: int = 1024 * 1024
    log_backup_count: int = 3
    debug: bool = False

    @property
    def is_test_environment(self) -> bool:
        env_name = (os.getenv("APP_ENV") or self.app_env or "").strip().lower()
        return (
            env_name == "test"
            or "PYTEST_CURRENT_TEST" in os.environ
            or "pytest" in sys.modules
        )

    @property
    def effective_database_url(self) -> str:
        if self.is_test_environment:
            return self.test_database_url
        return self.database_url


settings = Settings()
