import { getSupabase } from '@/lib/supabase'

export const backupService = {
  async enviarBackupMensual(clientes: any[]) {
    const supabase = getSupabase();
    
    // 1. Calculamos la deuda total
    const deudaTotalGeneral = clientes.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);

    // 2. Preparamos el cuerpo para la Edge Function
    const cuerpoReporte = {
      resumen: {
        total_clientes: clientes.length,
        deuda_total_acumulada: deudaTotalGeneral,
      },
      detalle_deudores: clientes
        .filter(c => Number(c.saldo) > 0)
        .map(c => ({
          cliente: c.razon_social,
          deuda_actual: c.saldo,
          remitos_pendientes: [] 
        })),
      fecha_generacion: new Date().toLocaleDateString('es-AR'),
    };

    // 3. Llamada a la función en Supabase
    const { data, error } = await supabase.functions.invoke('enviar-backup-mail', {
      body: cuerpoReporte,
    });

    if (error) throw error;
    return data;
  }
};