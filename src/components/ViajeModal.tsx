'use client'
import { X, Loader2, Calendar, User, Truck, DollarSign, MapPin } from 'lucide-react'

export function ViajeModal({ isOpen, onClose, onSubmit, isSubmitting, formData, setFormData, clientes, choferes, camiones }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl relative italic overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Nuevo <br/> <span className="text-emerald-500">Despacho</span></h2>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Cliente (Opcional)</label>
              <select className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:border-emerald-500 outline-none uppercase" 
                value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})}>
                <option value="">-- PARTICULAR --</option>
                {clientes.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Monto Pactado</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input required type="number" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:border-emerald-500 outline-none" 
                  value={formData.monto_neto} onChange={e => setFormData({...formData, monto_neto: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input required placeholder="ORIGEN" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold uppercase outline-none focus:border-emerald-500" 
                  value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value})} />
             </div>
             <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input required placeholder="DESTINO" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold uppercase outline-none focus:border-emerald-500" 
                  value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-[10px] text-white font-bold outline-none focus:border-emerald-500" 
                value={formData.camion_id} onChange={e => setFormData({...formData, camion_id: e.target.value})}>
                <option value="">CAMIÓN...</option>
                {camiones.map((c: any) => <option key={c.id} value={c.id}>{c.patente}</option>)}
             </select>
             <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-[10px] text-white font-bold outline-none focus:border-emerald-500" 
                value={formData.chofer_id} onChange={e => setFormData({...formData, chofer_id: e.target.value})}>
                <option value="">CHOFER...</option>
                {choferes.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.nombre}</option>)}
             </select>
             <input required type="number" placeholder="KM" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none focus:border-emerald-500" 
                value={formData.km_recorridos} onChange={e => setFormData({...formData, km_recorridos: e.target.value})} />
          </div>

          <div className="relative">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={16} />
             <input required type="date" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:border-emerald-500 [color-scheme:dark]" 
                value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Hoja de Ruta'}
          </button>
        </form>
      </div>
    </div>
  )
}