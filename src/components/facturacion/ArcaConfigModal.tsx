'use client'
import { useState, useEffect } from 'react'
import { X, Shield, Upload, CheckCircle2, AlertTriangle, Loader2, Wifi, XCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ArcaConfigModal({ isOpen, onClose, onSave, initialConfig }: any) {
  const [form, setForm] = useState({
    arca_cuit: '',
    arca_razon_social: '',
    arca_punto_venta: 1,
    arca_condicion_iva: 'RI',
    arca_entorno: 'homologacion',
    arca_certificado: '',
    arca_clave_privada: ''
  })
  const [saving, setSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle'|'success'|'error'>('idle')

  useEffect(() => {
    if (isOpen && initialConfig) {
      setForm({
        arca_cuit: initialConfig.arca_cuit || '',
        arca_razon_social: initialConfig.arca_razon_social || '',
        arca_punto_venta: initialConfig.arca_punto_venta || 1,
        arca_condicion_iva: initialConfig.arca_condicion_iva || 'RI',
        arca_entorno: initialConfig.arca_entorno || 'homologacion',
        arca_certificado: initialConfig.arca_certificado || '',
        arca_clave_privada: initialConfig.arca_clave_privada || ''
      })
      setTestStatus('idle')
    }
  }, [isOpen, initialConfig])

  function handleFileRead(field: string, file: File) {
    const r = new FileReader()
    r.onload = e => setForm(p => ({ ...p, [field]: e.target?.result as string }))
    r.readAsText(file)
  }

  async function testConnection() {
    setIsTesting(true)
    setTestStatus('idle')
    try {
      const res = await fetch('/api/arca/ping', { method: 'GET' })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestStatus('success')
        toast.success('Conexion verificada con AFIP')
      } else {
        throw new Error(data.error || 'No se pudo conectar')
      }
    } catch (e: any) {
      setTestStatus('error')
      toast.error(e.message)
    } finally {
      setIsTesting(false)
    }
  }

  async function handleGuardar() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setTestStatus('idle')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#141c28]/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#141c28] w-full max-w-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-gradient-to-r from-sky-500 to-emerald-500" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Configuracion</p>
            <h2 className="text-2xl font-black text-white uppercase">Datos de ARCA</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all"><X size={18} /></button>
        </div>

        {/* Entorno */}
        <div className="flex bg-[#141c28] p-1.5 rounded-2xl border border-white/5 mb-6">
          <button type="button" onClick={() => setForm(p => ({...p, arca_entorno: 'homologacion'}))}
            className={'flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ' + (form.arca_entorno === 'homologacion' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-white')}>
            Modo Prueba
          </button>
          <button type="button" onClick={() => setForm(p => ({...p, arca_entorno: 'produccion'}))}
            className={'flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ' + (form.arca_entorno === 'produccion' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-white')}>
            Produccion (Real)
          </button>
        </div>

        <div className="space-y-4">
          {/* CUIT + PV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tu CUIT</label>
              <input placeholder="20-12345678-9" value={form.arca_cuit}
                onChange={e => setForm(p => ({...p, arca_cuit: e.target.value}))}
                className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-sm tabular-nums outline-none focus:border-sky-500 placeholder:text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Punto de Venta</label>
              <input type="number" min="1" value={form.arca_punto_venta}
                onChange={e => setForm(p => ({...p, arca_punto_venta: Number(e.target.value)}))}
                className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-lg tabular-nums outline-none focus:border-sky-500" />
            </div>
          </div>

          {/* Razon Social */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Razon Social</label>
            <input placeholder="TU EMPRESA S.A." value={form.arca_razon_social}
              onChange={e => setForm(p => ({...p, arca_razon_social: e.target.value.toUpperCase()}))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-sm uppercase outline-none focus:border-sky-500 placeholder:text-slate-700" />
          </div>

          {/* Condicion IVA */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Condicion IVA</label>
            <div className="flex gap-2">
              {[{v:'RI',l:'Resp. Inscripto'},{v:'MONO',l:'Monotributista'},{v:'EX',l:'Exento'}].map(o => (
                <button key={o.v} type="button" onClick={() => setForm(p => ({...p, arca_condicion_iva: o.v}))}
                  className={'flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ' + (form.arca_condicion_iva === o.v ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white')}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Certificado */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Shield size={10} className="text-sky-400" /> Certificado Digital (.crt)
            </label>
            <div className={'border rounded-xl p-4 transition-all ' + (form.arca_certificado ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-white/10')}>
              {form.arca_certificado ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase flex-1">Certificado cargado</p>
                  <button type="button" onClick={() => setForm(p => ({...p, arca_certificado: ''}))} className="text-slate-600 hover:text-rose-500"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-1">
                  <Upload size={18} className="text-slate-600" />
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Subir archivo .crt</p>
                  <input type="file" accept=".crt,.pem" className="hidden" onChange={e => e.target.files?.[0] && handleFileRead('arca_certificado', e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          {/* Clave Privada */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Shield size={10} className="text-amber-400" /> Clave Privada (.key)
            </label>
            <div className={'border rounded-xl p-4 transition-all ' + (form.arca_clave_privada ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-white/10')}>
              {form.arca_clave_privada ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase flex-1">Clave cargada</p>
                  <button type="button" onClick={() => setForm(p => ({...p, arca_clave_privada: ''}))} className="text-slate-600 hover:text-rose-500"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-1">
                  <Upload size={18} className="text-slate-600" />
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Subir archivo .key</p>
                  <input type="file" accept=".key,.pem" className="hidden" onChange={e => e.target.files?.[0] && handleFileRead('arca_clave_privada', e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-3">
            <button onClick={handleGuardar} disabled={saving || !form.arca_cuit || !form.arca_razon_social}
              className="flex-1 py-4 rounded-xl bg-white text-black hover:bg-slate-200 disabled:opacity-40 font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl">
              {saving ? <Loader2 className="animate-spin" size={16} /> : 'Guardar'}
            </button>
            <button onClick={testConnection} disabled={isTesting || saving || !initialConfig?.arca_certificado}
              className={'flex-[1.2] py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2 border ' + (
                testStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                testStatus === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400 disabled:opacity-30'
              )}>
              {isTesting ? <><Loader2 className="animate-spin" size={14} /> Probando...</> :
               testStatus === 'success' ? <><CheckCircle2 size={14} /> Conectado</> :
               testStatus === 'error' ? <><XCircle size={14} /> Fallo</> :
               <><Wifi size={14} /> Probar Conexion</>}
            </button>
          </div>

          <div className="flex gap-3 p-3 bg-[#1a2537]/50 border border-white/5 rounded-xl">
            <HelpCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed">
              Primero guarda los datos. Despues usa Probar Conexion para verificar que todo funcione. Si no sabes como obtener el certificado, usa el boton de Ayuda en la pantalla principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}