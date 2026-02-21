import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// =============================================
// HELPERS COMPARTIDOS
// =============================================

function addHeader(doc: jsPDF, titulo: string, subtitulo?: string) {
  doc.setFillColor(2, 6, 23)
  doc.rect(0, 0, 210, 32, 'F')
  // Línea de acento violeta
  doc.setFillColor(139, 92, 246)
  doc.rect(0, 29, 210, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RUTAS DEL SUR', 14, 13)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('ERP · Sistema de Gestión Integral', 14, 20)
  // Título a la derecha
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(titulo.toUpperCase(), 210 - 14, 13, { align: 'right' })
  if (subtitulo) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(subtitulo, 210 - 14, 20, { align: 'right' })
  }
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 210 - 14, 27, { align: 'right' })
}

function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 287, 210, 10, 'F')
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text('Rutas del Sur ERP — Documento confidencial', 14, 293)
    doc.text(`Pág. ${i} / ${pageCount}`, 210 - 14, 293, { align: 'right' })
  }
}

function getFinalY(doc: jsPDF, fallback: number): number {
  const lastTable = (doc as any).lastAutoTable
  return (lastTable && lastTable.finalY) ? lastTable.finalY : fallback
}

// =============================================
// BACKUP SERVICE
// =============================================

export const backupService = {

  // ════════════════════════════════════════
  // CLIENTES — Auditoría de Deuda por Remito
  // ════════════════════════════════════════

  downloadResumenGeneral: async (todosLosClientes: any[]) => {
    const doc = new jsPDF()
    addHeader(doc, 'Auditoría de Deuda', 'Desglose por remito · Todos los clientes')
    let currentY = 42

    todosLosClientes.forEach((cliente: any) => {
      const remitosPendientes = (cliente.historial || []).filter(
        (h: any) => h.estado_gestion === 'por_cobrar'
      )
      if (remitosPendientes.length === 0) return

      if (currentY > 230) { doc.addPage(); currentY = 20 }

      // Separador cliente
      doc.setFillColor(241, 245, 249)
      doc.rect(14, currentY, 182, 10, 'F')
      doc.setTextColor(2, 6, 23)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`CLIENTE: ${cliente.razon_social.toUpperCase()}`, 18, currentY + 7)
      currentY += 12

      const body = remitosPendientes.map((m: any) => [
        new Date(m.fecha).toLocaleDateString('es-AR'),
        m.remito || '— SIN NRO —',
        m.detalle || 'Flete / Servicio Logístico',
        { content: `$ ${Number(m.debe || 0).toLocaleString('es-AR')}`, styles: { halign: 'right', fontStyle: 'bold' } },
      ])

      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'N° Remito', 'Detalle', 'Importe']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: { 1: { cellWidth: 38 }, 3: { cellWidth: 38 } },
        foot: [['', '', 'SUBTOTAL CLIENTE:', `$ ${Number(cliente.saldo || 0).toLocaleString('es-AR')}`]],
        footStyles: { fillColor: [224, 242, 254], textColor: [2, 6, 23], fontStyle: 'bold', fontSize: 9 },
        margin: { left: 14, right: 14 },
      })

      currentY = getFinalY(doc, currentY + 30) + 15
    })

    // Gran total
    const totalCartera = todosLosClientes.reduce((acc: number, c: any) => acc + (c.saldo || 0), 0)
    if (currentY > 260) { doc.addPage(); currentY = 20 }
    doc.setFillColor(14, 165, 233)
    doc.rect(14, currentY, 182, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`DEUDA TOTAL CARTERA: $ ${totalCartera.toLocaleString('es-AR')}`, 20, currentY + 9)

    addFooter(doc)
    doc.save(`Auditoria_Deuda_RutasDelSur_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  },

  downloadPDF: async (cliente: any, gestion: any) => {
    const doc = new jsPDF()
    const { porCobrar, saldoPendiente } = gestion
    addHeader(doc, 'Estado de Cuenta', `Cliente: ${cliente.razon_social.toUpperCase()}`)

    // Info del cliente
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text(`CUIT: ${cliente.cuit || '—'}`, 14, 44)
    doc.text(`Tel: ${cliente.telefono || '—'}`, 80, 44)
    doc.text(`Email: ${cliente.email || '—'}`, 140, 44)

    autoTable(doc, {
      startY: 50,
      head: [['Fecha', 'N° Remito', 'Detalle', 'Importe']],
      body: porCobrar.map((m: any) => [
        new Date(m.fecha).toLocaleDateString('es-AR'),
        m.remito || 'S/N',
        m.detalle || 'Flete / Servicio Logístico',
        { content: `$ ${Number(m.debe || 0).toLocaleString('es-AR')}`, styles: { halign: 'right', fontStyle: 'bold' } },
      ]),
      foot: [['', '', 'TOTAL PENDIENTE:', `$ ${saldoPendiente.toLocaleString('es-AR')}`]],
      theme: 'grid',
      headStyles: { fillColor: [2, 6, 23], textColor: [255, 255, 255], fontSize: 8 },
      footStyles: { fillColor: [224, 242, 254], textColor: [2, 6, 23], fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: 14, right: 14 },
    })

    addFooter(doc)
    doc.save(`EstadoCuenta_${cliente.razon_social.replace(/\s+/g, '_')}.pdf`)
  },

  // ════════════════════════════════════════
  // CAJA / BANCO — Movimientos del período
  // ════════════════════════════════════════

  downloadMovimientosPDF: async (
    movimientos: any[],
    resumen: {
      totalCaja: number
      totalBanco: number
      total: number
      ingresosMes: number
      deudasMes: number
    },
    filtros: {
      tipoCuenta: string
      dateStart: string
      dateEnd: string
    }
  ) => {
    const doc = new jsPDF({ orientation: 'landscape' })
    const fechaDesde = filtros.dateStart ? new Date(filtros.dateStart).toLocaleDateString('es-AR') : '—'
    const fechaHasta = filtros.dateEnd ? new Date(filtros.dateEnd).toLocaleDateString('es-AR') : '—'

    addHeader(doc, 'Resumen de Caja / Banco', `Período: ${fechaDesde} al ${fechaHasta}`)

    // Bloque resumen
    let y = 42
    const bloques = [
      { label: 'CAJA (EFECTIVO)', value: resumen.totalCaja, color: [217, 119, 6] as [number, number, number] },
      { label: 'BANCO',           value: resumen.totalBanco, color: [14, 165, 233] as [number, number, number] },
      { label: 'INGRESOS MES',    value: resumen.ingresosMes, color: [34, 197, 94] as [number, number, number] },
      { label: 'EGRESOS MES',     value: -resumen.deudasMes, color: [239, 68, 68] as [number, number, number] },
      { label: 'TOTAL EMPRESA',   value: resumen.total, color: [139, 92, 246] as [number, number, number] },
    ]

    const blockW = (297 - 28 - 16) / bloques.length // landscape width = 297
    bloques.forEach((b, i) => {
      const x = 14 + i * (blockW + 4)
      doc.setFillColor(15, 23, 42)
      doc.roundedRect(x, y, blockW, 22, 3, 3, 'F')
      doc.setFillColor(...b.color)
      doc.rect(x, y, 3, 22, 'F')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text(b.label, x + 6, y + 7)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`$ ${Math.abs(b.value).toLocaleString('es-AR')}`, x + 6, y + 17)
    })

    y += 30

    // Categoría label helper
    const catLabel: Record<string, string> = {
      cobro_flete: 'Cobro Flete',
      pago_chofer: 'Pago Chofer',
      gasto_camion: 'Gasto Unidad',
      costo_fijo: 'Costo Fijo',
      multa: 'Multa',
      ingreso_otro: 'Ingreso Varios',
      egreso_otro: 'Egreso Varios',
    }

    const body = movimientos.map((m: any) => [
      new Date(m.fecha).toLocaleDateString('es-AR'),
      m.tipo === 'ingreso' ? '▲ INGRESO' : '▼ EGRESO',
      m.tipo_cuenta === 'caja' ? 'Efectivo' : 'Banco',
      catLabel[m.categoria] || m.categoria,
      m.descripcion || '—',
      m.clientes?.razon_social || m.choferes?.nombre || m.camiones?.patente || '—',
      {
        content: `${m.tipo === 'ingreso' ? '+' : '-'} $ ${Number(m.monto).toLocaleString('es-AR')}`,
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          textColor: m.tipo === 'ingreso' ? [34, 197, 94] : [239, 68, 68],
        },
      },
    ])

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Tipo', 'Cuenta', 'Categoría', 'Descripción', 'Vinculado a', 'Monto']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 28 },
        6: { cellWidth: 35 },
      },
      alternateRowStyles: { fillColor: [15, 23, 42] },
      margin: { left: 14, right: 14 },
    })

    addFooter(doc)
    doc.save(`CajaBanco_${fechaDesde.replace(/\//g, '-')}_${fechaHasta.replace(/\//g, '-')}.pdf`)
  },

  // ════════════════════════════════════════
  // TAREAS — Lista de pendientes / vencidas
  // ════════════════════════════════════════

  downloadTareasPDF: async (tareas: any[], filtro: string) => {
    const doc = new jsPDF()
    const hoy = new Date().toISOString().split('T')[0]
    addHeader(doc, 'Reporte de Tareas', `Filtro: ${filtro.toUpperCase()} · ${new Date().toLocaleDateString('es-AR')}`)

    const catLabel: Record<string, string> = {
      mantenimiento: 'Mantenimiento',
      pago_fijo:     'Pago Fijo',
      operativa:     'Operativa',
    }

    const body = tareas.map((t: any) => {
      const diff = Math.ceil((new Date(t.fecha_vencimiento + 'T00:00:00').getTime() - new Date(hoy + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
      const estadoTexto = t.completada
        ? 'Completada'
        : diff < 0
        ? `Vencida (${Math.abs(diff)}d)`
        : diff === 0
        ? 'Vence HOY'
        : `En ${diff} días`

      return [
        catLabel[t.categoria] || t.categoria,
        t.titulo,
        t.descripcion || '—',
        new Date(t.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR'),
        t.es_recurrente ? `Sí · ${t.periodo_recurrencia}` : 'No',
        t.camiones?.patente || '—',
        {
          content: estadoTexto,
          styles: {
            fontStyle: 'bold',
            textColor: t.completada
              ? [34, 197, 94]
              : diff < 0
              ? [239, 68, 68]
              : diff <= t.dias_anticipacion
              ? [245, 158, 11]
              : [148, 163, 184],
          },
        },
      ]
    })

    autoTable(doc, {
      startY: 42,
      head: [['Categoría', 'Título', 'Descripción', 'Fecha Límite', 'Recurrente', 'Unidad', 'Estado']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 28 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 20 },
        6: { cellWidth: 26 },
      },
      margin: { left: 14, right: 14 },
    })

    // Resumen al pie
    const finalY = getFinalY(doc, 200) + 10
    if (finalY < 265) {
      const pendientes = tareas.filter(t => !t.completada).length
      const vencidas = tareas.filter(t => !t.completada && t.fecha_vencimiento < hoy).length
      const completadas = tareas.filter(t => t.completada).length

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(`Total: ${tareas.length}  |  Pendientes: ${pendientes}  |  Vencidas: ${vencidas}  |  Completadas: ${completadas}`, 14, finalY)
    }

    addFooter(doc)
    doc.save(`Tareas_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  },

  // ════════════════════════════════════════
  // VIAJES — Resumen del período
  // ════════════════════════════════════════

  downloadViajesPDF: async (viajes: any[], periodo?: string) => {
    const doc = new jsPDF({ orientation: 'landscape' })
    addHeader(doc, 'Reporte de Viajes', periodo || new Date().toLocaleDateString('es-AR'))

    const estadoColor: Record<string, [number, number, number]> = {
      pendiente:  [245, 158, 11],
      en_ruta:    [14, 165, 233],
      completado: [34, 197, 94],
      cancelado:  [239, 68, 68],
    }

    const body = viajes.map((v: any) => [
      new Date(v.fecha).toLocaleDateString('es-AR'),
      v.clientes?.razon_social || '—',
      v.camiones?.patente || '—',
      v.choferes?.nombre || '—',
      v.origen || '—',
      v.destino || '—',
      {
        content: (v.estado || 'pendiente').toUpperCase(),
        styles: {
          fontStyle: 'bold',
          textColor: estadoColor[v.estado] || [148, 163, 184],
        },
      },
      {
        content: v.precio ? `$ ${Number(v.precio).toLocaleString('es-AR')}` : '—',
        styles: { halign: 'right', fontStyle: 'bold' },
      },
    ])

    const totalFacturado = viajes.reduce((acc, v) => acc + (v.precio || 0), 0)

    autoTable(doc, {
      startY: 42,
      head: [['Fecha', 'Cliente', 'Unidad', 'Chofer', 'Origen', 'Destino', 'Estado', 'Precio']],
      body,
      foot: [['', '', '', '', '', '', 'TOTAL FACTURADO:', `$ ${totalFacturado.toLocaleString('es-AR')}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontSize: 7 },
      footStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 22 },
        6: { cellWidth: 25 },
        7: { cellWidth: 30 },
      },
      alternateRowStyles: { fillColor: [15, 23, 42] },
      margin: { left: 14, right: 14 },
    })

    addFooter(doc)
    doc.save(`Viajes_RutasDelSur_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  },

  // ════════════════════════════════════════
  // FLOTA — Estado de camiones
  // ════════════════════════════════════════

  downloadFlotaPDF: async (camiones: any[]) => {
    const doc = new jsPDF()
    addHeader(doc, 'Estado de Flota', `${camiones.length} unidades · ${new Date().toLocaleDateString('es-AR')}`)
    const hoy = new Date()

    const body = camiones.map((c: any) => {
      const kmDesdeService = (c.km_actual || 0) - (c.km_ultimo_service || 0)
      const estadoService = kmDesdeService >= 30000 ? 'CRÍTICO' : kmDesdeService >= 25000 ? 'PRÓXIMO' : 'OK'

      const diasRto = c.vto_rto
        ? Math.ceil((new Date(c.vto_rto).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const estadoRto = diasRto === null ? '—' : diasRto < 0 ? 'VENCIDA' : diasRto <= 30 ? `${diasRto}d` : 'OK'

      const diasSenasa = c.vto_senasa
        ? Math.ceil((new Date(c.vto_senasa).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const estadoSenasa = diasSenasa === null ? '—' : diasSenasa < 0 ? 'VENCIDO' : diasSenasa <= 30 ? `${diasSenasa}d` : 'OK'

      return [
        c.patente,
        c.marca || '—',
        c.modelo || '—',
        (c.km_actual || 0).toLocaleString('es-AR'),
        {
          content: estadoService,
          styles: {
            fontStyle: 'bold',
            textColor: estadoService === 'CRÍTICO' ? [239, 68, 68] : estadoService === 'PRÓXIMO' ? [245, 158, 11] : [34, 197, 94],
          },
        },
        c.vto_rto ? new Date(c.vto_rto).toLocaleDateString('es-AR') : '—',
        {
          content: estadoRto,
          styles: {
            fontStyle: 'bold',
            textColor: estadoRto === 'VENCIDA' ? [239, 68, 68] : estadoRto === 'OK' ? [34, 197, 94] : [245, 158, 11],
          },
        },
        c.vto_senasa ? new Date(c.vto_senasa).toLocaleDateString('es-AR') : '—',
        {
          content: estadoSenasa,
          styles: {
            fontStyle: 'bold',
            textColor: estadoSenasa === 'VENCIDO' ? [239, 68, 68] : estadoSenasa === 'OK' ? [34, 197, 94] : [245, 158, 11],
          },
        },
      ]
    })

    autoTable(doc, {
      startY: 42,
      head: [['Patente', 'Marca', 'Modelo', 'KM Actual', 'Service', 'Vto. RTO', 'RTO', 'Vto. SENASA', 'SENASA']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    })

    addFooter(doc)
    doc.save(`Flota_RutasDelSur_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  },

  // ════════════════════════════════════════
  // CHOFERES — Estado general
  // ════════════════════════════════════════

  downloadChoferesPDF: async (choferes: any[]) => {
    const doc = new jsPDF()
    addHeader(doc, 'Nómina de Choferes', `${choferes.length} choferes · ${new Date().toLocaleDateString('es-AR')}`)
    const hoy = new Date()

    const body = choferes.map((c: any) => {
      const diasLicencia = c.vto_licencia
        ? Math.ceil((new Date(c.vto_licencia).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const estadoLicencia = diasLicencia === null ? '—'
        : diasLicencia < 0 ? 'VENCIDA'
        : diasLicencia <= 30 ? `${diasLicencia}d`
        : 'OK'

      return [
        c.nombre,
        c.dni || '—',
        c.telefono || '—',
        c.vto_licencia ? new Date(c.vto_licencia).toLocaleDateString('es-AR') : '—',
        {
          content: estadoLicencia,
          styles: {
            fontStyle: 'bold',
            textColor: estadoLicencia === 'VENCIDA' ? [239, 68, 68]
              : estadoLicencia === 'OK' ? [34, 197, 94]
              : [245, 158, 11],
          },
        },
        c.direccion || '—',
      ]
    })

    autoTable(doc, {
      startY: 42,
      head: [['Nombre', 'DNI', 'Teléfono', 'Vto. Licencia', 'Estado', 'Dirección']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4 },
      margin: { left: 14, right: 14 },
    })

    addFooter(doc)
    doc.save(`Choferes_RutasDelSur_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`)
  },
}