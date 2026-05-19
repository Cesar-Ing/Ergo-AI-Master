export interface Keypoint {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  score?: number;
}

export interface PostureEvaluation {
  score: number;
  state: 'optimal' | 'warning' | 'critical';
  suggestion: string;
  metrics: {
    neckOffset: number;
    shoulderTilt: number;
    headHeight: number;
  };
}

export function evaluatePosture(keypoints: Keypoint[], thresholds?: any): PostureEvaluation {
  const find = (name: string) => keypoints.find(k => k.name === name);

  const nose = find('nose');
  const leftS = find('left_shoulder');
  const rightS = find('right_shoulder');

  // Ajustes de sensibilidad basados en admin (0.1 a 1.5)
  const sensitivity = thresholds?.sensitivity || 1.0;
  
  let score = 100;
  let state: 'optimal' | 'warning' | 'critical' = 'optimal';
  let suggestion = "Postura Ergonómica Perfecta ✅";

  let neckOffsetVal = 0;
  let shoulderTiltVal = 0;
  let headHeightVal = 0;

  if (nose && leftS && rightS) {
    // 1. CALIBRACIÓN RELATIVA: Usamos el ancho de los hombros como unidad de medida base
    const shoulderWidth = Math.abs(leftS.x - rightS.x);
    const midX = (leftS.x + rightS.x) / 2;
    const midY = (leftS.y + rightS.y) / 2;

    // 2. DESVIACIÓN HORIZONTAL DEL CUELLO (Relativa al ancho de hombros)
    // Si la nariz se aleja más del 25% del ancho de los hombros del centro, hay mala postura.
    const neckOffset = Math.abs(nose.x - midX) / shoulderWidth;
    neckOffsetVal = neckOffset;
    
    // 3. INCLINACIÓN DE HOMBROS (Relativa al ancho de hombros)
    const shoulderTilt = Math.abs(leftS.y - rightS.y) / shoulderWidth;
    shoulderTiltVal = shoulderTilt;

    // 4. FACTOR DE ENCORVAMIENTO (Altura de la cabeza relativa a los hombros)
    const headHeight = Math.abs(nose.y - midY) / shoulderWidth;
    headHeightVal = headHeight;

    // --- LÓGICA DE DECISIÓN COHERENTE ---

    // Evaluar Cuello (Inclinación lateral o adelantada)
    if (neckOffset > 0.3 * sensitivity) {
      score -= 30;
      state = 'critical';
      suggestion = "🚨 Centra tu cabeza respecto a tus hombros.";
    } else if (neckOffset > 0.15 * sensitivity) {
      score -= 15;
      state = 'warning';
      suggestion = "🟡 Cabeza ligeramente inclinada.";
    }

    // Evaluar Hombros (Nivelación)
    if (shoulderTilt > 0.2 * sensitivity) {
      score -= 25;
      if (state !== 'critical') state = 'critical';
      suggestion = "🚨 Hombros desalineados. Nivela tu espalda.";
    } else if (shoulderTilt > 0.1 * sensitivity) {
      score -= 10;
      if (state === 'optimal') {
        state = 'warning';
        suggestion = "🟡 Un hombro está más alto que el otro.";
      }
    }

    // Evaluar Encorvamiento (Cabeza "hundida")
    // Lo normal es que la cabeza esté a una distancia de ~0.5 a 0.7 del ancho de hombros
    if (headHeight < 0.35 / sensitivity) {
      score -= 40;
      state = 'critical';
      suggestion = "🚨 ¡TE ESTÁS ENCORVANDO! Levanta la cabeza y estira la espalda.";
    } else if (headHeight < 0.45 / sensitivity) {
      score -= 15;
      if (state === 'optimal') {
        state = 'warning';
        suggestion = "🟡 No te hundas en la silla. Siéntate derecho.";
      }
    }
  }

  return {
    score: Math.max(0, Math.round(score)),
    state,
    suggestion,
    metrics: {
      neckOffset: neckOffsetVal, 
      shoulderTilt: shoulderTiltVal,
      headHeight: headHeightVal
    }
  };
}
