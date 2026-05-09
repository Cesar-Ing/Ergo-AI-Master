import os
from deepface import DeepFace
import cv2

class FaceService:
    @staticmethod
    def extract_face_embedding(image_path: str):
        """
        Extrae el 'ADN numérico' de un rostro. 
        No guardaremos la foto del usuario por privacidad (Blindaje),
        solo guardaremos este vector de números en la base de datos.
        """
        try:
            # Usamos el modelo VGG-Face que es muy robusto para oficina
            embedding_objs = DeepFace.represent(
                img_path=image_path, 
                model_name="VGG-Face",
                enforce_detection=True
            )
            # Retornamos el primer rostro detectado
            return embedding_objs[0]["embedding"]
        except Exception as e:
            print(f"Error en procesamiento facial: {e}")
            return None