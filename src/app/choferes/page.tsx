"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Loader2,
  UserCheck,
  ShieldAlert,
  CreditCard,
  Filter,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Componentes del sistema
import { ChoferCard } from "@/components/choferes/ChoferCard";
import { ChoferModal } from "@/components/choferes/ChoferModal";
import { ChoferStatsModal } from "@/components/choferes/ChoferStatsModal";

export default function ChoferesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [choferes, setChoferes] = useState<any[]>([]);
  const [camiones, setCamiones] = useState<any[]>([]);
  const [todosLosViajes, setTodosLosViajes] = useState<any[]>([]);
  
  const [deudasChoferes, setDeudasChoferes] = useState<any[]>([]);
  const [historialChoferes, setHistorialChoferes] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");

  const [filterEstado, setFilterEstado] = useState<
    "TODOS" | "ACTIVOS" | "NO_DISPONIBLES" | "INACTIVOS"
  >("ACTIVOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedChofer, setSelectedChofer] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    nombre: "",
    dni: "",
    licencia: "",
    vto_licencia: "",
    telefono: "",
    estado: "Disponible",
    foto_url: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Un solo fetch de cuenta_corriente_choferes — se filtra en memoria
      const [ch, ca, vi, cuentas] = await Promise.all([
        supabase.from("choferes").select("*").order("nombre", { ascending: true }),
        supabase.from("camiones").select("id, patente, modelo, operador_id"),
        supabase.from("viajes").select("id, chofer_id, pago_chofer, km_recorridos, lts_gasoil, fecha"),
        supabase.from("cuenta_corriente_choferes").select("*").order("fecha", { ascending: false })
      ]);

      if (ch.data) setChoferes(ch.data);
      if (ca.data) setCamiones(ca.data);
      if (vi.data) setTodosLosViajes(vi.data);
      if (cuentas.data) {
        setDeudasChoferes(cuentas.data.filter((d: any) => !d.pagado));
        setHistorialChoferes(cuentas.data);
      }
      
    } catch (error: any) {
      console.error("Error cargando datos:", error.message);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  }

  // --- 📊 KPI DINÁMICOS CORREGIDOS ---
  const globalStats = useMemo(() => {
    const hoy = new Date();
    
    const balanceCrudo = deudasChoferes.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    const esDeudaEmpresa = balanceCrudo > 0;
    const esAFavorEmpresa = balanceCrudo < 0;
    const estaAlDia = balanceCrudo === 0;

    return {
      balanceAbsoluto: Math.abs(balanceCrudo), 
      esDeudaEmpresa,
      esAFavorEmpresa,
      estaAlDia,
      vencimientosProximos: choferes.filter((ch) => {
        if (!ch.vto_licencia) return false;
        const vto = new Date(ch.vto_licencia);
        const diff = (vto.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
        return diff <= 30 && diff > 0;
      }).length,
    };
  }, [deudasChoferes, choferes]);

  // --- HANDLERS BÁSICOS ---
  const handleEdit = (chofer: any) => {
    setFormData({
      nombre: chofer.nombre || "",
      dni: chofer.dni || "",
      licencia: chofer.licencia || "",
      vto_licencia: chofer.vto_licencia || "",
      telefono: chofer.telefono || "",
      estado: chofer.estado || "Disponible",
      foto_url: chofer.foto_url || "",
    });
    setEditingId(chofer.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        nombre: formData.nombre.toUpperCase(),
        licencia: formData.licencia.toUpperCase(),
      };

      const { error } = editingId
        ? await supabase.from("choferes").update(payload).eq("id", editingId)
        : await supabase.from("choferes").insert([payload]);

      if (error) throw error;
      setIsModalOpen(false);
      fetchData();
      toast.success("Legajo guardado correctamente");
    } catch (err: any) {
      toast.error("Error al guardar legajo: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChofer = async (id: string, nombre: string) => {
    toast(`¿Eliminar el legajo de ${nombre}?`, {
      action: { label: 'Eliminar', onClick: async () => {
        setIsSubmitting(true);
        const { error } = await supabase.from("choferes").delete().eq("id", id);
        if (error) {
          if (error.code === "23503") {
            toast.error(`El chofer ${nombre} tiene historial de viajes. Cambiá su estado a "Inactivo" en lugar de eliminarlo.`, { duration: 6000 });
          } else {
            toast.error("Error al eliminar: " + error.message);
          }
        } else {
          toast.success("Chofer eliminado");
          await fetchData();
        }
        setIsSubmitting(false);
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };

  // 🚀 NUEVO: FUNCIÓN PARA ANULAR UN PAGO O ADELANTO EN LA CUENTA CORRIENTE
  const handleDeleteMovimientoChofer = async (idMovimiento: string) => {
    toast('¿Seguro querés anular este pago/movimiento? El saldo del chofer se recalculará al instante.', {
      action: { label: 'Anular', onClick: async () => {
        setIsSubmitting(true);
        try {
          const { error } = await supabase
            .from("cuenta_corriente_choferes")
            .delete()
            .eq("id", idMovimiento);
          if (error) throw error;
          toast.success("Pago anulado exitosamente");
          await fetchData();
        } catch (error: any) {
          toast.error("Error al anular el pago: " + error.message);
        } finally {
          setIsSubmitting(false);
        }
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };

  // --- PRE-COMPUTE maps O(n) para evitar O(n²) en render ---
  const camionByOperador = useMemo(() =>
    new Map(camiones.map((c: any) => [c.operador_id, c])),
    [camiones]
  );
  const deudaByChofer = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deudasChoferes) {
      map.set(d.chofer_id, (map.get(d.chofer_id) || 0) + Number(d.monto));
    }
    return map;
  }, [deudasChoferes]);
  const kmsByChofer = useMemo(() => {
    const map = new Map<string, { kms: number; count: number }>();
    for (const v of todosLosViajes) {
      const prev = map.get(v.chofer_id) || { kms: 0, count: 0 };
      map.set(v.chofer_id, { kms: prev.kms + (Number(v.km_recorridos) || 0), count: prev.count + 1 });
    }
    return map;
  }, [todosLosViajes]);

  // --- FILTRADO ---
  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    return choferes.filter((ch) => {
      const matchSearch = ch.nombre.toLowerCase().includes(term) || ch.dni?.includes(term);
      let matchEstado = true;
      const est = (ch.estado || "Disponible").toLowerCase();

      if (filterEstado === "ACTIVOS") {
        matchEstado = est.includes("disponible") || est.includes("viaje");
      } else if (filterEstado === "NO_DISPONIBLES") {
        matchEstado = est.includes("franco") || est.includes("licencia");
      } else if (filterEstado === "INACTIVOS") {
        matchEstado = est.includes("inactivo") || est.includes("desvinculado");
      }

      return matchSearch && matchEstado;
    });
  }, [choferes, search, filterEstado]);

  if (!mounted || loading)
    return (
      <div className="min-h-screen bg-[#141c28] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 w-16 h-16 mb-4" strokeWidth={1} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">
          Sincronizando Staff...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#141c28] text-slate-200 pb-24 pt-20 sm:pt-28 md:pt-32 relative font-sans italic selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent)] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 space-y-8 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 xl:gap-10">
          <div className="space-y-6 flex-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              STAFF <span className="text-indigo-600 font-thin">/</span>{" "}
              <br className="hidden md:block" /> OPERADORES
            </h1>

            <div className="flex flex-wrap gap-4 pt-4">
              
              <div className="bg-[#141c28]/60 border border-white/5 px-6 py-4 rounded-[2rem] backdrop-blur-md w-full sm:w-auto group hover:border-white/20 transition-all">
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${
                  globalStats.esAFavorEmpresa ? 'text-emerald-400' :
                  globalStats.esDeudaEmpresa ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {globalStats.esAFavorEmpresa ? <TrendingUp size={12} /> : globalStats.esDeudaEmpresa ? <TrendingDown size={12} /> : <CreditCard size={12} />} 
                  {globalStats.esAFavorEmpresa ? 'Adelantos a Favor' : globalStats.esDeudaEmpresa ? 'Sueldos Pendientes' : 'Cuentas Al Día'}
                </p>
                <p className={`text-2xl font-black italic tracking-tighter ${globalStats.estaAlDia ? 'text-slate-500' : 'text-white'}`}>
                  $ {globalStats.balanceAbsoluto.toLocaleString('es-AR')}
                </p>
              </div>

              <HeaderStat label="Legajos Activos" val={choferes.length} color="text-indigo-400" icon={UserCheck} />
              <HeaderStat label="Licencias Próx. Vencer" val={globalStats.vencimientosProximos} color="text-amber-500" icon={ShieldAlert} highlight={globalStats.vencimientosProximos > 0} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={20} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="BUSCAR OPERADOR..." className="w-full bg-[#141c28]/80 border border-white/10 rounded-3xl py-5 pl-16 text-white font-black outline-none focus:border-indigo-500/40 uppercase transition-all" />
            </div>
            <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 active:scale-95">
              <Plus size={20} strokeWidth={3} /> Alta Legajo
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 pb-4">
          <StatusFilterBtn active={filterEstado === "ACTIVOS"} onClick={() => setFilterEstado("ACTIVOS")} label="Operativos" color="text-emerald-400" border="border-emerald-500/30" bg="bg-emerald-500/10" />
          <StatusFilterBtn active={filterEstado === "NO_DISPONIBLES"} onClick={() => setFilterEstado("NO_DISPONIBLES")} label="Franco / Licencia" color="text-amber-400" border="border-amber-500/30" bg="bg-amber-500/10" />
          <StatusFilterBtn active={filterEstado === "INACTIVOS"} onClick={() => setFilterEstado("INACTIVOS")} label="Inactivos / Bajas" color="text-rose-400" border="border-rose-500/30" bg="bg-rose-500/10" />
          <div className="w-[1px] bg-white/10 mx-2" />
          <StatusFilterBtn active={filterEstado === "TODOS"} onClick={() => setFilterEstado("TODOS")} label="Ver Todos" color="text-slate-300" border="border-white/10" bg="bg-white/5" />
        </div>

        {filteredData.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
            <Filter size={80} className="text-slate-800 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-center">
              Sin resultados en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredData.map((ch) => {
              const camion = camionByOperador.get(ch.id);
              const stats = kmsByChofer.get(ch.id) || { kms: 0, count: 0 };
              const deudaReal = deudaByChofer.get(ch.id) || 0;
              const kms = stats.kms;
              const viajesCh = { length: stats.count }; // solo necesitamos el length

              return (
                <ChoferCard
                  key={ch.id}
                  chofer={ch}
                  camion={camion}
                  totalKm={kms}
                  totalViajes={stats.count}
                  saldoPendiente={deudaReal}
                  onEdit={handleEdit}
                  onDelete={() => handleDeleteChofer(ch.id, ch.nombre)}
                  onViewStats={() => {
                    setSelectedChofer(ch);
                    setIsStatsModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <ChoferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
      />

      <ChoferStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        chofer={selectedChofer}
        viajes={todosLosViajes.filter((v) => v.chofer_id === selectedChofer?.id)}
        deudasPendientes={deudasChoferes.filter(d => d.chofer_id === selectedChofer?.id)}
        todoMovimientos={historialChoferes.filter(d => d.chofer_id === selectedChofer?.id)}
        onRefresh={fetchData}
        onDeleteMovimiento={handleDeleteMovimientoChofer}
      />
    </div>
  );
}

function HeaderStat({ label, val, color, icon: Icon, highlight }: any) {
  return (
    <div className="bg-[#141c28]/60 border border-white/5 px-6 py-4 rounded-[2rem] backdrop-blur-md w-full sm:w-auto group hover:border-white/15 transition-all">
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${color}`}>
        <Icon size={12} /> {label}
      </p>
      <p className="text-2xl font-black text-white italic tracking-tighter">{val}</p>
    </div>
  );
}

function StatusFilterBtn({ active, onClick, label, color, border, bg }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
        active ? `${bg} ${border} ${color}` : "border-transparent text-slate-500 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}