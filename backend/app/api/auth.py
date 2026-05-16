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
    full_name: str
    provider: str # google o outlook
    provider_id: Optional[str] = None

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
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed_pw = get_password_hash(user_in.password)
    
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
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
            
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
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
        "access_token": access_token
    }

@router.post("/social-login")
def social_login(social_data: SocialLoginData, db: Session = Depends(get_db)):
    # 1. Buscar usuario por email
    user = db.query(User).filter(User.email == social_data.email).first()
    
    is_new = False
    if not user:
        # Determinar rol basado en el correo (Tu correo será ADMIN)
        assigned_role = "admin" if social_data.email == "camachoroman04@gmail.com" else "user"
        
        user = User(
            email=social_data.email,
            full_name=social_data.full_name,
            hashed_password="social_auth_no_password",
            role=assigned_role,
            department="General"
        )
        db.add(user)
        is_new = True
    else:
        # Si el usuario ya existe pero es tu correo, nos aseguramos de que sea admin
        if social_data.email == "camachoroman04@gmail.com":
            user.role = "admin"
    
    db.commit()
    db.refresh(user)
    
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