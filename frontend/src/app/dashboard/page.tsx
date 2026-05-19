"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { evaluatePosture, Keypoint as ErgoKeypoint } from "@/lib/ergonomics";
import { drawSkeleton } from "@/lib/drawSkeleton";

declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}

const EXERCISES = {
  neck_stretch: {
    id: 'neck_stretch',
    title: 'Estiramiento Lateral de Cuello',
    description: 'Inclina tu cabeza suavemente hacia la izquierda o derecha para liberar tensión cervical.',
    instruction: 'Inclina la cabeza lateralmente hasta sentir el estiramiento.',
    icon: '🧘',
    recommended_time: '30 segundos',
    duration_seconds: 30
  },
  back_stretch: {
    id: 'back_stretch',
    title: 'Estiramiento de Espalda Alta',
    description: 'Eleva ambos brazos completamente por encima de tu cabeza para alinear tu columna.',
    instruction: 'Alza ambos brazos bien arriba sobre tu cabeza.',
    icon: '⚡',
    recommended_time: '20 segundos',
    duration_seconds: 20
  },
  shoulder_shrug: {
    id: 'shoulder_shrug',
    title: 'Rotación de Hombros',
    description: 'Eleva tus hombros hacia arriba (encogimiento) y mantenlos para liberar la carga del trapecio.',
    instruction: 'Eleva tus hombros hacia tus orejas con fuerza.',
    icon: '💪',
    recommended_time: '15 segundos',
    duration_seconds: 15
  }
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'camera' | 'profile'>('calendar');
  
  const [session, setSession] = useState<any>(null);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [biometricState, setBiometricState] = useState<'optimal' | 'warning' | 'critical'>('optimal');
  const [postureScore, setPostureScore] = useState(100);
  const [suggestion, setSuggestion] = useState("Listo para analizar.");

  const [breakDuration, setBreakDuration] = useState(5);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const isBreakActiveRef = useRef(false);
  const sessionScoresRef = useRef<number[]>([]);
  const sessionRef = useRef<any>(null);
  const [selectedBreak, setSelectedBreak] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [lastSessionData, setLastSessionData] = useState<any>(null);
  
  // Variables del Entrenador de Ejercicios Correctivos IA
  const [exerciseMode, setExerciseMode] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const exerciseProgressRef = useRef(0);
  const exerciseCompletedRef = useRef(false);
  const [isPostureCorrect, setIsPostureCorrect] = useState(false);
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(0);
  const timerHasStartedRef = useRef(false);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [profilePass, setProfilePass] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [thresholds, setThresholds] = useState({ neck: 25, back: 15, sensitivity: 0.8 });
  const thresholdsRef = useRef({ neck: 25, back: 15, sensitivity: 0.8 });

  useEffect(() => { thresholdsRef.current = thresholds; }, [thresholds]);

  const parseUTC = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    let normalized = dateStr.replace(' ', 'T');
    if (!normalized.includes('Z') && !normalized.includes('+') && !/-\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z';
    }
    return new Date(normalized);
  };

  const streak = useMemo(() => {
    if (breaks.length === 0) return 0;
    const getLocalYMD = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const days = Array.from(new Set(breaks.map(b => getLocalYMD(parseUTC(b.start_time))))).sort().reverse();
    const todayDate = new Date();
    const yesterdayDate = new Date(Date.now() - 86400000);
    const todayStr = getLocalYMD(todayDate);
    const yesterdayStr = getLocalYMD(yesterdayDate);
    
    if (!days.includes(todayStr) && !days.includes(yesterdayStr)) return 0;
    
    let count = 0;
    let currentTs = days.includes(todayStr) ? todayDate.getTime() : yesterdayDate.getTime();
    
    while (true) {
      const checkStr = getLocalYMD(new Date(currentTs));
      if (days.includes(checkStr)) {
        count++;
        currentTs -= 86400000;
      } else break;
    }
    return count;
  }, [breaks]);

  const last30Days = Array.from({length: 30}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const getRecommendations = (score: number) => {
    if (score >= 90) return [{ icon: '🏆', text: 'Postura excepcional.' }, { icon: '💪', text: 'Tus hábitos son modelo.' }];
    if (score >= 75) return [{ icon: '👍', text: 'Buena postura.' }, { icon: '⏱️', text: 'Toma pausas.' }];
    return [{ icon: '🚨', text: 'Postura crítica.' }, { icon: '🧘', text: 'Estira el cuello.' }];
  };

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const sRes = await fetch('/api/users/me', { cache: 'no-store' });
        let sData = null;
        if (sRes.ok) {
          sData = await sRes.json();
        }
        
        if (!sData || !sData.id) {
          const localEmail = localStorage.getItem('ergoai_user_email');
          const localRole = localStorage.getItem('ergoai_user_role');
          const localId = localStorage.getItem('ergoai_user_id');
          if (localEmail) {
            sData = {
              id: localId ? (parseInt(localId, 10) || localId) : 'manual_user',
              email: localEmail,
              role: localRole || 'user',
              name: localEmail.split('@')[0]
            };
          }
        }
        
        if (!sData) return;
        
        if (sData.full_name) sData.name = sData.full_name;
        setSession(sData);
        sessionRef.current = sData;
        setProfileName(sData.name || "");
        setProfileEmail(sData.email || "");
        setProfileDept(sData.department || "");

        const [bRes, pRes, cRes] = await Promise.all([
          fetch(`/api/breaks?userId=${sData.id}&t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/prescriptions/user/${sData.id}`, { cache: 'no-store' }),
          fetch('/api/config', { cache: 'no-store' })
        ]);
        if (bRes.ok) {
          const bData = await bRes.json();
          setBreaks(bData.sort((a:any, b:any) => parseUTC(b.start_time).getTime() - parseUTC(a.start_time).getTime()));
        }
        if (pRes.ok) {
           const pData = await pRes.json();
           setPrescriptions(pData.sort((a:any,b:any)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          setThresholds({
            neck: parseInt(cData.neck_threshold || '25'),
            back: parseInt(cData.back_threshold || '15'),
            sensitivity: parseFloat(cData.sensitivity || '0.8')
          });
        }
      } catch (e) { console.error(e); }
    };
    loadData();
    const handleSync = (e: any) => {
       setSession(e.detail);
       setProfileName(e.detail.name || "");
    };
    window.addEventListener('profileUpdated', handleSync);
    return () => window.removeEventListener('profileUpdated', handleSync);
  }, []);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const bodyPayload: any = { full_name: profileName, email: profileEmail, department: profileDept };
      if (profilePass) bodyPayload.password = profilePass;
      
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        const updatedSession = { ...session, ...updatedUser, name: updatedUser.full_name, department: updatedUser.department };
        setSession(updatedSession);
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedSession }));
        alert("Perfil actualizado");
        setProfilePass("");
      } else {
        const err = await res.json();
        alert("Error al actualizar: " + (err.detail || err.error || ""));
      }
    } catch (e) { console.error(e); }
    finally { setIsUpdating(false); }
  };

  const exerciseModeRef = useRef(false);
  const selectedExerciseRef = useRef<any>(null);

  useEffect(() => {
    exerciseModeRef.current = exerciseMode;
  }, [exerciseMode]);

  useEffect(() => {
    selectedExerciseRef.current = selectedExercise;
  }, [selectedExercise]);

  const exitExerciseMode = () => {
    setExerciseMode(false);
    setSelectedExercise(null);
    setExerciseProgress(0);
    setExerciseCompleted(false);
    exerciseProgressRef.current = 0;
    exerciseCompletedRef.current = false;
    setIsPostureCorrect(false);
    timerHasStartedRef.current = false;
    setIsCameraActive(false);
    setIsCameraLoading(false);
    if (cameraRef.current) cameraRef.current.stop();
  };

  const saveAndExitExercise = async () => {
    const isCompleted = exerciseCompletedRef.current;
    const finalScore = Math.round(exerciseProgressRef.current);
    
    if (!session?.id) {
       alert("Error: Sesión no identificada.");
       exitExerciseMode();
       return;
    }

    try {
      const res = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: session.id, 
          duration_seconds: 60,
          score: finalScore, 
          metrics: { 
            type: "exercise",
            exercise_id: selectedExerciseRef.current?.id || "unknown",
            exercise_title: selectedExerciseRef.current?.title || "Estiramiento",
            completed: isCompleted
          } 
        })
      });
      
      if (res.ok) {
        // Refrescar historial
        const bRes = await fetch(`/api/breaks?userId=${session.id}&t=${Date.now()}`, { cache: 'no-store' });
        if (bRes.ok) {
          const bData = await bRes.json();
          const sorted = bData.sort((a:any, b:any) => parseUTC(b.start_time).getTime() - parseUTC(a.start_time).getTime());
          setBreaks(sorted);
          window.dispatchEvent(new CustomEvent('streakUpdated', { detail: sorted }));
        }
        alert(isCompleted ? "🏆 ¡Excelente trabajo! Ejercicio guardado en tu historial." : "⚠️ Ejercicio finalizado y guardado en tu historial.");
      }
    } catch (e) {
      console.error(e);
    }
    
    exitExerciseMode();
  };

  const startIA = () => {
    if (!(window as any).Pose || !videoRef.current) return;
    const pose = new (window as any).Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    pose.onResults((results: any) => {
      if (!results.poseLandmarks || !canvasRef.current) return;
      setIsCameraLoading(false);
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0,0,640,480);
      // Mapear índices de MediaPipe a nombres para que drawSkeleton los reconozca (cuerpo completo)
      const namedLandmarks = results.poseLandmarks.map((point: any, index: number) => {
        const names: { [key: number]: string } = {
          0: 'nose', 7: 'left_ear', 8: 'right_ear', 1: 'left_eye', 4: 'right_eye',
          11: 'left_shoulder', 12: 'right_shoulder',
          13: 'left_elbow', 14: 'right_elbow',
          15: 'left_wrist', 16: 'right_wrist',
          23: 'left_hip', 24: 'right_hip',
          25: 'left_knee', 26: 'right_knee',
          27: 'left_ankle', 28: 'right_ankle'
        };
        // Asegurar que pasamos visibility o score para que drawSkeleton filtre bien
        return { 
          ...point, 
          visibility: point.visibility ?? 0,
          name: names[index] || `point_${index}` 
        };
      });

      if (!exerciseModeRef.current) {
        drawSkeleton(namedLandmarks, ctx, 640, 480, false);
        const evaluation = evaluatePosture(namedLandmarks, thresholdsRef.current);
        
        // Mostrar feedback siempre que la cámara esté activa
        setPostureScore(evaluation.score);
        setBiometricState(evaluation.state);
        setSuggestion(evaluation.suggestion);

        if (isBreakActiveRef.current) {
           sessionScoresRef.current.push(evaluation.score);
        }
      } else {
        const currentEx = selectedExerciseRef.current;
        drawSkeleton(namedLandmarks, ctx, 640, 480, true);
        
        if (currentEx) {

          const find = (name: string) => namedLandmarks.find((k: any) => k.name === name);
          const nose = find('nose');
          const leftS = find('left_shoulder');
          const rightS = find('right_shoulder');
          const leftW = find('left_wrist');
          const rightW = find('right_wrist');

          let isCorrect = false;
          let guideMsg = "";

          if (currentEx.id === 'neck_stretch') {
            if (nose && leftS && rightS) {
              const shoulderWidth = Math.abs(leftS.x - rightS.x);
              const midX = (leftS.x + rightS.x) / 2;
              const neckOffset = Math.abs(nose.x - midX) / (shoulderWidth || 0.1);

              if (neckOffset > 0.22) {
                isCorrect = true;
                guideMsg = "¡Excelente inclinación! Mantén la posición...";
              } else {
                guideMsg = "Inclina tu cabeza suavemente hacia un hombro de manera lateral.";
              }
            } else {
              guideMsg = "Alinea tu cuerpo frente a la cámara.";
            }
          } 
          else if (currentEx.id === 'back_stretch') {
            if (leftW && rightW && leftS && rightS) {
              if (leftW.y < leftS.y && rightW.y < rightS.y) {
                isCorrect = true;
                guideMsg = "¡Perfecto! Brazos alzados. Sostén el estiramiento...";
              } else {
                guideMsg = "Eleva ambos brazos bien alto sobre tu cabeza.";
              }
            } else {
              guideMsg = "Asegúrate de que tus brazos sean visibles en la cámara.";
            }
          }
          else if (currentEx.id === 'shoulder_shrug') {
            if (nose && leftS && rightS) {
              const shoulderWidth = Math.abs(leftS.x - rightS.x);
              const midY = (leftS.y + rightS.y) / 2;
              const headHeight = Math.abs(nose.y - midY) / (shoulderWidth || 0.1);

              if (headHeight < 0.38) {
                isCorrect = true;
                guideMsg = "¡Hombros arriba! Sostén esa contracción...";
              } else {
                guideMsg = "Eleva tus hombros hacia arriba con fuerza.";
              }
            } else {
              guideMsg = "Alinea tus hombros frente a la cámara.";
            }
          }

          setSuggestion(guideMsg);
          setIsPostureCorrect(isCorrect);

          if (isCorrect) {
            exerciseProgressRef.current = Math.min(100, exerciseProgressRef.current + 20);
            setExerciseProgress(Math.round(exerciseProgressRef.current));
          } else {
            exerciseProgressRef.current = Math.max(0, exerciseProgressRef.current - 15);
            setExerciseProgress(Math.round(exerciseProgressRef.current));
          }
        }
      }
    });
    poseRef.current = pose;
    const camera = new (window as any).Camera(videoRef.current, {
      onFrame: async () => { if (poseRef.current) await poseRef.current.send({ image: videoRef.current! }); },
      width: 640, height: 480
    });
    camera.start();
    cameraRef.current = camera;
  };

  const finishBreak = async () => {
    const finalScore = sessionScoresRef.current.length > 0 
      ? Math.round(sessionScoresRef.current.reduce((a,b)=>a+b,0)/sessionScoresRef.current.length) 
      : 100;
    
    if (!session?.id) {
       alert("Error: Sesión no identificada. No se pudo guardar.");
       return;
    }

    try {
      const res = await fetch('/api/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: session.id, 
          duration_seconds: breakDuration * 60, 
          score: finalScore, 
          metrics: { avg_score: finalScore } 
        })
      });
      
      if (res.ok) {
        // Refrescar historial con cache-buster para evitar respuestas cacheadas
        const bRes = await fetch(`/api/breaks?userId=${session.id}&t=${Date.now()}`, { cache: 'no-store' });
        if (bRes.ok) {
          const bData = await bRes.json();
          const sorted = bData.sort((a:any, b:any) => parseUTC(b.start_time).getTime() - parseUTC(a.start_time).getTime());
          setBreaks(sorted);
          window.dispatchEvent(new CustomEvent('streakUpdated', { detail: sorted }));
        }
        setLastSessionData({ score: finalScore, suggestion, duration: breakDuration });
        setShowResultModal(true);
        // Alerta de confirmación para el usuario
        alert("✅ Sesión guardada exitosamente en tu historial.");
      } else {
        const errData = await res.json();
        alert(`❌ Error al guardar: ${errData.error || 'Desconocido'}`);
      }
    } catch (e) { 
      console.error(e);
      alert("⚠️ Error de conexión. Revisa que el servidor esté encendido.");
    }
    
    setIsBreakActive(false);
    isBreakActiveRef.current = false;
    setIsCameraActive(false);
    if (cameraRef.current) cameraRef.current.stop();
    if (poseRef.current) poseRef.current.close();
    poseRef.current = null;
    cameraRef.current = null;
  };

  useEffect(() => {
    let timer: any;
    if (isBreakActive && breakTimeLeft > 0) {
      timer = setInterval(() => setBreakTimeLeft(p => p - 1), 1000);
    } else if (isBreakActive && breakTimeLeft === 0) {
      finishBreak();
    }
    return () => clearInterval(timer);
  }, [isBreakActive, breakTimeLeft]);

  useEffect(() => {
    let timer: any;
    if (exerciseMode && exerciseTimeLeft > 0 && isPostureCorrect) {
      timerHasStartedRef.current = true;
      timer = setInterval(() => setExerciseTimeLeft(p => p - 1), 1000);
    } else if (exerciseMode && exerciseTimeLeft === 0 && timerHasStartedRef.current) {
      exerciseCompletedRef.current = true;
      setExerciseCompleted(true);
    }
    return () => clearInterval(timer);
  }, [exerciseMode, exerciseTimeLeft, isPostureCorrect]);

  const postureBreaks = breaks.filter(b => b.metrics?.type !== 'exercise');
  const exerciseBreaks = breaks.filter(b => b.metrics?.type === 'exercise');

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" />

      <div className="flex justify-between items-center bg-white dark:bg-[#0B1B3D]/50 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl border border-emerald-500/20 shadow-inner">👤</div>
          <div>
            <h1 className="text-3xl font-black text-[#0B1B3D] dark:text-white tracking-tighter">¡Hola, {session?.name?.split(' ')[0] || 'Ergonauta'}!</h1>
            <p className="text-slate-400 dark:text-blue-200/40 font-bold text-sm">Tu racha actual: <span className="text-orange-500">🔥 {streak} días</span></p>
          </div>
        </div>
        <div className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg ${biometricState === 'optimal' ? 'bg-emerald-500 text-white' : biometricState === 'warning' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'}`}>
           BIO: {biometricState}
        </div>
      </div>

      <div className="flex p-1.5 bg-slate-200/40 dark:bg-white/5 rounded-2xl w-fit mx-auto backdrop-blur-sm">
        {['calendar', 'camera', 'profile'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-10 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === t ? "bg-[#0B1B3D] dark:bg-emerald-500 text-white shadow-xl" : "text-slate-500 dark:text-blue-200/30 hover:text-white"}`}>
             {t === 'calendar' ? 'Actividad' : t === 'camera' ? 'Cámara IA' : 'Configurar'}
          </button>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-10 duration-500">
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0B1B3D]/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm text-center">
                  <p className="text-slate-400 dark:text-blue-200/40 text-[9px] font-black uppercase tracking-widest mb-2">Salud General</p>
                  <p className="text-4xl font-black text-[#0B1B3D] dark:text-white">{postureBreaks.length > 0 ? Math.round(postureBreaks.reduce((a,b)=>a+b.score,0)/postureBreaks.length) : 0}%</p>
                </div>
                <div className="bg-white dark:bg-[#0B1B3D]/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm text-center">
                  <p className="text-slate-400 dark:text-blue-200/40 text-[9px] font-black uppercase tracking-widest mb-2">Análisis de Postura</p>
                  <p className="text-4xl font-black text-[#0B1B3D] dark:text-white">{postureBreaks.length}</p>
                </div>
                <div className="bg-white dark:bg-[#0B1B3D]/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm text-center">
                  <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-2">Ejercicios Realizados</p>
                  <p className="text-4xl font-black text-emerald-500">{exerciseBreaks.length}</p>
                </div>
                <div className="bg-gradient-to-br from-[#0B1B3D] to-[#1C305C] p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/10">
                   <p className="text-blue-300 text-[9px] font-black uppercase tracking-widest mb-2">Alertas Médicas</p>
                   {prescriptions.length > 0 ? (
                      <div onClick={() => setSelectedPrescription(prescriptions[0])} className="cursor-pointer">
                        <p className="text-xs font-black leading-tight mb-1 line-clamp-1">{prescriptions[0].title}</p>
                        <p className="text-[9px] text-blue-200/60 font-bold line-clamp-2">{prescriptions[0].content}</p>
                      </div>
                   ) : <p className="text-xs font-bold text-blue-200/40 italic">Todo bajo control.</p>}
                   <div className="absolute -right-4 -bottom-4 text-5xl opacity-5">🩺</div>
                </div>
              </div>

              {/* Calendario y Registros Debajo */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-[#0B1B3D]/50 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm">
                   <h3 className="text-xl font-black text-[#0B1B3D] dark:text-white mb-8 text-center">Calendario de Cumplimiento</h3>
                   <div className="grid grid-cols-10 gap-3">
                     {last30Days.map((date, i) => {
                       const getLocalYMD = (d: Date) => {
                         return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                       };
                       const dateStr = getLocalYMD(date);
                       const hasBreak = breaks.some(b => {
                           const breakDateStr = getLocalYMD(parseUTC(b.start_time));
                           return breakDateStr === dateStr;
                       });
                       return (
                         <div key={i} title={dateStr} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black border-2 ${hasBreak ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-300'}`}>
                           {date.getDate()}
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div className="bg-white dark:bg-[#0B1B3D]/50 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm">
                   <h3 className="text-lg font-black text-[#0B1B3D] dark:text-white mb-6">Últimos 5 Registros</h3>
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {breaks.slice(0, 5).map((b, i) => (
                        <div key={i} onClick={() => setSelectedBreak(b)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer text-center ${selectedBreak?.id === b.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300'}`}>
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{parseUTC(b.start_time).toLocaleDateString([], {day:'2-digit', month:'short'})}</p>
                           <p className="text-2xl font-black text-emerald-500">{b.score}%</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase mt-1">{Math.round(b.duration_seconds/60)} min</p>
                        </div>
                      ))}
                      {breaks.length === 0 && <p className="col-span-5 text-center text-xs font-bold text-slate-300 py-4">No hay registros aún.</p>}
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1B3D]/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col">
                 <h3 className="text-lg font-black text-[#0B1B3D] dark:text-white mb-6">Detalles del Día</h3>
                 {selectedBreak ? (
                   <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-black/20 p-8 rounded-3xl border border-slate-100 dark:border-white/5 text-center shadow-inner">
                         <p className="text-6xl font-black text-emerald-500">{selectedBreak.score}%</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-widest">
                           {selectedBreak.metrics?.type === 'exercise' ? 'Efectividad del Ejercicio' : 'Calidad de Postura'}
                         </p>
                      </div>
                      
                      {selectedBreak.metrics?.type === 'exercise' ? (
                        <div className="space-y-4">
                           <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
                             <span className="text-2xl">🧘</span>
                             <div>
                               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">EJERCICIO REALIZADO</p>
                               <p className="text-xs font-black text-[#0B1B3D] dark:text-white">{selectedBreak.metrics.exercise_title || 'Estiramiento'}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                             <span className="text-2xl">{selectedBreak.score >= 80 ? '🏆' : '⚠️'}</span>
                             <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">RESULTADO BIOMÉTRICO</p>
                               <p className="text-xs font-bold text-slate-600 dark:text-blue-100/80">
                                 {selectedBreak.score >= 80 ? '¡Se realizó de manera excelente y completa!' : 'Se inició pero no se completó en su totalidad.'}
                               </p>
                             </div>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           {getRecommendations(selectedBreak.score).map((r,i)=>(
                             <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                               <span className="text-2xl">{r.icon}</span>
                               <p className="text-[11px] font-bold text-slate-600 dark:text-blue-100/80 leading-snug">{r.text}</p>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                      <div className="text-6xl mb-6">📉</div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Selecciona una sesión</p>
                   </div>
                 )}
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 aspect-video bg-[#050f24] rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-slate-200">
               {isCameraActive ? (
                  <>
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" style={{transform: 'scaleX(-1)'}} />
                   <canvas ref={canvasRef} width="640" height="480" className="absolute top-0 left-0 w-full h-full object-cover" style={{transform: 'scaleX(-1)'}} />
                   
                   {/* Capa de Cronómetro y Puntos */}
                   <div className="absolute inset-0 pointer-events-none border-[12px] border-[#0B1B3D]/30 z-10"></div>
                   
                   {isBreakActive && !isCameraLoading && (
                      <div className="absolute top-10 right-10 z-30 bg-[#0B1B3D]/90 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-blue-500/30 shadow-2xl text-center">
                         <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] block mb-2">TIEMPO IA</span>
                         <span className="text-4xl font-mono font-black text-white">
                           {Math.floor(breakTimeLeft / 3600).toString().padStart(2, '0')}:
                           {Math.floor((breakTimeLeft % 3600) / 60).toString().padStart(2, '0')}:
                           {(breakTimeLeft % 60).toString().padStart(2, '0')}
                         </span>
                      </div>
                   )}

                    {exerciseMode && !isCameraLoading && (
                       <>
                          <div className="absolute top-10 left-10 z-30 bg-[#0B1B3D]/90 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-emerald-500/30 shadow-2xl text-center">
                             <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-2">CRONÓMETRO IA</span>
                             <span className="text-4xl font-mono font-black text-white">
                               00:00:{(exerciseTimeLeft % 60).toString().padStart(2, '0')}
                             </span>
                          </div>
                          <div className="absolute top-10 right-10 z-30 bg-[#0B1B3D]/90 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-emerald-500/30 shadow-2xl text-center">
                             <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-2">PROGRESO REHAB</span>
                             <span className="text-4xl font-mono font-black text-white">{exerciseProgress}%</span>
                          </div>
                       </>
                    )}
                   
                   {isCameraLoading && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050f24]/90 backdrop-blur-sm">
                         <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                         <p className="text-emerald-400 font-mono text-xs font-black tracking-[0.5em] animate-pulse">CARGANDO MOTOR BIOMÉTRICO</p>
                      </div>
                   )}

                   <div className="absolute bottom-10 left-10 flex items-center gap-3 z-20">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_red]"></div>
                      <span className="text-white font-mono text-xs font-black bg-black/50 px-3 py-1.5 rounded-lg tracking-widest uppercase">REC • IA ACTIVE</span>
                   </div>
                  </>
               ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                     <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6">📷</div>
                     <p className="text-slate-500 font-black tracking-widest uppercase text-xs mb-8">Cámara en Reposo</p>
                     <Button onClick={() => { setIsCameraActive(true); setIsCameraLoading(true); setTimeout(startIA, 1000); }} className="bg-white hover:bg-slate-200 text-[#0B1B3D] font-black px-12 py-5 rounded-2xl shadow-2xl transition-all hover:scale-105">INICIAR CÁMARA</Button>
                  </div>
               )}
            </div>
            <div className="space-y-6">
               {exerciseMode ? (
                  <div className="bg-white dark:bg-[#0B1B3D]/50 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5">
                        <div className={`h-full transition-all duration-300 ${isPostureCorrect ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-amber-500 shadow-[0_0_10px_#F59E0B]'}`} style={{ width: `${exerciseProgress}%` }}></div>
                      </div>
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-2">Entrenador de Rehabilitación IA</span>
                     <h3 className="text-2xl font-black text-[#0B1B3D] dark:text-white mb-6">{selectedExercise?.title}</h3>
                     
                     {/* Guía Visual */}
                      <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/10 mb-8 text-left">
                        <div className="flex gap-4 items-center mb-4">
                          <span className="text-4xl">{selectedExercise?.icon}</span>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tu objetivo</p>
                            <p className="text-xs font-bold text-slate-500 dark:text-blue-200/80">{selectedExercise?.instruction}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic mb-4">{selectedExercise?.description}</p>
                        <div className="mt-4 p-5 bg-[#0B1B3D] border border-emerald-500/20 rounded-2xl text-center shadow-md relative overflow-hidden">
                          <div className="absolute right-3 top-3 text-[7px] font-black text-emerald-400 animate-pulse">REC • IA TIMER</div>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">RELOJ / CRONÓMETRO DE REHABILITACIÓN</p>
                          <div className="text-3xl font-mono font-black text-white tracking-widest my-1">
                            00:00:{(exerciseTimeLeft % 60).toString().padStart(2, '0')}
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(exerciseTimeLeft / (selectedExercise?.duration_seconds || 30)) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>

                     {/* Progreso Circular o Barra Pro */}
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 mb-8">
                        <div className="text-5xl font-mono font-black text-emerald-500 mb-2">{exerciseProgress}%</div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">PROGRESO DE ESTIRAMIENTO</p>
                        <div className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner p-0.5">
                          <div className={`h-full rounded-full transition-all duration-200 ${
                            isPostureCorrect 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' 
                              : 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          }`} style={{ width: `${exerciseProgress}%` }}></div>
                        </div>
                      </div>

                     {/* Mensaje Dinámico */}
                     <div className="mb-8">
                       {exerciseCompleted ? (
                         <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-black animate-bounce">
                           🏆 ¡REHABILITACIÓN COMPLETADA!
                         </div>
                       ) : (
                         <div className="text-xs font-bold text-slate-400 animate-pulse">
                           {exerciseProgress > 0 ? "¡Sigue sosteniendo la posición!" : "Alinea los puntos verdes y realiza el ejercicio."}
                         </div>
                       )}
                     </div>

 {exerciseCompleted ? (
                       <Button onClick={saveAndExitExercise} className="w-full h-18 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-[2rem] shadow-2xl hover:scale-105 transition-all">
                         FINALIZAR EJERCICIO ⚡
                       </Button>
                     ) : (
                       <Button onClick={saveAndExitExercise} className="w-full h-16 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-[1.8rem] transition-all">
                         SALIR Y GUARDAR
                       </Button>
                     )}
                  </div>
               ) : !isBreakActive ? (
                  <div className="space-y-6">
                     {/* Tarjeta 1: Monitoreo de Postura */}
                     <div className="bg-white dark:bg-[#0B1B3D]/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl text-center">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">MONITOREO ACTIVO</span>
                        <h3 className="text-xl font-black text-[#0B1B3D] dark:text-white mb-6">Análisis de Postura</h3>
                        <div className="space-y-4 mb-6 text-left">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duración (Minutos)</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="120" 
                                value={isNaN(breakDuration) ? "" : breakDuration} 
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setBreakDuration(isNaN(val) ? 1 : Math.max(1, val));
                                }} 
                                className="w-full h-12 px-6 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black text-lg text-center focus:border-emerald-500 outline-none transition-all shadow-inner" 
                              />
                           </div>
                        </div>
                        <Button onClick={()=>{ setIsBreakActive(true); isBreakActiveRef.current=true; setIsCameraActive(true); setIsCameraLoading(true); setBreakTimeLeft(breakDuration*60); sessionScoresRef.current=[]; setTimeout(startIA, 1000); }} className="w-full h-14 bg-[#0B1B3D] hover:bg-[#1C305C] text-white font-black text-sm rounded-[1.5rem] shadow-xl transition-all hover:scale-[1.02]">ACTIVAR ANÁLISIS</Button>
                     </div>

                     {/* Tarjeta 2: Ejercicios de Rehabilitación */}
                     <div className="bg-white dark:bg-[#0B1B3D]/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl text-center">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-2">REHABILITACIÓN DIRECTA</span>
                        <h3 className="text-xl font-black text-[#0B1B3D] dark:text-white mb-6">Ejercicios Correctivos</h3>
                        <div className="space-y-4 mb-6 text-left">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Ejercicio</label>
                              <select 
                                onChange={e => {
                                  const selectedId = e.target.value;
                                  setSelectedExercise((EXERCISES as any)[selectedId]);
                                }}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-xs text-slate-600 dark:text-white focus:border-emerald-500 outline-none transition-all"
                              >
                                <option value="neck_stretch">🧘 Estiramiento Lateral de Cuello</option>
                                <option value="back_stretch">⚡ Estiramiento de Espalda Alta</option>
                                <option value="shoulder_shrug">💪 Rotación de Hombros</option>
                              </select>
                           </div>
                        </div>
                         <Button onClick={() => {
                           setExerciseMode(true);
                           if (!selectedExercise) {
                             setSelectedExercise(EXERCISES.neck_stretch);
                             setExerciseTimeLeft(EXERCISES.neck_stretch.duration_seconds);
                           } else {
                             setExerciseTimeLeft(selectedExercise.duration_seconds || 30);
                           }
                           setExerciseProgress(0);
                           setExerciseCompleted(false);
                           exerciseProgressRef.current = 0;
                           exerciseCompletedRef.current = false;
                           
                           setIsCameraActive(true);
                           setIsCameraLoading(true);
                           setTimeout(startIA, 1000);
                         }} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-[1.5rem] shadow-xl transition-all hover:scale-[1.02]">INICIAR EJERCICIO IA</Button>
                     </div>
                  </div>
               ) : (
                  <div className={`p-12 rounded-[3.5rem] text-white shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden transition-colors duration-500 ${
                    biometricState === 'optimal' ? 'bg-emerald-600' : 
                    biometricState === 'warning' ? 'bg-yellow-500' : 
                    'bg-red-600 animate-pulse'
                  }`}>
                     <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-6 tracking-tighter uppercase">
                          {biometricState === 'optimal' ? '✅ Postura Óptima' : 
                           biometricState === 'warning' ? '⚠️ Atención' : 
                           '🚨 Corregir Ahora'}
                        </h3>
                        <div className="bg-white/20 backdrop-blur-md p-8 rounded-3xl mb-10 border border-white/20 shadow-inner">
                           <p className="text-white text-xl font-black leading-relaxed">{suggestion}</p>
                        </div>
                        <Button onClick={finishBreak} className="w-full h-16 bg-white text-[#0B1B3D] font-black rounded-2xl hover:bg-slate-100 transition-all shadow-xl text-lg">FINALIZAR Y GUARDAR</Button>
                     </div>
                     <div className="absolute -bottom-10 -right-10 text-[12rem] opacity-10 font-black tracking-tighter">
                        {biometricState === 'optimal' ? 'OK' : biometricState === 'warning' ? '!!' : '!!'}
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
             <div className="bg-white dark:bg-[#0B1B3D]/50 p-12 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-5xl border border-emerald-500/20 shadow-inner">👤</div>
                   <div>
                      <h3 className="text-4xl font-black text-[#0B1B3D] dark:text-white tracking-tighter">Mi Perfil</h3>
                      <p className="text-slate-400 dark:text-blue-200/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Identidad ErgoIA</p>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                        <input type="text" value={profileName} onChange={e=>setProfileName(e.target.value)} className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black focus:border-emerald-500 outline-none transition-all shadow-sm" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dpto.</label>
                        <input type="text" value={profileDept} onChange={e=>setProfileDept(e.target.value)} className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black focus:border-emerald-500 outline-none transition-all shadow-sm" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                      <input type="email" value={profileEmail} onChange={e=>setProfileEmail(e.target.value)} className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black focus:border-emerald-500 outline-none transition-all shadow-sm" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <input type="password" value={profilePass} onChange={e=>setProfilePass(e.target.value)} placeholder="••••••••" className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black focus:border-emerald-500 outline-none transition-all shadow-sm" />
                   </div>
                   <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full h-18 bg-[#0B1B3D] dark:bg-emerald-600 text-white font-black text-lg rounded-[2rem] shadow-2xl mt-6 hover:scale-[1.02] transition-all">
                      {isUpdating ? "GUARDANDO..." : "ACTUALIZAR DATOS"}
                   </Button>
                </div>
             </div>
          </div>
        )}
      </div>

      {showResultModal && lastSessionData && (() => {
        const getRecommendedExercise = (score: number) => {
          if (score < 75) {
            return EXERCISES.back_stretch;
          } else if (score < 90) {
            return EXERCISES.neck_stretch;
          } else {
            return EXERCISES.shoulder_shrug;
          }
        };
        const recommendedEx = getRecommendedExercise(lastSessionData.score);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B1B3D]/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#0B1B3D] w-full max-w-xl rounded-[4rem] p-12 text-center border border-white/10 animate-in zoom-in duration-500 shadow-[0_0_80px_rgba(16,185,129,0.3)]">
               <div className="text-7xl font-black text-emerald-500 mb-2 tracking-tighter">{lastSessionData.score}%</div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Calificación ErgoIA</p>
               <h2 className="text-3xl font-black text-[#0B1B3D] dark:text-white mb-4 tracking-tight">¡Sesión Exitosa!</h2>
               <p className="text-sm font-bold text-slate-500 dark:text-blue-200/60 leading-relaxed mb-6 max-w-sm mx-auto">{lastSessionData.suggestion}</p>
               
               {/* Tarjeta de Rehabilitación Recomendada */}
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-6 mb-8 text-left relative overflow-hidden">
                 <div className="absolute right-6 top-6 text-5xl opacity-20">{recommendedEx.icon}</div>
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-1">REHABILITACIÓN RECOMENDADA POR IA</span>
                 <h4 className="text-lg font-black text-[#0B1B3D] dark:text-white mb-2">{recommendedEx.title}</h4>
                 <p className="text-xs text-slate-500 dark:text-blue-200/60 leading-relaxed mb-4">{recommendedEx.description}</p>
                 <div className="flex items-center gap-2">
                   <span className="text-[9px] bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-black px-3 py-1 rounded-full uppercase tracking-wider">⏱️ Tiempo recomendado: {recommendedEx.recommended_time}</span>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => {
                    setShowResultModal(false);
                    setExerciseMode(true);
                    setSelectedExercise(recommendedEx);
                    setExerciseProgress(0);
                    setExerciseCompleted(false);
                    exerciseProgressRef.current = 0;
                    exerciseCompletedRef.current = false;
                    setExerciseTimeLeft(recommendedEx.duration_seconds || 30);
                    
                    // Encender la cámara e iniciar
                    setIsCameraActive(true);
                    setIsCameraLoading(true);
                    setTimeout(startIA, 1000);
                  }}
                   INICIAR REHABILITACIÓN IA ⚡
                 </Button>
                 <Button onClick={() => setShowResultModal(false)} className="flex-1 h-16 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white font-black text-sm rounded-[1.8rem] transition-all">
                   CERRAR
                 </Button>
               </div>
            </div>
          </div>
        );
      })()}

      {selectedPrescription && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0B1B3D]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0B1B3D] w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 border border-white/10">
             <div className="p-12 bg-indigo-600 text-white relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">Centro de Triage</p>
                <h2 className="text-3xl font-black tracking-tighter">{selectedPrescription.title}</h2>
                <div className="absolute top-10 right-10 text-6xl opacity-10">🩺</div>
             </div>
             <div className="p-12 space-y-8">
                <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                   <p className="text-xl font-medium leading-relaxed text-slate-800 dark:text-white">{selectedPrescription.content || selectedPrescription.description}</p>
                </div>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-3xl">👤</div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emitido por</p>
                      <p className="text-sm font-bold text-indigo-600">Especialista ErgoIA</p>
                   </div>
                </div>
                <Button onClick={() => setSelectedPrescription(null)} className="w-full h-18 bg-[#0B1B3D] dark:bg-white dark:text-[#0B1B3D] text-white font-black text-lg rounded-[2rem] shadow-xl hover:scale-105 transition-all">ENTENDIDO</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}