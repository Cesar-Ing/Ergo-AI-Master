from pathlib import Path

file_path = Path("/home/hernando/Desktop/Ergo-AI-Master/frontend/src/app/dashboard/page.tsx")
content = file_path.read_text(encoding="utf-8")
content_norm = content.replace("\r\n", "\n")

# 1. Update EXERCISES definition
old_exercises = """const EXERCISES = {
  neck_stretch: {
    id: 'neck_stretch',
    title: 'Estiramiento Lateral de Cuello',
    description: 'Inclina tu cabeza suavemente hacia la izquierda o derecha para liberar tensión cervical.',
    instruction: 'Inclina la cabeza lateralmente hasta sentir el estiramiento.',
    icon: '🧘'
  },
  back_stretch: {
    id: 'back_stretch',
    title: 'Estiramiento de Espalda Alta',
    description: 'Eleva ambos brazos completamente por encima de tu cabeza para alinear tu columna.',
    instruction: 'Alza ambos brazos bien arriba sobre tu cabeza.',
    icon: '⚡'
  },
  shoulder_shrug: {
    id: 'shoulder_shrug',
    title: 'Rotación de Hombros',
    description: 'Eleva tus hombros hacia arriba (encogimiento) y mantenlos para liberar la carga del trapecio.',
    instruction: 'Eleva tus hombros hacia tus orejas con fuerza.',
    icon: '💪'
  }
};"""

new_exercises = """const EXERCISES = {
  neck_stretch: {
    id: 'neck_stretch',
    title: 'Estiramiento Lateral de Cuello',
    description: 'Inclina tu cabeza suavemente hacia la izquierda o derecha para liberar tensión cervical.',
    instruction: 'Inclina la cabeza lateralmente hasta sentir el estiramiento.',
    icon: '🧘',
    recommended_time: '30 segundos'
  },
  back_stretch: {
    id: 'back_stretch',
    title: 'Estiramiento de Espalda Alta',
    description: 'Eleva ambos brazos completamente por encima de tu cabeza para alinear tu columna.',
    instruction: 'Alza ambos brazos bien arriba sobre tu cabeza.',
    icon: '⚡',
    recommended_time: '20 segundos'
  },
  shoulder_shrug: {
    id: 'shoulder_shrug',
    title: 'Rotación de Hombros',
    description: 'Eleva tus hombros hacia arriba (encogimiento) y mantenlos para liberar la carga del trapecio.',
    instruction: 'Eleva tus hombros hacia tus orejas con fuerza.',
    icon: '💪',
    recommended_time: '15 segundos'
  }
};"""

# 2. Add isPostureCorrect state
old_states = """  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const exerciseProgressRef = useRef(0);
  const exerciseCompletedRef = useRef(false);"""

new_states = """  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const exerciseProgressRef = useRef(0);
  const exerciseCompletedRef = useRef(false);
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);"""

# 3. Set isPostureCorrect inside startIA validation logic
old_validation = """          setSuggestion(guideMsg);

          if (isCorrect) {
            exerciseProgressRef.current = Math.min(100, exerciseProgressRef.current + 4);"""

new_validation = """          setSuggestion(guideMsg);
          setIsPostureCorrect(isCorrect);

          if (isCorrect) {
            exerciseProgressRef.current = Math.min(100, exerciseProgressRef.current + 4);"""

# Apply the replacements
content_norm = content_norm.replace(old_exercises, new_exercises)
content_norm = content_norm.replace(old_states, new_states)
content_norm = content_norm.replace(old_validation, old_validation.replace("          setSuggestion(guideMsg);", "          setSuggestion(guideMsg);\n          setIsPostureCorrect(isCorrect);"))

file_path.write_text(content_norm, encoding="utf-8")
print("SUCCESS: Core variables patched!")
