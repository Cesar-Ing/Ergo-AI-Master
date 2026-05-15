"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Por favor completa todos los campos.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // 1. Register the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      // 2. Automatically log them in after registration
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        localStorage.setItem("ergoai_token", loginData.token);
        localStorage.setItem("ergoai_user_email", loginData.email);
        localStorage.setItem("ergoai_user_role", loginData.role);
        router.push("/dashboard");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("Error de red. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-sans bg-[#050B18]">
      {/* Fondo con imagen oficial */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      
      {/* Capa de degradado */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#050B18]/20 via-[#050B18]/60 to-[#050B18]" />

      <div className="w-full max-w-md z-20 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/95 dark:bg-[#0B1B3D]/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-20 w-20 bg-[#0B1B3D] rounded-3xl overflow-hidden border border-white/20 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110">
                <img 
                  src="/min.png" 
                  alt="ErgoAI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#0B1B3D] dark:text-white tracking-tighter mb-2">Crear Cuenta</h1>
            <p className="text-slate-500 dark:text-blue-200/60 text-xs font-bold uppercase tracking-widest">Únete a la salud inteligente</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 text-center font-black uppercase tracking-widest">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-widest px-2">Nombre Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Perez" 
                required
                className="w-full h-12 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#0B1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-widest px-2">Email Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ergoai.com" 
                required
                className="w-full h-12 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#0B1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-blue-200/40 uppercase tracking-widest px-2">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="w-full h-12 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#0B1B3D] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm uppercase tracking-widest shadow-xl rounded-2xl transition-all active:scale-95"
              >
                {loading ? "Creando..." : "Registrar Cuenta"}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 dark:border-white/5 pt-6">
            <p className="text-xs font-bold text-slate-400 mb-2">¿Ya tienes cuenta?</p>
            <Link href="/login" className="text-xs font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
              Inicia sesión aquí
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
