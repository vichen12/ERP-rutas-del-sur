'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Image from 'next/image' // 🚀 Importamos Image de Next.js para optimización
import Link from 'next/link'   // 🚀 Importamos Link para navegación rápida
import { 
  FileText, Search, Loader2,
  Building2, Image as ImageIcon, Camera, CheckCircle2,
  AlertTriangle, Filter, Truck, Calendar, X, Download, ArrowRight,
  Receipt
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function RemitosPage() {
  const [loading, setLoading] = useState(true)
  const [remitos, setRemitos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [clienteFilter, setClienteFilter] = useState('todos')
  const [estadoFilter, setEstadoFilter] = useState('todos')

  const [viewImageUrl, setViewImageUrl] = useState('')
  const [isViewOpen, setIsViewOpen] = useState(false)

  const supabase = getSupabase()

  useEffect(() => { 
    fetchData(); 
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: clientesData } = await supabase.from('clientes').select('id, razon_social').order('razon_social')
      if (clientesData) setClientes(clientesData)

      // 🚀 MEJORA 1: Agregamos la consulta de facturas al select de viajes
      const { data: viajesData, error: errViajes } = await supabase
        .from('viajes')
        .select('*, clientes(id, razon_social), facturas(id, estado, numero_comprobante, tipo_comprobante, punto_venta)')
        .order('fecha', { ascending: false })

      if (errViajes) throw errViajes;

      const { data: ccData, error: errCc } = await supabase
        .from('cuenta_corriente')
        .select('*')

      if (errCc) throw errCc;

      // CEREBRO MATEMÁTICO FIFO LOCAL
      const tripStatusMap: Record<string, string> = {}
      const tripDebeMap: Record<string, number> = {}
      const tripRemitoMap: Record<string, string> = {}
      const tripFaltaMap: Record<string, number> = {} 
      
      const clientsMap: Record<string, any[]> = {}

      ;(ccData || []).forEach(m => {
        if (!m.cliente_id) return;
        if (!clientsMap[m.cliente_id]) clientsMap[m.cliente_id] = []
        clientsMap[m.cliente_id].push(m)

        if (m.viaje_id) {
          tripDebeMap[m.viaje_id] = Number(m.debe || 0)
          if (m.remito) tripRemitoMap[m.viaje_id] = m.remito
        }
      })

      // Matemática por cliente
      for (const clientId in clientsMap) {
        const hist = clientsMap[clientId].sort((a, b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime())
        
        const pagosRaw = hist.filter(m => Number(m.haber) > 0)
        let plataDisponible = pagosRaw.reduce((acc, p) => acc + Number(p.haber || 0), 0)
        
        const viajesValidados = hist.filter(m => m.estado_gestion === 'por_cobrar' && Number(m.debe) > 0)

        for (const m of viajesValidados) {
          const costo = Number(m.debe)
          if (plataDisponible >= costo) {
            plataDisponible -= costo
            if (m.viaje_id) {
              tripStatusMap[m.viaje_id] = 'cobrado' 
              tripFaltaMap[m.viaje_id] = 0
            }
          } else if (plataDisponible > 0) {
            const falta = costo - plataDisponible
            plataDisponible = 0
            if (m.viaje_id) {
              tripStatusMap[m.viaje_id] = 'deuda_activa' 
              tripFaltaMap[m.viaje_id] = falta 
            }
          } else {
            if (m.viaje_id) {
              tripStatusMap[m.viaje_id] = 'deuda_activa'
              tripFaltaMap[m.viaje_id] = costo 
            }
          }
        }

        const maestro = hist.filter(m => (m.estado_gestion === 'maestro' || !m.estado_gestion) && Number(m.debe) > 0)
        for (const m of maestro) {
          if (m.viaje_id) {
            tripStatusMap[m.viaje_id] = 'bandeja_entrada'
            tripFaltaMap[m.viaje_id] = Number(m.debe)
          }
        }
      }

      // 4. Mapeamos la vista final
      const procesados = (viajesData || []).map((v: any) => {
        let estadoCalculado = tripStatusMap[v.id] || 'sin_remito'
        const numeroRemito = tripRemitoMap[v.id] || v.nro_remito || 'PENDIENTE';

        if (estadoCalculado === 'bandeja_entrada' && (!numeroRemito || numeroRemito === 'PENDIENTE')) {
           estadoCalculado = 'sin_remito'
        }

        const importeReal = tripDebeMap[v.id] || Number(v.monto_total || 0)
        const faltaReal = tripFaltaMap[v.id] !== undefined ? tripFaltaMap[v.id] : importeReal

        // 🚀 Buscamos si hay facturas asociadas a este viaje que estén emitidas
        const facturaAsociada = v.facturas?.find((f: any) => f.estado === 'emitida') || null;

        return {
          id: v.id,
          fecha: v.fecha || '',
          origen: v.origen || '',
          destino: v.destino || '',
          cliente_id: v.clientes?.id || '',
          cliente_nombre: v.clientes?.razon_social || 'S/D',
          nro_remito: numeroRemito,
          foto_url: v.foto_url || null,
          importe: importeReal,
          falta: faltaReal, 
          estado: estadoCalculado,
          factura: facturaAsociada // 🚀 Guardamos la info fiscal
        }
      })
      setRemitos(procesados)

    } catch (err: any) {
      console.error("Error cargando remitos:", err)
      alert("Error en la Base de Datos: " + (err.message || err.details || JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  const filtered = remitos.filter(r => {
    const matchSearch = r.nro_remito.toLowerCase().includes(search.toLowerCase()) || 
                        r.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
                        r.origen.toLowerCase().includes(search.toLowerCase()) ||
                        r.destino.toLowerCase().includes(search.toLowerCase())
    
    const matchCliente = clienteFilter === 'todos' || r.cliente_id === clienteFilter;
    const matchEstado = estadoFilter === 'todos' || r.estado === estadoFilter;

    return matchSearch && matchCliente && matchEstado;
  })

  const getEstadoBadge = (r: any) => {
    switch(r.estado) {
      case 'cobrado': return <span className="flex w-fit items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"><CheckCircle2 size={12}/> Cobrado 100%</span>
      case 'deuda_activa': return <span className="flex w-fit items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"><AlertTriangle size={14}/> Falta ${r.falta.toLocaleString('es-AR')}</span>
      case 'bandeja_entrada': return <span className="flex w-fit items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"><FileText size={12}/> En Bandeja</span>
      case 'sin_remito': return <span className="flex w-fit items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse"><Camera size={12}/> Falta Remito</span>
      default: return null;
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center font-sans italic">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-amber-500 animate-spin" size={48} />
        <p className="text-amber-500 font-black uppercase tracking-[0.3em]">Accediendo al Archivo Central...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 md:pt-40 relative overflow-x-hidden font-sans italic selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="max-w-7xl mx-auto px-6 space-y-10 relative z-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
              <FileText size={14} /> Archivo Digital
            </p>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">REMITOS</h1>
          </div>
          <div className="text-right w-full md:w-auto">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Documentos</p>
             <p className="text-4xl font-black tabular-nums text-white italic">{remitos.length}</p>
          </div>
        </header>

        <div className="bg-slate-900/50 border border-white/10 p-2 rounded-[2rem] flex flex-col md:flex-row gap-2 backdrop-blur-xl shadow-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input type="text" placeholder="Buscar por N° Remito, Ciudad..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-black/40 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:bg-black/60 font-black tracking-widest text-xs uppercase placeholder:text-slate-700 transition-all" />
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <select value={clienteFilter} onChange={e => setClienteFilter(e.target.value)} className="w-full h-full bg-black/40 rounded-3xl py-5 pl-12 pr-6 text-white outline-none focus:bg-black/60 font-black tracking-widest text-[10px] uppercase appearance-none cursor-pointer border-r-8 border-transparent">
                <option value="todos">Todos los Clientes</option>
                {clientes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.razon_social}</option>)}
              </select>
            </div>
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="w-full h-full bg-black/40 rounded-3xl py-5 pl-12 pr-6 text-white outline-none focus:bg-black/60 font-black tracking-widest text-[10px] uppercase appearance-none cursor-pointer border-r-8 border-transparent">
                <option value="todos">Cualquier Estado</option>
                <option value="cobrado">Cobrados 100%</option>
                <option value="deuda_activa">Pendientes de Pago</option>
                <option value="bandeja_entrada">En Bandeja</option>
                <option value="sin_remito">Falta Remito</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map(r => (
            <div key={r.id} className="bg-[#020617] border border-white/5 rounded-[2rem] p-4 pr-6 flex flex-col xl:flex-row items-center gap-6 hover:border-white/20 transition-all shadow-xl group">
               
               {/* 🚀 MEJORA 3: Imagen optimizada con Next/Image y loading perezoso */}
               <div onClick={() => { if(r.foto_url) { setViewImageUrl(r.foto_url); setIsViewOpen(true); } }} className={`w-full xl:w-40 h-32 xl:h-28 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center relative shrink-0 ${r.foto_url ? 'cursor-pointer hover:border-amber-500' : 'bg-white/5'}`}>
                 {r.foto_url ? (
                   <>
                     <Image src={r.foto_url} alt="Remito" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" sizes="(max-width: 768px) 100vw, 160px" />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><Search size={20} className="text-white" /></div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center text-slate-700"><ImageIcon size={24} strokeWidth={1.5} /><span className="text-[8px] font-black uppercase mt-1">Sin Foto</span></div>
                 )}
               </div>

               <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                 <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{r.cliente_nombre}</p>
                   <h3 className={`text-xl font-black italic tracking-tighter uppercase leading-none ${r.nro_remito === 'PENDIENTE' ? 'text-amber-500' : 'text-white'}`}>{r.nro_remito === 'PENDIENTE' ? 'S/N' : r.nro_remito}</h3>
                   
                   {/* 🚀 MEJORA 1: Badge Fiscal alineado con la fecha */}
                   <div className="flex items-center gap-3 mt-3">
                     <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5"><Calendar size={12}/> {new Date(r.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                     <div className="w-1 h-1 bg-white/10 rounded-full" />
                     {r.factura ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1"><Receipt size={10} /> Fact. {r.factura.tipo_comprobante}</span>
                     ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 opacity-70"><Receipt size={10} /> S/Facturar</span>
                     )}
                   </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex items-center gap-2"><Truck size={14} className="text-sky-500" /> <span className="text-[11px] font-bold text-slate-300 uppercase truncate">{r.origen}</span></div>
                    <div className="flex items-center gap-2"><Truck size={14} className="text-rose-500" /> <span className="text-[11px] font-bold text-slate-300 uppercase truncate">{r.destino}</span></div>
                 </div>

                 <div className="flex flex-row md:flex-col justify-between items-center md:items-end h-full w-full">
                    {getEstadoBadge(r)}
                    <div className="text-right mt-3">
                      <p className="text-2xl font-black italic tabular-nums text-white tracking-tighter">
                          ${r.importe.toLocaleString('es-AR')}
                      </p>
                      
                      {/* 🚀 MEJORA 2: Botón de acción rápida para abrir el detalle */}
                      <Link href="/viajes" className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors">
                        Ver Viaje <ArrowRight size={10} />
                      </Link>
                    </div>
                 </div>
               </div>
            </div>
          )) : (
            <div className="py-32 text-center opacity-30 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
               <FileText size={60} className="mx-auto mb-6 text-slate-600" />
               <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-500">El archivo está vacío</p>
               <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase">Ajustá los filtros de búsqueda</p>
            </div>
          )}
        </div>

        {isViewOpen && (
          <div className="fixed inset-0 z-[999] bg-[#020617]/98 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-[510]">
               <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3"><FileText size={18} className="text-amber-500"/> Visor de Documento</h3>
               <div className="flex gap-4">
                 <a href={viewImageUrl} download target="_blank" rel="noreferrer" className="p-4 bg-white/10 rounded-full text-white hover:bg-amber-500 transition-all"><Download size={20} /></a>
                 <button onClick={() => setIsViewOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={20} /></button>
               </div>
            </div>
            <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center mt-10">
               <img src={viewImageUrl} className="max-w-full max-h-full rounded-[2rem] object-contain shadow-[0_0_100px_rgba(245,158,11,0.15)] border border-white/10" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}