import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReciboNota } from '../types';
import { 
  FileCheck2, 
  PlusCircle, 
  Printer, 
  Search, 
  XCircle, 
  Building, 
  PenTool, 
  DollarSign,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAllDataToExcelCSV } from '../utils/excelExporter';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import PhotoUploader from './PhotoUploader';
import ReciboPagoDoc from './ReciboPagoDoc';

export default function RecibosNotasTab() {
  const { 
    empresaActiva,
    user,
    recibos, 
    crearReciboNota, 
    anularReciboNota, 
    clientes, 
    activeDivision, 
    tasaCambioBCV, 
    addToast,
    facturas,
    movimientosContables,
    reportesTecnicos,
    presupuestos
  } = useApp();

  const isAdmin = user?.rol === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewRecibo, setPreviewRecibo] = useState<ReciboNota | null>(null);

  // Form states
  const [tipo, setTipo] = useState<'RECIBO_PAGO' | 'NOTA_ENTREGA'>('RECIBO_PAGO');
  const [clienteNombre, setClienteNombre] = useState(clientes[0]?.razonSocial || '');
  const [clienteRif, setClienteRif] = useState(clientes[0]?.rif || '');
  const [concepto, setConcepto] = useState('Recibo de abono mensual por servicio de mantenimiento preventivo de ascensores');
  const [montoUSD, setMontoUSD] = useState('200');
  const [formaPago, setFormaPago] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'ZELLE' | 'PAGO_MOVIL'>('TRANSFERENCIA');
  const [referencia, setReferencia] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Filtrado
  const recibosFiltrados = recibos.filter(r => {
    const matchDiv = r.division === activeDivision;
    const matchSearch = 
      r.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDiv && matchSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valUSD = parseFloat(montoUSD) || 0;

    const nuevo = crearReciboNota({
      tipo,
      fecha: new Date().toISOString().split('T')[0],
      clienteNombre,
      clienteRif,
      concepto,
      montoUSD: valUSD,
      montoBs: valUSD * tasaCambioBCV,
      formaPago,
      referenciaPago: referencia || undefined,
      firmaConformidad: 'MOCK_DIGITAL_SIGNATURE_OK',
      photos,
      status: 'ACTIVO',
      division: activeDivision
    });

    setPhotos([]);
    setShowModal(false);
    setPreviewRecibo(nuevo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <FileCheck2 size={14} />
            <span>MÓDULO 4: RECIBOS Y NOTAS DE ENTREGA</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Comprobantes & Vales Simples — <span className="text-cyan-400">{activeDivision}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Emisión de recibos de abono rápido, notas de entrega simples y pre-hechas con correlativo automático.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              addToast('Generando reporte Excel de Recibos y Notas de Entrega...', 'info');
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
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer text-sm"
          >
            <PlusCircle size={18} />
            <span>Emitir Recibo / Nota</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nro Recibo, cliente o concepto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tabla Recibos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Correlativo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente / RIF</th>
                <th className="p-4">Concepto</th>
                <th className="p-4 text-right">Monto USD</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recibosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay recibos ni notas de entrega registradas.
                  </td>
                </tr>
              ) : (
                recibosFiltrados.map((r) => (
                  <tr key={r.correlativo} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-cyan-400">{r.correlativo}</td>
                    <td className="p-4 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        r.tipo === 'RECIBO_PAGO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {r.tipo === 'RECIBO_PAGO' ? 'RECIBO' : 'NOTA DE ENTREGA'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{r.fecha}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{r.clienteNombre}</div>
                      <div className="text-xs font-mono text-slate-500">{r.clienteRif}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-300 max-w-xs truncate">{r.concepto}</td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      {isAdmin ? `$${r.montoUSD.toFixed(2)}` : <span className="text-slate-500 font-normal text-xs italic">***</span>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        r.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewRecibo(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                          title="Imprimir Recibo"
                        >
                          <Printer size={15} />
                        </button>
                        {r.status === 'ACTIVO' && (
                          <button
                            onClick={() => anularReciboNota(r.correlativo)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Anular Comprobante"
                          >
                            <XCircle size={15} />
                          </button>
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

      {/* MODAL CREAR RECIBO / NOTA */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5"
            >
              <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileCheck2 size={20} className="text-cyan-400" />
                Emitir Recibo o Nota de Entrega
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Comprobante</label>
                  <select 
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="RECIBO_PAGO">RECIBO SIMPLE DE PAGO / ABONO</option>
                    <option value="NOTA_ENTREGA">NOTA DE ENTREGA DE MATERIALES</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nombre / Cliente</label>
                    <input 
                      type="text"
                      required
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Nombre del Cliente o Empresa"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">RIF / C.I.</label>
                    <input 
                      type="text"
                      required
                      value={clienteRif}
                      onChange={(e) => setClienteRif(e.target.value)}
                      placeholder="J-30129481-2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Concepto Detallado</label>
                  <textarea 
                    rows={2}
                    required
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Detalle claro del pago o material entregado..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Monto ($ USD)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={montoUSD}
                      onChange={(e) => setMontoUSD(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Forma de Pago</label>
                    <select 
                      value={formaPago}
                      onChange={(e) => setFormaPago(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
                      <option value="EFECTIVO">EFECTIVO USD / BS</option>
                      <option value="ZELLE">ZELLE</option>
                      <option value="PAGO_MOVIL">PAGO MÓVIL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Referencia / Comprobante de Pago</label>
                  <input 
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej: REF-9920183"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Fotos / Evidencias en Comprobante */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <PhotoUploader
                    photos={photos}
                    onChange={setPhotos}
                    maxPhotos={4}
                    label="Anexar Fotos / Capturas de Comprobante"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Emitir Comprobante
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VISTA PREVIA IMPRIMIBLE RECIBO */}
      <AnimatePresence>
        {previewRecibo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-none print:overflow-visible"
            >
              {/* Documento Renderizado Exacto */}
              <div className="overflow-x-auto">
                <ReciboPagoDoc 
                  recibo={previewRecibo} 
                  empresa={empresaActiva} 
                  tasaCambioBCV={tasaCambioBCV}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 print:hidden font-sans">
                <button
                  onClick={() => setPreviewRecibo(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  <Printer size={14} /> Imprimir Recibo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
