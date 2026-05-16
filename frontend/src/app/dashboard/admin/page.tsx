"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";


interface User { id: number; full_name: string; email: string; role: string; company: string; department: string; }
interface Config { [key: string]: string; }

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [configs, setConfigs] = useState<Config>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'user', department: 'General' });

  useEffect(() => {
    setMounted(true);
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const [userData, activityData, configData] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/stats/global-activity'),
        apiFetch('/config')
      ]);
      
      if (userData?.users) setUsers(userData.users);
      if (activityData) setGlobalActivity(activityData);
      if (configData) setConfigs(configData);
    } catch (e) { 
      console.error("Admin Load Error:", e); 
    }
  };

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

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/users/${editingUser.id}` : '/users/';
      
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

  const exportReport = () => {
    window.print();
    alert("Reporte exportado correctamente.");
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
        {["activity", "users", "calibration"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === t ? "bg-[#0B1B3D] text-white shadow-2xl scale-105" : "text-slate-400 dark:text-blue-200/40 hover:text-slate-800"}`}>
            {t === 'activity' ? 'Actividad' : t === 'users' ? 'Cuentas' : 'Calibración IA'}
          </button>
        ))}
      </div>

      {activeTab === "activity" && (
        <div className="bg-white dark:bg-[#0B1B3D]/50 p-12 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl animate-in slide-in-from-bottom-10 duration-500">
           <h3 className="text-2xl font-black text-[#0B1B3D] dark:text-white mb-10 text-center">Actividad Global de la Red</h3>
           <div className="flex flex-wrap gap-8 justify-center">
              {globalActivity.map((a, i) => (
                <div key={i} className="flex flex-col items-center bg-slate-50 dark:bg-white/5 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 w-48 shadow-inner hover:scale-110 transition-all cursor-pointer">
                   <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.day).toLocaleDateString([], {day:'2-digit', month:'short'})}</p>
                   <p className="text-6xl font-black text-[#0B1B3D] dark:text-white mt-4">{a.count}</p>
                   <p className="text-[10px] font-black text-indigo-600 uppercase mt-4">Usuarios Activos</p>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white dark:bg-[#0B1B3D]/50 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                    <th className="px-12 py-10 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em]">Colaborador / Organización</th>
                    <th className="px-12 py-10 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em]">Nivel de Acceso</th>
                    <th className="px-12 py-10 text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.3em] text-right">Acciones</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                 {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                       <td className="px-12 py-10">
                          <p className="font-black text-[#0B1B3D] dark:text-white text-2xl tracking-tighter">{u.full_name}</p>
                          <p className="text-xs text-slate-400 dark:text-blue-200/40 font-bold uppercase mt-1">{u.email}</p>
                          <p className="text-[10px] text-slate-300 dark:text-blue-200/20 font-black uppercase mt-1 tracking-widest">{u.department || 'General'}</p>
                       </td>
                       <td className="px-12 py-10">
                          <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-sm ${u.role === 'admin' ? 'bg-indigo-600 text-white' : u.role === 'specialist' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                             {u.role}
                          </span>
                          {(u as any).last_login && (
                             <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-tighter">
                               Último ingreso: {new Date((u as any).last_login).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}
                             </p>
                          )}
                       </td>
                       <td className="px-12 py-10 text-right space-x-4">
                          <button onClick={() => handleEdit(u)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Editar</button>
                          <button onClick={() => handleDelete(u.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Eliminar</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === "calibration" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-white dark:bg-[#0B1B3D]/50 p-12 rounded-[4rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <h3 className="text-2xl font-black text-[#0B1B3D] dark:text-white mb-10 flex items-center gap-4">
                 <span className="text-3xl">⚙️</span> Umbrales de Postura
              </h3>
              <div className="space-y-12">
                 {[
                   { key: 'neck_threshold', label: 'Inclinación Cuello', min: 10, max: 45, unit: '°' },
                   { key: 'back_threshold', label: 'Inclinación Espalda', min: 5, max: 30, unit: '°' },
                 ].map(item => (
                    <div key={item.key} className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                          <span className="text-2xl font-black text-indigo-600">{configs[item.key] || '0'}{item.unit}</span>
                       </div>
                       <input 
                         type="range" 
                         min={item.min} 
                         max={item.max} 
                         value={configs[item.key] || item.min} 
                         onChange={(e) => saveConfig(item.key, e.target.value)}
                         className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       />
                       <p className="text-[8px] font-bold text-slate-300">Menos es más sensible, más permite mayor inclinación.</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#0B1B3D] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                 <span className="text-3xl">🧠</span> Sensibilidad IA
              </h3>
              <div className="space-y-12 relative z-10">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Confianza Mínima</label>
                       <span className="text-3xl font-black text-emerald-400">{Math.round(parseFloat(configs['sensitivity'] || '0.8') * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="0.95" 
                      step="0.05"
                      value={configs['sensitivity'] || '0.8'} 
                      onChange={(e) => saveConfig('sensitivity', e.target.value)}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <p className="text-[9px] font-bold text-blue-200/40 leading-relaxed">
                       Ajusta el umbral de confianza del modelo PoseNet. Un valor alto requiere una detección perfecta para puntuar.
                    </p>
                 </div>

                 <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
                    <p className="text-xs font-bold leading-relaxed opacity-70">
                       Los cambios realizados aquí afectan globalmente la precisión del cálculo del Score en tiempo real para todos los usuarios de la red ErgoIA.
                    </p>
                 </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full"></div>
           </div>
        </div>
      )}

    </div>
  );
}
