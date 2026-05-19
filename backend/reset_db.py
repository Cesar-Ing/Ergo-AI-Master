import sys
import os

# Añadir el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models import User, ActiveBreak, Prescription, SystemConfig, PediatricGuideline

print("⚠️ ADVERTENCIA: Borrando todas las tablas existentes...")
Base.metadata.drop_all(bind=engine)
print("✅ Base de datos limpia.")

print("🚀 Creando tablas nuevas...")
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas exitosamente.")

# Crear un admin por defecto para que no se queden fuera
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

db = SessionLocal()
try:
    admin_email = "admin@ergoai.com"
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            full_name="Administrador Global",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"👤 Usuario de respaldo creado: {admin_email} / admin123")
    
    # Sembrar Directrices Clínicas Generales
    guidelines = [
        PediatricGuideline(
            key="neck_flexion",
            title="Prevención del Síndrome de Cuello de Texto (Text Neck)",
            clinical_backing="La flexión cervical prolongada e inclinada por encima de 15° multiplica por 3 el peso efectivo que soporta la columna vertebral. Afecta a personas de todas las edades, induciendo contracturas crónicas, rigidez cervical y predisposición a cefaleas tensionales.",
            source="Asociación Ergonómica Internacional (IEA) / Mayo Clinic",
            exercise_suggestion="Estiramiento Lateral de Cuello",
            exercise_duration=30,
            reference_link="https://www.mayoclinic.org"
        ),
        PediatricGuideline(
            key="shoulder_tilt",
            title="Desbalance Escapular y Tensión de Trapecio",
            clinical_backing="La asimetría y tensión en los hombros durante el uso prolongado de computadoras e instrumentos de trabajo altera el trapecio superior. Induce desbalances musculares, dolores de espalda alta y desalineación postural crónica en adultos y jóvenes.",
            source="Organización Mundial de la Salud (OMS) / OSHA",
            exercise_suggestion="Rotación de Hombros",
            exercise_duration=15,
            reference_link="https://www.osha.gov"
        ),
        PediatricGuideline(
            key="slouching",
            title="Cifosis Postural e Ineficiencia Respiratoria",
            clinical_backing="La postura encorvada prolongada (slouching) comprime la caja torácica, reduciendo la capacidad de ventilación pulmonar hasta en un 15% debido a la compresión diafragmática. Fomenta rigidez torácica y debilidad muscular en la columna en cualquier rango de edad.",
            source="Journal of Physical Therapy Science / PubMed",
            exercise_suggestion="Estiramiento de Espalda Alta",
            exercise_duration=20,
            reference_link="https://pubmed.ncbi.nlm.nih.gov"
        )
    ]
    
    for g in guidelines:
        existing = db.query(PediatricGuideline).filter(PediatricGuideline.key == g.key).first()
        if not existing:
            db.add(g)
        else:
            # Actualizar datos si ya existe
            existing.title = g.title
            existing.clinical_backing = g.clinical_backing
            existing.source = g.source
            existing.exercise_suggestion = g.exercise_suggestion
            existing.exercise_duration = g.exercise_duration
            existing.reference_link = g.reference_link
    db.commit()
    print("🌱 Base de datos de directrices clínicas sembrada exitosamente.")
    
except Exception as e:
    print(f"❌ Error al crear admin o sembrar directrices: {e}")
finally:
    db.close()
