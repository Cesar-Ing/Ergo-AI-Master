from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import get_password_hash
from app.api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.email is not None:
        # Verificar si el nuevo email ya existe
        existing = db.query(User).filter(User.email == user_in.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        current_user.email = user_in.email
    if user_in.department is not None:
        current_user.department = user_in.department
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Solo administradores pueden ver todos los usuarios
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
    return db.query(User).order_by(User.id.desc()).all()

@router.patch("/{email}")
def update_user_role(email: str, role: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Solo administradores pueden cambiar roles
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.role = role
    db.commit()
    return {"success": True, "message": f"Rol de {email} actualizado a {role}"}
