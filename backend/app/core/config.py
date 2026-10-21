from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://app:app@localhost:5432/app"
    JWT_SECRET: str = "dev-secret-change-me-dev-secret-change-me"
    JWT_EXPIRE_MINUTES: int = 60
    ADMIN_EMAIL: str = "admin@library.local"
    ADMIN_PASSWORD: str = "Admin12345"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
