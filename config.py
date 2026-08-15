from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App meta
    app_title: str = "Inner Circle FastAPI"
    app_version: str = "0.0.1"
    app_description: str = "API for the Inner Circle application."

    # OAuth settings
    secret_key: str = "secretkey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Database settings
    database_url: str = "sqlite+aiosqlite:///./dev.db"

    # Superuser settings
    superuser_username: str = "admin"
    superuser_email: str = "admin@example.com"
    superuser_password: str = "pass1234"

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


settings = Settings()
