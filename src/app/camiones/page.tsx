"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  UserCircle,
  Truck,
  Loader2,
  Gauge,
  ShieldAlert,
  Activity,
  Search,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Hash,
  Phone,
  Calendar,
  Info,
  Filter,
  Edit3,
  Trash2,
} from "lucide-react";

import { CamionCard } from "@/components/flota/CamionCard";
import { CamionModal } from "@/components/flota/CamionModal";
import { GastoModal } from "@/components/flota/GastoModal";
import { GastoHistoryModal } from "@/components/flota/GastoHistoryModal";
import { CamionStatsModal } from "@/components/flota/CamionStatsModal";
import { ChoferModal } from "@/components/choferes/ChoferModal"; // 🚀 Importamos el modal de chofer

export default function FlotaPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"camiones" | "choferes">(
    "camiones",
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // 🚀 ESTADO UNIFICADO: Filtro para Camiones y Choferes
  const [filterEstado, setFilterEstado] = useState<
    "TODOS" | "ACTIVOS" | "NO_DISPONIBLES" | "INACTIVOS"
  >("ACTIVOS");

  const [choferes, setChoferes] = useState<any[]>([]);
  const [camiones, setCamiones] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [viajes, setViajes] = useState<any[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChoferModalOpen, setIsChoferModalOpen] = useState(false); // 🚀 Estado Modal Chofer
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCamion, setSelectedCamion] = useState<any>(null);

  const initialFormState = {
    patente: "",
    modelo: "",
    km_actual: "",
    km_ultimo_service: "",
    vto_rto: "",
    vto_senasa: "",
    estado: "Disponible",
    chofer_id: "",
  };

  const initialChoferFormState = {
    nombre: "",
    dni: "",
    telefono: "",
    licencia: "",
    vto_licencia: "",
    estado: "Disponible",
    foto_url: "",
  };

  const [formData, setFormData] = useState<any>(initialFormState);
  const [choferFormData, setChoferFormData] = useState<any>(
    initialChoferFormState,
  );

  const [gastoData, setGastoData] = useState({
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ca, ch, ga, vi] = await Promise.all([
        supabase
          .from("camiones")
          .select("*")
          .order("patente", { ascending: true }),
        supabase
          .from("choferes")
          .select("*")
          .order("nombre", { ascending: true }), // Traemos todo del chofer
        supabase
          .from("gastos_camion")
          .select("*")
          .order("fecha", { ascending: false }),
        supabase
          .from("viajes")
          .select("camion_id, km_recorridos, lts_gasoil, fecha"),
      ]);

      if (ca.error) throw ca.error;

      const camionesMapeados = (ca.data || []).map((camion) => {
        const choferAsignado =
          (ch.data || []).find(
            (c) => c.id === camion.chofer_id || c.id === camion.operador_id,
          ) || null;
        const totalGastosCamion = (ga.data || [])
          .filter((g) => g.camion_id === camion.id)
          .reduce((acc, curr) => acc + Number(curr.monto), 0);

        return {
          ...camion,
          operador: choferAsignado,
          totalGastos: totalGastosCamion,
        };
      });

      setCamiones(camionesMapeados);
      setChoferes(ch.data || []);
      setGastos(ga.data || []);
      setViajes(vi.data || []);
    } catch (err: any) {
      console.error("❌ ERROR CARGA:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveCamion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        patente: (formData.patente || "").toUpperCase().trim(),
        modelo: (formData.modelo || "").toUpperCase().trim(),
        km_actual: Number(formData.km_actual) || 0,
        km_ultimo_service: Number(formData.km_ultimo_service) || 0,
        operador_id: formData.chofer_id || null,
        chofer_id: formData.chofer_id || null,
        estado: formData.estado || "Disponible",
        vto_rto: formData.vto_rto || null,
        vto_senasa: formData.vto_senasa || null,
      };

      const result = editingId
        ? await supabase
            .from("camiones")
            .update(payload)
            .eq("id", editingId)
            .select()
        : await supabase.from("camiones").insert([payload]).select();

      if (result.error) throw result.error;

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert("ERROR: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 GUARDAR CHOFER
  const handleSaveChofer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nombre: choferFormData.nombre.toUpperCase(),
        dni: choferFormData.dni,
        telefono: choferFormData.telefono,
        licencia: choferFormData.licencia.toUpperCase(),
        vto_licencia: choferFormData.vto_licencia,
        estado: choferFormData.estado || "Disponible",
        foto_url: choferFormData.foto_url,
      };

      if (editingId) {
        const { error } = await supabase
          .from("choferes")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("choferes").insert([payload]);
        if (error) throw error;
      }

      setIsChoferModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error al guardar chofer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gastos_camion").insert([
        {
          camion_id: selectedCamion.id,
          descripcion: gastoData.descripcion.toUpperCase(),
          monto: Number(gastoData.monto),
          fecha: gastoData.fecha,
        },
      ]);
      if (error) throw error;
      setIsGastoModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error al cargar gasto: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, patente: string) => {
    if (!confirm(`¿Eliminar la unidad ${patente}?`)) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("camiones").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        alert(
          `⛔ NO SE PUEDE ELIMINAR:\n\nEl camión ${patente} tiene Viajes o Gastos asociados en el historial.\n\nSOLUCIÓN:\nSi ya no lo usás, dale a Editar y cambiá su estado a "Inactivo" o "Vendido" para sacarlo de circulación sin romper la contabilidad.`,
        );
      } else {
        alert("Error al eliminar: " + error.message);
      }
    } else {
      await fetchData();
    }
    setIsSubmitting(false);
  };

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

  // 🚀 LÓGICA DE FILTRADO COMBINADO (Búsqueda + Estado para ambos)
  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (activeTab === "camiones") {
      return camiones.filter((c) => {
        const matchSearch =
          c.patente.toLowerCase().includes(term) ||
          c.operador?.nombre?.toLowerCase().includes(term);

        let matchEstado = true;
        const est = (c.estado || "").toLowerCase();

        if (filterEstado === "ACTIVOS") {
          matchEstado = est.includes("disponible") || est.includes("viaje");
        } else if (filterEstado === "NO_DISPONIBLES") {
          matchEstado = est.includes("taller") || est.includes("reparacion");
        } else if (filterEstado === "INACTIVOS") {
          matchEstado =
            est.includes("inactivo") ||
            est.includes("vendido") ||
            est.includes("baja");
        }

        return matchSearch && matchEstado;
      });
    } else {
      // FILTRO PARA CHOFERES
      return choferes.filter((ch) => {
        const matchSearch = ch.nombre.toLowerCase().includes(term);

        let matchEstado = true;
        const est = (ch.estado || "Disponible").toLowerCase();

        if (filterEstado === "ACTIVOS") {
          matchEstado = est.includes("disponible") || est.includes("viaje");
        } else if (filterEstado === "NO_DISPONIBLES") {
          matchEstado = est.includes("franco") || est.includes("licencia");
        } else if (filterEstado === "INACTIVOS") {
          matchEstado =
            est.includes("inactivo") || est.includes("desvinculado");
        }

        return matchSearch && matchEstado;
      });
    }
  }, [search, activeTab, camiones, choferes, filterEstado]);

  if (!mounted || loading)
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
        <Loader2 className="text-cyan-500 animate-spin mb-4" size={48} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">
          Estabilizando Conexión...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32 font-sans italic selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-24 md:pt-32 space-y-8 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              GESTIÓN <br /> <span className="text-cyan-500 font-thin">/</span>{" "}
              FLOTA
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "camiones"
                    ? "BUSCAR PATENTE..."
                    : "BUSCAR CHOFER..."
                }
                className="w-full bg-slate-950 border border-white/10 rounded-3xl py-5 pl-14 text-white font-bold outline-none focus:border-cyan-500/50 uppercase italic"
              />
            </div>
            <div className="flex bg-slate-900/80 p-1.5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
              <TabBtn
                active={activeTab === "camiones"}
                onClick={() => {
                  setActiveTab("camiones");
                  setFilterEstado("ACTIVOS");
                }}
                label="Camiones"
              />
              <TabBtn
                active={activeTab === "choferes"}
                onClick={() => {
                  setActiveTab("choferes");
                  setFilterEstado("ACTIVOS");
                }}
                label="Choferes"
              />
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                if (activeTab === "camiones") {
                  setFormData(initialFormState);
                  setIsModalOpen(true);
                } else {
                  setChoferFormData(initialChoferFormState);
                  setIsChoferModalOpen(true);
                }
              }}
              className="px-8 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Alta
            </button>
          </div>
        </header>

        {/* 🚀 BOTONERA DE FILTRO DE ESTADOS UNIFICADA */}
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
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
            label={activeTab === "camiones" ? "En Taller" : "Franco / Lic"}
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

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {activeTab === "camiones" ? (
            filteredData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredData.map((c) => (
                  <CamionCard
                    key={c.id}
                    camion={c}
                    chofer={c.operador}
                    totalGastos={c.totalGastos}
                    onEdit={() => {
                      setEditingId(c.id);
                      setFormData({
                        ...initialFormState,
                        ...c,
                        chofer_id: c.chofer_id || c.operador_id || "",
                      });
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDelete(c.id, c.patente)}
                    onAddGasto={() => {
                      setSelectedCamion(c);
                      setGastoData({
                        descripcion: "",
                        monto: "",
                        fecha: new Date().toISOString().split("T")[0],
                      });
                      setIsGastoModalOpen(true);
                    }}
                    onShowHistory={() => {
                      setSelectedCamion(c);
                      setIsHistoryModalOpen(true);
                    }}
                    onShowStats={() => {
                      setSelectedCamion(c);
                      setIsStatsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hay unidades en esta categoría" />
            )
          ) : filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredData.map((ch) => {
                const estado = ch.estado || "Disponible";
                let opacityClass =
                  estado === "Inactivo" || estado === "Inactivo / Desvinculado"
                    ? "opacity-50 grayscale"
                    : "";
                let statusColor =
                  estado === "En Viaje"
                    ? "text-cyan-400 border-cyan-400/20"
                    : estado === "Franco" || estado === "Franco / Licencia"
                      ? "text-amber-400 border-amber-400/20"
                      : estado === "Inactivo" ||
                          estado === "Inactivo / Desvinculado"
                        ? "text-rose-400 border-rose-400/20"
                        : "text-emerald-400 border-emerald-400/20";

                return (
                  <div
                    key={ch.id}
                    className={`p-8 bg-slate-950/40 rounded-[2.5rem] border border-white/5 backdrop-blur-xl group hover:border-indigo-500/30 transition-all shadow-2xl relative overflow-hidden flex flex-col justify-between ${opacityClass}`}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                      {ch.foto_url ? (
                        <img
                          src={ch.foto_url}
                          className="w-32 h-32 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle size={120} />
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none max-w-[70%]">
                          {ch.nombre}
                        </h3>
                        {ch.foto_url && (
                          <img
                            src={ch.foto_url}
                            className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                          />
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${statusColor}`}
                      >
                        {estado}
                      </span>
                    </div>

                    <div className="space-y-3 pt-6 mt-6 border-t border-white/5 relative z-10">
                      <ChoferInfoRow
                        icon={Hash}
                        label="DNI"
                        val={ch.dni || "S/D"}
                      />
                      <ChoferInfoRow
                        icon={ShieldAlert}
                        label="Licencia"
                        val={
                          ch.vto_licencia
                            ? new Date(ch.vto_licencia).toLocaleDateString(
                                "es-AR",
                                { timeZone: "UTC" },
                              )
                            : "---"
                        }
                      />
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex gap-2 relative z-10">
                      <button
                        onClick={() => {
                          setEditingId(ch.id);
                          setChoferFormData({
                            ...initialChoferFormState,
                            ...ch,
                          });
                          setIsChoferModalOpen(true);
                        }}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl flex justify-center items-center transition-all border border-white/5"
                        title="Editar Legajo"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteChofer(ch.id, ch.nombre)}
                        className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex justify-center items-center transition-all border border-rose-500/20"
                        title="Eliminar Legajo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No hay choferes en esta categoría" />
          )}
        </main>
      </div>

      {/* MODALES CAMIONES */}
      <CamionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCamion}
        isSubmitting={isSubmitting}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        choferes={choferes}
      />

      <GastoModal
        isOpen={isGastoModalOpen}
        onClose={() => setIsGastoModalOpen(false)}
        onSubmit={handleSubmitGasto}
        formData={gastoData}
        setFormData={setGastoData}
        camionPatente={selectedCamion?.patente}
      />
      <GastoHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        gastos={gastos.filter((g) => g.camion_id === selectedCamion?.id)}
        camionPatente={selectedCamion?.patente}
      />
      <CamionStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        camion={selectedCamion}
        viajes={viajes}
        gastos={gastos}
      />

      {/* MODAL CHOFERES */}
      <ChoferModal
        isOpen={isChoferModalOpen}
        onClose={() => setIsChoferModalOpen(false)}
        onSubmit={handleSaveChofer}
        isSubmitting={isSubmitting}
        editingId={editingId}
        formData={choferFormData}
        setFormData={setChoferFormData}
      />
    </div>
  );
}

function ChoferInfoRow({ icon: Icon, label, val }: any) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
        <Icon size={12} className="text-slate-700" /> {label}
      </p>
      <span className="text-[10px] font-bold text-slate-300 uppercase">
        {val}
      </span>
    </div>
  );
}
function TabBtn({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-10 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase transition-all tracking-widest active:scale-95 ${active ? "bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.3)]" : "text-slate-500 hover:text-slate-300"}`}
    >
      {label}
    </button>
  );
}
function StatusFilterBtn({ active, onClick, label, color, border, bg }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${active ? `${bg} ${border} ${color}` : "border-transparent text-slate-500 hover:bg-white/5"}`}
    >
      {label}
    </button>
  );
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20 backdrop-blur-sm">
      <Filter size={48} className="text-slate-700 mb-4" />
      <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">
        Sin resultados
      </h3>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2">
        {message}
      </p>
    </div>
  );
}
