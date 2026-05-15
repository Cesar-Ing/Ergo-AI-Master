from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/database", tags=["Database Manager"])

class QueryRequest(BaseModel):
    query: str

class DocumentCreate(BaseModel):
    collection: str
    data: Dict[str, Any]

class GraphNode(BaseModel):
    label: str
    properties: Dict[str, Any]

class GraphEdge(BaseModel):
    source: int
    target: int
    label: str

# 1. Modelo Relacional (Postgres Raw)
@router.post("/relational/query")
def execute_sql(req: QueryRequest, db: Session = Depends(get_db)):
    try:
        result = db.execute(text(req.query))
        db.commit()
        if result.returns_rows:
            return {"columns": list(result.keys()), "rows": [dict(r._mapping) for r in result]}
        return {"status": "success", "rows_affected": result.rowcount}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. Modelo Documental (Usando Postgres JSONB como motor de documentos)
@router.post("/document/collections/{name}")
def create_document(name: str, doc: Dict[str, Any], db: Session = Depends(get_db)):
    # Simulación de inserción en tabla de documentos
    try:
        # Aseguramos que la tabla existe
        db.execute(text(f"CREATE TABLE IF NOT EXISTS docs_{name} (id SERIAL PRIMARY KEY, data JSONB)"))
        db.execute(text(f"INSERT INTO docs_{name} (data) VALUES (:data)"), {"data": str(doc).replace("'", '"')})
        db.commit()
        return {"status": "document created", "collection": name}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/document/collections/{name}")
def list_documents(name: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(text(f"SELECT * FROM docs_{name}"))
        return [dict(r._mapping) for r in result]
    except Exception:
        return []

# 3. Modelo de Grafos (Simulado con Nodos y Aristas en SQL)
@router.get("/graph/data")
def get_graph_data(db: Session = Depends(get_db)):
    # Simulación de un grafo biomecánico
    nodes = [
        {"id": 1, "label": "Cabeza", "type": "Joint"},
        {"id": 2, "label": "Cuello", "type": "Joint"},
        {"id": 3, "label": "Hombro Izq", "type": "Joint"},
        {"id": 4, "label": "Hombro Der", "type": "Joint"}
    ]
    edges = [
        {"from": 1, "to": 2, "label": "Conecta"},
        {"from": 2, "to": 3, "label": "Conecta"},
        {"from": 2, "to": 4, "label": "Conecta"}
    ]
    return {"nodes": nodes, "links": edges}

# 4. Modelo de Objetos (Serialización de estados)
@router.post("/object/store")
def store_object(key: str, obj: Dict[str, Any]):
    # Aquí podríamos usar Redis o simplemente una respuesta exitosa por ahora
    return {"status": "object stored", "key": key}
