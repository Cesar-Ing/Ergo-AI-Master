import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050B1A] font-sans text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-12 py-8 w-full max-w-7xl mx-auto z-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
            E
          </div>
          <span className="text-3xl font-black tracking-tighter text-white">
            Ergo<span className="text-emerald-500">IA</span>
          </span>
        </div>
        
        <nav className="hidden lg:flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/40">
          <Link href="#features" className="hover:text-emerald-400 transition-colors">Características</Link>
          <Link href="#clinical" className="hover:text-emerald-400 transition-colors">Evidencia Médica</Link>
          <Link href="#pricing" className="hover:text-emerald-400 transition-colors">Enterprise</Link>
        </nav>

        <div className="flex gap-6">
          <Link href="/login">
            <Button variant="ghost" className="text-blue-200/60 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest px-8">
              Portal de Salud
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] font-black text-[10px] uppercase tracking-widest px-10 h-12 rounded-xl">
              DEMO EN VIVO
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 w-full max-w-6xl mx-auto relative">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-12 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          IA Biomecánica en Tiempo Real
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-white">
          La evolución de la <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
            Salud Ocupacional
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-blue-200/40 max-w-3xl mx-auto mb-16 leading-relaxed font-bold tracking-tight">
          ErgoIA transforma cualquier cámara en un laboratorio de ergonomía clínica. <br className="hidden md:block" />
          Sin sensores, sin cables, 100% privacidad garantizada.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-80 h-20 bg-emerald-500 hover:bg-emerald-400 text-white text-lg rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-105 font-black uppercase tracking-widest">
              Iniciar Mi Análisis
            </Button>
          </Link>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-32 w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0B1B3D] rounded-[3rem] p-4 border border-white/10 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="z-10 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-pulse">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Motor de Visión Activo</h3>
              <p className="text-blue-200/40 font-bold uppercase text-xs tracking-widest">Analizando 32 puntos biomecánicos por segundo</p>
            </div>
            
            {/* Geometric accents */}
            <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-emerald-500/30"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-emerald-500/30"></div>
          </div>
        </div>
      </main>

      <footer className="px-12 py-12 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-blue-200/20">
          <p>© 2026 ErgoIA Systems. Todos los derechos reservados.</p>
          <div className="flex gap-12">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Seguridad Médica</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
