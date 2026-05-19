from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pediatric_guideline import PediatricGuideline
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/pediatric-guidelines", tags=["pediatric-guidelines"])

class PediatricGuidelineResponse(BaseModel):
    id: int
    key: str
    title: str
    clinical_backing: str
    source: str
    exercise_suggestion: str
    exercise_duration: int
    reference_link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PediatricGuidelineResponse])
def get_all_guidelines(db: Session = Depends(get_db)):
    """
    Obtener todas las directrices pediátricas sustentadas.
    """
    return db.query(PediatricGuideline).all()

@router.get("/{key}", response_model=PediatricGuidelineResponse)
def get_guideline_by_key(key: str, db: Session = Depends(get_db)):
    """
    Obtener una directriz pediátrica específica mediante su key de alerta biomecánica.
    """
    guideline = db.query(PediatricGuideline).filter(PediatricGuideline.key == key).first()
    if not guideline:
        raise HTTPException(status_code=404, detail="Directriz pediátrica no encontrada para esta alerta.")
    return guideline
