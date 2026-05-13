"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // No podemos usar useSearchParams directamente sin envolver en Suspense,
  // pero para evitar reescribir toda la estructura de Suspense, podemos leer la URL al montar.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setSuccess("Cuenta creada exitosamente. Por favor, inicia sesión.");
      }
    }
  }, []);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-[#0B1B3D] flex items-center justify-center font-bold text-2xl text-white shadow-lg border-4 border-white">
          E
        </div>
        
        <div className="text-center mt-8 mb-8">
          <h1 className="text-2xl font-bold text-[#0B1B3D] mb-2">Acceso a ErgoAI</h1>
          <p className="text-slate-500 text-sm font-medium">Portal de salud laboral. Ingresa tus credenciales.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm text-center font-medium">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Correo Electrónico Corporativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com" 
              required
              className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">Contraseña Segura</label>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md disabled:opacity-50 rounded-lg">
              {loading ? "Validando..." : "Ingresar al Portal"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className="h-px bg-slate-200 w-full"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">o ingresar con</span>
          <div className="h-px bg-slate-200 w-full"></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 bg-white hover:bg-slate-50 border-slate-200 font-semibold text-slate-600 shadow-sm" onClick={() => alert("Función OAuth no implementada (Mock)")}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>
          <Button variant="outline" className="h-11 bg-white hover:bg-slate-50 border-slate-200 font-semibold text-slate-600 shadow-sm" onClick={() => alert("Función OAuth no implementada (Mock)")}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <path d="M11.4 2.4L2.6 3.6C2.2 3.6 2 3.9 2 4.3V19.7C2 20.1 2.2 20.4 2.6 20.4L11.4 21.6C11.7 21.6 12 21.4 12 21.1V2.9C12 2.6 11.7 2.4 11.4 2.4Z" fill="#0078D4"/>
              <path d="M21.5 4.3L12 2.9V21.1L21.5 19.7C21.8 19.6 22 19.4 22 19.1V4.9C22 4.6 21.8 4.4 21.5 4.3Z" fill="#005A9E"/>
            </svg>
            Outlook
          </Button>
        </div>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm font-medium text-slate-600 mb-2">¿Eres nuevo en ErgoAI?</p>
          <Link href="/register" className="text-sm font-bold text-[#0B1B3D] hover:text-emerald-600 transition-colors">
            Crea tu cuenta corporativa aquí
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-[#0B1B3D] transition-colors">
            ← Regresar al sitio principal
          </Link>
        </div>
      </div>
    </div>
  );
}
