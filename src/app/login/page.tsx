'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Truck, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = getSupabase()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-sky-500 rounded-2xl mb-4 shadow-lg shadow-sky-500/20">
            <Truck className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white italic">RUTAS <span className="text-sky-500 text-not-italic">DEL SUR</span></h1>
          <p className="text-slate-400 text-xs mt-2 font-bold tracking-widest uppercase">Gestión Logística v1.0</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input name="email" type="email" placeholder="Email" required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-sky-500 outline-none" />
          <input name="password" type="password" placeholder="Contraseña" required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-sky-500 outline-none" />
          <button disabled={loading} className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-900/20 disabled:opacity-50 flex justify-center">
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  )
}