'use client'
import { X, Loader2, Truck, DollarSign, TrendingUp } from 'lucide-react'
import { useState, useMemo } from 'react'

// Importamos los sub-componentes
import { ViajeModalOperativo } from './ViajeModalOperativo'
import { ViajeModalFinanciero } from './ViajeModalFinanciero'

export function ViajeModal({ isOpen, onClose, onSubmit, isSubmitting, formData, setFormData, clientes, choferes, camiones }: any) {
  const [tab, setTab] = useState<'general' | 'financiero'>('general')

  // --- 🧠 LÓGICA DE AUTOMATIZACIÓN (El Cerebro del ERP) ---

  // 1. Manejador de Cambio de Cliente (Carga ADN de ruta)
  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes?.find((c: any) => c.id === clienteId);
    if (!cliente) return;

    // Si es retorno, invertimos los campos que vienen de la base de datos del cliente
    const origenFinal = formData.es_retorno ? cliente.ruta_destino : cliente.ruta_origen;
    const destinoFinal = formData.es_retorno ? cliente.ruta_origen : cliente.ruta_destino;

    setFormData((prev: any) => ({
      ...prev,
      cliente_id: clienteId,
      origen: (origenFinal || "MENDOZA").toUpperCase(),
      destino: (destinoFinal || "").toUpperCase(),
      km_recorridos: cliente.ruta_km_estimados || "",
      tarifa_flete: cliente.tarifa_flete || "",
      pago_chofer: cliente.pago_chofer || "",
      lts_gasoil: cliente.lts_gasoil_estimado || "",
      costo_descarga: cliente.costo_descarga || "0",
      desgaste_por_km: cliente.desgaste_por_km || "180"
    }));
  };

  // 2. Manejador de Cambio de Camión (Asigna Chofer Automático)
  const handleCamionChange = (camionId: string) => {
    const camion = camiones?.find((c: any) => c.id === camionId);
    
    setFormData((prev: any) => ({
      ...prev,
      camion_id: camionId,
      // Si el camión tiene un operador_id en la DB, lo ponemos automáticamente
      chofer_id: camion?.operador_id || prev.chofer_id 
    }));
  };

  // 3. Manejador de Switch de Retorno (Ruta Espejo)
  const handleToggleRetorno = () => {
    const nuevoEstadoRetorno = !formData.es_retorno;
    
    setFormData((prev: any) => ({
      ...prev,
      es_retorno: nuevoEstadoRetorno,
      // 🔥 SWAP: Invertimos lo que haya escrito en origen y destino
      origen: prev.destino,
      destino: prev.origen
    }));
  };

  // --- 🚀 CÁLCULOS FINANCIEROS REACTIVOS ---
  const finanzas = useMemo(() => {
    const bruta = Number(formData.tarifa_flete) || 0;
    const pagoChofer = Number(formData.pago_chofer) || 0;
    const costoDescarga = Number(formData.costo_descarga) || 0;
    const litros = Number(formData.lts_gasoil) || 0;
    const precioGasoil = Number(formData.precio_gasoil) || 0;
    const totalGasoil = litros * precioGasoil;
    const kms = Number(formData.km_recorridos) || 0;
    const desgastePorKm = Number(formData.desgaste_por_km) || 0;
    const totalDesgaste = kms * desgastePorKm;

    const totalCostos = pagoChofer + costoDescarga + totalGasoil + totalDesgaste;
    const neta = bruta - totalCostos;
    const margen = bruta > 0 ? (neta / bruta) * 100 : 0;

    return { bruta, totalGasoil, totalDesgaste, totalCostos, neta, margen };
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/90 backdrop-blur-md pt-24 md:pt-32 p-4 font-sans italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative mb-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 rounded-t-full" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${formData.es_retorno ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                Logística de {formData.es_retorno ? 'Retorno' : 'Ida'}
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
              Hoja de <span className="text-cyan-500">Ruta</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="flex p-1 bg-slate-950 rounded-2xl mb-8 border border-white/5">
          <button type="button" onClick={() => setTab('general')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'general' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Operación</button>
          <button type="button" onClick={() => setTab('financiero')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'financiero' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Finanzas</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className={tab === 'general' ? 'block' : 'hidden'}>
            <ViajeModalOperativo 
              formData={formData} 
              setFormData={setFormData} 
              clientes={clientes} 
              camiones={camiones} 
              choferes={choferes}
              // 🔥 PASAMOS LAS NUEVAS FUNCIONES AL SUB-COMPONENTE
              onClienteChange={handleClienteChange}
              onCamionChange={handleCamionChange}
              onToggleRetorno={handleToggleRetorno}
            />
          </div>

          <div className={tab === 'financiero' ? 'block' : 'hidden'}>
            <ViajeModalFinanciero formData={formData} setFormData={setFormData} finanzas={finanzas} />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-cyan-900/40 active:scale-95 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Sincronizar Ruta <TrendingUp size={18} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}