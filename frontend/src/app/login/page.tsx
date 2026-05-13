"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Si ya hay una sesión de NextAuth, guardamos el token y redirigimos
  useEffect(() => {
    if (status === "authenticated" && session) {
      const backendToken = (session as any).backendToken;
      if (backendToken) {
        localStorage.setItem("ergoai_user_email", session.user?.email || "");
        localStorage.setItem("ergoai_user_role", "user"); // O el rol que devuelva tu backend
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
      const result = await signIn(provider.toLowerCase() === "outlook" ? "azure-ad" : "google", {
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(`Error de autenticación con ${provider}: ${result.error}`);
        setLoading(false);
      }
    } catch (err) {
      setError(`Error al conectar con el servicio de ${provider}.`);
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
            <div className={`p-3 border rounded-lg text-sm text-center font-medium ${error.includes('Redirigiendo') ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {error}
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

        {/* Sección de login social ocultada momentáneamente */}
        {/* 
        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">O continuar con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              type="button"
              variant="outline" 
              disabled={loading}
              className="h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold text-slate-700 flex items-center justify-center gap-2"
              onClick={() => handleSocialLogin("Google")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button 
              type="button"
              variant="outline" 
              disabled={loading}
              className="h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold text-slate-700 flex items-center justify-center gap-2"
              onClick={() => handleSocialLogin("Outlook")}
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Outlook
            </Button>
          </div>
        </div>
        */}
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm font-medium text-slate-600 mb-2">¿No tienes una cuenta?</p>
          <Link href="/register" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Crea tu cuenta aquí
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-[#0B1B3D] transition-colors">
            ← Regresar al sitio principal
          </Link>
        </div>
      </div>
    </div>
  );
}
