from sqlalchemy import create_engine  # <--- Solo debe quedar esta
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Usaremos la URL de la base de datos desde las variables de entorno (Neon en prod, local en dev)
db_url = settings.DATABASE_URL
if "channel_binding" in db_url:
    db_url = db_url.replace("&channel_binding=require", "").replace("?channel_binding=require", "")

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()