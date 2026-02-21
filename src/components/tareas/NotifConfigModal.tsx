'use client'
import { useState, useEffect } from 'react'
import { X, Mail, Phone, CheckCircle2, Loader2, Bell, Info } from 'lucide-react'

interface NotifConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (email: string, whatsapp: string) => void
  initialEmail: string
  initialWhatsapp: string
}

export function NotifConfigModal({ isOpen, onClose, onSave, initialEmail, initialWhatsapp }: NotifConfigModalProps) {
  const [email, setEmail] = useState(initialEmail)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail)
      setWhatsapp(initialWhatsapp)
    }
  }, [isOpen, initialEmail, initialWhatsapp])

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    onSave(email, whatsapp)
    setTimeout(() => setSaving(false), 600)
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[3rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">

        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-gradient-to-r from-violet-500 to-emerald-500" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-violet-500">Sistema de Avisos</p>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Notificaciones
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* INFO */}
        <div className="flex gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-6">
          <Bell size={18} className="text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-violet-300/70 uppercase leading-relaxed">
            Cuando una tarea esté próxima a vencer o se reinicie automáticamente, recibirás un aviso por email y/o WhatsApp al contacto configurado acá.
          </p>
        </div>

        <div className="space-y-5">

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Mail size={10} className="text-emerald-400" /> Email de notificaciones
            </label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                type="email"
                placeholder="empresa@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-bold text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Phone size={10} className="text-emerald-400" /> WhatsApp (con código de país)
            </label>
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                type="tel"
                placeholder="5491112345678"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-black text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-2 px-2">
              <Info size={10} className="text-slate-600 shrink-0" />
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                Argentina: 549 + código de área + número. Ej: 5491154321234
              </p>
            </div>
          </div>

          {/* GUARDAR */}
          <button
            onClick={handleSave}
            disabled={saving || (!email && !whatsapp)}
            className="w-full py-5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl mt-2"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <CheckCircle2 size={20} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
