import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const backupService = {
  
  downloadResumenGeneral: async (todosLosClientes: any[]) => {
    const doc = new jsPDF();
    let currentY = 40;

    // --- ENCABEZADO PRINCIPAL ---
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("AUDITORÍA DE DEUDA: DESGLOSE POR REMITO", 14, 18);
    doc.setFontSize(9);
    doc.text(`RUTAS DEL SUR ERP - ${new Date().toLocaleString('es-AR')}`, 14, 25);

    // --- ITERAMOS POR CADA CLIENTE ---
    todosLosClientes.forEach((cliente) => {
      const remitosPendientes = (cliente.historial || []).filter(
        (h: any) => h.estado_gestion === 'por_cobrar'
      );

      if (remitosPendientes.length === 0) return;

      // Control de salto de página manual
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Nombre del Cliente (Separador Visual)
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 10, 'F');
      doc.setTextColor(2, 6, 23);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`CLIENTE: ${cliente.razon_social.toUpperCase()}`, 18, currentY + 7);
      
      currentY += 12;

      // Tabla de Desglose
      const body = remitosPendientes.map((m: any) => [
        new Date(m.fecha).toLocaleDateString('es-AR'),
        m.remito || '--- SIN NRO ---',
        m.detalle || 'Flete / Servicio Logístico',
        { content: `$ ${Number(m.debe || 0).toLocaleString('es-AR')}`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'N° Remito', 'Detalle', 'Precio']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
          1: { cellWidth: 40 }, 
          3: { cellWidth: 40 }
        },
        foot: [['', '', 'SUBTOTAL CLIENTE:', `$ ${Number(cliente.saldo || 0).toLocaleString('es-AR')}`]],
        footStyles: { fillColor: [224, 242, 254], textColor: [2, 6, 23], fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
      });

      // --- EL FIX AQUÍ: Usamos finalY con un fallback de seguridad ---
      const lastTable = (doc as any).lastAutoTable;
      currentY = (lastTable && lastTable.finalY) ? lastTable.finalY + 15 : currentY + 30;
    });

    // --- GRAN TOTAL ---
    const totalCartera = todosLosClientes.reduce((acc, c) => acc + (c.saldo || 0), 0);
    
    if (currentY > 260) { doc.addPage(); currentY = 20; }
    
    doc.setFillColor(14, 165, 233);
    doc.rect(14, currentY, 182, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`DEUDA TOTAL GENERAL CARTERA: $ ${totalCartera.toLocaleString('es-AR')}`, 20, currentY + 10);

    doc.save("Desglose_Deudas_RutasDelSur.pdf");
  },

  downloadPDF: async (cliente: any, gestion: any) => {
    // ... (Misma lógica de seguridad para el individual si lo necesitas)
    const doc = new jsPDF();
    const { porCobrar, saldoPendiente } = gestion;
    // (Este no suele fallar porque es una sola tabla, el problema es el loop del general)
    autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Remito', 'Detalle', 'Precio']],
        body: porCobrar.map(m => [new Date(m.fecha).toLocaleDateString(), m.remito || 'S/N', m.detalle, `$ ${Number(m.debe).toLocaleString()}`]),
        foot: [['', '', 'TOTAL:', `$ ${saldoPendiente.toLocaleString()}`]],
        headStyles: { fillColor: [2, 6, 23] }
    });
    doc.save(`Detalle_${cliente.razon_social}.pdf`);
  }
};