import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ErgoAI")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_ergoai_2026_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Base de datos (con la URL funcional de Neon como fallback seguro)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_S8JvEDyp0wMI@ep-young-brook-aqaj210n-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require")

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        # Si ya es una lista, la devuelve; si es string, la separa
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        case_sensitive = True

settings = Settings()