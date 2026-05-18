"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [streak, setStreak] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem('ergoai-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ergoai-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ergoai-theme', 'light');
    }
  };

  const handleLogout = async () => {
    // 1. Limpieza de NextAuth (Social)
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("NextAuth signOut error:", e);
    }

    // 2. Limpieza agresiva de todo rastro local
    localStorage.clear();
    sessionStorage.clear();
    
    // 3. Llamada de limpieza de cookies al servidor
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    
    // 4. Redirección inmediata y forzada
    window.location.href = '/login';
  };

  useEffect(() => {
    setMounted(true);
    const checkSession = async () => {
      try {
        // A. Intentar sesión del servidor
        const res = await fetch('/api/users/me');
        let data = res.ok ? await res.json() : null;

        // B. Respaldo de seguridad (Si el servidor no responde o es login manual reciente)
        if (!data || !data.id) {
          const localEmail = localStorage.getItem('ergoai_user_email');
          const localRole = localStorage.getItem('ergoai_user_role');
          if (localEmail) {
            data = { 
              id: localStorage.getItem('ergoai_user_id') || 'manual_user',
              email: localEmail,
              role: localRole || 'user',
              name: localEmail.split('@')[0]
            };
          }
        }

        if (data) {
          if (data.full_name) data.name = data.full_name;
          setSession(data);
          setLoading(false);
          
          // Cargar racha en background
          if (data.id && data.id !== 'manual_user') {
            fetch(`/api/breaks?userId=${data.id}`)
              .then(r => r.json())
              .then(bData => {
                if (!Array.isArray(bData) || bData.length === 0) {
                  setStreak(0);
                  return;
                }
                const days = Array.from(new Set(bData.map((b: any) => b.start_time.split('T')[0]))).sort().reverse() as string[];
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (!days.includes(today) && !days.includes(yesterday)) {
                  setStreak(0);
                  return;
                }
                let count = 0;
                let checkDate = days.includes(today) ? new Date(today) : new Date(yesterday);
                while (true) {
                  const checkStr = checkDate.toISOString().split('T')[0];
                  if (days.includes(checkStr)) {
                    count++;
                    checkDate.setDate(checkDate.getDate() - 1);
                  } else break;
                }
                setStreak(count);
              })
              .catch(() => {});
          }
        } else {
          // Si realmente no hay nada de nada, solo entonces mandamos al login
          window.location.href = '/login';
        }
      } catch (e) {
        setLoading(false);
      }
    };
    checkSession();
  }, [pathname]);

  // Prevenir Hydration Mismatch
  if (!mounted) return <div className="min-h-screen bg-[#0B1B3D]" />;

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0B1B3D] flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = session?.role || 'user';
  const userName = session?.name || 'Usuario';

   return (
    <div className={`min-h-screen flex overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#050B1A]' : 'bg-slate-50'}`}>
      {/* Sidebar - Siempre oscuro por diseño premium */}
      <aside className="w-80 bg-[#0B1B3D] text-white flex flex-col shadow-2xl relative z-30">
        <div className="py-12 px-10 flex flex-col items-center border-b border-white/5 bg-gradient-to-b from-[#0B1B3D] to-[#08132B]">
          <div className="relative group mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-[2.5rem] blur opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
            <div className="relative w-28 h-28 rounded-[2rem] bg-[#0B1B3D] border border-white/20 flex items-center justify-center text-5xl font-black text-white overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-transform group-hover:scale-105 duration-500">
              {session?.name ? session.name.charAt(0).toUpperCase() : 'U'}
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-xs font-black px-3 py-1 rounded-tl-xl shadow-xl border-t border-l border-white/20">🔥{streak}</div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight text-center leading-tight mb-1">{session?.name || 'Usuario'}</h2>
          <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.25em] opacity-80">{session?.department || 'Departamento General'}</p>
          <div className="flex gap-2 mt-5">
            <span className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase shadow-sm">{session?.role}</span>
            <span className="px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-300 uppercase shadow-sm">Verificado</span>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-6 space-y-1">
          <p className="text-[10px] font-black text-blue-300/30 uppercase tracking-[0.2em] mb-4 px-4">Menu</p>
          
          {role === "user" && (
            <Link href="/dashboard" className={`flex items-center px-5 py-4 rounded-2xl transition-all ${pathname === '/dashboard' ? 'bg-[#1C305C] text-white' : 'text-blue-200/50 hover:bg-white/5'}`}>
              <span className="mr-4">🏠</span> Mi Salud
            </Link>
          )}

          {role === "specialist" && (
            <Link href="/dashboard/reports" className={`flex items-center px-5 py-4 rounded-2xl transition-all ${pathname === '/dashboard/reports' ? 'bg-emerald-600 text-white' : 'text-blue-200/50 hover:bg-white/5'}`}>
              <span className="mr-4">🏥</span> Triage Médico
            </Link>
          )}

          {role === "admin" && (
            <Link href="/dashboard/admin" className={`flex items-center px-5 py-4 rounded-2xl transition-all ${pathname === '/dashboard/admin' ? 'bg-indigo-600 text-white' : 'text-blue-200/50 hover:bg-white/5'}`}>
              <span className="mr-4">⚙️</span> Consola Admin
            </Link>
          )}
        </nav>
        
        <div className="p-8">
           <button onClick={handleLogout} className="group flex items-center justify-center w-full py-4 rounded-2xl bg-white/5 text-blue-200/40 text-[10px] font-black hover:bg-red-500 hover:text-white transition-all gap-3 border border-white/5">
             <span className="text-base group-hover:scale-125 transition-transform">🚪</span> CERRAR SESIÓN
           </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#08132B]' : 'bg-white'}`}>
        <header className={`h-24 flex items-center justify-between px-12 z-20 border-b transition-colors duration-500 ${isDark ? 'bg-[#0B1B3D]/50 border-white/5' : 'bg-white border-slate-100'}`}>
          <p className={`text-lg font-black uppercase tracking-widest ${isDark ? 'text-blue-200' : 'text-[#0B1B3D]'}`}>{pathname.split('/').pop() || 'Dashboard'}</p>
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleTheme}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                 isDark ? 'bg-white/5 border-white/10 text-yellow-400' : 'bg-slate-50 border-slate-100 text-slate-400'
               }`}
             >
               {isDark ? '☀️' : '🌙'}
             </button>
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/10 text-blue-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>🔔</div>
          </div>
        </header>
        
        <div className={`flex-1 overflow-y-auto p-10 transition-colors duration-500 ${isDark ? 'bg-[#050B1A]' : 'bg-[#f8fafc]/50'}`}>
          {children}
        </div>

        {/* Global Status Bar */}
        <footer className={`h-12 border-t px-8 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isDark ? 'bg-[#0B1B3D] border-white/5 text-blue-200/40' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
          <div className="flex gap-8 items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              IA ENGINE: ONLINE
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              MULTI-MODEL DB: ACTIVE
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              API LATENCY: 12ms
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span>REGION: US-EAST-1</span>
            <span className="text-emerald-500">SYSTEM STABLE v0.1.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
