from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from app.api.router import router as api_router
from app.core.database import engine, Base # <--- Importamos esto

# Removeremos create_all del scope global para no bloquear el inicio de Uvicorn

from app.core.config import settings

app = FastAPI(title="ErgoAI API", version="0.1.0")

@app.on_event("startup")
def on_startup():
    try:
        # 1. Crear tablas básicas
        Base.metadata.create_all(bind=engine)
        
        # 2. Auto-migración: Intentar añadir last_login si no existe
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE"))
                conn.commit()
                print("✅ Columna last_login verificada/añadida.")
            except Exception as sql_e:
                # Si falla es porque probablemente ya existe o es SQLite (usa otra sintaxis)
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
                    conn.commit()
                except:
                    pass
                print(f"Nota: Salto de migración manual (probablemente ya existe): {sql_e}")
    except Exception as e:
        print("Error en el inicio de la base de datos:", e)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Esto devolverá el error exacto a la consola para que pueda depurarlo desde curl
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error_message": str(exc), "traceback": traceback.format_exc()}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router) # <--- Asegúrate de tener esta línea para que funcionen las rutas

@app.get("/")
def read_root():
    return {"status": "ErgoAI Online", "message": "Sistema de monitoreo ergonómico activo"}