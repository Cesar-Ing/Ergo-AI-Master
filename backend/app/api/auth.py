from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings

class LoginData(BaseModel):
    email: str
    password: str

class SocialLoginData(BaseModel):
    email: str
    name: str
    provider: str # google o outlook
    provider_id: str

class ProfileUpdate(BaseModel):
    name: str
    email: str
    department: str
    password: Optional[str] = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el correo ya existe
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # 2. Blindaje: Hashear la contraseña antes de guardar
    hashed_pw = get_password_hash(user_in.password)
    
    # 3. Crear usuario
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(login_data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    is_new = False
    if not user:
        # Sandbox mode: auto-register if doesn't exist
        user_name = login_data.email.split('@')[0]
        hashed_pw = get_password_hash(login_data.password)
        user = User(
            email=login_data.email,
            full_name=user_name,
            hashed_password=hashed_pw,
            role="user",
            department="General"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new = True
    else:
        # Verify password
        if user.hashed_password != 'dummyhash' and not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
            
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
            "department": getattr(user, 'department', 'General') or 'General'
        },
        expires_delta=access_token_expires
    )
    
    return {
        "success": True,
        "role": user.role,
        "email": user.email,
        "is_new": is_new,
        "access_token": access_token
    }

@router.post("/social-login")
def social_login(social_data: SocialLoginData, db: Session = Depends(get_db)):
    # 1. Buscar usuario por email
    user = db.query(User).filter(User.email == social_data.email).first()
    
    is_new = False
    if not user:
        # Crear usuario si no existe (Sandbox mode)
        user = User(
            email=social_data.email,
            full_name=social_data.name,
            hashed_password="social_auth_no_password", # O una marca especial
            role="user",
            department="General"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new = True
    
    # 2. Generar token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
            "department": getattr(user, 'department', 'General') or 'General'
        },
        expires_delta=access_token_expires
    )
    
    return {
        "success": True,
        "role": user.role,
        "email": user.email,
        "is_new": is_new,
        "access_token": access_token
    }

@router.put("/profile")
def update_profile(profile_data: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.full_name = profile_data.name
    user.email = profile_data.email
    user.department = profile_data.department
    
    if profile_data.password and profile_data.password.strip():
        user.hashed_password = get_password_hash(profile_data.password)
        
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(hours=24)
    new_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.full_name,
            "department": getattr(user, 'department', 'General') or 'General'
        },
        expires_delta=access_token_expires
    )
    
    return {"success": True, "message": "Perfil actualizado", "access_token": new_token}