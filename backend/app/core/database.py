from sqlalchemy import create_engine  # <--- Solo debe quedar esta
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Usaremos SQLite para desarrollo rápido en Mint
SQLALCHEMY_DATABASE_URL = "sqlite:///./ergoai.db" 

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()