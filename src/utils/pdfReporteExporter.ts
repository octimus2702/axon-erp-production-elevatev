import { jsPDF } from 'jspdf';
import { ReporteTecnicoCampo, EmpresaConfig } from '../types';
import { CURRENT_COMPANY } from '../config/companyConfig';

/**
 * Genera y descarga un documento PDF oficial para el Reporte Técnico de Campo
 * incluyendo información de la empresa, diagnóstico, lista de repuestos y
 * cuadrícula de fotografías de evidencia optimizadas.
 */
export const exportReporteTecnicoPDF = (
  reporte: ReporteTecnicoCampo,
  empresa: EmpresaConfig,
  hideCosts: boolean = false
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 14;

    // Colores corporativos
    const darkBg = [15, 23, 42];      // Slate 900
    const primaryCyan = [6, 182, 212]; // Cyan 500
    const textLight = [241, 245, 249]; // Slate 100
    const textDark = [30, 41, 59];    // Slate 800
    const textGray = [100, 116, 139];  // Slate 500

    // 1. BANNER CABECERA CORPORATIVA
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(margin, y, pageWidth - (margin * 2), 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryCyan[0], primaryCyan[1], primaryCyan[2]);
    const empNombre = (empresa.nombre || empresa.nombreCorto || CURRENT_COMPANY.nombre).toUpperCase();
    doc.text(empNombre, margin + 5, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 240);
    doc.text(`RIF: ${empresa.rif} | ${empresa.telefono} | ${empresa.email}`, margin + 5, y + 15);
    doc.text(empresa.slogan || 'Modernización y Mantenimiento de Ascensores', margin + 5, y + 20);

    // Título a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('REPORTE TÉCNICO DE CAMPO', pageWidth - margin - 5, y + 9, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(primaryCyan[0], primaryCyan[1], primaryCyan[2]);
    doc.text(`N° ${reporte.correlativo}`, pageWidth - margin - 5, y + 16, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 240);
    doc.text(`Fecha: ${reporte.fecha}`, pageWidth - margin - 5, y + 21, { align: 'right' });

    y += 28;

    // 2. RECUADRO DE DATOS GENERALES
    doc.setDrawColor(200, 210, 220);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - (margin * 2), 32, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    
    // Columna 1
    doc.text('DATOS DE LA OBRA / CLIENTE:', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente / Edificio: ${reporte.clienteNombre}`, margin + 4, y + 12);
    doc.text(`Ubicación Obra: ${reporte.ubicacionObra || 'N/A'}`, margin + 4, y + 18);
    doc.text(`Equipo Ascensor: ${reporte.equipoAscensor}`, margin + 4, y + 24);

    // Columna 2
    const col2X = margin + 100;
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DE INSPECCIÓN:', col2X, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Técnico Responsable: ${reporte.tecnicoNombre}`, col2X, y + 12);
    doc.text(`Tipo de Servicio: ${reporte.tipoReporte}`, col2X, y + 18);
    doc.text(`Estado / Prioridad: ${reporte.estado} (${reporte.prioridadAtencion || 'NORMAL'})`, col2X, y + 24);

    y += 36;

    // 3. DIAGNÓSTICO TÉCNICO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text('1. DIAGNÓSTICO TÉCNICO Y REPORTE DE DAÑOS:', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    const diagLines = doc.splitTextToSize(reporte.diagnosticoDanio || 'Sin observaciones registradas.', pageWidth - (margin * 2) - 4);
    const diagBoxHeight = Math.max(14, (diagLines.length * 4.5) + 4);
    
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 225, 230);
    doc.rect(margin, y, pageWidth - (margin * 2), diagBoxHeight, 'FD');
    doc.text(diagLines, margin + 3, y + 5);

    y += diagBoxHeight + 6;

    // 4. DETALLES DE MATERIAIS O REPUESTOS SOLICITADOS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text('2. REPUESTOS & MATERIALES REQUERIDOS:', margin, y);
    y += 4;

    const repuestos = reporte.repuestosFaltantes || [];
    if (repuestos.length > 0) {
      // Encabezado de tabla
      doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Cant', margin + 3, y + 4.5);
      doc.text('Descripción del Repuesto / Material', margin + 20, y + 4.5);
      doc.text('Prioridad', pageWidth - margin - (hideCosts ? 5 : 35), y + 4.5);
      if (!hideCosts) {
        doc.text('Estimado USD', pageWidth - margin - 3, y + 4.5, { align: 'right' });
      }

      y += 6;

      repuestos.forEach((item, index) => {
        const bg = index % 2 === 0 ? 250 : 242;
        doc.setFillColor(bg, bg, bg);
        doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`${item.cantidadRequerida} ${item.unidadMedida || 'Und'}`, margin + 3, y + 4.5);
        doc.text(item.repuestoNombre.slice(0, 50), margin + 20, y + 4.5);
        doc.text(item.prioridad || 'NORMAL', pageWidth - margin - (hideCosts ? 5 : 35), y + 4.5);
        
        if (!hideCosts) {
          const precio = item.precioTotalUSD ? `$${item.precioTotalUSD.toFixed(2)}` : (item.precioUnitarioUSD ? `$${item.precioUnitarioUSD.toFixed(2)}` : 'Pend. Cotizar');
          doc.text(precio, pageWidth - margin - 3, y + 4.5, { align: 'right' });
        }

        y += 6;
      });
    } else if (reporte.detallesManualesPedidos) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(reporte.detallesManualesPedidos, margin + 2, y + 4);
      y += 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text('No se registraron repuestos faltantes en esta inspección.', margin + 2, y + 4);
      y += 8;
    }

    y += 4;

    // 5. SECCIÓN DE FOTOGRAFÍAS Y EVIDENCIAS VISUALES EN OBRA
    const photos = reporte.photos || [];
    if (photos.length > 0) {
      if (y + 55 > pageHeight - margin) {
        doc.addPage();
        y = 14;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
      doc.text('3. EVIDENCIAS FOTOGRÁFICAS EN OBRA:', margin, y);
      y += 5;

      const photoWidth = 52;
      const photoHeight = 38;
      const cols = 3;

      photos.slice(0, 6).forEach((photoDataUrl, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const xPos = margin + col * (photoWidth + 6);
        const yPos = y + row * (photoHeight + 6);

        // Si excede la página, agregar página
        if (yPos + photoHeight > pageHeight - 30) {
          doc.addPage();
          y = 14;
        }

        try {
          doc.setDrawColor(200, 210, 220);
          doc.rect(xPos, yPos, photoWidth, photoHeight, 'D');
          doc.addImage(photoDataUrl, 'JPEG', xPos + 1, yPos + 1, photoWidth - 2, photoHeight - 2);
        } catch (e) {
          console.warn('Error al incrustar foto en PDF:', e);
        }
      });

      const totalRows = Math.ceil(Math.min(photos.length, 6) / cols);
      y += totalRows * (photoHeight + 6) + 4;
    }

    // 6. FIRMAS DE CONFORMIDAD
    if (y + 30 > pageHeight - margin) {
      doc.addPage();
      y = 14;
    }

    y += 6;
    doc.setDrawColor(200, 210, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // Linea Firma 1
    const firma1X = margin + 20;
    doc.line(firma1X, y, firma1X + 50, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text(reporte.tecnicoNombre, firma1X + 25, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('TÉCNICO DE CAMPO', firma1X + 25, y + 8, { align: 'center' });

    // Linea Firma 2
    const firma2X = pageWidth - margin - 70;
    doc.line(firma2X, y, firma2X + 50, y);
    doc.setFont('helvetica', 'bold');
    doc.text(reporte.clienteNombre.slice(0, 25), firma2X + 25, y + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('REPRESENTANTE DE LA OBRA', firma2X + 25, y + 8, { align: 'center' });

    // Pie de página
    doc.setFontSize(7);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(`Generado automáticamente por AXON ERP - ${empresa.nombreCorto} | Documento Oficial de Inspección`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Descargar
    doc.save(`Reporte_Tecnico_${reporte.correlativo.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generando PDF del reporte técnico:', error);
    throw error;
  }
};
