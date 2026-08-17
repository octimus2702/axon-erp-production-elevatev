import { jsPDF } from 'jspdf';
import { Presupuesto, EmpresaConfig, Factura, ReciboNota } from '../types';
import { CURRENT_COMPANY } from '../config/companyConfig';
import { drawCompanyLogoPDF } from './pdfFacturaExporter';

/**
 * Genera y descarga un documento PDF oficial para Presupuestos y Cotizaciones
 * con el formato exacto de Tecno Elevatev C.A (Datos Cliente, Observaciones, Garantía, etc.).
 */
export const exportPresupuestoPDF = (
  presupuesto: Presupuesto,
  empresa: EmpresaConfig,
  tasaCambioBCV: number = 1
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 14;

    const nombreEmp = (empresa.nombre || empresa.nombreCorto || CURRENT_COMPANY.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();
    const rifEmp = empresa.rif || 'J-40382654-4';
    const dirEmp = empresa.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
    const telEmp = empresa.telefono || '(0412)983.49.95 / (0412)619.02.55';
    const emailEmp = empresa.email || 'gerencia.elevatev@gmail.com';

    // 1. ENCABEZADO CON LOGO OFICIAL
    // En jsPDF unit: mm -> drawCompanyLogoPDF espera points or scaled coords. En mm:
    try {
      doc.saveGraphicsState();
      // Óvalo azul central en mm
      const logoX = margin;
      const logoY = y;
      const logoW = 46;
      const logoH = 14;
      const ovalCx = logoX + logoW * 0.42;
      const ovalCy = logoY + logoH * 0.48;
      const rx = logoW * 0.22;
      const ry = logoH * 0.40;

      doc.setDrawColor(29, 112, 184); // #1D70B8
      doc.setLineWidth(0.4);
      doc.ellipse(ovalCx, ovalCy, rx, ry, 'S');

      // Texto "TECNO"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(29, 112, 184);
      doc.text('TECNO', ovalCx, logoY + logoH * 0.28, { align: 'center' });

      // Texto principal "ELEVATEV"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 43, 73); // #002B49

      doc.text('EL', logoX + logoW * 0.08, logoY + logoH * 0.68);
      doc.text('E', logoX + logoW * 0.24, logoY + logoH * 0.68);

      // Triángulos de V y A
      doc.setFillColor(0, 43, 73);
      doc.setDrawColor(29, 112, 184);
      doc.setLineWidth(0.3);

      const vX = logoX + logoW * 0.34;
      const vY = logoY + logoH * 0.38;
      doc.triangle(vX, vY, vX + 3.8, vY, vX + 1.9, vY + 4.2, 'FD');

      const aX = logoX + logoW * 0.44;
      const aY = logoY + logoH * 0.68;
      doc.triangle(aX, aY, aX + 3.8, aY, aX + 1.9, aY - 4.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 43, 73);
      doc.text('TEV', logoX + logoW * 0.54, logoY + logoH * 0.68);

      doc.setFont('courier', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(0, 43, 73);
      doc.text('RIF: J-40382654-4', ovalCx, logoY + logoH * 0.90, { align: 'center' });
      doc.restoreGraphicsState();
    } catch (e) {
      console.error(e);
    }

    // Datos fiscales alineados a la derecha
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(nombreEmp, pageWidth - margin, y + 2, { align: 'right' });
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`RIF: ${rifEmp}`, pageWidth - margin, y + 5.5, { align: 'right' });
    doc.text(dirEmp, pageWidth - margin, y + 9, { align: 'right' });
    doc.text(`Telefono: ${telEmp}`, pageWidth - margin, y + 12.5, { align: 'right' });

    y += 18;

    // 2. LINEA N° PRESUPUESTO & FECHA
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`N° Presupuesto: ${presupuesto.correlativo}`, margin, y);
    doc.text(`Emision: ${presupuesto.fecha}`, pageWidth - margin, y, { align: 'right' });
    
    y += 4.5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(`Concepto: ${presupuesto.proyectoAscensor || 'Mantenimiento General'}`, margin, y);

    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // 3. DATOS DEL CLIENTE / OBSERVACIONES (2 COLUMNAS)
    const colWidth = (pageWidth - (margin * 2) - 8) / 2;
    const col2X = margin + colWidth + 8;

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('DATOS DEL CLIENTE', margin, y);
    doc.text('OBSERVACIONES', col2X, y);

    y += 1.5;
    doc.line(margin, y, margin + colWidth, y);
    doc.line(col2X, y, pageWidth - margin, y);
    y += 4;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Cliente: ${presupuesto.clienteNombre}`, margin, y);
    doc.text(`Condiciones de pago: ${presupuesto.condicionesPago || 'CONTADO'}`, col2X, y);
    y += 3.8;
    doc.text(`ID: ${presupuesto.clienteRif || 'J-00000000'}`, margin, y);
    y += 3.8;
    doc.text(`Telefono: ${presupuesto.clienteTelefono || '-'}`, margin, y);
    y += 3.8;
    doc.text(`Email: ${presupuesto.clienteEmail || '-'}`, margin, y);
    y += 3.8;
    doc.text(`Direccion: ${presupuesto.clienteDireccion || 'Caracas, Venezuela'}`, margin, y, { maxWidth: colWidth });

    y += 8;

    // 4. TABLA DE ITEMS
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3.5;

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('Cant.', margin + 2, y);
    doc.text('Descripcion', margin + 20, y);
    doc.text('Precio / Unit. $', pageWidth - margin - 35, y, { align: 'right' });
    doc.text('Total $', pageWidth - margin - 2, y, { align: 'right' });

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);

    const subtotal = presupuesto.subtotalUSD ?? presupuesto.items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitarioUSD), 0);
    const iva = presupuesto.ivaUSD ?? (subtotal * 0.16);
    const total = presupuesto.totalUSD ?? (subtotal + iva);

    presupuesto.items.forEach((item) => {
      const totalItem = item.cantidad * item.precioUnitarioUSD;
      doc.text(item.cantidad.toString(), margin + 2, y);
      doc.text(item.descripcion, margin + 20, y, { maxWidth: 100 });
      doc.text(item.precioUnitarioUSD.toFixed(2).replace('.', ','), pageWidth - margin - 35, y, { align: 'right' });
      doc.text(totalItem.toFixed(2).replace('.', ','), pageWidth - margin - 2, y, { align: 'right' });
      y += 5;
    });

    y += 2;
    doc.setDrawColor(180, 180, 180);
    doc.line(pageWidth - margin - 65, y, pageWidth - margin, y);
    y += 4;

    // Subtotales
    doc.setFont('courier', 'normal');
    doc.text('Subtotal', pageWidth - margin - 40, y);
    doc.text(subtotal.toFixed(2).replace('.', ','), pageWidth - margin - 2, y, { align: 'right' });
    y += 4;

    doc.text('I.V.A (16%)', pageWidth - margin - 40, y);
    doc.text(iva.toFixed(2).replace('.', ','), pageWidth - margin - 2, y, { align: 'right' });
    y += 4;

    doc.setFont('courier', 'bold');
    doc.setDrawColor(30, 30, 30);
    doc.line(pageWidth - margin - 65, y - 1, pageWidth - margin, y - 1);
    doc.text('Total', pageWidth - margin - 40, y + 2);
    doc.text(`$${total.toFixed(2).replace('.', ',')}`, pageWidth - margin - 2, y + 2, { align: 'right' });

    y += 10;

    // 5. CAJA DE OBSERVACIONES
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    const box1Y = y;
    doc.rect(margin, box1Y, pageWidth - (margin * 2), 34);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text('OBSERVACIONES', margin + 3, box1Y + 4);
    doc.line(margin, box1Y + 5.5, pageWidth - margin, box1Y + 5.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    let by = box1Y + 8.5;
    doc.text('Presupuesto sin valor comercial ni legal, si no posee Firma del Gerente de Administracion.', margin + 3, by);
    by += 3.2;
    doc.text('1. Se podra realizar Deposito o Transferencia directamente a nuestras cuentas Bancarias:', margin + 3, by);
    by += 3;
    doc.text(`a) Cuentas bancarias configuradas o cuenta de ${nombreEmp}.`, margin + 6, by);
    by += 3;
    doc.text(`* Pueden notificar deposito o transferencia al correo ${emailEmp}.`, margin + 3, by);
    by += 3.2;
    doc.text('2. El presupuesto tiene validez de 15 dias continuos a partir de la fecha de emision. Queda entendido que los montos', margin + 3, by);
    by += 2.8;
    doc.text('expresados en el presente presupuesto podran variar una vez transcurrido el tiempo de validez.', margin + 3, by);
    by += 3.2;
    doc.line(margin, by - 1, pageWidth - margin, by - 1);
    doc.text('El presupuesto tiene un valor equivalente en Bolivares a la tasa de cambio publicada por el Banco Central de Venezuela (B.C.V.)', margin + 3, by + 2);

    y = box1Y + 38;

    // 6. CAJA DE CONDICIONES DE GARANTIA
    const box2Y = y;
    doc.rect(margin, box2Y, pageWidth - (margin * 2), 18);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text('CONDICIONES DE GARANTIA', margin + 3, box2Y + 4);
    doc.line(margin, box2Y + 5.5, pageWidth - margin, box2Y + 5.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    let gy = box2Y + 8.5;
    doc.text('1. La garantia aplica por defectos de fabrica en los repuestos suministrados y por defectos ocasionados durante la instalacion.', margin + 3, gy);
    gy += 3;
    doc.text('No aplica por fluctuaciones en el suministro electrico, uso inadecuado, vandalizacion o manipulacion por terceros sin autorizacion.', margin + 3, gy);
    gy += 3;
    doc.text('Tiempo de garantia: (2) por repuestos suministrados y (2) por instalacion.', margin + 3, gy);

    // Guardar archivo
    const safeCorrelativo = presupuesto.correlativo.replace(/[^a-zA-Z0-9-]/g, '_');
    doc.save(`Presupuesto_${safeCorrelativo}.pdf`);

    return true;
  } catch (error) {
    console.error('Error generando PDF del presupuesto:', error);
    throw error;
  }
};

