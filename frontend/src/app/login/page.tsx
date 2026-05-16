"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Detectar errores de NextAuth en la URL
  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      if (authError === "OAuthCallback") {
        setError("Error al comunicar con el servidor de autenticación. Verifica que el backend esté en línea.");
      } else {
        setError(`Error de autenticación: ${authError}`);
      }
    }
  }, [searchParams]);

  // Si ya hay una sesión de NextAuth, guardamos el token y redirigimos
  useEffect(() => {
    if (status === "authenticated" && session) {
      const backendToken = (session as any).backendToken;
      const role = (session as any).role || "user";
      
      if (backendToken) {
        localStorage.setItem("ergoai_token", backendToken);
        localStorage.setItem("ergoai_user_email", session.user?.email || "");
        localStorage.setItem("ergoai_user_role", role);
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa correo y contraseña.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ergoai_token", data.token);
        localStorage.setItem("ergoai_user_id", data.id);
        localStorage.setItem("ergoai_user_email", data.email);
        localStorage.setItem("ergoai_user_role", data.role);
        router.push("/dashboard");
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setError(`Redirigiendo a ${provider}...`);
    
    try {
      // Usamos el sistema profesional de NextAuth
      await signIn(provider.toLowerCase() === "outlook" ? "azure-ad" : "google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-sans bg-[#050B18]">
      {/* Fondo con imagen oficial */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      
      {/* Capa de degradado para profundidad */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#050B18]/20 via-[#050B18]/60 to-[#050B18]" />

      <div className="w-full max-w-md z-20 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/95 dark:bg-[#0B1B3D]/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          
          {/* Logo animado con la letra E original */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-4xl shadow-2xl transition-transform duration-500 group-hover:scale-110 border border-white/20">
                E
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#0B1B3D] dark:text-white tracking-tighter mb-2">Bienvenido</h1>
            <p className="text-slate-500 dark:text-blue-200/60 text-xs font-bold uppercase tracking-widest">Salud Ocupacional Inteligente</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 text-center font-black uppercase tracking-widest animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.2em] px-2">Email Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ergoai.com" 
                required
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#0B1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-[0.2em] px-2">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#0B1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/20 rounded-2xl transition-all active:scale-95"
              >
                {loading ? "Iniciando..." : "Entrar al Portal"}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="px-4 bg-white dark:bg-[#0B1B3D] text-slate-400 dark:text-blue-200/20">Acceso Rápido</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex items-center justify-center gap-3 h-12 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-blue-200/60">Google</span>
              </button>
              <button 
                onClick={() => handleSocialLogin("Outlook")}
                className="flex items-center justify-center gap-3 h-12 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-blue-200/60">Outlook</span>
              </button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
              Crear una nueva cuenta
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
