/**
 * Tests para /api/arca/sign
 * Este endpoint realiza firma CMS/PKCS#7 con node-forge.
 * Lo testeamos con un certificado de prueba auto-generado vía forge.
 */

import { describe, it, expect, vi } from 'vitest'
import forge from 'node-forge'

// ── Generar par de claves y certificado de prueba ──────────────────────────
function generateTestCredentials(): { cert: string; key: string } {
  const keys = forge.pki.rsa.generateKeyPair(1024) // 1024 bits, rápido para tests
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)

  const attrs = [{ name: 'commonName', value: 'Test AFIP' }]
  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(keys.privateKey, forge.md.sha256.create())

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  }
}

describe('/api/arca/sign — firma CMS con cert de prueba', () => {
  it('devuelve cmsSigned en base64 para un TRA válido', async () => {
    const { cert, key } = generateTestCredentials()

    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>1234567890</uniqueId>
    <generationTime>2025-01-01T00:00:00Z</generationTime>
    <expirationTime>2025-01-01T12:00:00Z</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`

    const req = {
      json: async () => ({ tra, certificado: cert, clavePrivada: key }),
    } as any

    const { POST } = await import('@/app/api/arca/sign/route')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res._body.cmsSigned).toBeTruthy()

    // Verificar que es base64 válido
    const decoded = Buffer.from(res._body.cmsSigned, 'base64')
    expect(decoded.length).toBeGreaterThan(100)
  }, 30000) // timeout generoso para generación RSA

  it('acepta certificado en formato base64', async () => {
    const { cert, key } = generateTestCredentials()
    const certBase64 = Buffer.from(cert).toString('base64')
    const keyBase64 = Buffer.from(key).toString('base64')

    const tra = '<loginTicketRequest><service>wsfe</service></loginTicketRequest>'

    const req = {
      json: async () => ({ tra, certificado: certBase64, clavePrivada: keyBase64 }),
    } as any

    const { POST } = await import('@/app/api/arca/sign/route')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res._body.cmsSigned).toBeTruthy()
  }, 30000)

  it('retorna 500 con certificado inválido', async () => {
    const req = {
      json: async () => ({
        tra: '<test>data</test>',
        certificado: '-----BEGIN CERTIFICATE-----\nINVALID\n-----END CERTIFICATE-----',
        clavePrivada: '-----BEGIN PRIVATE KEY-----\nINVALID\n-----END PRIVATE KEY-----',
      }),
    } as any

    const { POST } = await import('@/app/api/arca/sign/route')
    const res = await POST(req)

    expect(res.status).toBe(500)
    expect(res._body.error).toBeTruthy()
  })

  it('retorna 500 si falta algún campo requerido', async () => {
    const req = {
      json: async () => ({ tra: '<test/>' }), // sin certificado ni clave
    } as any

    const { POST } = await import('@/app/api/arca/sign/route')
    const res = await POST(req)

    expect(res.status).toBe(500)
  })
})
