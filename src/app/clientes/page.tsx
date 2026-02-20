"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { backupService } from "@/lib/backupService";
import { Plus, Loader2 } from "lucide-react";

// Componentes modulares
import { ClienteSidebar } from "@/components/ClienteSidebar";
import { ClienteHeader } from "@/components/ClienteHeader";
import { ClientesLibroMayor } from "@/components/ClientesLibroMayor";
import { ClientesDashboardGeneral } from "@/components/ClientesDashboardGeneral";
import { ClienteViewSelector } from "@/components/ClienteViewSelector";
import { ClienteModal } from "@/components/ClienteModal";
import { ClienteBackUp } from "@/components/ClienteBackUp";
import { RegistrarMovimientoModal } from "@/components/RegistrarMovimientoModal";
import { CompletarRemitoModal } from "@/components/CompletarRemitoModal";

export default function ClientesPage() {
  const [viewMode, setViewMode] = useState<"general" | "individual">("general");
  const [clientes, setClientes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverBox, setIsOverBox] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  
  const [remitoModalConfig, setRemitoModalConfig] = useState<{isOpen: boolean, opId: string | null}>({
    isOpen: false, 
    opId: null
  });

  const [isSaving, setIsSaving] = useState(false);

  // 🚀 ESTADO INICIAL V2.0 (Campos unificados en la tabla clientes)
  const emptyForm = {
    razon_social: "", 
    cuit: "", 
    nombre_contacto: "", 
    telefono: "", 
    direccion: "",
    ruta_origen: "", 
    ruta_destino: "", 
    ruta_km_estimados: "",
    tarifa_flete: "", 
    pago_chofer: "",
    lts_gasoil_estimado: "", 
    costo_descarga: "",
    desgaste_por_km: "",
  };

  const [clientForm, setClientForm] = useState(emptyForm);
  const supabase = getSupabase();

  useEffect(() => { fetchClientes(); }, []);

  async function fetchClientes() {
    setLoading(true);
    // 🚀 V2.0: Ya no necesitamos unir 'cliente_rutas_config'. Todo viene en 'clientes'
    const { data } = await supabase
      .from("clientes")
      .select("*, cuenta_corriente(*)")
      .order('razon_social', { ascending: true });

    if (data) {
      const procesados = data.map((c: any) => {
        const historial = c.cuenta_corriente || [];
        // Saldo = Suma de Debe (lo que nos deben) - Suma de Haber (lo que ya pagaron)
        const saldoTotal = historial.reduce((acc: number, m: any) => acc + (Number(m.debe || 0) - Number(m.haber || 0)), 0);
        
        return {
          ...c,
          historial,
          saldo: saldoTotal,
        };
      });
      setClientes(procesados);
      if (selected) {
        const act = procesados.find((p) => p.id === selected.id);
        if (act) setSelected(act);
      }
    }
    setLoading(false);
  }

  // --- 🚀 GUARDADO UNIFICADO V2.0 ---
  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        razon_social: clientForm.razon_social.toUpperCase(),
        cuit: clientForm.cuit,
        nombre_contacto: clientForm.nombre_contacto.toUpperCase(),
        telefono: clientForm.telefono,
        direccion: clientForm.direccion.toUpperCase(),
        ruta_origen: clientForm.ruta_origen.toUpperCase(),
        ruta_destino: clientForm.ruta_destino.toUpperCase(),
        ruta_km_estimados: Number(clientForm.ruta_km_estimados) || 0,
        tarifa_flete: Number(clientForm.tarifa_flete) || 0,
        pago_chofer: Number(clientForm.pago_chofer) || 0,
        lts_gasoil_estimado: Number(clientForm.lts_gasoil_estimado) || 0,
        costo_descarga: Number(clientForm.costo_descarga) || 0,
        desgaste_por_km: Number(clientForm.desgaste_por_km) || 0,
      };

      if (isEditModalOpen && selected) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert([payload]);
        if (error) throw error;
      }

      setIsClientModalOpen(false); 
      setIsEditModalOpen(false); 
      fetchClientes();
      alert("✅ Cliente y ADN Logístico sincronizados.");
    } catch (err: any) { 
      alert("❌ Error: " + err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handlePrepareEdit = () => {
    if (!selected) return;
    setClientForm({
      razon_social: selected.razon_social || "",
      cuit: selected.cuit || "",
      nombre_contacto: selected.nombre_contacto || "",
      telefono: selected.telefono || "",
      direccion: selected.direccion || "",
      ruta_origen: selected.ruta_origen || "",
      ruta_destino: selected.ruta_destino || "",
      ruta_km_estimados: selected.ruta_km_estimados?.toString() || "",
      tarifa_flete: selected.tarifa_flete?.toString() || "",
      pago_chofer: selected.pago_chofer?.toString() || "",
      lts_gasoil_estimado: selected.lts_gasoil_estimado?.toString() || "",
      costo_descarga: selected.costo_descarga?.toString() || "",
      desgaste_por_km: selected.desgaste_por_km?.toString() || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCliente = async () => {
    if (!selected) return;
    if (!window.confirm(`⚠️ ¿Eliminar a ${selected.razon_social}? Esta acción no se puede deshacer.`)) return;
    
    const { error } = await supabase.from("clientes").delete().eq("id", selected.id);
    if (error) {
        alert("No se puede eliminar el cliente porque tiene historial de viajes o movimientos. Debería borrar esos registros primero.");
    } else {
        setSelected(null); 
        setViewMode("general"); 
        fetchClientes();
    }
  };

  const handleSaveMovimiento = async (formData: any) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const isCargo = formData.tipo_movimiento === 'cargo';
      const payload = {
        cliente_id: selected.id,
        fecha: formData.fecha,
        detalle: formData.detalle.toUpperCase(),
        tipo_movimiento: isCargo ? 'Cargo por Flete' : 'Cobro Transferencia',
        debe: isCargo ? Number(formData.monto) : 0,
        haber: isCargo ? 0 : Number(formData.monto),
      };

      const { error } = await supabase.from("cuenta_corriente").insert([payload]);
      if (error) throw error;

      setIsMovimientoModalOpen(false); 
      fetchClientes();
    } catch (err: any) { 
      alert("Error al registrar movimiento: " + err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const moverOperacion = async (id: string, nuevoEstado: string) => {
    // 🚀 Lógica de Kanban Financiero
    const { error } = await supabase
      .from("cuenta_corriente")
      .update({ estado_gestion: nuevoEstado })
      .eq("id", id);
    
    if (error) alert(error.message);
    else fetchClientes();
  };

  const gestion = useMemo(() => {
    if (!selected) return { maestro: [], porCobrar: [], cobrados: [], saldoPendiente: 0 };
    
    const hist = [...(selected?.historial || [])].sort((a: any, b: any) => 
      new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime()
    );

    return {
      maestro: hist.filter((m: any) => m.estado_gestion === "maestro" || !m.estado_gestion),
      porCobrar: hist.filter((m: any) => m.estado_gestion === "por_cobrar"),
      cobrados: hist.filter((m: any) => m.estado_gestion === "cobrado"),
      saldoPendiente: hist.filter((m: any) => m.estado_gestion === "por_cobrar")
                          .reduce((acc: number, m: any) => acc + (Number(m.debe || 0) - Number(m.haber || 0)), 0),
    };
  }, [selected]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans italic selection:bg-sky-500/30">
      
      <ClienteSidebar
        clientes={clientes.filter((c) => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))}
        selectedId={selected?.id}
        onSelect={(c: any) => { setSelected(c); setViewMode("individual"); setIsSidebarOpen(false); }}
        loading={loading}
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        onAdd={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }}
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="pt-24 pb-4 text-slate-100">
          <ClienteViewSelector viewMode={viewMode} setViewMode={setViewMode} hasSelected={!!selected} />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-32">
          {viewMode === "general" ? (
            <div className="animate-in fade-in duration-500 space-y-8 text-right">
              <button 
                onClick={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }} 
                className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 transition-all ml-auto active:scale-95 shadow-xl shadow-sky-900/20"
              >
                <Plus size={18} /> Nuevo Cliente
              </button>
              
              <ClientesDashboardGeneral 
                clientes={clientes} 
                onExportAll={() => backupService.downloadResumenGeneral(clientes)} 
                onSelectClient={(c: any) => { setSelected(c); setViewMode("individual"); }} 
              />
            </div>
          ) : (
            selected && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ClienteHeader
                  selected={selected}
                  onBackup={() => setIsBackupModalOpen(true)}
                  onEdit={handlePrepareEdit}
                  onNuevaOp={() => setIsMovimientoModalOpen(true)}
                  onDelete={handleDeleteCliente}
                />
                
                <ClientesLibroMayor
                  gestion={gestion}
                  isOverBox={isOverBox} 
                  setIsOverBox={setIsOverBox}
                  onDragStart={(e: any, id: string) => { e.dataTransfer.setData("opId", id); }}
                  onDragEnd={() => { setIsOverBox(null); }}
                  onDrop={(e: any, n: string) => { e.preventDefault(); const id = e.dataTransfer.getData("opId"); moverOperacion(id, n); }}
                  moverOperacion={moverOperacion}
                  eliminarOperacion={async (id: any) => { 
                    if (confirm("¿Eliminar este movimiento permanentemente?")) {
                        await supabase.from("cuenta_corriente").delete().eq("id", id);
                        fetchClientes();
                    }
                  }}
                  onCompletarRemito={(id: string) => setRemitoModalConfig({ isOpen: true, opId: id })} 
                />
              </div>
            )
          )}
        </div>
      </main>

      {/* MODALES TÁCTICOS */}
      <ClienteModal 
        isOpen={isClientModalOpen || isEditModalOpen} 
        onClose={() => { setIsClientModalOpen(false); setIsEditModalOpen(false); }} 
        formData={clientForm} 
        setFormData={setClientForm} 
        onSubmit={handleSaveCliente} 
        isSubmitting={isSaving} 
      />

      <RegistrarMovimientoModal 
        isOpen={isMovimientoModalOpen} 
        onClose={() => setIsMovimientoModalOpen(false)} 
        onSubmit={handleSaveMovimiento} 
        isSaving={isSaving} 
        clienteNombre={selected?.razon_social} 
      />

      <CompletarRemitoModal 
        isOpen={remitoModalConfig.isOpen} 
        onClose={() => setRemitoModalConfig({ isOpen: false, opId: null })} 
        onSubmit={async (num: string) => {
          if (!remitoModalConfig.opId) return;
          setIsSaving(true);
          await supabase.from("cuenta_corriente").update({ remito: num.toUpperCase() }).eq("id", remitoModalConfig.opId);
          setRemitoModalConfig({ isOpen: false, opId: null }); 
          fetchClientes();
          setIsSaving(false);
        }} 
        isSaving={isSaving} 
      />

      <ClienteBackUp 
        isOpen={isBackupModalOpen} 
        onClose={() => setIsBackupModalOpen(false)} 
        clienteNombre={selected?.razon_social} 
        onDownloadPDF={() => backupService.downloadPDF(selected, gestion)} 
      />
    </div>
  );
}