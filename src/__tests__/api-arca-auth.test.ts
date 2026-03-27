/**
 * Tests para /api/arca/auth
 * Cubre validaciones de config y manejo de errores de firma/WSAA.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted ─────────────────────────────────────────────────────────────
const { mockSingleFn } = vi.hoisted(() => ({ mockSingleFn: vi.fn() }))

// ── Mock Supabase ──────────────────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingleFn,
        })),
      })),
    })),
  })),
}))

// Importar POST directamente (no re-importar, el cache del módulo está bien para estos tests)
import { POST } from '@/app/api/arca/auth/route'

describe('/api/arca/auth — configuración faltante', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna 400 si no hay certificado configurado', async () => {
    mockSingleFn.mockResolvedValue({
      data: { arca_cuit: null, arca_certificado: null, arca_clave_privada: null, arca_entorno: null },
      error: null,
    })
    const req = { json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(res._body.error).toMatch(/certificado arca no configurado/i)
  })

  it('retorna 400 si falta clave privada', async () => {
    mockSingleFn.mockResolvedValue({
      data: {
        arca_cuit: '20-12345678-9',
        arca_certificado: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
        arca_clave_privada: null,
        arca_entorno: 'homologacion',
      },
      error: null,
    })
    const req = { json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta CUIT', async () => {
    mockSingleFn.mockResolvedValue({
      data: {
        arca_cuit: null,
        arca_certificado: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
        arca_clave_privada: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        arca_entorno: 'homologacion',
      },
      error: null,
    })
    const req = { json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(res._body.error).toMatch(/certificado arca no configurado/i)
  })
})

describe('/api/arca/auth — error al firmar TRA', () => {
  it('retorna 500 si la llamada a /api/arca/sign falla', async () => {
    mockSingleFn.mockResolvedValue({
      data: {
        arca_cuit: '20-12345678-9',
        arca_certificado: '-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----',
        arca_clave_privada: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
        arca_entorno: 'homologacion',
      },
      error: null,
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const req = { json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect(res._body.error).toBeTruthy()
  })
})
