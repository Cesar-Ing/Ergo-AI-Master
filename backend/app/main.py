from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router as api_router
from app.core.database import engine, Base # <--- Importamos esto

# Removeremos create_all del scope global para no bloquear el inicio de Uvicorn

from app.core.config import settings

app = FastAPI(title="ErgoAI API", version="0.1.0")

@app.on_event("startup")
def on_startup():
    try:
        # Crea las tablas de forma asíncrona (en background) al iniciar, 
        # esto evita que Railway mate el proceso por demorar en bindear el puerto
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Error al conectar con la base de datos en el inicio:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router) # <--- Asegúrate de tener esta línea para que funcionen las rutas

@app.get("/")
def read_root():
    return {"status": "ErgoAI Online", "message": "Sistema de monitoreo ergonómico activo"}