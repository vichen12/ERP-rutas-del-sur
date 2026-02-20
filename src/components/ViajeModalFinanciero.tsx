"use client";
import {
  DollarSign,
  Fuel,
  User,
  Wrench,
  TrendingUp,
  Info,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
// 🚀 IMPORTAMOS SUPABASE PARA QUE EL MODAL SEA AUTÓNOMO
import { supabase } from "@/lib/supabase"; 

export function ViajeModalFinanciero({ formData, setFormData, finanzas }: any) {
  
  // Estado local para evitar parpadeos visuales
  const [precioCargando, setPrecioCargando] = useState(true);

  // --- 🚀 AUTO-INYECCIÓN DIRECTA DESDE LA BASE DE DATOS ---
  useEffect(() => {
    async function syncPrecioGlobal() {
      try {
        const { data, error } = await supabase
          .from('configuracion')
          .select('precio_gasoil')
          .eq('id', 1)
          .single();

        if (data && !error) {
          setFormData((prev: any) => ({
            ...prev,
            // Guardamos el sugerido para que el botón lo muestre
            precio_gasoil_sugerido: data.precio_gasoil,
            // 🔥 MAGIA: Si el input está vacío, le clavamos el precio de la base de datos automáticamente
            precio_gasoil: prev.precio_gasoil ? prev.precio_gasoil : data.precio_gasoil
          }));
        }
      } catch (err) {
        console.error("Fallo al traer precio global", err);
      } finally {
        setPrecioCargando(false);
      }
    }

    syncPrecioGlobal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Se ejecuta una sola vez al montar este tab

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-sans italic">
      
      {/* --- SECCIÓN 1: INGRESOS Y COMBUSTIBLE --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Facturación Bruta */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-emerald-500 uppercase ml-3 tracking-widest">
            Facturación Pactada (Flete)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950 rounded-lg text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors">
              <DollarSign size={16} />
            </div>
            <input
              required
              type="number"
              placeholder="0.00"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-black focus:border-emerald-500 outline-none text-lg transition-all tabular-nums"
              value={formData.tarifa_flete || ""}
              onChange={(e) =>
                setFormData({ ...formData, tarifa_flete: e.target.value })
              }
            />
          </div>
        </div>

        {/* Precio Gasoil */}
        <div className="space-y-1">
          <label className="text-[9px] font-black text-amber-500 uppercase ml-3 tracking-widest flex justify-between items-center">
            Precio Gasoil / Lts
            
            {/* 💡 BOTÓN INTELIGENTE CON ESTADO DE CARGA */}
            <span 
              onClick={() => {
                if (formData.precio_gasoil_sugerido) {
                  setFormData({ ...formData, precio_gasoil: formData.precio_gasoil_sugerido });
                }
              }}
              className={`flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                precioCargando 
                  ? 'text-slate-500 bg-white/5 border-white/5 animate-pulse' 
                  : 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:scale-105 active:scale-95'
              }`}
              title="Restaurar precio global"
            >
              <RefreshCw size={10} className={precioCargando ? "animate-spin" : ""} /> 
              {precioCargando ? "SINCRONIZANDO..." : `GLOBAL: $${formData.precio_gasoil_sugerido || "0"}`}
            </span>
          </label>
          
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-950 rounded-lg text-amber-500/50 group-focus-within:text-amber-500 transition-colors">
              <Fuel size={16} />
            </div>
            <input
              required
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-bold focus:border-amber-500 outline-none text-base transition-all tabular-nums"
              value={formData.precio_gasoil || ""}
              onChange={(e) =>
                setFormData({ ...formData, precio_gasoil: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: COSTOS DIRECTOS (PAGOS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-rose-400 uppercase ml-3 tracking-widest">
            Viático Chofer
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-slate-950 rounded-md text-rose-500/50 group-focus-within:text-rose-500 transition-colors">
              <User size={14} />
            </div>
            <input
              type="number"
              placeholder="0.00"
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white font-bold focus:border-rose-500 outline-none text-sm transition-all"
              value={formData.pago_chofer || ""}
              onChange={(e) =>
                setFormData({ ...formData, pago_chofer: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-3 tracking-widest">
            Gasto Descarga
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-slate-950 rounded-md text-slate-600 group-focus-within:text-white transition-colors">
              <Calculator size={14} />
            </div>
            <input
              type="number"
              placeholder="0.00"
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white font-bold focus:border-white/20 outline-none text-sm transition-all"
              value={formData.costo_descarga || ""}
              onChange={(e) =>
                setFormData({ ...formData, costo_descarga: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-amber-500 uppercase ml-3 tracking-widest">
            Gasoil (Lts)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-slate-950 rounded-md text-amber-500/50 group-focus-within:text-amber-500 transition-colors">
              <Fuel size={14} />
            </div>
            <input
              type="number"
              placeholder="Lts"
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white font-bold focus:border-amber-500 outline-none text-sm transition-all"
              value={formData.lts_gasoil || ""}
              onChange={(e) =>
                setFormData({ ...formData, lts_gasoil: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: COSTOS TÉCNICOS (DESGASTE) --- */}
      <div className="bg-slate-950/80 border border-white/10 rounded-[2rem] p-6 shadow-2xl space-y-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Wrench size={100} className="text-sky-500" />
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-500">
              <Wrench size={14} />
            </div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">
              Cálculo de Desgaste Técnico
            </h4>
          </div>
          <span className="text-[8px] font-black text-sky-500 bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20 uppercase tracking-widest">
            Amortización
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-500 uppercase ml-3 tracking-widest">
              Coeficiente ($ / KM)
            </label>
            <div className="relative group/km">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500/40 group-focus-within/km:text-sky-500 transition-colors">
                <TrendingUp size={14} />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 150.00"
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white font-bold focus:border-sky-500 outline-none text-sm transition-all"
                value={formData.desgaste_por_km || ""}
                onChange={(e) =>
                  setFormData({ ...formData, desgaste_por_km: e.target.value })
                }
              />
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/10 p-5 rounded-2xl flex items-center justify-between transition-all group-hover:bg-sky-500/10">
            <div className="flex flex-col gap-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
                Subtotal Desgaste
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                Aplicado a {formData.km_recorridos || 0} KM
              </p>
            </div>
            <p className="text-2xl font-black text-sky-400 italic tabular-nums tracking-tighter">
              ${" "}
              {Math.round(finanzas.totalDesgaste || 0).toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 4: DASHBOARD DE RESULTADO --- */}
      <div
        className={`bg-slate-950 border rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl transition-all duration-700 ${finanzas.neta >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 relative z-10">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
              Ingreso Bruto
            </p>
            <p className="text-xl font-black text-white italic tabular-nums">
              ${Math.round(finanzas.bruta).toLocaleString("es-AR")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
              Egresos Totales
            </p>
            <p className="text-xl font-black text-rose-400 italic tabular-nums">
              -${Math.round(finanzas.totalCostos).toLocaleString("es-AR")}
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <p
                className={`text-[8px] font-black uppercase tracking-[0.3em] ${finanzas.neta >= 0 ? "text-emerald-500" : "text-rose-500"}`}
              >
                Utilidad Proyectada
              </p>
              <div
                className={`px-2 py-0.5 rounded-md text-[8px] font-black border ${finanzas.neta >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}
              >
                {Math.round(finanzas.margen)}% ROI
              </div>
            </div>
            <p
              className={`text-5xl font-black italic tracking-tighter leading-none tabular-nums ${finanzas.neta >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              $ {Math.round(finanzas.neta).toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
          <div
            className={`h-full transition-all duration-1000 ${finanzas.neta >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{ width: `${Math.min(Math.max(finanzas.margen, 0), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}