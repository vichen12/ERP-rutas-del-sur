'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Loader2, Truck, SearchX, ArrowRightLeft, 
  Calendar, Trash2, Users
} from 'lucide-react'

import { ViajesHeader } from '@/components/viajes/ViajesHeader'
import { ViajeModal } from '@/components/viajes/ViajeModal' 
import { TraccarSetupModal } from '@/components/viajes/TraccarSetupModal'

// ─── Importamos el servicio de caja ──────────────────────────────────────────
import { registrarMovimiento } from '@/lib/cajaService'
// ─────────────────────────────────────────────────────────────────────────────

const CAMPOS_TEMPORALES = [
  'repartos_ida', 'repartos_vuelta', 'precio_gasoil_sugerido',
  'km_ida', 'km_vuelta', 'lts_ida', 'lts_vuelta'
];

const INITIAL_FORM_STATE = {
  chofer_id: '', 
  camion_id: '', 
  origen: 'MENDOZA', 
  destino: '', 
  fecha: new Date().toISOString().split('T')[0],
  km_recorridos: '', 
  km_ida: '',
  km_vuelta: '',
  lts_ida: '',
  lts_vuelta: '',
  engrase: false,
  pago_chofer: '', 
  lts_gasoil: '', 
  precio_gasoil: '', 
  costo_descarga: '', 
  desgaste_por_km: '180',
  repartos_ida: [],    
  repartos_vuelta: []  
};

export default function ViajesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ida' | 'retorno' | 'global'>('global')
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTraccarModalOpen, setIsTraccarModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); 
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showAllTime, setShowAllTime] = useState(false)

  const [viajes, setViajes]   = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [destinos, setDestinos] = useState<any[]>([])
  const [precioGasoilGlobal, setPrecioGasoilGlobal] = useState(0)
  const [appConfig, setAppConfig] = useState<any>(null)
  const [formData, setFormData] = useState<any>(INITIAL_FORM_STATE)

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [v, cl, ch, ca, conf, rep, dest] = await Promise.all([
        supabase.from('viajes').select('*, choferes(nombre), camiones(patente)').order('fecha', { ascending: false }),
        supabase.from('clientes').select('*').order('razon_social'),
        supabase.from('choferes').select('id, nombre, km_recorridos, lts_consumidos').order('nombre'),
        supabase.from('camiones').select('id, patente, km_actual, operador_id, lts_consumidos').order('patente'),
        supabase.from('configuracion').select('*').single(),
        supabase.from('reparto_viaje').select('*, clientes(razon_social)'),
        supabase.from('destinos_cliente').select('*').eq('activo', true).order('cliente_id').order('nombre')
      ]);

      const viajesMapeados = (v.data || []).map((viaje: any) => {
        const repartosViaje = (rep.data || []).filter((r: any) => r.viaje_id === viaje.id);
        const tarifaTotal = repartosViaje.reduce((acc: number, r: any) => acc + Number(r.monto_flete_parcial), 0);
        return { ...viaje, repartos: repartosViaje, tarifa_flete_calculada: tarifaTotal }
      });

      setViajes(viajesMapeados);
      setClientes(cl.data || []);
      setChoferes(ch.data || []);
      setCamiones(ca.data || []);
      setDestinos(dest.data || []);
      if (conf.data) {
        setAppConfig(conf.data);
        setPrecioGasoilGlobal(conf.data.precio_gasoil);
      }
    } catch (e) { 
      console.error("❌ Fallo Crítico:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  async function handleGuardarTraccar(configData: any) {
    try {
      const { error } = await supabase.from('configuracion').update({
        traccar_url:      configData.traccar_url,
        traccar_email:    configData.traccar_email,
        traccar_password: configData.traccar_password,
        traccar_activo:   configData.traccar_activo,
      }).eq('id', 1)
      if (error) throw error;
      setAppConfig({ ...appConfig, ...configData });
      setIsTraccarModalOpen(false);
      alert("✅ Configuración de GPS guardada correctamente.");
    } catch (err: any) {
      alert("❌ Error al guardar Traccar: " + err.message);
    }
  }

  const filteredViajes = useMemo(() => {
    const term = search.toLowerCase().trim();
    return (viajes || []).filter(v => {
      const clientesTexto = v.repartos?.map((r:any) => r.clientes?.razon_social).join(' ') || '';
      const searchableText = [clientesTexto, v.origen, v.destino, v.camiones?.patente, v.choferes?.nombre]
        .some(c => String(c || '').toLowerCase().includes(term));
      const matchesTab = activeTab === 'global' ? true : (activeTab === 'ida' ? !v.es_retorno : v.es_retorno);
      const matchesDate = showAllTime || (v.fecha >= dateStart && v.fecha <= dateEnd);
      return searchableText && matchesTab && matchesDate;
    })
  }, [viajes, search, activeTab, dateStart, dateEnd, showAllTime])

  const stats = useMemo(() => {
    return filteredViajes.reduce((acc, v) => {
      const bruta = Number(v.tarifa_flete_calculada) || 0; 
      const pagoCh = Number(v.pago_chofer) || 0;
      const pGasoil = Number(v.precio_gasoil) || precioGasoilGlobal;
      const costoGas = (Number(v.lts_gasoil) || 0) * pGasoil;
      const descarga = Number(v.costo_descarga) || 0;
      const costoDesgaste = (Number(v.km_recorridos) || 0) * (Number(v.desgaste_por_km) || 0);
      const neta = bruta - pagoCh - costoGas - descarga - costoDesgaste;
      return {
        km: acc.km + (Number(v.km_recorridos) || 0),
        bruta: acc.bruta + bruta,
        neta: acc.neta + neta,
        totalLts: acc.totalLts + (Number(v.lts_gasoil) || 0),
        totalChofer: acc.totalChofer + pagoCh,
        totalCostos: acc.totalCostos + costoGas + descarga + costoDesgaste
      }
    }, { km: 0, bruta: 0, neta: 0, totalLts: 0, totalChofer: 0, totalCostos: 0 })
  }, [filteredViajes, precioGasoilGlobal])

  // ─── GUARDADO MAESTRO ─────────────────────────────────────────────────────────
  const handleWizardSubmit = async (fd: any) => {
    setIsSubmitting(true);
    try {
      const hasIda    = (fd.repartos_ida    || []).length > 0;
      const hasVuelta = (fd.repartos_vuelta || []).length > 0;

      const { 
        repartos_ida, repartos_vuelta, precio_gasoil_sugerido,
        km_ida, km_vuelta, lts_ida, lts_vuelta,
        ...dataLimpia 
      } = fd;

      const procesarTramo = async (
        esRetorno: boolean,
        repartos: any[],
        orig: string,
        dest: string,
        kmTramo: string,
        ltsTramo: string
      ) => {
        if (!repartos || repartos.length === 0) return 0;

        const viajeObj = {
          ...dataLimpia,
          es_retorno:    esRetorno,
          origen:        orig,
          destino:       dest,
          km_recorridos: kmTramo  || dataLimpia.km_recorridos,
          lts_gasoil:    ltsTramo || dataLimpia.lts_gasoil,
        };

        const { data: nV, error: eV } = await supabase.from('viajes').insert([viajeObj]).select().single();
        if (eV) throw eV;

        const insertsRep = repartos.map((r: any) => ({
          viaje_id:            nV.id,
          cliente_id:          r.cliente_id,
          monto_flete_parcial: Number(r.monto_flete),
          destino_id:          r.destino_id   || null,
          destino_nombre:      r.destino_nombre || null
        }));

        const insertsCta = repartos.map((r: any) => ({
          cliente_id:      r.cliente_id,
          viaje_id:        nV.id,
          fecha:           dataLimpia.fecha,
          tipo_movimiento: 'DEBE',
          detalle:         `FLETE C/P: ${orig} > ${r.destino_nombre || dest}`,
          debe:            Number(r.monto_flete)
        }));

        await Promise.all([
          supabase.from('reparto_viaje').insert(insertsRep),
          supabase.from('cuenta_corriente').insert(insertsCta)
        ]);

        // Sanitizamos UUIDs: "" → null para que Supabase no explote
        const uuid = (v: any) => (v && String(v).trim() !== '' ? v : null)
        const camionId = uuid(dataLimpia.camion_id)
        const choferIdLimpio = uuid(dataLimpia.chofer_id)
        const cam = camiones.find((c: any) => c.id === dataLimpia.camion_id);

        // 1. INGRESO DE FLETE: NO impacta en caja (Va a cuenta corriente cliente)
        // 2. PAGO CHOFER: NO impacta en caja (Va a saldo del chofer para liquidar a fin de mes)

        // 3. COMBUSTIBLE: NO impacta en caja -> SE INYECTA EN EL MÓDULO DE COMBUSTIBLE
        const lts      = Number(ltsTramo || dataLimpia.lts_gasoil || 0);
        const pGasoil  = Number(dataLimpia.precio_gasoil || precioGasoilGlobal || 0);
        const costoGas = lts * pGasoil;
        
        if (lts > 0) {
          await supabase.from('cargas_combustible').insert([{
            fecha: dataLimpia.fecha,
            camion_id: camionId,
            chofer_id: choferIdLimpio,
            responsable_externo: null,
            litros: lts,
            precio_litro: pGasoil,
            total: costoGas,
            estacion: 'CARGA EN VIAJE',
            pagado: false,
            viaje_id: nV.id // Vinculado para que se borre si eliminás el viaje
          }]);
        }

        // 4. COSTO DE DESCARGA: SÍ impacta en caja (porque suele ser efectivo en el momento)
        const descarga = Number(dataLimpia.costo_descarga || 0);
        if (descarga > 0) {
          await registrarMovimiento({
            tipo:                 'egreso',
            categoria:            'egreso_otro',
            descripcion:          `DESCARGA — ${cam?.patente || 'CAMION'} | ${orig} → ${dest}`,
            monto:                descarga,
            fecha:                dataLimpia.fecha,
            tipo_cuenta:          'caja',
            camion_id:            camionId,
            referencia_origen_id: nV.id,
            modulo_origen:        'viajes',
          });
        }
        // ────────────────────────────────────────────────────────────────────────

        return 1;
      };

      let tramosRealizados = 0;

      if (hasIda) {
        tramosRealizados += await procesarTramo(false, repartos_ida, dataLimpia.origen, dataLimpia.destino, km_ida, lts_ida);
      }

      if (hasVuelta) {
        tramosRealizados += await procesarTramo(true, repartos_vuelta, dataLimpia.destino, dataLimpia.origen, km_vuelta, lts_vuelta);
      }

      if (tramosRealizados > 0) {
        const cam = camiones.find((c: any) => c.id === dataLimpia.camion_id);
        const cho = choferes.find((ch: any) => ch.id === dataLimpia.chofer_id);
        const kSum = Number(dataLimpia.km_recorridos) || 0;
        const lSum = Number(dataLimpia.lts_gasoil)    || 0;

        await Promise.all([
          supabase.from('camiones').update({
            km_actual:      (Number(cam?.km_actual)      || 0) + kSum,
            lts_consumidos: (Number(cam?.lts_consumidos) || 0) + lSum
          }).eq('id', dataLimpia.camion_id),
          supabase.from('choferes').update({
            km_recorridos:  (Number(cho?.km_recorridos)  || 0) + kSum,
            lts_consumidos: (Number(cho?.lts_consumidos) || 0) + lSum
          }).eq('id', dataLimpia.chofer_id)
        ]);
      }

      setIsModalOpen(false);
      setFormData(INITIAL_FORM_STATE);
      fetchData();
      alert("✅ Operación sincronizada.");
    } catch (err: any) { 
      alert("❌ Error: " + err.message);
    } finally { 
      setIsSubmitting(false);
    }
  }

  // ─── ELIMINACIÓN ─────────────────────────────────────────────────────────────
  const handleDeleteViaje = async (viaje: any) => {
    if (!confirm(`⚠️ ¿Eliminar viaje? Se borrarán repartos, deudas (combustible/clientes) y movimientos asociados.`)) return;
    try {
      const kmRestar  = Number(viaje.km_recorridos) || 0;
      const ltsRestar = Number(viaje.lts_gasoil)    || 0;
      const cam = camiones.find(c => c.id === viaje.camion_id);
      const cho = choferes.find(ch => ch.id === viaje.chofer_id);

      await Promise.all([
        supabase.from('reparto_viaje').delete().eq('viaje_id', viaje.id),
        supabase.from('cuenta_corriente').delete().eq('viaje_id', viaje.id),
        supabase.from('movimientos_caja').delete().eq('referencia_origen_id', viaje.id),
        // 🔥 Eliminamos también la carga de combustible generada
        supabase.from('cargas_combustible').delete().eq('viaje_id', viaje.id)
      ]);
      
      const updates: any[] = [];
      if (cam) updates.push(supabase.from('camiones').update({ 
        km_actual:      Math.max(0, cam.km_actual      - kmRestar), 
        lts_consumidos: Math.max(0, cam.lts_consumidos - ltsRestar) 
      }).eq('id', viaje.camion_id));
      if (cho) updates.push(supabase.from('choferes').update({ 
        km_recorridos:  Math.max(0, cho.km_recorridos  - kmRestar), 
        lts_consumidos: Math.max(0, cho.lts_consumidos - ltsRestar) 
      }).eq('id', viaje.chofer_id));
      await Promise.all(updates);

      const { error } = await supabase.from('viajes').delete().eq('id', viaje.id);
      if (error) throw error;

      fetchData();
    } catch (err: any) { alert(err.message); }
  }

  if (!mounted || loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500 w-12 h-12 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Refrescando Inteligencia...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-24 md:pt-32 font-sans italic selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-40" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12 relative z-10">
        
        <ViajesHeader 
          search={search} setSearch={setSearch} 
          onOpenModal={() => { setFormData(INITIAL_FORM_STATE); setIsModalOpen(true); }} 
          onOpenTraccar={() => setIsTraccarModalOpen(true)}
          {...stats} totalKm={stats.km} totalFacturado={stats.bruta} totalNeto={stats.neta}
          activeTab={activeTab} setActiveTab={setActiveTab} 
          precioGasoil={precioGasoilGlobal} setPrecioGasoil={setPrecioGasoilGlobal}
          dateStart={dateStart} setDateStart={setDateStart} 
          dateEnd={dateEnd} setDateEnd={setDateEnd}
          showAllTime={showAllTime} setShowAllTime={setShowAllTime}
        />
        
        {filteredViajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/10 backdrop-blur-sm mx-4">
            <SearchX size={64} className="text-slate-800 mb-6" />
            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest text-center">Sin Coincidencias</h3>
            <button onClick={() => {setSearch(''); setShowAllTime(true)}} className="mt-8 px-8 py-4 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-500 rounded-2xl text-[9px] font-black uppercase border border-cyan-500/20 transition-all">Limpiar Filtros</button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-700">

            {/* TABLA DESKTOP */}
            <div className="hidden xl:block overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/20 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="p-7">Fecha / Ruta</th>
                    <th className="p-7">Clientes (Carga Consolidada)</th>
                    <th className="p-7">Activos</th>
                    <th className="p-7 text-right">Flete Total</th>
                    <th className="p-7 text-right">Utilidad Neta</th>
                    <th className="p-7 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredViajes.map(v => {
                    const pGasoil   = Number(v.precio_gasoil) || precioGasoilGlobal;
                    const costoGas  = (Number(v.lts_gasoil) || 0) * pGasoil;
                    const desgaste  = (Number(v.km_recorridos) || 0) * (Number(v.desgaste_por_km) || 0);
                    const netaViaje = Number(v.tarifa_flete_calculada) - (Number(v.pago_chofer) + costoGas + Number(v.costo_descarga) + desgaste);
                    
                    return (
                      <tr key={v.id} className="hover:bg-white/[0.03] transition-all group">
                        <td className="p-7">
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${v.es_retorno ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter flex items-center gap-2">
                                {v.origen} <ArrowRightLeft size={10} /> {v.destino}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-7">
                          <div className="flex flex-col gap-1">
                            {v.repartos?.map((r:any) => (
                              <div key={r.id} className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-[10px] font-black text-indigo-300 uppercase truncate pr-4">{r.clientes?.razon_social}</span>
                                <span className="text-[10px] font-bold text-emerald-400 italic">${Number(r.monto_flete_parcial).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-7">
                          <p className="text-xs font-black text-slate-200">{v.camiones?.patente}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{v.choferes?.nombre}</p>
                        </td>
                        <td className="p-7 text-right font-black text-white tabular-nums text-lg">
                          $ {Number(v.tarifa_flete_calculada || 0).toLocaleString()}
                        </td>
                        <td className={`p-7 text-right font-black tabular-nums text-sm ${netaViaje > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          $ {Math.round(netaViaje).toLocaleString()}
                        </td>
                        <td className="p-7 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${v.es_retorno ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                              {v.es_retorno ? 'Ret' : 'Ida'}
                            </span>
                            <button onClick={() => handleDeleteViaje(v)} className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
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
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{v.repartos?.length || 0} Clientes</span>
                      </div>
                      <h4 className="text-lg font-black text-white uppercase leading-tight">{v.origen} → {v.destino}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 tabular-nums">{new Date(v.fecha).toLocaleDateString()}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${v.es_retorno ? 'text-indigo-400 border-indigo-400/20' : 'text-emerald-400 border-emerald-400/20'}`}>
                        {v.es_retorno ? 'Ret' : 'Ida'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-black/30 p-5 rounded-[2.2rem] border border-white/5 shadow-inner">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">Flete Bruto</p>
                      <p className="text-xl font-black text-emerald-400 tabular-nums">$ {Number(v.tarifa_flete_calculada || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-black/30 p-5 rounded-[2.2rem] border border-white/5 shadow-inner">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">Unidad</p>
                      <p className="text-lg font-black text-white uppercase">{v.camiones?.patente || 'S/P'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Truck size={14} /></div>
                      <p className="text-[10px] font-black text-slate-300 uppercase truncate max-w-[120px]">{v.choferes?.nombre || 'S/C'}</p>
                    </div>
                    <button onClick={() => handleDeleteViaje(v)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
      
      <ViajeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onWizardSubmit={handleWizardSubmit} 
        isSubmitting={isSubmitting} 
        formData={formData} 
        setFormData={setFormData}
        clientes={clientes} 
        choferes={choferes} 
        camiones={camiones} 
        destinos={destinos} 
      />

      <TraccarSetupModal
        isOpen={isTraccarModalOpen}
        onClose={() => setIsTraccarModalOpen(false)}
        onSave={handleGuardarTraccar}
        initialConfig={appConfig}
      />
    </div>
  )
}