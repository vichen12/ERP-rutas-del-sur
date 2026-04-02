'use client'
import { useState } from 'react'
import {
  Terminal, Globe, Zap, Upload, CheckCircle2,
  AlertTriangle, Circle, ChevronDown, ChevronRight,
  ExternalLink, Copy, Check, X, HelpCircle
} from 'lucide-react'

const PASOS = [
  {
    n: 1, titulo: 'Crear la Clave y el Pedido', sub: 'En tu computadora',
    color: 'sky', Icon: Terminal,
    contenido: [
      { t: 'texto', v: 'Necesitas un programa llamado OpenSSL. Abri la terminal de tu computadora y copia estos dos comandos:' },
      { t: 'codigo', v: 'openssl genrsa -out mi_empresa.key 2048\nopenssl req -new -key mi_empresa.key -out mi_empresa.csr' },
      { t: 'alerta', v: 'Te va a pedir datos. Apreta Enter en todo menos en "Common Name" donde pones tu CUIT sin guiones (ej: 20123456789).' },
      { t: 'texto', v: 'Esto te genera dos archivos: mi_empresa.key (la clave) y mi_empresa.csr (el pedido de certificado).' },
      { t: 'link', v: 'https://slproweb.com/products/Win32OpenSSL.html', txt: 'Descargar OpenSSL para Windows' },
    ]
  },
  {
    n: 2, titulo: 'Pedir el Certificado en AFIP', sub: 'En la pagina de ARCA',
    color: 'violet', Icon: Globe,
    contenido: [
      { t: 'texto', v: 'Entra a ARCA con tu CUIT y clave fiscal:' },
      { t: 'link', v: 'https://arca.gob.ar', txt: 'Abrir ARCA / AFIP' },
      { t: 'pasos', v: ['Entra con CUIT + Clave Fiscal', 'Busca "Administracion de Certificados Digitales"', 'Click en "Agregar Alias" y ponele: erp_dallape', 'Subi el archivo mi_empresa.csr del paso anterior', 'ARCA te devuelve un archivo .crt - descargalo'] },
      { t: 'alerta', v: 'Guarda el .crt y el .key en un lugar seguro de tu computadora.' },
    ]
  },
  {
    n: 3, titulo: 'Habilitar Factura Electronica', sub: 'Permiso para facturar',
    color: 'emerald', Icon: Zap,
    contenido: [
      { t: 'texto', v: 'El certificado necesita permiso para emitir facturas:' },
      { t: 'pasos', v: ['Dentro de ARCA, ir a "Administrador de Relaciones de Clave Fiscal"', 'Click en "Adherir Servicio"', 'Buscar "Factura Electronica - WSFE"', 'Asociarlo al certificado que creaste', 'Guardar'] },
      { t: 'exito', v: 'Listo, ya tenes permiso para facturar desde el sistema.' },
    ]
  },
  {
    n: 4, titulo: 'Cargar en el Sistema', sub: 'Ultimo paso',
    color: 'amber', Icon: Upload,
    contenido: [
      { t: 'pasos', v: ['Cerra este tutorial', 'Abri "Configuracion" (boton arriba)', 'Completa tu CUIT y Razon Social', 'Subi el archivo .crt y el .key', 'Elegi "Modo Prueba" para probar primero', 'Guarda y proba la conexion'] },
      { t: 'exito', v: 'Una vez conectado podes emitir facturas A, B y C directamente desde aca.' },
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
  const [abierto, setAbierto] = useState<number|null>(1)
  const [hechos, setHechos] = useState<number[]>([])
  const toggle = (n: number) => setHechos(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  const colors: Record<string, any> = {
    sky: { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400', ring: 'ring-sky-500/20' },
    violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400', ring: 'ring-violet-500/20' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20' },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-[#141c28]/95 backdrop-blur-md p-4 overflow-y-auto font-sans italic" onClick={onClose}>
      <div className="bg-[#141c28] w-full max-w-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />

        <div className="flex justify-between items-start p-7 pb-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Guia paso a paso</p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Como conectar ARCA</h2>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">4 pasos - solo se hace una vez</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all"><X size={18} /></button>
        </div>

        {/* Progreso */}
        <div className="px-7 pt-4 pb-2">
          <div className="flex justify-between mb-2">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Progreso</span>
            <span className="text-[8px] font-black text-slate-500 uppercase">{hechos.length}/4</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: (hechos.length/4)*100 + '%' }} />
          </div>
          {hechos.length === 4 && <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2 text-center">Listo - cerra y configura el certificado</p>}
        </div>

        <div className="p-7 pt-3 space-y-3">
          {PASOS.map(paso => {
            const c = colors[paso.color]
            const open = abierto === paso.n
            const done = hechos.includes(paso.n)
            const PIcon = paso.Icon
            return (
              <div key={paso.n} className={'rounded-[1.5rem] border transition-all overflow-hidden ' + (done ? 'border-emerald-500/20 bg-emerald-500/5' : c.border + ' bg-[#1a2537]/40') + (open ? ' ring-2 '+c.ring : '')}>
                <button onClick={() => setAbierto(open ? null : paso.n)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className={'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ' + (done ? 'bg-emerald-500/20 border-emerald-500/30' : c.bg+' '+c.border)}>
                    {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <span className={'text-sm font-black '+c.text}>{paso.n}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={'text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 '+(done?'text-emerald-500':c.text)}>{paso.sub}</p>
                    <p className={'text-sm font-black uppercase '+(done?'text-emerald-300':'text-white')}>{paso.titulo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PIcon size={14} className={done?'text-emerald-500':c.text} />
                    {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-600" />}
                  </div>
                </button>

                {open && (
                  <div className="px-4 pb-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-white/5 pt-3 space-y-2.5">
                      {paso.contenido.map((item, idx) => {
                        if (item.t === 'texto') return <p key={idx} className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">{item.v as string}</p>
                        if (item.t === 'codigo') return (
                          <div key={idx} className="rounded-xl overflow-hidden border border-white/5">
                            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/5">
                              <div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-rose-500/60" /><span className="w-2 h-2 rounded-full bg-amber-500/60" /><span className="w-2 h-2 rounded-full bg-emerald-500/60" /></div>
                              <CopyBtn text={item.v as string} />
                            </div>
                            <pre className="p-3 text-emerald-400 text-xs font-mono bg-[#141c28] overflow-x-auto leading-relaxed">{item.v as string}</pre>
                          </div>
                        )
                        if (item.t === 'alerta') return (
                          <div key={idx} className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-amber-300/80 uppercase leading-relaxed">{item.v as string}</p>
                          </div>
                        )
                        if (item.t === 'exito') return (
                          <div key={idx} className="flex gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-emerald-300/80 uppercase leading-relaxed">{item.v as string}</p>
                          </div>
                        )
                        if (item.t === 'link') return (
                          <a key={idx} href={item.v as string} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-500/20 transition-all">
                            <ExternalLink size={11} />{(item as any).txt || item.v}
                          </a>
                        )
                        if (item.t === 'pasos') return (
                          <div key={idx} className="space-y-1.5">
                            {(item.v as string[]).map((sub, si) => (
                              <div key={si} className="flex items-start gap-2.5 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                                <span className={'shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black '+c.bg+' '+c.text+' border '+c.border}>{si+1}</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed pt-0.5">{sub}</p>
                              </div>
                            ))}
                          </div>
                        )
                        return null
                      })}
                      <button onClick={() => toggle(paso.n)}
                        className={'w-full mt-1 py-2.5 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all border flex items-center justify-center gap-2 ' + (
                          done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
                        )}>
                        {done ? <><CheckCircle2 size={12} /> Hecho</> : <><Circle size={12} /> Marcar como hecho</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* FAQ simplificado */}
          <div className="bg-[#1a2537]/40 border border-white/5 rounded-[1.5rem] p-5 space-y-2.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><HelpCircle size={12} /> Preguntas</p>
            {[
              { q: 'Cada cuanto vence el certificado?', a: 'Cada 2 anos. Cuando venza repetis el proceso.' },
              { q: 'Que es Modo Prueba?', a: 'Es para probar sin generar facturas reales. Usalo antes de pasar a Produccion.' },
              { q: 'Se puede anular una factura?', a: 'No se borran. Tenes que emitir una Nota de Credito.' },
            ].map((item, i) => (
              <div key={i} className="border-t border-white/5 pt-2.5">
                <p className="text-[9px] font-black text-white uppercase tracking-widest mb-0.5">{item.q}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black uppercase text-[9px] tracking-[0.3em] transition-all border border-white/5 flex items-center justify-center gap-2">
            <X size={14} /> Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}