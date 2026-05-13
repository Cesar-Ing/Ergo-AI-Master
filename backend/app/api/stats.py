from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from app.core.database import get_db
from app.models.user import User
from app.models.active_break import ActiveBreak
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["stats"])

class ProfileUpdate(BaseModel):
    user_id: int
    company: str
    department: str

@router.post("/update-profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.company = data.company
    user.department = data.department
    db.commit()
    return {"status": "success"}

@router.get("/users-triage")
def get_users_triage(db: Session = Depends(get_db)):
    print("DEBUG: [Triage] Iniciando consulta...")
    try:
        # Consulta optimizada: Usuarios con su promedio de score en un solo paso
        query = db.query(
            User.id,
            User.full_name,
            User.email,
            User.role,
            User.company,
            User.department,
            func.avg(ActiveBreak.score).label('avg_score')
        ).outerjoin(ActiveBreak, User.id == ActiveBreak.user_id)\
         .filter(User.role == 'user')\
         .group_by(User.id)\
         .all()
        
        print(f"DEBUG: [Triage] Usuarios encontrados: {len(query)}")
        
        results = []
        for r in query:
            results.append({
                "id": r.id,
                "full_name": r.full_name,
                "email": r.email,
                "role": r.role,
                "company": r.company,
                "department": r.department,
                "avg_score": round(float(r.avg_score or 0))
            })
        
        # Ordenar: primero los que tienen score (mejores arriba), luego inactivos
        results.sort(key=lambda x: (x['avg_score'] == 0, x['avg_score']))
        return results
    except Exception as e:
        print(f"DEBUG: [Triage] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/global-activity")
def get_global_activity(db: Session = Depends(get_db)):
    # Agrupar por fecha y contar usuarios únicos activos
    activity = db.query(
        cast(ActiveBreak.start_time, Date).label('day'),
        func.count(func.distinct(ActiveBreak.user_id)).label('count')
    ).group_by('day').order_by('day').all()
    
    return [{"day": str(a.day), "count": a.count} for a in activity]

@router.get("/departments-risk")
def get_departments_risk(db: Session = Depends(get_db)):
    # Agrupar por departamento y calcular riesgo
    risks = db.query(
        User.department,
        func.avg(ActiveBreak.score).label('avg_score')
    ).join(ActiveBreak, User.id == ActiveBreak.user_id).group_by(User.department).all()
    
    return [{"name": r.department or "Desconocido", "riesgo": 100 - round(float(r.avg_score or 100))} for r in risks]
