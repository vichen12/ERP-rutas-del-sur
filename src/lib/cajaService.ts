// src/lib/cajaService.ts
// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO CENTRAL DE CAJA — Rutas del Sur ERP
//
// TODOS los módulos que mueven plata deben usar esta función.
// Nunca insertar en movimientos_caja directamente desde un componente.
//
// Uso:
//   import { registrarMovimiento } from '@/lib/cajaService'
//
//   await registrarMovimiento({
//     tipo:       'egreso',
//     categoria:  'mantenimiento',
//     descripcion:'SERVICE 10.000 KM — CAMION ABC123',
//     monto:      45000,
//     camion_id:  '...',
//     referencia_origen_id: mantenimientoId,
//   })
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export type CategoriaCaja =
  // INGRESOS
  | 'cobro_flete'           // Cobro de un viaje/flete
  | 'cobro_parcial'         // Pago parcial de un cliente
  | 'ingreso_otro'          // Ingreso manual sin categoría específica

  // EGRESOS — Operación
  | 'pago_chofer'           // Liquidación / viático de chofer
  | 'combustible'           // Gasoil, nafta (YPF u otro)
  | 'combustible_ypf'       // Específico YPF Ruta (tarjeta)
  | 'mantenimiento'         // Service, reparación, repuestos
  | 'neumaticos'            // Cubiertas, recapado
  | 'lavado'                // Lavado del camión

  // EGRESOS — Administrativos
  | 'compra'                // Compra general (insumos, repuestos, etc.)
  | 'multa'                 // Multa de tránsito u otro organismo
  | 'seguro'                // Prima de seguro
  | 'impuesto'              // Impuesto (ingresos brutos, sellos, etc.)
  | 'peaje'                 // Peajes

  // EGRESOS — Financieros
  | 'cuota_leasing'         // Cuota de leasing de unidad
  | 'cuota_prestamo'        // Cuota de préstamo
  | 'tarjeta_credito'       // Pago de tarjeta de crédito
  | 'transferencia_banco'   // Transferencia entre cuentas propias

  // EGRESOS — Costos fijos
  | 'costo_fijo'            // Alquiler, servicios, etc.
  | 'sueldo_administrativo' // Sueldo personal administrativo

  // OTROS
  | 'siniestro'             // Pago relacionado a un siniestro
  | 'egreso_otro'           // Egreso manual sin categoría específica

export type TipoCuenta = 'caja' | 'banco'

export interface MovimientoCajaInput {
  // Obligatorios
  tipo:        'ingreso' | 'egreso'
  categoria:   CategoriaCaja
  descripcion: string
  monto:       number

  // Opcionales de contexto
  fecha?:                string   // ISO date 'YYYY-MM-DD', default hoy
  tipo_cuenta?:          TipoCuenta  // default 'caja'
  referencia?:           string   // nro de comprobante, factura, etc.

  // Vínculos a otras entidades
  cliente_id?:           string | null
  chofer_id?:            string | null
  camion_id?:            string | null
  referencia_origen_id?: string | null  // ID del registro que generó este movimiento
  modulo_origen?:        string   // 'viajes' | 'compras' | 'mantenimiento' | etc.
}

export interface MovimientoCajaResult {
  ok:    boolean
  id?:   string
  error?: string
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

export async function registrarMovimiento(
  input: MovimientoCajaInput
): Promise<MovimientoCajaResult> {

  if (!input.monto || input.monto <= 0) {
    return { ok: false, error: 'El monto debe ser mayor a 0' }
  }
  if (!input.descripcion?.trim()) {
    return { ok: false, error: 'La descripción es requerida' }
  }

  const fecha = input.fecha ?? new Date().toISOString().split('T')[0]

  const payload = {
    fecha,
    tipo:                  input.tipo,
    tipo_cuenta:           input.tipo_cuenta ?? 'caja',
    categoria:             input.categoria,
    descripcion:           input.descripcion.toUpperCase().trim(),
    monto:                 Number(input.monto),
    referencia:            input.referencia            ?? null,
    cliente_id:            input.cliente_id            ?? null,
    chofer_id:             input.chofer_id             ?? null,
    camion_id:             input.camion_id             ?? null,
    referencia_origen_id:  input.referencia_origen_id  ?? null,
    modulo_origen:         input.modulo_origen         ?? 'manual',
    origen:                'automatico',
  }

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[cajaService] Error registrando movimiento:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: data?.id }
}

// ─── HELPERS POR MÓDULO ───────────────────────────────────────────────────────
// Wrappers con los parámetros pre-configurados para cada caso de uso.
// Así cada módulo solo pasa lo mínimo necesario.

/** Registra el cobro de un flete cuando se aprueba un viaje */
export async function registrarCobroFlete({
  monto,
  clienteNombre,
  cliente_id,
  viajeId,
  fecha,
  tipo_cuenta = 'banco',
}: {
  monto:         number
  clienteNombre: string
  cliente_id?:   string
  viajeId?:      string
  fecha?:        string
  tipo_cuenta?:  TipoCuenta
}) {
  return registrarMovimiento({
    tipo:                 'ingreso',
    categoria:            'cobro_flete',
    descripcion:          `COBRO FLETE — ${clienteNombre}`,
    monto,
    fecha,
    tipo_cuenta,
    cliente_id,
    referencia_origen_id: viajeId,
    modulo_origen:        'viajes',
  })
}

/** Registra el pago a un chofer */
export async function registrarPagoChofer({
  monto,
  choferNombre,
  chofer_id,
  concepto = 'LIQUIDACIÓN',
  fecha,
  referencia_origen_id,
}: {
  monto:                number
  choferNombre:         string
  chofer_id?:           string
  concepto?:            string
  fecha?:               string
  referencia_origen_id?: string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'pago_chofer',
    descripcion:          `${concepto} — ${choferNombre}`,
    monto,
    fecha,
    tipo_cuenta:          'caja',
    chofer_id,
    referencia_origen_id,
    modulo_origen:        'choferes',
  })
}

/** Registra una compra general */
export async function registrarCompra({
  monto,
  descripcion,
  compraId,
  camion_id,
  fecha,
  tipo_cuenta = 'caja',
}: {
  monto:        number
  descripcion:  string
  compraId?:    string
  camion_id?:   string
  fecha?:       string
  tipo_cuenta?: TipoCuenta
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'compra',
    descripcion:          `COMPRA — ${descripcion}`,
    monto,
    fecha,
    tipo_cuenta,
    camion_id,
    referencia_origen_id: compraId,
    modulo_origen:        'compras',
  })
}

/** Registra un gasto de mantenimiento */
export async function registrarMantenimiento({
  monto,
  descripcion,
  camionPatente,
  camion_id,
  mantenimientoId,
  fecha,
}: {
  monto:           number
  descripcion:     string
  camionPatente?:  string
  camion_id?:      string
  mantenimientoId?: string
  fecha?:          string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'mantenimiento',
    descripcion:          `MANTENIMIENTO${camionPatente ? ` — ${camionPatente}` : ''} — ${descripcion}`,
    monto,
    fecha,
    tipo_cuenta:          'caja',
    camion_id,
    referencia_origen_id: mantenimientoId,
    modulo_origen:        'mantenimiento',
  })
}

/** Registra una carga de combustible */
export async function registrarCombustible({
  monto,
  litros,
  camionPatente,
  camion_id,
  esYPF = false,
  fecha,
  referencia_origen_id,
}: {
  monto:                number
  litros?:              number
  camionPatente?:       string
  camion_id?:           string
  esYPF?:               boolean
  fecha?:               string
  referencia_origen_id?: string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            esYPF ? 'combustible_ypf' : 'combustible',
    descripcion:          `COMBUSTIBLE${esYPF ? ' YPF' : ''}${camionPatente ? ` — ${camionPatente}` : ''}${litros ? ` — ${litros} LTS` : ''}`,
    monto,
    fecha,
    tipo_cuenta:          esYPF ? 'banco' : 'caja', // YPF va a cuenta banco por ser tarjeta
    camion_id,
    referencia_origen_id,
    modulo_origen:        'combustible',
  })
}

/** Registra el pago de una multa */
export async function registrarPagoMulta({
  monto,
  descripcion,
  camion_id,
  chofer_id,
  multaId,
  fecha,
}: {
  monto:       number
  descripcion: string
  camion_id?:  string
  chofer_id?:  string
  multaId?:    string
  fecha?:      string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'multa',
    descripcion:          `MULTA — ${descripcion}`,
    monto,
    fecha,
    tipo_cuenta:          'caja',
    camion_id,
    chofer_id,
    referencia_origen_id: multaId,
    modulo_origen:        'multas',
  })
}

/** Registra el pago de un seguro */
export async function registrarPagoSeguro({
  monto,
  aseguradora,
  camion_id,
  seguroId,
  fecha,
}: {
  monto:       number
  aseguradora: string
  camion_id?:  string
  seguroId?:   string
  fecha?:      string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'seguro',
    descripcion:          `SEGURO — ${aseguradora}`,
    monto,
    fecha,
    tipo_cuenta:          'banco',
    camion_id,
    referencia_origen_id: seguroId,
    modulo_origen:        'seguros',
  })
}

/** Registra el pago de un impuesto */
export async function registrarPagoImpuesto({
  monto,
  tipoImpuesto,
  periodo,
  impuestoId,
  fecha,
}: {
  monto:        number
  tipoImpuesto: string
  periodo?:     string
  impuestoId?:  string
  fecha?:       string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'impuesto',
    descripcion:          `IMPUESTO — ${tipoImpuesto}${periodo ? ` — ${periodo}` : ''}`,
    monto,
    fecha,
    tipo_cuenta:          'banco',
    referencia_origen_id: impuestoId,
    modulo_origen:        'impuestos',
  })
}

/** Registra una cuota de leasing */
export async function registrarCuotaLeasing({
  monto,
  camionPatente,
  camion_id,
  cuotaNro,
  leasingId,
  fecha,
}: {
  monto:          number
  camionPatente?: string
  camion_id?:     string
  cuotaNro?:      number
  leasingId?:     string
  fecha?:         string
}) {
  return registrarMovimiento({
    tipo:                 'egreso',
    categoria:            'cuota_leasing',
    descripcion:          `LEASING${camionPatente ? ` — ${camionPatente}` : ''}${cuotaNro ? ` — CUOTA ${cuotaNro}` : ''}`,
    monto,
    fecha,
    tipo_cuenta:          'banco',
    camion_id,
    referencia_origen_id: leasingId,
    modulo_origen:        'finanzas',
  })
}

/** Anula/revierte un movimiento previo (crea el movimiento inverso) */
export async function anularMovimiento(movimientoId: string): Promise<MovimientoCajaResult> {
  // Busca el movimiento original
  const { data: original, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('id', movimientoId)
    .single()

  if (error || !original) {
    return { ok: false, error: 'No se encontró el movimiento a anular' }
  }

  // Crea el movimiento inverso
  return registrarMovimiento({
    tipo:                 original.tipo === 'ingreso' ? 'egreso' : 'ingreso',
    categoria:            original.categoria,
    descripcion:          `ANULACIÓN — ${original.descripcion}`,
    monto:                Number(original.monto),
    fecha:                new Date().toISOString().split('T')[0],
    tipo_cuenta:          original.tipo_cuenta,
    cliente_id:           original.cliente_id,
    chofer_id:            original.chofer_id,
    camion_id:            original.camion_id,
    referencia_origen_id: movimientoId,
    modulo_origen:        'anulacion',
  })
}