/**
 * Utility for exporting data to Microsoft Excel CSV format with UTF-8 BOM
 * Compatible with Excel, Google Sheets, LibreOffice, and Numbers.
 */

export const downloadExcelCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const sanitize = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitize).join(';');
  const dataRows = rows.map(r => r.map(sanitize).join(';'));
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAllDataToExcelCSV = (data: {
  facturas?: any[];
  recibos?: any[];
  movimientosContables?: any[];
  reportesTecnicos?: any[];
  presupuestos?: any[];
  inventario?: any[];
  clientes?: any[];
}, empresaNombre?: string) => {
  const sections: string[] = [];
  const sanitize = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const safeEmpresa = empresaNombre
    ? empresaNombre.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    : 'axon_erp';

  const addTable = (title: string, headers: string[], rows: (string | number)[][]) => {
    sections.push(`=== ${title.toUpperCase()} ===`);
    sections.push(headers.map(sanitize).join(';'));
    rows.forEach(r => sections.push(r.map(sanitize).join(';')));
    sections.push(''); // Empty line gap
  };

  // 1. Facturas
  if (data.facturas && data.facturas.length > 0) {
    addTable(
      'Facturas de Ventas SENIAT',
      ['Número Factura', 'División', 'RIF Cliente', 'Cliente', 'Subtotal USD', 'IVA USD', 'Total USD', 'Total Bs', 'Tasa BCV', 'Estado', 'Fecha'],
      data.facturas.map(f => [
        f.correlativo, f.division, f.clienteRif, f.clienteNombre, f.subtotalUSD, f.ivaMontoUSD, f.totalUSD, f.totalBs, f.tasaCambioBs, f.estado, f.fecha
      ])
    );
  }

  // 2. Recibos y Notas
  if (data.recibos && data.recibos.length > 0) {
    addTable(
      'Recibos de Pago y Notas de Entrega',
      ['Correlativo', 'Tipo', 'Fecha', 'RIF Cliente', 'Cliente', 'Concepto', 'Monto USD', 'Monto Bs', 'Forma Pago', 'Estado', 'División'],
      data.recibos.map(r => [
        r.correlativo, r.tipo, r.fecha, r.clienteRif, r.clienteNombre, r.concepto, r.montoUSD, r.montoBs, r.formaPago, r.status, r.division
      ])
    );
  }

  // 3. Movimientos Contables
  if (data.movimientosContables && data.movimientosContables.length > 0) {
    addTable(
      'Movimientos Contables - Libro Diario y Caja',
      ['ID Transacción', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto USD', 'Monto Bs', 'Comprobante Ref', 'Tercero', 'División'],
      data.movimientosContables.map(m => [
        m.id, m.fecha, m.tipo, m.categoria, m.descripcion, m.montoUSD, m.montoBs, m.comprobanteReferencia || '', m.proveedorOCliente || '', m.division
      ])
    );
  }

  // 4. Reportes Técnicos
  if (data.reportesTecnicos && data.reportesTecnicos.length > 0) {
    addTable(
      'Reportes Técnicos de Campo e Inspección',
      ['ID Reporte', 'Correlativo', 'Fecha', 'Cliente', 'RIF', 'Ubicación / Equipo', 'Técnico', 'Tipo Servicio', 'Estado', 'Diagnóstico', 'Monto Repuestos USD'],
      data.reportesTecnicos.map(rep => [
        rep.id, rep.correlativo, rep.fecha, rep.clienteNombre, rep.clienteRif || '', rep.equipoAscensor, rep.tecnicoNombre, rep.tipoReporte, rep.estado, rep.diagnosticoDanio, rep.montoEstimadoRepuestosUSD || 0
      ])
    );
  }

  // 5. Presupuestos
  if (data.presupuestos && data.presupuestos.length > 0) {
    addTable(
      'Presupuestos y Cotizaciones',
      ['Número Cotización', 'Cliente', 'RIF', 'Proyecto / Ascensor', 'Subtotal USD', 'Total USD', 'Total Bs', 'Estado', 'Fecha'],
      data.presupuestos.map(p => [
        p.correlativo, p.clienteNombre, p.clienteRif, p.proyectoAscensor || '', p.subtotalUSD, p.totalUSD, p.totalBs, p.estado, p.fecha
      ])
    );
  }

  const csvContent = '\uFEFF' + sections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `respaldo_${safeEmpresa}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
