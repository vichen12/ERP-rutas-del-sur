'use client'
import { useState } from 'react'
import { Truck, Lock, Mail, Loader2, ArrowRight } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = getSupabase()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert("Error de acceso: Credenciales no válidas")
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor (Cyber-Logistics style) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/40 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl space-y-8">
          
          {/* LOGO TÁCTICO */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-sky-500 rounded-3xl shadow-[0_0_30px_rgba(14,165,233,0.3)] mx-auto mb-2 group transition-transform hover:scale-110">
              <Truck className="text-white" size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                Rutas <span className="text-sky-500">del Sur</span>
              </h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Acceso Restringido - ERP v1.0</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rutasdelsur.com"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  Ingresar al Sistema <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              ERP de Gestión Interna • Mendoza, Argentina
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}