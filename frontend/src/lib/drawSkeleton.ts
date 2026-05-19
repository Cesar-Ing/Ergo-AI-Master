import { Keypoint } from './ergonomics';

export function drawSkeleton(
  keypoints: Keypoint[], 
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  isExerciseMode: boolean = false
) {
  const importantKeypoints = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear', 
    'left_shoulder', 'right_shoulder'
  ];

  if (isExerciseMode) {
    importantKeypoints.push(
      'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
      'left_hip', 'right_hip', 'left_knee', 'right_knee',
      'left_ankle', 'right_ankle'
    );
  }

  const validKeypoints = keypoints.filter(k => 
    (k.score || k.visibility || 0) > 0.3 && k.name && importantKeypoints.includes(k.name)
  );

  const leftS = validKeypoints.find(k => k.name === 'left_shoulder');
  const rightS = validKeypoints.find(k => k.name === 'right_shoulder');
  const nose = validKeypoints.find(k => k.name === 'nose');

  let statusColor = '#10b981'; // Emerald
  let shadowColor = 'rgba(16, 185, 129, 0.6)';
  
  if (leftS && rightS) {
    const asym = Math.abs(leftS.y - rightS.y);
    if (asym > 35) {
      statusColor = '#ef4444'; // Red
      shadowColor = 'rgba(239, 68, 68, 0.6)';
    } else if (asym > 20) {
      statusColor = '#f59e0b'; // Amber
      shadowColor = 'rgba(245, 158, 11, 0.6)';
    }
  }

  // Draw cyber-lines connecting points
  const drawCyberLine = (point1Name: string, point2Name: string) => {
    const p1 = validKeypoints.find(k => k.name === point1Name);
    const p2 = validKeypoints.find(k => k.name === point2Name);
    if (p1 && p2) {
      const p1x = p1.x * width;
      const p1y = p1.y * height;
      const p2x = p2.x * width;
      const p2y = p2.y * height;

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = shadowColor;
      
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = statusColor;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner core line
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  };

  drawCyberLine('left_shoulder', 'right_shoulder');
  drawCyberLine('left_ear', 'left_eye');
  drawCyberLine('right_ear', 'right_eye');

  if (isExerciseMode) {
    // Brazos
    drawCyberLine('left_shoulder', 'left_elbow');
    drawCyberLine('right_shoulder', 'right_elbow');
    drawCyberLine('left_elbow', 'left_wrist');
    drawCyberLine('right_elbow', 'right_wrist');

    // Torso y caderas
    drawCyberLine('left_shoulder', 'left_hip');
    drawCyberLine('right_shoulder', 'right_hip');
    drawCyberLine('left_hip', 'right_hip');

    // Piernas
    drawCyberLine('left_hip', 'left_knee');
    drawCyberLine('right_hip', 'right_knee');
    drawCyberLine('left_knee', 'left_ankle');
    drawCyberLine('right_knee', 'right_ankle');
  }

  // Connect nose to shoulders (Virtual spine/neck)
  if (nose && leftS && rightS) {
    const midX = ((leftS.x + rightS.x) / 2) * width;
    const midY = ((leftS.y + rightS.y) / 2) * height;
    const nx = nose.x * width;
    const ny = nose.y * height;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = shadowColor;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(midX, midY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = statusColor;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // Draw High-Tech Nodes
  validKeypoints.forEach(keypoint => {
    const px = keypoint.x * width;
    const py = keypoint.y * height;

    // Outer glow pulse
    ctx.shadowBlur = 20;
    ctx.shadowColor = shadowColor;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2 * Math.PI);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // Inner bright core
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // High-tech ring
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
    ctx.stroke();
  });
}
