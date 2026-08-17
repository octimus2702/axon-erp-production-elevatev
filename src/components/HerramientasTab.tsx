import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrestamoHerramienta, ItemHerramientaPrestada } from '../types';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Printer, 
  Trash2, 
  ArrowLeftRight,
  ShieldAlert,
  Bell,
  Copy,
  Check,
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HerramientasTab() {
  const { 
    products, 
    clientes, 
    empleados, 
    prestamosHerramientas, 
    crearPrestamoHerramienta, 
    actualizarEstadoPrestamoHerramienta, 
    eliminarPrestamoHerramienta,
    activeDivision,
    empresaActiva,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'EN_OBRA' | 'DEVUELTO'>('TODOS');
  
  // Modal Crear Nota de Salida
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [tecnicoNombre, setTecnicoNombre] = useState('');
  const [tecnicoTelefono, setTecnicoTelefono] = useState('');
  const [obraNombre, setObraNombre] = useState('');
  const [ubicacionObra, setUbicacionObra] = useState('');
  const [fechaDevolucionEstimada, setFechaDevolucionEstimada] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [observacionesSalida, setObservacionesSalida] = useState('');

  // Items seleccionados para el préstamo actual
  const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemHerramientaPrestada[]>([]);
  const [searchToolProduct, setSearchToolProduct] = useState('');
  const [cantTool, setCantTool] = useState(1);
  const [serialCode, setSerialCode] = useState('');
  const [obsItem, setObsItem] = useState('');

  // Modal Devolución de Herramientas
  const [showModalDevolucion, setShowModalDevolucion] = useState(false);
  const [selectedLoanForDevolucion, setSelectedLoanForDevolucion] = useState<string>('');
  const [obsDevolucionText, setObsDevolucionText] = useState('');

  // Modal Detalle / Reporte Imprimible
  const [selectedLoan, setSelectedLoan] = useState<PrestamoHerramienta | null>(null);

  // Copia de estado
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Productos etiquetados como Herramienta + catálogo general del almacén central
  const catalogTools = products.filter(p => p.esHerramienta);
  const allDivisionProducts = products;

  // Préstamos filtrados por división
  const divisionLoans = prestamosHerramientas.filter(p => p.division === activeDivision);

  const filteredLoans = divisionLoans.filter(loan => {
    const matchTerm = 
      loan.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.tecnicoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.obraNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.items.some(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchTerm) return false;
    if (filterEstado === 'EN_OBRA' && loan.estado !== 'EN_OBRA') return false;
    if (filterEstado === 'DEVUELTO' && loan.estado !== 'DEVUELTO') return false;

    return true;
  });

  // Agregar ítem al préstamo
  const handleAddItem = (sku: string, nombre: string) => {
    if (cantTool <= 0) return;
    const existingIndex = itemsSeleccionados.findIndex(i => i.sku === sku);
    if (existingIndex >= 0) {
      const updated = [...itemsSeleccionados];
      updated[existingIndex].cantidad += cantTool;
      if (serialCode) updated[existingIndex].serialOCodigo = serialCode;
      if (obsItem) updated[existingIndex].observacionEstado = obsItem;
      setItemsSeleccionados(updated);
    } else {
      setItemsSeleccionados(prev => [
        ...prev,
        {
          sku,
          nombre,
          cantidad: cantTool,
          serialOCodigo: serialCode || undefined,
          observacionEstado: obsItem || undefined
        }
      ]);
    }
    setCantTool(1);
    setSerialCode('');
    setObsItem('');
  };

  const handleRemoveItem = (sku: string) => {
    setItemsSeleccionados(prev => prev.filter(i => i.sku !== sku));
  };

  // Guardar Préstamo
  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tecnicoNombre.trim() || !obraNombre.trim()) {
      addToast('Por favor ingresa el nombre del técnico y la obra solicitante.', 'error');
      return;
    }
    if (itemsSeleccionados.length === 0) {
      addToast('Debes seleccionar al menos una herramienta para la nota de salida.', 'error');
      return;
    }

    const newLoan = crearPrestamoHerramienta({
      tecnicoNombre: tecnicoNombre.trim(),
      tecnicoTelefono: tecnicoTelefono.trim(),
      obraNombre: obraNombre.trim(),
      ubicacionObra: ubicacionObra.trim(),
      fechaSolicitud: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fechaDevolucionEstimada,
      items: itemsSeleccionados,
      estado: 'EN_OBRA',
      observacionesSalida: observacionesSalida.trim() || undefined,
      division: activeDivision
    });

    // Abrir reporte de inmediato
    setSelectedLoan(newLoan);

    // Resetear form
    setTecnicoNombre('');
    setTecnicoTelefono('');
    setObraNombre('');
    setUbicacionObra('');
    setObservacionesSalida('');
    setItemsSeleccionados([]);
    setShowModalCrear(false);
  };

  // Redactar mensaje de recordatorio WhatsApp para el lunes
  const redactarMensajeWhatsApp = (loan: PrestamoHerramienta) => {
    const listaHerramientas = loan.items.map(i => `• *${i.cantidad}x* ${i.nombre}${i.serialOCodigo ? ` (S/N: ${i.serialOCodigo})` : ''}`).join('\n');
    const gestorInfo = empresaActiva.nombreGestor ? ` (Gestor: *${empresaActiva.nombreGestor}*)` : '';
    
    const texto = `👋 Hola *${loan.tecnicoNombre}*, cordial saludo de *${empresaActiva.nombreCorto || 'Axon ERP'}*${gestorInfo}.\n\n` +
      `📌 *RECORDATORIO DE HERRAMIENTAS EN OBRA*\n` +
      `Te recordamos que se te asignaron las siguientes herramientas para la obra *${loan.obraNombre}*:\n\n` +
      `${listaHerramientas}\n\n` +
      `🗓️ *Fecha de Salida:* ${loan.fechaSolicitud.substring(0, 10)}\n` +
      `📋 *Nota N°:* ${loan.correlativo}\n` +
      `⏳ *Devolución Estimada:* ${loan.fechaDevolucionEstimada || 'Por confirmar'}\n\n` +
      `Por favor, si ya no requieres estos equipos en el sitio, agradecemos realizarlos llegar al almacén central para su revisión y reingreso al stock.\n\n` +
      `¡Muchas gracias por tu compromiso con el cuidado de los equipos! 🛠️`;

    return texto;
  };

  const handleEnviarWhatsApp = (loan: PrestamoHerramienta) => {
    const texto = redactarMensajeWhatsApp(loan);
    const encodedText = encodeURIComponent(texto);
    
    // Limpiar teléfono
    let phoneNum = (loan.tecnicoTelefono || '').replace(/[^0-9]/g, '');
    if (phoneNum.length === 10 && phoneNum.startsWith('0')) {
      phoneNum = '58' + phoneNum.substring(1); // Venezuela por defecto si no trae código
    } else if (phoneNum.length === 11 && phoneNum.startsWith('04')) {
      phoneNum = '58' + phoneNum.substring(1);
    }

    if (phoneNum) {
      window.open(`https://wa.me/${phoneNum}?text=${encodedText}`, '_blank');
    } else {
      navigator.clipboard.writeText(texto);
      setCopiedId(loan.id);
      addToast('Mensaje de recordatorio copiado al portapapeles. ¡Pégalo en WhatsApp!', 'info');
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  const handleNotificarGestor = (loan: PrestamoHerramienta) => {
    const gestorPhone = (empresaActiva.telefonoGestor || empresaActiva.telefono || '').replace(/[^0-9]/g, '');
    let cleanPhone = gestorPhone;
    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      cleanPhone = '58' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('04')) {
      cleanPhone = '58' + cleanPhone.substring(1);
    }

    const listaHerramientas = loan.items.map(i => `• *${i.cantidad}x* ${i.nombre}`).join('\n');
    const texto = `🔔 *NOTIFICACIÓN AL GESTOR (${empresaActiva.nombreGestor || 'Gestor Operativo'})*\n\n` +
      `Se ha generado la Nota de Salida *${loan.correlativo}* para la obra *${loan.obraNombre}*.\n` +
      `👷 *Técnico Responsable:* ${loan.tecnicoNombre}\n\n` +
      `🛠️ *Herramientas Asignadas:*\n${listaHerramientas}\n\n` +
      `🗓️ *Fecha:* ${loan.fechaSolicitud.substring(0, 10)}`;

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`, '_blank');
      addToast(`Enviando reporte al WhatsApp del gestor asignado (${cleanPhone})...`, 'info');
    } else {
      navigator.clipboard.writeText(texto);
      addToast('Copiado reporte del gestor al portapapeles (Asigna el número del gestor en Ajustes).', 'info');
    }
  };

  const prestamosPendientes = divisionLoans.filter(l => l.estado === 'EN_OBRA');

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Wrench size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
                Herramientas en Obra & Control de Préstamos
              </h1>
              <p className="text-xs text-zinc-400">
                Gestión automatizada de vales de salida de activos, reportes de obras y recordatorios de devolución semanal
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowModalDevolucion(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs font-mono transition flex items-center justify-center gap-2 shadow-md cursor-pointer border border-emerald-400/30"
            title="Registrar devolución de herramientas para reingresar stock y cambiar estatus a DEVUELTO"
          >
            <PackageCheck size={16} />
            <span>Registrar Entrada de Devolución</span>
          </button>

          <button
            onClick={() => setShowModalCrear(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs font-mono transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>Nueva Nota de Salida</span>
          </button>
        </div>
      </div>

      {/* METRICAS DE PRÉSTAMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Prestadas en Obras</span>
            <span className="text-xl font-mono font-black text-amber-400">{prestamosPendientes.length} Notas</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Devueltas a Almacén</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {divisionLoans.filter(l => l.estado === 'DEVUELTO').length} Notas
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Wrench size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Catálogo de Herramientas</span>
            <span className="text-xl font-mono font-black text-cyan-300">{catalogTools.length} Activos</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Bell size={20} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Recordatorio Semanal</span>
            <span className="text-xs font-mono text-purple-300 font-bold">Disponible WhatsApp</span>
          </div>
        </div>
      </div>

      {/* PANEL DE RECORDATORIOS AUTOMÁTICOS DE LOS LUNES */}
      {prestamosPendientes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Bell className="text-amber-400 animate-pulse" size={18} />
              <div>
                <h3 className="text-sm font-bold text-amber-200">Panel de Recordatorio Semanal para Técnicos (Lunes)</h3>
                <p className="text-[11px] text-zinc-400">Envía un aviso de cortesía a los técnicos que mantienen equipos y herramientas en campo.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
              {prestamosPendientes.length} Pendiente(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prestamosPendientes.map(loan => (
              <div key={loan.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">{loan.tecnicoNombre}</span>
                    <span className="text-[11px] text-amber-400 font-mono block">Obra: {loan.obraNombre}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {loan.correlativo}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-zinc-400 border-t border-slate-850 pt-1.5 flex justify-between">
                  <span>Prestado: {loan.fechaSolicitud.substring(0, 10)}</span>
                  <span>Items: {loan.items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handleEnviarWhatsApp(loan)}
                    className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-[10.5px] font-mono font-bold rounded transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Enviar recordatorio por WhatsApp al técnico"
                  >
                    <Send size={11} />
                    <span>Recordatorio</span>
                  </button>

                  <button
                    onClick={() => handleNotificarGestor(loan)}
                    className="py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[10.5px] font-mono font-bold rounded transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Enviar reporte al WhatsApp del Gestor asignado"
                  >
                    <Bell size={11} />
                    <span>Aviso Gestor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative flex-1 w-full">
          <input 
            type="text"
            placeholder="Buscar por correlativo, técnico, obra o nombre de herramienta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:border-amber-500 font-mono"
          />
          <Search size={14} className="text-zinc-500 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setFilterEstado('TODOS')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition ${
              filterEstado === 'TODOS' 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-950 text-zinc-400 border border-slate-800 hover:text-zinc-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterEstado('EN_OBRA')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition ${
              filterEstado === 'EN_OBRA' 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-950 text-zinc-400 border border-slate-800 hover:text-zinc-200'
            }`}
          >
            En Obra ({divisionLoans.filter(l => l.estado === 'EN_OBRA').length})
          </button>
          <button
            onClick={() => setFilterEstado('DEVUELTO')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition ${
              filterEstado === 'DEVUELTO' 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-950 text-zinc-400 border border-slate-800 hover:text-zinc-200'
            }`}
          >
            Devueltos ({divisionLoans.filter(l => l.estado === 'DEVUELTO').length})
          </button>
        </div>
      </div>

      {/* TABLA DE NOTAS DE SALIDA Y PRÉSTAMOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-400">
                <th className="py-3 px-4">Correlativo / Fecha</th>
                <th className="py-3 px-4">Técnico Solicitante</th>
                <th className="py-3 px-4">Obra / Destino</th>
                <th className="py-3 px-4">Herramientas Prestadas</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                    <Wrench className="mx-auto mb-2 opacity-30" size={32} />
                    <span>No hay registros de préstamos de herramientas en obra con los criterios seleccionados.</span>
                  </td>
                </tr>
              ) : (
                filteredLoans.map(loan => {
                  const isPending = loan.estado === 'EN_OBRA';
                  return (
                    <tr key={loan.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-400 block">{loan.correlativo}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{loan.fechaSolicitud}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-200 block">{loan.tecnicoNombre}</span>
                        {loan.tecnicoTelefono && (
                          <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                            <Phone size={10} />
                            {loan.tecnicoTelefono}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-zinc-300 font-semibold block">{loan.obraNombre}</span>
                        {loan.ubicacionObra && (
                          <span className="text-[10px] text-zinc-500 block truncate max-w-xs">{loan.ubicacionObra}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {loan.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-zinc-300 font-mono flex items-center gap-1.5">
                              <span className="text-amber-400 font-bold">{it.cantidad}x</span>
                              <span className="truncate max-w-xs">{it.nombre}</span>
                              {it.serialOCodigo && (
                                <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800/40">
                                  {it.serialOCodigo}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            <Clock size={10} />
                            EN OBRA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} />
                            DEVUELTO
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver Reporte / Imprimir */}
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 rounded transition cursor-pointer"
                            title="Ver Reporte y Hoja de Salida de Herramientas"
                          >
                            <FileText size={14} />
                          </button>

                          {/* Recordatorio WhatsApp */}
                          {isPending && (
                            <button
                              onClick={() => handleEnviarWhatsApp(loan)}
                              className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded transition cursor-pointer"
                              title="Enviar recordatorio de devolución por WhatsApp"
                            >
                              <Send size={14} />
                            </button>
                          )}

                          {/* Reingresar Herramientas */}
                          {isPending ? (
                            <button
                              onClick={() => actualizarEstadoPrestamoHerramienta(loan.id, 'DEVUELTO')}
                              className="p-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded transition cursor-pointer"
                              title="Marcar como Devuelto al Almacén (Restablece Stock)"
                            >
                              <PackageCheck size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => actualizarEstadoPrestamoHerramienta(loan.id, 'EN_OBRA')}
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-zinc-500 border border-slate-800 rounded transition cursor-pointer"
                              title="Reabrir Préstamo en Obra"
                            >
                              <ArrowLeftRight size={14} />
                            </button>
                          )}

                          {/* Eliminar */}
                          <button
                            onClick={() => eliminarPrestamoHerramienta(loan.id)}
                            className="p-1.5 bg-slate-950 hover:bg-rose-950 text-zinc-600 hover:text-rose-400 border border-slate-800 rounded transition cursor-pointer"
                            title="Eliminar Registro"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* MODAL CREAR NUEVA NOTA DE SALIDA */}
      <AnimatePresence>
        {showModalCrear && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-5 my-8"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Wrench size={18} className="text-amber-400" />
                  <span className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                    Nueva Nota de Salida de Herramientas
                  </span>
                </div>
                <button 
                  onClick={() => setShowModalCrear(false)}
                  className="text-zinc-500 hover:text-zinc-300 font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitLoan} className="space-y-4">
                
                {/* TÉCNICO Y TELÉFONO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Técnico Solicitante *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: Téc. Manuel Guerra"
                      value={tecnicoNombre}
                      onChange={(e) => setTecnicoNombre(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Teléfono WhatsApp (Para Recordatorios)</label>
                    <input 
                      type="text"
                      placeholder="Ej: +584123049182"
                      value={tecnicoTelefono}
                      onChange={(e) => setTecnicoTelefono(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* OBRA Y UBICACIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre de la Obra / Cliente *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: Residencias Altamira Plaza Torre A"
                      value={obraNombre}
                      onChange={(e) => setObraNombre(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Devolución Estimada</label>
                    <input 
                      type="date"
                      value={fechaDevolucionEstimada}
                      onChange={(e) => setFechaDevolucionEstimada(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* SELECCIÓN DE HERRAMIENTAS Y ACTIVOS */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-amber-300 block uppercase tracking-wide">
                    🛠️ Selección de Herramientas del Inventario
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">Buscar Herramienta o Repuesto</label>
                      <select 
                        value={searchToolProduct}
                        onChange={(e) => setSearchToolProduct(e.target.value)}
                        className="w-full bg-slate-900 text-xs text-zinc-200 border border-slate-800 rounded py-2 px-2 focus:outline-none"
                      >
                        <option value="">-- Seleccionar de la lista --</option>
                        {allDivisionProducts.map(p => (
                          <option key={p.val_c} value={p.val_c}>
                            {p.esHerramienta ? '🧰 ' : ''}{p.val_c} | {p.val_mo} - {p.val_d} (Stock: {p.val_s})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">Cantidad</label>
                      <input 
                        type="number"
                        min="1"
                        value={cantTool}
                        onChange={(e) => setCantTool(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-900 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input 
                        type="text"
                        placeholder="Serial o Código del Equipo (Opcional)"
                        value={serialCode}
                        onChange={(e) => setSerialCode(e.target.value)}
                        className="w-full bg-slate-900 text-xs text-zinc-200 border border-slate-800 rounded py-1.5 px-3 font-mono"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!searchToolProduct) return;
                          const selectedProd = allDivisionProducts.find(p => p.val_c === searchToolProduct);
                          if (selectedProd) {
                            handleAddItem(selectedProd.val_c, `${selectedProd.val_mo} - ${selectedProd.val_d}`);
                            setSearchToolProduct('');
                          }
                        }}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono rounded transition cursor-pointer"
                      >
                        + Agregar a la Nota
                      </button>
                    </div>
                  </div>

                  {/* LISTA DE ITEMS AGREGADOS */}
                  {itemsSeleccionados.length > 0 && (
                    <div className="mt-3 border-t border-slate-800 pt-3 space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase block">Herramientas en esta Nota ({itemsSeleccionados.length})</span>
                      {itemsSeleccionados.map((item, idx) => (
                        <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-amber-400 font-mono mr-2">{item.cantidad}x</span>
                            <span className="text-zinc-200 font-medium">{item.nombre}</span>
                            {item.serialOCodigo && (
                              <span className="text-[10px] font-mono text-cyan-400 block">S/N: {item.serialOCodigo}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.sku)}
                            className="text-rose-400 hover:text-rose-300 font-mono text-xs px-2 py-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Observaciones / Estado de Entrega</label>
                  <textarea 
                    placeholder="Detalles sobre el estado del equipo o propósito del préstamo en la obra..."
                    value={observacionesSalida}
                    onChange={(e) => setObservacionesSalida(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModalCrear(false)}
                    className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-xs text-zinc-400 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 text-xs font-bold rounded-lg transition shadow-md cursor-pointer"
                  >
                    Generar Nota de Salida
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLE Y REPORTE IMPRIMIBLE DE NOTA DE SALIDA */}
      <AnimatePresence>
        {selectedLoan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 my-8"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 print:hidden">
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} />
                  Reporte de Salida de Herramientas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Imprimir / PDF</span>
                  </button>
                  <button 
                    onClick={() => setSelectedLoan(null)}
                    className="text-zinc-500 hover:text-zinc-300 font-mono text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* MEMBRETE DEL REPORTE */}
              <div className="bg-white text-slate-950 p-6 rounded-lg space-y-4 font-sans text-xs">
                <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">AXON ERP GESTOR</h2>
                    <p className="text-[10px] text-slate-600 font-mono">Control de Equipos y Activos de Obra</p>
                    <p className="text-[10px] text-slate-500">Gestión de Mantenimiento & Modernización</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-amber-600 block">{selectedLoan.correlativo}</span>
                    <span className="text-[10px] text-slate-500 block">Fecha: {selectedLoan.fechaSolicitud}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Técnico Responsable</span>
                    <span className="font-bold text-slate-900 text-xs block">{selectedLoan.tecnicoNombre}</span>
                    <span className="text-[10px] text-slate-600 font-mono">{selectedLoan.tecnicoTelefono || 'Sin teléfono'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Obra / Sitio de Trabajo</span>
                    <span className="font-bold text-slate-900 text-xs block">{selectedLoan.obraNombre}</span>
                    <span className="text-[10px] text-slate-600">{selectedLoan.ubicacionObra || 'Dirección general'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 uppercase text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                    Listado de Herramientas Solicitadas
                  </h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-[10px] font-mono text-slate-600 uppercase">
                        <th className="py-1">Cant.</th>
                        <th className="py-1">Descripción de Herramienta</th>
                        <th className="py-1">Serial / Código</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
                      {selectedLoan.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-bold text-amber-700">{it.cantidad}x</td>
                          <td className="py-1.5">{it.nombre}</td>
                          <td className="py-1.5 text-slate-600">{it.serialOCodigo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedLoan.observacionesSalida && (
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-[11px] text-slate-700">
                    <strong>Observaciones:</strong> {selectedLoan.observacionesSalida}
                  </div>
                )}

                {/* FIRMAS DE RESPONSABILIDAD */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600 font-mono">
                  <div className="border-t border-slate-400 pt-1">
                    <span>Firma Técnico Solicitante</span>
                    <br />
                    <span className="font-bold text-slate-800">{selectedLoan.tecnicoNombre}</span>
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <span>Firma Almacén / Gestor</span>
                    <br />
                    <span className="font-bold text-slate-800">Axon ERP Control</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 print:hidden">
                <button
                  onClick={() => handleEnviarWhatsApp(selectedLoan)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Enviar Recordatorio por WhatsApp</span>
                </button>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 font-bold text-xs font-mono rounded-lg transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* MODAL DEVOLUCIÓN DE HERRAMIENTAS AUTOMÁTICA */}
        {showModalDevolucion && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                  <PackageCheck size={20} />
                  <span>Registrar Entrada de Devolución de Herramienta</span>
                </div>
                <button onClick={() => setShowModalDevolucion(false)} className="text-zinc-500 hover:text-white">✕</button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedLoanForDevolucion) {
                    addToast('Por favor selecciona una nota de préstamo en obra activa.', 'error');
                    return;
                  }
                  actualizarEstadoPrestamoHerramienta(selectedLoanForDevolucion, 'DEVUELTO', obsDevolucionText);
                  setShowModalDevolucion(false);
                  setSelectedLoanForDevolucion('');
                  setObsDevolucionText('');
                }} 
                className="space-y-4 text-xs font-mono"
              >
                <div>
                  <label className="block text-zinc-400 mb-1 font-bold">Seleccionar Préstamo Activo en Obra*</label>
                  <select
                    required
                    value={selectedLoanForDevolucion}
                    onChange={(e) => setSelectedLoanForDevolucion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Seleccionar Nota de Préstamo --</option>
                    {divisionLoans.filter(l => l.estado === 'EN_OBRA').map(l => (
                      <option key={l.id} value={l.id}>
                        {l.correlativo} - {l.tecnicoNombre} (Obra: {l.obraNombre})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mostrar ítems del préstamo seleccionado */}
                {selectedLoanForDevolucion && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Herramientas a Reingresar al Stock:</span>
                    {divisionLoans.find(l => l.id === selectedLoanForDevolucion)?.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-zinc-300 text-xs">
                        <span>• {it.nombre}</span>
                        <span className="text-emerald-400 font-bold">+{it.cantidad} Unds</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 mb-1">Observación de Recepción / Estado al Devolver</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Herramientas inspeccionadas y reingresadas completas al almacén central en excelente estado."
                    value={obsDevolucionText}
                    onChange={(e) => setObsDevolucionText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>Al procesar la entrada, la nota cambiará a estatus <strong>DEVUELTO</strong> y las cantidades de las herramientas se sumarán automáticamente de vuelta al inventario.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModalDevolucion(false)}
                    className="px-4 py-2 bg-slate-950 text-zinc-400 border border-slate-800 rounded-lg hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md"
                  >
                    Confirmar Entrada & Cambiar a Devuelto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
