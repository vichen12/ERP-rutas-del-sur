import { NextResponse } from 'next/server';
import Afip from '@afipsdk/afip.js';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase del lado del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Buscamos la configuración en la base de datos
    const { data: config, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !config) {
      return NextResponse.json({ success: false, error: 'No se encontró configuración.' }, { status: 400 });
    }

    if (!config.arca_certificado || !config.arca_clave_privada) {
      return NextResponse.json({ success: false, error: 'Faltan certificados.' }, { status: 400 });
    }

    // 2. Instanciamos el SDK de AFIP
    // Usamos "as any" para evitar errores de campos faltantes en el constructor
    const afip = new Afip({
      CUIT: parseInt(config.arca_cuit),
      cert: config.arca_certificado,
      key: config.arca_clave_privada,
      production: config.arca_entorno === 'produccion',
      access_token: "" 
    } as any);

    // 3. Verificamos que el servidor WSFE de AFIP esté online
    const serverStatus = await afip.ElectronicBilling.getServerStatus();

    // 4. PRUEBA DE FUEGO: Forzamos la generación del Ticket de Acceso (TA)
    // 🚀 EL FIX: Convertimos afip a "any" antes de llamar al método para que TS no lo bloquee
    await (afip as any).CreateTA('wsfe');

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión verificada correctamente',
      status: serverStatus 
    });

  } catch (error: any) {
    console.error("Error Ping AFIP:", error);
    
    let errorMessage = 'Error de conexión con AFIP.';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}