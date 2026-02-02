import { getSupabase } from '@/lib/supabase'

export const backupService = {
  async enviarBackupMensual(clientes: any[]) {
    const supabase = getSupabase();
    
    // Deuda Total Acumulada de la empresa
    const deudaTotalGeneral = clientes.reduce((acc, c) => acc + c.saldo, 0);

    const reporte = {
      empresa: "Rutas del Sur - Gestión Logística",
      destinatario: "rutasdelsurmza@gmail.com",
      fecha_generacion: new Date().toLocaleDateString('es-AR'),
      resumen: {
        total_clientes: clientes.length,
        deuda_total_acumulada: deudaTotalGeneral,
      },
      detalle_deudores: clientes
        .filter(c => c.saldo !== 0)
        .map(c => ({
          cliente: c.razon_social,
          cuit: c.cuit,
          deuda_actual: c.saldo,
          remitos_pendientes: c.historial
            .filter((m: any) => m.debe > 0)
            .map((m: any) => `${m.fecha}: ${m.descripcion} (Ref: ${m.nro_comprobante || 'S/N'})`)
        }))
    };

    // Invocación a la Edge Function de Supabase
    const { data, error } = await supabase.functions.invoke('enviar-backup-mail', {
      body: reporte
    });

    if (error) throw error;
    return data;
  }
};