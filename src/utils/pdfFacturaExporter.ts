import { jsPDF } from 'jspdf';
import { Factura, EmpresaConfig } from '../types';
import { CURRENT_COMPANY, CompanyInfo } from '../config/companyConfig';

/**
 * Función auxiliar para formatear montos en formato venezolano (1.234,56)
 */
function formatPdfMoney(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Dibuja el logotipo oficial de Tecno Elevatev C.A. directamente en el documento PDF
 */
export function drawCompanyLogoPDF(
  doc: jsPDF,
  x: number,
  y: number,
  width: number = 55,
  height: number = 16
) {
  try {
    doc.saveGraphicsState();

    // Óvalo azul central
    const ovalCx = x + width * 0.42;
    const ovalCy = y + height * 0.48;
    const rx = width * 0.22;
    const ry = height * 0.40;

    doc.setDrawColor(29, 112, 184); // #1D70B8
    doc.setLineWidth(0.6);
    doc.ellipse(ovalCx, ovalCy, rx, ry, 'S');

    // Texto "TECNO"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(29, 112, 184);
    doc.text('TECNO', ovalCx, y + height * 0.28, { align: 'center' });

    // Texto principal "ELEVATEV" con tipografía oscura
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 43, 73); // #002B49

    doc.text('EL', x + width * 0.08, y + height * 0.68);
    doc.text('E', x + width * 0.24, y + height * 0.68);

    // Triángulos de V y A
    doc.setFillColor(0, 43, 73);
    doc.setDrawColor(29, 112, 184);
    doc.setLineWidth(0.4);

    // Triángulo invertido V
    const vX = x + width * 0.34;
    const vY = y + height * 0.38;
    doc.triangle(vX, vY, vX + 5, vY, vX + 2.5, vY + 5.5, 'FD');

    // Triángulo A
    const aX = x + width * 0.44;
    const aY = y + height * 0.68;
    doc.triangle(aX, aY, aX + 5, aY, aX + 2.5, aY - 5.5, 'FD');

    // "TEV"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 43, 73);
    doc.text('TEV', x + width * 0.54, y + height * 0.68);

    // Subtítulo RIF
    doc.setFont('courier', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(0, 43, 73);
    doc.text('RIF: J-40382654-4', ovalCx, y + height * 0.90, { align: 'center' });

    doc.restoreGraphicsState();
  } catch (e) {
    console.error('Error drawing company logo on PDF', e);
  }
}

/**
 * Genera el documento PDF exacto de la Factura según la especificación Python ReportLab:
 * - Margen 0.5 inch (12.7 mm)
 * - Título FACTURA centrado (Helvetica-Bold 14pt)
 * - N° Factura, Emisión y Concepto
 * - Bloque DATOS DEL CLIENTE / OBSERVACIONES (Tasa BCV, condiciones)
 * - Tabla de ítems con Cant., Descripción, Precio Unit. Bs. y Total Bs.
 * - Totales duales ($ USD y Bs.) alineados a la derecha
 */
export function generateInvoicePDF(
  factura: Factura,
  empresa: EmpresaConfig | CompanyInfo = CURRENT_COMPANY,
  tasaCambioBCV: number = 36.5
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt', // 72 pt/inch
    format: 'letter' // 612 x 792 pt
  });

  const pageWidth = 612;
  const leftMargin = 36; // 0.5 * 72 pt
  const rightMargin = 36;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 540 pt

  let y = 32;

  // 1. ENCABEZADO / MEMBRETE CON LOGO OFICIAL
  drawCompanyLogoPDF(doc, leftMargin, y, 140, 42);

  const nombreEmpresa = (empresa.nombre || empresa.nombreCorto || CURRENT_COMPANY.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();
  const rifEmpresa = empresa.rif || 'J-40382654-4';
  const dirEmpresa = empresa.direccion || CURRENT_COMPANY.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
  const telEmpresa = empresa.telefono || CURRENT_COMPANY.telefono || '(0412)983.49.95 / (0412)619.02.55';

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(nombreEmpresa, pageWidth - rightMargin, y + 10, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`RIF: ${rifEmpresa}`, pageWidth - rightMargin, y + 21, { align: 'right' });
  doc.text(dirEmpresa, pageWidth - rightMargin, y + 31, { align: 'right' });
  doc.text(`Telefono: ${telEmpresa}`, pageWidth - rightMargin, y + 41, { align: 'right' });

  y += 55;

  // Línea divisoria suave
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 20;

  // 2. TÍTULO FACTURA CENTRADO (Helvetica-Bold 14, leading 16)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(factura.tipoComprobante || 'FACTURA', pageWidth / 2, y, { align: 'center' });

  y += 18;

  // 3. META TABLE (N° Factura, Emisión, Concepto)
  const tasaEfectiva = factura.tasaCambioBs > 0 ? factura.tasaCambioBs : tasaCambioBCV;
  const numFactura = factura.correlativo || '-';
  const fechaEmision = factura.fecha || '-';
  const concepto = factura.concepto || factura.division || 'Mantenimiento y Servicios Técnicos';

  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('N° Factura: ', leftMargin, y);
  doc.setFont('Courier', 'normal');
  doc.text(numFactura, leftMargin + 65, y);

  doc.setFont('Courier', 'bold');
  doc.text('Emisión: ', leftMargin + contentWidth * 0.74, y);
  doc.setFont('Courier', 'normal');
  doc.text(fechaEmision, leftMargin + contentWidth * 0.74 + 48, y);

  y += 12;
  doc.setFont('Courier', 'bold');
  doc.text('Concepto: ', leftMargin, y);
  doc.setFont('Courier', 'normal');
  doc.text(concepto, leftMargin + 55, y);

  y += 16;

  // 4. CLIENT & OBSERVATIONS TABLE
  const col1Width = contentWidth * 0.62;
  const col2Width = contentWidth * 0.38;
  const col2X = leftMargin + col1Width;

  // Header DATOS DEL CLIENTE | OBSERVACIONES (Helvetica-Bold 9)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('DATOS DEL CLIENTE', leftMargin, y);
  doc.text('OBSERVACIONES', col2X, y);

  y += 3;
  // Línea debajo del encabezado de secciones
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, leftMargin + col1Width - 10, y);
  doc.line(col2X, y, pageWidth - rightMargin, y);

  y += 11;

  // Datos del Cliente (Courier 8)
  const clientStartY = y;
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const writeBoldLabel = (label: string, value: string, currentX: number, currentY: number) => {
    doc.setFont('Courier', 'bold');
    doc.text(label, currentX, currentY);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont('Courier', 'normal');
    doc.text(value, currentX + labelWidth, currentY);
  };

  writeBoldLabel('Cliente: ', factura.clienteNombre || '-', leftMargin, y);
  y += 11;
  writeBoldLabel('ID: ', factura.clienteRif || 'J-00000000', leftMargin, y);
  y += 11;
  writeBoldLabel('Telefono: ', factura.clienteTelefono || '-', leftMargin, y);
  y += 11;
  writeBoldLabel('Email: ', factura.clienteEmail || '-', leftMargin, y);
  y += 11;
  writeBoldLabel('Direccion: ', `"${factura.clienteDireccion || 'Caracas, Venezuela'}"`, leftMargin, y);

  // Observaciones a la derecha
  let obsY = clientStartY;
  writeBoldLabel('Condiciones de pago: ', factura.condicionesPago || 'CONTADO', col2X, obsY);
  obsY += 11;
  writeBoldLabel('Tasa B.C.V.: ', `Bs. ${formatPdfMoney(tasaEfectiva)}`, col2X, obsY);
  obsY += 11;
  writeBoldLabel('Fecha de Tasa: ', fechaEmision, col2X, obsY);

  y = Math.max(y, obsY) + 10;

  // Línea separadora horizontal (hr_line)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 14;

  // 5. TABLA DE ÍTEMS
  // Columnas: Cant (9%), Descripcion (54%), Precio Unit Bs (18%), Total Bs (19%)
  const wCant = contentWidth * 0.09;
  const wDesc = contentWidth * 0.54;
  const wUnit = contentWidth * 0.18;
  const wTotal = contentWidth * 0.19;

  const xCant = leftMargin;
  const xDesc = xCant + wCant;
  const xUnit = xDesc + wDesc;
  const xTotal = xUnit + wUnit;

  // Header Ítems (Courier-Bold 8)
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.text('Cant.', xCant + wCant / 2, y, { align: 'center' });
  doc.text('Descripcion', xDesc + 4, y);
  doc.text('Precio / Unit. Bs.', xUnit + wUnit - 4, y, { align: 'right' });
  doc.text('Total Bs.', xTotal + wTotal - 4, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 12;

  // Filas de ítems
  const items = factura.items || [];
  const maxRendered = 14;
  const renderItems = items.slice(0, maxRendered);

  renderItems.forEach((it) => {
    const qtyStr = String(it.cantidad || 1);
    const descStr = it.descripcion || '-';
    const precioUnitBs = (it.precioUnitarioUSD || 0) * tasaEfectiva;
    const totalItemBs = (it.cantidad || 1) * precioUnitBs;

    doc.setFont('Courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    // Cantidad centrada
    doc.text(qtyStr, xCant + wCant / 2, y, { align: 'center' });

    // Descripción (máximo 2 líneas)
    const splitDesc = doc.splitTextToSize(descStr, wDesc - 8);
    const visibleLines = splitDesc.slice(0, 2);
    doc.text(visibleLines, xDesc + 4, y);

    // Precio Unitario Bs. y Total Bs. alineados a la derecha
    doc.text(formatPdfMoney(precioUnitBs), xUnit + wUnit - 4, y, { align: 'right' });
    doc.text(formatPdfMoney(totalItemBs), xTotal + wTotal - 4, y, { align: 'right' });

    const rowHeight = Math.max(18, visibleLines.length * 10 + 6);
    y += rowHeight;

    // Línea separadora tenue debajo de cada ítem
    doc.setDrawColor(184, 184, 184); // #B8B8B8
    doc.setLineWidth(0.25);
    doc.line(leftMargin, y - 4, pageWidth - rightMargin, y - 4);
  });

  y += 10;

  // 6. TOTALES DUALES ($ USD / Bs.) ALINEADOS A LA DERECHA
  const subtotalUSD = factura.subtotalUSD ?? 0;
  const ivaPorcentaje = factura.ivaPorcentaje ?? 16;
  const ivaUSD = factura.ivaMontoUSD ?? (subtotalUSD * (ivaPorcentaje / 100));
  const totalUSD = factura.totalUSD ?? (subtotalUSD + ivaUSD);

  const subtotalBs = subtotalUSD * tasaEfectiva;
  const ivaBs = ivaUSD * tasaEfectiva;
  const totalBs = totalUSD * tasaEfectiva;

  // Tabla de totales: Anchos relativos 36%, 27%, 37% de un bloque derecho
  const totTableWidth = contentWidth * 0.48;
  const totStartX = pageWidth - rightMargin - totTableWidth;
  const wTotLabel = totTableWidth * 0.36;
  const wTotForeign = totTableWidth * 0.27;
  const wTotLocal = totTableWidth * 0.37;

  // Subtotal
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal', totStartX, y);
  doc.text(`$ ${formatPdfMoney(subtotalUSD)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  doc.text(`Bs. ${formatPdfMoney(subtotalBs)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  y += 12;

  // I.V.A (16%)
  doc.text(`I.V.A (${ivaPorcentaje}%)`, totStartX, y);
  doc.text(`$ ${formatPdfMoney(ivaUSD)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  doc.text(`Bs. ${formatPdfMoney(ivaBs)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  y += 6;

  // Línea sobre Total (0.6 black)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(totStartX, y, pageWidth - rightMargin, y);

  y += 10;

  // Total
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('Total', totStartX, y);
  doc.text(`$ ${formatPdfMoney(totalUSD)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  doc.text(`Bs. ${formatPdfMoney(totalBs)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  return doc;
}

export interface UniversalDocPayload {
  title?: string;
  number?: string;
  date?: string;
  concept?: string;
  client_name?: string;
  client_id?: string;
  phone?: string;
  email?: string;
  address?: string;
  conditions?: string;
  rate?: number | string;
  rate_date?: string;
  currency?: string; // 'BS' | 'USD' | 'EUR'
  items?: Array<{
    qty?: number | string;
    quantity?: number | string;
    desc?: string;
    description?: string;
    unit_local?: number;
    unit?: number;
    total_local?: number;
    total?: number;
    unit_usd?: number;
    total_usd?: number;
  }>;
  totals?: {
    subtotal_local?: number;
    tax_local?: number;
    total_local?: number;
    subtotal_foreign?: number;
    tax_foreign?: number;
    total_foreign?: number;
  };
}

/**
 * Motor universal equivalente a generate_invoice_pdf de Python ReportLab
 */
export function generateUniversalReportLabPDF(
  payload: UniversalDocPayload,
  empresa: EmpresaConfig | CompanyInfo = CURRENT_COMPANY
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = 612;
  const leftMargin = 36; // 0.5 inch * 72
  const rightMargin = 36;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  let y = 32;

  // 1. Membrete con Logo
  drawCompanyLogoPDF(doc, leftMargin, y, 140, 42);

  const nombreEmpresa = (empresa.nombre || empresa.nombreCorto || CURRENT_COMPANY.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();
  const rifEmpresa = empresa.rif || 'J-40382654-4';
  const dirEmpresa = empresa.direccion || CURRENT_COMPANY.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
  const telEmpresa = empresa.telefono || CURRENT_COMPANY.telefono || '(0412)983.49.95 / (0412)619.02.55';

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(nombreEmpresa, pageWidth - rightMargin, y + 10, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`RIF: ${rifEmpresa}`, pageWidth - rightMargin, y + 21, { align: 'right' });
  doc.text(dirEmpresa, pageWidth - rightMargin, y + 31, { align: 'right' });
  doc.text(`Telefono: ${telEmpresa}`, pageWidth - rightMargin, y + 41, { align: 'right' });

  y += 55;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 20;

  // 2. Título Centrado
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text((payload.title || 'FACTURA').toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 18;

  // 3. Meta: N° Documento, Emisión, Concepto
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('N° Control / Doc: ', leftMargin, y);
  doc.setFont('Courier', 'normal');
  doc.text(payload.number || '-', leftMargin + 85, y);

  doc.setFont('Courier', 'bold');
  doc.text('Emisión: ', leftMargin + contentWidth * 0.74, y);
  doc.setFont('Courier', 'normal');
  doc.text(payload.date || '-', leftMargin + contentWidth * 0.74 + 48, y);

  y += 12;
  doc.setFont('Courier', 'bold');
  doc.text('Concepto: ', leftMargin, y);
  doc.setFont('Courier', 'normal');
  doc.text(payload.concept || '-', leftMargin + 55, y);

  y += 16;

  // 4. Datos del Cliente / Observaciones
  const col1Width = contentWidth * 0.62;
  const col2Width = contentWidth * 0.38;
  const col2X = leftMargin + col1Width;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('DATOS DEL CLIENTE', leftMargin, y);
  doc.text('OBSERVACIONES', col2X, y);

  y += 3;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, leftMargin + col1Width - 10, y);
  doc.line(col2X, y, pageWidth - rightMargin, y);

  y += 11;

  const clientStartY = y;
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const writeBold = (lbl: string, val: string, currX: number, currY: number) => {
    doc.setFont('Courier', 'bold');
    doc.text(lbl, currX, currY);
    const w = doc.getTextWidth(lbl);
    doc.setFont('Courier', 'normal');
    doc.text(val, currX + w, currY);
  };

  writeBold('Cliente: ', payload.client_name || '-', leftMargin, y);
  y += 11;
  writeBold('ID: ', payload.client_id || 'J-00000000', leftMargin, y);
  y += 11;
  writeBold('Telefono: ', payload.phone || '-', leftMargin, y);
  y += 11;
  writeBold('Email: ', payload.email || '-', leftMargin, y);
  y += 11;
  writeBold('Direccion: ', `"${payload.address || 'Caracas, Venezuela'}"`, leftMargin, y);

  let obsY = clientStartY;
  writeBold('Condiciones de pago: ', payload.conditions || 'CONTADO', col2X, obsY);
  if (payload.rate) {
    obsY += 11;
    writeBold('Tasa B.C.V.: ', `Bs. ${typeof payload.rate === 'number' ? formatPdfMoney(payload.rate) : payload.rate}`, col2X, obsY);
    obsY += 11;
    writeBold('Fecha de Tasa: ', payload.rate_date || payload.date || '-', col2X, obsY);
  }

  y = Math.max(y, obsY) + 10;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 14;

  // 5. Tabla de ítems
  const wCant = contentWidth * 0.09;
  const wDesc = contentWidth * 0.54;
  const wUnit = contentWidth * 0.18;
  const wTotal = contentWidth * 0.19;

  const xCant = leftMargin;
  const xDesc = xCant + wCant;
  const xUnit = xDesc + wDesc;
  const xTotal = xUnit + wUnit;

  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.text('Cant.', xCant + wCant / 2, y, { align: 'center' });
  doc.text('Descripcion', xDesc + 4, y);
  doc.text('Precio / Unit. Bs.', xUnit + wUnit - 4, y, { align: 'right' });
  doc.text('Total Bs.', xTotal + wTotal - 4, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);

  y += 12;

  const rawItems = (payload.items || []).slice(0, 14);
  rawItems.forEach((it) => {
    const qty = String(it.qty || it.quantity || 1);
    const desc = it.desc || it.description || '-';
    const unitBs = it.unit_local ?? ((it.unit_usd || 0) * (typeof payload.rate === 'number' ? payload.rate : 36.5));
    const totalBs = it.total_local ?? (Number(qty) * unitBs);

    doc.setFont('Courier', 'normal');
    doc.setFontSize(8);
    doc.text(qty, xCant + wCant / 2, y, { align: 'center' });

    const splitDesc = doc.splitTextToSize(desc, wDesc - 8);
    const visibleLines = splitDesc.slice(0, 2);
    doc.text(visibleLines, xDesc + 4, y);

    doc.text(formatPdfMoney(unitBs), xUnit + wUnit - 4, y, { align: 'right' });
    doc.text(formatPdfMoney(totalBs), xTotal + wTotal - 4, y, { align: 'right' });

    const rowHeight = Math.max(18, visibleLines.length * 10 + 6);
    y += rowHeight;

    doc.setDrawColor(184, 184, 184);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, y - 4, pageWidth - rightMargin, y - 4);
  });

  y += 10;

  // 6. Totales
  const totals = payload.totals || {};
  const isLocalOnly = payload.currency?.toUpperCase() === 'BS';
  const foreignSymbol = payload.currency?.toUpperCase() === 'EUR' ? '€' : '$';

  const totTableWidth = contentWidth * 0.48;
  const totStartX = pageWidth - rightMargin - totTableWidth;
  const wTotLabel = totTableWidth * 0.36;
  const wTotForeign = totTableWidth * 0.27;
  const wTotLocal = totTableWidth * 0.37;

  doc.setFont('Courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  // Subtotal
  doc.text('Subtotal', totStartX, y);
  if (!isLocalOnly && totals.subtotal_foreign !== undefined) {
    doc.text(`${foreignSymbol} ${formatPdfMoney(totals.subtotal_foreign)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  }
  doc.text(`Bs. ${formatPdfMoney(totals.subtotal_local || 0)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  y += 12;

  // IVA
  doc.text('I.V.A (16%)', totStartX, y);
  if (!isLocalOnly && totals.tax_foreign !== undefined) {
    doc.text(`${foreignSymbol} ${formatPdfMoney(totals.tax_foreign)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  }
  doc.text(`Bs. ${formatPdfMoney(totals.tax_local || 0)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(totStartX, y, pageWidth - rightMargin, y);

  y += 10;

  // Total
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('Total', totStartX, y);
  if (!isLocalOnly && totals.total_foreign !== undefined) {
    doc.text(`${foreignSymbol} ${formatPdfMoney(totals.total_foreign)}`, totStartX + wTotLabel + wTotForeign - 4, y, { align: 'right' });
  }
  doc.text(`Bs. ${formatPdfMoney(totals.total_local || 0)}`, totStartX + totTableWidth - 4, y, { align: 'right' });

  return doc;
}

/**
 * Descarga directamente el archivo PDF de la Factura
 */
export function downloadInvoicePDF(
  factura: Factura,
  empresa: EmpresaConfig | CompanyInfo = CURRENT_COMPANY,
  tasaCambioBCV: number = 36.5
) {
  const doc = generateInvoicePDF(factura, empresa, tasaCambioBCV);
  const cleanNum = (factura.correlativo || 'FACTURA').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Factura_${cleanNum}.pdf`);
}

/**
 * Descarga cualquier documento en formato ReportLab unificado
 */
export function downloadUniversalPDF(
  payload: UniversalDocPayload,
  empresa: EmpresaConfig | CompanyInfo = CURRENT_COMPANY,
  fileName?: string
) {
  const doc = generateUniversalReportLabPDF(payload, empresa);
  const finalName = fileName || `${payload.title || 'DOCUMENTO'}_${payload.number || '001'}.pdf`;
  doc.save(finalName.replace(/[^a-zA-Z0-9_.-]/g, '_'));
}
