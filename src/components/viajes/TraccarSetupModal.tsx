'use client'
// src/components/viajes/TraccarSetupModal.tsx
// Tutorial completo para configurar GPS en el ERP
// Cubre: Pressa, Traccar demo, instalación propia, y dispositivos comunes
import { useState, useEffect } from 'react'
import {
  X, Navigation, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, ChevronDown, ExternalLink, Copy, Check,
  Wifi, Server, Smartphone, Settings, Shield, Zap,
  ToggleLeft, ToggleRight
} from 'lucide-react'

interface TraccarConfig {
  traccar_url:      string
  traccar_email:    string
  traccar_password: string
  traccar_activo:   boolean
}

interface Props {
  isOpen:        boolean
  onClose:       () => void
  onSave:        (config: TraccarConfig) => Promise<void>
  initialConfig?: Partial<TraccarConfig>
}

type Proveedor = 'traccar_demo' | 'traccar_propio' | 'pressa' | null

const PASOS_TRACCAR_DEMO = [
  {
    n: 1,
    titulo: 'Crear cuenta gratis en Traccar',
    desc: 'Entrá a traccar.org y registrate con tu email. Es gratuito y tarda 1 minuto.',
    link: 'https://www.traccar.org/demo/',
    linkLabel: 'Abrir Traccar Demo',
  },
  {
    n: 2,
    titulo: 'Obtener el ID del dispositivo GPS',
    desc: 'En Traccar, ir a "Dispositivos" → "Agregar" → copiar el ID único (IMEI del GPS).',
  },
  {
    n: 3,
    titulo: 'Configurar el dispositivo GPS',
    desc: 'Enviá un SMS al dispositivo GPS con el comando de configuración. Para Coban/TK103: SMS al número del SIM del GPS.',
    code: 'SERVER,1,demo.traccar.org,5023,0#',
  },
  {
    n: 4,
    titulo: 'Conectar el ERP con Traccar',
    desc: 'Ingresá las credenciales de tu cuenta Traccar en el formulario de abajo.',
  },
]

const PASOS_PRESSA = [
  {
    n: 1,
    titulo: 'Pressa no tiene API pública',
    desc: 'Pressa es un servicio privado de GPS en Argentina. No expone una API REST accesible para integraciones externas.',
    alert: true,
  },
  {
    n: 2,
    titulo: 'Solución: Migrar a Traccar',
    desc: 'Los dispositivos que usa Pressa (Teltonika, Queclink, Coban) son 100% compatibles con Traccar. Solo cambiás el servidor al que reporta el GPS.',
    highlight: true,
  },
  {
    n: 3,
    titulo: 'Cambiar el servidor en el dispositivo GPS',
    desc: 'Pedile al técnico que reprogramó el GPS que apunte a tu servidor Traccar. O hacelo vos enviando un SMS de configuración.',
  },
  {
    n: 4,
    titulo: 'Alternativa: mantener Pressa y usar modo manual',
    desc: 'Si preferís seguir usando Pressa, podés cargar los KM reales manualmente en cada viaje. La auditoría funciona igual.',
  },
]

const DISPOSITIVOS = [
  { nombre: 'Coban / TK103',  cmd: 'SERVER,1,{HOST},5023,0#',   popular: true },
  { nombre: 'Teltonika FMB',  cmd: 'Configurar via Teltonika Configurator → Server → {HOST}:5023', popular: true },
  { nombre: 'Queclink GV300', cmd: 'AT+GTFRI=gv300,{HOST},5023,,0,0,0,0,0,,,,,,,,FFFF$', popular: false },
  { nombre: 'Sinotrack ST-901', cmd: 'SERVER,1,{HOST},5023,0#', popular: false },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all shrink-0"
      title="Copiar"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

export function TraccarSetupModal({ isOpen, onClose, onSave, initialConfig }: Props) {
  const [proveedor, setProveedor] = useState<Proveedor>(null)
  const [pasoActivo, setPasoActivo] = useState<number | null>(null)
  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState<TraccarConfig>({
    traccar_url: '', traccar_email: '', traccar_password: '', traccar_activo: false
  })

  useEffect(() => {
    if (!isOpen) return
    if (initialConfig) {
      setForm({
        traccar_url:      initialConfig.traccar_url      || '',
        traccar_email:    initialConfig.traccar_email    || '',
        traccar_password: initialConfig.traccar_password || '',
        traccar_activo:   initialConfig.traccar_activo   || false,
      })
      // Pre-seleccionar proveedor si ya hay config
      if (initialConfig.traccar_url) {
        setProveedor(initialConfig.traccar_url.includes('demo.traccar') ? 'traccar_demo' : 'traccar_propio')
      }
    }
    setTestResult(null)
  }, [isOpen, initialConfig])

  async function testConnection() {
    if (!form.traccar_url || !form.traccar_email) return
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/traccar/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const d = await res.json()
      setTestResult({ ok: d.ok, msg: d.ok ? `Conectado — ${d.user?.name || d.user?.email || 'OK'}` : d.error || 'Error de conexión' })
    } catch {
      setTestResult({ ok: false, msg: 'No se pudo conectar al servidor' })
    }
    setTesting(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const set = (field: keyof TraccarConfig, val: any) => setForm(p => ({ ...p, [field]: val }))

  if (!isOpen) return null

  const pasos = proveedor === 'pressa' ? PASOS_PRESSA : PASOS_TRACCAR_DEMO

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-2xl rounded-[3rem] border border-white/10 p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-300">

        {/* Barra top */}
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500" />

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-[0.4em] mb-1">Configuración GPS</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Rastreo Satelital</h2>
            <p className="text-[9px] font-bold text-slate-600 uppercase mt-1 tracking-wider">
              Integración Traccar · Compatible con Pressa, Teltonika, Coban
            </p>
          </div>
          <button onClick={onClose}
            className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* PASO 0: Elegir situación */}
        {!proveedor && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
              ¿Cuál es tu situación actual?
            </p>

            {[
              {
                id: 'pressa' as const,
                icon: '📡',
                titulo: 'Uso Pressa o similar',
                desc: 'Ya tengo GPS en los camiones con un proveedor como Pressa',
                color: 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5',
              },
              {
                id: 'traccar_demo' as const,
                icon: '🆓',
                titulo: 'Quiero usar Traccar gratuito',
                desc: 'Usar el servidor demo de Traccar (traccar.org) — sin costo',
                color: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5',
              },
              {
                id: 'traccar_propio' as const,
                icon: '🖥️',
                titulo: 'Tengo mi propio servidor Traccar',
                desc: 'Ya tengo Traccar instalado en mi servidor o VPS',
                color: 'border-sky-500/30 hover:border-sky-500/50 bg-sky-500/5',
              },
            ].map(op => (
              <button
                key={op.id}
                onClick={() => setProveedor(op.id)}
                className={`w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all group active:scale-98 ${op.color}`}
              >
                <span className="text-3xl shrink-0">{op.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-black text-white uppercase">{op.titulo}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{op.desc}</p>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-all shrink-0 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        )}

        {/* TUTORIAL */}
        {proveedor && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Botón volver */}
            <button
              onClick={() => { setProveedor(null); setPasoActivo(null) }}
              className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all"
            >
              ← Volver a opciones
            </button>

            {/* Título del tutorial */}
            <div className={`p-4 rounded-2xl border ${
              proveedor === 'pressa'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${proveedor === 'pressa' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {proveedor === 'pressa' && '⚠️ Sobre Pressa'}
                {proveedor === 'traccar_demo' && '✅ Traccar Gratuito — Paso a paso'}
                {proveedor === 'traccar_propio' && '🖥️ Tu servidor Traccar — Conectar'}
              </p>
            </div>

            {/* Pasos acordeón */}
            <div className="space-y-2">
              {pasos.map(paso => (
                <div
                  key={paso.n}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    (paso as any).alert      ? 'border-rose-500/30   bg-rose-500/5'   :
                    (paso as any).highlight  ? 'border-emerald-500/30 bg-emerald-500/5' :
                    pasoActivo === paso.n    ? 'border-sky-500/30 bg-sky-500/5'      :
                    'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPasoActivo(pasoActivo === paso.n ? null : paso.n)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      (paso as any).alert      ? 'bg-rose-500/20 text-rose-400'    :
                      (paso as any).highlight  ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-white/10 text-slate-400'
                    }`}>
                      {paso.n}
                    </span>
                    <p className="flex-1 text-[11px] font-black text-white uppercase tracking-tight">{paso.titulo}</p>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform shrink-0 ${pasoActivo === paso.n ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {pasoActivo === paso.n && (
                    <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-bold text-slate-300 uppercase leading-relaxed">
                        {paso.desc}
                      </p>
                      {(paso as any).link && (
                        <a
                          href={(paso as any).link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          <ExternalLink size={12} /> {(paso as any).linkLabel}
                        </a>
                      )}
                      {(paso as any).code && (
                        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl p-3 overflow-x-auto">
                          <code className="text-[10px] font-mono text-emerald-400 flex-1 whitespace-nowrap">
                            {(paso as any).code}
                          </code>
                          <CopyButton text={(paso as any).code} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dispositivos compatibles (solo si no es Pressa) */}
            {proveedor !== 'pressa' && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comandos por dispositivo</p>
                {DISPOSITIVOS.map(d => (
                  <div key={d.nombre} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="shrink-0 mt-0.5">
                      <Smartphone size={14} className="text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[9px] font-black text-white uppercase">{d.nombre}</p>
                        {d.popular && (
                          <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Popular</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-2 overflow-x-auto">
                        <code className="text-[9px] font-mono text-sky-400 flex-1 whitespace-nowrap">
                          {d.cmd.replace('{HOST}', form.traccar_url || 'TU-SERVIDOR.COM')}
                        </code>
                        <CopyButton text={d.cmd.replace('{HOST}', form.traccar_url || 'TU-SERVIDOR.COM')} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── FORMULARIO DE CONEXIÓN ─── */}
            {proveedor !== 'pressa' && (
              <div className="space-y-4 border-t border-white/10 pt-6">
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Conectar el ERP</p>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">URL del servidor Traccar</label>
                  <input
                    placeholder="https://demo.traccar.org  ó  https://mi-servidor.com:8082"
                    value={form.traccar_url}
                    onChange={e => set('traccar_url', e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-sm outline-none focus:border-sky-500 placeholder:text-slate-700 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email</label>
                    <input
                      type="email" placeholder="admin@empresa.com"
                      value={form.traccar_email}
                      onChange={e => set('traccar_email', e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 px-5 text-white font-bold text-sm outline-none focus:border-sky-500 placeholder:text-slate-700 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Contraseña</label>
                    <input
                      type="password" placeholder="••••••••"
                      value={form.traccar_password}
                      onChange={e => set('traccar_password', e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 px-5 text-white font-bold text-sm outline-none focus:border-sky-500 placeholder:text-slate-700 transition-all"
                    />
                  </div>
                </div>

                {/* Toggle activo */}
                <button
                  type="button"
                  onClick={() => set('traccar_activo', !form.traccar_activo)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    form.traccar_activo
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  {form.traccar_activo
                    ? <ToggleRight size={32} className="text-emerald-500 shrink-0" />
                    : <ToggleLeft  size={32} className="text-slate-600 shrink-0" />}
                  <div className="text-left">
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">
                      {form.traccar_activo ? 'Integración activa' : 'Integración inactiva'}
                    </p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase">
                      {form.traccar_activo
                        ? 'GPS sincroniza km automáticamente al llegar al destino'
                        : 'Todos los viajes quedan en modo manual'}
                    </p>
                  </div>
                </button>

                {/* Resultado del test */}
                {testResult && (
                  <div className={`flex gap-3 p-3 rounded-2xl border ${
                    testResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {testResult.ok
                      ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      : <AlertCircle  size={16} className="text-rose-500 shrink-0" />}
                    <p className={`text-[9px] font-black uppercase ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testResult.msg}
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={testing || !form.traccar_url || !form.traccar_email}
                    className="flex-1 py-4 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {testing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                    Probar conexión
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !form.traccar_url}
                    className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Modo manual si eligió Pressa */}
            {proveedor === 'pressa' && (
              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="p-5 bg-slate-900/50 border border-white/10 rounded-2xl space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mientras tanto: Modo Manual</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase leading-relaxed">
                    Podés usar el ERP normalmente. En cada viaje vas a ingresar los KM reales a mano.
                    La auditoría de combustible y las alertas funcionan igual — solo sin GPS automático.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[9px] tracking-widest transition-all"
                  >
                    Entendido — Usar modo manual
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 font-black uppercase text-center">
                  Cuando estés listo para migrar a Traccar, volvé aquí y elegí otra opción.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}