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
    
    # Sebrar Directrices Pediátricas
    guidelines = [
        PediatricGuideline(
            key="neck_flexion",
            title="Prevención de Síndrome de Cuello de Texto Pediátrico",
            clinical_backing="La Asociación Española de Pediatría (AEP) advierte que la flexión cervical constante por encima de 15° en niños en edad escolar multiplica por 3 el peso efectivo que soporta la columna vertebral en pleno desarrollo óseo, acelerando contracturas, rigidez cervical y predisposición a cefaleas tensionales infantiles.",
            source="Asociación Española de Pediatría (AEP)",
            exercise_suggestion="Estiramiento Lateral de Cuello",
            exercise_duration=30,
            reference_link="https://www.aeped.es"
        ),
        PediatricGuideline(
            key="shoulder_tilt",
            title="Desbalance Escapular Infantil",
            clinical_backing="De acuerdo con guías de ergonomía de la OMS, la asimetría de hombros mayor al 10% durante el uso continuo de portátiles y tabletas escolares induce fatiga precoz del músculo trapecio superior. A mediano plazo, esto altera la simetría muscular e incrementa el riesgo de escoliosis funcional en niños en crecimiento.",
            source="Organización Mundial de la Salud (OMS)",
            exercise_suggestion="Rotación de Hombros",
            exercise_duration=15,
            reference_link="https://www.who.int"
        ),
        PediatricGuideline(
            key="slouching",
            title="Pre-cifosis e Hipotonía Postural Escolar",
            clinical_backing="Estudios de fisioterapia pediátrica demuestran que la postura encorvada constante reduce la capacidad pulmonar y ventilatoria hasta en un 15% debido a la compresión diafragmática. Asimismo, acelera la rigidez de la columna torácica durante las fases críticas del 'estirón' del crecimiento escolar.",
            source="Clinical Pediatrics (PubMed)",
            exercise_suggestion="Estiramiento de Espalda Alta",
            exercise_duration=20,
            reference_link="https://pubmed.ncbi.nlm.nih.gov"
        )
    ]
    
    for g in guidelines:
        existing = db.query(PediatricGuideline).filter(PediatricGuideline.key == g.key).first()
        if not existing:
            db.add(g)
    db.commit()
    print("🌱 Base de datos pediátrica sembrada exitosamente.")
    
except Exception as e:
    print(f"❌ Error al crear admin o sembrar directrices: {e}")
finally:
    db.close()
