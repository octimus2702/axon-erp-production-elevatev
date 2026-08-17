import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Inbox, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { SolicitudCotizacionCliente } from '../types';

export default function SolicitudesClientesTab() {
  const { 
    solicitudesClientes, 
    actualizarEstadoSolicitudCliente, 
    eliminarSolicitudCliente, 
    convertirSolicitudClienteAPresupuesto, 
    consolidarBufferCotizacion,
    sincronizarSolicitudesClientesAExcel,
    isSyncing,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('ALL');
  const [selectedServicioFilter, setSelectedServicioFilter] = useState<string>('ALL');
  const [activeModalSolicitud, setActiveModalSolicitud] = useState<SolicitudCotizacionCliente | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Filtrar solicitudes (ocultando ARCHIVADO por defecto)
  const filteredSolicitudes = useMemo(() => {
    return solicitudesClientes.filter(s => {
      if (s.estado === 'ARCHIVADO') return false;

      const matchSearch = 
        s.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.edificioUbicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.telefono.includes(searchTerm) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = selectedEstadoFilter === 'ALL' || s.estado === selectedEstadoFilter;
      const matchServicio = selectedServicioFilter === 'ALL' || s.tipoServicio === selectedServicioFilter;

      return matchSearch && matchEstado && matchServicio;
    });
  }, [solicitudesClientes, searchTerm, selectedEstadoFilter, selectedServicioFilter]);

  // Contadores
  const pendientesSubirExcel = solicitudesClientes.filter(s => !s.subidoAExcel).length;
  const nuevasCount = solicitudesClientes.filter(s => s.estado === 'NUEVA').length;
  const cotizadasCount = solicitudesClientes.filter(s => s.estado === 'COTIZADO').length;

  const handleSubirLoteExcel = async () => {
    setIsTransferring(true);
    await sincronizarSolicitudesClientesAExcel();
    setIsTransferring(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE LA BANDEJA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Inbox size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Bandeja de Solicitudes y Cotizaciones de Clientes</span>
                  {nuevasCount > 0 && (
                    <span className="text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
                      {nuevasCount} Nueva(s)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Recepción de presupuestos en tiempo real desde el portal web. Transferencia agrupada a Google Sheets.
                </p>
              </div>
            </div>
          </div>

          {/* BOTÓN DE SINCRONIZACIÓN A EXCEL */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSubirLoteExcel}
              disabled={isSyncing || isTransferring || pendientesSubirExcel === 0}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg cursor-pointer ${
                pendientesSubirExcel > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>
                {isSyncing || isTransferring 
                  ? 'Subiendo a Excel...' 
                  : `Subir Solicitudes a Excel (${pendientesSubirExcel} Pendientes)`}
              </span>
            </button>
          </div>
        </div>

        {/* METRICAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Recibidas</span>
            <span className="text-lg font-mono font-bold text-white">{solicitudesClientes.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Nuevas por Atender</span>
            <span className="text-lg font-mono font-bold text-rose-400">{nuevasCount}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Cotizadas en ERP</span>
            <span className="text-lg font-mono font-bold text-cyan-400">{cotizadasCount}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Pendientes de Excel</span>
            <span className="text-lg font-mono font-bold text-amber-400">{pendientesSubirExcel}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, edificio, teléfono..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedEstadoFilter}
            onChange={(e) => setSelectedEstadoFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-cyan-500"
          >
            <option value="ALL">📋 Todos los Estados</option>
            <option value="NUEVA">🔴 Nuevas</option>
            <option value="EN_REVISION">🟡 En Revisión</option>
            <option value="COTIZADO">🟢 Cotizadas</option>
            <option value="DESCARTADO">⚪ Descartadas</option>
          </select>

          <select
            value={selectedServicioFilter}
            onChange={(e) => setSelectedServicioFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-cyan-500"
          >
            <option value="ALL">⚙️ Todos los Servicios</option>
            <option value="MODERNIZACION">Modernización</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="REPARACION">Reparación</option>
            <option value="INSTALACION_NUEVA">Instalación Nueva</option>
            <option value="AUDITORIA_INSPECCION">Auditoría / Inspección</option>
          </select>
        </div>
      </div>

      {/* LISTADO DE SOLICITUDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSolicitudes.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Inbox size={40} className="mx-auto text-slate-600" />
            <h3 className="text-sm font-bold text-white font-mono">No hay solicitudes en la bandeja</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Las cotizaciones que envíen los clientes desde la página web aparecerán aquí en tiempo real.
            </p>
          </div>
        ) : (
          filteredSolicitudes.map(sol => {
            return (
              <div 
                key={sol.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* CABECERA DE SOLICITUD */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{sol.correlativo}</span>
                    <div className="flex items-center gap-1.5">
                      {sol.subidoAExcel ? (
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>Excel</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={11} />
                          <span>Pendiente</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        sol.estado === 'NUEVA' ? 'bg-rose-500/20 text-rose-300' :
                        sol.estado === 'COTIZADO' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {sol.estado}
                      </span>
                    </div>
                  </div>

                  {/* DATOS DEL CLIENTE Y EDIFICIO */}
                  <div>
                    <h3 className="text-sm font-bold text-white">{sol.clienteNombre}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                      <Building2 size={13} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{sol.edificioUbicacion} {sol.apartamentoTorre ? `- ${sol.apartamentoTorre}` : ''}</span>
                    </div>
                  </div>

                  {/* DETALLES DE CONTACTO */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Contacto:</span>
                      <span className="font-bold">{sol.personaContacto}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Teléfono:</span>
                      <a href={`tel:${sol.telefono}`} className="text-cyan-400 hover:underline">{sol.telefono}</a>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Servicio:</span>
                      <span className="text-amber-400 font-bold">{sol.tipoServicio} ({sol.paradas} Paradas)</span>
                    </div>
                  </div>

                  {/* DESCRIPCIÓN */}
                  <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    {sol.detalles || 'Sin especificaciones adicionales.'}
                  </p>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{sol.fecha} {sol.hora}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveModalSolicitud(sol)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono transition"
                      title="Ver Detalles Completos"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => consolidarBufferCotizacion(sol.id)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                      title="Consolidar en Master Presupuestos y marcar en Supabase"
                    >
                      <span>Cotizar / Master</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarSolicitudCliente(sol.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition"
                      title="Descartar Solicitud"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALLE DE SOLICITUD */}
      {activeModalSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Inbox className="text-cyan-400" size={20} />
                <div>
                  <h3 className="text-base font-bold font-mono text-white">{activeModalSolicitud.correlativo}</h3>
                  <p className="text-xs text-slate-400 font-mono">Solicitud de Cotización en Línea</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalSolicitud(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                <div>
                  <span className="text-slate-500 block">Cliente / Empresa:</span>
                  <span className="text-white font-bold">{activeModalSolicitud.clienteNombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">RIF / Cédula:</span>
                  <span className="text-slate-300">{activeModalSolicitud.clienteRif || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Persona Contacto:</span>
                  <span className="text-cyan-300 font-bold">{activeModalSolicitud.personaContacto}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Teléfono:</span>
                  <span className="text-slate-200">{activeModalSolicitud.telefono}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <span className="text-slate-200">{activeModalSolicitud.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha y Hora:</span>
                  <span className="text-slate-200">{activeModalSolicitud.fecha} {activeModalSolicitud.hora}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                <span className="text-slate-400 font-bold block">Requerimiento Técnico:</span>
                <p className="text-slate-300">🏢 Edificio / Ubicación: <strong>{activeModalSolicitud.edificioUbicacion} ({activeModalSolicitud.apartamentoTorre})</strong></p>
                <p className="text-slate-300">⚙️ Tipo de Servicio: <strong>{activeModalSolicitud.tipoServicio}</strong></p>
                <p className="text-slate-300">🛗 Paradas / Pisos: <strong>{activeModalSolicitud.paradas}</strong></p>
                <p className="text-slate-300">👥 Capacidad Estimada: <strong>{activeModalSolicitud.capacidadPersonas} Personas</strong></p>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Notas y Detalles del Requerimiento:</span>
                <p className="text-slate-200 font-sans leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850 whitespace-pre-line">
                  {activeModalSolicitud.detalles || 'Sin observaciones adicionales.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  convertirSolicitudClienteAPresupuesto(activeModalSolicitud.id);
                  setActiveModalSolicitud(null);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-xl"
              >
                Generar Presupuesto Formal ERP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
