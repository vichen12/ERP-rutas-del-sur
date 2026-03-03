import { NextResponse } from 'next/server';
import Afip from '@afipsdk/afip.js';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase del lado del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Es ideal usar el SERVICE_ROLE_KEY en el backend para saltarse el RLS si la tabla está bloqueada
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
      return NextResponse.json({ success: false, error: 'No se encontró configuración en la base de datos.' }, { status: 400 });
    }

    if (!config.arca_certificado || !config.arca_clave_privada) {
      return NextResponse.json({ success: false, error: 'Falta subir el certificado (.crt) o la clave privada (.key).' }, { status: 400 });
    }

    // 2. Instanciamos el SDK de AFIP con los datos de la DB
    const afip = new Afip({
      CUIT: parseInt(config.arca_cuit),
      cert: config.arca_certificado,
      key: config.arca_clave_privada,
      production: config.arca_entorno === 'produccion',
    });

    // 3. Verificamos que el servidor WSFE de AFIP esté online
    const serverStatus = await afip.ElectronicBilling.getServerStatus();

    // 4. PRUEBA DE FUEGO: Intentamos generar un Ticket de Acceso (TA)
    // Esto es lo que realmente valida si tu archivo .crt y .key hacen "match" y están autorizados.
    // Si el certificado es viejo, de otra empresa, o está mal copiado, esta línea explota y va al catch.
    await afip.CreateTA('wsfe');

    // Si llegó hasta acá, los certificados son 100% válidos y AFIP los acepta.
    return NextResponse.json({ 
      success: true, 
      message: 'Conexión verificada correctamente',
      status: serverStatus 
    });

  } catch (error: any) {
    console.error("Error Ping AFIP:", error);
    
    // Formateamos el error para que sea legible en el frontend
    let errorMessage = 'Error desconocido al conectar con AFIP.';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}