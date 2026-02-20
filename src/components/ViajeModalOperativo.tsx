"use client";
import {
  Calendar, MapPin, TrendingUp, RefreshCw, Truck, User, 
  Hash, ChevronRight, Info, AlertCircle, CheckCircle2, ShieldCheck
} from "lucide-react";

export function ViajeModalOperativo({
  formData,
  setFormData,
  clientes = [],
  camiones = [],
  choferes = [],
}: any) {
  
  // ==========================================
  // 🔄 FUNCIÓN DE SWAP (INVERSIÓN DE RUTA)
  // ==========================================
  const handleToggleRetorno = (sentido: boolean) => {
    // Solo invertimos si realmente estamos cambiando el estado
    if (formData.es_retorno !== sentido) {
      setFormData((prev: any) => ({
        ...prev,
        es_retorno: sentido,
        // 🔥 LA MAGIA: El origen pasa a ser el destino y viceversa
        origen: prev.destino || "",
        destino: prev.origen || "",
      }));
    }
  };

  // ==========================================
  // 🚀 MOTOR DE ADN LOGÍSTICO (AUTOPRECIADO)
  // ==========================================
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedClienteId = e.target.value;
    if (!selectedClienteId) {
      setFormData((prev: any) => ({ ...prev, cliente_id: "" }));
      return;
    }

    const cl = clientes.find((c: any) => c.id === selectedClienteId);

    if (cl) {
      const cfg = cl.cliente_rutas_config?.[0] || {};
      
      // Obtenemos los valores base
      let origenBase = (cfg.origen || cl.ruta_origen || "MENDOZA");
      let destinoBase = (cfg.destino || cl.ruta_destino || "");

      // 💡 Si ya está marcado como retorno, invertimos los valores del cliente al cargar
      const origenFinal = formData.es_retorno ? destinoBase : origenBase;
      const destinoFinal = formData.es_retorno ? origenBase : destinoBase;

      setFormData((prev: any) => ({
        ...prev,
        cliente_id: selectedClienteId,
        origen: origenFinal.toUpperCase(),
        destino: destinoFinal.toUpperCase(),
        km_recorridos: String(cfg.km_estimados || cl.ruta_km_estimados || ""),
        tarifa_flete: String(cfg.tarifa_flete_sugerida || cl.tarifa_flete || ""),
        pago_chofer: String(cfg.pago_chofer_estimado || cl.pago_chofer || ""),
        lts_gasoil: String(cfg.lts_combustible_estimado || cl.lts_gasoil_estimado || ""),
        costo_descarga: String(cfg.costo_descarga_sugerido || cl.costo_descarga || "0"),
        desgaste_por_km: String(cfg.desgaste_por_km || cl.desgaste_por_km || "180"),
      }));
    }
  };

  // ==========================================
  // 🚛 VÍNCULO UNIDAD -> OPERADOR
  // ==========================================
  const handleCamionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const unidad = camiones.find((c: any) => c.id === selectedId);
    
    setFormData((prev: any) => ({
      ...prev,
      camion_id: selectedId,
      // 🤝 Si la unidad tiene un operador_id (chofer fijo), lo asignamos al toque
      chofer_id: unidad?.operador_id || unidad?.chofer_id || prev.chofer_id,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans italic pb-4">
      
      {/* 1. SELECTOR DE SENTIDO - CON LÓGICA DE SWAP */}
      <div className={`p-1.5 rounded-[2rem] flex flex-col sm:flex-row items-stretch border transition-all duration-700 bg-slate-950/50 shadow-inner gap-1 ${!!formData.es_retorno ? "border-indigo-500/30" : "border-emerald-500/30"}`}>
        <button
          type="button"
          onClick={() => handleToggleRetorno(false)}
          className={`flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${!formData.es_retorno ? "bg-emerald-600 text-white shadow-lg scale-[1.02]" : "text-slate-600 hover:text-slate-400"}`}
        >
          <TrendingUp size={14} /> Operación Ida
        </button>
        <button
          type="button"
          onClick={() => handleToggleRetorno(true)}
          className={`flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${formData.es_retorno ? "bg-indigo-600 text-white shadow-lg scale-[1.02]" : "text-slate-600 hover:text-slate-400"}`}
        >
          <RefreshCw size={14} className={formData.es_retorno ? "animate-spin-slow" : ""} /> Logística Retorno
        </button>
      </div>

      {/* 2. IDENTIDAD: CLIENTE Y FECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center justify-between">
            Dador de Carga
            {clientes.length > 0 && (
              <span className="text-emerald-500 text-[8px] font-black uppercase">Data Sync Active</span>
            )}
          </label>
          <div className="relative group">
            <select
              required
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4.5 px-6 text-white font-black focus:border-cyan-500 outline-none uppercase text-xs appearance-none cursor-pointer transition-all shadow-xl"
              value={formData.cliente_id || ""}
              onChange={handleClienteChange}
            >
              <option value="">-- SELECCIONAR CLIENTE --</option>
              {clientes.map((cl: any) => (
                <option key={cl.id} value={cl.id} className="bg-[#020617]">{cl.razon_social}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 rotate-90 pointer-events-none" size={18} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Fecha Operativa</label>
          <input
            required
            type="date"
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4.5 px-6 text-white font-black outline-none focus:border-cyan-500 text-xs uppercase [color-scheme:dark]"
            value={formData.fecha || ""}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          />
        </div>
      </div>

      {/* 3. LOGÍSTICA DE TRAYECTO (ORIGEN, DESTINO, KM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group">
          <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500/50" />
          <input
            required
            placeholder="ORIGEN"
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-black uppercase outline-none focus:border-emerald-500/30 text-xs"
            value={formData.origen || ""}
            onChange={(e) => setFormData({ ...formData, origen: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="relative group">
          <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500/50" />
          <input
            required
            placeholder="DESTINO"
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-black uppercase outline-none focus:border-rose-500/30 text-xs"
            value={formData.destino || ""}
            onChange={(e) => setFormData({ ...formData, destino: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="relative group">
          <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500/50" />
          <input
            required
            type="number"
            placeholder="KMS"
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-black outline-none focus:border-cyan-500 text-xs tabular-nums"
            value={formData.km_recorridos || ""}
            onChange={(e) => setFormData({ ...formData, km_recorridos: e.target.value })}
          />
        </div>
      </div>

      {/* 4. RECURSOS ASIGNADOS (CAMIÓN / CHOFER) */}
      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2.2rem] space-y-4 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2">
              <Truck size={12} /> Unidad de Transporte
            </label>
            <div className="relative">
              <select
                required
                className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs text-white font-black outline-none focus:border-sky-500 appearance-none cursor-pointer"
                value={formData.camion_id || ""}
                onChange={handleCamionChange}
              >
                <option value="">-- UNIDAD --</option>
                {camiones.map((c: any) => <option key={c.id} value={c.id}>{c.patente}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 rotate-90 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 flex items-center gap-2">
              <User size={12} /> Operador Responsable
            </label>
            <div className="relative">
              <select
                required
                className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs text-white font-black outline-none focus:border-sky-500 appearance-none cursor-pointer"
                value={formData.chofer_id || ""}
                onChange={(e) => setFormData({ ...formData, chofer_id: e.target.value })}
              >
                <option value="">-- CHOFER --</option>
                {choferes.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.nombre}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 rotate-90 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. PROTOCOLO TÉCNICO */}
      <div 
        onClick={() => setFormData({ ...formData, engrase: !formData.engrase })}
        className={`flex items-center gap-4 cursor-pointer select-none p-5 rounded-2xl border transition-all duration-300 ${!!formData.engrase ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-900/10" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"}`}
      >
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${!!formData.engrase ? "bg-amber-500 border-amber-500 rotate-12 scale-110" : "border-slate-700 bg-slate-900"}`}>
          {!!formData.engrase && <div className="w-2.5 h-2.5 bg-[#020617] rounded-sm" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] font-black uppercase tracking-widest ${!!formData.engrase ? "text-amber-500" : "text-slate-400"}`}>Engrase y Mantenimiento</span>
          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">¿Se realizó servicio técnico en ruta?</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
        <ShieldCheck size={14} className="text-cyan-500" />
        <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest leading-none">
          Carga inteligente: Datos vinculados dinámicamente
        </p>
      </div>
    </div>
  );
}