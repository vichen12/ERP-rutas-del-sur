"use client";
// src/components/viajes/ViajeModalOperativo.tsx
// ACTUALIZADO V3:
// - Cada reparto (ida/vuelta) muestra los destinos guardados del cliente
// - Al elegir destino → autocomplete tarifa, km, lts de ese destino
// - Tarifa del destino sobreescribe la del cliente (coexistencia)
import {
  Calendar, MapPin, Truck, User,
  Hash, ChevronRight,
  PlusCircle, Trash2, Star, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Info, Fuel, Building2
} from "lucide-react";
import { useEffect } from "react";

interface Reparto {
  cliente_id:      string
  destino_id:      string   // ← nuevo: ID del destino_cliente seleccionado
  destino_nombre:  string   // nombre del destino para mostrar
  monto_flete:     string
}

export function ViajeModalOperativo({
  formData,
  setFormData,
  clientes = [],
  camiones = [],
  choferes = [],
  destinos = [],        // ← nuevo: array de destinos_cliente (todos, filtrados por cliente en render)
  onCamionChange,
  agregarCliente,
  actualizarReparto,
  eliminarReparto
}: any) {

  const tieneVuelta = formData.repartos_vuelta && formData.repartos_vuelta.length > 0;

  const kmIda     = Number(formData.km_ida)    || 0;
  const kmVuelta  = Number(formData.km_vuelta)  || 0;
  const ltsIda    = Number(formData.lts_ida)   || 0;
  const ltsVuelta = Number(formData.lts_vuelta) || 0;

  useEffect(() => {
    const kmTotal  = tieneVuelta ? kmIda + kmVuelta   : kmIda;
    const ltsTotal = tieneVuelta ? ltsIda + ltsVuelta : ltsIda;
    setFormData((prev: any) => ({
      ...prev,
      ...(kmTotal  > 0 ? { km_recorridos: String(kmTotal)  } : {}),
      ...(ltsTotal > 0 ? { lts_gasoil:    String(ltsTotal) } : {}),
    }));
  }, [kmIda, kmVuelta, ltsIda, ltsVuelta, tieneVuelta]);

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

  // Devuelve los destinos de un cliente específico
  const getDestinos = (clienteId: string) =>
    destinos.filter((d: any) => d.cliente_id === clienteId && d.activo !== false)

  // Devuelve la tarifa efectiva: destino > cliente > 0
  const getTarifaEfectiva = (clienteId: string, destinoId: string) => {
    if (destinoId) {
      const d = destinos.find((x: any) => x.id === destinoId)
      if (d && Number(d.tarifa_flete) > 0) return String(d.tarifa_flete)
    }
    const cliente = clientes.find((c: any) => c.id === clienteId)
    return String(cliente?.tarifa_flete || '')
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 font-sans italic pb-4">

      {/* 1. CONFIGURACIÓN DE RUTA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Info size={8} /> Auto al elegir destino
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILA LITROS */}
      <div className={`rounded-2xl px-6 py-4 flex items-center gap-4 border transition-all ${
        tieneVuelta ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-900/20 border-white/5"
      }`}>
        <Fuel size={16} className={tieneVuelta ? "text-amber-500 shrink-0" : "text-slate-600 shrink-0"} />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={12} className="text-emerald-400 shrink-0" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Lts Ida</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums ml-auto">{ltsIda || "—"}</span>
          </div>
          <div className={`flex items-center gap-2 ${!tieneVuelta ? "opacity-30" : ""}`}>
            <ArrowDownCircle size={12} className="text-indigo-400 shrink-0" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Lts Vuelta</span>
            <span className="text-sm font-black text-indigo-400 tabular-nums ml-auto">{ltsVuelta || (tieneVuelta ? "?" : "—")}</span>
          </div>
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

      {/* 2. CARGA DE IDA */}
      <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 border-b border-emerald-500/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 shadow-lg"><ArrowUpCircle size={24} /></div>
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
            formData.repartos_ida.map((rep: any, idx: number) => {
              const destinosCliente = getDestinos(rep.cliente_id)
              return (
                <RepartoRow
                  key={`ida-${idx}`}
                  rep={rep}
                  idx={idx}
                  tipo="ida"
                  clientes={clientes}
                  destinosCliente={destinosCliente}
                  isFirst={idx === 0}
                  onClienteChange={(clienteId) => actualizarReparto('ida', idx, 'cliente_id', clienteId)}
                  onDestinoChange={(destinoId) => {
                    const d = destinos.find((x: any) => x.id === destinoId)
                    actualizarReparto('ida', idx, 'destino_id', destinoId)
                    if (d) {
                      actualizarReparto('ida', idx, 'destino_nombre', d.nombre)
                      // Tarifa efectiva
                      const tarifa = getTarifaEfectiva(rep.cliente_id, destinoId)
                      actualizarReparto('ida', idx, 'monto_flete', tarifa)
                      // KM y LTS (solo primer cliente de ida)
                      if (idx === 0 && Number(d.km_desde_base) > 0) {
                        setFormData((prev: any) => ({
                          ...prev,
                          km_ida:  String(d.km_desde_base),
                          lts_ida: d.lts_estimados ? String(d.lts_estimados) : prev.lts_ida,
                          destino: d.nombre,
                        }))
                      }
                    }
                  }}
                  onMontoChange={(val) => actualizarReparto('ida', idx, 'monto_flete', val)}
                  onDelete={() => eliminarReparto('ida', idx)}
                />
              )
            })
          )}
        </div>
      </div>

      {/* 3. CARGA DE RETORNO */}
      <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 border-b border-indigo-500/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-500 shadow-lg"><ArrowDownCircle size={24} /></div>
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
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-50">Regreso en vacío</p>
            </div>
          ) : (
            formData.repartos_vuelta.map((rep: any, idx: number) => {
              const destinosCliente = getDestinos(rep.cliente_id)
              return (
                <RepartoRow
                  key={`vuelta-${idx}`}
                  rep={rep}
                  idx={idx}
                  tipo="vuelta"
                  clientes={clientes}
                  destinosCliente={destinosCliente}
                  isFirst={false}
                  onClienteChange={(clienteId) => actualizarReparto('vuelta', idx, 'cliente_id', clienteId)}
                  onDestinoChange={(destinoId) => {
                    const d = destinos.find((x: any) => x.id === destinoId)
                    actualizarReparto('vuelta', idx, 'destino_id', destinoId)
                    if (d) {
                      actualizarReparto('vuelta', idx, 'destino_nombre', d.nombre)
                      const tarifa = getTarifaEfectiva(rep.cliente_id, destinoId)
                      actualizarReparto('vuelta', idx, 'monto_flete', tarifa)
                      if (idx === 0 && Number(d.km_desde_base) > 0) {
                        setFormData((prev: any) => ({
                          ...prev,
                          km_vuelta:  String(d.km_desde_base),
                          lts_vuelta: d.lts_estimados ? String(d.lts_estimados) : prev.lts_vuelta,
                        }))
                      }
                    }
                  }}
                  onMontoChange={(val) => actualizarReparto('vuelta', idx, 'monto_flete', val)}
                  onDelete={() => eliminarReparto('vuelta', idx)}
                />
              )
            })
          )}
        </div>
      </div>

      {/* 4. RECURSOS */}
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

      {/* 5. ENGRASE */}
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
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">¿La unidad recibió mantenimiento para este circuito?</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-componente: fila de un reparto (cliente + destino + tarifa)
// ─────────────────────────────────────────────────────────────
function RepartoRow({
  rep, idx, tipo, clientes, destinosCliente, isFirst,
  onClienteChange, onDestinoChange, onMontoChange, onDelete
}: any) {
  const color = tipo === 'ida' ? 'emerald' : 'indigo'
  const borderClass = isFirst
    ? `bg-${color}-500/10 border-${color}-500/30`
    : 'bg-slate-900/50 border-white/5'

  return (
    <div className={`flex flex-col gap-2 p-3 border rounded-2xl animate-in fade-in slide-in-from-left-4 ${borderClass}`}>

      {/* Fila 1: índice + cliente + destino */}
      <div className="flex gap-3 items-center">
        {/* Ícono de posición */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
          isFirst
            ? `bg-${color}-600 text-white shadow-md`
            : 'bg-black/50 text-slate-500 border border-white/5'
        }`}>
          {isFirst ? <Star size={16} fill="currentColor" /> : idx + 1}
        </div>

        {/* Selector de cliente */}
        <div className="relative flex-1">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <select
            required
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 pl-8 text-[11px] text-white font-black outline-none focus:border-emerald-500 appearance-none cursor-pointer uppercase transition-colors"
            value={rep.cliente_id || ""}
            onChange={(e) => onClienteChange(e.target.value)}
          >
            <option value="">-- CLIENTE / DADOR --</option>
            {clientes.map((cl: any) => (
              <option key={cl.id} value={cl.id}>{cl.razon_social}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
        </div>

        {/* Botón eliminar */}
        <button
          type="button"
          onClick={onDelete}
          className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Fila 2: destino + tarifa (solo si hay cliente) */}
      {rep.cliente_id && (
        <div className="flex gap-2 items-center ml-12">

          {/* Selector de destino del cliente */}
          <div className="relative flex-1">
            {destinosCliente.length > 0 ? (
              <>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={13} />
                <select
                  className={`w-full bg-black/30 border rounded-xl py-2.5 px-3 pr-8 text-[10px] font-black text-white outline-none appearance-none cursor-pointer uppercase transition-all ${
                    rep.destino_id
                      ? `border-${color}-500/30 focus:border-${color}-500`
                      : 'border-white/5 focus:border-sky-500'
                  }`}
                  value={rep.destino_id || ""}
                  onChange={(e) => onDestinoChange(e.target.value)}
                >
                  <option value="">📍 Seleccionar destino...</option>
                  {destinosCliente.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}{d.km_desde_base ? ` — ${d.km_desde_base} km` : ''}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[9px] font-black text-amber-400 uppercase">
                  Sin ubicaciones — Cargarlas en el perfil del cliente
                </p>
              </div>
            )}
          </div>

          {/* Tarifa */}
          <div className="relative w-36 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 font-black text-sm">$</span>
            <input
              required
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-7 pr-3 text-white font-black text-sm tabular-nums outline-none focus:border-emerald-500 placeholder:text-slate-700"
              value={rep.monto_flete || ""}
              onChange={(e) => onMontoChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}