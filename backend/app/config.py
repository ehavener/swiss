from typing import List
from pydantic import BaseSettings

class Settings(BaseSettings):
    # JWT (initially generated using: openssl rand -hex 32)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # CORS
    origins: List[str] = [
        "http://localhost:3000"  # Local react app
    ]
    # Co:here
    cohere_api_key: str

settings = Settings()
