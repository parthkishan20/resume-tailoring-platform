# backend/app/config.py
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OPENAI_API_KEY: str = "mock-key"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_MOCK: bool = False
    DB_PATH: str = "/app/db/resumedb.db"
    PDFS_DIR: str = "/app/pdfs"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
