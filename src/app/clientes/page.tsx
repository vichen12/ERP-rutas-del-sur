"use client";
export const dynamic = "force-dynamic";

import { toast } from 'sonner';
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
import { ClienteUbicaciones } from "@/components/clientes/ClienteUbicaciones";
import { ClienteChequesSummary } from "@/components/cheques/ClienteChequesSummary";

// ─── Integración con Caja ─────────────────────────────────────────────────────
import { registrarMovimiento } from "@/lib/cajaService";
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [viewMode, setViewMode] = useState<"general" | "individual" | "ubicaciones">("general");
  const [clientes, setClientes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);

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
  const [chequesCliente, setChequesCliente] = useState<any[]>([]);

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
      const [clientesRes, ccRes, remitosRes] = await Promise.all([
        supabase.from("clientes").select("*").order('razon_social', { ascending: true }),
        supabase.from("cuenta_corriente").select("id, cliente_id, debe, haber, viaje_id, tipo_movimiento, fecha, detalle, estado_gestion, remito"),
        supabase.from('remitos').select('cliente_id').or('numero_remito.is.null,numero_remito.eq.PENDIENTE'),
      ]);

      if (clientesRes.error) throw clientesRes.error;

      // Agrupar cuenta_corriente por cliente
      const ccPorCliente: Record<string, any[]> = {};
      if (ccRes.data) {
        ccRes.data.forEach((m: any) => {
          if (!m.cliente_id) return;
          if (!ccPorCliente[m.cliente_id]) ccPorCliente[m.cliente_id] = [];
          ccPorCliente[m.cliente_id].push(m);
        });
      }

      // Set de clientes con remitos pendientes (sin número asignado)
      const clientesConRemitoPendiente = new Set(
        (remitosRes.data || []).map((r: any) => r.cliente_id)
      );

      const procesados = (clientesRes.data || []).map((c: any) => {
        const historial = ccPorCliente[c.id] || [];
        const saldoTotal = historial.reduce((acc: number, m: any) => acc + (Number(m.debe || 0) - Number(m.haber || 0)), 0);
        const tieneRemitosPendientes = clientesConRemitoPendiente.has(c.id);
        return { ...c, historial, saldo: saldoTotal, alertaRemito: tieneRemitosPendientes };
      });

      setClientes(procesados);
      if (selected) {
        const act = procesados.find((p: any) => p.id === selected.id);
        if (act) setSelected(act);
      }
    } catch (error) { console.error("Error fetching:", error); } finally { setLoading(false); }
  }

  async function fetchHistorialCompleto(clienteId: string) {
    const { data } = await supabase
      .from("cuenta_corriente")
      .select("*, viajes (camiones (patente), choferes (nombre))")
      .eq("cliente_id", clienteId)
      .order("fecha", { ascending: false });
    return data || [];
  }

  async function fetchUbicaciones(clienteId: string) {
    const { data } = await supabase
      .from('destinos_cliente')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('nombre');
    setUbicaciones(data || []);
  }

  async function fetchChequesCliente(clienteId: string) {
    const { data } = await supabase
      .from('cheques_diferidos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'recibido')
      .order('fecha_vencimiento', { ascending: true });
    setChequesCliente(data || []);
  }

  async function handleSelectCliente(cliente: any) {
    setSelected(cliente);
    setViewMode("individual");
    setIsSidebarOpen(false);
    // Cargar historial completo (con viajes) + ubicaciones + cheques en paralelo
    const [historialFull, , ] = await Promise.all([
      fetchHistorialCompleto(cliente.id),
      fetchUbicaciones(cliente.id),
      fetchChequesCliente(cliente.id),
    ]);
    setSelected((prev: any) => prev ? { ...prev, historial: historialFull } : prev);
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
    } catch (err: any) { toast.error("Error: " + err.message); } finally { setIsSaving(false); }
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
    toast(`¿Eliminar a ${selected.razon_social}? Esta acción no se puede deshacer.`, {
      action: { label: 'Eliminar', onClick: async () => {
        const { error } = await supabase.from("clientes").delete().eq("id", selected.id);
        if (error) toast.error("No se puede eliminar el cliente porque tiene historial.");
        else { setSelected(null); setViewMode("general"); fetchClientes(); }
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };

  // ─── GUARDAR MOVIMIENTO CON IMPACTO EN CAJA ──────────────────────────────────
  const handleSaveMovimiento = async (formData: any) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const isCargo = formData.tipo_movimiento === 'cargo';
      const monto = Number(formData.monto);
      const uuid = (v: any) => (v && String(v).trim() !== '' ? v : null);

      const payload: any = {
        cliente_id: selected.id, 
        fecha: formData.fecha, 
        detalle: formData.detalle.toUpperCase(),
        tipo_movimiento: isCargo ? 'Cargo por Flete' : 'Cobro Transferencia',
        debe: isCargo ? monto : 0, 
        haber: isCargo ? 0 : monto,
        remito: formData.remito || null
      };

      let movimientoCtaId: string | null = null;

      if (formData.id) {
        // EDICIÓN — actualizamos cuenta corriente
        const { error } = await supabase.from("cuenta_corriente").update(payload).eq("id", formData.id);
        if (error) throw error;
        movimientoCtaId = formData.id;

        // Actualizamos también el movimiento de caja vinculado si existe
        await supabase
          .from('movimientos_caja')
          .update({ monto, descripcion: payload.detalle, fecha: formData.fecha })
          .eq('referencia_origen_id', formData.id)
          .eq('modulo_origen', 'clientes');

      } else {
        // NUEVO — insertamos en cuenta corriente
        payload.estado_gestion = 'maestro';
        const { data: insertado, error } = await supabase
          .from("cuenta_corriente")
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        movimientoCtaId = insertado?.id || null;

        // ── Impacto en Caja ────────────────────────────────────────────────────
        if (monto > 0 && movimientoCtaId) {
          if (!isCargo) {
            // COBRO: el cliente nos pagó → INGRESO en caja (banco)
            await registrarMovimiento({
              tipo:                 'ingreso',
              categoria:            'cobro_flete',
              descripcion:          `COBRO — ${selected.razon_social}${formData.detalle ? ' | ' + formData.detalle.toUpperCase() : ''}`,
              monto,
              fecha:                formData.fecha,
              tipo_cuenta:          'banco',
              cliente_id:           uuid(selected.id),
              referencia_origen_id: movimientoCtaId,
              modulo_origen:        'clientes',
            });
          } else {
            // CARGO MANUAL: le facturamos algo extra → no es movimiento de caja real todavía
            // Solo se impacta en caja cuando el cliente PAGUE ese cargo.
            // No registramos nada en caja por ahora.
          }
        }
        // ──────────────────────────────────────────────────────────────────────
      }
      
      setIsMovimientoModalOpen(false); 
      setMovimientoAEditar(null);
      fetchClientes();
    } catch (err: any) { toast.error("Error al registrar: " + err.message); } finally { setIsSaving(false); }
  };

  // ─── ELIMINAR MOVIMIENTO CON LIMPIEZA EN CAJA ─────────────────────────────
  const eliminarOperacion = async (id: string) => {
    toast('¿Eliminar este movimiento permanentemente? Afectará los saldos.', {
      action: { label: 'Eliminar', onClick: async () => {
        try {
          // Borramos primero el movimiento de caja vinculado (si existe)
          await supabase
            .from('movimientos_caja')
            .delete()
            .eq('referencia_origen_id', id)
            .eq('modulo_origen', 'clientes');

          // Luego borramos de cuenta corriente
          await supabase.from("cuenta_corriente").delete().eq("id", id);
          fetchClientes();
        } catch (err: any) { toast.error("Error al eliminar: " + err.message); }
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };
  // ──────────────────────────────────────────────────────────────────────────

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
    if (error) toast.error(error.message); else fetchClientes();
  };

  const totalAlertas = clientes.filter(c => c.alertaRemito).length;

  return (
    <div className="flex h-screen bg-[#141c28] text-slate-100 overflow-hidden font-sans italic selection:bg-sky-500/30">
      <ClienteSidebar
        clientes={clientes.filter((c) => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))}
        selectedId={selected?.id}
        onSelect={handleSelectCliente}
        loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onAdd={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="pt-16 md:pt-20 pb-4 text-slate-100">
          <ClienteViewSelector
            viewMode={viewMode}
            setViewMode={setViewMode}
            hasSelected={!!selected}
            totalAlertas={totalAlertas}
            selectedClienteId={selected?.id}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          
          {viewMode === "general" && (
            <div className="animate-in fade-in duration-500 space-y-8 text-right">
              <button onClick={() => { setClientForm(emptyForm); setIsClientModalOpen(true); }} className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 transition-all ml-auto active:scale-95 shadow-xl shadow-sky-900/20 w-full sm:w-auto justify-center sm:justify-start">
                <Plus size={18} /> Nuevo Cliente
              </button>
              <ClientesDashboardGeneral 
                clientes={clientes} 
                onExportAll={() => backupService.downloadResumenGeneral(clientes)} 
                onSelectClient={handleSelectCliente}
              />
            </div>
          )}

          {viewMode === "individual" && selected && (
            <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden">
              <ClienteHeader
                selected={selected} onBackup={() => setIsBackupModalOpen(true)} onEdit={handlePrepareEdit} onDelete={handleDeleteCliente}
                onNuevaOp={() => { setMovimientoAEditar(null); setIsMovimientoModalOpen(true); }}
              />
              <ClienteChequesSummary cheques={chequesCliente} />
              <ClientesLibroMayor
                gestion={gestion} 
                aprobarViaje={aprobarViaje}
                onEditOperacion={(mov: any) => { setMovimientoAEditar(mov); setIsMovimientoModalOpen(true); }} 
                eliminarOperacion={eliminarOperacion}
                onCompletarRemito={(id: string, remitoActual: string) => setRemitoModalConfig({ isOpen: true, opId: id, remitoActual })} 
              />
            </div>
          )}

          {viewMode === "ubicaciones" && selected && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-6">
              <ClienteUbicaciones
                clienteId={selected.id}
                clienteNombre={selected.razon_social}
                tarifaDefault={Number(selected.tarifa_flete || 0)}
                ubicaciones={ubicaciones}
                onRefresh={() => fetchUbicaciones(selected.id)}
              />
            </div>
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
            setRemitoModalConfig({ isOpen: false, opId: null, remitoActual: '' }); 
            fetchClientes();
          } catch(err) { toast.error("Error al guardar remito"); } finally { setIsSaving(false); }
        }} 
        isSaving={isSaving} 
      />
    </div>
  );
}