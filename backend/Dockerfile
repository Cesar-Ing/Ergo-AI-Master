FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema para OpenCV y Mediapipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando para arrancar la app
# En Railway, si EXPOSE 8000 está definido, el enrutador manda tráfico al 8000, 
# por lo que debemos asegurarnos de que uvicorn escuche exactamente en ese puerto.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
