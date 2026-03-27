/**
 * Tests para /api/arca/facturar
 * Cubre: validaciones de config, flujo de error AFIP, factura exitosa.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted ─────────────────────────────────────────────────────────────
const { mockConfigFn, mockInsertFn } = vi.hoisted(() => ({
  mockConfigFn: vi.fn(),
  mockInsertFn: vi.fn(),
}))

// ── Mock Supabase ──────────────────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'configuracion') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockConfigFn })) })),
        }
      }
      if (table === 'facturas') {
        return {
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockInsertFn })) })),
        }
      }
      if (table === 'remitos') {
        return { update: vi.fn(() => ({ eq: vi.fn() })) }
      }
      return {}
    }),
  })),
}))

import { POST } from '@/app/api/arca/facturar/route'

const BASE_BODY = {
  tipo_comprobante: 6,
  punto_venta: 1,
  fecha_comprobante: '2025-03-01',
  cuit_receptor: '27-30715158-1',
  condicion_iva_receptor: 'CF',
  importe_neto: 826.45,
  importe_iva: 173.55,
  importe_total: 1000,
  alicuota_iva: 21,
  concepto: 2,
  descripcion: 'Servicio de transporte',
}

const VALID_CONFIG = {
  arca_cuit: '20-12345678-9',
  arca_punto_venta: 1,
  arca_entorno: 'homologacion',
}

describe('/api/arca/facturar — ARCA no configurado', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna 400 si no hay CUIT en config', async () => {
    mockConfigFn.mockResolvedValue({ data: { arca_cuit: null }, error: null })
    const req = { json: async () => BASE_BODY } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(res._body.error).toMatch(/arca no configurado/i)
  })
})

describe('/api/arca/facturar — error de autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigFn.mockResolvedValue({ data: VALID_CONFIG, error: null })
  })

  it('retorna 500 si el endpoint de auth falla', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Auth failed' }),
    })
    const req = { json: async () => BASE_BODY } as any
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect(res._body.error).toBeTruthy()
  })
})

describe('/api/arca/facturar — respuesta AFIP con error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigFn.mockResolvedValue({ data: VALID_CONFIG, error: null })
    mockInsertFn.mockResolvedValue({ data: { id: 'factura-error-1' }, error: null })
  })

  it('retorna 422 si AFIP responde con ErrMsg', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'tok', sign: 'sig' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<CbteNro>5</CbteNro>',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<ErrMsg>10016: El campo DocNro no puede estar vacío</ErrMsg>',
      })

    const req = { json: async () => BASE_BODY } as any
    const res = await POST(req)
    expect(res.status).toBe(422)
    expect(res._body.error).toContain('DocNro')
  })

  it('retorna 500 si AFIP no devuelve CAE ni ErrMsg', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'tok', sign: 'sig' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<CbteNro>5</CbteNro>',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<Resultado>R</Resultado>',
      })

    const req = { json: async () => BASE_BODY } as any
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect(res._body.error).toMatch(/cae/i)
  })
})

describe('/api/arca/facturar — factura exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigFn.mockResolvedValue({ data: VALID_CONFIG, error: null })
    mockInsertFn.mockResolvedValue({
      data: {
        id: 'factura-ok-1',
        tipo_comprobante: 'B',
        numero_comprobante: 6,
        clientes: { razon_social: 'Cliente Test' },
      },
      error: null,
    })
  })

  it('retorna cae, caeVto y nroComprobante correctos', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'TOKEN123', sign: 'SIGN456' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<CbteNro>5</CbteNro>',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<CAE>12345678901234</CAE><CAEFchVto>20250311</CAEFchVto>',
      })

    const req = { json: async () => BASE_BODY } as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res._body.cae).toBe('12345678901234')
    expect(res._body.caeVto).toBe('2025-03-11')
    expect(res._body.nroComprobante).toBe(6)
  })
})
