'use client'
import { useState } from 'react'
// 🚀 FIX: Agregamos BookOpen a los imports
import { 
  BookOpen, Terminal, Globe, Zap, Upload, CheckCircle2, 
  AlertTriangle, Circle, ChevronDown, ChevronRight, 
  ExternalLink, Copy, Check, X 
} from 'lucide-react'

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

export function TutorialArcaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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