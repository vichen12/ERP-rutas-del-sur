"use client";
import {
  Calendar, MapPin, Truck, User, 
  Hash, ChevronRight,
  PlusCircle, Trash2, Star, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Info, Fuel
} from "lucide-react";
import { useEffect } from "react";

export function ViajeModalOperativo({
  formData,
  setFormData,
  clientes = [],
  camiones = [],
  choferes = [],
  onCamionChange,
  agregarCliente,
  actualizarReparto,
  eliminarReparto
}: any) {
  
  const tieneVuelta = formData.repartos_vuelta && formData.repartos_vuelta.length > 0;

  // 📐 Valores parciales guardados por tramo
  const kmIda     = Number(formData.km_ida)    || 0;
  const kmVuelta  = Number(formData.km_vuelta)  || 0;
  const ltsIda    = Number(formData.lts_ida)   || 0;
  const ltsVuelta = Number(formData.lts_vuelta) || 0;

  // 🔄 Recalcular totales cuando cambian los parciales o el estado de vuelta
  useEffect(() => {
    const kmTotal  = tieneVuelta ? kmIda + kmVuelta   : kmIda;
    const ltsTotal = tieneVuelta ? ltsIda + ltsVuelta : ltsIda;
    setFormData((prev: any) => ({
      ...prev,
      ...(kmTotal  > 0 ? { km_recorridos: String(kmTotal)  } : {}),
      ...(ltsTotal > 0 ? { lts_gasoil:    String(ltsTotal) } : {}),
    }));
  }, [kmIda, kmVuelta, ltsIda, ltsVuelta, tieneVuelta]);

  // 🧹 Limpiar parciales de vuelta si no hay clientes de vuelta
  useEffect(() => {
    if (!tieneVuelta && (formData.km_vuelta || formData.lts_vuelta)) {
      setFormData((prev: any) => ({
        ...prev,
        km_vuelta:     "",
        lts_vuelta:    "",
        km_recorridos: prev.km_ida  || prev.km_recorridos,
        lts_gasoil:    prev.lts_ida || prev.lts_gasoil,
      }));
    }
  }, [tieneVuelta]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 font-sans italic pb-4">
      
      {/* 1. CONFIGURACIÓN DE RUTA INTEGRAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Fecha */}
        <div className="space-y-2 md:col-span-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Fecha Salida</label>
          <div className="relative group">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" />
            <input 
              required type="date" 
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white font-black outline-none focus:border-cyan-500 text-sm uppercase [color-scheme:dark] shadow-inner transition-all hover:bg-slate-900/80" 
              value={formData.fecha || ""} 
              onChange={(e) => setFormData((prev: any) => ({ ...prev, fecha: e.target.value }))} 
            />
          </div>
        </div>

        {/* Origen */}
        <div className="space-y-2 md:col-span-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Origen Base</label>
          <div className="relative">
             <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" />
             <input 
               required placeholder="MENDOZA" 
               className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white font-black uppercase outline-none focus:border-emerald-500/50 text-sm shadow-inner transition-all hover:bg-slate-900/80" 
               value={formData.origen || ""} 
               onChange={(e) => setFormData((prev: any) => ({ ...prev, origen: e.target.value.toUpperCase() }))} 
             />
          </div>
        </div>

        {/* Destino */}
        <div className="space-y-2 md:col-span-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Destino Base</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500/50" />
            <input 
              required placeholder="EJ: BS AS" 
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-white font-black uppercase outline-none focus:border-rose-500/50 text-sm shadow-inner transition-all hover:bg-slate-900/80" 
              value={formData.destino || ""} 
              onChange={(e) => setFormData((prev: any) => ({ ...prev, destino: e.target.value.toUpperCase() }))} 
            />
          </div>
        </div>

        {/* 🚀 KM TOTAL con desglose ida + vuelta */}
        <div className="space-y-2 md:col-span-1">
          <label className="text-[10px] font-black uppercase ml-2 tracking-widest flex items-center gap-2">
            <span className={tieneVuelta ? "text-indigo-400" : "text-slate-500"}>
              KM {tieneVuelta ? "Circuito" : "Tramo"}
            </span>
            {tieneVuelta && kmIda > 0 && (
              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-black whitespace-nowrap">
                {kmIda} + {kmVuelta || "?"} km
              </span>
            )}
          </label>
          <div className="relative">
            <Hash size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${tieneVuelta ? "text-indigo-500" : "text-indigo-500/40"}`} />
            <input 
              required type="number" 
              placeholder="Km Totales" 
              className={`w-full bg-slate-900 rounded-2xl py-5 pl-12 pr-4 text-white font-black outline-none text-sm tabular-nums shadow-inner transition-all hover:bg-slate-900/80 ${
                tieneVuelta ? "border border-indigo-500/50 focus:border-indigo-400" : "border border-indigo-500/20 focus:border-indigo-500"
              }`}
              value={formData.km_recorridos || ""} 
              onChange={(e) => setFormData((prev: any) => ({ ...prev, km_recorridos: e.target.value }))} 
            />
            <div className="absolute -bottom-5 left-2 right-2">
              {tieneVuelta && kmIda > 0 ? (
                <span className="text-[8px] text-indigo-400/60 font-black uppercase flex items-center gap-1">
                  <ArrowUpCircle size={8} className="text-emerald-400" /> {kmIda}
                  <span className="text-slate-600 mx-0.5">+</span>
                  <ArrowDownCircle size={8} className="text-indigo-400" /> {kmVuelta || "?"}
                </span>
              ) : (
                <span className="text-[8px] text-slate-600 font-black uppercase flex items-center gap-1">
                  <Info size={8} /> Auto al elegir cliente
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 FILA SECUNDARIA: Litros con desglose (aparece siempre, resaltada al haber vuelta) */}
      <div className={`rounded-2xl px-6 py-4 flex items-center gap-4 border transition-all ${
        tieneVuelta 
          ? "bg-amber-500/5 border-amber-500/20" 
          : "bg-slate-900/20 border-white/5"
      }`}>
        <Fuel size={16} className={tieneVuelta ? "text-amber-500 shrink-0" : "text-slate-600 shrink-0"} />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Litros Ida */}
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={12} className="text-emerald-400 shrink-0" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Lts Ida</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums ml-auto">{ltsIda || "—"}</span>
          </div>
          {/* Litros Vuelta */}
          <div className={`flex items-center gap-2 ${!tieneVuelta ? "opacity-30" : ""}`}>
            <ArrowDownCircle size={12} className="text-indigo-400 shrink-0" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Lts Vuelta</span>
            <span className="text-sm font-black text-indigo-400 tabular-nums ml-auto">{ltsVuelta || (tieneVuelta ? "?" : "—")}</span>
          </div>
          {/* Total Litros */}
          <div className={`flex items-center gap-2 ${tieneVuelta ? "border-l border-amber-500/20 pl-4" : ""}`}>
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap" 
              style={{ color: tieneVuelta ? '#f59e0b' : '#475569' }}>
              Total Lts
            </span>
            <span className={`text-base font-black tabular-nums ml-auto ${tieneVuelta ? "text-amber-400" : "text-slate-500"}`}>
              {formData.lts_gasoil || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CARGA DE IDA (EMERALD THEME) */}
      <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 border-b border-emerald-500/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 shadow-lg shadow-emerald-500/10"><ArrowUpCircle size={24} /></div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-widest">Carga de Ida</h3>
              <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-tighter">
                Primer cliente define ruta técnica
                {kmIda > 0 && <span className="ml-2 text-emerald-400 font-black">· {kmIda} KM · {ltsIda} lts</span>}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => agregarCliente('ida')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={16} /> Sumar Cliente
          </button>
        </div>

        <div className="space-y-3 pt-6">
          {formData.repartos_ida.length === 0 ? (
            <div className="py-8 text-center bg-black/20 rounded-2xl border border-dashed border-emerald-500/10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin asignación de salida</p>
            </div>
          ) : (
            formData.repartos_ida.map((rep: any, idx: number) => (
              <div key={`ida-${idx}`} className={`flex gap-3 p-3 border rounded-2xl items-center animate-in fade-in slide-in-from-left-4 ${idx === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-emerald-600 text-white shadow-md' : 'bg-black/50 text-slate-500 border border-white/5'}`}>
                  {idx === 0 ? <Star size={18} fill="currentColor" /> : idx + 1}
                </div>
                <div className="relative flex-1">
                  <select
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 pr-10 text-[11px] text-white font-black outline-none focus:border-emerald-500 appearance-none cursor-pointer uppercase transition-colors"
                    value={rep.cliente_id || ""}
                    onChange={(e) => actualizarReparto('ida', idx, 'cliente_id', e.target.value)}
                  >
                    <option value="">-- SELECCIONAR CLIENTE --</option>
                    {clientes.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
                </div>
                <button type="button" onClick={() => eliminarReparto('ida', idx)} className="p-3.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"><Trash2 size={18}/></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. CARGA DE RETORNO (INDIGO THEME) */}
      <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 border-b border-indigo-500/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-500 shadow-lg shadow-indigo-500/10"><ArrowDownCircle size={24} /></div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-widest">Carga de Retorno</h3>
              <p className="text-[9px] font-bold text-indigo-500/70 uppercase tracking-tighter">
                Optimización de rentabilidad de vuelta
                {tieneVuelta && kmVuelta > 0 && <span className="ml-2 text-indigo-400 font-black">· {kmVuelta} KM · {ltsVuelta} lts</span>}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => agregarCliente('vuelta')}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <PlusCircle size={16} /> Sumar Retorno
          </button>
        </div>

        <div className="space-y-3 pt-6">
          {formData.repartos_vuelta.length === 0 ? (
            <div className="py-8 text-center bg-black/20 rounded-2xl border border-dashed border-indigo-500/10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-50">Regreso en vacío (Solo flete de ida)</p>
            </div>
          ) : (
            formData.repartos_vuelta.map((rep: any, idx: number) => (
              <div key={`vuelta-${idx}`} className="flex gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-2xl items-center animate-in fade-in slide-in-from-right-4 shadow-md">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-black/50 text-indigo-400 border border-indigo-500/20 font-black">
                  {idx + 1}
                </div>
                <div className="relative flex-1">
                  <select
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 px-4 pr-10 text-[11px] text-white font-black outline-none focus:border-indigo-500 appearance-none cursor-pointer uppercase transition-colors"
                    value={rep.cliente_id || ""}
                    onChange={(e) => actualizarReparto('vuelta', idx, 'cliente_id', e.target.value)}
                  >
                    <option value="">-- SELECCIONAR CLIENTE --</option>
                    {clientes.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
                </div>
                <button type="button" onClick={() => eliminarReparto('vuelta', idx)} className="p-3.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"><Trash2 size={18}/></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. RECURSOS ASIGNADOS */}
      <div className="bg-slate-900/30 border border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6 shadow-inner">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Recursos de Flota</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2 flex items-center gap-1">Unidad <Truck size={10} /></label>
            <div className="relative group/unidad">
              <Truck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-500/50 z-10 transition-colors group-focus-within/unidad:text-sky-400" />
              <select 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-12 text-sm text-white font-black outline-none focus:border-sky-500 appearance-none cursor-pointer relative z-0 transition-colors hover:bg-slate-900" 
                value={formData.camion_id || ""} 
                onChange={onCamionChange}
              >
                <option value="">-- SELECCIONAR UNIDAD --</option>
                {camiones.map((c: any) => <option key={c.id} value={c.id}>{c.patente}</option>)}
              </select>
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none z-10" size={16} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-2 flex items-center gap-1">Responsable <User size={10} /></label>
            <div className="relative group/chofer">
              <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-500/50 z-10 transition-colors group-focus-within/chofer:text-sky-400" />
              <select 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-12 text-sm text-white font-black outline-none focus:border-sky-500 appearance-none cursor-pointer relative z-0 transition-colors hover:bg-slate-900" 
                value={formData.chofer_id || ""} 
                onChange={(e) => setFormData((prev: any) => ({ ...prev, chofer_id: e.target.value }))}
              >
                <option value="">-- SELECCIONAR CHOFER --</option>
                {choferes.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.nombre}</option>)}
              </select>
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none z-10" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. MANTENIMIENTO PREVENTIVO */}
      <div 
        onClick={() => setFormData((prev: any) => ({ ...prev, engrase: !prev.engrase }))}
        className={`flex items-center justify-between cursor-pointer select-none p-6 rounded-[2rem] border transition-all duration-300 shadow-sm ${!!formData.engrase ? "bg-amber-500/10 border-amber-500/40" : "bg-slate-900/30 border-white/5 hover:bg-white/[0.05]"}`}
      >
        <div className="flex items-center gap-5">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!!formData.engrase ? "bg-amber-500 text-black rotate-12 scale-110 shadow-lg shadow-amber-500/20" : "bg-black/50 border border-white/10 text-transparent"}`}>
             <CheckCircle2 size={24} />
           </div>
           <div className="flex flex-col">
             <span className={`text-xs font-black uppercase tracking-widest ${!!formData.engrase ? "text-amber-500" : "text-slate-400"}`}>Protocolo de Engrase</span>
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">¿La unidad recibió mantenimiento para este circuito completo?</span>
           </div>
        </div>
      </div>
      
    </div>
  );
}
