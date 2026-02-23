// src/app/api/arca/sign/route.ts
// Firma el TRA con el certificado digital (CMS/PKCS#7)
// Requiere: npm install node-forge

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { tra, certificado, clavePrivada } = await req.json()

    // Importar node-forge dinámicamente
    const forge = await import('node-forge')

    // Decodificar certificado y clave privada (pueden venir en base64 o PEM directo)
    const certPem = certificado.includes('-----BEGIN')
      ? certificado
      : Buffer.from(certificado, 'base64').toString('utf-8')

    const keyPem = clavePrivada.includes('-----BEGIN')
      ? clavePrivada
      : Buffer.from(clavePrivada, 'base64').toString('utf-8')

    // Parsear certificado y clave
    const cert    = forge.pki.certificateFromPem(certPem)
    const privKey = forge.pki.privateKeyFromPem(keyPem)

    // Crear mensaje CMS/PKCS#7 firmado
    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(tra, 'utf8')
    p7.addCertificate(cert)
    p7.addSigner({
      key:         privKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType,   value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime,   value: new Date() as any},
      ],
    })

    p7.sign()

    // Serializar a DER y convertir a base64
    const der    = forge.asn1.toDer(p7.toAsn1()).getBytes()
    const base64 = forge.util.encode64(der)

    return NextResponse.json({ cmsSigned: base64 })
  } catch (e: any) {
    console.error('Error firmando TRA:', e)
    return NextResponse.json({ error: e.message || 'Error al firmar el certificado' }, { status: 500 })
  }
}