"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";


interface User { id: number; full_name: string; email: string; role: string; company: string; department: string; }
interface Config { [key: string]: string; }

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [configs, setConfigs] = useState<Config>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'user', department: 'General' });

  const [detailedActivity, setDetailedActivity] = useState<any[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    user_id: '',
    title: '',
    content: '',
    type: 'exercise'
  });

  useEffect(() => {
    setMounted(true);
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    // 1. Fetch Users con soporte de barra diagonal final
    try {
      const userData = await apiFetch('/users/');
      if (userData?.users) {
        setUsers(userData.users);
      } else if (Array.isArray(userData)) {
        setUsers(userData);
      }
    } catch (e) { 
      console.error("Error cargando usuarios:", e); 
    }

    // 2. Fetch Actividad Global
    try {
      const activityData = await apiFetch('/stats/global-activity');
      if (activityData) setGlobalActivity(activityData);
    } catch (e) {
      console.error("Error cargando actividad global:", e);
    }

    // 3. Fetch Configuración de Umbrales
    try {
      const configData = await apiFetch('/config');
      if (configData) setConfigs(configData);
    } catch (e) {
      console.error("Error cargando configs de red:", e);
    }

    // 4. Fetch Detalles de Actividades Recientes
    try {
      const detailsData = await apiFetch('/stats/activity-details');
      if (detailsData) setDetailedActivity(detailsData);
    } catch (e) {
      console.error("Error cargando logs detallados:", e);
    }

    // 5. Fetch Perfil de Usuario Logueado (para especialista_id)
    try {
      const me = await apiFetch('/users/me');
      if (me) setCurrentUser(me);
    } catch (e) {
      console.error("Error cargando perfil logueado:", e);
    }

    // 6. Fetch Prescripciones / Actividades Programadas
    try {
      const pData = await apiFetch('/prescriptions/');
      if (pData) setPrescriptions(pData);
    } catch (e) {
      console.error("Error cargando actividades programadas:", e);
    }
  };

  const fetchDetailsForDay = async (day: string | null) => {
    setLoadingDetails(true);
    setSelectedDayFilter(day);
    try {
      const url = day ? `/stats/activity-details?day=${day}` : '/stats/activity-details';
      const detailsData = await apiFetch(url);
      if (detailsData) setDetailedActivity(detailsData);
    } catch (e) {
      console.error("Error loading activity details:", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredActivities = detailedActivity.filter(act => {
    // 1. Filtro de búsqueda por colaborador (nombre o correo)
    const matchesSearch = searchQuery === "" || 
      act.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      act.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 2. Filtro de tipo de actividad
    const isExercise = act.metrics?.type === 'exercise';
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'exercise' && isExercise) || 
      (typeFilter === 'monitoring' && !isExercise);
      
    // 3. Filtro por nivel de riesgo / score
    const score = act.score || 0;
    const matchesRisk = riskFilter === 'all' || 
      (riskFilter === 'optimal' && score >= 75) || 
      (riskFilter === 'warning' && score >= 50 && score < 75) || 
      (riskFilter === 'critical' && score < 50);
      
    return matchesSearch && matchesType && matchesRisk;
  });

  const saveConfig = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      });
      setConfigs(prev => ({ ...prev, [key]: value }));
    } catch (e) { 
      alert("Error guardando configuración"); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      full_name: user.full_name, 
      email: user.email, 
      password: '', 
      role: user.role, 
      department: user.department || 'General' 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      refreshUsers();
    } catch (e) {
      alert("Error eliminando usuario");
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.user_id) {
      alert("Por favor seleccione un colaborador");
      return;
    }
    try {
      await apiFetch('/prescriptions/', {
        method: 'POST',
        body: JSON.stringify({
          specialist_id: currentUser?.id || 1,
          user_id: parseInt(scheduleForm.user_id),
          title: scheduleForm.title,
          content: scheduleForm.content,
          type: scheduleForm.type
        })
      });
      alert("¡Sesión/Actividad programada exitosamente!");
      setScheduleForm({ user_id: '', title: '', content: '', type: 'exercise' });
      // Refrescar lista de prescripciones
      const pData = await apiFetch('/prescriptions/');
      if (pData) setPrescriptions(pData);
    } catch (error: any) {
      alert(error.message || "Error al programar la actividad");
    }
  };

  const handleDeletePrescription = async (id: number) => {
    if (!confirm("¿Está seguro de que desea cancelar esta actividad programada?")) return;
    try {
      await apiFetch(`/prescriptions/${id}`, { method: 'DELETE' });
      // Refrescar lista de prescripciones
      const pData = await apiFetch('/prescriptions/');
      if (pData) setPrescriptions(pData);
    } catch (e: any) {
      alert(e.message || "Error al cancelar la actividad");
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/users/${editingUser.id}` : '/auth/register';
      
      const body = { ...formData };
      if (editingUser && !body.password) delete (body as any).password;

      await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      });
      
      setIsModalOpen(false);
      setEditingUser(null);
      refreshUsers();
    } catch (e: any) {
      alert(e.message || "Error al procesar usuario");
    }
  };

  const exportReport = async () => {
    try {
      const data = await apiFetch('/stats/activity-details');
      if (!data || data.length === 0) {
        alert("No hay registros de actividad para exportar.");
        return;
      }

      const headers = [
        "Colaborador",
        "Correo Electronico",
        "Departamento/Organizacion",
        "Fecha",
        "Hora",
        "Tipo de Actividad",
        "Detalle de Sesion",
        "Duracion",
        "Puntuacion ErgoIA"
      ];

      const rows = data.map((act: any) => {
        const isExercise = act.metrics?.type === 'exercise';
        const sessionDetail = act.metrics?.exerciseTitle || act.metrics?.postureState || (isExercise ? "Ejercicios sugeridos" : "Monitoreo Activo");
        
        const dateObj = new Date(act.start_time);
        const formattedDate = dateObj.toLocaleDateString('es-ES');
        const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        return [
          act.full_name,
          act.email,
          act.department || "General",
          formattedDate,
          formattedTime,
          isExercise ? "Entrenamiento Correctivo" : "Análisis de Postura",
          sessionDetail,
          act.duration,
          `${act.score}%`
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) => 
          row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
        )
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Auditoria_Global_ErgoIA_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Ocurrió un error al exportar la auditoría global.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0B1B3D] w-full max-w-md rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-[#0B1B3D] dark:text-white mb-8 tracking-tighter">
              {editingUser ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h2>
            <form onSubmit={handleSubmitUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Nombre Completo</label>
                <input 
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="Ej. Juan Perez"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Email Corporativo</label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                  placeholder="juan@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Contraseña {editingUser && '(Dejar vacío para no cambiar)'}</label>
                <input 
                  required={!editingUser}
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Rol</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm outline-none"
                  >
                    <option value="user">Usuario</option>
                    <option value="specialist">Especialista</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Departamento</label>
                  <input 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm outline-none"
                    placeholder="TI, Ventas..."
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl">
                  {editingUser ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white dark:bg-[#0B1B3D]/50 p-10 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5">
        <div>
          <h1 className="text-5xl font-black text-[#0B1B3D] dark:text-white tracking-tighter">Panel de Control ErgoIA</h1>
          <p className="text-slate-400 dark:text-blue-200/40 font-bold mt-2 text-lg">Gestión de Infraestructura y Umbrales Biomecánicos.</p>
          <div className="flex gap-4 mt-6">
            <Button onClick={exportReport} className="bg-[#0B1B3D] text-white font-black px-6 py-2 rounded-xl text-xs">
              ⬇ EXPORTAR AUDITORÍA GLOBAL
            </Button>
            <Button onClick={() => { setEditingUser(null); setFormData({full_name:'', email:'', password:'', role:'user', department:'General'}); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-black px-6 py-2 rounded-xl text-xs">
              + NUEVO USUARIO
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 text-center">
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Usuarios</p>
              <p className="text-3xl font-black text-emerald-600">{users.length}</p>
           </div>
           <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 text-center">
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Servidor</p>
              <p className="text-3xl font-black text-indigo-600">Online</p>
           </div>
        </div>
      </div>

      <div className="flex p-2 bg-slate-200/40 dark:bg-white/5 rounded-3xl w-fit mx-auto border border-white/50 backdrop-blur-xl">
        {["activity", "users"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === t ? "bg-[#0B1B3D] text-white shadow-2xl scale-105" : "text-slate-400 dark:text-blue-200/40 hover:text-slate-800"}`}>
            {t === 'activity' ? 'Actividad' : 'Cuentas'}
          </button>
        ))}
      </div>

      {activeTab === "activity" && (
        <div className="space-y-10">
          {/* Tarjetas de Días */}
          <div className="bg-white dark:bg-[#0B1B3D]/50 p-12 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl animate-in slide-in-from-bottom-10 duration-500">
             <h3 className="text-2xl font-black text-[#0B1B3D] dark:text-white mb-2 text-center">Actividad Global de la Red</h3>
             <p className="text-xs text-slate-400 dark:text-blue-200/40 font-bold mb-8 text-center uppercase tracking-widest">
               Haz clic en un día para filtrar y ver el detalle de los usuarios activos.
             </p>
             <div className="flex flex-wrap gap-8 justify-center">
                {/* Botón para resetear filtro */}
                <div 
                  onClick={() => fetchDetailsForDay(null)}
                  className={`flex flex-col items-center justify-center p-10 rounded-[3rem] border w-48 shadow-inner hover:scale-105 transition-all cursor-pointer ${!selectedDayFilter ? 'bg-[#0B1B3D] text-white border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.2)]' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-blue-200/60'}`}
                >
                   <p className="text-4xl">🌐</p>
                   <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Ver Recientes</p>
                </div>

                {globalActivity.map((a, i) => {
                  const isSelected = selectedDayFilter === a.day;
                  // Formatear fecha
                  const dateParts = a.day.split('-');
                  const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                  const formattedDay = localDate.toLocaleDateString([], {day:'2-digit', month:'short'});
                  return (
                    <div 
                      key={i} 
                      onClick={() => fetchDetailsForDay(isSelected ? null : a.day)}
                      className={`flex flex-col items-center bg-slate-50 dark:bg-white/5 p-10 rounded-[3rem] border w-48 shadow-inner hover:scale-105 transition-all cursor-pointer relative overflow-hidden group ${isSelected ? 'border-emerald-500/80 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/30' : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
                    >
                       {isSelected && (
                         <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] font-black text-white px-3 py-1 rounded-bl-xl tracking-widest uppercase">FILTRADO</div>
                       )}
                       <p className="text-[12px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{formattedDay}</p>
                       <p className="text-6xl font-black text-[#0B1B3D] dark:text-white mt-4">{a.count}</p>
                       <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-4">Usuarios Activos</p>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Tabla de Actividad Detallada */}
          <div className="bg-white dark:bg-[#0B1B3D]/50 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
             <div className="p-10 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-black/10">
                <div>
                   <h4 className="text-2xl font-black text-[#0B1B3D] dark:text-white tracking-tight">
                     {selectedDayFilter ? `Detalle de Actividad del ${new Date(parseInt(selectedDayFilter.split('-')[0]), parseInt(selectedDayFilter.split('-')[1]) - 1, parseInt(selectedDayFilter.split('-')[2])).toLocaleDateString([], {day:'numeric', month:'long', year:'numeric'})}` : 'Historial de Actividades Recientes'}
                   </h4>
                   <p className="text-xs text-slate-400 dark:text-blue-200/40 font-bold mt-1 uppercase tracking-widest">
                     Sesiones de Análisis Biomecánico y Ejercicios Correctivos registrados por los usuarios.
                   </p>
                </div>
                {selectedDayFilter && (
                   <button 
                     onClick={() => fetchDetailsForDay(null)}
                     className="px-6 py-2.5 bg-slate-200/50 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                   >
                     ❌ QUITAR FILTRO
                   </button>
                )}
             </div>

              {loadingDetails ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                   <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultando logs de red...</p>
                </div>
             ) : detailedActivity.length === 0 ? (
                <div className="py-20 text-center">
                   <p className="text-4xl mb-4">💤</p>
                   <p className="text-lg font-black text-slate-500 dark:text-blue-200/40 uppercase tracking-widest">Sin actividad registrada</p>
                   <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1">Ningún colaborador ha realizado entrenamientos o monitoreos con este filtro.</p>
                </div>
             ) : (
                <>
                   {/* Barra de Filtros Interactiva */}
                   <div className="p-8 bg-slate-50/50 dark:bg-black/10 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-6 items-center">
                      {/* Buscador de Colaborador */}
                      <div className="w-full md:flex-1 relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                         <input 
                           type="text" 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           placeholder="Buscar por colaborador o correo..."
                           className="w-full bg-white dark:bg-[#08132B] border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold focus:ring-2 ring-indigo-500 outline-none transition-all"
                         />
                      </div>
                      
                      {/* Selector de Tipo */}
                      <div className="w-full md:w-60">
                         <select 
                           value={typeFilter}
                           onChange={e => setTypeFilter(e.target.value)}
                           className="w-full bg-white dark:bg-[#08132B] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-xs font-bold outline-none"
                         >
                            <option value="all">🔍 Todas las Actividades</option>
                            <option value="monitoring">🔬 Análisis de Postura</option>
                            <option value="exercise">🏋️ Ejercicios Correctivos</option>
                         </select>
                      </div>

                      {/* Selector de Riesgo */}
                      <div className="w-full md:w-60">
                         <select 
                           value={riskFilter}
                           onChange={e => setRiskFilter(e.target.value)}
                           className="w-full bg-white dark:bg-[#08132B] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-xs font-bold outline-none"
                         >
                            <option value="all">⚠️ Todos los Riesgos</option>
                            <option value="optimal">🟢 Óptimo (&gt;= 75%)</option>
                            <option value="warning">🟡 Advertencia (50% - 74%)</option>
                            <option value="critical">🔴 Crítico (&lt; 50%)</option>
                         </select>
                      </div>
                   </div>

                   {filteredActivities.length === 0 ? (
                      <div className="py-20 text-center">
                         <p className="text-4xl mb-4">🔍</p>
                         <p className="text-lg font-black text-slate-500 dark:text-blue-200/40 uppercase tracking-widest">Sin resultados</p>
                         <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1">Intenta ajustando los criterios de búsqueda o de filtros.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-slate-100/50 dark:bg-black/25 border-b border-slate-100 dark:border-white/5">
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em]">Colaborador</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em]">Organización / Depto</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em]">Sesión / Actividad</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em]">Duración</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em] text-center">Score Promedio</th>
                                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.25em] text-right">Registro de Hora</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                               {filteredActivities.map((act) => {
                                  const isExercise = act.metrics?.type === 'exercise';
                            const score = act.score;
                            
                            // Determinar color de badge de score
                            let scoreBadgeColor = "bg-emerald-500 text-white shadow-emerald-500/10";
                            if (score < 50) {
                               scoreBadgeColor = "bg-red-500 text-white shadow-red-500/10";
                            } else if (score < 75) {
                               scoreBadgeColor = "bg-amber-500 text-slate-900 shadow-amber-500/10";
                            }

                            return (
                               <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200">
                                  <td className="px-10 py-6">
                                     <p className="font-black text-[#0B1B3D] dark:text-white text-base tracking-tight">{act.full_name}</p>
                                     <p className="text-[10px] text-slate-400 dark:text-blue-200/30 font-bold uppercase mt-0.5">{act.email}</p>
                                  </td>
                                  <td className="px-10 py-6">
                                     <span className="px-4 py-1.5 rounded-lg bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 dark:border-white/10 text-[9px] font-black text-indigo-600 dark:text-blue-300 uppercase tracking-wider">
                                        💼 {act.department}
                                     </span>
                                  </td>
                                  <td className="px-10 py-6">
                                     <div className="flex items-center gap-2">
                                        <span className="text-base">{isExercise ? "🏋️" : "🔬"}</span>
                                        <div>
                                           <p className="text-xs font-black text-slate-800 dark:text-blue-200 tracking-wide">
                                              {isExercise ? "Entrenamiento Correctivo" : "Análisis de Postura"}
                                           </p>
                                           <p className="text-[9px] text-slate-400 dark:text-blue-200/30 font-bold mt-0.5">
                                              {act.metrics?.exerciseTitle || act.metrics?.postureState || (isExercise ? "Ejercicios sugeridos" : "Monitoreo Activo")}
                                           </p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-10 py-6 font-bold text-slate-600 dark:text-blue-200/80 text-xs">
                                     ⏱️ {act.duration}
                                  </td>
                                  <td className="px-10 py-6 text-center">
                                     <span className={`inline-block px-5 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase shadow-sm ${scoreBadgeColor}`}>
                                        {score}%
                                     </span>
                                  </td>
                                  <td className="px-10 py-6 text-right font-bold text-slate-400 dark:text-blue-200/40 text-[10px] tracking-wider">
                                     {new Date(act.start_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             )}
          </>
       )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500">
           {/* Cabecera y Herramientas del Tab de Cuentas */}
           <div className="bg-white dark:bg-[#0B1B3D]/50 p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                 <h3 className="text-2xl font-black text-[#0B1B3D] dark:text-white tracking-tight">Gestión de Cuentas</h3>
                 <p className="text-xs text-slate-400 dark:text-blue-200/40 font-bold mt-1 uppercase tracking-widest">
                    Registra, edita o elimina credenciales y niveles de acceso a la red ErgoIA.
                 </p>
              </div>
              <button 
                onClick={() => { setEditingUser(null); setFormData({full_name:'', email:'', password:'', role:'user', department:'General'}); setIsModalOpen(true); }}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/10 hover:scale-105 transition-all"
              >
                 + NUEVO USUARIO
              </button>
           </div>

           {/* Tabla de Cuentas */}
           <div className="bg-white dark:bg-[#0B1B3D]/50 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                       <th className="px-12 py-8 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em]">Colaborador / Organización</th>
                       <th className="px-12 py-8 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em]">Nivel de Acceso</th>
                       <th className="px-12 py-8 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em] text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {users.map(u => {
                       let roleBadgeClass = "";
                       let roleLabel = "";
                       if (u.role === 'admin') {
                          roleBadgeClass = "bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-rose-500/5";
                          roleLabel = "🔴 Administrador";
                       } else if (u.role === 'specialist') {
                          roleBadgeClass = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-emerald-500/5";
                          roleLabel = "🟢 Especialista";
                       } else {
                          roleBadgeClass = "bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-blue-500/5";
                          roleLabel = "🔵 Colaborador";
                       }

                       return (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                             <td className="px-12 py-8">
                                <p className="font-black text-[#0B1B3D] dark:text-white text-xl tracking-tight">{u.full_name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                   <p className="text-[10px] text-slate-400 dark:text-blue-200/30 font-bold uppercase">{u.email}</p>
                                   <span className="text-slate-300 dark:text-white/10 text-xs">•</span>
                                   <p className="text-[10px] text-indigo-500 dark:text-indigo-400/80 font-black uppercase tracking-widest">💼 {u.department || 'General'}</p>
                                </div>
                             </td>
                             <td className="px-12 py-8">
                                <span className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm ${roleBadgeClass}`}>
                                   {roleLabel}
                                </span>
                             </td>
                             <td className="px-12 py-8 text-right space-x-6">
                                <button 
                                  onClick={() => handleEdit(u)} 
                                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline transition-all"
                                >
                                   ✍️ Editar
                                </button>
                                <button 
                                  onClick={() => handleDelete(u.id)} 
                                  className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest hover:underline transition-all"
                                >
                                   🗑️ Eliminar
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}


    </div>
  );
}
