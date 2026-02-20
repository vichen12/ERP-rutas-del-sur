"use client";
import {
  X,
  DollarSign,
  FileText,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export function GastoModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  camionPatente,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-300 font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Decorativo de fondo */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                Auditoría de Unidad
              </p>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              GASTO <span className="text-sky-500">/</span> {camionPatente}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 relative z-10">
          {/* DETALLE DEL GASTO */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
              Detalle de la reparación / compra
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 rounded-lg text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                <FileText size={16} />
              </div>
              <input
                required
                placeholder="EJ: CAMBIO DE ACEITE Y FILTROS"
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs text-white font-black outline-none focus:border-emerald-500/50 transition-all uppercase placeholder:text-slate-800"
                value={formData.descripcion || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descripcion: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
          </div>

          {/* FILA: MONTO Y FECHA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                Importe ($)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 rounded-lg text-emerald-500">
                  <DollarSign size={16} />
                </div>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-sm text-white font-black outline-none focus:border-emerald-500/50 transition-all tabular-nums"
                  value={formData.monto || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, monto: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                Fecha
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 rounded-lg text-white/50 group-focus-within:text-white transition-colors pointer-events-none">
                  <Calendar size={16} />
                </div>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs text-white font-black outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                  value={formData.fecha || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* BOTÓN GUARDAR */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30 group"
            >
              <CheckCircle2
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              Registrar Gasto Unidad
            </button>
            <p className="text-[8px] text-center text-slate-600 font-black uppercase tracking-[0.4em] mt-4 opacity-50">
              Esta operación impactará en el balance neto de la unidad
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}