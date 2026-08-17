import { jsPDF } from 'jspdf';
import { CotizacionItem } from '../components/PresentacionTab';

interface DossierData {
  nombreComercial: string;
  empresa: string;
  rif: string;
  direccion: string;
  destinatario: string;
  cargoDestinatario: string;
  email: string;
  remitente: string;
}

interface CotizacionData extends DossierData {
  itemsCotizacion: CotizacionItem[];
  validezDias: number;
  condicionesPago: string;
  moneda: 'USD' | 'BS';
  tasaCambioBCV?: number;
}

/**
 * Genera un PDF vectorial de alta resolución para el Dossier Técnico de AXON ERP.
 */
export const exportDossierPDF = (data: DossierData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 14;
  let y = 14;

  // Colors
  const darkBg = [15, 23, 42]; // Slate 900
  const amberAccent = [217, 119, 6]; // Amber 600
  const goldLight = [251, 191, 36]; // Amber 400
  const textDark = [30, 41, 59]; // Slate 800
  const textGray = [100, 116, 139]; // Slate 500
  const cardBg = [248, 250, 252]; // Slate 50

  // 1. BANNER CABECERA
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AXON ERP', margin, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('GESTOR CREADOR DE SOFTWARE EMPRESARIAL MULTI-SECTOR', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Desarrollador: Manuel Guerra | Remitente: ${data.remitente}`, margin, 22);

  // BADGE DESTINATARIO
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 75, 4, 75, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text('DESTINATARIO OFICIAL', pageWidth - margin - 37.5, 8.5, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  const safeNombre = data.nombreComercial.length > 28 ? data.nombreComercial.substring(0, 28) + '...' : data.nombreComercial;
  doc.text(safeNombre, pageWidth - margin - 37.5, 13.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(`RIF: ${data.rif} | ${data.empresa}`, pageWidth - margin - 37.5, 18, { align: 'center' });

  y = 34;

  // 2. RECUADRO TITULO DEL DOSSIER
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'F');

  // Borde lateral dorado
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(margin, y, 3, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('DOSSIER TÉCNICO Y PRESENTACIÓN EJECUTIVA 2026', margin + 6, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('SISTEMA GESTOR AXON ERP - PLATAFORMA INTEGRAL MULTI-INDUSTRIA', margin + 6, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Presentado formalmente para ${data.empresa} (${data.nombreComercial})`, margin + 6, y + 17);

  y += 28;

  // 3. SECCIÓN 1: RESUMEN EJECUTIVO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('1. RESUMEN EJECUTIVO & ARQUITECTURA MULTI-INDUSTRIA', margin, y);
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  const p1 = `Estimados directores y equipo directivo de ${data.empresa} (${data.nombreComercial}):`;
  const p2 = `Nos complace presentar formalmente el Sistema AXON ERP / AXON Gestor, la plataforma creadora de software inteligente diseñada para adaptarse dinámicamente a diversas ramas industriales y comerciales, incluyendo Contabilidad y Finanzas, Seguros y Pólizas, Industria Textil y Confección, Mantenimiento Técnico y Transporte Vertical (Ascensores), así como Comercio, Importación y Distribución.`;
  const p3 = `Desarrollado por Manuel Guerra, AXON Gestor unifica en una sola arquitectura modular el control de operaciones en tiempo real, inventario multialmacén, facturación multimoneda (USD/Bs. BCV), reportes de campo con firma digital y catálogo interactivo con código QR.`;

  const linesP1 = doc.splitTextToSize(p1, pageWidth - (margin * 2));
  doc.text(linesP1, margin, y);
  y += linesP1.length * 4 + 1;

  const linesP2 = doc.splitTextToSize(p2, pageWidth - (margin * 2));
  doc.text(linesP2, margin, y);
  y += linesP2.length * 4 + 1;

  const linesP3 = doc.splitTextToSize(p3, pageWidth - (margin * 2));
  doc.text(linesP3, margin, y);
  y += linesP3.length * 4 + 5;

  // 4. SECCIÓN 2: MÓDULOS DE AXON ERP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('2. MÓDULOS Y CAPACIDADES ADAPTABLES DE AXON ERP', margin, y);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);

  y += 6;

  const modulos = [
    {
      titulo: 'Contabilidad, Finanzas & BCV',
      desc: 'Libros diarios, estados financieros, cuentas por cobrar/pagar, facturación multimoneda y sincronización con la tasa BCV oficial.'
    },
    {
      titulo: 'Seguros & Control de Pólizas',
      desc: 'Registro de asegurados, vencimientos de pólizas, seguimiento de siniestros, cuotas de cobertura y gestión de cobros.'
    },
    {
      titulo: 'Industria Textil & Confección',
      desc: 'Control de materia prima (telas, hilos), patrones de corte, trazabilidad por lote, color y talla, e inventario de producción.'
    },
    {
      titulo: 'Mantenimiento & Ascensores',
      desc: 'Hojas de ruta, guardias de emergencia, servicio técnico en sitio y reportes con evidencia fotográfica y firma digital.'
    },
    {
      titulo: 'Inventarios, QR & Despachos',
      desc: 'Control multialmacén, catálogo interactivo QR, vales de entrega, compras, kardex y reversión automática de stock.'
    },
    {
      titulo: 'Roles, Seguridad & Nube',
      desc: 'Aislamiento multi-empresa, seguridad por roles con PIN/Biometría y respaldo sincronizado en Google Sheets/Cloud.'
    }
  ];

  const colWidth = (pageWidth - (margin * 2) - 6) / 2;

  modulos.forEach((mod, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const boxX = margin + col * (colWidth + 6);
    const boxY = y + row * 22;

    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, colWidth, 19, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
    doc.text(`• ${mod.titulo}`, boxX + 3, boxY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const descLines = doc.splitTextToSize(mod.desc, colWidth - 6);
    doc.text(descLines, boxX + 3, boxY + 9.5);
  });

  y += 48;

  // 5. SECCIÓN 3: GARANTÍA TECNOLÓGICA Y RESPALDOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('3. GARANTÍA TECNOLÓGICA Y RESPALDOS', margin, y);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);

  y += 6;

  const garantias = [
    'Sincronización Cloud Automática: Integración transparente con Google Sheets / Excel para exportación masiva.',
    'Acceso Multi-dispositivo PWA: Funciona desde computadoras, tablets y teléfonos inteligentes sin instalación pesada.',
    'Arquitectura Resiliente: Funcionamiento garantizado con persistencia local en caso de caídas de conectividad.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  garantias.forEach((gar) => {
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.circle(margin + 2, y - 1, 1, 'F');
    const lines = doc.splitTextToSize(gar, pageWidth - (margin * 2) - 6);
    doc.text(lines, margin + 5, y);
    y += lines.length * 3.5 + 2;
  });

  y += 10;

  // 6. BLOQUE DE FIRMAS
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 16;

  const signatureColWidth = (pageWidth - (margin * 2) - 20) / 2;

  // Firma 1: Remitente / AXON ERP
  const x1 = margin + 10;
  doc.line(x1, y, x1 + signatureColWidth - 20, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.remitente, x1 + (signatureColWidth - 20) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('AXON ERP • Software Gestor', x1 + (signatureColWidth - 20) / 2, y + 8, { align: 'center' });
  doc.text('Desarrollo & Soporte ERP', x1 + (signatureColWidth - 20) / 2, y + 11.5, { align: 'center' });

  // Firma 2: Destinatario / Cliente
  const x2 = margin + signatureColWidth + 10;
  doc.line(x2, y, x2 + signatureColWidth - 20, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.destinatario, x2 + (signatureColWidth - 20) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(data.empresa, x2 + (signatureColWidth - 20) / 2, y + 8, { align: 'center' });
  doc.text(data.nombreComercial, x2 + (signatureColWidth - 20) / 2, y + 11.5, { align: 'center' });

  // FOOTER
  const footerY = pageHeight - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Dossier Ejecutivo generado por AXON ERP • ${fechaHoy} • Página 1 de 1`, pageWidth / 2, footerY, { align: 'center' });

  // Descargar PDF
  const safeFilename = `Dossier_Tecnico_AXON_ERP_${data.nombreComercial.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

/**
 * Genera un PDF vectorial de alta resolución para la Cotización de Servicios AXON ERP.
 */
export const exportCotizacionPresentacionPDF = (data: CotizacionData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const darkBg = [15, 23, 42]; // Slate 900
  const emeraldAccent = [5, 150, 105]; // Emerald 600
  const emeraldLight = [110, 231, 183]; // Emerald 300
  const textDark = [30, 41, 59];
  const textGray = [100, 116, 139];

  // Totales
  const totalMercadoUsd = data.itemsCotizacion.reduce((acc, i) => acc + i.precioMercadoUsd, 0);
  const totalAxonUsd = data.itemsCotizacion.reduce((acc, i) => acc + i.precioAxonUsd, 0);
  const totalAhorroUsd = totalMercadoUsd - totalAxonUsd;
  const porcentajeAhorro = totalMercadoUsd > 0 ? Math.round((totalAhorroUsd / totalMercadoUsd) * 100) : 0;

  const formatUsd = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  const formatBs = (valUsd: number) => {
    const rate = data.tasaCambioBCV || 1;
    return `Bs. ${(valUsd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. BANNER CABECERA
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AXON ERP', margin, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(emeraldLight[0], emeraldLight[1], emeraldLight[2]);
  doc.text('PROPUESTA ECONÓMICA DE SOFTWARE GESTOR', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Remitente: ${data.remitente}`, margin, 22);

  // BADGE COTIZACIÓN
  const currentYear = new Date().getFullYear();
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(pageWidth - margin - 70, 4, 70, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`COTIZACIÓN N° AXON-${currentYear}-084`, pageWidth - margin - 35, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(209, 250, 229);
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Fecha: ${fechaHoy}`, pageWidth - margin - 35, 15, { align: 'center' });
  doc.text(`Validez: ${data.validezDias} días continuos`, pageWidth - margin - 35, 19, { align: 'center' });

  y = 34;

  // 2. DATOS DEL CLIENTE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'FD');

  const halfWidth = (pageWidth - (margin * 2)) / 2;

  // Columna Izquierda
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('CLIENTE BENEFICIARIO:', margin + 4, y + 5);

  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.nombreComercial, margin + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${data.empresa} | RIF: ${data.rif}`, margin + 4, y + 15);

  // Columna Derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text('ATENCIÓN A:', margin + halfWidth + 4, y + 5);

  doc.setFontSize(8.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.destinatario, margin + halfWidth + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${data.cargoDestinatario} | ${data.email}`, margin + halfWidth + 4, y + 15);

  y += 27;

  // 3. AVISO DE DESCUENTO
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text(`TARIFA PREFERENCIAL CON > ${porcentajeAhorro}% DE AHORRO DIRECTO`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text(`Inversión ajustada exclusivamente para ${data.nombreComercial} por debajo de los costos estándar del mercado.`, margin + 4, y + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(`Ahorro: ${formatUsd(totalAhorroUsd)}`, pageWidth - margin - 4, y + 8, { align: 'right' });

  y += 19;

  // 4. TABLA DE CONCEPTOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('DETALLE DE CONCEPTOS E INVERSIÓN AXON ERP', margin, y);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);

  y += 5;

  // Header Tabla
  const col1 = 90;
  const col2 = 30;
  const col3 = 35;
  const col4 = 27;

  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Concepto / Servicio', margin + 3, y + 4.5);
  doc.text('Ref. Mercado', margin + col1 + col2 / 2, y + 4.5, { align: 'center' });
  doc.text('Tarifa AXON ERP', margin + col1 + col2 + col3 / 2, y + 4.5, { align: 'center' });
  doc.text('Ahorro', margin + col1 + col2 + col3 + col4 / 2, y + 4.5, { align: 'center' });

  y += 7;

  // Filas Tabla
  data.itemsCotizacion.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    const rowHeight = 11;

    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - (margin * 2), rowHeight, 'FD');

    // Concepto & Descripcion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(item.concepto, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    const descShort = item.descripcion.length > 65 ? item.descripcion.substring(0, 65) + '...' : item.descripcion;
    doc.text(descShort, margin + 3, y + 8);

    // Ref Mercado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(formatUsd(item.precioMercadoUsd), margin + col1 + col2 / 2, y + 6.5, { align: 'center' });

    // Tarifa AXON
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text(formatUsd(item.precioAxonUsd), margin + col1 + col2 + col3 / 2, y + 6.5, { align: 'center' });

    // Ahorro
    const ahorroItem = item.precioMercadoUsd - item.precioAxonUsd;
    const pctItem = item.precioMercadoUsd > 0 ? Math.round((ahorroItem / item.precioMercadoUsd) * 100) : 0;
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`-${pctItem}%`, margin + col1 + col2 + col3 + col4 / 2, y + 6.5, { align: 'center' });

    y += rowHeight;
  });

  y += 6;

  // 5. TOTALES Y CONDICIONES
  const boxWidthLeft = 100;
  const boxWidthRight = (pageWidth - (margin * 2)) - boxWidthLeft - 6;

  // Términos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidthLeft, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('TÉRMINOS Y CONDICIONES DE PAGO:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const condLines = doc.splitTextToSize(data.condicionesPago, boxWidthLeft - 6);
  doc.text(condLines, margin + 3, y + 9.5);

  if (data.tasaCambioBCV) {
    doc.setFontSize(6);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(`* Tasa referencial BCV: Bs. ${data.tasaCambioBCV.toFixed(2)} / USD`, margin + 3, y + 22);
  }

  // Totales Box
  const rightX = margin + boxWidthLeft + 6;
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(rightX, y, boxWidthRight, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Subtotal Mercado:', rightX + 4, y + 6);
  doc.text(formatUsd(totalMercadoUsd), rightX + boxWidthRight - 4, y + 6, { align: 'right' });

  doc.setTextColor(110, 231, 183);
  doc.text(`Descuento Especial (-${porcentajeAhorro}%):`, rightX + 4, y + 11);
  doc.text(`-${formatUsd(totalAhorroUsd)}`, rightX + boxWidthRight - 4, y + 11, { align: 'right' });

  doc.setDrawColor(51, 65, 85);
  doc.line(rightX + 4, y + 14, rightX + boxWidthRight - 4, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(251, 191, 36);
  doc.text('TOTAL AXON ERP:', rightX + 4, y + 19);

  doc.setFontSize(9.5);
  doc.setTextColor(110, 231, 183);
  doc.text(formatUsd(totalAxonUsd), rightX + boxWidthRight - 4, y + 19, { align: 'right' });

  if (data.moneda === 'BS' || data.tasaCambioBCV) {
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(`Equivalente: ${formatBs(totalAxonUsd)}`, rightX + boxWidthRight - 4, y + 23.5, { align: 'right' });
  }

  y += 32;

  // 6. FIRMAS
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 14;

  const sigWidth = (pageWidth - (margin * 2) - 20) / 2;

  const x1 = margin + 10;
  doc.line(x1, y, x1 + sigWidth - 20, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.remitente, x1 + (sigWidth - 20) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.text('AXON ERP • Cotización Oficial', x1 + (sigWidth - 20) / 2, y + 8, { align: 'center' });

  const x2 = margin + sigWidth + 10;
  doc.line(x2, y, x2 + sigWidth - 20, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text(data.destinatario, x2 + (sigWidth - 20) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(data.nombreComercial, x2 + (sigWidth - 20) / 2, y + 8, { align: 'center' });

  // FOOTER
  const footerY = pageHeight - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Cotización Oficial generada por AXON ERP • Válida por ${data.validezDias} días • Página 1 de 1`, pageWidth / 2, footerY, { align: 'center' });

  const safeFilename = `Cotizacion_AXON_ERP_${data.nombreComercial.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

/**
 * Genera un PDF vectorial oficial con la Carta de Presentación y Virtudes de AXON Gestor
 * siguiendo exactamente la lógica visual y estructura de los comprobantes/notas.
 */
export const exportCartaPresentacionPDF = (data: DossierData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 216mm x 279mm
  });

  const isAnulado = false;

  // 1. Header Banner (Slate-900 background)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 216, 32, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.nombreComercial || 'AXON GESTOR ERP', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`RIF: ${data.rif || 'J-50348291-0'} | ${data.direccion || 'Plataforma de Gestión Empresarial & Servicio Técnico'}`, 14, 18);
  doc.text('SISTEMA INTEGRAL MULTI-EMPRESA • CONTROL OPERATIVO & MANTENIMIENTO', 14, 23);
  doc.text('División: Dirección de Software & Soluciones Tecnológicas', 14, 27);

  // Document Badge (Cyan rounded rect like active notas)
  doc.setFillColor(6, 182, 212); // Cyan-500
  doc.roundedRect(138, 6, 64, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CARTA DE PRESENTACIÓN', 170, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('VIRTUDES & SECTORES', 170, 18, { align: 'center' });

  // 2. Metadata Box (exact style as HistorialNotasTab)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 38, 188, 32, 2, 2, 'FD');

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE EMISIÓN:', 18, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(hoy, 58, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE / DESTINATARIO:', 18, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.destinatario || 'Atención a la Gerencia'} (${data.nombreComercial})`, 58, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('ELABORADO POR:', 18, 59);
  doc.setFont('helvetica', 'normal');
  doc.text('Manuel Guerra (Desarrollo AXON Gestor)', 58, 59);

  doc.setFont('helvetica', 'bold');
  doc.text('ASUNTO COMPROBANTE:', 18, 66);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe Ejecutivo de Virtudes Técnicas, Funcionalidades y Adaptabilidad Sectorial', 58, 66);

  let currentY = 76;

  // 3. Section: Introducción General
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, currentY, 188, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. RESUMEN EJECUTIVO & ARQUITECTURA MULTI-INDUSTRIA', 18, currentY + 5);

  currentY += 12;

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const introText = 'AXON Gestor es una plataforma gestora y creadora de software empresarial modular desarrollada por Manuel Guerra, diseñada para adaptarse a diversas industrias como Contabilidad y Finanzas, Seguros y Pólizas, Industria Textil y Confección, Mantenimiento Operativo y Ascensores, así como Distribución y Comercio General. Unifica la gestión administrativa, inventario multialmacén, facturación multimoneda (USD/Bs. BCV), reportes de campo con firmas digitales y catálogo QR en una sola infraestructura resiliente.';
  const splitIntro = doc.splitTextToSize(introText, 180);
  doc.text(splitIntro, 18, currentY);

  currentY += (splitIntro.length * 4.5) + 6;

  // 4. Section: Table of Virtues
  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY, 188, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('2. VIRTUDES Y CAPACIDADES DESTACADAS DEL SISTEMA', 18, currentY + 5);

  currentY += 10;

  // Header tabla virtudes
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, currentY, 188, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MÓDULO / FUNCIONALIDAD', 18, currentY + 5);
  doc.text('DESCRIPCIÓN DE LA VIRTUD OPERATIVA', 75, currentY + 5);

  currentY += 10;

  const virtudes = [
    {
      mod: 'Contabilidad & Finanzas',
      desc: 'Libros diarios, balances, cuentas por cobrar/pagar, facturación multimoneda (USD/Bs.) y sincronización con la tasa oficial BCV.'
    },
    {
      mod: 'Seguros & Pólizas',
      desc: 'Control de asegurados, seguimiento de coberturas, vencimiento de pólizas, reclamos de siniestros y cuotas de cobro.'
    },
    {
      mod: 'Industria Textil & Confección',
      desc: 'Trazabilidad de telas e insumos, patrones de producción, control por lote, color y talla, y gestión de manufactura.'
    },
    {
      mod: 'Mantenimiento & Campo',
      desc: 'Hojas de ruta para técnicos de ascensores/equipos, reportes con evidencia fotográfica en vivo y firmas digitales en sitio.'
    },
    {
      mod: 'Inventario & Despacho QR',
      desc: 'Control multialmacén, catálogo interactivo QR, vales de entrega, compras, alertas de stock mínimo y reversión de inventario.'
    },
    {
      mod: 'Multi-Empresa & Nube',
      desc: 'Aislamiento seguro de datos por empresa, roles con PIN/Biometría y respaldo automatizado en la nube.'
    }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  virtudes.forEach((v) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(v.mod, 18, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(v.desc, 120);
    doc.text(splitDesc, 75, currentY);

    currentY += Math.max((splitDesc.length * 4), 5.5);
  });

  currentY += 3;

  // 5. Section: Sectores de Adaptación
  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY, 188, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('3. SECTORES EMPRESARIALES DE APLICACIÓN Y ADAPTABILIDAD', 18, currentY + 5);

  currentY += 10;

  // Header tabla sectores
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 188, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SECTOR INDUSTRIAL', 18, currentY + 5);
  doc.text('ENFOQUE DE ADAPTABILIDAD EN EL SISTEMA', 75, currentY + 5);

  currentY += 10;

  const sectores = [
    {
      sec: 'Contabilidad & Finanzas',
      foc: 'Gestión fiscal, asientos diarios, estados de cuenta, nómina y facturación multimoneda ajustada al BCV.'
    },
    {
      sec: 'Seguros & Correduría',
      foc: 'Administración de pólizas de vida, salud, autos, renovación automática de primas y seguimiento de siniestros.'
    },
    {
      sec: 'Textil, Confección & Calzado',
      foc: 'Control de insumos de corte, confección, catálogo de prendas, matriz de color/talla y ventas al mayor y detal.'
    },
    {
      sec: 'Ascensores & Mantenimiento',
      foc: 'Mantenimiento preventivo mensual, control de fallas, guardias de emergencia y venta/instalación de repuestos.'
    },
    {
      sec: 'Comercio & Distribución',
      foc: 'Venta por mostrador o catálogo QR, inventario en tiempo real, múltiples precios (mayor/detal) y órdenes de despacho.'
    }
  ];

  sectores.forEach((s) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(s.sec, 18, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitFoc = doc.splitTextToSize(s.foc, 120);
    doc.text(splitFoc, 75, currentY);

    currentY += Math.max((splitFoc.length * 4), 6);
  });

  // 6. Signatures Area (exact geometry and format as HistorialNotasTab)
  const sigY = Math.max(currentY + 12, 242);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(25, sigY, 90, sigY);
  doc.line(125, sigY, 190, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EMITIDO POR / DIRECCIÓN AXON GESTOR', 57, sigY + 5, { align: 'center' });
  doc.text('RECIBIDO CONFORME / CLIENTE', 157, sigY + 5, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento Oficial de Presentación AXON Gestor • Generado en formato vectorial tipo Comprobante', 108, 272, { align: 'center' });

  // Save PDF
  const safeFilename = `Carta_Presentacion_AXON_Gestor_${data.nombreComercial.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

/**
 * Genera un PDF Ejecutivo de Análisis Comparativo de Mercado (AXON ERP vs Odoo, SAP & Software Tradicional)
 * detallando las virtudes de la adaptabilidad multi-ramo y la tecnología del gestor.
 */
export const exportComparativoMercadoPDF = (data: DossierData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 12;

  // Palette
  const darkBg = [15, 23, 42]; // Slate 900
  const amberAccent = [217, 119, 6]; // Amber 600
  const goldLight = [251, 191, 36]; // Amber 400
  const emeraldAccent = [16, 185, 129]; // Emerald 500
  const textDark = [30, 41, 59]; // Slate 800
  const textGray = [100, 116, 139]; // Slate 500

  // ==================== PAGE 1: VIRTUDES DEL GESTOR ADAPTABLE ====================
  let y = 12;

  // Banner Superior
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AXON ERP - PLATAFORMA GESTORA', margin, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('INFORME EJECUTIVO DE VIRTUDES ADAPTABLES Y ANÁLISIS COMPARATIVO DE MERCADO', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Creador: Manuel Guerra | Remitente: ${data.remitente}`, margin, 22);

  // Badge Destinatario
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 75, 4, 75, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text('DESTINATARIO OFICIAL', pageWidth - margin - 37.5, 8.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  const safeNombre = data.nombreComercial.length > 28 ? data.nombreComercial.substring(0, 28) + '...' : data.nombreComercial;
  doc.text(safeNombre, pageWidth - margin - 37.5, 13.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text(`RIF: ${data.rif} | ${data.empresa}`, pageWidth - margin - 37.5, 18, { align: 'center' });

  y = 33;

  // Recuadro Titular
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 20, 2, 2, 'F');

  // Borde lateral dorado
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(margin, y, 3, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('ESTUDIO DE COMPETITIVIDAD Y SUPERIORIDAD ARQUITECTÓNICA', margin + 6, y + 5.5);

  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('¿POR QUÉ AXON ERP ES MÁS COMPETITIVO Y ADAPTABLE QUE ODOO Y SAP?', margin + 6, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Evaluación técnica-financiera de adaptabilidad multi-ramo, costos de propiedad e IA operativa.', margin + 6, y + 16);

  y += 25;

  // Sección 1: Virtudes del Gestor Adaptable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('1. VIRTUDES ESTRATÉGICAS Y ARQUITECTURA ADAPTABLE DE AXON ERP', margin, y);
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);

  y += 6;

  const virtudesKey = [
    {
      titulo: '1. Adaptabilidad Multi-Ramo Inmediata',
      desc: 'AXON ERP está construido sobre una arquitectura modular maleable. Permite operar simultáneamente o transicionar entre Repuestos de Ascensores, Mantenimiento Técnico de Campo, Contabilidad & Finanzas, Seguros & Pólizas, Industria Textil/Confección, Almacenes Multiseptoriales y Comercialización General, sin tener que reprogramar el núcleo ni comprar licencias adicionales.'
    },
    {
      titulo: '2. Inteligencia Artificial Gemini Integrada en Tiempo Real',
      desc: 'Incorpora modelos de IA para análisis de precios competitivos de mercado en vivo, inspección visual automática de fotos de componentes cargadas en la nube y procesamiento inteligente de reportes de fallas. Odoo y SAP cobran módulos adicionales o requieren servicios externos para lograr esta capacidad.'
    },
    {
      titulo: '3. Autonomía Operativa 100% Offline con Sincronización Diferida',
      desc: 'Garantiza la operatividad ininterrumpida en galpones, obras o zonas con falla de señal. Los técnicos e inventariistas registran vales, auditorías y servicios sin internet, y el sistema sincroniza automáticamente con Google Sheets / Nube al detectar conexión.'
    },
    {
      titulo: '4. Modelo Financiero Transparente (Cero Cobro Abusivo por Usuario)',
      desc: 'Elimina las penalizaciones financieras del software SaaS tradicional. Mientras Odoo y SAP incrementan exponencialmente su costo mensual por cada usuario nuevo, AXON ERP ofrece una infraestructura accesible y rentable con licencias planas o únicas.'
    },
    {
      titulo: '5. Integración Fotográfica, Trazabilidad QR & Comprobantes Digitales',
      desc: 'Registra componentes con foto pública en la nube, etiquetas QR permanentes para catálogo interactivo, firmas digitales en pantalla para notas de despacho y facturación multimoneda (USD / Bs. BCV).'
    }
  ];

  virtudesKey.forEach((v) => {
    // Card contenedor de cada virtud
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    
    const linesDesc = doc.splitTextToSize(v.desc, pageWidth - (margin * 2) - 8);
    const cardHeight = 8 + (linesDesc.length * 3.6);

    doc.roundedRect(margin, y, pageWidth - (margin * 2), cardHeight, 1.5, 1.5, 'FD');

    // Borde izquierdo verdoso/dorado
    doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
    doc.rect(margin, y, 2, cardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text(v.titulo, margin + 5, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(linesDesc, margin + 5, y + 9.5);

    y += cardHeight + 3.5;
  });

  // Footer Pagina 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Oficial AXON Gestor • Página 1 de 2 • Solución Adaptable para ${data.nombreComercial}`, pageWidth / 2, 287, { align: 'center' });

  // ==================== PAGE 2: MATRIZ COMPARATIVA CON ODOO, SAP Y TRADICIONAL ====================
  doc.addPage();
  y = 12;

  // Banner Superior Pagina 2
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('MATRIZ COMPARATIVA DE MERCADO: AXON ERP VS. COMPETENCIA', margin, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('EVALUACIÓN DE CARACTERÍSTICAS TÉCNICAS, COSTOS Y FACILIDAD OPERATIVA', margin, 16);

  y = 26;

  // Encabezados de la Tabla Comparativa
  const colW = [38, 38, 36, 37, 37]; // Suma: 186mm (pageWidth 210 - margin 24)
  const colX = [
    margin,
    margin + colW[0],
    margin + colW[0] + colW[1],
    margin + colW[0] + colW[1] + colW[2],
    margin + colW[0] + colW[1] + colW[2] + colW[3]
  ];

  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('CRITERIO / FUNCIÓN', colX[0] + 2, y + 5.5);
  
  // Header AXON destacado
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(colX[1], y, colW[1], 8, 'F');
  doc.text('AXON GESTOR ERP', colX[1] + (colW[1] / 2), y + 5.5, { align: 'center' });

  doc.setTextColor(203, 213, 225);
  doc.text('ODOO ERP', colX[2] + (colW[2] / 2), y + 5.5, { align: 'center' });
  doc.text('SAP BUSINESS ONE', colX[3] + (colW[3] / 2), y + 5.5, { align: 'center' });
  doc.text('SOFTWARE LEGACY', colX[4] + (colW[4] / 2), y + 5.5, { align: 'center' });

  y += 8;

  // Filas Comparativas
  const filasComparativas = [
    {
      criterio: 'Modelo de Licenciamiento',
      axon: 'Sin cobro por usuario adicional. Tarifa plana o pago único adaptable.',
      odoo: 'Cobro mensual por usuario ($12-$35 USD/mes/user) + pago por apps.',
      sap: '$1,000 - $3,000+ USD por licencia de usuario + mantenimiento anual.',
      legacy: 'Licencia fija por PC local o pago de soporte técnico recurrente.'
    },
    {
      criterio: 'Adaptabilidad Multi-Sector',
      axon: '100% Dinámico. Se adapta en horas a cualquier ramo comercial o técnico.',
      odoo: 'Requiere desarrollo de apps personalizadas en Odoo Studio (Costoso).',
      sap: 'Rígido. Requiere meses de consultoría autorizada para cambios.',
      legacy: 'Inflexible. Si el negocio cambia o se expande, queda obsoleto.'
    },
    {
      criterio: 'Inteligencia Artificial Nativa',
      axon: 'IA Gemini integrada (Precios competitivos, análisis de fotos y reportes).',
      odoo: 'Requiere plugins de terceros o integraciones con cobro extra.',
      sap: 'Limitado a versiones Enterprise de muy alto presupuesto.',
      legacy: 'Nula. Cero capacidades o algoritmos de inteligencia artificial.'
    },
    {
      criterio: 'Modo Offline & Sincronización',
      axon: '100% Funcional sin internet con sincronización diferida automática.',
      odoo: 'Dependiente de conexión constante a la nube o servidor central.',
      sap: 'Requiere enlace VPN o servidor dedicado permanentemente en línea.',
      legacy: 'Limitado a la red local del negocio (LAN física de la oficina).'
    },
    {
      criterio: 'Facilidad de Uso e Implementación',
      axon: 'Puesta en marcha en días. Interfaz moderna, clara y responsive.',
      odoo: 'Implementación de semanas o meses. Curva de aprendizaje media/alta.',
      sap: '6 a 12 meses de implementación intensiva con consultores.',
      legacy: 'Sistemas con pantallas complejas y capacitación prolongada.'
    },
    {
      criterio: 'Gestión de Repuestos & QR',
      axon: 'Fotos en la nube, etiquetas QR nativas y sugerencias de precio en vivo.',
      odoo: 'Módulos adicionales de inventario/código de barras requeridos.',
      sap: 'Gestión compleja de anexos y tablas de artículos pesadas.',
      legacy: 'Solo texto y código estático sin catálogo visual ni QR.'
    },
    {
      criterio: 'Multimoneda & Fiscal (USD / Bs)',
      axon: 'Facturación y presupuestos USD / Bs en vivo con tasa oficial BCV.',
      odoo: 'Requiere configuración compleja de multimoneda y localización.',
      sap: 'Configuración contable avanzada por consultores locales.',
      legacy: 'Manejo manual de la tasa de cambio o parches de código.'
    },
    {
      criterio: 'Costo Estimado de Software en Mercado (Licencias + Impl.)',
      axon: '$300 - $800 USD (Pago único / tarifa plana única, sin cargos mensuales).',
      odoo: '$1,500 - $8,000+ USD/año ($12-$35/mes/user + $2,000+ implantación).',
      sap: '$12,000 - $40,000+ USD ($1,500-$3,200 por usuario + $10,000+ impl.).',
      legacy: '$1,200 - $3,500 USD (Licencias por PC local + soporte anual obligado).'
    },
    {
      criterio: 'Precio Estimado por Hora de Programación / Personalización',
      axon: '$15 - $25 USD / h (o $0 USD en actualizaciones estándar del gestor).',
      odoo: '$40 - $85 USD / h (Partner / Consultor Certificado Python & Odoo).',
      sap: '$100 - $200+ USD / h (Consultor Especializado ABAP / SAP B1).',
      legacy: '$30 - $60 USD / h (Desarrollador externo sin garantía de continuidad).'
    }
  ];

  filasComparativas.forEach((fila, idx) => {
    const isAlt = idx % 2 === 1;
    
    // Split text for each column
    const txtCrit = doc.splitTextToSize(fila.criterio, colW[0] - 3);
    const txtAxon = doc.splitTextToSize(fila.axon, colW[1] - 3);
    const txtOdoo = doc.splitTextToSize(fila.odoo, colW[2] - 3);
    const txtSap = doc.splitTextToSize(fila.sap, colW[3] - 3);
    const txtLeg = doc.splitTextToSize(fila.legacy, colW[4] - 3);

    const maxLines = Math.max(txtCrit.length, txtAxon.length, txtOdoo.length, txtSap.length, txtLeg.length);
    const rowH = Math.max(8, maxLines * 3.4 + 3);

    // Fondo fila
    doc.setFillColor(isAlt ? 241 : 250, isAlt ? 245 : 250, isAlt ? 249 : 250);
    doc.rect(margin, y, pageWidth - (margin * 2), rowH, 'F');

    // Destacado columna AXON
    doc.setFillColor(254, 243, 199); // Amber 100 soft
    doc.rect(colX[1], y, colW[1], rowH, 'F');

    // Bordes de celda
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, pageWidth - (margin * 2), rowH, 'D');
    doc.line(colX[1], y, colX[1], y + rowH);
    doc.line(colX[2], y, colX[2], y + rowH);
    doc.line(colX[3], y, colX[3], y + rowH);
    doc.line(colX[4], y, colX[4], y + rowH);

    // Textos
    doc.setFontSize(6.8);

    // Criterio
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text(txtCrit, colX[0] + 1.5, y + 4);

    // Axon
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
    doc.text(txtAxon, colX[1] + 1.5, y + 4);

    // Odoo
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(txtOdoo, colX[2] + 1.5, y + 4);

    // Sap
    doc.text(txtSap, colX[3] + 1.5, y + 4);

    // Legacy
    doc.text(txtLeg, colX[4] + 1.5, y + 4);

    y += rowH;
  });

  y += 5;

  // Box Conclusión Final
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'F');

  doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.rect(margin, y, 3, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2]);
  doc.text('CONCLUSIÓN Y DECLARACIÓN DE VALOR EMPRESARIAL', margin + 6, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(241, 245, 249);
  const conclusionText = `Adoptar AXON ERP representa una reducción del Costo Total de Propiedad (TCO) superior al 60% frente a Odoo y SAP, manteniendo la máxima flexibilidad operativa para escalar a cualquier sector económico. Es un gestor integral preparado para el futuro comercial, fiscal y tecnológico de ${data.empresa}.`;
  const splitConclusion = doc.splitTextToSize(conclusionText, pageWidth - (margin * 2) - 12);
  doc.text(splitConclusion, margin + 6, y + 10.5);

  y += 28;

  // Firmas
  const sigY = Math.min(y + 8, 260);
  doc.setDrawColor(203, 213, 225);
  doc.line(25, sigY, 90, sigY);
  doc.line(125, sigY, 190, sigY);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MANUEL GUERRA / DESARROLLO AXON ERP', 57, sigY + 4, { align: 'center' });
  doc.text(`ACEPTADO POR / GERENCIA ${data.nombreComercial.toUpperCase()}`, 157, sigY + 4, { align: 'center' });

  // Footer Pagina 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Oficial AXON Gestor • Página 2 de 2 • Comparativo de Mercado de Alta Definición`, pageWidth / 2, 287, { align: 'center' });

  // Guardar PDF
  const safeFilename = `AXON_ERP_Comparativo_Mercado_vs_Odoo_SAP_${data.nombreComercial.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};



