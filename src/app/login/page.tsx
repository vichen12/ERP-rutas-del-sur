'use client'
import { useState } from 'react'
import { Lock, Mail, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { toast } from 'sonner'

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
      toast.error('Credenciales no válidas. Revisá tu email y contraseña.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1a] overflow-hidden">

      {/* ═══ PANEL IZQUIERDO — IMAGEN ═══ */}
      <div className="hidden lg:block w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1400&q=85')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0f1a]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/60 via-transparent to-[#0a0f1a]/30" />

        {/* Logo sobre imagen */}
        <div className="absolute top-10 left-10 z-10">
          <span className="text-2xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">
            Flet<span className="text-sky-400">X</span>
          </span>
        </div>

        {/* Texto inferior */}
        <div className="absolute bottom-12 left-10 z-10 space-y-3 max-w-xs">
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-[0.9] drop-shadow-2xl">
            Tu flota,<br />bajo <span className="text-sky-400">control</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed drop-shadow-lg">
            Viajes, choferes, caja, banco y AFIP en un solo sistema.
          </p>
        </div>
      </div>

      {/* ═══ PANEL DERECHO — FORM ═══ */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 relative">

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/8 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">

          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <span className="text-3xl font-black italic tracking-tighter text-white uppercase">
              Flet<span className="text-sky-400">X</span>
            </span>
          </div>

          {/* Encabezado */}
          <div className="mb-10">
            <p className="text-sky-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Bienvenido</p>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">
              Ingresá<br />a tu cuenta
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-sky-500/50 rounded-xl py-4 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-sky-500/50 rounded-xl py-4 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 group bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white py-4 rounded-xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-[0_4px_40px_rgba(14,165,233,0.3)] hover:shadow-[0_4px_60px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Ingresar
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] mt-10">
            FletX · Sistema de Gestión Logística
          </p>
        </div>
      </div>
    </div>
  )
}
