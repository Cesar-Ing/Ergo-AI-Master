"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export function DatabaseManager() {
  const [paradigm, setParadigm] = useState<'relational' | 'document' | 'graph' | 'object'>('relational');
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 5;");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = async () => {
    setIsLoading(true);
    try {
      const endpoint = paradigm === 'relational' ? '/database/relational/query' : `/database/${paradigm}/data`;
      const options = paradigm === 'relational' ? {
        method: 'POST',
        body: JSON.stringify({ query })
      } : {};
      
      const data = await apiFetch(endpoint, options);
      setResults(data);
    } catch (e) {
      setResults({ error: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B1B3D]/50 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-[#0B1B3D] dark:text-white tracking-tighter">Motor Multi-Modelo</h2>
          <p className="text-slate-400 dark:text-blue-200/40 text-xs font-bold uppercase tracking-widest mt-1">Gestión Unificada de Datos ErgoIA</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl">
          {(['relational', 'document', 'graph', 'object'] as const).map(p => (
            <button 
              key={p} 
              onClick={() => setParadigm(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${paradigm === p ? 'bg-[#0B1B3D] text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {paradigm === 'relational' && (
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 p-6 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 font-mono text-sm focus:border-indigo-500 outline-none transition-all shadow-inner"
            placeholder="Escribe tu consulta SQL aquí..."
          />
        )}
        
        <Button 
          onClick={executeQuery} 
          disabled={isLoading}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all"
        >
          {isLoading ? "EJECUTANDO..." : `EJECUTAR EN MODELO ${paradigm.toUpperCase()}`}
        </Button>
      </div>

      {results && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden border border-white/10 shadow-inner">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Resultados de Salida</p>
          <pre className="text-emerald-400 font-mono text-xs overflow-auto max-h-60 custom-scrollbar">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
