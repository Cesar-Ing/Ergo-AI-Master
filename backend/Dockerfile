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

# Exponer el puerto por defecto (Railway lo inyectará)
EXPOSE 8000

# Comando para arrancar la app usando la variable de entorno $PORT
# Usamos el modo shell (sh -c) para que $PORT se evalúe correctamente
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
