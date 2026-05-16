from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.active_break import ActiveBreak
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/breaks", tags=["breaks"])

class BreakCreate(BaseModel):
    user_id: int
    duration_seconds: int
    score: int
    metrics: dict

class BreakResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    duration_seconds: int
    score: int
    metrics: dict

    class Config:
        from_attributes = True

@router.post("/", response_model=BreakResponse)
def create_break(break_data: BreakCreate, db: Session = Depends(get_db)):
    db_break = ActiveBreak(
        user_id=break_data.user_id,
        duration_seconds=break_data.duration_seconds,
        score=break_data.score,
        metrics=break_data.metrics
    )
    db.add(db_break)
    db.commit()
    db.refresh(db_break)
    return db_break

@router.get("/", response_model=List[BreakResponse])
def get_breaks(userId: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ActiveBreak)
    if userId:
        query = query.filter(ActiveBreak.user_id == userId)
    return query.all()

@router.get("/user/{user_id}", response_model=List[BreakResponse])
def get_user_breaks(user_id: int, db: Session = Depends(get_db)):
    return db.query(ActiveBreak).filter(ActiveBreak.user_id == user_id).all()
