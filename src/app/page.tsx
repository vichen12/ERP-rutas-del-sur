import Link from 'next/link'
import { Truck, ArrowRight, ShieldCheck, Activity } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      
      {/* Background Glows (Identidad Rutas del Sur) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-4xl relative z-10 space-y-10">
        
        {/* Badge de Seguridad */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900/50 border border-white/10 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md">
          <Activity size={14} className="animate-pulse" /> Operaciones Activas
        </div>
        
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
            RUTAS <br />
            <span className="text-cyan-500">DEL SUR</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm md:text-lg max-w-xl mx-auto leading-relaxed uppercase tracking-[0.1em]">
            Ecosistema de gestión logística de alta precisión para transporte y control contable de flota.
          </p>
        </div>

        {/* Acceso Táctico */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
          <Link 
            href="/login" 
            className="group relative px-10 py-5 bg-cyan-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl overflow-hidden transition-all hover:bg-cyan-500 hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-600/20"
          >
            <span className="relative z-10 flex items-center gap-3">
              Entrar al Command Center <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <div className="flex items-center gap-4 text-slate-600">
             <div className="w-12 h-px bg-white/5" />
             <span className="text-[10px] font-black uppercase tracking-widest">v1.0.4 Security Link</span>
             <div className="w-12 h-px bg-white/5" />
          </div>
        </div>
      </div>

      {/* Footer Minimalista */}
      <footer className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em]">
          Mendoza • Argentina • 2026
        </p>
      </footer>
    </div>
  )
}