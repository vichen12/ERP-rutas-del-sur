"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { CamionCard } from "@/components/CamionCard";
import { CamionModal } from "@/components/CamionModal";
import { GastoModal } from "@/components/GastoModal";
import { GastoHistoryModal } from "@/components/GastoHistoryModal";

export default function FlotaPage() {
  const [loading, setLoading] = useState(true);
  const [camiones, setCamiones] = useState<any[]>([]);
  const [choferes, setChoferes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCamion, setSelectedCamion] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patente: "",
    modelo: "",
    km_actual: "",
    ultimo_cambio_aceite: "",
    vencimiento_rto: "",
    chofer_id: "",
  });

  const [gastoData, setGastoData] = useState({
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const supabase = getSupabase();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [ca, ch, ga] = await Promise.all([
      supabase
        .from("camiones")
        .select("*")
        .order("patente", { ascending: true }),
      supabase.from("choferes").select("id, nombre"),
      supabase
        .from("gastos_camion")
        .select("*")
        .order("fecha", { ascending: false }),
    ]);
    if (ca.data) setCamiones(ca.data);
    if (ch.data) setChoferes(ch.data);
    if (ga.data) setGastos(ga.data);
    setLoading(false);
  }

  const handleDelete = async (id: string, patente: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el camión ${patente}? Se borrarán también todos sus viajes y gastos asociados.`,
      )
    )
      return;

    setIsSubmitting(true);
    const { error } = await supabase.from("camiones").delete().eq("id", id);

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      await fetchData();
    }
    setIsSubmitting(false);
  };

  // --- RESTO DE FUNCIONES (Edit, Create, Submit Gasto) IGUAL QUE TENÍAS ---
  const handleEdit = (camion: any) => {
    setFormData({
      patente: camion.patente,
      modelo: camion.modelo || "",
      km_actual: camion.km_actual || "",
      ultimo_cambio_aceite: camion.ultimo_cambio_aceite || "",
      vencimiento_rto: camion.vencimiento_rto || "",
      chofer_id: camion.chofer_id || "",
    });
    setEditingId(camion.id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      patente: "",
      modelo: "",
      km_actual: "",
      ultimo_cambio_aceite: "",
      vencimiento_rto: "",
      chofer_id: "",
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        patente: formData.patente.toUpperCase(),
        modelo: formData.modelo.toUpperCase(),
        km_actual: Number(formData.km_actual),
        ultimo_cambio_aceite: Number(formData.ultimo_cambio_aceite),
        vencimiento_rto: formData.vencimiento_rto || null,
        chofer_id: formData.chofer_id || null,
      };
      if (editingId) {
        await supabase.from("camiones").update(payload).eq("id", editingId);
      } else {
        await supabase.from("camiones").insert([payload]);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGasto = (camion: any) => {
    setSelectedCamion(camion);
    setGastoData({
      descripcion: "",
      monto: "",
      fecha: new Date().toISOString().split("T")[0],
    });
    setIsGastoModalOpen(true);
  };

  const handleOpenHistory = (camion: any) => {
    setSelectedCamion(camion);
    setIsHistoryModalOpen(true);
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

  const filtered = camiones.filter((c) =>
    c.patente.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 relative font-sans italic">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 space-y-12 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              GESTIÓN <br /> <span className="text-cyan-500 font-thin">/</span>{" "}
              FLOTA
            </h1>
          </div>
          <div className="flex gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BUSCAR PATENTE..."
                className="w-full bg-slate-950 border border-white/10 rounded-3xl py-5 pl-14 text-white font-bold outline-none focus:border-cyan-500/50 uppercase italic"
              />
            </div>
            <button
              onClick={handleCreate}
              className="px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={3} /> Alta
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((c) => (
            <CamionCard
              key={c.id}
              camion={c}
              chofer={choferes.find((ch) => ch.id === c.chofer_id)}
              totalGastos={gastos
                .filter((g) => g.camion_id === c.id)
                .reduce((acc, curr) => acc + Number(curr.monto), 0)}
              onEdit={handleEdit}
              onDelete={() => handleDelete(c.id, c.patente)}
              onAddGasto={handleOpenGasto}
              onShowHistory={handleOpenHistory}
            />
          ))}
        </div>

        {/* --- MODALES --- */}
        <CamionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
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
      </div>
    </div>
  );
}
