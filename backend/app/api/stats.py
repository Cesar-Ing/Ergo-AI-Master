from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from app.core.database import get_db
from app.models.user import User
from app.models.active_break import ActiveBreak
from app.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["stats"])

class ProfileUpdate(BaseModel):
    user_id: int
    company: str
    department: str

@router.post("/update-profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.company = data.company
    user.department = data.department
    db.commit()
    return {"status": "success"}

@router.get("/users-triage")
def get_users_triage(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_global_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Agrupar por fecha y contar usuarios únicos activos
    activity = db.query(
        cast(ActiveBreak.start_time, Date).label('day'),
        func.count(func.distinct(ActiveBreak.user_id)).label('count')
    ).group_by('day').order_by('day').all()
    
    return [{"day": str(a.day), "count": a.count} for a in activity]

@router.get("/activity-details")
def get_activity_details(day: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Obtiene la lista detallada de actividades y usuarios que ingresaron y realizaron sesiones en un día específico.
    Si no se proporciona un día, devuelve la actividad de hoy de forma predeterminada.
    """
    query = db.query(
        ActiveBreak.id,
        ActiveBreak.user_id,
        ActiveBreak.start_time,
        ActiveBreak.end_time,
        ActiveBreak.duration_seconds,
        ActiveBreak.score,
        ActiveBreak.metrics,
        User.full_name,
        User.email,
        User.department
    ).join(User, ActiveBreak.user_id == User.id)
    
    if day:
        query = query.filter(cast(ActiveBreak.start_time, Date) == day)
        
    query = query.order_by(desc(ActiveBreak.start_time)).limit(100).all()
    
    results = []
    for r in query:
        # Calcular duración a partir del campo duration_seconds de la DB
        seconds = r.duration_seconds or 0
        
        # En caso de que sea cero pero existan start y end, calcular la diferencia
        if seconds <= 0 and r.start_time and r.end_time:
            diff = r.end_time - r.start_time
            seconds = int(diff.total_seconds())
            
        duration = ""
        if seconds >= 3600:
            duration = f"{seconds // 3600}h { (seconds % 3600) // 60 }m"
        elif seconds >= 60:
            duration = f"{seconds // 60}m {seconds % 60}s"
        else:
            duration = f"{seconds}s"
        
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "full_name": r.full_name,
            "email": r.email,
            "department": r.department or "General",
            "start_time": r.start_time.isoformat(),
            "end_time": r.end_time.isoformat() if r.end_time else None,
            "duration": duration,
            "score": r.score,
            "metrics": r.metrics
        })
    return results

@router.get("/departments-risk")
def get_departments_risk(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Agrupar por departamento y calcular riesgo
    risks = db.query(
        User.department,
        func.avg(ActiveBreak.score).label('avg_score')
    ).join(ActiveBreak, User.id == ActiveBreak.user_id).group_by(User.department).all()
    
    return [{"name": r.department or "Desconocido", "riesgo": 100 - round(float(r.avg_score or 100))} for r in risks]
