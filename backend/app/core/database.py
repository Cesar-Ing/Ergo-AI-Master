from sqlalchemy import create_engine  # <--- Solo debe quedar esta
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Usaremos la URL de la base de datos desde las variables de entorno (Neon en prod, local en dev)
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL 

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()