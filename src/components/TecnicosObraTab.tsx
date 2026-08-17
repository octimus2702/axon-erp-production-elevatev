import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wrench, 
  Building2, 
  FolderTree, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CloudUpload, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  UserCheck, 
  Layers, 
  FileSpreadsheet,
  ArrowRight,
  Filter,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { ReporteTecnicoCampo } from '../types';

export default function TecnicosObraTab() {
  const { 
    reportesTecnicos, 
    cloudSyncedCorrelativos, 
    sincronizarReportesAExcel, 
    sincronizarReportesDesdeNube,
    recargarEstadoNube,
    convertirReporteAPresupuesto, 
    consolidarBufferReporte,
    actualizarEstadoReporteTecnico,
    isSyncing,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTecnicoFilter, setSelectedTecnicoFilter] = useState('ALL');
  const [selectedObraFilter, setSelectedObraFilter] = useState('ALL');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeReportModal, setActiveReportModal] = useState<ReporteTecnicoCampo | null>(null);
  const [isTransferringAll, setIsTransferringAll] = useState(false);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);

  const handleRefreshNube = async () => {
    setIsRefreshingCloud(true);
    try {
      await recargarEstadoNube();
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  // Lista de técnicos únicos
  const tecnicosList = useMemo(() => {
    const set = new Set<string>();
    reportesTecnicos.forEach(r => {
      if (r.estado !== 'ARCHIVADO' && r.tecnicoNombre) set.add(r.tecnicoNombre);
    });
    return Array.from(set);
  }, [reportesTecnicos]);

  // Lista de obras únicas
  const obrasList = useMemo(() => {
    const set = new Set<string>();
    reportesTecnicos.forEach(r => {
      if (r.estado !== 'ARCHIVADO') {
        const obra = r.ubicacionObra || r.clienteNombre || 'Obra Sin Nombre';
        set.add(obra);
      }
    });
    return Array.from(set);
  }, [reportesTecnicos]);

  // Filtrado de reportes (ocultando ARCHIVADO)
  const filteredReports = useMemo(() => {
    return reportesTecnicos.filter(r => {
      if (r.estado === 'ARCHIVADO') return false;

      const matchSearch = 
        r.correlativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.ubicacionObra && r.ubicacionObra.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.tecnicoNombre && r.tecnicoNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.equipoAscensor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTecnico = selectedTecnicoFilter === 'ALL' || r.tecnicoNombre === selectedTecnicoFilter;
      const matchObra = selectedObraFilter === 'ALL' || (r.ubicacionObra || r.clienteNombre) === selectedObraFilter;

      return matchSearch && matchTecnico && matchObra;
    });
  }, [reportesTecnicos, searchTerm, selectedTecnicoFilter, selectedObraFilter]);

  // Agrupación en estructura de carpetas: Obra -> Ascensor -> Técnico -> Reportes
  const folderTree = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, ReporteTecnicoCampo[]>>> = {};

    filteredReports.forEach(reporte => {
      const obra = reporte.ubicacionObra || reporte.clienteNombre || 'Obra General';
      const ascensor = reporte.equipoAscensor || 'Ascensor Principal';
      const tecnico = reporte.tecnicoNombre || 'Técnico General';

      if (!tree[obra]) tree[obra] = {};
      if (!tree[obra][ascensor]) tree[obra][ascensor] = {};
      if (!tree[obra][ascensor][tecnico]) tree[obra][ascensor][tecnico] = [];

      tree[obra][ascensor][tecnico].push(reporte);
    });

    return tree;
  }, [filteredReports]);

  // Toggle folders
  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  // Expand / Collapse all
  const expandAll = () => {
    const newExpanded: Record<string, boolean> = {};
    Object.keys(folderTree).forEach(obra => {
      newExpanded[`obra_${obra}`] = true;
      Object.keys(folderTree[obra]).forEach(asc => {
        newExpanded[`asc_${obra}_${asc}`] = true;
        Object.keys(folderTree[obra][asc]).forEach(tec => {
          newExpanded[`tec_${obra}_${asc}_${tec}`] = true;
        });
      });
    });
    setExpandedFolders(newExpanded);
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  // Handler para subir lote a Excel
  const handleSubirLoteAExcel = async () => {
    setIsTransferringAll(true);
    await sincronizarReportesAExcel();
    setIsTransferringAll(false);
  };

  // Contadores
  const pendientesSubirExcel = reportesTecnicos.filter(r => !cloudSyncedCorrelativos.includes(r.correlativo)).length;
  const totalSubidosExcel = reportesTecnicos.filter(r => cloudSyncedCorrelativos.includes(r.correlativo)).length;

  return (
    <div className="space-y-6">
      {/* HEADER DE CONTROL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Wrench size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Gestor de Informes Técnicos en Obra</span>
                  <span className="text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Tiempo Real
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Organización en árbol: <strong>Obra ➔ Ascensor ➔ Técnico ➔ Reporte</strong>. Control de carga a Google Sheets.
                </p>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN PRINCIPAL */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefreshNube}
              disabled={isRefreshingCloud}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-lg hover:border-amber-500/60"
              title="Sincronizar y recargar reportes técnicos recibidos desde cualquier dispositivo o portal móvil"
            >
              <RefreshCw size={15} className={isRefreshingCloud ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              <span>{isRefreshingCloud ? 'Consultando...' : 'Sincronizar Nube'}</span>
            </button>

            <button
              onClick={handleSubirLoteAExcel}
              disabled={isSyncing || isTransferringAll || pendientesSubirExcel === 0}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg cursor-pointer ${
                pendientesSubirExcel > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>
                {isSyncing || isTransferringAll 
                  ? 'Subiendo a Excel...' 
                  : `Subir Lote a Google Sheets (${pendientesSubirExcel} Pendientes)`}
              </span>
            </button>

            <button
              onClick={expandAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono transition"
            >
              Desplegar Todo
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-xl text-xs font-mono transition"
            >
              Plegar
            </button>
          </div>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Reportes</span>
            <span className="text-lg font-mono font-bold text-white">{reportesTecnicos.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Obras / Edificios</span>
            <span className="text-lg font-mono font-bold text-amber-400">{obrasList.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Técnicos Activos</span>
            <span className="text-lg font-mono font-bold text-cyan-400">{tecnicosList.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">En Google Sheets</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-mono font-bold text-emerald-400">{totalSubidosExcel}</span>
              {pendientesSubirExcel > 0 && (
                <span className="text-[10px] font-mono text-amber-400">({pendientesSubirExcel} sin subir)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por obra, ascensor, técnico o diagnóstico..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Filtro Técnico */}
          <select
            value={selectedTecnicoFilter}
            onChange={(e) => setSelectedTecnicoFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-amber-500"
          >
            <option value="ALL">👤 Todos los Técnicos ({tecnicosList.length})</option>
            {tecnicosList.map(tec => (
              <option key={tec} value={tec}>{tec}</option>
            ))}
          </select>

          {/* Filtro Obra */}
          <select
            value={selectedObraFilter}
            onChange={(e) => setSelectedObraFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-amber-500"
          >
            <option value="ALL">🏢 Todas las Obras ({obrasList.length})</option>
            {obrasList.map(obra => (
              <option key={obra} value={obra}>{obra}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ESTRUCTURA JERÁRQUICA DE CARPETAS (ÁRBOL) */}
      <div className="space-y-4">
        {Object.keys(folderTree).length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <FolderTree size={40} className="mx-auto text-slate-600" />
            <h3 className="text-sm font-bold text-white font-mono">No se encontraron carpetas o reportes técnicos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Las inspecciones de campo enviadas por los técnicos desde sus teléfonos aparecerán aquí organizadas por Obra y Ascensor.
            </p>
          </div>
        ) : (
          Object.keys(folderTree).map(obra => {
            const obraKey = `obra_${obra}`;
            const isObraOpen = expandedFolders[obraKey] ?? true; // abiertas por defecto

            const totalReportesObra = Object.values(folderTree[obra]).reduce((acc, asc) => {
              return acc + Object.values(asc).reduce((a2, arr) => a2 + arr.length, 0);
            }, 0);

            return (
              <div 
                key={obra} 
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all"
              >
                {/* NIVEL 1: CARPETA OBRA / EDIFICIO */}
                <div 
                  onClick={() => toggleFolder(obraKey)}
                  className="bg-slate-850/80 hover:bg-slate-800/80 p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none transition border-b border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">{obra}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {totalReportesObra} {totalReportesObra === 1 ? 'Reporte' : 'Reportes'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">Carpeta Principal de Ubicación</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isObraOpen ? (
                      <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* CONTENIDO DE LA OBRA */}
                {isObraOpen && (
                  <div className="p-3 sm:p-5 space-y-4 bg-slate-900/40">
                    {Object.keys(folderTree[obra]).map(ascensor => {
                      const ascKey = `asc_${obra}_${ascensor}`;
                      const isAscOpen = expandedFolders[ascKey] ?? true;

                      const totalReportesAsc = Object.values(folderTree[obra][ascensor]).reduce((acc: number, arr: ReporteTecnicoCampo[]) => acc + arr.length, 0);

                      return (
                        <div key={ascensor} className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden ml-2 sm:ml-4">
                          {/* NIVEL 2: SUBCARPETAS POR ASCENSOR */}
                          <div 
                            onClick={() => toggleFolder(ascKey)}
                            className="bg-slate-900/90 hover:bg-slate-850 p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none transition border-b border-slate-850"
                          >
                            <div className="flex items-center gap-2.5">
                              <Layers size={16} className="text-cyan-400" />
                              <span className="text-xs sm:text-sm font-bold text-slate-200">{ascensor}</span>
                              <span className="text-[10px] font-mono text-slate-400">({totalReportesAsc})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAscOpen ? (
                                <ChevronDown size={15} className="text-slate-400" />
                              ) : (
                                <ChevronRight size={15} className="text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* NIVEL 3: REPORTES POR TÉCNICO */}
                          {isAscOpen && (
                            <div className="p-3 sm:p-4 space-y-3">
                              {Object.keys(folderTree[obra][ascensor]).map(tecnico => {
                                const reportes = folderTree[obra][ascensor][tecnico];

                                return (
                                  <div key={tecnico} className="space-y-2.5">
                                    {/* CABECERA DE TÉCNICO RESPONSABLE */}
                                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-400 px-1">
                                      <UserCheck size={14} />
                                      <span>Técnico Responsable: {tecnico}</span>
                                      <span className="text-slate-500 font-normal">({reportes.length} registros)</span>
                                    </div>

                                    {/* LISTA DE TARJETAS DE REPORTES */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                      {reportes.map(rep => {
                                        const isExcelSynced = cloudSyncedCorrelativos.includes(rep.correlativo);

                                        return (
                                          <div 
                                            key={rep.id}
                                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 transition flex flex-col justify-between"
                                          >
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono font-bold text-amber-400">{rep.correlativo}</span>
                                                
                                                <div className="flex items-center gap-2">
                                                  {isExcelSynced ? (
                                                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                      <CheckCircle2 size={11} />
                                                      <span>En Excel</span>
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                      <Clock size={11} />
                                                      <span>Pendiente Excel</span>
                                                    </span>
                                                  )}

                                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                    rep.estado === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                                                  }`}>
                                                    {rep.estado}
                                                  </span>
                                                </div>
                                              </div>

                                              <p className="text-xs text-slate-200 font-sans line-clamp-2 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                                                {rep.diagnosticoDanio}
                                              </p>

                                              {/* Repuestos solicitados tag */}
                                              {rep.repuestosFaltantes && rep.repuestosFaltantes.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400">
                                                  <AlertTriangle size={13} />
                                                  <span>{rep.repuestosFaltantes.length} Repuestos solicitados</span>
                                                </div>
                                              )}

                                              {/* Fotos adjuntas */}
                                              {rep.photos && rep.photos.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
                                                  <Camera size={13} />
                                                  <span>{rep.photos.length} Fotos de evidencia</span>
                                                </div>
                                              )}
                                            </div>

                                            {/* ACCIONES DEL GESTOR */}
                                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                              <span className="text-[10px] font-mono text-slate-500">{rep.fecha}</span>

                                              <div className="flex items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveReportModal(rep)}
                                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl transition flex items-center gap-1 cursor-pointer"
                                                  title="Ver Reporte Completo"
                                                >
                                                  <Eye size={13} />
                                                  <span>Ver</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => consolidarBufferReporte(rep.id)}
                                                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-mono rounded-xl transition flex items-center gap-1 cursor-pointer"
                                                  title="Consolidar en Master Presupuestos y Supabase"
                                                >
                                                  <ArrowRight size={13} />
                                                  <span>Cotizar / Master</span>
                                                </button>

                                                {!isExcelSynced && (
                                                  <button
                                                    type="button"
                                                    onClick={() => sincronizarReportesAExcel([rep.id])}
                                                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                                                    title="Subir inmediatamente a Google Sheets"
                                                  >
                                                    <CloudUpload size={13} />
                                                    <span>Subir Excel</span>
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALLE DE REPORTE TÉCNICO */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Wrench className="text-amber-400" size={20} />
                <div>
                  <h3 className="text-base font-bold font-mono text-white">{activeReportModal.correlativo}</h3>
                  <p className="text-xs text-slate-400 font-mono">{activeReportModal.clienteNombre} - {activeReportModal.equipoAscensor}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                <div>
                  <span className="text-slate-500 block">Técnico de Campo:</span>
                  <span className="text-amber-300 font-bold">{activeReportModal.tecnicoNombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha de Inspección:</span>
                  <span className="text-slate-200">{activeReportModal.fecha}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ubicación / Obra:</span>
                  <span className="text-slate-200">{activeReportModal.ubicacionObra || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Prioridad de Atención:</span>
                  <span className="text-rose-400 font-bold">{activeReportModal.prioridadAtencion}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1.5">Diagnóstico y Hallazgos:</span>
                <p className="text-slate-200 font-sans leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850 whitespace-pre-line">
                  {activeReportModal.diagnosticoDanio}
                </p>
              </div>

              {activeReportModal.repuestosFaltantes && activeReportModal.repuestosFaltantes.length > 0 && (
                <div>
                  <span className="text-rose-400 font-bold block mb-1.5">Repuestos Solicitados para Obra:</span>
                  <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-850">
                    {activeReportModal.repuestosFaltantes.map((rf, idx) => (
                      <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1 text-slate-300">
                        <span>• {rf.repuestoNombre}</span>
                        <span className="font-bold text-amber-400">{rf.cantidadRequerida} {rf.unidadMedida || 'Und'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeReportModal.photos && activeReportModal.photos.length > 0 && (
                <div>
                  <span className="text-cyan-400 font-bold block mb-1.5">Evidencias Fotográficas ({activeReportModal.photos.length}):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeReportModal.photos.map((ph, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video">
                        <img 
                          src={ph} 
                          alt={`Evidencia ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  convertirReporteAPresupuesto(activeReportModal.id);
                  setActiveReportModal(null);
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold font-mono text-xs rounded-xl"
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
