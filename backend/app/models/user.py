from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
# Aquí usaremos una base para los modelos que crearemos en un momento
from app.core.database import Base 

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    # El index=True y unique=True aseguran que no haya correos duplicados
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Roles: 'admin', 'user', 'specialist'
    role = Column(String, default="user")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Para el Biométrico (DeepFace)
    face_encoding = Column(String, nullable=True) # Guardaremos un hash de la cara, no la foto