'use client'
import { useState, useMemo } from 'react'
import { X, Calendar as CalIcon, FilterX, Droplets, Milestone, Flame, Loader2, ArrowRightLeft, Route, Trash2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// 🚀 Agregamos onDeleteMovimiento a los props
export function ChoferStatsModal({ isOpen, onClose, chofer, viajes = [], deudasPendientes = [], todoMovimientos = [], onRefresh, onDeleteMovimiento }: any) {
  if (!isOpen || !chofer) return null

  // --- MOTORES DE FILTRO DE TIEMPO ---
  const [filterMode, setFilterMode] = useState<'mes' | 'año' | 'historico' | 'custom'>('mes')
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0])
  
  // Estados para el pago
  const [isPaging, setIsPaging] = useState(false)
  const [montoPago, setMontoPago] = useState<string>('')
  const [medioPago, setMedioPago] = useState<'caja' | 'banco'>('caja')

  const filterByDate = (fechaStr: string) => {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    
    switch (filterMode) {
      case 'historico': return true;
      case 'año': return fecha.getFullYear() === hoy.getFullYear();
      case 'mes': return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      case 'custom': return fechaStr >= dateStart && fechaStr <= dateEnd;
      default: return true;
    }
  }

  const viajesFiltrados = useMemo(() => {
    return viajes.filter((v: any) => v.chofer_id === chofer.id && filterByDate(v.fecha));
  }, [viajes, chofer, filterMode, dateStart, dateEnd]);

  // Filtramos el historial completo (pagado y no pagado) por fecha para el historial
  const movimientosFiltrados = useMemo(() => {
    const base = todoMovimientos.length > 0 ? todoMovimientos : deudasPendientes
    return base.filter((d: any) => filterByDate(d.fecha)).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [todoMovimientos, deudasPendientes, filterMode, dateStart, dateEnd]);

  const stats = useMemo(() => {
    let totalKm = 0; let totalLts = 0; let totalPlata = 0;
    viajesFiltrados.forEach((v: any) => {
      totalKm += Number(v.km_recorridos) || 0;
      totalLts += Number(v.lts_gasoil) || 0;
      totalPlata += Number(v.pago_chofer) || 0;
    });
    const rendimiento = totalKm > 0 ? ((totalLts / totalKm) * 100).toFixed(1) : '0.0';
    return { totalKm, totalLts, totalPlata, rendimiento };
  }, [viajesFiltrados]);

  const numConsumo = Number(stats.rendimiento);
  const consumoColor = numConsumo === 0 ? 'text-slate-500' : numConsumo > 40 ? 'text-rose-500' : numConsumo > 35 ? 'text-amber-500' : 'text-emerald-500';

  // --- CÁLCULO DE DEUDA REAL (Puede ser negativo si hay adelantos) ---
  const deudaTotal = deudasPendientes.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0)
  const saldoEsNegativo = deudaTotal < 0;

  // --- FUNCIÓN DE PAGO (SOPORTA ADELANTOS Y PAGOS PARCIALES) ---
  const handleRealizarPago = async () => {
    const monto = Number(montoPago);
    if (monto <= 0) return toast.error("Ingresá un monto válido mayor a 0");
    
    if (!confirm(`¿Confirmás la entrega de $${monto.toLocaleString('es-AR')} a ${chofer.nombre}?\n\nSaldrá de: ${medioPago === 'caja' ? 'Caja (efectivo)' : 'Banco (transferencia)'}`)) return;

    setIsPaging(true)
    try {
      // 1. Egreso de Caja
      const { error: errCaja } = await supabase.from('movimientos_caja').insert([{
        fecha: new Date().toISOString().split('T')[0], 
        tipo: 'egreso', 
        tipo_cuenta: medioPago,
        categoria: 'pago_chofer',
        monto: monto, 
        descripcion: monto === deudaTotal 
          ? `LIQUIDACIÓN TOTAL - ${chofer.nombre}` 
          : `ADELANTO / PAGO PARCIAL - ${chofer.nombre}`,
        chofer_id: chofer.id,
        origen: 'automatico',
        modulo_origen: 'choferes'
      }])
      if (errCaja) throw errCaja;

      // 2. Lógica de Cuenta Corriente
      if (monto === deudaTotal && deudaTotal > 0) {
        const idsDeuda = deudasPendientes.map((d: any) => d.id)
        const updates = idsDeuda.map((id: string) => 
          supabase.from('cuenta_corriente_choferes').update({ pagado: true }).eq('id', id)
        );
        await Promise.all(updates);
      } else {
        await supabase.from('cuenta_corriente_choferes').insert([{
          chofer_id: chofer.id,
          fecha: new Date().toISOString().split('T')[0],
          detalle: monto > deudaTotal ? 'Adelanto de Sueldo / Viáticos' : 'Pago Parcial',
          monto: -monto, // Negativo porque la empresa se lo da al chofer
          tipo_movimiento: 'PAGO',
          pagado: false 
        }])
      }

      toast.success(`Entrega de $${monto.toLocaleString('es-AR')} registrada con éxito.`);
      setMontoPago('');
      onRefresh(); 
    } catch (error: any) {
      toast.error('Error al procesar el pago: ' + error.message)
      console.error(error)
    } finally {
      setIsPaging(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-[#141c28]/95 backdrop-blur-xl animate-in fade-in duration-300 italic font-sans">
      <div className="bg-[#141c28] border border-white/10 w-full max-w-6xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-none md:max-h-[90vh] my-auto">
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* --- HEADER (FIJO ARRIBA) --- */}
        <div className="shrink-0 p-6 md:p-8 border-b border-white/5 relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#1a2537]/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Gestión Financiera</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
              {chofer.nombre}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors absolute top-6 right-6 xl:relative xl:top-0 xl:right-0 z-50">
              <X size={20} />
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto bg-[#141c28]/50 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
              <div className="flex gap-2">
                <FilterBtn active={filterMode === 'mes'} onClick={() => setFilterMode('mes')} label="Este Mes" />
                <FilterBtn active={filterMode === 'año'} onClick={() => setFilterMode('año')} label="Este Año" />
                <FilterBtn active={filterMode === 'historico'} onClick={() => setFilterMode('historico')} label="Histórico" />
                <FilterBtn active={filterMode === 'custom'} onClick={() => setFilterMode('custom')} icon={CalIcon} label="Rango" />
              </div>
              {filterMode === 'custom' && (
                <div className="flex items-center gap-2 px-2 animate-in slide-in-from-left-4">
                  <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-[#141c28]/50 text-[10px] font-black text-indigo-400 uppercase outline-none px-4 py-2 rounded-xl border border-indigo-500/20 [color-scheme:dark]" />
                  <span className="text-slate-600 text-xs font-black">/</span>
                  <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-[#141c28]/50 text-[10px] font-black text-indigo-400 uppercase outline-none px-4 py-2 rounded-xl border border-indigo-500/20 [color-scheme:dark]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- CONTENIDO SCROLLEABLE --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          
          {/* ZONA DE LIQUIDACIÓN */}
          <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-r from-indigo-900/10 via-slate-900/10 to-[#0a0a0f] flex flex-col lg:flex-row items-center gap-8 shrink-0">
            <div className="flex-1 w-full space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Estado de Cuenta Operativo</p>
              <div className="flex items-end gap-4">
                <h3 className={`text-6xl md:text-7xl font-black italic tracking-tighter ${saldoEsNegativo ? 'text-emerald-400' : deudaTotal > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  $ {Math.abs(deudaTotal).toLocaleString('es-AR')}
                </h3>
              </div>
              <p className={`text-xs font-bold uppercase tracking-widest ${saldoEsNegativo ? 'text-emerald-500/70' : deudaTotal > 0 ? 'text-rose-500/70' : 'text-slate-600'}`}>
                {saldoEsNegativo ? 'A favor de la empresa (Adelanto)' : deudaTotal > 0 ? 'Saldo pendiente a favor del chofer' : 'Cuentas completamente al día'}
              </p>
            </div>

            {/* Formulario de Transferencia / Pago */}
            <div className="w-full lg:w-[480px] bg-[#141c28]/80 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden shrink-0">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${saldoEsNegativo ? 'from-emerald-500 to-teal-400' : 'from-indigo-500 to-rose-500'}`} />
              
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">
                {saldoEsNegativo ? 'Registrar Nuevo Adelanto' : 'Registrar Entrega / Pago'}
              </p>
              
              {/* Selector medio de pago */}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setMedioPago('caja')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${medioPago === 'caja' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>Caja (efectivo)</button>
                <button onClick={() => setMedioPago('banco')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${medioPago === 'banco' ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>Banco (transferencia)</button>
              </div>

              <div className="flex items-center bg-[#141c28]/50 rounded-[1.5rem] border border-white/5 p-2 focus-within:border-indigo-500/50 focus-within:bg-[#141c28]/80 transition-all mb-4">
                <span className="pl-4 text-3xl font-black text-slate-600">$</span>
                <input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-white font-black text-4xl md:text-5xl outline-none px-4 py-2 placeholder:text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <button 
                  onClick={() => setMontoPago(String(deudaTotal > 0 ? deudaTotal : 10000))}
                  className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest transition-all"
                >
                  {deudaTotal > 0 ? 'Saldar Todo' : '$10.000'}
                </button>
                <button 
                  onClick={() => setMontoPago(String(deudaTotal > 0 ? Math.round(deudaTotal / 2) : 50000))}
                  className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest transition-all"
                >
                  {deudaTotal > 0 ? 'Mitad (50%)' : '$50.000'}
                </button>
                <button 
                  onClick={() => setMontoPago('100000')}
                  className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest transition-all"
                >
                  $100.000
                </button>
              </div>

              <button 
                onClick={handleRealizarPago}
                disabled={!montoPago || Number(montoPago) <= 0 || isPaging}
                className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex justify-center items-center gap-3 shadow-xl ${
                  !montoPago || Number(montoPago) <= 0 
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isPaging ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
                Confirmar Operación
              </button>
            </div>
          </div>

          {/* GRID DE KPIs DE RENDIMIENTO */}
          <div className="p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.01] shrink-0 border-b border-white/5">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[2rem] flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Viajes Realizados</p>
                <Route size={14} className="text-indigo-400" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{viajesFiltrados.length}</p>
            </div>

            <div className="bg-[#1a2537]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Distancia Generada</p>
                <Milestone size={14} className="text-sky-500" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{stats.totalKm.toLocaleString()} <span className="text-xs text-slate-600 font-bold">KM</span></p>
            </div>

            <div className="bg-[#1a2537]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gasoil Utilizado</p>
                <Droplets size={14} className="text-cyan-500" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{stats.totalLts.toLocaleString()} <span className="text-xs text-slate-600 font-bold">LTS</span></p>
            </div>

            <div className="bg-[#1a2537]/40 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-center shadow-inner">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento (Periodo)</p>
                <Flame size={14} className={consumoColor} />
              </div>
              <p className={`text-2xl md:text-3xl font-black italic tracking-tighter ${consumoColor}`}>
                {stats.rendimiento} <span className="text-xs text-slate-600 font-bold">L/100km</span>
              </p>
            </div>
          </div>

          {/* --- DOS COLUMNAS: VIAJES vs MOVIMIENTOS --- */}
          <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 pb-10">
            
            {/* Columna Izquierda: VIAJES */}
            <div className="flex-1">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                Desglose de Viajes <span className="text-indigo-400">({viajesFiltrados.length})</span>
              </h3>
              
              {viajesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-50 border-2 border-dashed border-white/5 rounded-3xl">
                   <FilterX size={32} className="text-slate-600 mb-3" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No hay viajes registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viajesFiltrados.map((v: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-[#141c28]/50 p-4 rounded-[1.5rem] border border-white/5 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
                          <CalIcon size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">{new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                          <p className="text-sm font-black text-white uppercase mt-0.5">{Number(v.km_recorridos)} KM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Flete Chofer</p>
                        <p className="text-sm font-black text-emerald-400 tabular-nums">$ {Number(v.pago_chofer).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🚀 Columna Derecha: MOVIMIENTOS Y PAGOS (Acá está la papelera) */}
            <div className="flex-1">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                Historial de Movimientos <span className="text-indigo-400">({movimientosFiltrados.length})</span>
              </h3>

              {movimientosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-50 border-2 border-dashed border-white/5 rounded-3xl">
                   <Wallet size={32} className="text-slate-600 mb-3" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No hay movimientos de dinero</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movimientosFiltrados.map((m: any) => {
                    const isPago = m.tipo_movimiento === 'PAGO' || Number(m.monto) < 0;
                    return (
                      <div key={m.id} className="group flex justify-between items-center bg-[#141c28]/50 p-4 rounded-[1.5rem] border border-white/5 hover:border-slate-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${isPago ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isPago ? <ArrowRightLeft size={14} /> : <Route size={14} />}
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                              {new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                            </p>
                            <p className="text-[10px] font-black text-white uppercase mt-0.5 truncate max-w-[120px] sm:max-w-[180px]">
                              {m.detalle || (isPago ? 'Entrega / Adelanto' : 'Viaje')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm font-black tabular-nums ${isPago ? 'text-sky-400' : 'text-emerald-400'}`}>
                              {isPago ? '' : '+'}$ {Math.abs(Number(m.monto)).toLocaleString('es-AR')}
                            </p>
                          </div>
                          
                          {/* BOTÓN DE ANULAR PAGO */}
                          <button 
                            onClick={() => onDeleteMovimiento && onDeleteMovimiento(m.id)}
                            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Anular Movimiento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function FilterBtn({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`px-4 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
        active ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  )
}