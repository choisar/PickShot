from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pickshot"

    # AI Models
    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    DEVICE: str = "cpu"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
