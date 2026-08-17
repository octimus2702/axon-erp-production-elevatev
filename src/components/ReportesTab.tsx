import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ClipboardList, 
  Wrench, 
  AlertTriangle, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Building2, 
  User, 
  Printer, 
  ArrowRight, 
  ShieldAlert, 
  DollarSign, 
  Layers, 
  Download, 
  RefreshCw, 
  Zap, 
  BarChart3, 
  Check, 
  PackageCheck,
  Clock,
  Send,
  Trash2,
  FileSpreadsheet,
  Calculator,
  History,
  Tag,
  Edit3,
  Sparkles
} from 'lucide-react';
import { ReporteTecnicoCampo, TipoReporteTecnico, RepuestoFaltanteDetalle, DivisionOperativa } from '../types';
import { exportAllDataToExcelCSV } from '../utils/excelExporter';
import PhotoUploader from './PhotoUploader';
import { exportReporteTecnicoPDF } from '../utils/pdfReporteExporter';

export default function ReportesTab() {
  const { 
    empresaActiva,
    reportesTecnicos, 
    crearReporteTecnico, 
    actualizarEstadoReporteTecnico, 
    actualizarReporteTecnico,
    convertirReporteAPresupuesto, 
    clientes, 
    products, 
    user, 
    activeDivision, 
    tasaCambioBCV, 
    facturas, 
    presupuestos, 
    retenciones, 
    recibos,
    movimientosContables,
    triggerManualSync,
    scanAndSyncUnsyncedReports,
    cloudSyncedCorrelativos,
    isSyncing,
    addToast 
  } = useApp();

  const isTecnico = user?.rol === 'TECNICO';

  // Tabs superiores del Módulo de Reportes
  const [subTab, setSubTab] = useState<'CAMPO_OBRAS' | 'GERENCIAL_ANALITICA'>('CAMPO_OBRAS');

  useEffect(() => {
    if (isTecnico) {
      setSubTab('CAMPO_OBRAS');
    }
  }, [isTecnico]);

  // Filtros de reportes de campo
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [divisionFilter, setDivisionFilter] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [reportDivision, setReportDivision] = useState<DivisionOperativa>(activeDivision || 'MANTENIMIENTO');

  // Modal para Nuevo Reporte Técnico
  const [showModalNuevo, setShowModalNuevo] = useState<boolean>(false);
  const [showModalVer, setShowModalVer] = useState<ReporteTecnicoCampo | null>(null);

  // Formulario Nuevo Reporte
  const [tecnicoNombre, setTecnicoNombre] = useState<string>(user?.nombre || 'Téc. Manuel Guerra');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteRif, setClienteRif] = useState<string>('');
  const [ubicacionObra, setUbicacionObra] = useState<string>('');
  const [equipoAscensor, setEquipoAscensor] = useState<string>('');
  const [tipoReporte, setTipoReporte] = useState<TipoReporteTecnico>('INSPECCION_DANIOS');
  const [prioridadAtencion, setPrioridadAtencion] = useState<'CRITICA' | 'ALTA' | 'NORMAL'>('NORMAL');
  const [diagnosticoDanio, setDiagnosticoDanio] = useState<string>('');
  const [detallesManualesPedidos, setDetallesManualesPedidos] = useState<string>('');
  const [requierePresupuesto, setRequierePresupuesto] = useState<boolean>(true);
  const [montoEstimadoUSD, setMontoEstimadoUSD] = useState<number>(0);
  const [observacionesCotizacion, setObservacionesCotizacion] = useState<string>('');
  const [firmaTecnico, setFirmaTecnico] = useState<string>(user?.nombre || 'Téc. Asignado');
  const [firmaClienteObra, setFirmaClienteObra] = useState<string>('Representante de Obra / Condominio');
  const [photos, setPhotos] = useState<string[]>([]);

  // Repuestos faltantes dinámicos (Formulario Nuevo Reporte)
  const [repuestosLista, setRepuestosLista] = useState<RepuestoFaltanteDetalle[]>([]);
  const [nuevoRepuestoNombre, setNuevoRepuestoNombre] = useState<string>('');
  const [nuevoRepuestoCant, setNuevoRepuestoCant] = useState<number>(1);
  const [nuevoRepuestoUnidad, setNuevoRepuestoUnidad] = useState<string>('Und');
  const [nuevoRepuestoMetros, setNuevoRepuestoMetros] = useState<number>(0);
  const [nuevoRepuestoPrecioUnit, setNuevoRepuestoPrecioUnit] = useState<number>(0);
  const [nuevoRepuestoPrio, setNuevoRepuestoPrio] = useState<'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA'>('ALTA');

  // Estado para la Valuación y Estimado de Precios del Gestor Principal
  const [evaluacionItems, setEvaluacionItems] = useState<RepuestoFaltanteDetalle[]>([]);
  const [modoEdicionPrecios, setModoEdicionPrecios] = useState<boolean>(true);

  // Búsqueda Visual de Stock con IA Gemini
  const [showModalIA, setShowModalIA] = useState<boolean>(false);
  const [fotoEnAnalisis, setFotoEnAnalisis] = useState<string>('');
  const [analizandoIA, setAnalizandoIA] = useState<boolean>(false);
  const [resultadoAnalisisIA, setResultadoAnalisisIA] = useState<{
    identificado: boolean;
    nombrePiezaIdentificada: string;
    descripcionVisual: string;
    codigoCoincidente: string | null;
    nivelCoincidencia: 'ALTO' | 'MEDIO' | 'BAJO' | 'NINGUNO';
    explicacion: string;
  } | null>(null);

  const ejecutarAnalisisIAImagen = async (photoUrl: string) => {
    setFotoEnAnalisis(photoUrl);
    setAnalizandoIA(true);
    setResultadoAnalisisIA(null);
    setShowModalIA(true);

    try {
      const res = await fetch('/api/gemini/analyze-stock-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoUrl,
          catalog: products
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setResultadoAnalisisIA(data.result);
      } else {
        addToast('No se pudo procesar el análisis de la imagen: ' + (data.error || 'Respuesta vacía'), 'warning');
      }
    } catch (err: any) {
      console.error('Error al analizar la imagen con IA:', err);
      addToast('Error de comunicación con el servicio de Inteligencia Artificial', 'error');
    } finally {
      setAnalizandoIA(false);
    }
  };

  // Helper para buscar cotizaciones anteriores en el sistema
  const findPreviousQuoteMatch = (name: string) => {
    if (!name || name.trim().length < 2) return null;
    const q = name.toLowerCase().trim();
    for (const pres of presupuestos) {
      for (const item of pres.items) {
        if (item.descripcion.toLowerCase().includes(q) || q.includes(item.descripcion.toLowerCase().slice(0, 15))) {
          return {
            precioUnitarioUSD: item.precioUnitarioUSD,
            proyectoAscensor: pres.proyectoAscensor || pres.clienteNombre,
            correlativo: pres.correlativo
          };
        }
      }
    }
    return null;
  };

  // Sincronizar items cuando se abre la Ficha / Valuador del Gestor
  React.useEffect(() => {
    if (showModalVer) {
      let baseList: RepuestoFaltanteDetalle[] = showModalVer.repuestosFaltantes ? JSON.parse(JSON.stringify(showModalVer.repuestosFaltantes)) : [];
      
      // Si repuestosFaltantes está vacío, convertir líneas de detallesManualesPedidos en items
      if (baseList.length === 0 && showModalVer.detallesManualesPedidos) {
        const lineas = showModalVer.detallesManualesPedidos
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);
        
        lineas.forEach((lin, idx) => {
          const itemLimpio = lin.startsWith('-') || lin.startsWith('*') ? lin.substring(1).trim() : lin;
          baseList.push({
            id: `det-${idx}-${Date.now()}`,
            repuestoNombre: itemLimpio,
            cantidadRequerida: 1,
            unidadMedida: 'Und',
            prioridad: 'ALTA'
          });
        });
      }

      // Pre-asociar precios desde catálogo o histórico si están vacíos
      const enriched = baseList.map(item => {
        const newItem = { ...item };
        if (!newItem.precioUnitarioUSD && !newItem.precioTotalUSD) {
          // Búsqueda en catálogo
          const catMatch = products.find(p => p.val_d.toLowerCase().includes(item.repuestoNombre.toLowerCase()) || item.repuestoNombre.toLowerCase().includes(p.val_d.toLowerCase()));
          if (catMatch && catMatch.precioUSD && catMatch.precioUSD > 0) {
            newItem.precioUnitarioUSD = catMatch.precioUSD;
            newItem.origenPrecio = 'CATALOGO';
          } else {
            // Búsqueda en cotizaciones históricas
            const prevMatch = findPreviousQuoteMatch(item.repuestoNombre);
            if (prevMatch) {
              newItem.precioUnitarioUSD = prevMatch.precioUnitarioUSD;
              newItem.origenPrecio = 'HISTORICO_ANTERIOR';
              newItem.referenciaObraAnterior = `Cotizado previamente en ${prevMatch.proyectoAscensor} ($${prevMatch.precioUnitarioUSD.toFixed(2)})`;
            } else {
              newItem.origenPrecio = 'MANUAL_PENDIENTE';
            }
          }
        }
        return newItem;
      });

      setEvaluacionItems(enriched);
    } else {
      setEvaluacionItems([]);
    }
  }, [showModalVer]);

  // Cálculo individual de subtotal por item
  const calcularSubtotalItem = (item: RepuestoFaltanteDetalle): number => {
    if (item.precioTotalUSD && item.precioTotalUSD > 0) return item.precioTotalUSD;
    const cant = item.cantidadRequerida || 1;
    const metraje = (item.largoOMetros && item.largoOMetros > 0) ? item.largoOMetros : 1;
    const pUnit = item.precioUnitarioUSD || 0;
    return cant * metraje * pUnit;
  };

  const sumaTotalEvaluadoUSD = evaluacionItems.reduce((acc, it) => acc + calcularSubtotalItem(it), 0);

  // Seleccionar cliente para autocompletar
  const handleSelectCliente = (clientRif: string) => {
    const found = clientes.find(c => c.rif === clientRif);
    if (found) {
      setClienteNombre(found.razonSocial);
      setClienteRif(found.rif);
      setUbicacionObra(found.direccion);
      if (found.equipos && found.equipos.length > 0) {
        setEquipoAscensor(`${found.equipos[0].nombreEquipo} (${found.equipos[0].marca} ${found.equipos[0].modelo})`);
      }
    }
  };

  const agregarRepuestoAForm = () => {
    if (!nuevoRepuestoNombre.trim()) {
      addToast('Ingrese el nombre o descripción del repuesto faltante', 'error');
      return;
    }
    const totalMetros = (nuevoRepuestoMetros || 1) * nuevoRepuestoCant;
    const pTotal = nuevoRepuestoPrecioUnit > 0 ? (nuevoRepuestoUnidad === 'Mts' || nuevoRepuestoMetros > 0 ? totalMetros * nuevoRepuestoPrecioUnit : nuevoRepuestoCant * nuevoRepuestoPrecioUnit) : undefined;

    const nuevoItem: RepuestoFaltanteDetalle = {
      id: Date.now().toString(),
      repuestoNombre: nuevoRepuestoNombre.trim(),
      cantidadRequerida: nuevoRepuestoCant,
      unidadMedida: nuevoRepuestoUnidad,
      largoOMetros: nuevoRepuestoMetros > 0 ? nuevoRepuestoMetros : undefined,
      precioUnitarioUSD: nuevoRepuestoPrecioUnit > 0 ? nuevoRepuestoPrecioUnit : undefined,
      precioTotalUSD: pTotal,
      prioridad: nuevoRepuestoPrio
    };
    setRepuestosLista(prev => [...prev, nuevoItem]);
    setNuevoRepuestoNombre('');
    setNuevoRepuestoCant(1);
    setNuevoRepuestoMetros(0);
    setNuevoRepuestoPrecioUnit(0);
    setNuevoRepuestoUnidad('Und');
    setNuevoRepuestoPrio('ALTA');
  };

  const eliminarRepuestoDeForm = (id: string) => {
    setRepuestosLista(prev => prev.filter(item => item.id !== id));
  };

  const handleGuardarReporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || !equipoAscensor.trim() || !diagnosticoDanio.trim()) {
      addToast('Por favor complete los campos requeridos: Cliente, Equipo y Diagnóstico', 'error');
      return;
    }

    crearReporteTecnico({
      fecha: new Date().toISOString().split('T')[0],
      tecnicoNombre,
      clienteNombre,
      clienteRif,
      ubicacionObra,
      equipoAscensor,
      tipoReporte,
      prioridadAtencion,
      diagnosticoDanio,
      detallesManualesPedidos,
      repuestosFaltantes: repuestosLista,
      requierePresupuesto,
      montoEstimadoRepuestosUSD: montoEstimadoUSD,
      observacionesCotizacion,
      firmaTecnico,
      firmaClienteObra,
      photos,
      fotosEvidenciaCount: photos.length,
      estado: requierePresupuesto ? 'PENDIENTE_COTIZACION' : 'REPUESTOS_SOLICITADOS',
      division: reportDivision || activeDivision || 'MANTENIMIENTO'
    });

    // Resetear formulario
    setShowModalNuevo(false);
    setClienteNombre('');
    setClienteRif('');
    setUbicacionObra('');
    setEquipoAscensor('');
    setDiagnosticoDanio('');
    setDetallesManualesPedidos('');
    setRepuestosLista([]);
    setPhotos([]);
    setMontoEstimadoUSD(0);
    setObservacionesCotizacion('');
  };

  // Filtrado de reportes
  const reportesFiltrados = reportesTecnicos
    .filter(r => {
      if (divisionFilter !== 'TODAS') {
        const rDiv = r.division || 'MANTENIMIENTO';
        if (rDiv !== divisionFilter) return false;
      }
      if (filtroTipo !== 'TODOS' && r.tipoReporte !== filtroTipo) return false;
      if (filtroEstado !== 'TODOS' && r.estado !== filtroEstado) return false;
      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase();
        return (
          r.correlativo.toLowerCase().includes(q) ||
          r.clienteNombre.toLowerCase().includes(q) ||
          r.tecnicoNombre.toLowerCase().includes(q) ||
          r.equipoAscensor.toLowerCase().includes(q) ||
          (r.ubicacionObra && r.ubicacionObra.toLowerCase().includes(q))
        );
      }
      return true;
    });

  // Estadísticas rápidas de reportes
  const totalReportes = reportesFiltrados.length;
  const pendCotizacion = reportesFiltrados.filter(r => r.estado === 'PENDIENTE_COTIZACION').length;
  const repuestSolicitados = reportesFiltrados.filter(r => r.estado === 'REPUESTOS_SOLICITADOS').length;
  const enReparacion = reportesFiltrados.filter(r => r.estado === 'EN_REPARACION').length;

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <ClipboardList size={15} />
            <span>MÓDULO DE REPORTES & VISITAS TÉCNICAS DE CAMPO</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Levantamiento de Obras, Daños y Repuestos — <span className="text-cyan-400">{activeDivision}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestión en tiempo real para técnicos en campo: reporte de averías, repuestos faltantes en obra y visitas de cotización.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => scanAndSyncUnsyncedReports()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs transition cursor-pointer border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
            title="Escanear la app, comparar con Google Sheets y subir reportes faltantes"
          >
            <Zap size={15} className={isSyncing ? "animate-bounce text-emerald-400" : "text-emerald-400"} />
            <span>{isSyncing ? "Escaneando..." : "Escanear & Subir a Nube"}</span>
          </button>

          <button
            onClick={triggerManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition cursor-pointer border border-cyan-500/30"
            title="Traer reportes y datos desde Google Sheets"
          >
            <RefreshCw size={15} className={isSyncing ? "animate-spin text-cyan-400" : ""} />
            <span>{isSyncing ? "Sincronizando..." : "Sincronizar Nube"}</span>
          </button>

          <button
            onClick={() => setShowModalNuevo(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Plus size={16} />
            <span>+ Crear Reporte de Campo</span>
          </button>
        </div>
      </div>

      {/* Selector de Modos del Módulo (Solo visible para Gestores) */}
      {!isTecnico && (
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('CAMPO_OBRAS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
              subTab === 'CAMPO_OBRAS' 
                ? 'bg-cyan-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench size={14} />
            <span>Reportes Técnicos de Campo e Inspección</span>
          </button>

          <button
            onClick={() => setSubTab('GERENCIAL_ANALITICA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
              subTab === 'GERENCIAL_ANALITICA' 
                ? 'bg-cyan-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 size={14} />
            <span>Reportes Gerenciales & Analítica</span>
          </button>
        </div>
      )}

      {/* CONTENIDO 1: REPORTES TÉCNICOS DE CAMPO */}
      {subTab === 'CAMPO_OBRAS' && (
        <div className="space-y-6">
          {/* Banner de Sincronización Nube */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Sincronización Automática con Google Sheets Excel</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CONECTADO A LA NUBE
                  </span>
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Respaldados en Google Excel: <strong className="text-emerald-400">{reportesTecnicos.filter(r => cloudSyncedCorrelativos.includes(r.correlativo)).length}</strong> de <strong className="text-white">{reportesTecnicos.length}</strong> reportes locales.
                </p>
              </div>
            </div>

            <button
              onClick={() => scanAndSyncUnsyncedReports()}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            >
              <Zap size={14} />
              <span>Escanear App y Subir Pendientes</span>
            </button>
          </div>

          {/* BARRA DE SELECCIÓN DE DIVISIÓN PARA REPORTES */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                <ClipboardList size={14} className="text-cyan-400" />
                Filtrar por División Operativa:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setDivisionFilter("TODAS")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  divisionFilter === "TODAS"
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <span>🏢 Todos los Reportes ({reportesTecnicos.length})</span>
              </button>

              <button
                onClick={() => setDivisionFilter("MANTENIMIENTO")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  divisionFilter === "MANTENIMIENTO"
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <span>🛠️ Mantenimiento ({reportesTecnicos.filter(r => r.division === 'MANTENIMIENTO' || !r.division).length})</span>
              </button>

              <button
                onClick={() => setDivisionFilter("MODERNIZACION")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  divisionFilter === "MODERNIZACION"
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <span>🏗️ Modernización ({reportesTecnicos.filter(r => r.division === 'MODERNIZACION').length})</span>
              </button>
            </div>
          </div>

          {/* Tarjetas resumen de estado de reportes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                <ClipboardList size={22} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Reportes</span>
                <span className="text-xl font-bold text-white">{totalReportes}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block">Pendientes Cotización</span>
                <span className="text-xl font-bold text-amber-400">{pendCotizacion}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <PackageCheck size={22} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block">Repuestos Solicitados</span>
                <span className="text-xl font-bold text-indigo-400">{repuestSolicitados}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Wrench size={22} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase block">En Reparación / Obra</span>
                <span className="text-xl font-bold text-emerald-400">{enReparacion}</span>
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-full sm:w-64">
                <Search size={14} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar obra, técnico o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="INSPECCION_DANIOS">Inspección de Daños</option>
                <option value="FALTANTE_REPUESTOS">Faltante de Repuestos</option>
                <option value="VISITA_PRESUPUESTO">Visita p/ Presupuesto</option>
                <option value="MANTENIMIENTO_PREVENTIVO">Mantenimiento Preventivo</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="PENDIENTE_COTIZACION">Pendiente Cotización</option>
                <option value="REPUESTOS_SOLICITADOS">Repuestos Solicitados</option>
                <option value="EN_REPARACION">En Reparación</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Mostrando <strong className="text-cyan-400">{reportesFiltrados.length}</strong> reportes de campo
            </div>
          </div>

          {/* Listado de Reportes de Campo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reportesFiltrados.length === 0 ? (
              <div className="col-span-full bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-mono text-sm">
                No hay reportes de campo registrados con los filtros seleccionados.
              </div>
            ) : (
              reportesFiltrados.map((rep) => {
                const isSyncedToCloud = cloudSyncedCorrelativos.includes(rep.correlativo);
                return (
                <div key={rep.id} className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-3 shadow-lg transition">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{rep.correlativo}</span>
                        <span className="text-[10px] font-mono text-slate-500">({rep.fecha})</span>
                        
                        {/* Indicador Nube */}
                        {isSyncedToCloud ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Reporte guardado y verificado en Google Sheets Excel">
                            <CheckCircle2 size={11} />
                            <span>En la Nube</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Pendiente por sincronizar con Google Sheets">
                            <Clock size={11} />
                            <span>Solo Local</span>
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          rep.division === 'MODERNIZACION'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                        }`}>
                          {rep.division === 'MODERNIZACION' ? '🏗️ Modernización' : '🛠️ Mantenimiento'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{rep.clienteNombre}</h4>
                      <p className="text-xs text-slate-400 font-mono">{rep.equipoAscensor}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        rep.prioridadAtencion === 'CRITICA' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' :
                        rep.prioridadAtencion === 'ALTA' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {rep.prioridadAtencion}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        rep.estado === 'PENDIENTE_COTIZACION' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        rep.estado === 'REPUESTOS_SOLICITADOS' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        rep.estado === 'EN_REPARACION' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {rep.estado.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Detalle Técnico Breve */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      <Wrench size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{rep.diagnosticoDanio}</p>
                    </div>

                    {rep.detallesManualesPedidos && rep.detallesManualesPedidos.trim() !== '' && (
                      <div className="bg-cyan-950/20 border border-cyan-800/30 p-2.5 rounded-xl text-cyan-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <FileText size={12} className="text-cyan-400" />
                          <span>Materiales Pedidos (Escribir Manual):</span>
                        </div>
                        <p className="text-[11px] text-slate-200 font-mono line-clamp-3 whitespace-pre-line">
                          {rep.detallesManualesPedidos}
                        </p>
                      </div>
                    )}

                    {rep.repuestosFaltantes && rep.repuestosFaltantes.length > 0 && (
                      <div className="bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl text-amber-300">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                          <AlertTriangle size={12} className="text-amber-400" />
                          <span>Repuestos Faltantes ({rep.repuestosFaltantes.length}):</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 font-mono">
                          {rep.repuestosFaltantes.map(rf => (
                            <li key={rf.id}>
                              <strong>{rf.cantidadRequerida}x</strong> {rf.repuestoNombre} [{rf.prioridad}]
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer con Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <User size={12} className="text-slate-500" />
                      {rep.tecnicoNombre}
                    </span>

                    <div className="flex items-center gap-2">
                      {rep.requierePresupuesto && !isTecnico && (
                        <button
                          onClick={() => convertirReporteAPresupuesto(rep.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 font-bold transition cursor-pointer text-[11px]"
                          title="Crear Cotización / Presupuesto en el sistema a partir de este reporte"
                        >
                          <DollarSign size={12} />
                          <span>+ Cotizar</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowModalVer(rep)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer text-[11px]"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                </div>
              ); })
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO 2: REPORTES GERENCIALES & ANALÍTICA */}
      {subTab === 'GERENCIAL_ANALITICA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Facturación Activa</span>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${facturas.filter(f => f.division === activeDivision).reduce((acc, f) => acc + f.totalUSD, 0).toFixed(2)}
              </h3>
              <p className="text-xs text-cyan-400 mt-1 font-mono">
                Bs. {(facturas.filter(f => f.division === activeDivision).reduce((acc, f) => acc + f.totalUSD, 0) * tasaCambioBCV).toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Presupuestos Cotizados</span>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">
                ${presupuestos.filter(p => p.division === activeDivision).reduce((acc, p) => acc + p.totalUSD, 0).toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {presupuestos.filter(p => p.division === activeDivision).length} cotizaciones
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Retenciones SENIAT</span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                ${retenciones.filter(r => r.division === activeDivision).reduce((acc, r) => acc + r.montoRetenidoUSD, 0).toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Bs. {(retenciones.filter(r => r.division === activeDivision).reduce((acc, r) => acc + r.montoRetenidoUSD, 0) * tasaCambioBCV).toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Reportes Técnicos</span>
              <h3 className="text-2xl font-bold text-cyan-400 mt-1">
                {totalReportes} Inspecciones
              </h3>
              <p className="text-xs text-emerald-400 mt-1 font-mono">
                {enReparacion} Obras activas
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Consolidado General de Operaciones</h3>
            <p className="text-xs text-slate-400">
              Usted puede exportar los reportes consolidados en formato imprimible o exportar la información administrativa a hoja de cálculo.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  addToast('Generando reporte Excel consolidado de Tecno Elevatev C.A....', 'info');
                  exportAllDataToExcelCSV({
                    facturas,
                    recibos,
                    movimientosContables,
                    reportesTecnicos,
                    presupuestos,
                    clientes
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Exportar Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Resumen Operativo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO REPORTE TÉCNICO DE CAMPO */}
      {showModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Wrench size={20} className="text-cyan-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Nuevo Reporte Técnico de Obra / Inspección</h3>
              </div>
              <button
                onClick={() => setShowModalNuevo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarReporte} className="space-y-4 text-xs font-mono overflow-y-auto pr-1 flex-1">
              {/* Autocompletar desde Cliente existente */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                <label className="text-slate-400 uppercase text-[10px] font-bold block">
                  Autocompletar Datos de Cliente / Condominio
                </label>
                <select
                  onChange={(e) => handleSelectCliente(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Seleccionar de Clientes en Sistema --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.rif}>{c.razonSocial} ({c.rif})</option>
                  ))}
                </select>
              </div>

              {/* Fila 1: Cliente & Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Nombre de Cliente / Edificio / Obra *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Res. Altamira Plaza / Torre B"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Ubicación / Dirección Obra</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Francisco de Miranda, Chacao"
                    value={ubicacionObra}
                    onChange={(e) => setUbicacionObra(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Fila 2: Equipo Ascensor & Tipo de Reporte */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Equipo Ascensor Inspeccionado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ascensor Principal #1 (Schindler 14P VVVF)"
                    value={equipoAscensor}
                    onChange={(e) => setEquipoAscensor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Tipo de Reporte</label>
                  <select
                    value={tipoReporte}
                    onChange={(e) => setTipoReporte(e.target.value as TipoReporteTecnico)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="INSPECCION_DANIOS">Inspección de Daños</option>
                    <option value="FALTANTE_REPUESTOS">Faltante de Repuestos</option>
                    <option value="VISITA_PRESUPUESTO">Visita p/ Presupuesto</option>
                    <option value="MANTENIMIENTO_PREVENTIVO">Mantenimiento Preventivo</option>
                  </select>
                </div>
              </div>

              {/* Fila 3: Técnico asignado & Nivel Prioridad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Técnico Inspeccionador</label>
                  <input
                    type="text"
                    value={tecnicoNombre}
                    onChange={(e) => setTecnicoNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Prioridad de Atención</label>
                  <select
                    value={prioridadAtencion}
                    onChange={(e) => setPrioridadAtencion(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="ALTA">ALTA</option>
                    <option value="CRITICA">CRÍTICA (Urgente)</option>
                  </select>
                </div>
              </div>

              {/* Fila Especial: División Operativa Asignada */}
              <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30">
                <label className="text-cyan-400 uppercase text-[10px] font-bold font-mono block mb-1">
                  🎯 División Destino del Reporte
                </label>
                <select
                  value={reportDivision}
                  onChange={(e) => setReportDivision(e.target.value as DivisionOperativa)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="MANTENIMIENTO">🛠️ Mantenimiento de Ascensores</option>
                  <option value="MODERNIZACION">🏗️ Modernización / Obras Nuevas</option>
                </select>
              </div>

              {/* Diagnóstico Técnico de Daños */}
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Diagnóstico Técnico y Reporte de Daños *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describa detalladamente las fallas encontradas, componentes quemados, ruidos extraños o falta de mantenimiento..."
                  value={diagnosticoDanio}
                  onChange={(e) => setDiagnosticoDanio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Cuadro para Detalles / Insumos A Pedir Manualmente */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
                <label className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                  <FileText size={14} />
                  Cuadro de Pedido Manual de Detalles & Insumos (Texto Libre)
                </label>
                <p className="text-[10px] text-slate-400">
                  Escriba libremente los materiales, componentes o especificaciones técnicas a solicitar para la obra o cotización:
                </p>
                <textarea
                  rows={4}
                  placeholder={`Ejemplo:\n- 5 tramos de guaya 13mm de 130 metros\n- Variador de frecuencia Yaskawa L1000A 15HP\n- Tablero de control de 12 paradas VVVF\n- Aceite para máquina de tracción ISO VG 220`}
                  value={detallesManualesPedidos}
                  onChange={(e) => setDetallesManualesPedidos(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                />
              </div>

              {/* Repuestos Faltantes en Obra */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                    <AlertTriangle size={14} />
                    Repuestos y Piezas Faltantes en Obra
                  </span>
                  <span className="text-slate-500 text-[10px]">{repuestosLista.length} agregados</span>
                </div>

                {/* Form para agregar repuesto con unidades, metraje y precio sugerido */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Material/Repuesto (Ej: Guaya 10mm, Tablero de Control)"
                      value={nuevoRepuestoNombre}
                      onChange={(e) => setNuevoRepuestoNombre(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Cant"
                      value={nuevoRepuestoCant}
                      onChange={(e) => setNuevoRepuestoCant(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-center"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={nuevoRepuestoUnidad}
                      onChange={(e) => setNuevoRepuestoUnidad(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-[11px]"
                    >
                      <option value="Und">Und</option>
                      <option value="Tramos">Tramos</option>
                      <option value="Mts">Mts</option>
                      <option value="Juego">Juego</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Mts c/u"
                      value={nuevoRepuestoMetros || ''}
                      onChange={(e) => setNuevoRepuestoMetros(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-cyan-300 font-mono text-center text-[11px]"
                      title="Metros por tramo (Ej: 30m por cada tramo)"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={agregarRepuestoAForm}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-2 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de repuestos agregados */}
                {repuestosLista.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {repuestosLista.map(item => {
                      const totalMts = (item.largoOMetros || 0) * item.cantidadRequerida;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg text-slate-300">
                          <div>
                            <strong>{item.cantidadRequerida}x {item.unidadMedida || 'Und'}</strong> - {item.repuestoNombre}
                            {item.largoOMetros ? <span className="text-cyan-400 font-mono text-[10px] ml-2">({item.largoOMetros}m c/u = {totalMts} Mts tot)</span> : null}
                            <span className="text-amber-400 text-[10px] ml-2">[{item.prioridad}]</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarRepuestoDeForm(item.id)}
                            className="text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Evidencias Fotográficas */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                <PhotoUploader
                  photos={photos}
                  onChange={setPhotos}
                  maxPhotos={6}
                  label="Evidencias Fotográficas en Obra (Compresión HD previa)"
                />
              </div>

              {/* Opciones de Presupuestación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requierePresupuesto}
                    onChange={(e) => setRequierePresupuesto(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>¿Requiere Cotización / Presupuesto en Sistema?</span>
                </label>

                {requierePresupuesto && !isTecnico && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Monto Est. USD (Opcional):</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={montoEstimadoUSD || ''}
                      onChange={(e) => setMontoEstimadoUSD(parseFloat(e.target.value) || 0)}
                      className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-cyan-400 font-bold font-mono text-center"
                    />
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModalNuevo(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Guardar Reporte Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE FICHA Y EVALUADOR DE PRECIOS DEL GESTOR */}
      {showModalVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Calculator size={22} className="text-cyan-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Ficha de Reporte Técnico & Cotizador: {showModalVer.correlativo}</h3>
                  <p className="text-[11px] text-slate-400">Evaluación y asignación de costos de materiales por el Gestor Principal</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalVer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono overflow-y-auto pr-1 flex-1">
              {/* Resumen del Reporte */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Cliente / Obra:</span>
                  <strong className="text-white text-xs">{showModalVer.clienteNombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Equipo Ascensor:</span>
                  <strong className="text-cyan-400 text-xs">{showModalVer.equipoAscensor}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Ubicación:</span>
                  <span className="text-slate-300">{showModalVer.ubicacionObra || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Técnico Inspeccionador:</span>
                  <span className="text-slate-300">{showModalVer.tecnicoNombre}</span>
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Diagnóstico Técnico y Reporte de Obra</span>
                <p className="text-slate-200 leading-relaxed text-xs">{showModalVer.diagnosticoDanio}</p>
              </div>

              {/* Texto Libre de detalles pedidos por el técnico si existe */}
              {showModalVer.detallesManualesPedidos && showModalVer.detallesManualesPedidos.trim() !== '' && (
                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-800/30 space-y-1.5">
                  <span className="font-bold uppercase text-[10px] text-cyan-400 flex items-center gap-1.5">
                    <FileText size={13} />
                    Pedido Manual Escrito por el Técnico
                  </span>
                  <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                    {showModalVer.detallesManualesPedidos}
                  </pre>
                </div>
              )}

              {/* Fotografías y Evidencias Visuales */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
                <PhotoUploader
                  photos={showModalVer.photos || []}
                  onChange={(newPhotos) => {
                    const updated = { ...showModalVer, photos: newPhotos, fotosEvidenciaCount: newPhotos.length };
                    setShowModalVer(updated);
                    actualizarReporteTecnico(showModalVer.id, { photos: newPhotos, fotosEvidenciaCount: newPhotos.length });
                  }}
                  maxPhotos={6}
                  label="Fotografías & Evidencias Visuales de la Inspección"
                />

                {/* Botón Inteligente de Verificación de Repuestos en Stock por Imagen IA */}
                {showModalVer.photos && showModalVer.photos.length > 0 && (
                  <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
                      <Sparkles size={14} className="animate-pulse" />
                      <span>Verificación IA de Repuestos en Stock:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {showModalVer.photos.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => ejecutarAnalisisIAImagen(photo)}
                          className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Analizar esta foto para buscar repuestos en inventario"
                        >
                          <Search size={13} className="text-cyan-400" />
                          <span>Buscar Repuesto Foto #{idx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VISTA SEGÚN ROL: TÉCNICO (SIN PRECIOS) VS GESTOR PRINCIPAL (EVALUADOR & COTIZADOR DE PRECIOS) */}
              {isTecnico ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-amber-400 font-bold uppercase text-xs flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      Repuestos y Materiales Requeridos en Obra
                    </span>
                    <span className="text-slate-500 text-[11px] font-mono">Ficha Técnica de Campo</span>
                  </div>

                  {evaluacionItems.length === 0 ? (
                    <p className="text-slate-500 text-xs py-2">No se han especificado ítems o repuestos adicionales en el reporte.</p>
                  ) : (
                    <div className="space-y-2">
                      {evaluacionItems.map((item) => {
                        const totalMts = (item.largoOMetros || 0) * (item.cantidadRequerida || 1);
                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                            <div className="space-y-0.5">
                              <span className="text-white font-bold text-xs">
                                {item.cantidadRequerida}x {item.unidadMedida || 'Und'} - {item.repuestoNombre}
                              </span>
                              {item.largoOMetros && item.largoOMetros > 0 ? (
                                <p className="text-cyan-400 font-mono text-[11px]">
                                  Metraje: {item.largoOMetros} Mts c/u = <strong>{totalMts} Metros Totales</strong>
                                </p>
                              ) : null}
                            </div>
                            <span className="text-amber-400 font-bold text-[10px] px-2 py-0.5 bg-amber-950/40 border border-amber-900/40 rounded self-start sm:self-center">
                              [{item.prioridad || 'ALTA'}]
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* PANEL DE EVALUACIÓN Y COTIZADOR DE PRECIOS PARA EL GESTOR PRINCIPAL */
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-cyan-400" />
                      <span className="text-cyan-400 font-bold uppercase text-xs">
                        Evaluador & Cotizador de Materiales (Gestor Principal)
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Asocie precios unitarios por metro/unidad o ingrese valores manuales de componentes complejos.
                    </span>
                  </div>

                  {evaluacionItems.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <p>No hay ítems registrados en el reporte. Puede agregar un ítem manual para cotizar:</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEvaluacionItems([{
                            id: Date.now().toString(),
                            repuestoNombre: 'Material / Componente Requerido',
                            cantidadRequerida: 1,
                            unidadMedida: 'Und',
                            precioUnitarioUSD: 100,
                            prioridad: 'ALTA'
                          }]);
                        }}
                        className="mt-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs hover:bg-cyan-500/30 transition cursor-pointer font-bold"
                      >
                        + Agregar Primer Ítem
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evaluacionItems.map((item, index) => {
                        const prevQuote = findPreviousQuoteMatch(item.repuestoNombre);
                        const catMatch = products.find(p => p.val_d.toLowerCase().includes(item.repuestoNombre.toLowerCase()) || item.repuestoNombre.toLowerCase().includes(p.val_d.toLowerCase()));
                        const subtotal = calcularSubtotalItem(item);
                        const totalMts = (item.largoOMetros || 0) * (item.cantidadRequerida || 1);

                        return (
                          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              {/* Nombre & Cantidad */}
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={item.repuestoNombre}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, repuestoNombre: val } : it));
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white font-bold focus:border-cyan-500"
                                  placeholder="Nombre de material / componente..."
                                />
                              </div>

                              {/* Controles de Cantidad, Unidad, Metros, Precio */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">Cant:</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.cantidadRequerida}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, cantidadRequerida: val } : it));
                                    }}
                                    className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-white font-mono text-center text-xs"
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">Unidad:</span>
                                  <select
                                    value={item.unidadMedida || 'Und'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, unidadMedida: val } : it));
                                    }}
                                    className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-xs"
                                  >
                                    <option value="Und">Und</option>
                                    <option value="Tramos">Tramos</option>
                                    <option value="Mts">Mts</option>
                                    <option value="Juego">Juego</option>
                                  </select>
                                </div>

                                {(item.unidadMedida === 'Tramos' || item.unidadMedida === 'Mts' || (item.largoOMetros && item.largoOMetros > 0)) && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-cyan-400">Mts c/u:</span>
                                    <input
                                      type="number"
                                      min={0}
                                      placeholder="Metros"
                                      value={item.largoOMetros || ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, largoOMetros: val } : it));
                                      }}
                                      className="w-16 bg-slate-950 border border-cyan-800/40 rounded px-1.5 py-1 text-cyan-300 font-mono text-center text-xs"
                                      title="Metros por cada tramo / sección"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">P. Unit USD:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    placeholder="0.00"
                                    value={item.precioUnitarioUSD || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, precioUnitarioUSD: val, precioTotalUSD: undefined } : it));
                                    }}
                                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 font-mono text-right text-xs font-bold"
                                  />
                                </div>

                                <div className="text-right min-w-[90px]">
                                  <span className="text-[10px] text-slate-500 block">Subtotal:</span>
                                  <strong className="text-cyan-400 font-mono text-xs">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEvaluacionItems(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                  title="Eliminar ítem"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Metraje Total Informativo */}
                            {item.largoOMetros && item.largoOMetros > 0 ? (
                              <div className="text-[10px] text-cyan-400/90 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30 flex items-center justify-between">
                                <span>Total Metraje: <strong>{totalMts} Metros de material</strong> ({item.cantidadRequerida} tramos de {item.largoOMetros}m)</span>
                                <span>Fórmula: {totalMts} Mts × ${item.precioUnitarioUSD || 0}/m = ${subtotal.toFixed(2)}</span>
                              </div>
                            ) : null}

                            {/* Sugerencias Inteligentes de Catálogo e Históricos */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                              {catMatch && (
                                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                                  <Tag size={11} className="text-cyan-400" />
                                  <span>Precio Catálogo ({catMatch.val_c}): <strong>${catMatch.precioUSD?.toFixed(2)}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, precioUnitarioUSD: catMatch.precioUSD, origenPrecio: 'CATALOGO' } : it));
                                      addToast(`Precio de catálogo $${catMatch.precioUSD} aplicado a ${item.repuestoNombre}`, 'info');
                                    }}
                                    className="ml-1 text-cyan-400 underline cursor-pointer hover:text-cyan-300 font-bold"
                                  >
                                    Usar
                                  </button>
                                </div>
                              )}

                              {prevQuote && (
                                <div className="flex items-center gap-1 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/40 text-amber-200">
                                  <History size={11} className="text-amber-400" />
                                  <span>Cotizado previo en <em>{prevQuote.proyectoAscensor}</em>: <strong>${prevQuote.precioUnitarioUSD.toFixed(2)}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEvaluacionItems(prev => prev.map((it, i) => i === index ? { 
                                        ...it, 
                                        precioUnitarioUSD: prevQuote.precioUnitarioUSD,
                                        origenPrecio: 'HISTORICO_ANTERIOR',
                                        referenciaObraAnterior: `Cotizado en ${prevQuote.proyectoAscensor}`
                                      } : it));
                                      addToast(`Precio anterior de $${prevQuote.precioUnitarioUSD} cargado desde ${prevQuote.proyectoAscensor}`, 'info');
                                    }}
                                    className="ml-1 text-amber-400 underline cursor-pointer hover:text-amber-300 font-bold"
                                  >
                                    Cargar Precio Anterior
                                  </button>
                                </div>
                              )}

                              {/* Opción de Ajuste Manual de Precio Total Directo */}
                              <div className="flex items-center gap-1.5 ml-auto text-slate-400">
                                <span>o Ajustar Precio Total Fijo:</span>
                                <input
                                  type="number"
                                  step={1}
                                  placeholder="Total Fijo USD"
                                  value={item.precioTotalUSD || ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || undefined;
                                    setEvaluacionItems(prev => prev.map((it, i) => i === index ? { ...it, precioTotalUSD: val } : it));
                                  }}
                                  className="w-24 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-emerald-400 text-right font-mono text-[11px]"
                                  title="Use esto para componentes como Tableros de Control con precio cerrado o modificaciones especiales"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Botón para añadir un ítem más a la valuación */}
                      <button
                        type="button"
                        onClick={() => {
                          setEvaluacionItems(prev => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              repuestoNombre: 'Nuevo Material / Componente Especial',
                              cantidadRequerida: 1,
                              unidadMedida: 'Und',
                              precioUnitarioUSD: 0,
                              prioridad: 'ALTA'
                            }
                          ]);
                        }}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-850 transition cursor-pointer font-bold flex items-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>+ Agregar Ítem Adicional a la Cotización</span>
                      </button>
                    </div>
                  )}

                  {/* Gran Total Recalculado */}
                  <div className="bg-slate-900 border border-cyan-500/50 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">ESTIMADO TOTAL RECALCULADO (USD)</span>
                      <strong className="text-2xl text-cyan-400 font-mono font-extrabold">
                        ${sumaTotalEvaluadoUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </strong>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Equivalente BCV: <strong>Bs. {(sumaTotalEvaluadoUSD * tasaCambioBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong> (Tasa: {tasaCambioBCV.toFixed(2)} Bs/$)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          actualizarReporteTecnico(showModalVer.id, {
                            repuestosFaltantes: evaluacionItems,
                            montoEstimadoRepuestosUSD: sumaTotalEvaluadoUSD,
                            estado: 'PENDIENTE_COTIZACION'
                          });
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} className="text-emerald-400" />
                        <span>Guardar Valuación</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          actualizarReporteTecnico(showModalVer.id, {
                            repuestosFaltantes: evaluacionItems,
                            montoEstimadoRepuestosUSD: sumaTotalEvaluadoUSD,
                            estado: 'PENDIENTE_COTIZACION'
                          });
                          convertirReporteAPresupuesto(showModalVer.id);
                          setShowModalVer(null);
                        }}
                        className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                      >
                        <DollarSign size={16} />
                        <span>Generar Presupuesto Oficial</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones de impresión, PDF y cierre */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportReporteTecnicoPDF(showModalVer, empresaActiva, isTecnico)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold transition cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <Download size={14} />
                    <span>Descargar Reporte PDF con Fotos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Imprimir</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModalVer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ANÁLISIS DE REPUESTOS CON IA DE RECONOCIMIENTO VISUAL Y STOCK */}
      {showModalIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border-t-4 border-t-cyan-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles size={20} className="animate-pulse" />
                <h3 className="text-base font-bold text-white">Análisis Visual e Identificación de Stock con IA Gemini</h3>
              </div>
              <button
                onClick={() => setShowModalIA(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Foto a la izquierda */}
              <div className="md:col-span-1 space-y-2">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 overflow-hidden aspect-square flex items-center justify-center">
                  {fotoEnAnalisis ? (
                    <img
                      src={fotoEnAnalisis}
                      alt="Fotografía analizada"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-slate-500 text-xs">Sin fotografía</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono text-center block">Evidencia Técnica de Campo</span>
              </div>

              {/* Resultado a la derecha */}
              <div className="md:col-span-2 space-y-3 font-mono">
                {analizandoIA ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <RefreshCw size={28} className="animate-spin text-cyan-400" />
                    <p className="text-xs text-cyan-300 font-bold text-center">
                      Examinando minuciosamente la imagen...
                    </p>
                    <p className="text-[11px] text-slate-400 text-center">
                      Identificando modelo de repuesto/componente y realizando match con el catálogo de inventario AXON.
                    </p>
                  </div>
                ) : resultadoAnalisisIA ? (
                  <div className="space-y-3">
                    {/* Encabezado de Pieza Identificada */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase text-cyan-400 font-bold">Pieza Identificada por IA</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          resultadoAnalisisIA.nivelCoincidencia === 'ALTO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          resultadoAnalisisIA.nivelCoincidencia === 'MEDIO' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          Coincidencia: {resultadoAnalisisIA.nivelCoincidencia}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{resultadoAnalisisIA.nombrePiezaIdentificada || 'Componente Técnico'}</h4>
                      <p className="text-xs text-slate-300">{resultadoAnalisisIA.descripcionVisual}</p>
                    </div>

                    {/* Explicación Ejecutiva */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Diagnóstico de Stock & Recomendación</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{resultadoAnalisisIA.explicacion}</p>
                    </div>

                    {/* Match en Inventario */}
                    {(() => {
                      const matchedProduct = resultadoAnalisisIA.codigoCoincidente
                        ? products.find(p => p.val_c?.toLowerCase() === resultadoAnalisisIA.codigoCoincidente?.toLowerCase())
                        : null;

                      if (matchedProduct) {
                        const tieneStock = matchedProduct.val_s > 0;
                        return (
                          <div className={`p-3.5 rounded-xl border space-y-2 ${
                            tieneStock ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-rose-950/30 border-rose-500/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-white flex items-center gap-1.5">
                                <PackageCheck size={14} className={tieneStock ? 'text-emerald-400' : 'text-rose-400'} />
                                Repuesto Coincidente en Inventario:
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                tieneStock ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                              }`}>
                                {tieneStock ? `DISPONIBLE (${matchedProduct.val_s} Unds)` : 'SIN STOCK (0 Unds)'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-200">
                              <p><strong>Código:</strong> {matchedProduct.val_c}</p>
                              <p><strong>Descripción:</strong> {matchedProduct.val_d}</p>
                              <p><strong>Precio Catálogo:</strong> ${matchedProduct.precioUSD?.toFixed(2)} USD</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEvaluacionItems(prev => [
                                  ...prev,
                                  {
                                    id: Date.now().toString(),
                                    repuestoNombre: `${matchedProduct.val_d} (${matchedProduct.val_c})`,
                                    cantidadRequerida: 1,
                                    unidadMedida: matchedProduct.val_u || 'Und',
                                    precioUnitarioUSD: matchedProduct.precioUSD || 0,
                                    prioridad: 'ALTA'
                                  }
                                ]);
                                addToast(`Repuesto ${matchedProduct.val_d} añadido al cotizador del reporte`, 'success');
                                setShowModalIA(false);
                              }}
                              className="w-full mt-2 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Plus size={14} />
                              <span>➕ Añadir Repuesto Encontrado a la Cotización del Reporte</span>
                            </button>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-slate-950 p-3 rounded-xl border border-amber-800/40 space-y-2">
                            <span className="text-xs text-amber-300 font-bold block">
                              ⚠️ No se encontró una coincidencia exacta de código en el catálogo actual.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEvaluacionItems(prev => [
                                  ...prev,
                                  {
                                    id: Date.now().toString(),
                                    repuestoNombre: resultadoAnalisisIA.nombrePiezaIdentificada || 'Repuesto Identificado',
                                    cantidadRequerida: 1,
                                    unidadMedida: 'Und',
                                    precioUnitarioUSD: 0,
                                    prioridad: 'ALTA'
                                  }
                                ]);
                                addToast(`Item '${resultadoAnalisisIA.nombrePiezaIdentificada}' agregado al cotizador`, 'info');
                                setShowModalIA(false);
                              }}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus size={14} />
                              <span>Agregar Nombre Identificado como Ítem Solicitado</span>
                            </button>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin datos de análisis visual.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModalIA(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
