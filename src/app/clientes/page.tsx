"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { backupService } from "@/lib/backupService";
import { Plus, Loader2, Bell } from "lucide-react";

import { ClienteSidebar } from "@/components/clientes/ClienteSidebar";
import { ClienteHeader } from "@/components/clientes/ClienteHeader";
import { ClientesLibroMayor } from "@/components/clientes/ClientesLibroMayor";
import { ClientesDashboardGeneral } from "@/components/clientes/ClientesDashboardGeneral";
import { ClienteViewSelector } from "@/components/clientes/ClienteViewSelector";
import { ClienteModal } from "@/components/clientes/ClienteModal";
import { ClienteBackUp } from "@/components/clientes/ClienteBackUp";
import { RegistrarMovimientoModal } from "@/components/clientes/RegistrarMovimientoModal";
import { CompletarRemitoModal } from "@/components/clientes/CompletarRemitoModal";

export default function ClientesPage() {
  const [viewMode, setViewMode] = useState<"general" | "individual">("general");
  const [clientes, setClientes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [movimientoAEditar, setMovimientoAEditar] = useState<any>(null); 
  
  const [remitoModalConfig, setRemitoModalConfig] = useState<{isOpen: boolean, opId: string | null, remitoActual: string}>({
    isOpen: false, opId: null, remitoActual: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const emptyForm = {
    razon_social: "", cuit: "", nombre_contacto: "", telefono: "", direccion: "",
    ruta_origen: "", ruta_destino: "", ruta_km_estimados: "", tarifa_flete: "", 
    pago_chofer: "", lts_gasoil_estimado: "", costo_descarga: "", desgaste_por_km: "",
  };

  const [clientForm, setClientForm] = useState(emptyForm);

  useEffect(() => { fetchClientes(); }, []);

  async function fetchClientes() {
    setLoading(true);
    try {
      const { data: clientesData, error: errClientes } = await supabase
        .from("clientes")
        .select(`*, cuenta_corriente (*, viajes (camiones (patente), choferes (nombre)))`)
        .order('razon_social', { ascending: true });

      if (errClientes) throw errClientes;

      // 🚀 CAMBIO 1: Buscamos remitos con numero_remito = 'PENDIENTE'
      const { data: remitosData, error: errRemitos } = await supabase
        .from('remitos')
        .select('cliente_id, numero_remito')
        .eq('numero_remito', 'PENDIENTE');

      if (errRemitos) throw errRemitos;

      if (clientesData) {
        const procesados = clientesData.map((c: any) => {
          const historial = c.cuenta_corriente || [];
          const saldoTotal = historial.reduce((acc: number, m: any) => acc + (Number(m.debe || 0) - Number(m.haber || 0)), 0);
          
          // 🚀 CAMBIO 1: Detectamos si este cliente tiene remitos pendientes
          const tieneRemitosPendientes = remitosData?.some(r => r.cliente_id === c.id) || false;
          
          return { ...c, historial, saldo: saldoTotal, alertaRemito: tieneRemitosPendientes };
        });
        
        setClientes(procesados);
        if (selected) {
          const act = procesados.find((p: any) => p.id === selected.id);
          if (act) setSelected(act);
        }
      }
    } catch (error) { console.error("Error fetching:", error); } finally { setLoading(false); }
  }

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        razon_social: clientForm.razon_social.toUpperCase(), cuit: clientForm.cuit,
        nombre_contacto: clientForm.nombre_contacto.toUpperCase(), telefono: clientForm.telefono,
        direccion: clientForm.direccion.toUpperCase(), ruta_origen: clientForm.ruta_origen.toUpperCase(),
        ruta_destino: clientForm.ruta_destino.toUpperCase(), ruta_km_estimados: Number(clientForm.ruta_km_estimados) || 0,
        tarifa_flete: Number(clientForm.tarifa_flete) || 0, pago_chofer: Number(clientForm.pago_chofer) || 0,
        lts_gasoil_estimado: Number(clientForm.lts_gasoil_estimado) || 0, costo_descarga: Number(clientForm.costo_descarga) || 0,
        desgaste_por_km: Number(clientForm.desgaste_por_km) || 0,
      };

      if (isEditModalOpen && selected) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert([payload]);
        if (error) throw error;
      }
      setIsClientModalOpen(false); setIsEditModalOpen(false); fetchClientes();
    } catch (err: any) { alert("❌ Error: " + err.message); } finally { setIsSaving(false); }
  };

  const handlePrepareEdit = () => {
    if (!selected) return;
    setClientForm({
      razon_social: selected.razon_social || "", cuit: selected.cuit || "",
      nombre_contacto: selected.nombre_contacto || "", telefono: selected.telefono || "",
      direccion: selected.direccion || "", ruta_origen: selected.ruta_origen || "",
      ruta_destino: selected.ruta_destino || "", ruta_km_estimados: selected.ruta_km_estimados?.toString() || "",
      tarifa_flete: selected.tarifa_flete?.toString() || "", pago_chofer: selected.pago_chofer?.toString() || "",
      lts_gasoil_estimado: selected.lts_gasoil_estimado?.toString() || "", costo_descarga: selected.costo_descarga?.toString() || "",
      desgaste_por_km: selected.desgaste_por_km?.toString() || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCliente = async () => {
    if (!selected) return;
    if (!window.confirm(`⚠️ ¿Eliminar a ${selected.razon_social}? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", selected.id);
    if (error) alert("No se puede eliminar el cliente porque tiene historial.");
    else { setSelected(null); setViewMode("general"); fetchClientes(); }
  };

  const handleSaveMovimiento = async (formData: any) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const isCargo = formData.tipo_movimiento === 'cargo';
      const payload: any = {
        cliente_id: selected.id, 
        fecha: formData.fecha, 
        detalle: formData.detalle.toUpperCase(),
        tipo_movimiento: isCargo ? 'Cargo por Flete' : 'Cobro Transferencia',
        debe: isCargo ? Number(formData.monto) : 0, 
        haber: isCargo ? 0 : Number(formData.monto),
        remito: formData.remito || null
      };

      if (formData.id) {
        const { error } = await supabase.from("cuenta_corriente").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        payload.estado_gestion = 'maestro';
        const { error } = await supabase.from("cuenta_corriente").insert([payload]);
        if (error) throw error;
      }
      
      setIsMovimientoModalOpen(false); 
      setMovimientoAEditar(null);
      fetchClientes();
    } catch (err: any) { alert("Error al registrar: " + err.message); } finally { setIsSaving(false); }
  };

  const gestion = useMemo(() => {
    if (!selected) return { maestro: [], deudaActiva: [], historial: [], pagos: [], saldoPendiente: 0, saldoAFavor: 0 };
    
    const hist = [...(selected?.historial || [])].sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const maestro = hist.filter((m: any) => m.estado_gestion === "maestro" && Number(m.debe) > 0);
    const pagosRaw = hist.filter((m: any) => Number(m.haber) > 0);
    const viajesValidados = hist.filter((m: any) => m.estado_gestion === "por_cobrar" && Number(m.debe) > 0);

    let plataDisponible = pagosRaw.reduce((acc, p) => acc + Number(p.haber), 0);
    const deudaActiva = [];
    const historialLiquidados = [];

    for (const viaje of viajesValidados) {
      const costoViaje = Number(viaje.debe);
      if (plataDisponible >= costoViaje) {
        plataDisponible -= costoViaje;
        historialLiquidados.push({ ...viaje, pagado: costoViaje, falta: 0 });
      } else if (plataDisponible > 0) {
        deudaActiva.push({ ...viaje, pagado: plataDisponible, falta: costoViaje - plataDisponible });
        plataDisponible = 0; 
      } else {
        deudaActiva.push({ ...viaje, pagado: 0, falta: costoViaje });
      }
    }

    const saldoTotal = selected.saldo || 0;

    return {
      maestro,
      pagos: pagosRaw.reverse(), 
      deudaActiva, 
      historial: historialLiquidados.reverse(),
      saldoPendiente: saldoTotal > 0 ? saldoTotal : 0,
      saldoAFavor: saldoTotal < 0 ? Math.abs(saldoTotal) : 0
    };
  }, [selected]);

  const aprobarViaje = async (id: string) => {
    const { error } = await supabase.from("cuenta_corriente").update({ estado_gestion: 'por_cobrar' }).eq("id", id);
    if (error) alert(error.message); else fetchClientes();
  };

  // 🚀 CAMBIO 2: Contador global de alertas para el navbar
  const totalAlertas = clientes.filter(c => c.alertaRemito).length;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans italic selection:bg-sky-500/30">
      <ClienteSidebar
        clientes={clientes.filter((c) => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))}
        selectedId={selected?.id}
        onSelect={(c: any) => { setSelected(c); setViewMode("individual"); setIsSidebarOpen(false); }}
        loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onAdd={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="pt-24 pb-4 text-slate-100">
          {/* 🚀 CAMBIO 2: Pasamos totalAlertas al ViewSelector */}
          <ClienteViewSelector 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            hasSelected={!!selected}
            totalAlertas={totalAlertas}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-32">
          {viewMode === "general" ? (
            <div className="animate-in fade-in duration-500 space-y-8 text-right">
              <button onClick={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }} className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 transition-all ml-auto active:scale-95 shadow-xl shadow-sky-900/20">
                <Plus size={18} /> Nuevo Cliente
              </button>
              <ClientesDashboardGeneral clientes={clientes} onExportAll={() => backupService.downloadResumenGeneral(clientes)} onSelectClient={(c: any) => { setSelected(c); setViewMode("individual"); }} />
            </div>
          ) : (
            selected && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ClienteHeader 
                  selected={selected} onBackup={() => setIsBackupModalOpen(true)} onEdit={handlePrepareEdit} onDelete={handleDeleteCliente} 
                  onNuevaOp={() => { setMovimientoAEditar(null); setIsMovimientoModalOpen(true); }} 
                />
                
                <ClientesLibroMayor
                  gestion={gestion} 
                  aprobarViaje={aprobarViaje}
                  onEditOperacion={(mov: any) => { setMovimientoAEditar(mov); setIsMovimientoModalOpen(true); }} 
                  eliminarOperacion={async (id: any) => { 
                    if (confirm("¿Eliminar este movimiento permanentemente? Afectará los saldos.")) { await supabase.from("cuenta_corriente").delete().eq("id", id); fetchClientes(); }
                  }}
                  onCompletarRemito={(id: string, remitoActual: string) => setRemitoModalConfig({ isOpen: true, opId: id, remitoActual })} 
                />
              </div>
            )
          )}
        </div>
      </main>

      <ClienteModal isOpen={isClientModalOpen || isEditModalOpen} onClose={() => { setIsClientModalOpen(false); setIsEditModalOpen(false); }} formData={clientForm} setFormData={setClientForm} onSubmit={handleSaveCliente} isSubmitting={isSaving} />
      
      <RegistrarMovimientoModal 
        isOpen={isMovimientoModalOpen} 
        onClose={() => setIsMovimientoModalOpen(false)} 
        onSubmit={handleSaveMovimiento} 
        isSaving={isSaving} 
        clienteNombre={selected?.razon_social} 
        initialData={movimientoAEditar} 
      />

      <ClienteBackUp isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} clienteNombre={selected?.razon_social} onDownloadPDF={() => backupService.downloadPDF(selected, gestion)} />

      <CompletarRemitoModal 
        isOpen={remitoModalConfig.isOpen} 
        initialRemito={remitoModalConfig.remitoActual}
        onClose={() => setRemitoModalConfig({ isOpen: false, opId: null, remitoActual: '' })} 
        onSubmit={async (num: string, fotoBase64: string | null) => {
          if (!remitoModalConfig.opId) return;
          setIsSaving(true);
          try {
            const operacion = selected?.historial.find((h: any) => h.id === remitoModalConfig.opId);
            await supabase.from("cuenta_corriente").update({ remito: num.toUpperCase() }).eq("id", remitoModalConfig.opId);
            if (operacion && operacion.viaje_id) {
              const payloadRemito: any = { numero_remito: num.toUpperCase() };
              if (fotoBase64) payloadRemito.foto_url = fotoBase64;
              await supabase.from("remitos").update(payloadRemito).eq("viaje_id", operacion.viaje_id);
            }
            setRemitoModalConfig({ isOpen: false, opId: null, remitoActual: '' }); 
            fetchClientes();
          } catch(err) { alert("Error al guardar remito"); } finally { setIsSaving(false); }
        }} 
        isSaving={isSaving} 
      />
    </div>
  );
}
