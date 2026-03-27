import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted: declarar mocks antes que los imports ──────────────────────
const { mockInsertSingle, mockSelectSingle } = vi.hoisted(() => {
  const mockInsertSingle = vi.fn()
  const mockSelectSingle = vi.fn()
  return { mockInsertSingle, mockSelectSingle }
})

// ── Mock Supabase ──────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsertSingle,
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSelectSingle,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }
    }),
  },
}))

// ── Import after mock ───────────────────────────────────────────────────────
import {
  registrarMovimiento,
  registrarCobroFlete,
  registrarPagoChofer,
  registrarCombustible,
  registrarMantenimiento,
  registrarPagoMulta,
  registrarPagoSeguro,
  registrarPagoImpuesto,
  registrarCuotaLeasing,
  anularMovimiento,
} from '@/lib/cajaService'
import { supabase } from '@/lib/supabase'

// ── Helper: capturar payload que se pasa a insert ──────────────────────────
function captureInsertPayload() {
  let captured: any = null
  ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
    insert: vi.fn().mockImplementation((p: any) => {
      captured = p
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        }),
      }
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  })
  return () => captured
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS: validaciones
// ══════════════════════════════════════════════════════════════════════════════

describe('registrarMovimiento — validaciones', () => {
  it('falla si monto es 0', async () => {
    const result = await registrarMovimiento({
      tipo: 'ingreso', categoria: 'cobro_flete', descripcion: 'Test', monto: 0,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/monto/i)
  })

  it('falla si monto es negativo', async () => {
    const result = await registrarMovimiento({
      tipo: 'ingreso', categoria: 'cobro_flete', descripcion: 'Test', monto: -500,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/monto/i)
  })

  it('falla si descripcion está vacía', async () => {
    const result = await registrarMovimiento({
      tipo: 'egreso', categoria: 'combustible', descripcion: '   ', monto: 1000,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/descripción/i)
  })
})

describe('registrarMovimiento — DB error', () => {
  it('retorna ok=false cuando hay error de DB', async () => {
    mockInsertSingle.mockResolvedValue({ data: null, error: { message: 'violates not-null constraint' } })
    const result = await registrarMovimiento({
      tipo: 'egreso', categoria: 'combustible', descripcion: 'Test carga', monto: 5000,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('registrarMovimiento — caso exitoso', () => {
  beforeEach(() => {
    mockInsertSingle.mockResolvedValue({ data: { id: 'abc-123' }, error: null })
  })

  it('retorna ok=true con id cuando DB responde bien', async () => {
    const result = await registrarMovimiento({
      tipo: 'ingreso', categoria: 'cobro_flete', descripcion: 'Cobro viaje BUE', monto: 85000,
    })
    expect(result.ok).toBe(true)
    expect(result.id).toBe('abc-123')
  })

  it('convierte descripcion a mayúsculas', async () => {
    const getPayload = captureInsertPayload()
    await registrarMovimiento({
      tipo: 'ingreso', categoria: 'cobro_flete',
      descripcion: 'pago en efectivo cliente norte', monto: 10000,
    })
    expect(getPayload()?.descripcion).toBe('PAGO EN EFECTIVO CLIENTE NORTE')
  })

  it('usa "caja" como tipo_cuenta por defecto', async () => {
    const getPayload = captureInsertPayload()
    await registrarMovimiento({
      tipo: 'egreso', categoria: 'mantenimiento', descripcion: 'Service aceite', monto: 12000,
    })
    expect(getPayload()?.tipo_cuenta).toBe('caja')
  })

  it('usa "manual" como modulo_origen por defecto', async () => {
    const getPayload = captureInsertPayload()
    await registrarMovimiento({
      tipo: 'egreso', categoria: 'multa', descripcion: 'Multa ruta 7', monto: 25000,
    })
    expect(getPayload()?.modulo_origen).toBe('manual')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// TESTS: helpers de módulo
// ══════════════════════════════════════════════════════════════════════════════

describe('registrarCobroFlete', () => {
  it('genera descripción y tipo correctos', async () => {
    const getPayload = captureInsertPayload()
    await registrarCobroFlete({ monto: 50000, clienteNombre: 'Mercado Libre' })
    const p = getPayload()
    expect(p?.descripcion).toBe('COBRO FLETE — MERCADO LIBRE')
    expect(p?.tipo).toBe('ingreso')
    expect(p?.categoria).toBe('cobro_flete')
    expect(p?.tipo_cuenta).toBe('banco')
  })
})

describe('registrarPagoChofer', () => {
  it('usa concepto LIQUIDACIÓN por defecto', async () => {
    const getPayload = captureInsertPayload()
    await registrarPagoChofer({ monto: 30000, choferNombre: 'Juan Pérez' })
    expect(getPayload()?.descripcion).toBe('LIQUIDACIÓN — JUAN PÉREZ')
    expect(getPayload()?.tipo_cuenta).toBe('caja')
  })

  it('acepta concepto personalizado', async () => {
    const getPayload = captureInsertPayload()
    await registrarPagoChofer({ monto: 5000, choferNombre: 'Carlos López', concepto: 'VIÁTICO' })
    expect(getPayload()?.descripcion).toBe('VIÁTICO — CARLOS LÓPEZ')
  })
})

describe('registrarCombustible', () => {
  it('categoría combustible_ypf + banco cuando esYPF=true', async () => {
    const getPayload = captureInsertPayload()
    await registrarCombustible({ monto: 80000, esYPF: true, camionPatente: 'ABC123', litros: 200 })
    const p = getPayload()
    expect(p?.categoria).toBe('combustible_ypf')
    expect(p?.tipo_cuenta).toBe('banco')
    expect(p?.descripcion).toContain('YPF')
    expect(p?.descripcion).toContain('200 LTS')
  })

  it('categoría combustible + caja cuando esYPF=false', async () => {
    const getPayload = captureInsertPayload()
    await registrarCombustible({ monto: 45000, esYPF: false })
    expect(getPayload()?.categoria).toBe('combustible')
    expect(getPayload()?.tipo_cuenta).toBe('caja')
  })
})

describe('registrarMantenimiento', () => {
  it('incluye patente y descripción en el texto', async () => {
    const getPayload = captureInsertPayload()
    await registrarMantenimiento({ monto: 15000, descripcion: 'Cambio filtros', camionPatente: 'MND456' })
    const desc = getPayload()?.descripcion
    expect(desc).toContain('MND456')
    expect(desc).toContain('CAMBIO FILTROS')
    expect(getPayload()?.modulo_origen).toBe('mantenimiento')
  })
})

describe('registrarPagoMulta', () => {
  it('genera payload correcto', async () => {
    const getPayload = captureInsertPayload()
    await registrarPagoMulta({ monto: 12000, descripcion: 'Exceso velocidad ruta 7' })
    expect(getPayload()?.descripcion).toContain('MULTA')
    expect(getPayload()?.tipo).toBe('egreso')
    expect(getPayload()?.modulo_origen).toBe('multas')
  })
})

describe('registrarPagoSeguro', () => {
  it('siempre va a cuenta banco', async () => {
    const getPayload = captureInsertPayload()
    await registrarPagoSeguro({ monto: 45000, aseguradora: 'La Segunda' })
    expect(getPayload()?.tipo_cuenta).toBe('banco')
    expect(getPayload()?.descripcion).toContain('LA SEGUNDA')
  })
})

describe('registrarPagoImpuesto', () => {
  it('incluye período en descripción y va a banco', async () => {
    const getPayload = captureInsertPayload()
    await registrarPagoImpuesto({ monto: 8000, tipoImpuesto: 'IIBB', periodo: 'Febrero 2025' })
    const desc = getPayload()?.descripcion
    expect(desc).toContain('IIBB')
    expect(desc).toContain('FEBRERO 2025')
    expect(getPayload()?.tipo_cuenta).toBe('banco')
  })
})

describe('registrarCuotaLeasing', () => {
  it('incluye patente y número de cuota', async () => {
    const getPayload = captureInsertPayload()
    await registrarCuotaLeasing({ monto: 120000, camionPatente: 'XYZ789', cuotaNro: 12 })
    const desc = getPayload()?.descripcion
    expect(desc).toContain('XYZ789')
    expect(desc).toContain('CUOTA 12')
    expect(getPayload()?.tipo_cuenta).toBe('banco')
  })
})

describe('anularMovimiento', () => {
  it('falla si el movimiento no existe', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const result = await anularMovimiento('id-inexistente')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/no se encontró/i)
  })

  it('crea movimiento inverso: ingreso → egreso', async () => {
    let capturedInsert: any = null
    let callCount = 0

    // Primer from() → select (buscar original)
    // Segundo from() → insert (registrar anulación)
    ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'mov-1',
                  tipo: 'ingreso',
                  tipo_cuenta: 'banco',
                  categoria: 'cobro_flete',
                  descripcion: 'COBRO FLETE — CLIENTE X',
                  monto: 50000,
                  cliente_id: 'cli-1',
                  chofer_id: null,
                  camion_id: null,
                },
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        insert: vi.fn().mockImplementation((p: any) => {
          capturedInsert = p
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'anulacion-1' }, error: null }),
            }),
          }
        }),
      }
    })

    const result = await anularMovimiento('mov-1')
    expect(result.ok).toBe(true)
    expect(capturedInsert?.tipo).toBe('egreso')
    expect(capturedInsert?.descripcion).toContain('ANULACIÓN')
    expect(capturedInsert?.monto).toBe(50000)
  })
})
