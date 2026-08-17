import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PLANTILLAS_PREHECHAS } from '../data';
import { ItemFactura, Factura } from '../types';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import { 
  Receipt, 
  PlusCircle, 
  Printer, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Building, 
  Search, 
  DollarSign, 
  FileText,
  Trash2,
  Sparkles,
  FileSpreadsheet,
  Archive,
  ArchiveRestore,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAllDataToExcelCSV } from '../utils/excelExporter';
import { downloadInvoicePDF } from '../utils/pdfFacturaExporter';
import FacturaDoc from './FacturaDoc';

export default function FacturacionTab() {
  const { 
    empresaActiva,
    facturas, 
    crearFactura, 
    anularFactura, 
    marcarFacturaPagada, 
    archivarFactura,
    desarchivarFactura,
    clientes, 
    activeDivision, 
    tasaCambioBCV, 
    addToast,
    recibos,
    movimientosContables,
    reportesTecnicos,
    presupuestos
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showArchivadas, setShowArchivadas] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewFactura, setPreviewFactura] = useState<Factura | null>(null);

  // Form para Nueva Factura
  const [clienteId, setClienteId] = useState(clientes[0]?.id || '');
  const [tipoComprobante, setTipoComprobante] = useState<'FACTURA_FISCAL' | 'FACTURA_PREHECHA' | 'NOTA_ENTREGA'>('FACTURA_FISCAL');
  const [items, setItems] = useState<Omit<ItemFactura, 'id'>[]>([
    { descripcion: 'Mantenimiento preventivo quincenal/mensual de ascensor', cantidad: 1, precioUnitarioUSD: 350 }
  ]);
  const [observaciones, setObservaciones] = useState('');

  // Filtro con soporte de Soft Delete
  const facturasFiltradas = facturas.filter(f => {
    if (!showArchivadas && f.estado === 'ARCHIVADO') return false;
    if (showArchivadas && f.estado !== 'ARCHIVADO') return false;

    const matchDiv = f.division === activeDivision;
    const matchSearch = 
      f.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.clienteRif.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDiv && matchSearch;
  });

  // Manejadores de Items
  const handleAddItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precioUnitarioUSD: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Cargar Plantilla Pre-hecha
  const handleCargarPlantilla = (plantillaId: string) => {
    const plant = PLANTILLAS_PREHECHAS.find(p => p.id === plantillaId);
    if (plant) {
      setItems(plant.items.map(it => ({ ...it })));
      addToast(`Plantilla pre-hecha "${plant.titulo}" cargada en el formulario`, 'info');
    }
  };

  // Cálculos en vivo
  const subtotalUSD = items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitarioUSD), 0);
  const ivaPorcentaje = tipoComprobante === 'FACTURA_FISCAL' ? 16 : 0;
  const ivaUSD = subtotalUSD * (ivaPorcentaje / 100);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * tasaCambioBCV;

  const handleGuardarFactura = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteObj = clientes.find(c => c.id === clienteId) || clientes[0];
    if (!clienteObj) {
      addToast('Seleccione un cliente válido', 'error');
      return;
    }

    if (items.length === 0 || subtotalUSD <= 0) {
      addToast('Agregue al menos un ítem con monto superior a 0 USD', 'error');
      return;
    }

    const nueva = crearFactura({
      fecha: new Date().toISOString().split('T')[0],
      clienteId: clienteObj.id,
      clienteNombre: clienteObj.razonSocial,
      clienteRif: clienteObj.rif,
      clienteDireccion: clienteObj.direccion,
      tipoComprobante,
      items: items.map((it, idx) => ({ ...it, id: `ITM-${idx}` })),
      subtotalUSD,
      ivaPorcentaje,
      ivaMontoUSD: ivaUSD,
      totalUSD,
      tasaCambioBs: tasaCambioBCV,
      totalBs,
      estado: 'EMITIDA',
      observaciones,
      division: activeDivision
    });

    setShowCreateModal(false);
    setPreviewFactura(nueva);
  };

  return (
    <div className="space-y-6">
      {/* Header Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Receipt size={14} />
            <span>MÓDULO 2: SISTEMA DE FACTURACIÓN</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Facturación & Comprobantes — <span className="text-cyan-400">{activeDivision}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Generación de facturas fiscales, notas de entrega, plantillas pre-hechas, correlativo continuo e impresión formal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              addToast('Generando reporte Excel de Facturación y Ventas...', 'info');
              exportAllDataToExcelCSV({
                facturas,
                recibos,
                movimientosContables,
                reportesTecnicos,
                presupuestos,
                clientes
              });
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 transition cursor-pointer text-sm"
          >
            <FileSpreadsheet size={18} />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer text-sm"
          >
            <PlusCircle size={18} />
            <span>Nueva Factura / Nota</span>
          </button>
        </div>
      </div>

      {/* Buscador y Controles de Archivo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nro Factura, RIF o Razón Social del Cliente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-400">
            Tasa Oficial BCV: <span className="text-cyan-400 font-bold">Bs. {tasaCambioBCV.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setShowArchivadas(!showArchivadas)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              showArchivadas 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Ver facturas archivadas (Soft Delete)"
          >
            <Archive size={13} />
            <span>{showArchivadas ? 'Archivadas' : 'Papelera'}</span>
          </button>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Correlativo</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente / RIF</th>
                <th className="p-4">Tipo Comprobante</th>
                <th className="p-4 text-right">Total USD</th>
                <th className="p-4 text-right">Total Bs</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {facturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay facturas ni comprobantes emitidos en este filtro.
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map((f) => (
                  <tr key={f.correlativo} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-cyan-400">{f.correlativo}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{f.fecha}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{f.clienteNombre}</div>
                      <div className="text-xs font-mono text-slate-500">{f.clienteRif}</div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                        {f.tipoComprobante}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">${f.totalUSD.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-xs text-slate-400">
                      Bs. {f.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        f.estado === 'PAGADA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        f.estado === 'EMITIDA' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        f.estado === 'ARCHIVADO' ? 'bg-slate-700 text-slate-400 border border-slate-600' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {f.estado === 'ARCHIVADO' ? (
                          <button
                            onClick={() => desarchivarFactura(f.correlativo)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition cursor-pointer"
                            title="Reactivar Factura"
                          >
                            <ArchiveRestore size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setPreviewFactura(f)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                              title="Ver / Imprimir Factura"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadInvoicePDF(f, empresaActiva, tasaCambioBCV)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                              title="Descargar PDF Oficial"
                            >
                              <Download size={16} />
                            </button>
                            {f.estado === 'EMITIDA' && (
                              <button
                                onClick={() => marcarFacturaPagada(f.correlativo)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                                title="Marcar Pagada"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            {f.estado !== 'ANULADA' && (
                              <button
                                onClick={() => anularFactura(f.correlativo)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                title="Anular Factura"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => archivarFactura(f.correlativo)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
                              title="Archivar Factura (Soft Delete)"
                            >
                              <Archive size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR NUEVA FACTURA */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Receipt size={20} className="text-cyan-400" />
                  Nueva Factura / Comprobante
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                    División: {activeDivision}
                  </span>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Botones de Carga Rápida de Plantillas Pre-Hechas */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs font-mono text-amber-400 flex items-center gap-1">
                    <Sparkles size={13} /> Plantillas Frecuentes Pre-hechas de Ascensores:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLANTILLAS_PREHECHAS.map((plant) => (
                      <button
                        key={plant.id}
                        type="button"
                        onClick={() => handleCargarPlantilla(plant.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-slate-700 cursor-pointer"
                      >
                        {plant.titulo}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleGuardarFactura} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cliente</label>
                    <select 
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.razonSocial} ({c.rif})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Documento</label>
                    <select 
                      value={tipoComprobante}
                      onChange={(e) => setTipoComprobante(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="FACTURA_FISCAL">FACTURA FISCAL CON IVA (16%)</option>
                      <option value="FACTURA_PREHECHA">FACTURA PRE-HECHA / PROFORMA</option>
                      <option value="NOTA_ENTREGA">NOTA DE ENTREGA / RECIBO</option>
                    </select>
                  </div>
                </div>

                {/* Ítems Desglosados */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-400 uppercase">Conceptos e Ítems a Facturar</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Agregar Ítem
                    </button>
                  </div>

                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="col-span-6">
                        <input 
                          type="text"
                          required
                          placeholder="Descripción del servicio o repuesto de ascensor..."
                          value={it.descripcion}
                          onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number"
                          min="1"
                          required
                          value={it.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number"
                          step="0.01"
                          required
                          placeholder="Precio USD"
                          value={it.precioUnitarioUSD}
                          onChange={(e) => handleItemChange(idx, 'precioUnitarioUSD', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen Totales */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">${subtotalUSD.toFixed(2)}</span>
                  </div>
                  {tipoComprobante === 'FACTURA_FISCAL' && (
                    <div className="flex justify-between text-amber-400">
                      <span>IVA (16%):</span>
                      <span className="font-bold">${ivaUSD.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cyan-400 text-sm font-bold pt-2 border-t border-slate-800">
                    <span>Total USD:</span>
                    <span>${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total a Pagar en Bolívares (Tasa {tasaCambioBCV}):</span>
                    <span className="font-bold">Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Generar Factura / Comprobante
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PREVISUALIZACIÓN E IMPRESIÓN DE FACTURA FISCAL */}
      <AnimatePresence>
        {previewFactura && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative my-auto print:p-0 print:shadow-none print:max-h-none print:overflow-visible"
            >
              {/* Documento Renderizado Exacto */}
              <div className="overflow-x-auto">
                <FacturaDoc 
                  factura={previewFactura} 
                  empresa={empresaActiva} 
                  tasaCambioBCV={tasaCambioBCV}
                />
              </div>

              {/* Firma y Botones */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 print:hidden font-sans">
                <button
                  onClick={() => setPreviewFactura(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-sm transition cursor-pointer"
                >
                  Cerrar Vista Previa
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => downloadInvoicePDF(previewFactura, empresaActiva, tasaCambioBCV)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition cursor-pointer shadow-md"
                  >
                    <Download size={16} /> Descargar PDF
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm transition cursor-pointer shadow-lg"
                  >
                    <Printer size={16} /> Imprimir Factura
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
