from fastapi import APIRouter
from app.api import auth # Importamos el nuevo módulo de auth

router = APIRouter()

# Unimos las rutas de autenticación
router.include_router(auth.router)

@router.get("/health")
def health_check():
    return {"status": "ok", "detail": "API Router con Auth operativo"}