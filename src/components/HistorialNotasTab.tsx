import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import { 
  History, 
  Search, 
  Zap, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Printer, 
  Download, 
  DollarSign, 
  Eye, 
  Building2, 
  X,
  Edit3,
  Ban,
  Save,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { downloadInvoicePDF } from '../utils/pdfFacturaExporter';
import { exportPresupuestoPDF } from '../utils/pdfPresupuestoExporter';
import FacturaDoc from './FacturaDoc';
import PresupuestoDoc from './PresupuestoDoc';
import ReciboPagoDoc from './ReciboPagoDoc';
import CompanyLogo from './CompanyLogo';

export type TipoDocumentoFiltro = 
  | 'TODOS' 
  | 'NOTA_DESPACHO' 
  | 'RECIBO_PAGO' 
  | 'NOTA_ENTREGA' 
  | 'FACTURA' 
  | 'PRESUPUESTO' 
  | 'REPORTE_TECNICO' 
  | 'MOVIMIENTO_CONTABLE';

export type EstadoNubeFiltro = 'TODOS' | 'EN_NUBE' | 'SOLO_LOCAL';
export type FechaFiltro = 'TODOS' | 'HOY' | 'ULTIMOS_7_DIAS' | 'ESTE_MES';

interface HistorialUnifiedItem {
  id: string;
  correlativo: string;
  fecha: string;
  tipo: TipoDocumentoFiltro;
  tipoLabel: string;
  clienteDestino: string;
  responsable: string;
  conceptoDetalle: string;
  montoUSD?: number;
  status: string;
  division: 'MODERNIZACION' | 'MANTENIMIENTO';
  isSyncedToCloud: boolean;
  originalItem: any;
}

export default function HistorialNotasTab() {
  const { 
    user,
    empresaActiva,
    vales, 
    recibos, 
    facturas, 
    presupuestos, 
    reportesTecnicos, 
    movimientosContables, 
    products,
    cloudSyncedCorrelativos, 
    scanAndSyncUnsyncedReports, 
    isSyncing, 
    activeDivision,
    tasaCambioBCV,
    anularVale,
    modificarVale,
    anularFactura,
    modificarFactura,
    anularReciboNota,
    modificarReciboNota,
    addToast 
  } = useApp();

  const isAdmin = user?.rol === 'ADMIN';

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoDocumentoFiltro>('TODOS');
  const [estadoNubeFiltro, setEstadoNubeFiltro] = useState<EstadoNubeFiltro>('TODOS');
  const [fechaFiltro, setFechaFiltro] = useState<FechaFiltro>('TODOS');
  const [divisionFiltro, setDivisionFiltro] = useState<'TODAS' | 'MODERNIZACION' | 'MANTENIMIENTO'>('TODAS');

  // Modal para Vista Previa
  const [selectedItem, setSelectedItem] = useState<HistorialUnifiedItem | null>(null);

  // Modal para Edición / Modificación de Nota
  const [editingItem, setEditingItem] = useState<HistorialUnifiedItem | null>(null);
  const [editCliente, setEditCliente] = useState('');
  const [editResponsable, setEditResponsable] = useState('');
  const [editConcepto, setEditConcepto] = useState('');
  const [editProductos, setEditProductos] = useState<Array<{ val_c: string; val_d: string; cantidad: number }>>([]);

  // Modal de Confirmación de Anulación
  const [anularTarget, setAnularTarget] = useState<HistorialUnifiedItem | null>(null);

  // Consolidar todos los documentos emitidos en una sola lista unificada
  const allHistoryItems = useMemo<HistorialUnifiedItem[]>(() => {
    const list: HistorialUnifiedItem[] = [];

    // 1. Vales / Notas de Despacho
    vales.forEach(v => {
      list.push({
        id: `VALE-${v.NroVale}`,
        correlativo: v.NroVale,
        fecha: v.Fecha,
        tipo: 'NOTA_DESPACHO',
        tipoLabel: 'VALE DE DESPACHO',
        clienteDestino: v.Destino || 'General',
        responsable: v.Responsable || 'Almacén',
        conceptoDetalle: v.ProyectoDesc || (typeof v.Productos === 'string' ? v.Productos : 'Despacho de repuestos'),
        status: v.Status || 'ACTIVO',
        division: v.division || 'MODERNIZACION',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(v.NroVale),
        originalItem: v
      });
    });

    // 2. Recibos y Notas de Entrega
    recibos.forEach(r => {
      const isRecibo = r.tipo === 'RECIBO_PAGO';
      list.push({
        id: `REC-${r.correlativo}`,
        correlativo: r.correlativo,
        fecha: r.fecha,
        tipo: isRecibo ? 'RECIBO_PAGO' : 'NOTA_ENTREGA',
        tipoLabel: isRecibo ? 'RECIBO DE PAGO' : 'NOTA DE ENTREGA',
        clienteDestino: r.clienteNombre,
        responsable: r.formaPago || 'Caja',
        conceptoDetalle: r.concepto,
        montoUSD: r.montoUSD,
        status: r.status || 'EMITIDO',
        division: r.division || 'MANTENIMIENTO',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(r.correlativo),
        originalItem: r
      });
    });

    // 3. Facturas
    facturas.forEach(f => {
      list.push({
        id: `FACT-${f.correlativo}`,
        correlativo: f.correlativo,
        fecha: f.fecha,
        tipo: 'FACTURA',
        tipoLabel: 'FACTURA FISCAL',
        clienteDestino: f.clienteNombre,
        responsable: f.tipoComprobante,
        conceptoDetalle: `Factura por $${f.totalUSD.toFixed(2)} USD (${f.items.length} ítems) - RIF: ${f.clienteRif}`,
        montoUSD: f.totalUSD,
        status: f.estado || 'EMITIDA',
        division: f.division || 'MODERNIZACION',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(f.correlativo),
        originalItem: f
      });
    });

    // 4. Presupuestos
    presupuestos.forEach(p => {
      list.push({
        id: `PRES-${p.correlativo}`,
        correlativo: p.correlativo,
        fecha: p.fecha,
        tipo: 'PRESUPUESTO',
        tipoLabel: 'PRESUPUESTO DE OBRA',
        clienteDestino: p.clienteNombre,
        responsable: 'Ventas / Cotizaciones',
        conceptoDetalle: `Presupuesto ${p.proyectoAscensor || ''} - Total $${p.totalUSD.toFixed(2)} USD (${p.items.length} ítems)`,
        montoUSD: p.totalUSD,
        status: p.estado || 'PENDIENTE',
        division: p.division || 'MODERNIZACION',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(p.correlativo),
        originalItem: p
      });
    });

    // 5. Reportes Técnicos
    reportesTecnicos.forEach(rep => {
      list.push({
        id: `REP-${rep.correlativo}`,
        correlativo: rep.correlativo,
        fecha: rep.fecha,
        tipo: 'REPORTE_TECNICO',
        tipoLabel: 'REPORTE TÉCNICO',
        clienteDestino: rep.clienteNombre,
        responsable: rep.tecnicoNombre,
        conceptoDetalle: `${rep.equipoAscensor}: ${rep.diagnosticoDanio}`,
        montoUSD: rep.montoEstimadoRepuestosUSD,
        status: rep.estado || 'COMPLETADO',
        division: rep.division || 'MODERNIZACION',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(rep.correlativo),
        originalItem: rep
      });
    });

    // 6. Movimientos Contables
    movimientosContables.forEach(m => {
      list.push({
        id: `MOV-${m.id}`,
        correlativo: m.id,
        fecha: m.fecha,
        tipo: 'MOVIMIENTO_CONTABLE',
        tipoLabel: `ASIENTO ${m.tipo}`,
        clienteDestino: m.proveedorOCliente || 'General',
        responsable: m.categoria,
        conceptoDetalle: m.descripcion,
        montoUSD: m.montoUSD,
        status: 'REGISTRADO',
        division: m.division || 'MODERNIZACION',
        isSyncedToCloud: cloudSyncedCorrelativos.includes(m.id),
        originalItem: m
      });
    });

    // Ordenar por fecha descendente
    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [vales, recibos, facturas, presupuestos, reportesTecnicos, movimientosContables, cloudSyncedCorrelativos]);

  // Aplicar Filtros
  const filteredItems = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allHistoryItems.filter(item => {
      // 1. Filtro División
      if (divisionFiltro !== 'TODAS' && item.division !== divisionFiltro) {
        return false;
      }

      // 2. Filtro Tipo de Documento
      if (tipoFiltro !== 'TODOS' && item.tipo !== tipoFiltro) {
        return false;
      }

      // 3. Filtro Estado Nube
      if (estadoNubeFiltro === 'EN_NUBE' && !item.isSyncedToCloud) return false;
      if (estadoNubeFiltro === 'SOLO_LOCAL' && item.isSyncedToCloud) return false;

      // 4. Filtro Fecha
      if (fechaFiltro === 'HOY' && item.fecha !== todayStr) return false;
      if (fechaFiltro === 'ULTIMOS_7_DIAS') {
        const itemDate = new Date(item.fecha);
        if (itemDate < sevenDaysAgo) return false;
      }
      if (fechaFiltro === 'ESTE_MES') {
        const itemDate = new Date(item.fecha);
        if (itemDate < startOfMonth) return false;
      }

      // 5. Búsqueda por texto libre
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchCorrelativo = item.correlativo.toLowerCase().includes(q);
        const matchCliente = item.clienteDestino.toLowerCase().includes(q);
        const matchResponsable = item.responsable.toLowerCase().includes(q);
        const matchConcepto = item.conceptoDetalle.toLowerCase().includes(q);
        return matchCorrelativo || matchCliente || matchResponsable || matchConcepto;
      }

      return true;
    });
  }, [allHistoryItems, divisionFiltro, tipoFiltro, estadoNubeFiltro, fechaFiltro, searchTerm]);

  // Contadores Resumen
  const totalCount = filteredItems.length;
  const inCloudCount = filteredItems.filter(i => i.isSyncedToCloud).length;
  const totalMontoUSD = filteredItems.reduce((acc, curr) => acc + (curr.montoUSD || 0), 0);

  // DESCARGA EN FORMADO PDF PROFESIONAL SEGÚN TIPO DE DOCUMENTO
  const handleDownloadPDF = (item: HistorialUnifiedItem) => {
    try {
      // 1. Facturas Oficiales
      if (item.tipo === 'FACTURA' || item.correlativo.startsWith('FACT') || item.correlativo.startsWith('FC-')) {
        const facturaObj = item.originalItem || {
          correlativo: item.correlativo,
          fecha: item.fecha,
          clienteNombre: item.clienteDestino,
          clienteRif: 'J-00000000-0',
          concepto: item.conceptoDetalle,
          totalUSD: item.montoUSD || 0,
          items: [{ descripcion: item.conceptoDetalle, cantidad: 1, precioUnitarioUSD: item.montoUSD || 0 }]
        };
        downloadInvoicePDF(facturaObj, empresaActiva, tasaCambioBCV);
        return;
      }

      // 2. Presupuestos y Cotizaciones
      if (item.tipo === 'PRESUPUESTO' || item.correlativo.startsWith('PRES')) {
        const presObj = item.originalItem || {
          correlativo: item.correlativo,
          fecha: item.fecha,
          clienteNombre: item.clienteDestino,
          proyectoAscensor: item.conceptoDetalle,
          totalUSD: item.montoUSD || 0,
          items: [{ descripcion: item.conceptoDetalle, cantidad: 1, precioUnitarioUSD: item.montoUSD || 0 }]
        };
        exportPresupuestoPDF(presObj, empresaActiva, tasaCambioBCV);
        return;
      }

      // 3. Notas de Control / Vale de Despacho
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const isAnulado = item.status === 'ANULADO' || item.status === 'ANULADA';

      // 1. Encabezado Membretado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text((empresaActiva.nombre || empresaActiva.nombreCorto).toUpperCase(), 14, 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`CARACAS, VENEZUELA — ${empresaActiva.slogan || 'SOLUCIONES INTEGRALES ELEVADORES Y REPUESTOS'}`, 14, 19);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`RIF: ${empresaActiva.rif} | ${empresaActiva.direccion}`, 14, 23);

      // Título Documento & Correlativo a la Derecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(item.tipo === 'NOTA_DESPACHO' ? 'NOTA DE CONTROL / VALE' : (item.tipoLabel || 'COMPROBANTE'), 202, 14, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38); // Rojo vibrante N/S...
      doc.text(`N/${item.correlativo}`, 202, 21, { align: 'right' });

      if (isAnulado) {
        doc.setFontSize(8);
        doc.setTextColor(225, 29, 72);
        doc.text('*** DOCUMENTO ANULADO ***', 202, 26, { align: 'right' });
      }

      // Línea divisoria Verde Esmeralda (#059669)
      doc.setFillColor(5, 150, 105);
      doc.rect(14, 27, 188, 1.2, 'F');

      let currentY = 34;

      // 2. Grilla de Campos (DESTINO, RESPONSABLE, FECHA, OBSERVACIÓN)
      doc.setFontSize(8);

      // DESTINO
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('DESTINO:', 14, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text((item.clienteDestino || 'N/A').toUpperCase(), 50, currentY);
      currentY += 5.5;

      // RESPONSABLE
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('RESPONSABLE:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text((item.responsable || 'N/A').toUpperCase(), 50, currentY);
      currentY += 5.5;

      // FECHA EMISIÓN
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('FECHA EMISIÓN:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(item.fecha, 50, currentY);
      currentY += 5.5;

      // OBSERVACIÓN
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('OBSERVACIÓN:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const splitObs = doc.splitTextToSize((item.conceptoDetalle || 'SE HACE ENTREGA DE MATERIAL SOLICITADO').toUpperCase(), 150);
      doc.text(splitObs, 50, currentY);
      currentY += (splitObs.length * 4) + 6;

      // 3. Tabla de Productos Despachados
      let productosList: any[] = [];
      if (item.tipo === 'NOTA_DESPACHO' && item.originalItem?.Productos) {
        try {
          productosList = typeof item.originalItem.Productos === 'string' ? JSON.parse(item.originalItem.Productos) : item.originalItem.Productos;
        } catch (e) {}
      }

      // Franja de Encabezado Verde Esmeralda (#059669)
      doc.setFillColor(5, 150, 105);
      doc.rect(14, currentY, 188, 7, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Nº', 18, currentY + 4.8);
      doc.text('CÓDIGO / MODELO', 28, currentY + 4.8);
      doc.text('DESCRIPCIÓN / BARRA', 82, currentY + 4.8);
      doc.text('MARCA / REF', 152, currentY + 4.8);
      doc.text('CANTIDAD', 200, currentY + 4.8, { align: 'right' });

      currentY += 10;

      if (Array.isArray(productosList) && productosList.length > 0) {
        productosList.forEach((prod, index) => {
          doc.setFontSize(8);
          // Nº
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(String(index + 1), 18, currentY);

          // CÓDIGO / MODELO
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(String(prod.val_c || 'N/A'), 28, currentY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(String(prod.val_mo || '').slice(0, 25), 28, currentY + 3.5);

          // DESCRIPCIÓN / BARRA
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(String(prod.val_d || prod.descripcion || 'Repuesto').slice(0, 38), 82, currentY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`EAN: ${prod.val_b || 'S/C'}`, 82, currentY + 3.5);

          // MARCA / REF
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(String(prod.val_m || 'CHINA').slice(0, 15), 152, currentY);
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`Ref: ${prod.val_r || 'S/C'}`, 152, currentY + 3.5);

          // CANTIDAD
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${prod.cantidad || 1} und`, 200, currentY, { align: 'right' });

          // Línea tenue separadora
          doc.setDrawColor(226, 232, 240);
          doc.line(14, currentY + 5.5, 202, currentY + 5.5);

          currentY += 9.5;
        });
      } else {
        // Si es un comprobante sin lista directa de ítems
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text('1', 18, currentY);
        doc.text('GENÉRICO', 28, currentY);
        doc.text((item.conceptoDetalle || 'CONCEPTO DE DESPACHO / CONTROL').slice(0, 40), 82, currentY);
        doc.text('N/A', 152, currentY);
        doc.text('1 und', 200, currentY, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.line(14, currentY + 5.5, 202, currentY + 5.5);

        currentY += 9.5;
      }

      currentY += 8;

      // Monto si aplica y es visible para admin
      if (isAdmin && item.montoUSD !== undefined && item.montoUSD > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`TOTAL REFERENCIAL: $${item.montoUSD.toFixed(2)} USD (Bs. ${(item.montoUSD * tasaCambioBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })})`, 14, currentY);
        currentY += 12;
      }

      // 4. Firmas de Conformidad al Pie
      const sigY = Math.max(currentY + 20, 230);

      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.5);
      doc.line(20, sigY, 95, sigY);
      doc.line(115, sigY, 190, sigY);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ENTREGADO Y APROBADO POR', 57.5, sigY + 5, { align: 'center' });
      doc.text('RECIBIDO CONFORME (RESPONSABLE)', 152.5, sigY + 5, { align: 'center' });

      // Guardar PDF
      const filename = `Nota_Control_${item.correlativo.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      doc.save(filename);
      addToast(`¡PDF de ${item.correlativo} generado exitosamente!`, 'success');
    } catch (err) {
      console.error('Error generando PDF:', err);
      addToast('Error al generar la nota en PDF', 'error');
    }
  };

  // ABRIR MODAL DE EDICIÓN
  const handleStartEdit = (item: HistorialUnifiedItem) => {
    setEditingItem(item);
    setEditCliente(item.clienteDestino);
    setEditResponsable(item.responsable);
    setEditConcepto(item.conceptoDetalle);

    // Si es Vale / Nota de Despacho, cargar productos para editar cantidades
    if (item.tipo === 'NOTA_DESPACHO' && item.originalItem?.Productos) {
      try {
        const prods = typeof item.originalItem.Productos === 'string' ? JSON.parse(item.originalItem.Productos) : item.originalItem.Productos;
        if (Array.isArray(prods)) {
          setEditProductos(prods);
        } else {
          setEditProductos([]);
        }
      } catch (e) {
        setEditProductos([]);
      }
    } else {
      setEditProductos([]);
    }
  };

  // GUARDAR EDICIÓN DE NOTA CON RE-CÁLCULO DE STOCK
  const handleSaveEdit = () => {
    if (!editingItem) return;

    if (editingItem.tipo === 'NOTA_DESPACHO') {
      modificarVale(editingItem.correlativo, {
        Destino: editCliente,
        Responsable: editResponsable,
        ProyectoDesc: editConcepto,
        Productos: JSON.stringify(editProductos)
      });
    } else if (editingItem.tipo === 'FACTURA') {
      modificarFactura(editingItem.correlativo, {
        clienteNombre: editCliente,
        observaciones: editConcepto
      });
    } else if (editingItem.tipo === 'RECIBO_PAGO' || editingItem.tipo === 'NOTA_ENTREGA') {
      modificarReciboNota(editingItem.correlativo, {
        clienteNombre: editCliente,
        concepto: editConcepto
      });
    } else {
      addToast(`Modificación guardada para ${editingItem.correlativo}`, 'success');
    }

    setEditingItem(null);
  };

  // EJECUTAR ANULACIÓN CON REVERSIÓN AUTOMÁTICA DE STOCK
  const handleConfirmAnular = () => {
    if (!anularTarget) return;

    if (anularTarget.tipo === 'NOTA_DESPACHO') {
      anularVale(anularTarget.correlativo);
    } else if (anularTarget.tipo === 'FACTURA') {
      anularFactura(anularTarget.correlativo);
    } else if (anularTarget.tipo === 'RECIBO_PAGO' || anularTarget.tipo === 'NOTA_ENTREGA') {
      anularReciboNota(anularTarget.correlativo);
    } else {
      addToast(`Documento ${anularTarget.correlativo} anulado`, 'info');
    }

    setAnularTarget(null);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      addToast('No hay registros para exportar con los filtros actuales', 'info');
      return;
    }

    const headers = ['Correlativo', 'Fecha', 'Tipo', 'Cliente/Destino', 'Responsable', 'Detalle/Observación', 'Monto USD', 'Estado', 'División', 'Estado Nube'];
    const rows = filteredItems.map(item => [
      item.correlativo,
      item.fecha,
      item.tipoLabel,
      `"${item.clienteDestino.replace(/"/g, '""')}"`,
      `"${item.responsable.replace(/"/g, '""')}"`,
      `"${item.conceptoDetalle.replace(/"/g, '""')}"`,
      isAdmin ? (item.montoUSD ? item.montoUSD.toFixed(2) : '0.00') : 'Restringido',
      item.status,
      item.division,
      item.isSyncedToCloud ? 'En Nube' : 'Solo Local'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historial_Notas_TecnoElevatev_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('¡Historial exportado en formato CSV con éxito!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER DEL HISTORIAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
            <History size={16} />
            <span>MÓDULO DE REVISIÓN Y SEGUIMIENTO HISTÓRICO</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Historial General de Notas & Comprobantes</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {allHistoryItems.length} Registros Totales
            </span>
          </h2>
          <p className="text-sm text-slate-400 max-w-3xl">
            Control de todos los vales de despacho, notas de entrega, recibos, facturas y presupuestos. Permite descargar en PDF, editar repuestos, anular y revertir automáticamente el stock al inventario.
          </p>
        </div>

        {/* Acciones Principales */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => scanAndSyncUnsyncedReports()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
            title="Escanear toda la app y subir notas o documentos faltantes a Google Excel"
          >
            <Zap size={15} className={isSyncing ? "animate-bounce" : ""} />
            <span>{isSyncing ? "Sincronizando Nube..." : "Escanear & Subir Todo a Google Excel"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition cursor-pointer border border-cyan-500/30"
            title="Exportar registros filtrados a archivo CSV"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
            <FileCheck2 size={22} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">Documentos Filtrados</p>
            <h3 className="text-xl font-bold text-white font-mono">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">Respaldados en Google Excel</p>
            <h3 className="text-xl font-bold text-emerald-400 font-mono">
              {inCloudCount} <span className="text-xs text-slate-500 font-normal">/ {totalCount}</span>
            </h3>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">Monto Total USD (Filtrado)</p>
            {isAdmin ? (
              <h3 className="text-xl font-bold text-amber-300 font-mono">${totalMontoUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            ) : (
              <h3 className="text-xs font-bold text-slate-500 font-mono italic mt-1">Restringido (Solo Admin)</h3>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">División Actual</p>
            <h3 className="text-sm font-bold text-white font-mono uppercase">{activeDivision}</h3>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS RÁPIDOS Y BÚSQUEDA */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        
        {/* Fila 1: Buscador e Indicador de Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nro. Correlativo, Cliente, Responsable o detalle..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Filter size={14} className="text-cyan-400" />
            <span>Filtros Rápidos Activos</span>
          </div>
        </div>

        {/* Fila 2: Botones / Badges de Filtro por Tipo de Documento */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Filtrar por Tipo de Nota / Comprobante:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'TODOS', label: 'Todos los Documentos' },
              { id: 'NOTA_DESPACHO', label: 'Vales de Despacho / Almacén' },
              { id: 'NOTA_ENTREGA', label: 'Notas de Entrega' },
              { id: 'RECIBO_PAGO', label: 'Recibos de Pago' },
              { id: 'FACTURA', label: 'Facturas Fiscales' },
              { id: 'PRESUPUESTO', label: 'Presupuestos' },
              { id: 'REPORTE_TECNICO', label: 'Reportes de Campo' },
              { id: 'MOVIMIENTO_CONTABLE', label: 'Asientos Contables' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTipoFiltro(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                  tipoFiltro === f.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fila 3: Selects Secundarios (Estado Nube, Período, División) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Estado en la Nube</label>
            <select
              value={estadoNubeFiltro}
              onChange={(e) => setEstadoNubeFiltro(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="TODOS">TODOS LOS ESTADOS</option>
              <option value="EN_NUBE">VERIFICADOS EN GOOGLE EXCEL</option>
              <option value="SOLO_LOCAL">PENDIENTES POR SUBIR (SOLO LOCAL)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Período / Fecha</label>
            <select
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="TODOS">TODAS LAS FECHAS</option>
              <option value="HOY">REGISTRADOS HOY</option>
              <option value="ULTIMOS_7_DIAS">ÚLTIMOS 7 DÍAS</option>
              <option value="ESTE_MES">ESTE MES</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">División Operativa</label>
            <select
              value={divisionFiltro}
              onChange={(e) => setDivisionFiltro(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="TODAS">TODAS LAS DIVISIONES</option>
              <option value="MODERNIZACION">MODERNIZACIÓN</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
          </div>
        </div>

      </div>

      {/* 4. TABLA DEL HISTORIAL */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Correlativo / Tipo</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente / Destino</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Detalle / Concepto</th>
                <th className="p-4 text-right">Monto USD</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Nube Excel</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <History size={32} className="mx-auto mb-2 opacity-40 text-cyan-400" />
                    <p className="text-base font-bold text-slate-400">No se encontraron registros en el historial</p>
                    <p className="text-xs text-slate-500 mt-1">Intenta ajustando los filtros rápidos o cambiando los términos de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isAnulado = item.status === 'ANULADO' || item.status === 'ANULADA';
                  return (
                    <tr key={item.id} className={`transition ${isAnulado ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/40'}`}>
                      
                      {/* Correlativo + Tipo */}
                      <td className="p-4">
                        <div className={`font-mono font-bold ${isAnulado ? 'text-rose-400 line-through opacity-80' : 'text-cyan-400'}`}>
                          {item.correlativo}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isAnulado ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          item.tipo === 'FACTURA' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          item.tipo === 'PRESUPUESTO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          item.tipo === 'RECIBO_PAGO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          item.tipo === 'NOTA_ENTREGA' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          item.tipo === 'REPORTE_TECNICO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          item.tipo === 'NOTA_DESPACHO' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.tipoLabel}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="p-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {item.fecha}
                      </td>

                      {/* Cliente / Destino */}
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-white truncate" title={item.clienteDestino}>
                          {item.clienteDestino}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{item.division}</span>
                      </td>

                      {/* Responsable */}
                      <td className="p-4 text-xs font-mono text-slate-300 max-w-[140px] truncate" title={item.responsable}>
                        {item.responsable}
                      </td>

                      {/* Detalle / Concepto */}
                      <td className="p-4 text-xs text-slate-300 max-w-sm truncate" title={item.conceptoDetalle}>
                        {item.conceptoDetalle}
                      </td>

                      {/* Monto USD */}
                      <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                        {isAdmin ? (
                          item.montoUSD !== undefined ? (
                            <span className={isAnulado ? 'text-slate-500 line-through' : 'text-emerald-400'}>
                              ${item.montoUSD.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )
                        ) : (
                          <span className="text-slate-500 text-xs font-mono italic font-normal" title="Monto sólo visible para administradores">***</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {isAnulado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Ban size={11} />
                            <span>ANULADO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} />
                            <span>ACTIVO</span>
                          </span>
                        )}
                      </td>

                      {/* Estado Nube */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {item.isSyncedToCloud ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Guardado y verificado en Google Excel">
                            <CheckCircle2 size={12} />
                            <span>En Nube</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Pendiente por sincronizar a la nube">
                            <Clock size={12} />
                            <span>Solo Local</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones Completas */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Vista Previa */}
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            title="Ver detalle del comprobante / Imprimir"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Descargar PDF */}
                          <button
                            onClick={() => handleDownloadPDF(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                            title="Descargar Nota en formato PDF"
                          >
                            <Download size={15} />
                          </button>

                          {/* Editar / Modificar Nota */}
                          {!isAnulado && (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                              title="Modificar datos / repuestos y re-calcular stock"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {/* Anular y Revertir Inventario */}
                          {!isAnulado && item.tipo !== 'MOVIMIENTO_CONTABLE' && (
                            <button
                              onClick={() => setAnularTarget(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 transition cursor-pointer border border-rose-500/20"
                              title="Anular comprobante y devolver repuestos al stock"
                            >
                              <Ban size={15} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DETALLE / VISTA PREVIA IMPRIMIBLE (ESTILO SOMERINCA NOTA DE CONTROL) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative space-y-5 my-4 sm:my-8 max-h-[92vh] overflow-y-auto font-sans"
            >
              {/* BARRA DE ACCIONES SUPERIOR (ESTILO GESTOR SOMERINCA) */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700">
                  <span className="text-amber-500 animate-pulse">⚡</span>
                  <span>Vista previa de Nota de Control / Vale</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedItem)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono transition shadow cursor-pointer"
                  >
                    <Download size={14} /> DESCARGAR PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition shadow cursor-pointer"
                  >
                    <Printer size={14} /> IMPRIMIR / PDF IMPRESORA
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 text-sm font-mono"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* AREA DEL DOCUMENTO SEGÚN TIPO */}
              {selectedItem.tipo === 'FACTURA' || selectedItem.correlativo.startsWith('FACT') || selectedItem.correlativo.startsWith('FC-') ? (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden p-2 sm:p-4">
                  <FacturaDoc 
                    factura={selectedItem.originalItem || {
                      id: selectedItem.id,
                      correlativo: selectedItem.correlativo,
                      fecha: selectedItem.fecha,
                      clienteNombre: selectedItem.clienteDestino,
                      clienteRif: 'J-00000000-0',
                      concepto: selectedItem.conceptoDetalle,
                      subtotalUSD: selectedItem.montoUSD || 0,
                      totalUSD: selectedItem.montoUSD || 0,
                      items: [{ descripcion: selectedItem.conceptoDetalle, cantidad: 1, precioUnitarioUSD: selectedItem.montoUSD || 0 }]
                    }} 
                    empresa={empresaActiva} 
                    tasaCambioBCV={tasaCambioBCV}
                  />
                </div>
              ) : selectedItem.tipo === 'PRESUPUESTO' || selectedItem.correlativo.startsWith('PRES') ? (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden p-2 sm:p-4">
                  <PresupuestoDoc 
                    presupuesto={selectedItem.originalItem || {
                      id: selectedItem.id,
                      correlativo: selectedItem.correlativo,
                      fecha: selectedItem.fecha,
                      clienteNombre: selectedItem.clienteDestino,
                      proyectoAscensor: selectedItem.conceptoDetalle,
                      subtotalUSD: selectedItem.montoUSD || 0,
                      totalUSD: selectedItem.montoUSD || 0,
                      items: [{ descripcion: selectedItem.conceptoDetalle, cantidad: 1, precioUnitarioUSD: selectedItem.montoUSD || 0 }]
                    }} 
                    empresa={empresaActiva} 
                  />
                </div>
              ) : selectedItem.tipo === 'RECIBO_PAGO' || selectedItem.correlativo.startsWith('REC') ? (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden p-2 sm:p-4">
                  <ReciboPagoDoc 
                    recibo={selectedItem.originalItem || {
                      id: selectedItem.id,
                      correlativo: selectedItem.correlativo,
                      fecha: selectedItem.fecha,
                      clienteNombre: selectedItem.clienteDestino,
                      concepto: selectedItem.conceptoDetalle,
                      montoUSD: selectedItem.montoUSD || 0
                    }} 
                    empresa={empresaActiva} 
                  />
                </div>
              ) : (
                <div className="p-4 sm:p-6 border border-slate-200 rounded-xl bg-white space-y-6">
                  {/* CABECERA MEMBRETADA CON LOGO OFICIAL */}
                  <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-3 gap-4">
                    <div className="flex items-center gap-3">
                      <CompanyLogo empresa={empresaActiva} size={36} showText={false} theme="light" />
                      <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                          {empresaActiva.nombre}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                          CARACAS, VENEZUELA — {empresaActiva.slogan}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          RIF: {empresaActiva.rif} | {empresaActiva.direccion}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        {selectedItem.tipoLabel || 'NOTA DE CONTROL / VALE'}
                      </span>
                      <span className="text-lg font-black text-rose-600 font-mono block">
                        N/{selectedItem.correlativo}
                      </span>
                      {(selectedItem.status === 'ANULADO' || selectedItem.status === 'ANULADA') && (
                        <span className="text-[9px] font-bold text-rose-600 uppercase bg-rose-100 px-2 py-0.5 rounded block mt-1">
                          *** ANULADO ***
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONTENIDO METADATOS (DESTINO, RESPONSABLE, FECHA, OBSERVACIÓN) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-4 font-mono">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">DESTINO:</span>
                      <span className="font-bold text-slate-900 uppercase text-sm">{selectedItem.clienteDestino}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">RESPONSABLE:</span>
                      <span className="font-bold text-slate-800 uppercase">{selectedItem.responsable}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">FECHA EMISIÓN:</span>
                      <span className="text-slate-800">{selectedItem.fecha}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px]">OBSERVACIÓN:</span>
                      <span className="text-slate-800 uppercase">{selectedItem.conceptoDetalle}</span>
                    </div>
                  </div>

                  {/* TABLA DE PRODUCTOS CON ENCABEZADO VERDE ESMERALDA */}
                  <div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-emerald-600 text-white font-bold text-[10px] uppercase">
                          <th className="p-2.5 rounded-l">Nº</th>
                          <th className="p-2.5">CÓDIGO / MODELO</th>
                          <th className="p-2.5">DESCRIPCIÓN / BARRA</th>
                          <th className="p-2.5">MARCA / REF</th>
                          <th className="p-2.5 text-right rounded-r">CANTIDAD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {(() => {
                          let productosList: any[] = [];
                          if (selectedItem.tipo === 'NOTA_DESPACHO' && selectedItem.originalItem?.Productos) {
                            try {
                              productosList = typeof selectedItem.originalItem.Productos === 'string' ? JSON.parse(selectedItem.originalItem.Productos) : selectedItem.originalItem.Productos;
                            } catch (e) {}
                          }

                          if (Array.isArray(productosList) && productosList.length > 0) {
                            return productosList.map((p: any, idx: number) => (
                              <tr key={p.val_c || idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-900">
                                  {p.val_c || 'N/A'}
                                  <div className="text-[9px] font-normal text-slate-500 font-sans">{p.val_mo || ''}</div>
                                </td>
                                <td className="p-2.5 font-bold text-slate-800">
                                  {p.val_d || p.descripcion || 'Repuesto'}
                                  <div className="text-[9px] font-normal text-slate-500 font-mono">EAN: {p.val_b || 'S/C'}</div>
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {p.val_m || 'CHINA'}
                                  <div className="text-[9px] text-slate-400 font-mono">Ref: {p.val_r || 'S/C'}</div>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                  {p.cantidad || 1} und
                                </td>
                              </tr>
                            ));
                          }

                          return (
                            <tr>
                              <td className="p-2.5 font-bold text-slate-500">1</td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">GENÉRICO</td>
                              <td className="p-2.5 font-bold text-slate-800">{selectedItem.conceptoDetalle}</td>
                              <td className="p-2.5 text-slate-600">N/A</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">1 und</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* FIRMAS DE CONFORMIDAD */}
                  <div className="pt-10 flex justify-between gap-8 text-center text-xs font-mono font-bold text-slate-700">
                    <div className="flex-1 border-t border-slate-400 pt-2">
                      ENTREGADO Y APROBADO POR
                    </div>
                    <div className="flex-1 border-t border-slate-400 pt-2">
                      RECIBIDO CONFORME (RESPONSABLE)
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.montoUSD !== undefined && (
                <div className="bg-slate-900 text-white p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-mono text-slate-400">Monto del Comprobante</p>
                  {isAdmin ? (
                    <>
                      <h3 className="text-2xl font-black font-mono text-cyan-400">${selectedItem.montoUSD.toFixed(2)} USD</h3>
                      <p className="text-xs font-mono text-slate-300">Bs. {(selectedItem.montoUSD * tasaCambioBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                    </>
                  ) : (
                    <h3 className="text-xs font-bold font-mono text-amber-400/90 italic p-1">[Monto Reservado - Solo Administrador]</h3>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(selectedItem)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-xs transition cursor-pointer"
                  >
                    <Download size={14} /> Descargar PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL DE EDICIÓN / MODIFICACIÓN DE NOTA */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-5 my-4 sm:my-8 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <Edit3 size={18} />
                  <span>Modificar Comprobante #{editingItem.correlativo}</span>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Cliente / Destino</label>
                  <input
                    type="text"
                    value={editCliente}
                    onChange={(e) => setEditCliente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Responsable / Emisor</label>
                  <input
                    type="text"
                    value={editResponsable}
                    onChange={(e) => setEditResponsable(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Detalle / Proyecto / Observación</label>
                  <textarea
                    value={editConcepto}
                    rows={3}
                    onChange={(e) => setEditConcepto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Edición de Repuestos y Cantidades si es Nota de Despacho */}
                {editingItem.tipo === 'NOTA_DESPACHO' && (
                  <div className="border border-slate-800 p-4 rounded-xl bg-slate-950 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <PackageCheck size={14} />
                        <span>Editar Repuestos Despachados (Impacta Stock)</span>
                      </span>
                      <button
                        onClick={() => {
                          const firstProd = products[0];
                          if (firstProd) {
                            setEditProductos(prev => [...prev, { val_c: firstProd.val_c, val_d: firstProd.val_d, cantidad: 1 }]);
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] rounded flex items-center gap-1 transition"
                      >
                        <Plus size={12} /> Añadir Ítem
                      </button>
                    </div>

                    {editProductos.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No hay ítems específicos guardados en el vale.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {editProductos.map((prod, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                            <select
                              value={prod.val_c}
                              onChange={(e) => {
                                const selectedCode = e.target.value;
                                const pObj = products.find(p => p.val_c === selectedCode);
                                setEditProductos(prev => prev.map((p, i) => i === idx ? {
                                  ...p,
                                  val_c: selectedCode,
                                  val_d: pObj ? pObj.val_d : p.val_d
                                } : p));
                              }}
                              className="bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-white flex-1"
                            >
                              {products.map(p => (
                                <option key={p.val_c} value={p.val_c}>
                                  {p.val_c} - {p.val_d} (Stock Actual: {p.val_s})
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min={1}
                              value={prod.cantidad}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setEditProductos(prev => prev.map((p, i) => i === idx ? { ...p, cantidad: val } : p));
                              }}
                              className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-center text-[11px] font-mono text-amber-300"
                            />

                            <button
                              onClick={() => setEditProductos(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20"
                >
                  <Save size={15} /> Guardar & Ajustar Stock
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL DE CONFIRMACIÓN DE ANULACIÓN */}
      <AnimatePresence>
        {anularTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">¿Anular Documento #{anularTarget.correlativo}?</h3>
                  <p className="text-xs text-rose-300 font-mono">Esta acción revertirá automáticamente el stock de repuestos.</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                Al anular este comprobante, todas las cantidades despachadas se reincorporarán inmediatamente al inventario físico de repuestos, registrando una entrada de reversión en el Kárdex y actualizando Google Sheets.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setAnularTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAnular}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
                >
                  <Ban size={15} /> Confirmar Anulación
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
