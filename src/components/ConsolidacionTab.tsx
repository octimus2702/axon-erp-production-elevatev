import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PrestamoHerramienta, Nota, ReciboNota } from '../types';
import { 
  Layers, 
  Folder, 
  FolderPlus, 
  Search, 
  Building2, 
  Wrench, 
  Package, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Send, 
  ArrowLeft, 
  ChevronRight, 
  PackageCheck,
  Calendar,
  User,
  Plus,
  Info,
  SlidersHorizontal,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';

interface MaterialConsolidadoItem {
  descripcionNormalizada: string;
  sku?: string;
  unidadMedida?: string;
  totalCantidad: number;
  valesCount: number;
  detallesNotas: Array<{
    correlativo: string;
    fecha: string;
    responsable: string;
    cantidad: number;
    tipoNota: 'VALE_DESPACHO' | 'NOTA_ENTREGA';
    observacion?: string;
  }>;
}

interface ProyectoCarpetaData {
  nombreProyecto: string;
  clienteNombre?: string;
  vales: Nota[];
  recibosNotas: ReciboNota[];
  prestamosHerramientas: PrestamoHerramienta[];
  totalMaterialesUnicos: number;
  totalCantidadMateriales: number;
  totalHerramientasEnCampo: number;
  totalHerramientasDevueltas: number;
  ultimaFechaActividad: string;
}

export default function ConsolidacionTab() {
  const { 
    empresaActiva,
    vales, 
    recibos, 
    prestamosHerramientas, 
    actualizarEstadoPrestamoHerramienta,
    products,
    activeDivision,
    addToast
  } = useApp();

  // Estados
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTermFolder, setSearchTermFolder] = useState('');
  const [searchTermMaterial, setSearchTermMaterial] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'MATERIALES' | 'HERRAMIENTAS' | 'VALES'>('MATERIALES');
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  // Modal para agregar una obra/carpeta manual si es necesario
  const [showModalNuevaObra, setShowModalNuevaObra] = useState(false);
  const [nuevaObraNombre, setNuevaObraNombre] = useState('');
  const [customProyectos, setCustomProyectos] = useState<string[]>(() => {
    const saved = localStorage.getItem('axon_custom_proyectos_carpetas');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCrearObraManual = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nuevaObraNombre.trim();
    if (!name) return;
    if (!customProyectos.includes(name)) {
      const updated = [name, ...customProyectos];
      setCustomProyectos(updated);
      localStorage.setItem('axon_custom_proyectos_carpetas', JSON.stringify(updated));
      addToast(`Carpeta de proyecto "${name}" creada exitosamente.`, 'success');
    }
    setNuevaObraNombre('');
    setShowModalNuevaObra(false);
    setSelectedFolder(name);
  };

  // 1. EXTRAER TODOS LOS PROYECTOS / OBRAS AUTOMÁTICAMENTE
  const proyectosCarpetasMap = useMemo(() => {
    const map = new Map<string, ProyectoCarpetaData>();

    const getOrCreateFolder = (nombre: string): ProyectoCarpetaData => {
      const cleanName = nombre.trim();
      if (!map.has(cleanName)) {
        map.set(cleanName, {
          nombreProyecto: cleanName,
          vales: [],
          recibosNotas: [],
          prestamosHerramientas: [],
          totalMaterialesUnicos: 0,
          totalCantidadMateriales: 0,
          totalHerramientasEnCampo: 0,
          totalHerramientasDevueltas: 0,
          ultimaFechaActividad: 'Sin registros'
        });
      }
      return map.get(cleanName)!;
    };

    // Agregar carpetas manuales
    customProyectos.forEach(p => getOrCreateFolder(p));

    // Procesar Vales de Salida
    vales.filter(v => v.division === activeDivision).forEach(v => {
      const folderName = v.Destino || 'General / Sin Especificar';
      const folder = getOrCreateFolder(folderName);
      folder.vales.push(v);
      if (v.Fecha > folder.ultimaFechaActividad || folder.ultimaFechaActividad === 'Sin registros') {
        folder.ultimaFechaActividad = v.Fecha;
      }
    });

    // Procesar Notas de Entrega de Materiales
    recibos.filter(r => r.division === activeDivision && r.tipo === 'NOTA_ENTREGA').forEach(r => {
      const folderName = r.clienteNombre || 'General / Sin Especificar';
      const folder = getOrCreateFolder(folderName);
      folder.recibosNotas.push(r);
      if (r.fecha > folder.ultimaFechaActividad || folder.ultimaFechaActividad === 'Sin registros') {
        folder.ultimaFechaActividad = r.fecha;
      }
    });

    // Procesar Préstamos de Herramientas
    prestamosHerramientas.filter(ph => ph.division === activeDivision).forEach(ph => {
      const folderName = ph.obraNombre || 'General / Sin Especificar';
      const folder = getOrCreateFolder(folderName);
      folder.prestamosHerramientas.push(ph);
      const fecha = ph.fechaSolicitud.substring(0, 10);
      if (fecha > folder.ultimaFechaActividad || folder.ultimaFechaActividad === 'Sin registros') {
        folder.ultimaFechaActividad = fecha;
      }

      const countItems = ph.items.reduce((acc, it) => acc + it.cantidad, 0);
      if (ph.estado === 'EN_OBRA') {
        folder.totalHerramientasEnCampo += countItems;
      } else {
        folder.totalHerramientasDevueltas += countItems;
      }
    });

    return map;
  }, [vales, recibos, prestamosHerramientas, activeDivision, customProyectos]);

  const carpetasArray = useMemo(() => {
    return Array.from(proyectosCarpetasMap.values());
  }, [proyectosCarpetasMap]);

  // Carpetas filtradas por búsqueda
  const carpetasFiltradas = useMemo(() => {
    if (!searchTermFolder.trim()) return carpetasArray;
    const term = searchTermFolder.toLowerCase();
    return carpetasArray.filter(c => 
      c.nombreProyecto.toLowerCase().includes(term) ||
      c.vales.some(v => (v.Responsable || '').toLowerCase().includes(term)) ||
      c.prestamosHerramientas.some(p => p.tecnicoNombre.toLowerCase().includes(term))
    );
  }, [carpetasArray, searchTermFolder]);

  // 2. CONSOLIDACIÓN INTELIGENTE DE MATERIALES PARA EL PROYECTO SELECCIONADO
  const folderData = selectedFolder ? proyectosCarpetasMap.get(selectedFolder) : null;

  const materialesConsolidados = useMemo<MaterialConsolidadoItem[]>(() => {
    if (!folderData) return [];

    const itemsMap = new Map<string, MaterialConsolidadoItem>();

    const registrarItem = (
      desc: string, 
      cant: number, 
      correlativo: string, 
      fecha: string, 
      responsable: string,
      tipoNota: 'VALE_DESPACHO' | 'NOTA_ENTREGA',
      obs?: string,
      sku?: string,
      unid?: string
    ) => {
      const cleanDesc = desc.trim();
      if (!cleanDesc || cant <= 0) return;

      // Normalizar la clave de agrupación (ejemplo: "electrodo 6013 1/8" en minúsculas)
      const keyNormal = cleanDesc.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[-_]/g, ' ');

      if (!itemsMap.has(keyNormal)) {
        itemsMap.set(keyNormal, {
          descripcionNormalizada: cleanDesc,
          sku,
          unidadMedida: unid || 'Unds / Kg / Mts',
          totalCantidad: 0,
          valesCount: 0,
          detallesNotas: []
        });
      }

      const itemObj = itemsMap.get(keyNormal)!;
      itemObj.totalCantidad += cant;
      itemObj.valesCount += 1;
      itemObj.detallesNotas.push({
        correlativo,
        fecha,
        responsable,
        cantidad: cant,
        tipoNota,
        observacion: obs
      });
    };

    // A) Procesar Vales de Despacho
    folderData.vales.forEach(v => {
      let rawProds = v.Productos;
      if (!rawProds) return;

      try {
        const parsed = typeof rawProds === 'string' ? JSON.parse(rawProds) : rawProds;
        if (Array.isArray(parsed)) {
          parsed.forEach((pItem: any) => {
            const desc = pItem.val_d || pItem.descripcion || pItem.nombre || pItem.val_c || 'Material de Repuesto';
            const cant = parseFloat(pItem.cantidad) || 1;
            registrarItem(desc, cant, v.NroVale, v.Fecha, v.Responsable || 'Almacén', 'VALE_DESPACHO', v.ProyectoDesc, pItem.val_c);
          });
          return;
        }
      } catch (e) {
        // Formato texto plano
      }

      if (typeof rawProds === 'string') {
        const lines = rawProds.split(/[\n,;]+/);
        lines.forEach(line => {
          const match = line.match(/^(\d+)\s*x?\s*(.+)$/i);
          if (match) {
            const cant = parseFloat(match[1]) || 1;
            const desc = match[2].trim();
            registrarItem(desc, cant, v.NroVale, v.Fecha, v.Responsable || 'Almacén', 'VALE_DESPACHO', v.ProyectoDesc);
          } else if (line.trim().length > 2) {
            registrarItem(line.trim(), 1, v.NroVale, v.Fecha, v.Responsable || 'Almacén', 'VALE_DESPACHO', v.ProyectoDesc);
          }
        });
      }
    });

    // B) Procesar Notas de Entrega
    folderData.recibosNotas.forEach(r => {
      if (r.concepto) {
        registrarItem(r.concepto, 1, r.correlativo, r.fecha, r.clienteNombre, 'NOTA_ENTREGA', `Monto USD: $${r.montoUSD.toFixed(2)}`);
      }
    });

    return Array.from(itemsMap.values()).sort((a, b) => b.totalCantidad - a.totalCantidad);
  }, [folderData]);

  // Materiales filtrados por término de búsqueda
  const materialesFiltrados = useMemo(() => {
    if (!searchTermMaterial.trim()) return materialesConsolidados;
    const term = searchTermMaterial.toLowerCase();
    return materialesConsolidados.filter(m => 
      m.descripcionNormalizada.toLowerCase().includes(term) ||
      (m.sku && m.sku.toLowerCase().includes(term))
    );
  }, [materialesConsolidados, searchTermMaterial]);

  // 3. GENERAR RESUMEN PARA WHATSAPP
  const handleEnviarConsolidadoWhatsApp = () => {
    if (!folderData) return;

    let texto = `📋 *CONSOLIDADO GENERAL DE MATERIALES & OBRA*\n` +
      `🏗️ *Proyecto / Obra:* ${folderData.nombreProyecto}\n` +
      `🏢 *Empresa:* ${empresaActiva.nombreCorto}\n` +
      `📅 *Fecha Informe:* ${new Date().toISOString().substring(0, 10)}\n\n` +
      `📦 *SUMA TOTAL DE CONSUMIBLES Y MATERIALES DESPACHADOS:*\n`;

    materialesConsolidados.forEach((mat, idx) => {
      texto += `${idx + 1}. *${mat.descripcionNormalizada}* → Total: *${mat.totalCantidad}* (${mat.valesCount} despachos)\n`;
    });

    if (folderData.prestamosHerramientas.length > 0) {
      texto += `\n🧰 *ESTATUS DE HERRAMIENTAS EN CAMPO:*\n`;
      folderData.prestamosHerramientas.forEach(p => {
        const estadoLabel = p.estado === 'EN_OBRA' ? '⏳ EN OBRA' : '✅ DEVUELTO';
        texto += `• *${p.correlativo}* (${p.tecnicoNombre}) → ${estadoLabel} [${p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}]\n`;
      });
    }

    texto += `\nGestor Asignado: *${empresaActiva.nombreGestor || 'Gestor Operativo'}*`;

    navigator.clipboard.writeText(texto);
    addToast('Resumen del proyecto copiado al portapapeles. ¡Listo para pegar en WhatsApp!', 'success');
  };

  const handleImprimirConsolidado = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL DE CONSOLIDACIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
                Consolidación por Obras & Proyectos
              </h1>
              <p className="text-xs text-zinc-400">
                Resumen automático acumulado de materiales, consumibles y herramientas despachadas por carpeta de proyecto
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-200 font-mono font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <ArrowLeft size={14} />
              <span>Volver a Carpetas</span>
            </button>
          )}

          <button
            onClick={() => setShowModalNuevaObra(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-xs font-mono transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>Nueva Carpeta de Obra</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: LISTA GENERAL DE CARPETAS DE OBRA / PROYECTOS */}
      {!selectedFolder ? (
        <div className="space-y-6">
          
          {/* BARRA DE BÚSQUEDA Y METRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
              <Search size={16} className="text-amber-400 ml-1" />
              <input 
                type="text"
                placeholder="Buscar obra, proyecto, técnico o cliente..."
                value={searchTermFolder}
                onChange={(e) => setSearchTermFolder(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-200 border-none focus:outline-none font-mono"
              />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Folder size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Proyectos Activos</span>
                <span className="text-lg font-mono font-black text-amber-300">{carpetasFiltradas.length} Obras</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <Wrench size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Herramientas en Campo</span>
                <span className="text-lg font-mono font-black text-cyan-300">
                  {carpetasArray.reduce((acc, c) => acc + c.totalHerramientasEnCampo, 0)} Activos
                </span>
              </div>
            </div>
          </div>

          {/* GRID DE CARPETAS DE PROYECTO */}
          {carpetasFiltradas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-zinc-500 font-mono space-y-3">
              <Folder size={48} className="mx-auto opacity-30 text-amber-400" />
              <p className="text-sm font-bold text-zinc-300">No se encontraron carpetas de proyectos u obras.</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Las carpetas se crean automáticamente al emitir una Nota de Despacho o Salida de Herramienta asignando un nombre de destino.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {carpetasFiltradas.map(c => {
                const totalDespachos = c.vales.length + c.recibosNotas.length;
                return (
                  <motion.div
                    key={c.nombreProyecto}
                    whileHover={{ scale: 1.015, translateY: -2 }}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => setSelectedFolder(c.nombreProyecto)}
                  >
                    <div className="space-y-3">
                      {/* Borde Decorativo Superior */}
                      <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-700 absolute top-0 left-0" />

                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 bg-amber-950/80 border border-amber-800/60 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                            <Folder size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-zinc-100 group-hover:text-amber-300 transition line-clamp-1">
                              {c.nombreProyecto}
                            </h3>
                            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Calendar size={10} />
                              Último Despacho: {c.ultimaFechaActividad}
                            </span>
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-zinc-600 group-hover:text-amber-400 transition transform group-hover:translate-x-1" />
                      </div>

                      {/* STATS DEL PROYECTO */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Vales de Salida</span>
                          <span className="text-sm font-black text-amber-400">{totalDespachos} Vales</span>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Herramientas Campo</span>
                          <span className={`text-sm font-black ${c.totalHerramientasEnCampo > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>
                            {c.totalHerramientasEnCampo} Activas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] font-mono text-amber-400/90 font-bold">
                      <span>Abrir Carpeta de Obra</span>
                      <span className="group-hover:underline">Ver Consolidado →</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA 2: DETALLE Y FICHA DE CONSOLIDACIÓN DE PROYECTO */
        <div className="space-y-6">
          
          {/* BANNER DE LA CARPETA SELECCIONADA */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Folder size={14} />
                <span>CARPETA DE PROYECTO & OBRA CONSOLIDADA</span>
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
                {selectedFolder}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Empresa: <strong className="text-amber-300">{empresaActiva.nombreCorto}</strong> • Última fecha de registro: {folderData?.ultimaFechaActividad}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleEnviarConsolidadoWhatsApp}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Copiar resumen general para WhatsApp"
              >
                <Send size={14} />
                <span>Copiar WhatsApp</span>
              </button>

              <button
                onClick={handleImprimirConsolidado}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-zinc-200 font-mono font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Imprimir informe de consolidación de obra"
              >
                <Printer size={14} />
                <span>Imprimir Hoja</span>
              </button>
            </div>
          </div>

          {/* NAVEGACIÓN EN PESTAÑAS INTERNAS */}
          <div className="flex border-b border-slate-800 gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveSubTab('MATERIALES')}
              className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'MATERIALES'
                  ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Package size={14} />
              <span>1. Consolidado de Materiales ({materialesConsolidados.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('HERRAMIENTAS')}
              className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'HERRAMIENTAS'
                  ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wrench size={14} />
              <span>2. Herramientas en Obra ({folderData?.prestamosHerramientas.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('VALES')}
              className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'VALES'
                  ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText size={14} />
              <span>3. Vales de Salida ({folderData?.vales.length || 0})</span>
            </button>
          </div>

          {/* SUBTAB 1: CONSOLIDADO ACUMULADO DE MATERIALES */}
          {activeSubTab === 'MATERIALES' && (
            <div className="space-y-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input 
                    type="text"
                    placeholder="Filtrar materiales o consumibles por descripción..."
                    value={searchTermMaterial}
                    onChange={(e) => setSearchTermMaterial(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <Search size={14} className="text-zinc-500 absolute left-3 top-2.5" />
                </div>

                <div className="text-xs font-mono text-zinc-400 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <Info size={12} className="inline mr-1 text-amber-400" />
                  El gestor ve la suma agregada total buscando por <strong>Descripción del Producto</strong>.
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-400">
                        <th className="py-3 px-4">Descripción del Material / Consumible</th>
                        <th className="py-3 px-4 text-center">SKU / Cód</th>
                        <th className="py-3 px-4 text-center">Unidad</th>
                        <th className="py-3 px-4 text-center">Total Despachado (Suma)</th>
                        <th className="py-3 px-4 text-center">N° Vales</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs font-mono">
                      {materialesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-zinc-500">
                            <Package className="mx-auto mb-2 opacity-30 text-amber-400" size={32} />
                            <span>No se registran despachos de materiales con los filtros aplicados en este proyecto.</span>
                          </td>
                        </tr>
                      ) : (
                        materialesFiltrados.map((mat, idx) => {
                          const isExpanded = expandedMaterial === mat.descripcionNormalizada;
                          return (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-slate-950/50 transition">
                                <td className="py-3 px-4">
                                  <span className="font-extrabold text-zinc-100 block text-xs">
                                    {mat.descripcionNormalizada}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="text-[10px] text-zinc-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {mat.sku || 'N/A'}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-center text-zinc-400 text-[11px]">
                                  {mat.unidadMedida}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="text-base font-black text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-lg inline-block">
                                    {mat.totalCantidad}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-center text-zinc-300 font-bold">
                                  {mat.valesCount} Vales
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => setExpandedMaterial(isExpanded ? null : mat.descripcionNormalizada)}
                                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    {isExpanded ? 'Ocultar N° Vales' : 'Ver N° Vales'}
                                  </button>
                                </td>
                              </tr>

                              {/* DESGLOSE EXPANDIDO DE NOTAS QUE SUMARON A ESTE MATERIAL */}
                              {isExpanded && (
                                <tr className="bg-slate-950/90 border-t border-b border-amber-500/20">
                                  <td colSpan={6} className="p-4 space-y-2">
                                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                      <FileText size={12} />
                                      <span>Desglose de notas que despacharon: "{mat.descripcionNormalizada}"</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                      {mat.detallesNotas.map((det, dIdx) => (
                                        <div key={dIdx} className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-1">
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-amber-400">Vale N° {det.correlativo}</span>
                                            <span className="text-zinc-500">{det.fecha}</span>
                                          </div>
                                          <div className="text-[11px] text-zinc-200 font-bold flex justify-between">
                                            <span>Responsable: {det.responsable}</span>
                                            <span className="text-amber-300 font-mono">+{det.cantidad}</span>
                                          </div>
                                          {det.observacion && (
                                            <p className="text-[10px] text-zinc-400 italic pt-0.5 truncate">{det.observacion}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: HERRAMIENTAS EN CAMPO Y ACCIÓN DE DEVOLUCIÓN */}
          {activeSubTab === 'HERRAMIENTAS' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wrench size={18} className="text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Herramientas & Equipos Despachados a este Proyecto</h3>
                    <p className="text-xs text-zinc-400">Puedes cambiar automáticamente el estatus a "DEVUELTO" para restablecer el stock al almacén.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-zinc-400">
                        <th className="py-3 px-4">Correlativo / Fecha</th>
                        <th className="py-3 px-4">Técnico Asignado</th>
                        <th className="py-3 px-4">Herramientas</th>
                        <th className="py-3 px-4 text-center">Estatus Obra</th>
                        <th className="py-3 px-4 text-center">Acción Devolución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {folderData?.prestamosHerramientas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-500">
                            <Wrench className="mx-auto mb-2 opacity-30 text-amber-400" size={32} />
                            <span>No hay préstamos de herramientas asignados a este proyecto.</span>
                          </td>
                        </tr>
                      ) : (
                        folderData?.prestamosHerramientas.map(loan => {
                          const isEnObra = loan.estado === 'EN_OBRA';
                          return (
                            <tr key={loan.id} className="hover:bg-slate-950/40 transition">
                              <td className="py-3 px-4">
                                <span className="font-bold text-amber-400 block">{loan.correlativo}</span>
                                <span className="text-[10px] text-zinc-500">{loan.fechaSolicitud}</span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-bold text-zinc-200 block">{loan.tecnicoNombre}</span>
                                {loan.tecnicoTelefono && (
                                  <span className="text-[10px] text-zinc-400">{loan.tecnicoTelefono}</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  {loan.items.map((it, idx) => (
                                    <div key={idx} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                                      <span className="text-amber-400 font-bold">{it.cantidad}x</span>
                                      <span>{it.nombre}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isEnObra ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                                    <Clock size={10} />
                                    EN OBRA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} />
                                    DEVUELTO
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {isEnObra ? (
                                  <button
                                    onClick={() => actualizarEstadoPrestamoHerramienta(loan.id, 'DEVUELTO')}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[10.5px] transition flex items-center gap-1 mx-auto cursor-pointer shadow-md"
                                    title="Marcar como Devuelto y Reingresar Stock"
                                  >
                                    <PackageCheck size={13} />
                                    <span>Devolver a Almacén</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 italic">Devuelto ({loan.fechaDevolucionReal?.substring(0, 10)})</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: HISTÓRICO DE VALES DE SALIDA */}
          {activeSubTab === 'VALES' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-zinc-400">
                      <th className="py-3 px-4">Vale N°</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Responsable / Solicitante</th>
                      <th className="py-3 px-4">Detalle / Proyecto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {folderData?.vales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500">
                          <FileText className="mx-auto mb-2 opacity-30 text-amber-400" size={32} />
                          <span>No hay vales de salida asociados a esta carpeta.</span>
                        </td>
                      </tr>
                    ) : (
                      folderData?.vales.map((v, vIdx) => (
                        <tr key={vIdx} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-4 font-bold text-amber-400">{v.NroVale}</td>
                          <td className="py-3 px-4 text-zinc-400">{v.Fecha}</td>
                          <td className="py-3 px-4 font-bold text-zinc-200">{v.Responsable || 'Almacén'}</td>
                          <td className="py-3 px-4 text-zinc-300 truncate max-w-xs">{v.ProyectoDesc || 'Despacho de Materiales'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL PARA CREAR CARPETA MANUALLY SI SE REQUIERE */}
      <AnimatePresence>
        {showModalNuevaObra && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                  <FolderPlus size={18} />
                  <span>Crear Nueva Carpeta de Obra</span>
                </div>
                <button onClick={() => setShowModalNuevaObra(false)} className="text-zinc-500 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCrearObraManual} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 mb-1">Nombre de la Obra / Proyecto*</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: Residencias Parque Cristal, Torre B"
                    value={nuevaObraNombre}
                    onChange={(e) => setNuevaObraNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Nota: Al emitir cualquier vale de salida con esta obra como destino, los materiales se acumularán automáticamente aquí.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModalNuevaObra(false)}
                    className="px-4 py-2 bg-slate-950 text-zinc-400 border border-slate-800 rounded-lg hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg"
                  >
                    Crear Carpeta
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
