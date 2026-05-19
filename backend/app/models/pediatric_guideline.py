from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class PediatricGuideline(Base):
    __tablename__ = "pediatric_guidelines"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False) # e.g. "neck_flexion", "shoulder_tilt", "slouching"
    title = Column(String, nullable=False) # e.g. "Síndrome de Cuello de Texto Pediátrico"
    clinical_backing = Column(Text, nullable=False) # Scientific explanation
    source = Column(String, nullable=False) # e.g. "Asociación Española de Pediatría (AEP)"
    exercise_suggestion = Column(String, nullable=False) # e.g. "Estiramiento Lateral de Cuello"
    exercise_duration = Column(Integer, default=30) # e.g. 30
    reference_link = Column(String, nullable=True) # Optional link
    created_at = Column(DateTime(timezone=True), server_default=func.now())
