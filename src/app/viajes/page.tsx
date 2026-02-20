'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
// 🚀 CAMBIO CLAVE: Importación directa para estabilidad de sesión
import { supabase } from '@/lib/supabase'
import { 
  Loader2, Truck, MapPin, SearchX, ArrowRightLeft, 
  Calendar, ShieldCheck, TrendingUp, Info, FilterX 
} from 'lucide-react'

// Componentes del sistema
import { ViajesHeader } from '@/components/ViajesHeader'
import { ViajeModal } from '@/components/ViajeModal'

export default function ViajesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ida' | 'retorno' | 'global'>('global')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filtros de fecha (Mes actual por defecto)
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); 
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showAllTime, setShowAllTime] = useState(false)

  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [precioGasoil, setPrecioGasoil] = useState(0)

  const initialFormState = {
    cliente_id: '', chofer_id: '', camion_id: '', origen: 'MENDOZA', 
    destino: '', fecha: new Date().toISOString().split('T')[0],
    km_recorridos: '', es_retorno: false, engrase: false,
    tarifa_flete: '', pago_chofer: '', lts_gasoil: '',
    precio_gasoil: '', costo_descarga: '', desgaste_por_km: '180'
  };

  const [formData, setFormData] = useState<any>(initialFormState)

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [])

  // --- 🛰️ MOTOR DE CARGA SINCRONIZADO CON LA DB REAL ---
  async function fetchData() {
    setLoading(true)
    try {
      console.log("🚀 Iniciando sincronización de datos...");
      
      const [v, cl, ch, ca, conf] = await Promise.all([
        // 1. Viajes (Relaciones automáticas de Supabase)
        supabase.from('viajes').select('*, clientes(razon_social), choferes(nombre), camiones(patente)').order('fecha', { ascending: false }),
        
        // 2. Clientes (Traemos todo para el ADN)
        supabase.from('clientes').select('*').order('razon_social'),
        
        // 3. Choferes
        supabase.from('choferes').select('id, nombre').order('nombre'),
        
        // 4. Camiones
        supabase.from('camiones').select('id, patente, km_actual, operador_id').order('patente'),
        
        // 5. Precio Gasoil
        supabase.from('configuracion').select('precio_gasoil').single()
      ]);

      if (v.error) console.error("❌ Error Viajes:", v.error.message);
      if (ca.error) console.error("❌ Error Camiones:", ca.error.message);

      setViajes(v.data || []);
      setClientes(cl.data || []);
      setChoferes(ch.data || []);
      setCamiones(ca.data || []);
      if (conf.data) setPrecioGasoil(conf.data.precio_gasoil);
      
      console.log("✅ Datos cargados: ", v.data?.length, "viajes encontrados.");

    } catch (e) { 
      console.error("❌ Fallo Crítico:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  // --- 🔍 MOTOR DE BÚSQUEDA MULTI-CAMPO (Blindado) ---
  const filteredViajes = useMemo(() => {
    const term = search.toLowerCase().trim();
    
    return (viajes || []).filter(v => {
      // Búsqueda en campos anidados y directos
      const searchableText = [
        v.clientes?.razon_social,
        v.origen,
        v.destino,
        v.camiones?.patente,
        v.choferes?.nombre
      ].some(c => String(c || '').toLowerCase().includes(term));

      const matchesTab = activeTab === 'global' ? true : (activeTab === 'ida' ? !v.es_retorno : v.es_retorno);
      const matchesDate = showAllTime || (v.fecha >= dateStart && v.fecha <= dateEnd);

      return searchableText && matchesTab && matchesDate;
    })
  }, [viajes, search, activeTab, dateStart, dateEnd, showAllTime])

  // --- 📈 CÁLCULOS KPI ---
  const stats = useMemo(() => {
    return filteredViajes.reduce((acc, v) => {
      const bruta = Number(v.tarifa_flete) || 0;
      const pagoCh = Number(v.pago_chofer) || 0;
      const costoGas = (Number(v.lts_gasoil) || 0) * (Number(v.precio_gasoil) || precioGasoil);
      const descarga = Number(v.costo_descarga) || 0;
      const neta = bruta - pagoCh - costoGas - descarga;

      return {
        km: acc.km + (Number(v.km_recorridos) || 0),
        bruta: acc.bruta + bruta,
        neta: acc.neta + neta,
        totalSiva: acc.totalSiva + (neta / 1.21),
        totalLts: acc.totalLts + (Number(v.lts_gasoil) || 0),
        totalChofer: acc.totalChofer + pagoCh,
        totalCostos: acc.totalCostos + costoGas + descarga
      }
    }, { km: 0, bruta: 0, neta: 0, totalSiva: 0, totalLts: 0, totalChofer: 0, totalCostos: 0 })
  }, [filteredViajes, precioGasoil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      console.log("📤 Preparando envío de viaje...");

      // 🧹 LIMPIEZA DE PAYLOAD: Excluimos propiedades auxiliares
      const { precio_gasoil_sugerido, desgaste_por_km, ...payloadLimpio } = formData;
      
      const { data: nV, error: eV } = await supabase
        .from('viajes')
        .insert([payloadLimpio])
        .select()
        .single();
      
      if (eV) throw eV;
      
      // Operaciones en cascada
      await Promise.all([
        supabase.from('remitos').insert([{ viaje_id: nV.id, cliente_id: payloadLimpio.cliente_id, numero_remito: 'PENDIENTE' }]),
        payloadLimpio.cliente_id && supabase.from("cuenta_corriente").insert([{ 
          cliente_id: payloadLimpio.cliente_id, fecha: payloadLimpio.fecha, tipo_movimiento: 'DEBE', 
          detalle: `FLETE: ${payloadLimpio.origen} > ${payloadLimpio.destino}`, debe: Number(payloadLimpio.tarifa_flete) 
        }]),
        payloadLimpio.camion_id && supabase.from('camiones').update({ 
          km_actual: (camiones.find(c => c.id === payloadLimpio.camion_id)?.km_actual || 0) + (Number(payloadLimpio.km_recorridos) || 0) 
        }).eq('id', payloadLimpio.camion_id)
      ]);

      console.log("✅ Viaje guardado correctamente");
      setIsModalOpen(false); 
      setFormData(initialFormState); // Reseteamos el form
      fetchData();
    } catch (err: any) { 
      console.error("🔥 Error al guardar:", err);
      alert("Error: " + err.message);
    } finally { 
      setIsSubmitting(false);
    }
  }

  if (!mounted || loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500 w-12 h-12 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Sincronizando Bitácora...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-24 md:pt-32 font-sans italic selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-40" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12 relative z-10">
        
        <ViajesHeader 
          search={search} setSearch={setSearch} onOpenModal={() => {
            setFormData(initialFormState); // Aseguramos un form limpio al abrir
            setIsModalOpen(true);
          }} 
          {...stats} totalFacturado={stats.bruta} totalNeto={stats.neta}
          activeTab={activeTab} setActiveTab={setActiveTab} precioGasoil={precioGasoil} setPrecioGasoil={setPrecioGasoil}
          dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd}
          showAllTime={showAllTime} setShowAllTime={setShowAllTime}
        />
        
        {filteredViajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/10 backdrop-blur-sm mx-4">
            <SearchX size={64} className="text-slate-800 mb-6" />
            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest text-center">Sin Coincidencias</h3>
            <button onClick={() => {setSearch(''); setShowAllTime(true)}} className="mt-8 px-8 py-4 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-500 rounded-2xl text-[9px] font-black uppercase border border-cyan-500/20 transition-all active:scale-95">Limpiar Filtros</button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* TABLA DESKTOP */}
            <div className="hidden xl:block overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/20 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="p-7">Fecha / Ruta</th>
                    <th className="p-7">Cliente</th>
                    <th className="p-7">Activos</th>
                    <th className="p-7 text-right">Flete</th>
                    <th className="p-7 text-right">Utilidad</th>
                    <th className="p-7 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredViajes.map(v => {
                    const netaViaje = (Number(v.tarifa_flete) || 0) - (Number(v.pago_chofer) || 0) - ((Number(v.lts_gasoil) || 0) * (Number(v.precio_gasoil) || precioGasoil)) - (Number(v.costo_descarga) || 0);
                    return (
                      <tr key={v.id} className="hover:bg-white/[0.03] transition-all group">
                        <td className="p-7">
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${v.es_retorno ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter flex items-center gap-2">
                                {v.origen || '---'} <ArrowRightLeft size={10} className="text-slate-700" /> {v.destino || '---'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-7 text-xs font-black text-indigo-400 uppercase tracking-widest">{v.clientes?.razon_social || 'SIN DATO'}</td>
                        <td className="p-7">
                          <p className="text-xs font-black text-slate-200">{v.camiones?.patente || 'S/P'}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{v.choferes?.nombre || 'S/C'}</p>
                        </td>
                        <td className="p-7 text-right font-black text-white tabular-nums text-sm">$ {Number(v.tarifa_flete || 0).toLocaleString()}</td>
                        <td className={`p-7 text-right font-black tabular-nums text-sm ${netaViaje > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          $ {Math.round(netaViaje).toLocaleString()}
                        </td>
                        <td className="p-7 text-center">
                          <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border ${v.es_retorno ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            {v.es_retorno ? 'Retorno' : 'Ida'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MOBILE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:hidden gap-6 px-2">
              {filteredViajes.map(v => (
                <div key={v.id} className="bg-slate-900/60 border border-white/10 p-8 rounded-[3rem] space-y-6 backdrop-blur-md relative overflow-hidden active:scale-[0.98] transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{v.clientes?.razon_social || 'CLIENTE S/D'}</span>
                      <h4 className="text-lg font-black text-white uppercase leading-tight">{v.origen || '---'} → {v.destino || '---'}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-500 tabular-nums">{new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${v.es_retorno ? 'text-indigo-400 border-indigo-400/20' : 'text-emerald-400 border-emerald-400/20'}`}>
                        {v.es_retorno ? 'Retorno' : 'Ida'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-black/30 p-5 rounded-[2.2rem] border border-white/5 shadow-inner">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">Flete</p>
                      <p className="text-xl font-black text-emerald-400 tabular-nums">$ {Number(v.tarifa_flete || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-black/30 p-5 rounded-[2.2rem] border border-white/5 shadow-inner">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">Unidad</p>
                      <p className="text-lg font-black text-white uppercase">{v.camiones?.patente || '---'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Truck size={14} /></div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[120px]">{v.choferes?.nombre || 'S/C'}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <ViajeModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        onSubmit={(e: React.FormEvent) => handleSubmit(e)} isSubmitting={isSubmitting} 
        formData={formData} setFormData={setFormData} 
        clientes={clientes} choferes={choferes} camiones={camiones} 
      />
    </div>
  )
}