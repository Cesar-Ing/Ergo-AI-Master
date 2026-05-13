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
        localStorage.setItem("ergoai_user_email", loginData.email);
        localStorage.setItem("ergoai_user_role", loginData.role);
        router.push("/dashboard");
      } else {
        // If auto-login fails, just redirect to login page
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("Error de red. Intenta nuevamente.");
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
          <h1 className="text-2xl font-bold text-[#0B1B3D] mb-2">Crear Cuenta</h1>
          <p className="text-slate-500 text-sm font-medium">Únete a ErgoAI y mejora tu salud laboral.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez" 
              required
              className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
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
            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#0B1B3D] hover:bg-[#1a2f5c] text-white font-bold text-base shadow-md disabled:opacity-50 rounded-lg">
              {loading ? "Registrando..." : "Crear mi cuenta"}
            </Button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-600 mb-2">¿Ya tienes una cuenta?</p>
          <Link href="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
