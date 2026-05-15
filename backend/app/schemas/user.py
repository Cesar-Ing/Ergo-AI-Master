from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Esto valida que los datos que recibimos del Login/Registro sean perfectos
class UserBase(BaseModel):
    email: EmailStr # Valida automáticamente cualquier formato de correo
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # Esto permite que Pydantic lea modelos de SQLAlchemy

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None