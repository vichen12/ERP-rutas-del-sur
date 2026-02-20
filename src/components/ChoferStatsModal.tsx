'use client'
import { useState, useMemo } from 'react'
import { DollarSign, Receipt, Calculator } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

// IMPORTAMOS LOS SUB-COMPONENTES
import { ChoferPaymentModal } from './ChoferPaymentModal'
import { ChoferStatsHeader } from './ChoferStatsHeader'
import { ChoferStatsKPIs } from './ChoferStatsKPIs'
import { LiquidacionList, BitacoraTable } from './ChoferStatsTables'

export function ChoferStatsModal({ isOpen, onClose, chofer, viajes, onRefresh }: any) {
  if (!isOpen || !chofer) return null

  const supabase = getSupabase()
  const [activeTab, setActiveTab] = useState<'liquidacion' | 'bitacora'>('liquidacion')
  
  // --- FILTROS ---
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [showAllTime, setShowAllTime] = useState(false)

  // --- ESTADOS DE SELECCIÓN Y UI ---
  const [selectedViajes, setSelectedViajes] = useState<string[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // --- LÓGICA DE DATOS (Filtrado por fecha) ---
  const filteredViajes = useMemo(() => {
    return viajes.filter((v: any) => {
      if (showAllTime) return true;
      const d = new Date(v.fecha);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [viajes, selectedMonth, selectedYear, showAllTime]);

  // --- CÁLCULOS DE KPIs (Alineados a BD V2.0) ---
  const stats = useMemo(() => {
    return filteredViajes.reduce((acc: any, curr: any) => {
      const pago = Number(curr.pago_chofer) || 0
      const km = Number(curr.km_recorridos) || 0 // V2.0 usa km_recorridos directo
      const lts = Number(curr.lts_gasoil) || 0    // V2.0 usa lts_gasoil
      
      return {
        totalPlata: acc.totalPlata + pago,
        totalDeuda: !curr.pago_chofer_realizado ? acc.totalDeuda + pago : acc.totalDeuda,
        totalKm: acc.totalKm + km,
        totalLts: acc.totalLts + lts,
        viajesCount: acc.viajesCount + 1
      }
    }, { totalPlata: 0, totalDeuda: 0, totalKm: 0, totalLts: 0, viajesCount: 0 })
  }, [filteredViajes])

  // Rendimiento: Litros cada 100km
  const consumoPromedio = stats.totalKm > 0 ? ((stats.totalLts / stats.totalKm) * 100).toFixed(1) : '0'

  const totalSeleccionado = useMemo(() => {
    return filteredViajes
      .filter((v: any) => selectedViajes.includes(v.id))
      .reduce((acc: number, curr: any) => acc + (Number(curr.pago_chofer) || 0), 0)
  }, [filteredViajes, selectedViajes])

  // --- HANDLERS ---
  const toggleSelect = (id: string) => {
    setSelectedViajes(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    const pendientes = filteredViajes.filter((v: any) => !v.pago_chofer_realizado);
    if (selectedViajes.length === pendientes.length) setSelectedViajes([])
    else setSelectedViajes(pendientes.map((v: any) => v.id))
  }

  const handleConfirmPayment = async (paymentData: any) => {
    if (selectedViajes.length === 0) return
    setIsProcessing(true)

    const diferencia = paymentData.montoReal - totalSeleccionado
    let notaAutomatica = paymentData.notas.toUpperCase()
    if (diferencia !== 0) {
        notaAutomatica += ` | TOTAL REAL: $${totalSeleccionado} | PAGO: $${paymentData.montoReal} (${diferencia > 0 ? 'ADELANTO' : 'PARCIAL'}: $${diferencia})`
    }

    try {
      // Actualizamos los viajes marcándolos como pagados al chofer
      const { error } = await supabase.from('viajes').update({
          pago_chofer_realizado: true,
          fecha_pago: paymentData.fecha,
          metodo_pago: paymentData.metodo,
          notas_pago: notaAutomatica
        }).in('id', selectedViajes)

      if (error) throw error
      setShowPaymentModal(false)
      setSelectedViajes([])
      if (onRefresh) onRefresh()
    } catch (err: any) { 
        alert("Error al procesar pago: " + err.message) 
    } finally { 
        setIsProcessing(false) 
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 md:pt-32 p-4 md:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 italic font-sans overflow-hidden">
        
        <div className="bg-[#020617] border border-white/10 w-full max-w-7xl h-full max-h-[85vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col mb-10">
          
          {/* HEADER */}
          <ChoferStatsHeader 
             chofer={chofer} 
             onClose={onClose}
             selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
             selectedYear={selectedYear} setSelectedYear={setSelectedYear}
             showAllTime={showAllTime} setShowAllTime={setShowAllTime}
          />

          {/* DASHBOARD KPIs */}
          <ChoferStatsKPIs 
             stats={stats} 
             consumoPromedio={consumoPromedio} 
             showAllTime={showAllTime} 
          />

          {/* TABS NAVEGACIÓN */}
          <div className="px-8 pt-6 flex gap-6 shrink-0">
             <button onClick={() => setActiveTab('liquidacion')} className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'liquidacion' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-600 hover:text-white'}`}><DollarSign size={14}/> Liquidación Pendiente</button>
             <button onClick={() => setActiveTab('bitacora')} className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'bitacora' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-slate-600 hover:text-white'}`}><Receipt size={14}/> Bitácora de Viajes</button>
          </div>

          {/* LISTADOS DE CONTENIDO */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            {activeTab === 'liquidacion' && (
              <LiquidacionList 
                  viajes={filteredViajes} 
                  selectedViajes={selectedViajes} 
                  toggleSelect={toggleSelect} 
                  handleSelectAll={handleSelectAll} 
              />
            )}
            {activeTab === 'bitacora' && <BitacoraTable viajes={filteredViajes} />}
          </div>

          {/* FOOTER FLOTANTE PARA LIQUIDACIÓN */}
          {activeTab === 'liquidacion' && selectedViajes.length > 0 && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] p-4 bg-indigo-600 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-50 animate-in slide-in-from-bottom-4 border border-white/20">
                <div className="pl-6">
                   <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">A Liquidar</p>
                   <p className="text-3xl font-black text-white italic tracking-tighter">$ {totalSeleccionado.toLocaleString()}</p>
                </div>
                <button onClick={() => setShowPaymentModal(true)} className="px-8 py-3 bg-white text-indigo-600 hover:bg-slate-100 rounded-[2rem] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-colors"><Calculator size={18}/> Continuar</button>
             </div>
          )}
        </div>
      </div>

      <ChoferPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        totalSeleccionado={totalSeleccionado}
        count={selectedViajes.length}
        isProcessing={isProcessing}
      />
    </>
  )
}