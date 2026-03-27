/**
 * Tests para /api/arca/test (Traccar GPS setup)
 * Este endpoint es puro (no depende de Supabase) — testeamos lógica de validación y fetch.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/arca/test/route'

describe('/api/arca/test — validaciones de input', () => {
  it('retorna error si falta traccar_url', async () => {
    const req = {
      json: async () => ({ traccar_email: 'admin@test.com', traccar_password: '1234' }),
    } as any

    const res = await POST(req)
    expect(res._body.ok).toBe(false)
    expect(res._body.error).toMatch(/url/i)
  })

  it('retorna error si falta traccar_email', async () => {
    const req = {
      json: async () => ({ traccar_url: 'http://traccar.example.com', traccar_password: '1234' }),
    } as any

    const res = await POST(req)
    expect(res._body.ok).toBe(false)
    expect(res._body.error).toMatch(/email/i)
  })
})

describe('/api/arca/test — conexión exitosa', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Admin', administrator: true }),
    })
  })

  it('retorna ok=true con datos del usuario de Traccar', async () => {
    const req = {
      json: async () => ({
        traccar_url: 'http://traccar.example.com',
        traccar_email: 'admin@test.com',
        traccar_password: 'secreto123',
      }),
    } as any

    const res = await POST(req)
    expect(res._body.ok).toBe(true)
    expect(res._body.user).toMatchObject({ id: 1, name: 'Admin' })
  })

  it('construye header Basic Auth correctamente', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    })

    const req = {
      json: async () => ({
        traccar_url: 'http://traccar.example.com',
        traccar_email: 'user@domain.com',
        traccar_password: 'pass123',
      }),
    } as any

    await POST(req)

    const expectedCreds = Buffer.from('user@domain.com:pass123').toString('base64')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/session'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${expectedCreds}`,
        }),
      })
    )
  })

  it('limpia slash final de la URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    })

    const req = {
      json: async () => ({
        traccar_url: 'http://traccar.example.com/',
        traccar_email: 'user@test.com',
        traccar_password: 'pass',
      }),
    } as any

    await POST(req)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://traccar.example.com/api/session',
      expect.any(Object)
    )
  })
})

describe('/api/arca/test — respuesta HTTP no-ok de Traccar', () => {
  it('retorna ok=false con código HTTP cuando Traccar rechaza credenciales', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })

    const req = {
      json: async () => ({
        traccar_url: 'http://traccar.example.com',
        traccar_email: 'bad@user.com',
        traccar_password: 'wrong',
      }),
    } as any

    const res = await POST(req)
    expect(res._body.ok).toBe(false)
    expect(res._body.error).toContain('401')
  })
})

describe('/api/arca/test — error de red', () => {
  it('retorna ok=false con mensaje de error si fetch lanza excepción', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const req = {
      json: async () => ({
        traccar_url: 'http://no-such-host.internal',
        traccar_email: 'admin@test.com',
        traccar_password: 'pass',
      }),
    } as any

    const res = await POST(req)
    expect(res._body.ok).toBe(false)
    expect(res._body.error).toContain('ECONNREFUSED')
  })
})
