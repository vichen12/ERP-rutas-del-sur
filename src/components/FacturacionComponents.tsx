'use client'
// =============================================
// COMPONENTES DE FACTURACIÓN ARCA
// Exporta: FacturasHeader, FacturasKpis, FacturasTabla, FacturaModal, ArcaConfigModal
// El tutorial ARCA está integrado como modal interno en FacturasHeader
// =============================================
import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Settings, Plus, CheckCircle2, AlertCircle,
  Calendar, ChevronRight, X, Loader2, Upload,
  DollarSign, Building2, Shield, AlertTriangle,
  BookOpen, Terminal, Globe, Zap, Circle, ChevronDown,
  ExternalLink, Copy, Check
} from 'lucide-react'

// ════════════════════════════════════════
// TUTORIAL ARCA — Modal interno
// ════════════════════════════════════════
const PASOS_TUTORIAL = [
  {
    numero: 1, titulo: 'Crear la Clave Privada y el CSR', subtitulo: 'En tu computadora — una sola vez',
    color: 'sky', icon: Terminal,
    contenido: [
      { tipo: 'texto', valor: 'Necesitás tener instalado OpenSSL. Abrí una terminal (CMD en Windows, Terminal en Mac/Linux) y ejecutá estos dos comandos:' },
      { tipo: 'codigo', valor: 'openssl genrsa -out mi_empresa.key 2048\nopenssl req -new -key mi_empresa.key -out mi_empresa.csr' },
      { tipo: 'alerta', valor: 'Cuando te pida datos podés dejar todo en blanco con Enter, excepto "Common Name" donde ponés tu CUIT sin guiones (ej: 20123456789).' },
      { tipo: 'texto', valor: 'Al terminar tenés dos archivos: mi_empresa.key (clave privada) y mi_empresa.csr (solicitud de certificado).' },
      { tipo: 'link', valor: 'https://slproweb.com/products/Win32OpenSSL.html', texto: 'Descargar OpenSSL para Windows →' },
    ]
  },
  {
    numero: 2, titulo: 'Obtener el Certificado en ARCA', subtitulo: 'En el sitio web de ARCA/AFIP',
    color: 'violet', icon: Globe,
    contenido: [
      { tipo: 'texto', valor: 'Ingresá a ARCA con tu CUIT y clave fiscal:' },
      { tipo: 'link', valor: 'https://arca.gob.ar', texto: 'Abrir ARCA / AFIP →' },
      { tipo: 'pasos_internos', valor: ['Ingresá con CUIT + Clave Fiscal', 'Buscá "Administración de Certificados Digitales"', 'Hacé click en "Agregar Alias" — nombre: erp_rutas', 'Subí el archivo mi_empresa.csr del paso anterior', 'ARCA te devuelve un archivo .crt → descargalo'] },
      { tipo: 'alerta', valor: 'Guardá el .crt junto con el .key en una carpeta segura.' },
    ]
  },
  {
    numero: 3, titulo: 'Habilitar el Servicio WSFE', subtitulo: 'Web Service de Factura Electrónica',
    color: 'emerald', icon: Zap,
    contenido: [
      { tipo: 'texto', valor: 'Para emitir facturas, el certificado necesita permiso sobre el servicio de facturación:' },
      { tipo: 'pasos_internos', valor: ['Dentro de ARCA, ir a "Administrador de Relaciones de Clave Fiscal"', 'Seleccioná "Adherir Servicio"', 'Buscá el servicio "Factura Electrónica — WSFE"', 'Asocialo al certificado que creaste (alias del paso 2)', 'Guardá los cambios'] },
      { tipo: 'exito', valor: 'Una vez habilitado, el certificado tiene permisos para emitir facturas electrónicas.' },
    ]
  },
  {
    numero: 4, titulo: 'Cargar el Certificado en el ERP', subtitulo: 'Último paso — en este sistema',
    color: 'amber', icon: Upload,
    contenido: [
      { tipo: 'texto', valor: 'Con los archivos .crt y .key listos, configurá el ERP:' },
      { tipo: 'pasos_internos', valor: ['Cerrá este tutorial y abrí "Config. ARCA" (botón arriba)', 'Completá CUIT, Razón Social y Punto de Venta', 'Subí el archivo .crt en "Certificado Digital"', 'Subí el archivo .key en "Clave Privada"', 'Elegí Homologación para probar primero', 'Guardá — ¡listo para facturar!'] },
      { tipo: 'alerta', valor: 'Primero probá en Homologación. Las facturas de test no tienen validez fiscal.' },
      { tipo: 'exito', valor: 'Una vez configurado podés emitir facturas A, B y C directamente desde el ERP.' },
    ]
  }
]

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase text-slate-500 hover:text-white transition-all border border-white/5">
      {ok ? <><Check size={11} className="text-emerald-500" /> Copiado</> : <><Copy size={11} /> Copiar</>}
    </button>
  )
}

function TutorialArcaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(1)
  const [completados, setCompletados] = useState<number[]>([])
  const toggle = (n: number) => setCompletados(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  const colores: Record<string, any> = {
    sky:     { border: 'border-sky-500/30',     bg: 'bg-sky-500/10',     text: 'text-sky-400',     ring: 'ring-sky-500/20' },
    violet:  { border: 'border-violet-500/30',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  ring: 'ring-violet-500/20' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
    amber:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20' },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[998] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />

        <div className="flex justify-between items-start p-8 pb-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Guía de Configuración</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Cómo conectar ARCA</h2>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">4 pasos · Solo se hace una vez</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all mt-1"><X size={20} /></button>
        </div>

        {/* PROGRESO */}
        <div className="px-8 pt-5 pb-2">
          <div className="flex justify-between mb-2">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Progreso</span>
            <span className="text-[8px] font-black text-slate-500 uppercase">{completados.length}/{PASOS_TUTORIAL.length} pasos</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(completados.length / PASOS_TUTORIAL.length) * 100}%` }} />
          </div>
          {completados.length === PASOS_TUTORIAL.length && (
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2 text-center animate-in fade-in">
              ✓ Listo — cerrá y configurá el certificado en "Config. ARCA"
            </p>
          )}
        </div>

        <div className="p-8 pt-4 space-y-3">
          {PASOS_TUTORIAL.map(paso => {
            const c = colores[paso.color]
            const abierto = pasoAbierto === paso.numero
            const completado = completados.includes(paso.numero)
            const PasoIcon = paso.icon
            return (
              <div key={paso.numero} className={`rounded-[2rem] border transition-all overflow-hidden ${completado ? 'border-emerald-500/20 bg-emerald-500/5' : c.border + ' bg-slate-900/40'} ${abierto ? `ring-2 ${c.ring}` : ''}`}>
                <button onClick={() => setPasoAbierto(abierto ? null : paso.numero)} className="w-full flex items-center gap-4 p-5 text-left">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${completado ? 'bg-emerald-500/20 border-emerald-500/30' : c.bg + ' ' + c.border}`}>
                    {completado ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className={`text-base font-black ${c.text}`}>{paso.numero}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-0.5 ${completado ? 'text-emerald-500' : c.text}`}>{paso.subtitulo}</p>
                    <p className={`text-sm font-black uppercase ${completado ? 'text-emerald-300' : 'text-white'}`}>{paso.titulo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PasoIcon size={15} className={completado ? 'text-emerald-500' : c.text} />
                    {abierto ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-600" />}
                  </div>
                </button>

                {abierto && (
                  <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      {paso.contenido.map((item, idx) => {
                        if (item.tipo === 'texto') return <p key={idx} className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">{item.valor as string}</p>
                        if (item.tipo === 'codigo') return (
                          <div key={idx} className="rounded-xl overflow-hidden border border-white/5">
                            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
                              <div className="flex gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500/60" /><span className="w-2 h-2 rounded-full bg-amber-500/60" /><span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                              </div>
                              <CopyBtn text={item.valor as string} />
                            </div>
                            <pre className="p-4 text-emerald-400 text-xs font-mono bg-slate-950 overflow-x-auto leading-relaxed">{item.valor as string}</pre>
                          </div>
                        )
                        if (item.tipo === 'alerta') return (
                          <div key={idx} className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-amber-300/80 uppercase leading-relaxed">{item.valor as string}</p>
                          </div>
                        )
                        if (item.tipo === 'exito') return (
                          <div key={idx} className="flex gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-emerald-300/80 uppercase leading-relaxed">{item.valor as string}</p>
                          </div>
                        )
                        if (item.tipo === 'link') return (
                          <a key={idx} href={item.valor as string} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all">
                            <ExternalLink size={12} />{(item as any).texto || item.valor}
                          </a>
                        )
                        if (item.tipo === 'pasos_internos') return (
                          <div key={idx} className="space-y-1.5">
                            {(item.valor as string[]).map((sub, si) => (
                              <div key={si} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className={`shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black ${c.bg} ${c.text} border ${c.border}`}>{si + 1}</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed pt-0.5">{sub}</p>
                              </div>
                            ))}
                          </div>
                        )
                        return null
                      })}
                      <button onClick={() => toggle(paso.numero)}
                        className={`w-full mt-1 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all border flex items-center justify-center gap-2 ${
                          completado ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
                        }`}>
                        {completado ? <><CheckCircle2 size={13} /> Completado ✓</> : <><Circle size={13} /> Marcar como completado</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* FAQ */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 mt-2 space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><BookOpen size={13} /> Preguntas Frecuentes</p>
            {[
              { q: '¿Cada cuánto vence el certificado?', a: 'Dura 2 años. Cuando venza repetís el proceso desde el paso 1.' },
              { q: '¿Tengo que darle el .key a alguien?', a: 'No. La clave privada es tuya. Solo la subís al sistema, nunca se la das a nadie.' },
              { q: '¿Qué es Homologación?', a: 'Modo de pruebas de ARCA. Las facturas no tienen validez fiscal. Usalo antes de pasar a Producción.' },
              { q: '¿Puedo anular una factura?', a: 'No se pueden eliminar. Tenés que emitir una Nota de Crédito para anularla.' },
            ].map((item, i) => (
              <div key={i} className="border-t border-white/5 pt-3">
                <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1">{item.q}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black uppercase text-[9px] tracking-[0.3em] transition-all border border-white/5 flex items-center justify-center gap-2">
            <X size={15} /> Cerrar tutorial
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// FACTURAS HEADER — con botón "Cómo configurar" que abre el tutorial
// ════════════════════════════════════════
export function FacturasHeader({ arcaConfigurado, entorno, dateStart, setDateStart, dateEnd, setDateEnd, onNuevaFactura, onOpenConfig }: any) {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Facturación Electrónica</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
              ARCA<br /><span className="text-sky-500 font-thin">/ AFIP</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Emisión de comprobantes electrónicos · Rutas del Sur ERP</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest ${entorno === 'produccion' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              <Shield size={14} />
              {entorno === 'produccion' ? 'Producción' : 'Homologación (Test)'}
            </div>
            {/* BOTÓN TUTORIAL */}
            <button onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-[1.8rem] border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 font-black uppercase text-[9px] tracking-widest transition-all">
              <BookOpen size={14} /> Cómo configurar
            </button>
            <button onClick={onOpenConfig} className={`flex items-center gap-3 px-6 py-3 rounded-[1.8rem] border font-black uppercase text-[9px] tracking-widest transition-all ${arcaConfigurado ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'}`}>
              <Settings size={15} />
              {arcaConfigurado ? 'Config. ARCA' : 'Configurar ARCA ⚠'}
            </button>
            <button onClick={onNuevaFactura} disabled={!arcaConfigurado}
              className="flex items-center gap-3 px-10 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group">
              <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" /> Nueva Factura
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/40 px-6 py-3 rounded-[2rem] border border-white/5 w-fit">
          <Calendar size={16} className="text-sky-500" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Desde</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
          <ChevronRight size={14} className="text-slate-700" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Hasta</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
        </div>
      </div>
      <TutorialArcaModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  )
}

// ════════════════════════════════════════
// FACTURAS KPIS
// ════════════════════════════════════════
export function FacturasKpis({ kpis, loading }: any) {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-sky-500" size={32} /></div>
  const bloques = [
    { label: 'Facturas Emitidas',     value: kpis.emitidas,              color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',    icon: FileText },
    { label: 'Errores',               value: kpis.errores,               color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   icon: AlertCircle, alert: kpis.errores > 0 },
    { label: 'Facturado del Período', value: `$ ${kpis.totalMes.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: DollarSign },
    { label: 'Total Histórico',       value: `$ ${kpis.totalHist.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',  icon: Building2 },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans italic">
      {bloques.map((b, i) => (
        <div key={i} className={`relative rounded-[2.5rem] border p-7 overflow-hidden shadow-2xl ${b.bg} ${b.border} ${(b as any).alert ? 'ring-2 ring-rose-500/30' : ''}`}>
          <b.icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 pointer-events-none ${b.color}`} />
          <div className="relative z-10">
            <div className={`w-9 h-9 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center mb-3`}><b.icon size={16} className={b.color} /></div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{b.label}</p>
            <p className={`text-3xl font-black italic tabular-nums tracking-tighter mt-1 ${b.color}`}>{b.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════
// FACTURAS TABLA
// ════════════════════════════════════════
const TIPO_COLORS: Record<string, string> = {
  A: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  B: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  E: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function FacturasTabla({ facturas, loading }: any) {
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={40} /></div>
  return (
    <div className="space-y-4 font-sans italic">
      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Historial de Comprobantes</p>
        <span className="text-[9px] font-black text-slate-600 uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/5">{facturas.length} registros</span>
      </div>
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-6 pl-8">Fecha</th><th className="p-6">Tipo</th><th className="p-6">N° Comprobante</th>
                <th className="p-6">Cliente / Receptor</th><th className="p-6">CAE</th><th className="p-6">Vto. CAE</th>
                <th className="p-6 text-right">Total</th><th className="p-6 pr-8 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {facturas.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <FileText size={40} className="text-slate-600" />
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sin facturas en el período</p>
                  </div>
                </td></tr>
              ) : facturas.map((f: any) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="p-6 pl-8 text-sm font-bold text-slate-400">{new Date(f.fecha_comprobante + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                  <td className="p-6"><span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${TIPO_COLORS[f.tipo_comprobante] || TIPO_COLORS.B}`}>FACT. {f.tipo_comprobante}</span></td>
                  <td className="p-6"><p className="text-sm font-black text-white tabular-nums">{String(f.punto_venta).padStart(4,'0')}-{String(f.numero_comprobante).padStart(8,'0')}</p></td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-slate-300 uppercase">{f.clientes?.razon_social || f.razon_social_receptor || '—'}</p>
                    {f.cuit_receptor && <p className="text-[9px] text-slate-600 font-bold">{f.cuit_receptor}</p>}
                  </td>
                  <td className="p-6">{f.cae ? <p className="text-[10px] font-black text-emerald-400 tabular-nums font-mono">{f.cae}</p> : <span className="text-slate-700">—</span>}</td>
                  <td className="p-6 text-sm font-bold text-slate-400">{f.cae_vto ? new Date(f.cae_vto + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</td>
                  <td className="p-6 text-right"><p className="text-xl font-black text-white tabular-nums">$ {Number(f.importe_total).toLocaleString('es-AR')}</p></td>
                  <td className="p-6 pr-8 text-center">
                    <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border ${f.estado === 'emitida' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : f.estado === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>{f.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-white/5">
          {facturas.map((f: any) => (
            <div key={f.id} className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${TIPO_COLORS[f.tipo_comprobante] || TIPO_COLORS.B}`}>FACT. {f.tipo_comprobante}</span>
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${f.estado === 'emitida' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>{f.estado}</span>
              </div>
              <p className="text-base font-black text-white uppercase">{f.clientes?.razon_social || '—'}</p>
              <p className="text-2xl font-black text-sky-400 tabular-nums">$ {Number(f.importe_total).toLocaleString('es-AR')}</p>
              {f.cae && <p className="text-[9px] font-mono text-emerald-400">CAE: {f.cae}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// FACTURA MODAL
// ════════════════════════════════════════
const TIPOS_COMPROBANTE = [
  { value: 1,  label: 'Factura A', letra: 'A', desc: 'Resp. Inscripto → Resp. Inscripto' },
  { value: 6,  label: 'Factura B', letra: 'B', desc: 'Resp. Inscripto → Cons. Final' },
  { value: 11, label: 'Factura C', letra: 'C', desc: 'Monotributista' },
]
const ALICUOTAS = [
  { value: 0, label: 'Exento (0%)' }, { value: 10.5, label: '10.5%' },
  { value: 21, label: '21%' }, { value: 27, label: '27%' },
]

export function FacturaModal({ isOpen, onClose, onSubmit, isEmitting, clientes, viajes, remitos, puntoVenta }: any) {
  const [form, setForm] = useState({ tipo_comprobante: 6, fecha_comprobante: new Date().toISOString().split('T')[0], cliente_id: '', cuit_receptor: '', condicion_iva_receptor: 'CF', importe_neto: '', alicuota_iva: 21, concepto: 2, descripcion: 'SERVICIO DE TRANSPORTE', viaje_id: '', remito_id: '' })
  const importeIva   = useMemo(() => (Number(form.importe_neto) * form.alicuota_iva) / 100, [form.importe_neto, form.alicuota_iva])
  const importeTotal = useMemo(() => Number(form.importe_neto) + importeIva, [form.importe_neto, importeIva])
  useEffect(() => { if (isOpen) setForm({ tipo_comprobante: 6, fecha_comprobante: new Date().toISOString().split('T')[0], cliente_id: '', cuit_receptor: '', condicion_iva_receptor: 'CF', importe_neto: '', alicuota_iva: 21, concepto: 2, descripcion: 'SERVICIO DE TRANSPORTE', viaje_id: '', remito_id: '' }) }, [isOpen])
  function handleClienteChange(id: string) { const c = clientes.find((x: any) => x.id === id); setForm(p => ({ ...p, cliente_id: id, cuit_receptor: c?.cuit || '' })) }
  function handleViajeChange(id: string) { const v = viajes.find((x: any) => x.id === id); setForm(p => ({ ...p, viaje_id: id, ...(v?.precio ? { importe_neto: (Number(v.precio) / 1.21).toFixed(2) } : {}) })) }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-2xl rounded-[3rem] border border-white/10 p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-sky-500" />
        <div className="flex justify-between items-start mb-8">
          <div><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Nueva Factura Electrónica</p><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Emitir Comprobante</h2></div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, importe_iva: importeIva, importe_total: importeTotal, importe_neto: Number(form.importe_neto), punto_venta: puntoVenta }) }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tipo de Comprobante</label>
            <div className="flex gap-3">
              {TIPOS_COMPROBANTE.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, tipo_comprobante: t.value }))}
                  className={`flex-1 py-4 px-3 rounded-2xl border text-center transition-all ${form.tipo_comprobante === t.value ? `${TIPO_COLORS[t.letra]} shadow-lg` : 'bg-slate-900 border-white/5 text-slate-600 hover:text-white'}`}>
                  <p className="text-2xl font-black">{t.letra}</p><p className="text-[8px] font-black uppercase tracking-widest mt-1">{t.label}</p><p className="text-[7px] text-slate-600 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Cliente</label>
              <div className="relative">
                <select value={form.cliente_id} onChange={e => handleClienteChange(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">CONSUMIDOR FINAL</option>{clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">CUIT Receptor</label>
              <input placeholder="00000000000" value={form.cuit_receptor} onChange={e => setForm(p => ({ ...p, cuit_receptor: e.target.value.replace(/\D/g, '') }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm tabular-nums outline-none focus:border-sky-500 placeholder:text-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Viaje</label>
              <div className="relative">
                <select value={form.viaje_id} onChange={e => handleViajeChange(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">SIN VINCULAR</option>{viajes.map((v: any) => <option key={v.id} value={v.id}>{new Date(v.fecha).toLocaleDateString('es-AR')} — {v.clientes?.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Remito</label>
              <div className="relative">
                <select value={form.remito_id} onChange={e => setForm(p => ({ ...p, remito_id: e.target.value }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">SIN VINCULAR</option>{remitos.filter((r: any) => !r.facturado).map((r: any) => <option key={r.id} value={r.id}>Rem. {r.numero || r.id.substring(0,8)} — {r.clientes?.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Importe Neto (sin IVA)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
                <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.importe_neto} onChange={e => setForm(p => ({ ...p, importe_neto: e.target.value }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl tabular-nums outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Alícuota IVA</label>
              <div className="relative">
                <select value={form.alicuota_iva} onChange={e => setForm(p => ({ ...p, alicuota_iva: Number(e.target.value) }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm outline-none appearance-none uppercase">
                  {ALICUOTAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
          {form.importe_neto && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-white/5">
              {[{ label: 'Neto', value: Number(form.importe_neto), color: 'text-slate-300' }, { label: `IVA ${form.alicuota_iva}%`, value: importeIva, color: 'text-amber-400' }, { label: 'TOTAL', value: importeTotal, color: 'text-sky-400' }].map((r, i) => (
                <div key={i} className="text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{r.label}</p>
                  <p className={`text-lg font-black tabular-nums ${r.color}`}>$ {r.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm uppercase outline-none focus:border-sky-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Fecha</label>
              <input type="date" value={form.fecha_comprobante} onChange={e => setForm(p => ({ ...p, fecha_comprobante: e.target.value }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm outline-none [color-scheme:dark]" />
            </div>
          </div>
          <button type="submit" disabled={isEmitting} className="w-full py-5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl">
            {isEmitting ? <><Loader2 className="animate-spin" size={20} /> Enviando a ARCA...</> : <><CheckCircle2 size={20} /> Emitir Factura</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// ARCA CONFIG MODAL
// ════════════════════════════════════════
export function ArcaConfigModal({ isOpen, onClose, onSave, initialConfig }: any) {
  const [form, setForm] = useState({ arca_cuit: '', arca_razon_social: '', arca_punto_venta: 1, arca_condicion_iva: 'RI', arca_entorno: 'homologacion', arca_certificado: '', arca_clave_privada: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (isOpen && initialConfig) setForm({ arca_cuit: initialConfig.arca_cuit || '', arca_razon_social: initialConfig.arca_razon_social || '', arca_punto_venta: initialConfig.arca_punto_venta || 1, arca_condicion_iva: initialConfig.arca_condicion_iva || 'RI', arca_entorno: initialConfig.arca_entorno || 'homologacion', arca_certificado: initialConfig.arca_certificado || '', arca_clave_privada: initialConfig.arca_clave_privada || '' })
  }, [isOpen, initialConfig])
  function handleFileRead(field: string, file: File) { const r = new FileReader(); r.onload = e => setForm(p => ({ ...p, [field]: e.target?.result as string })); r.readAsText(file) }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-xl rounded-[3rem] border border-white/10 p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-gradient-to-r from-sky-500 to-emerald-500" />
        <div className="flex justify-between items-start mb-8">
          <div><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Integración AFIP</p><h2 className="text-2xl font-black text-white uppercase">Configurar ARCA</h2></div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all"><X size={20} /></button>
        </div>
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 mb-6">
          <button type="button" onClick={() => setForm(p => ({ ...p, arca_entorno: 'homologacion' }))} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.arca_entorno === 'homologacion' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-white'}`}>🧪 Homologación (Test)</button>
          <button type="button" onClick={() => setForm(p => ({ ...p, arca_entorno: 'produccion' }))} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.arca_entorno === 'produccion' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-white'}`}>✅ Producción (Real)</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">CUIT Emisor</label><input placeholder="20-12345678-9" value={form.arca_cuit} onChange={e => setForm(p => ({ ...p, arca_cuit: e.target.value }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm tabular-nums outline-none focus:border-sky-500 placeholder:text-slate-700" /></div>
            <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Punto de Venta</label><input type="number" min="1" value={form.arca_punto_venta} onChange={e => setForm(p => ({ ...p, arca_punto_venta: Number(e.target.value) }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-lg tabular-nums outline-none focus:border-sky-500" /></div>
          </div>
          <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Razón Social</label><input placeholder="EMPRESA S.A." value={form.arca_razon_social} onChange={e => setForm(p => ({ ...p, arca_razon_social: e.target.value.toUpperCase() }))} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm uppercase outline-none focus:border-sky-500 placeholder:text-slate-700" /></div>
          {/* CERTIFICADO */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Shield size={10} className="text-sky-400" /> Certificado Digital (.crt)</label>
            <div className={`border rounded-2xl p-4 transition-all ${form.arca_certificado ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-white/10'}`}>
              {form.arca_certificado ? (
                <div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /><p className="text-[10px] font-black text-emerald-400 uppercase">Certificado cargado ✓</p><button type="button" onClick={() => setForm(p => ({ ...p, arca_certificado: '' }))} className="ml-auto text-slate-600 hover:text-rose-500"><X size={16} /></button></div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-2"><Upload size={20} className="text-slate-600" /><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Subir archivo .crt</p><input type="file" accept=".crt,.pem" className="hidden" onChange={e => e.target.files?.[0] && handleFileRead('arca_certificado', e.target.files[0])} /></label>
              )}
            </div>
          </div>
          {/* CLAVE PRIVADA */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Shield size={10} className="text-amber-400" /> Clave Privada (.key)</label>
            <div className={`border rounded-2xl p-4 transition-all ${form.arca_clave_privada ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-white/10'}`}>
              {form.arca_clave_privada ? (
                <div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /><p className="text-[10px] font-black text-emerald-400 uppercase">Clave privada cargada ✓</p><button type="button" onClick={() => setForm(p => ({ ...p, arca_clave_privada: '' }))} className="ml-auto text-slate-600 hover:text-rose-500"><X size={16} /></button></div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-2"><Upload size={20} className="text-slate-600" /><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Subir archivo .key</p><input type="file" accept=".key,.pem" className="hidden" onChange={e => e.target.files?.[0] && handleFileRead('arca_clave_privada', e.target.files[0])} /></label>
              )}
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-amber-300/70 uppercase leading-relaxed">¿No sabés cómo obtener el certificado? Cerrá esta ventana y hacé click en <strong>"Cómo configurar"</strong> para ver el tutorial paso a paso.</p>
          </div>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false) }} disabled={saving || !form.arca_cuit || !form.arca_razon_social}
            className="w-full py-5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Guardar Configuración</>}
          </button>
        </div>
      </div>
    </div>
  )
}