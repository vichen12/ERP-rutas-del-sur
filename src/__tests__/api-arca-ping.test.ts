/**
 * Tests para /api/arca/ping
 * Valida configuración faltante y manejo de errores del SDK de AFIP.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted: funciones de instancia mockeadas ───────────────────────────
const { mockGetServerStatus, mockCreateTA, mockConfigFn } = vi.hoisted(() => ({
  mockGetServerStatus: vi.fn(),
  mockCreateTA: vi.fn(),
  mockConfigFn: vi.fn(),
}))

// ── Mock @afipsdk/afip.js: necesita ser una función constructora ───────────
vi.mock('@afipsdk/afip.js', () => ({
  default: function AfipMock() {
    this.ElectronicBilling = { getServerStatus: mockGetServerStatus }
    this.CreateTA = mockCreateTA
  },
}))

// ── Mock Supabase ──────────────────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockConfigFn,
        })),
      })),
    })),
  })),
}))

import { GET } from '@/app/api/arca/ping/route'

// ── Configuración válida para tests exitosos ───────────────────────────────
const VALID_CONFIG = {
  arca_cuit: '20-12345678-9',
  arca_certificado: '-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----',
  arca_clave_privada: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
  arca_entorno: 'homologacion',
}

describe('/api/arca/ping — sin configuración', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna 400 si no hay config en DB', async () => {
    mockConfigFn.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const res = await GET()
    expect(res.status).toBe(400)
    expect(res._body.success).toBe(false)
  })

  it('retorna 400 si faltan certificados', async () => {
    mockConfigFn.mockResolvedValue({
      data: { ...VALID_CONFIG, arca_certificado: null, arca_clave_privada: null },
      error: null,
    })
    const res = await GET()
    expect(res.status).toBe(400)
    expect(res._body.error).toMatch(/certificados/i)
  })
})

describe('/api/arca/ping — conexión exitosa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigFn.mockResolvedValue({ data: VALID_CONFIG, error: null })
    mockGetServerStatus.mockResolvedValue({ AppServer: 'OK', DbServer: 'OK', AuthServer: 'OK' })
    mockCreateTA.mockResolvedValue({ token: 'TOKEN_TEST', sign: 'SIGN_TEST' })
  })

  it('retorna success=true con estado del servidor', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res._body.success).toBe(true)
    expect(res._body.message).toMatch(/verificad/i)
    expect(res._body.status).toMatchObject({ AppServer: 'OK' })
  })
})

describe('/api/arca/ping — error de SDK AFIP', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigFn.mockResolvedValue({ data: VALID_CONFIG, error: null })
  })

  it('retorna 500 si getServerStatus lanza error', async () => {
    mockGetServerStatus.mockRejectedValue(new Error('Certificado vencido'))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(res._body.success).toBe(false)
    expect(res._body.error).toContain('Certificado vencido')
  })

  it('retorna 500 si CreateTA lanza error', async () => {
    mockGetServerStatus.mockResolvedValue({ AppServer: 'OK' })
    mockCreateTA.mockRejectedValue(new Error('Error al crear ticket de acceso'))
    const res = await GET()
    expect(res.status).toBe(500)
    expect(res._body.success).toBe(false)
  })
})
