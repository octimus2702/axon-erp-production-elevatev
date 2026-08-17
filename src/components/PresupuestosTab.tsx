import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import { PLANTILLAS_PREHECHAS } from '../data';
import { Presupuesto, ItemPresupuesto } from '../types';
import { exportPresupuestoPDF } from '../utils/pdfPresupuestoExporter';
import PresupuestoDoc from './PresupuestoDoc';
import { 
  Calculator, 
  PlusCircle, 
  Edit3, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Search, 
  Printer, 
  Trash2,
  FileText,
  DollarSign,
  Sparkles,
  Lock,
  ShieldAlert,
  EyeOff,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PresupuestosTab() {
  const { 
    user,
    empresaActiva,
    empresasDisponibles = [],
    setEmpresaActivaId,
    presupuestos, 
    crearPresupuesto, 
    editarPresupuesto, 
    cambiarEstadoPresupuesto, 
    convertirPresupuestoAFactura, 
    clientes, 
    activeDivision, 
    tasaCambioBCV, 
    addToast,
    reportesTecnicos = [],
    products = []
  } = useApp();

  // Reportes de campo enviados por los técnicos que requieren cotización
  const reportesPendientesCotizacion = reportesTecnicos.filter(
    r => r.requierePresupuesto || r.estado === 'PENDIENTE_COTIZACION'
  );

  const isTechOrSupervisor = user?.rol === 'TECNICO' || user?.rol === 'SUPERVISOR';

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [previewPresupuesto, setPreviewPresupuesto] = useState<Presupuesto | null>(null);

  // Form para Crear / Editar
  const [clienteId, setClienteId] = useState(clientes[0]?.id || '');
  const [proyectoAscensor, setProyectoAscensor] = useState('Modernización de Cuadro de Control a VVVF');
  const [notasValidez, setNotasValidez] = useState('Presupuesto válido por 30 días continuos. Forma de pago: 50% anticipo, 50% contra entrega.');
  const [items, setItems] = useState<Omit<ItemPresupuesto, 'id'>[]>([
    { descripcion: 'Suministro e instalación de Cuadro de Mando Integrado Monarch Nice3000+', cantidad: 1, precioUnitarioUSD: 1850 }
  ]);

  // Filtrado
  const presupuestosFiltrados = presupuestos.filter(p => {
    const isPortalWeb = (p.proyectoAscensor || '').toLowerCase().includes('portal web') || p.clienteId === 'SOLICITUD-WEB';
    const matchDiv = p.division === activeDivision || isPortalWeb || !p.division;
    const matchSearch = 
      p.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proyectoAscensor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDiv && matchSearch;
  });

  const handleOpenNew = () => {
    setEditingPresupuesto(null);
    setProyectoAscensor('Modernización de Cuadro de Control a VVVF');
    setItems([{ descripcion: 'Suministro e instalación de Cuadro de Mando Integrado', cantidad: 1, precioUnitarioUSD: 1850 }]);
    setShowModal(true);
  };

  // Convertir un reporte de inspección levantado por el técnico en obra a cotización con precios
  const handleConvertReporteToCotizacion = (rep: any) => {
    setEditingPresupuesto(null);
    const cliEncontrado = clientes.find(c => c.razonSocial.toLowerCase().includes((rep.clienteNombre || '').toLowerCase()) || c.id === rep.clienteNombre);
    if (cliEncontrado) {
      setClienteId(cliEncontrado.id);
    }
    setProyectoAscensor(`[Cotización de Campo] ${rep.clienteNombre} - ${rep.equipoAscensor || 'Ascensor'}`);
    setNotasValidez(`Cotización formulada a partir del levantamiento de inspección en sitio por ${rep.tecnicoNombre} el ${rep.fecha}. Diagnóstico: ${rep.diagnosticoDanio}`);
    
    if (rep.repuestosFaltantes && Array.isArray(rep.repuestosFaltantes) && rep.repuestosFaltantes.length > 0) {
      const newItems = rep.repuestosFaltantes.map((rf: any) => {
        const prodCat = products.find(p => p.val_d.toLowerCase().includes((rf.repuestoNombre || '').toLowerCase()) || p.val_c === rf.repuestoNombre);
        const precioSugerido = prodCat?.precioUSD || 0;
        return {
          descripcion: `${rf.repuestoNombre} (${rf.cantidadRequerida || 1} ${rf.unidadMedida || 'Und'}) ${rf.observaciones ? '- ' + rf.observaciones : ''}`,
          cantidad: rf.cantidadRequerida || 1,
          precioUnitarioUSD: precioSugerido
        };
      });
      setItems(newItems);
    } else {
      setItems([{ descripcion: `Repuestos y mano de obra para ${rep.equipoAscensor}`, cantidad: 1, precioUnitarioUSD: 0 }]);
    }
    setShowModal(true);
    addToast(`Levantamiento de ${rep.tecnicoNombre} cargado. Asigne los precios unitarios y guarde la cotización.`, 'info');
  };

  const handleOpenEdit = (p: Presupuesto) => {
    setEditingPresupuesto(p);
    setClienteId(p.clienteId);
    setProyectoAscensor(p.proyectoAscensor);
    setNotasValidez(p.notasValidez);
    setItems(p.items.map(i => ({ ...i })));
    setShowModal(true);
  };

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

  const handleCargarPlantilla = (plantillaId: string) => {
    const plant = PLANTILLAS_PREHECHAS.find(p => p.id === plantillaId);
    if (plant) {
      setProyectoAscensor(plant.titulo);
      setItems(plant.items.map(it => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precioUnitarioUSD: it.precioUnitarioUSD
      })));
      addToast(`Servicio "${plant.titulo}" cargado en el presupuesto`, 'info');
    }
  };

  const subtotalUSD = items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitarioUSD), 0);
  const ivaUSD = subtotalUSD * 0.16;
  const totalUSD = subtotalUSD + ivaUSD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteObj = clientes.find(c => c.id === clienteId) || clientes[0];
    if (!clienteObj) {
      addToast('Seleccione un cliente válido', 'error');
      return;
    }

    if (items.length === 0 || (!isTechOrSupervisor && subtotalUSD <= 0)) {
      addToast('Agregue al menos un concepto técnico', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const vencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (editingPresupuesto) {
      // Editar existente
      const modificado: Presupuesto = {
        ...editingPresupuesto,
        clienteId: clienteObj.id,
        clienteNombre: clienteObj.razonSocial,
        clienteRif: clienteObj.rif,
        clienteTelefono: clienteObj.telefono,
        proyectoAscensor,
        items: items.map((it, idx) => ({ ...it, id: `ITM-P-${idx}` })),
        subtotalUSD,
        ivaUSD,
        totalUSD,
        notasValidez,
        division: activeDivision
      };
      editarPresupuesto(modificado);
    } else {
      // Crear nuevo
      crearPresupuesto({
        fecha: today,
        fechaVencimiento: vencimiento,
        clienteId: clienteObj.id,
        clienteNombre: clienteObj.razonSocial,
        clienteRif: clienteObj.rif,
        clienteTelefono: clienteObj.telefono,
        proyectoAscensor,
        items: items.map((it, idx) => ({ ...it, id: `ITM-P-${idx}` })),
        subtotalUSD,
        ivaUSD,
        totalUSD,
        estado: 'ENVIADO',
        notasValidez,
        division: activeDivision
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Calculator size={14} />
            <span>MÓDULO 3: PRESUPUESTOS Y COTIZACIONES</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Presupuestos TÉCNICOS DE ASCENSORES — <span className="text-cyan-400">{activeDivision}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cotizaciones oficiales con membrete de <strong className="text-cyan-300 font-mono">{empresaActiva.nombreCorto}</strong> (RIF: {empresaActiva.rif}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {empresasDisponibles.length > 1 && (
            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono shadow-inner">
              <span className="text-[10px] text-amber-400 font-bold mr-2 uppercase">Empresa Cotizante:</span>
              <select
                value={empresaActiva.id}
                onChange={(e) => setEmpresaActivaId(e.target.value as any)}
                className="bg-transparent text-cyan-300 font-extrabold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {empresasDisponibles.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-zinc-200">
                    {emp.nombreCorto}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Generar Presupuesto</span>
          </button>
        </div>
      </div>

      {/* PANEL DE NOTIFICACIONES: REPORTES DE CAMPO ENVIADOS POR TÉCNICOS EN OBRA SIN PRECIO */}
      {reportesPendientesCotizacion.length > 0 && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  📥 Levantamientos de Obra Enviados por Técnicos ({reportesPendientesCotizacion.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Listado de repuestos e inspecciones levantadas en sitio. Haga clic en "Formular Cotización" para asignar precios y enviarlo al cliente.
                </p>
              </div>
            </div>
            <span className="bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/30">
              PENDIENTE PRECIOS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportesPendientesCotizacion.map((rep) => (
              <div 
                key={rep.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 font-bold">{rep.correlativo}</span>
                    <span className="text-slate-500">{rep.fecha}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{rep.clienteNombre}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{rep.diagnosticoDanio}</p>
                  <p className="text-[10px] text-cyan-300 font-mono">
                    Téc: {rep.tecnicoNombre} • {rep.repuestosFaltantes?.length || 0} repuestos requeridos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleConvertReporteToCotizacion(rep)}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calculator size={14} />
                  <span>Formular Cotización Oficial</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por correlativo, cliente o proyecto de ascensor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tabla Presupuestos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Correlativo</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Cliente / Proyecto</th>
                <th className="p-4 text-right">{isTechOrSupervisor ? 'Valoración' : 'Monto Total USD'}</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {presupuestosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No hay presupuestos registrados en este filtro.
                  </td>
                </tr>
              ) : (
                presupuestosFiltrados.map((p) => (
                  <tr key={p.correlativo} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-cyan-400">{p.correlativo}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{p.fecha}</td>
                    <td className="p-4">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{p.clienteNombre}</span>
                        {((p.proyectoAscensor || '').toLowerCase().includes('portal web') || p.clienteId === 'SOLICITUD-WEB') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
                            🌐 Portal Web
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cyan-400/80 mt-0.5">{p.proyectoAscensor}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold">
                      {isTechOrSupervisor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30 font-normal">
                          <Lock size={11} /> Admin
                        </span>
                      ) : (
                        <span className="text-white">${p.totalUSD.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        p.estado === 'APROBADO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        p.estado === 'CONVERTIDO_A_FACTURA' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                        p.estado === 'RECHAZADO' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => exportPresupuestoPDF(p, empresaActiva, tasaCambioBCV)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer flex items-center gap-1 text-xs font-mono font-bold px-2"
                          title="Descargar PDF Oficial"
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                          title="Editar Presupuesto"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setPreviewPresupuesto(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                          title="Vista Previa / Imprimir"
                        >
                          <Printer size={15} />
                        </button>
                        {!isTechOrSupervisor && p.estado !== 'CONVERTIDO_A_FACTURA' && (
                          <button
                            onClick={() => convertirPresupuestoAFactura(p.correlativo, 'FACTURA_FISCAL')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer font-mono text-xs font-bold flex items-center gap-1 px-2"
                            title="Convertir a Factura"
                          >
                            <ArrowRight size={14} /> Facturar
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

      {/* MODAL CREAR / EDITAR PRESUPUESTO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                  <Calculator size={20} className="text-cyan-400" />
                  {editingPresupuesto ? `Editar Presupuesto ${editingPresupuesto.correlativo}` : 'Nuevo Presupuesto Técnico'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Cargar Plantilla de Servicio Rápida */}
                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-medium text-xs">
                    <Sparkles size={16} />
                    <span>Plantilla Rápida de Servicio:</span>
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCargarPlantilla(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- Cargar Tipo de Servicio --</option>
                    {PLANTILLAS_PREHECHAS.map(p => (
                      <option key={p.id} value={p.id}>{p.titulo}</option>
                    ))}
                  </select>
                </div>

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
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Proyecto de Ascensor / Trabajo</label>
                    <input 
                      type="text"
                      required
                      value={proyectoAscensor}
                      onChange={(e) => setProyectoAscensor(e.target.value)}
                      placeholder="Ej: Modernización de Cuadro de Control Torre B"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Ítems Presupuesto */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-400 uppercase">Partidas / Conceptos Técnicos</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Agregar Partida
                    </button>
                  </div>

                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="col-span-6">
                        <input 
                          type="text"
                          required
                          placeholder="Descripción detallada del repuesto o mano de obra..."
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="col-span-3">
                        {isTechOrSupervisor ? (
                          <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px] text-amber-400/80 font-mono text-center flex items-center justify-center gap-1">
                            <Lock size={12} />
                            <span>Solo Admin</span>
                          </div>
                        ) : (
                          <input 
                            type="number"
                            step="0.01"
                            required
                            placeholder="Precio USD"
                            value={it.precioUnitarioUSD}
                            onChange={(e) => handleItemChange(idx, 'precioUnitarioUSD', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                          />
                        )}
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

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Notas de Validez y Condiciones</label>
                  <textarea 
                    rows={2}
                    value={notasValidez}
                    onChange={(e) => setNotasValidez(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {isTechOrSupervisor ? (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-2.5">
                    <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                    <span>
                      <strong>Perfil Técnico / Supervisor:</strong> La estimación económica, subtotal y total final en USD son calculados y valorados exclusivamente por la Gerencia Administrativa.
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>IVA Estimado (16%):</span>
                      <span>${ivaUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1 border-t border-slate-800">
                      <span>TOTAL PRESUPUESTADO:</span>
                      <span>${totalUSD.toFixed(2)}</span>
                    </div>
                  </div>
                )}

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
                    {editingPresupuesto ? 'Guardar Cambios' : 'Generar Presupuesto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VISTA PREVIA PRESUPUESTO */}
      <AnimatePresence>
        {previewPresupuesto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative my-auto print:p-0 print:shadow-none print:max-h-none print:overflow-visible"
            >
              {/* Documento Renderizado Exacto */}
              <div className="overflow-x-auto">
                <PresupuestoDoc 
                  presupuesto={previewPresupuesto} 
                  empresa={empresaActiva} 
                  tasaCambioBCV={tasaCambioBCV}
                  isTechOrSupervisor={isTechOrSupervisor}
                />
              </div>

              {/* Botones de acción (ocultos al imprimir) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-200 print:hidden font-sans">
                <button
                  onClick={() => setPreviewPresupuesto(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-sm transition cursor-pointer"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportPresupuestoPDF(previewPresupuesto, empresaActiva, tasaCambioBCV)}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold text-sm transition shadow-md cursor-pointer"
                  >
                    <Download size={16} /> Descargar PDF Presupuesto
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm transition cursor-pointer"
                  >
                    <Printer size={16} /> Imprimir
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
