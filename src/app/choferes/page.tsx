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
  UserPlus,
  SearchX,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  const [search, setSearch] = useState("");

  // 🚀 NUEVO ESTADO: Filtro de Choferes
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
      const [ch, ca, vi] = await Promise.all([
        supabase
          .from("choferes")
          .select("*")
          .order("nombre", { ascending: true }),
        supabase.from("camiones").select("id, patente, modelo, operador_id"),
        // 👇 ACÁ ESTABA EL ERROR: AGREGAMOS lts_gasoil 👇
        supabase
          .from("viajes")
          .select("chofer_id, pago_chofer, km_recorridos, lts_gasoil, fecha"),
      ]);

      if (ch.data) setChoferes(ch.data);
      if (ca.data) setCamiones(ca.data);
      if (vi.data) setTodosLosViajes(vi.data);
    } catch (error: any) {
      console.error("❌ Error de radar:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- 📊 KPI DINÁMICOS ---
  const globalStats = useMemo(() => {
    const hoy = new Date();
    return {
      deudaTotal: todosLosViajes.reduce(
        (acc, curr) => acc + (Number(curr.pago_chofer) || 0),
        0,
      ),
      vencimientosProximos: choferes.filter((ch) => {
        if (!ch.vto_licencia) return false;
        const vto = new Date(ch.vto_licencia);
        const diff = (vto.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
        return diff <= 30 && diff > 0;
      }).length,
    };
  }, [todosLosViajes, choferes]);

  // --- HANDLERS ---
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
    } catch (err: any) {
      alert("❌ Error al guardar legajo: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 FUNCIÓN DE BORRADO INTELIGENTE
  const handleDeleteChofer = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el legajo de ${nombre}?`)) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("choferes").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        alert(
          `⛔ NO SE PUEDE ELIMINAR:\n\nEl chofer ${nombre} tiene Viajes asignados en el historial.\n\nSOLUCIÓN:\nSi ya no trabaja en la empresa, dale a Editar y cambiá su estado a "Inactivo / Desvinculado".`,
        );
      } else {
        alert("Error al eliminar: " + error.message);
      }
    } else {
      await fetchData();
    }
    setIsSubmitting(false);
  };

  // 🚀 LÓGICA DE FILTRADO COMBINADO
  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    return choferes.filter((ch) => {
      // 1. Filtro por texto
      const matchSearch =
        ch.nombre.toLowerCase().includes(term) || ch.dni?.includes(term);

      // 2. Filtro por Estado
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
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <Loader2
          className="animate-spin text-indigo-500 w-16 h-16 mb-4"
          strokeWidth={1}
        />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">
          Sincronizando Staff...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 pt-32 relative font-sans italic selection:bg-indigo-500/30">
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent)] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 space-y-8 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-6 flex-1">
            <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              STAFF <span className="text-indigo-600 font-thin">/</span>{" "}
              <br className="hidden md:block" /> OPERADORES
            </h1>

            <div className="flex flex-wrap gap-4 pt-4">
              <HeaderStat
                label="Masa Salarial"
                val={`$${globalStats.deudaTotal.toLocaleString()}`}
                color="text-rose-500"
                icon={CreditCard}
              />
              <HeaderStat
                label="Legajos Activos"
                val={choferes.length}
                color="text-indigo-400"
                icon={UserCheck}
              />
              <HeaderStat
                label="Licencias"
                val={globalStats.vencimientosProximos}
                color="text-amber-500"
                icon={ShieldAlert}
                highlight={globalStats.vencimientosProximos > 0}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 xl:w-96">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400"
                size={20}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BUSCAR OPERADOR..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-3xl py-5 pl-16 text-white font-black outline-none focus:border-indigo-500/40 uppercase transition-all"
              />
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormState);
                setIsModalOpen(true);
              }}
              className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Alta Legajo
            </button>
          </div>
        </header>

        {/* 🚀 BOTONERA DE FILTRO DE ESTADOS */}
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 pb-4">
          <StatusFilterBtn
            active={filterEstado === "ACTIVOS"}
            onClick={() => setFilterEstado("ACTIVOS")}
            label="Operativos"
            color="text-emerald-400"
            border="border-emerald-500/30"
            bg="bg-emerald-500/10"
          />
          <StatusFilterBtn
            active={filterEstado === "NO_DISPONIBLES"}
            onClick={() => setFilterEstado("NO_DISPONIBLES")}
            label="Franco / Licencia"
            color="text-amber-400"
            border="border-amber-500/30"
            bg="bg-amber-500/10"
          />
          <StatusFilterBtn
            active={filterEstado === "INACTIVOS"}
            onClick={() => setFilterEstado("INACTIVOS")}
            label="Inactivos / Bajas"
            color="text-rose-400"
            border="border-rose-500/30"
            bg="bg-rose-500/10"
          />
          <div className="w-[1px] bg-white/10 mx-2" />
          <StatusFilterBtn
            active={filterEstado === "TODOS"}
            onClick={() => setFilterEstado("TODOS")}
            label="Ver Todos"
            color="text-slate-300"
            border="border-white/10"
            bg="bg-white/5"
          />
        </div>

        {filteredData.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
            <Filter size={80} className="text-slate-800 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-center">
              Sin resultados en esta categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filteredData.map((ch) => {
              const camion = camiones.find((c) => c.operador_id === ch.id);
              const viajesCh = todosLosViajes.filter(
                (v) => v.chofer_id === ch.id,
              );
              const saldo = viajesCh.reduce(
                (acc, v) => acc + (Number(v.pago_chofer) || 0),
                0,
              );
              const kms = viajesCh.reduce(
                (acc, v) => acc + (Number(v.km_recorridos) || 0),
                0,
              );

              return (
                <ChoferCard
                  key={ch.id}
                  chofer={ch}
                  camion={camion}
                  totalKm={kms}
                  totalViajes={viajesCh.length}
                  saldoPendiente={saldo}
                  onEdit={handleEdit}
                  onDelete={() => handleDeleteChofer(ch.id, ch.nombre)} // 🚀 Función real conectada
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
        viajes={todosLosViajes.filter(
          (v) => v.chofer_id === selectedChofer?.id,
        )}
        onRefresh={fetchData}
      />
    </div>
  );
}

function HeaderStat({ label, val, color, icon: Icon, highlight }: any) {
  return (
    <div
      className={`bg-slate-950/60 border ${highlight ? "border-amber-500/40 bg-amber-500/5" : "border-white/5"} px-6 py-4 rounded-[2rem] backdrop-blur-md min-w-[180px] group hover:border-white/20 transition-all`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${color}`}
      >
        <Icon size={12} /> {label}
      </p>
      <p className="text-2xl font-black text-white italic tracking-tighter">
        {val}
      </p>
    </div>
  );
}

// 🚀 Componente para los botones de filtro
function StatusFilterBtn({ active, onClick, label, color, border, bg }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
        active
          ? `${bg} ${border} ${color}`
          : "border-transparent text-slate-500 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
