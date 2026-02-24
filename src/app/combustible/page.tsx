'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Loader2, Fuel, Plus, CheckCircle2, AlertCircle, Wallet, 
  Trash2, Calendar, Archive, AlertTriangle, CheckSquare, 
  Globe, BarChart3, Truck, Users
} from 'lucide-react'
import { CargaCombustibleModal } from '@/components/combustible/CargaCombustibleModal'
import { PagarResumenModal } from '@/components/combustible/PagarResumenModal'

export default function CombustiblePage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [cargas, setCargas] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [precioRef, setPrecioRef] = useState(0)
  
  // Filtros de Ciclo
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(0); return d.toISOString().split('T')[0];
  })
  const [showAllTime, setShowAllTime] = useState(false)

  // Vistas
  const [viewMode, setViewMode] = useState<'impagos' | 'historial' | 'resumen'>('impagos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [isCargaModalOpen, setIsCargaModalOpen] = useState(false)
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false)
  const [cargasParaPagar, setCargasParaPagar] = useState<any[]>([])

  useEffect(() => { setMounted(true); fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ca, ch, car, conf] = await Promise.all([
        supabase.from('camiones').select('id, patente, lts_consumidos').order('patente'),
        supabase.from('choferes').select('id, nombre, lts_consumidos').order('nombre'),
        supabase.from('cargas_combustible').select('*, camiones(patente), choferes(nombre)').order('fecha', { ascending: false }),
        supabase.from('configuracion').select('precio_gasoil').single()
      ]);
      setCamiones(ca.data || []); setChoferes(ch.data || []); setCargas(car.data || []);
      if (conf.data?.precio_gasoil) setPrecioRef(conf.data.precio_gasoil);
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  // --- EXTRACTORES SEGUROS ---
  const getPatente = (c: any) => {
    if (!c.camiones) return null;
    if (Array.isArray(c.camiones)) return c.camiones[0]?.patente || null;
    return c.camiones.patente || null;
  }
  
  const getChofer = (c: any) => {
    if (c.choferes && Array.isArray(c.choferes)) return c.choferes[0]?.nombre;
    if (c.choferes && !Array.isArray(c.choferes)) return c.choferes.nombre;
    return c.responsable_externo || null;
  }

  // --- FILTROS Y LÓGICA ---
  const cargasFiltradas = useMemo(() => {
    return cargas.filter(c => {
      const inDate = showAllTime || (c.fecha >= dateStart && c.fecha <= dateEnd);
      if (viewMode === 'impagos') return !c.pagado && (showAllTime || c.fecha <= dateEnd); 
      if (viewMode === 'historial') return c.pagado && inDate;
      if (viewMode === 'resumen') return inDate;
      return false;
    })
  }, [cargas, dateStart, dateEnd, viewMode, showAllTime])

  const statsCiclo = useMemo(() => {
    let deuda = 0; let ltsPendientes = 0; let pagadoCiclo = 0; let ltsTotales = 0; let gastoTotal = 0;
    cargasFiltradas.forEach(c => {
      ltsTotales += Number(c.litros);
      gastoTotal += Number(c.total);
      if (!c.pagado) { deuda += Number(c.total); ltsPendientes += Number(c.litros); }
      if (c.pagado) pagadoCiclo += Number(c.total);
    });
    return { deuda, ltsPendientes, pagadoCiclo, ltsTotales, gastoTotal }
  }, [cargasFiltradas])

  const diasParaCierre = useMemo(() => {
    const hoy = new Date();
    const cierre = new Date(dateEnd);
    return Math.ceil((cierre.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
  }, [dateEnd])

  const mostrarAlerta = diasParaCierre >= 0 && diasParaCierre <= 5 && viewMode === 'impagos' && statsCiclo.deuda > 0 && !showAllTime;

  // --- ACCIONES MÚLTIPLES ---
  const handleToggleSeleccion = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const handleSeleccionarTodo = () => setSelectedIds(selectedIds.length === cargasFiltradas.length ? [] : cargasFiltradas.map(c => c.id))

  const abrirModalPagoSeleccion = () => {
    setCargasParaPagar(cargasFiltradas.filter(c => selectedIds.includes(c.id)));
    setIsPagoModalOpen(true);
  }

  const abrirModalPagoTodoElCiclo = () => {
    const impagas = cargasFiltradas.filter(c => !c.pagado);
    if (impagas.length === 0) return alert("No hay deuda.");
    setCargasParaPagar(impagas);
    setIsPagoModalOpen(true);
  }

  // --- GUARDADO SEGURO ---
  const handleGuardarCarga = async (payload: any) => {
    const total = Number(payload.litros) * Number(payload.precio_litro);
    
    // Forzamos los nulos para que Supabase no se confunda
    const dataToInsert = { 
      ...payload, 
      total, 
      pagado: false,
      camion_id: payload.camion_id || null,
      chofer_id: payload.chofer_id || null
    };

    const { error } = await supabase.from('cargas_combustible').insert([dataToInsert]);
    if (error) throw error;
    
    const ltsNuevos = Number(payload.litros);
    const updates = [];
    if (dataToInsert.camion_id) {
      const cam = camiones.find(c => c.id === dataToInsert.camion_id);
      if (cam) updates.push(supabase.from('camiones').update({ lts_consumidos: (cam.lts_consumidos || 0) + ltsNuevos }).eq('id', cam.id));
    }
    if (dataToInsert.chofer_id) {
      const cho = choferes.find(c => c.id === dataToInsert.chofer_id);
      if (cho) updates.push(supabase.from('choferes').update({ lts_consumidos: (cho.lts_consumidos || 0) + ltsNuevos }).eq('id', cho.id));
    }
    if (updates.length > 0) await Promise.all(updates);
    
    setIsCargaModalOpen(false); 
    fetchData();
  }

  const handleDeleteCarga = async (carga: any) => {
    if (carga.pagado) return alert("❌ No podés eliminar un remito que ya fue pagado.");
    if (carga.viaje_id) return alert("⚠️ Esta carga viene de un Viaje. Eliminala desde la sección de Viajes.");
    if (!confirm(`¿Eliminar remito de ${carga.litros} lts?`)) return;

    try {
      const ltsRestar = Number(carga.litros);
      const updates = [];
      if (carga.camion_id) {
        const cam = camiones.find(c => c.id === carga.camion_id);
        if (cam) updates.push(supabase.from('camiones').update({ lts_consumidos: Math.max(0, (cam.lts_consumidos || 0) - ltsRestar) }).eq('id', cam.id));
      }
      if (carga.chofer_id) {
        const cho = choferes.find(c => c.id === carga.chofer_id);
        if (cho) updates.push(supabase.from('choferes').update({ lts_consumidos: Math.max(0, (cho.lts_consumidos || 0) - ltsRestar) }).eq('id', cho.id));
      }
      await Promise.all([...updates, supabase.from('cargas_combustible').delete().eq('id', carga.id)]);
      fetchData();
    } catch (e: any) { alert("Error: " + e.message) }
  }

  const handleLiquidarSeleccion = async (payloadReal: any) => {
    if (cargasParaPagar.length === 0) return;
    try {
      const idsAPagar = cargasParaPagar.map(c => c.id);
      const montoPagado = Number(payloadReal.montoReal);
      const montoTeorico = cargasParaPagar.reduce((acc, c) => acc + Number(c.total), 0);
      const diferencia = montoTeorico - montoPagado; 

      const { data: movCaja, error: errCaja } = await supabase.from('movimientos_caja').insert([{
        fecha: payloadReal.fecha, 
        tipo_movimiento: 'egreso', 
        categoria: 'combustible',
        monto: montoPagado, 
        moneda: 'ARS', 
        metodo_pago: payloadReal.metodo,
        descripcion: `PAGO YPF (${idsAPagar.length} remitos) - Lts reales: ${payloadReal.ltsReales}`
      }]).select().single();
      if (errCaja) throw errCaja;

      const updates = idsAPagar.map(id => 
        supabase.from('cargas_combustible').update({ pagado: true, fecha_pago: payloadReal.fecha, movimiento_caja_id: movCaja.id }).eq('id', id)
      );
      await Promise.all(updates);

      if (diferencia > 10) {
        await supabase.from('cargas_combustible').insert([{
          fecha: payloadReal.fecha, litros: 0, precio_litro: 0, total: diferencia,
          estacion: 'SALDO PENDIENTE YPF', responsable_externo: 'SISTEMA', remito_nro: 'SALDO-ANTERIOR', pagado: false
        }]);
      } else if (diferencia < -10) {
        await supabase.from('cargas_combustible').insert([{
          fecha: payloadReal.fecha, litros: 0, precio_litro: 0, total: diferencia, 
          estacion: 'SALDO A FAVOR YPF', responsable_externo: 'SISTEMA', remito_nro: 'PAGO-EXCEDENTE', pagado: false
        }]);
      }

      setSelectedIds([]); setIsPagoModalOpen(false); fetchData();
      alert(`✅ Liquidación exitosa. Salió $${montoPagado.toLocaleString('es-AR')} de caja.`);
    } catch (error: any) { alert("❌ Error: " + error.message); }
  }

  // --- AGRUPACIONES PARA EL RESUMEN ANALÍTICO ---
  const resumenPorCamion = useMemo(() => {
    const map = new Map();
    cargasFiltradas.forEach(c => {
      if (c.remito_nro === 'SALDO-ANTERIOR' || c.remito_nro === 'PAGO-EXCEDENTE') return;

      const nombre = getPatente(c) || 'OTROS VEHÍCULOS / BIDONES';
      const stats = map.get(nombre) || { lts: 0, plata: 0 };
      map.set(nombre, { lts: stats.lts + Number(c.litros), plata: stats.plata + Number(c.total) });
    });
    return Array.from(map, ([nombre, datos]) => ({ nombre, ...datos })).sort((a,b) => b.lts - a.lts);
  }, [cargasFiltradas])

  const resumenPorChofer = useMemo(() => {
    const map = new Map();
    cargasFiltradas.forEach(c => {
      if (c.remito_nro === 'SALDO-ANTERIOR' || c.remito_nro === 'PAGO-EXCEDENTE') return;

      const nombre = getChofer(c) || 'SIN ASIGNAR';
      const stats = map.get(nombre) || { lts: 0, plata: 0 };
      map.set(nombre, { lts: stats.lts + Number(c.litros), plata: stats.plata + Number(c.total) });
    });
    return Array.from(map, ([nombre, datos]) => ({ nombre, ...datos })).sort((a,b) => b.lts - a.lts);
  }, [cargasFiltradas])

  if (!mounted || loading) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32 pt-24 md:pt-32 font-sans italic selection:bg-amber-500/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
        
        <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              Cuenta Corriente <br/><span className="text-amber-500">Combustible</span>
            </h1>
            <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold mt-4">Gestión de Ciclos YPF, Pagos y Conciliación</p>
          </div>
          
          <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className={`flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 transition-all ${showAllTime ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                <Calendar className="text-amber-500 ml-2" size={16} />
                <div className="flex flex-col"><span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Inicio Ciclo</span><input type="date" value={dateStart} onChange={e=>setDateStart(e.target.value)} className="bg-transparent text-white font-black text-xs outline-none [color-scheme:dark]" /></div>
                <div className="w-px h-8 bg-white/10 mx-2"></div>
                <div className="flex flex-col pr-2"><span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Fin Ciclo</span><input type="date" value={dateEnd} onChange={e=>setDateEnd(e.target.value)} className="bg-transparent text-white font-black text-xs outline-none [color-scheme:dark]" /></div>
              </div>
              <button onClick={() => setShowAllTime(!showAllTime)} className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showAllTime ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'}`}>
                <Globe size={14} className={showAllTime ? 'animate-spin-slow' : ''} /> {showAllTime ? 'Viendo Todo' : 'Ver Todo'}
              </button>
            </div>
            
            <button onClick={() => setIsCargaModalOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all shadow-lg w-full sm:w-auto justify-center">
              <Plus size={16} /> Cargar Remito Manual
            </button>
          </div>
        </div>

        {mostrarAlerta && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
            <AlertTriangle className="text-amber-500" size={24} />
            <div>
              <p className="text-sm font-black text-amber-500 uppercase tracking-widest">¡Atención! Cierre de facturación en {diasParaCierre} días.</p>
              <p className="text-xs text-amber-500/80 font-bold mt-0.5">Se acumulan {statsCiclo.ltsPendientes.toLocaleString('es-AR')} Lts impagos (${statsCiclo.deuda.toLocaleString('es-AR')}) listos para conciliar.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2.5rem]">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle size={14}/> Deuda Activa (Filtro)</p>
            <p className="text-4xl font-black text-rose-400 tabular-nums">${statsCiclo.deuda.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem]">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Pagado (Filtro)</p>
            <p className="text-4xl font-black text-emerald-400 tabular-nums">${statsCiclo.pagadoCiclo.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2.5rem]">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Fuel size={14}/> Litros Totales (Filtro)</p>
            <p className="text-4xl font-black text-amber-400 tabular-nums">{statsCiclo.ltsTotales.toLocaleString('es-AR')} Lts</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30 p-2 rounded-3xl border border-white/5 mt-8">
          <div className="flex bg-slate-950 rounded-2xl p-1 overflow-x-auto w-full sm:w-auto">
            <button onClick={() => {setViewMode('impagos'); setSelectedIds([])}} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'impagos' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <AlertCircle size={14} /> Pendientes
            </button>
            <button onClick={() => {setViewMode('historial'); setSelectedIds([])}} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'historial' ? 'bg-emerald-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <Archive size={14} /> Historial Pagado
            </button>
            <button onClick={() => setViewMode('resumen')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'resumen' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <BarChart3 size={14} /> Resumen Analítico
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {viewMode === 'impagos' && selectedIds.length > 0 && (
              <button onClick={abrirModalPagoSeleccion} className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all animate-in zoom-in-95">
                <CheckSquare size={14} /> Liquidar Selección ({selectedIds.length})
              </button>
            )}
            {viewMode === 'impagos' && cargasFiltradas.length > 0 && (
              <button onClick={abrirModalPagoTodoElCiclo} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl transition-all">
                <Wallet size={14} /> Liquidar Ciclo Completo
              </button>
            )}
          </div>
        </div>

        {viewMode === 'resumen' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <Truck className="text-cyan-500" /> Consumo por Unidad
              </h3>
              <div className="space-y-3">
                {resumenPorCamion.map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all">
                    <span className="text-sm font-black text-cyan-400 uppercase">{c.nombre}</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-white tabular-nums">{c.lts.toLocaleString('es-AR')} Lts</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tabular-nums">${c.plata.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <Users className="text-indigo-400" /> Responsable de Carga
              </h3>
              <div className="space-y-3">
                {resumenPorChofer.map((c, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                    <span className="text-sm font-black text-indigo-300 uppercase">{c.nombre}</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-white tabular-nums">{c.lts.toLocaleString('es-AR')} Lts</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tabular-nums">${c.plata.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/20 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-white/5">
                <tr>
                  {viewMode === 'impagos' && (
                    <th className="p-6 w-16 text-center">
                      <button onClick={handleSeleccionarTodo} className="text-slate-500 hover:text-amber-500 transition-colors"><CheckSquare size={18} className={selectedIds.length === cargasFiltradas.length && cargasFiltradas.length > 0 ? 'text-amber-500' : ''}/></button>
                    </th>
                  )}
                  <th className="p-6">Fecha / Remito</th><th className="p-6">Unidad y Responsable</th><th className="p-6">Volumen</th><th className="p-6 text-right">Subtotal ERP</th><th className="p-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cargasFiltradas.length === 0 ? (
                   <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">No hay cargas para mostrar en este filtro.</td></tr>
                ) : cargasFiltradas.map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  const isSaldoAnterior = c.remito_nro === 'SALDO-ANTERIOR' || c.remito_nro === 'PAGO-EXCEDENTE';

                  return (
                    <tr key={c.id} className={`transition-all group ${isSelected ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}>
                      {viewMode === 'impagos' && (
                        <td className="p-6 text-center border-r border-white/5">
                          <input type="checkbox" checked={isSelected} onChange={() => handleToggleSeleccion(c.id)} className="w-4 h-4 accent-amber-500 rounded bg-slate-900 border-white/20 cursor-pointer" />
                        </td>
                      )}
                      <td className="p-6">
                        <p className="text-sm font-black text-white">{new Date(c.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                        <p className={`text-[10px] uppercase font-bold ${isSaldoAnterior ? 'text-rose-500' : 'text-amber-500'}`}>
                          Nº {c.remito_nro || (c.viaje_id ? 'VINCULADO A VIAJE' : 'S/R')}
                        </p>
                      </td>
                      <td className="p-6">
                        <p className={`text-xs font-black uppercase ${isSaldoAnterior ? 'text-rose-400' : 'text-slate-200'}`}>
                          {getPatente(c) || (isSaldoAnterior ? 'AJUSTE FINANCIERO' : 'OTROS / BIDONES')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{getChofer(c) || 'SIN RESPONSABLE'}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-slate-300">{Number(c.litros).toLocaleString('es-AR')} Lts</p>
                        {!isSaldoAnterior && <p className="text-[10px] text-slate-500 uppercase font-bold">a ${Number(c.precio_litro)}</p>}
                      </td>
                      <td className="p-6 text-right font-black text-white tabular-nums text-lg">
                        $ {Number(c.total).toLocaleString('es-AR')}
                      </td>
                      <td className="p-6 text-center">
                        {!c.pagado && !c.viaje_id && (
                          <button onClick={() => handleDeleteCarga(c)} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Eliminar remito manual">
                            <Trash2 size={14} />
                          </button>
                        )}
                        {c.pagado && (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase border border-emerald-500/20">Pagado</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CargaCombustibleModal isOpen={isCargaModalOpen} onClose={() => setIsCargaModalOpen(false)} onSave={handleGuardarCarga} camiones={camiones} choferes={choferes} precioGasoilReferencia={precioRef} />
      <PagarResumenModal isOpen={isPagoModalOpen} onClose={() => setIsPagoModalOpen(false)} onConfirm={handleLiquidarSeleccion} cargasSeleccionadas={cargasParaPagar} />
    </div>
  )
}