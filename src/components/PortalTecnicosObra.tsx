import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import CompanyLogo from './CompanyLogo';
import { TecnicoObraPIN, TipoReporteTecnico, RepuestoFaltanteDetalle } from '../types';
import { 
  Wrench, 
  Building2, 
  UserCheck, 
  Plus, 
  Trash2, 
  Camera, 
  CheckCircle2, 
  Send, 
  Clock, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  Mic,
  RefreshCw,
  Eye,
  Check,
  User,
  MapPin,
  ClipboardList,
  QrCode,
  CheckCircle,
  AlertCircle,
  XCircle,
  Minus,
  PenTool,
  History,
  Activity,
  Zap,
  Phone,
  Radio,
  Wifi,
  Signal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhotoUploader from './PhotoUploader';
import VoiceDictationModal from './VoiceDictationModal';
import PortalTecnicoQRModal from './PortalTecnicoQRModal';
import { insertBufferReporteTecnico, uploadFotoEvidencia, isSupabaseConfigured } from '../services/supabaseClient';

// Lista de Técnicos Autorizados con Código y PIN por Defecto
export const LISTA_TECNICOS_AUTORIZADOS: TecnicoObraPIN[] = [
  {
    id: 'TEC-01',
    codigoPin: '1024',
    nombre: 'Ing. Carlos Rodríguez',
    cargo: 'Líder Técnico de Obras y Maniobras VVVF',
    telefono: '+58 412 555-0199',
    empresaId: 'TECNO_ELEVATEV',
    activo: true
  },
  {
    id: 'TEC-02',
    codigoPin: '2048',
    nombre: 'Téc. Miguel Mendoza',
    cargo: 'Especialista en Mantenimiento y Motores',
    telefono: '+58 414 234-9012',
    empresaId: 'TECNO_ELEVATEV',
    activo: true
  },
  {
    id: 'TEC-03',
    codigoPin: '3072',
    nombre: 'Ing. Jhonny Silva',
    cargo: 'Inspector de Seguridad y Modernizaciones',
    telefono: '+58 412 888-9900',
    empresaId: 'TECNO_ELEVATEV',
    activo: true
  },
  {
    id: 'TEC-04',
    codigoPin: '4096',
    nombre: 'Téc. Robert Alvarado',
    cargo: 'Especialista en Tracción, Guayas y Cableado',
    telefono: '+58 416 777-1122',
    empresaId: 'TECNO_ELEVATEV',
    activo: true
  }
];

// Fallas o hallazgos comunes para inserción rápida con 1 toque
const FALLAS_RAPIDAS = [
  { label: '🚨 Equipo Detenido / Sin Servicio', texto: 'Ascensor detenido totalmente fuera de servicio. Se requiere intervención prioritaria.' },
  { label: '⚡ Variador / Maniobra con Error', texto: 'Tablero de control presenta código de falla en variador de frecuencia. Maniobra bloqueada.' },
  { label: '🚪 Puertas de Piso Trancadas', texto: 'Mecanismo y operador de puertas desalineado. Se traban en pisos intermedios.' },
  { label: '🧵 Desgaste Severo en Guayas', texto: 'Guayas de tracción presentan hilos rotos y fatiga mecánica. Se sugiere reemplazo urgente.' },
  { label: '🔊 Ruidos y Vibración en Máquina', texto: 'Máquina de tracción genera ruido y vibración anormal durante el arranque y frenado.' },
  { label: '🛢️ Fuga de Aceite / Nivel Bajo', texto: 'Fuga de lubricante en retenedor del reductor. Nivel de aceite por debajo del mínimo.' },
  { label: '🛠️ Mantenimiento Mensual OK', texto: 'Mantenimiento preventivo mensual ejecutado satisfactoriamente. Ajuste, lubricación y pruebas de seguridad aprobadas.' }
];

// Materiales / Repuestos comunes para agregar con 1 toque
const MATERIALES_RAPIDOS = [
  { nombre: 'Juego de Zapatas de Freno', unidad: 'Juego', cant: 1 },
  { nombre: 'Guayas de Tracción 1/2" (13mm)', unidad: 'Mts', cant: 120 },
  { nombre: 'Contactor de Potencia 24V/110V', unidad: 'Und', cant: 2 },
  { nombre: 'Aceite Sintético para Reductor ISO 220', unidad: 'Litros', cant: 5 },
  { nombre: 'Patín Retráctil de Cabina', unidad: 'Und', cant: 1 },
  { nombre: 'Botonera de Cabina con Braille', unidad: 'Und', cant: 1 },
  { nombre: 'Sensor Magnético de Nivelación', unidad: 'Und', cant: 2 },
  { nombre: 'Polea Desviadora 400mm', unidad: 'Und', cant: 1 },
  { nombre: 'Variador de Frecuencia VVVF', unidad: 'Und', cant: 1 }
];

// Puntos del checklist de inspección rápida
type CheckItemStatus = 'OK' | 'ALERTA' | 'DANIADO' | 'NO_APLICA';

interface InspectionItem {
  id: string;
  nombre: string;
  icono: string;
  status: CheckItemStatus;
  detalle?: string;
}

const CHECKLIST_DEFAULT: InspectionItem[] = [
  { id: 'motor', nombre: 'Motor y Freno', icono: '⚙️', status: 'OK' },
  { id: 'tablero', nombre: 'Tablero VVVF y Eléctrico', icono: '⚡', status: 'OK' },
  { id: 'puertas', nombre: 'Operador y Puertas', icono: '🚪', status: 'OK' },
  { id: 'guayas', nombre: 'Guayas y Poleas', icono: '🧵', status: 'OK' },
  { id: 'cabina', nombre: 'Cabina y Botoneras', icono: '🛗', status: 'OK' },
  { id: 'foso', nombre: 'Foso y Finales de Carrera', icono: '🕳️', status: 'OK' }
];

interface ItemRepuestoSolicitado {
  id: string;
  nombreRepuesto: string;
  skuRef?: string;
  cantidad: number;
  unidad: string;
  especificacionTecnica?: string;
  prioridad: 'URGENTE' | 'ALTA' | 'NORMAL';
}

export default function PortalTecnicosObra() {
  const { 
    empresaActiva, 
    products, 
    clientes, 
    crearReporteTecnico, 
    addToast, 
    reportesTecnicos,
    probarEnlacePortal
  } = useApp();

  // Modo de visualización dentro del portal: Formulario / Mis Reportes / QR
  const [activeTab, setActiveTab] = useState<'NUEVO_REPORTE' | 'HISTORIAL' | 'QR'>('NUEVO_REPORTE');

  // Diagnóstico de enlace en tiempo real con Gestor ERP
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [linkTestResult, setLinkTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    gestorUser?: string;
    timestamp: string;
    source: string;
  } | null>(null);

  const handleProbarEnlace = async () => {
    setIsTestingLink(true);
    setLinkTestResult(null);
    try {
      const tecnicoNombre = tecnicoActivo?.nombre ? `Téc. ${tecnicoActivo.nombre} (Obra)` : 'Terminal Técnico Campo';
      const res = await probarEnlacePortal('PORTAL_TECNICOS', tecnicoNombre);
      setLinkTestResult(res);
      if (res.success) {
        if (addToast) addToast(`📡 Enlace confirmado con Gestor ERP (${res.latencyMs} ms) ✓`, 'success');
      }
    } catch (e) {
      console.warn('Error probando enlace:', e);
    } finally {
      setIsTestingLink(false);
    }
  };

  // 1. Técnico Activo
  const [tecnicoActivo, setTecnicoActivo] = useState<TecnicoObraPIN>(() => {
    try {
      const saved = localStorage.getItem('axon_tecnico_obra_sesion');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return LISTA_TECNICOS_AUTORIZADOS[0];
  });
  const [showTecnicoSelector, setShowTecnicoSelector] = useState(false);
  const [customTecnicoName, setCustomTecnicoName] = useState('');

  // 2. Tipo de Reporte
  const [tipoReporte, setTipoReporte] = useState<TipoReporteTecnico>('INSPECCION_DANIOS');
  const [prioridad, setPrioridad] = useState<'CRITICA' | 'ALTA' | 'NORMAL'>('ALTA');

  // 3. Cliente / Edificio / Ubicación
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [clienteManual, setClienteManual] = useState<string>('');
  const [clienteRifManual, setClienteRifManual] = useState<string>('');
  const [ubicacionObra, setUbicacionObra] = useState<string>('');
  const [equipoAscensor, setEquipoAscensor] = useState<string>('Ascensor #1');
  const [estadoEquipo, setEstadoEquipo] = useState<'OPERATIVO' | 'FALLAS' | 'DETENIDO'>('FALLAS');

  // 4. Checklist Rápido
  const [checklist, setChecklist] = useState<InspectionItem[]>(CHECKLIST_DEFAULT);

  // 5. Diagnóstico y Observaciones
  const [diagnosticoFalla, setDiagnosticoFalla] = useState<string>('');
  const [observacionesGeneral, setObservacionesGeneral] = useState<string>('');

  // 6. Dictado por Voz & QR
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // 7. Evidencias Fotográficas
  const [photos, setPhotos] = useState<string[]>([]);

  // 8. Repuestos Solicitados
  const [itemsRepuestos, setItemsRepuestos] = useState<ItemRepuestoSolicitado[]>([]);
  const [selectedCatalogSku, setSelectedCatalogSku] = useState<string>('');
  const [repuestoNombreLibre, setRepuestoNombreLibre] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidad, setUnidad] = useState<string>('Und');
  const [itemPrioridad, setItemPrioridad] = useState<'URGENTE' | 'ALTA' | 'NORMAL'>('ALTA');

  // 9. Firma Táctil de Conformidad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [firmanteNombre, setFirmanteNombre] = useState('');

  // 10. Estados de Envío y Confirmación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reporteExitoso, setReporteExitoso] = useState<string | null>(null);

  // Ajustar estado del checklist
  const handleToggleChecklistStatus = (itemId: string, newStatus: CheckItemStatus) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  // Agregar falla rápida al texto
  const handleAddFallaRapida = (texto: string) => {
    setDiagnosticoFalla(prev => prev ? `${prev}\n• ${texto}` : `• ${texto}`);
    if (addToast) addToast('Hallazgo añadido al diagnóstico', 'info');
  };

  // Agregar repuesto rápido de 1 toque
  const handleAddMaterialRapido = (item: { nombre: string; unidad: string; cant: number }) => {
    const nuevoItem: ItemRepuestoSolicitado = {
      id: 'ITM-MAT-' + Date.now() + Math.random().toString(36).substring(2, 5),
      nombreRepuesto: item.nombre,
      cantidad: item.cant,
      unidad: item.unidad,
      prioridad: 'ALTA'
    };
    setItemsRepuestos(prev => [...prev, nuevoItem]);
    if (addToast) addToast(`+ "${item.nombre}" agregado`, 'success');
  };

  // Agregar repuesto manual
  const handleAgregarRepuestoManual = () => {
    let nombre = '';
    let skuRef = '';

    if (selectedCatalogSku) {
      const prodCat = products.find(p => p.val_c === selectedCatalogSku);
      if (prodCat) {
        nombre = `${prodCat.val_d} (${prodCat.val_mo || ''} ${prodCat.val_m || ''})`.trim();
        skuRef = prodCat.val_c;
      }
    } else if (repuestoNombreLibre.trim()) {
      nombre = repuestoNombreLibre.trim();
    } else {
      if (addToast) addToast('Escribe el nombre del repuesto o selecciónalo del catálogo.', 'warning');
      return;
    }

    const nuevoItem: ItemRepuestoSolicitado = {
      id: 'ITM-OBRA-' + Date.now() + Math.random().toString(36).substring(2, 5),
      nombreRepuesto: nombre,
      skuRef,
      cantidad: Math.max(1, cantidad),
      unidad,
      prioridad: itemPrioridad
    };

    setItemsRepuestos(prev => [...prev, nuevoItem]);
    setSelectedCatalogSku('');
    setRepuestoNombreLibre('');
    setCantidad(1);
    if (addToast) addToast(`Repuesto "${nombre}" añadido.`, 'success');
  };

  const handleEliminarRepuesto = (id: string) => {
    setItemsRepuestos(prev => prev.filter(i => i.id !== id));
  };

  // Dictado por voz
  const handleApplyVoiceDictation = (data: { ingeniero: string; proyecto: string; descripcion: string }) => {
    if (data.descripcion) {
      setDiagnosticoFalla(prev => (prev ? `${prev}\n\n${data.descripcion}` : data.descripcion));
    }
    if (data.proyecto && !selectedClienteId && !clienteManual) {
      setClienteManual(data.proyecto);
    }
    if (addToast) addToast('🎙️ Dictado por voz insertado con éxito.', 'success');
  };

  // Canvas de Firma Táctil
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#38bdf8';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  // Envío del Reporte al ERP, Supabase Storage y Buffer_Reportes_Tecnicos
  const handleSubmitReporte = async () => {
    const clienteNombreFinal = selectedClienteId 
      ? (clientes.find(c => c.id === selectedClienteId)?.razonSocial || 'Cliente Registrado')
      : (clienteManual.trim() || 'Edificio / Obra en Sitio');

    const clienteRifFinal = selectedClienteId
      ? (clientes.find(c => c.id === selectedClienteId)?.rif || '')
      : (clienteRifManual.trim() || '');

    if (!clienteNombreFinal) {
      if (addToast) addToast('Por favor indica el nombre del Edificio / Cliente.', 'warning');
      return;
    }

    if (!diagnosticoFalla.trim() && photos.length === 0) {
      if (addToast) addToast('Por favor ingresa un diagnóstico o toma al menos una foto de evidencia.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const transaccionId = 'REP-OBRA-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      // Resumen del checklist
      const checklistSummary = checklist.map(c => `${c.icono} ${c.nombre}: ${c.status === 'OK' ? '✓ Correcto' : c.status === 'ALERTA' ? '⚠️ Alerta' : c.status === 'DANIADO' ? '❌ Dañado' : 'N/A'}`).join(' | ');

      const diagnosticoCompleto = `${diagnosticoFalla.trim()}\n\n[ESTADO EQUIPO: ${estadoEquipo}]\n[CHECKLIST RÁPIDO]: ${checklistSummary}${firmanteNombre ? `\n[CONFORMIDAD]: Recibido por ${firmanteNombre}` : ''}`.trim();

      const repuestosDetalles: RepuestoFaltanteDetalle[] = itemsRepuestos.map(i => ({
        id: i.id,
        repuestoNombre: i.nombreRepuesto,
        cantidadRequerida: i.cantidad,
        unidadMedida: i.unidad,
        prioridad: i.prioridad === 'URGENTE' ? 'URGENTE' : i.prioridad === 'ALTA' ? 'ALTA' : 'MEDIA',
        observaciones: i.especificacionTecnica
      }));

      const tecnicoLabel = tecnicoActivo.nombre ? `${tecnicoActivo.nombre} (${tecnicoActivo.id})` : 'Téc. de Campo';

      // 1. Subir/Optimizar fotos a Supabase Storage (Bucket: 'evidencias')
      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.startsWith('http://') || p.startsWith('https://')) {
          uploadedPhotoUrls.push(p);
        } else {
          // Comprimir y subir a Supabase Storage
          const subida = await uploadFotoEvidencia(p, 'inspecciones', `${transaccionId}_foto_${i + 1}`);
          uploadedPhotoUrls.push(subida.url);
        }
      }

      // 2. Insertar en Buffer_Reportes_Tecnicos de Supabase (PostgreSQL)
      if (isSupabaseConfigured()) {
        await insertBufferReporteTecnico({
          id_transaccion: transaccionId,
          fecha_hora: new Date().toISOString(),
          codigo_tecnico: tecnicoActivo.id || 'TEC-01',
          nombre_tecnico: tecnicoLabel,
          cliente_obra: clienteNombreFinal,
          ubicacion: ubicacionObra || clienteNombreFinal,
          ascensor_equipo: `${equipoAscensor} (${estadoEquipo})`,
          diagnostico_falla: diagnosticoCompleto,
          repuestos_solicitados_json: JSON.stringify(repuestosDetalles),
          fotos_json: JSON.stringify(uploadedPhotoUrls),
          fotos_count: uploadedPhotoUrls.length
        });
      }

      // 3. Guardar en el Gestor ERP Central
      crearReporteTecnico({
        fecha: new Date().toISOString().split('T')[0],
        tecnicoNombre: tecnicoLabel,
        clienteNombre: clienteNombreFinal,
        clienteRif: clienteRifFinal,
        ubicacionObra: ubicacionObra || 'Sitio de Obra / Edificio',
        equipoAscensor: `${equipoAscensor} (${estadoEquipo})`,
        tipoReporte: tipoReporte,
        prioridadAtencion: prioridad,
        diagnosticoDanio: diagnosticoCompleto,
        detallesManualesPedidos: observacionesGeneral,
        repuestosFaltantes: repuestosDetalles,
        requierePresupuesto: itemsRepuestos.length > 0 || tipoReporte === 'INSPECCION_DANIOS',
        photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : photos,
        fotosEvidenciaCount: uploadedPhotoUrls.length || photos.length,
        estado: 'PENDIENTE_COTIZACION',
        estadoGestionBuffer: 'PENDIENTE_GESTOR',
        supabaseId: transaccionId,
        division: 'MANTENIMIENTO'
      });

      setReporteExitoso(transaccionId);
      if (addToast) addToast(`🚀 ¡Reporte ${transaccionId} enviado a Buffer_Reportes_Tecnicos en Supabase y al Gestor ERP!`, 'success');

      // Limpiar formulario para el próximo reporte
      setDiagnosticoFalla('');
      setObservacionesGeneral('');
      setItemsRepuestos([]);
      setPhotos([]);
      setClienteManual('');
      setClienteRifManual('');
      setUbicacionObra('');
      clearSignature();
      setFirmanteNombre('');
      setChecklist(CHECKLIST_DEFAULT);
    } catch (error: any) {
      console.error(error);
      if (addToast) addToast('Error al enviar el reporte.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">

      {/* HEADER AMIGABLE PARA TÉCNICOS EN MÓVIL Y ESCRITORIO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-md shrink-0 flex items-center justify-center">
              <CompanyLogo empresa={empresaActiva} size={40} showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border border-amber-500/40 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  App Técnico en Obra
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {empresaActiva.nombreCorto}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                Reportes Rápidos de Daños y Mantenimiento
              </h1>
            </div>
          </div>

          {/* SELECTOR RÁPIDO DE TÉCNICO EN 1 CLIC */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                👤
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-mono">Técnico en Sitio</p>
                <p className="text-xs font-bold text-amber-300 truncate max-w-[140px]">
                  {tecnicoActivo.nombre}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTecnicoSelector(!showTecnicoSelector)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-[11px] font-mono font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* MODAL / DROPDOWN SELECTOR DE TÉCNICO */}
        {showTecnicoSelector && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mt-4 pt-4 border-t border-slate-800 space-y-2"
          >
            <p className="text-xs font-mono font-bold text-slate-300">Selecciona tu nombre o ingresa uno nuevo:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {LISTA_TECNICOS_AUTORIZADOS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTecnicoActivo(t);
                    setShowTecnicoSelector(false);
                    localStorage.setItem('axon_tecnico_obra_sesion', JSON.stringify(t));
                    if (addToast) addToast(`Técnico seleccionado: ${t.nombre}`, 'info');
                  }}
                  className={`p-2.5 rounded-xl border text-left font-mono transition text-xs cursor-pointer ${
                    tecnicoActivo.id === t.id
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-white text-xs truncate">[{t.id}] {t.nombre}</p>
                  <p className="text-[10px] text-slate-400 truncate">{t.cargo}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customTecnicoName}
                onChange={(e) => setCustomTecnicoName(e.target.value)}
                placeholder="O escribe otro nombre (Ej: Téc. Pedro Pérez)..."
                className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTecnicoName.trim()) {
                    const nuevo: TecnicoObraPIN = {
                      id: 'TEC-EXT',
                      codigoPin: '0000',
                      nombre: customTecnicoName.trim(),
                      cargo: 'Técnico de Campo',
                      telefono: '',
                      empresaId: empresaActiva.id,
                      activo: true
                    };
                    setTecnicoActivo(nuevo);
                    setShowTecnicoSelector(false);
                    setCustomTecnicoName('');
                    localStorage.setItem('axon_tecnico_obra_sesion', JSON.stringify(nuevo));
                  }
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl font-mono"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        )}

        {/* PESTAÑAS DE NAVEGACIÓN SUPERIOR */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('NUEVO_REPORTE')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'NUEVO_REPORTE'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <PenTool size={16} />
            <span>1. Nuevo Reporte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORIAL')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'HISTORIAL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <History size={16} />
            <span>2. Enviados ({reportesTecnicos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="py-2.5 px-3 rounded-2xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-slate-950 text-amber-300 hover:bg-slate-800 border border-slate-800"
          >
            <QrCode size={16} />
            <span>3. QR Obra</span>
          </button>
        </div>
      </div>

      {/* COMPROBADOR DE ENLACE ACTIVO Y RESPUESTA AUTOMÁTICA DEL GESTOR */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border transition-all ${
              linkTestResult?.success 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                : isTestingLink 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-cyan-400'
            }`}>
              <Radio size={22} className={isTestingLink ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">
                  Verificación de Enlace con Gestor Central
                </span>
                <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border ${
                  linkTestResult?.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : isTestingLink 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {isTestingLink 
                    ? 'ENVIANDO PING...' 
                    : linkTestResult?.success 
                      ? `EN LÍNEA (${linkTestResult.latencyMs}ms)` 
                      : 'LISTO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                {linkTestResult 
                  ? linkTestResult.message 
                  : 'Pulsa para emitir una señal Ping y verificar que el Gestor ERP contesta en tiempo real.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isTestingLink}
            onClick={handleProbarEnlace}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-mono text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 border shadow-lg ${
              isTestingLink
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/30 shadow-cyan-500/20 active:scale-98'
            }`}
          >
            <Radio size={16} className={isTestingLink ? 'animate-spin' : ''} />
            <span>{isTestingLink ? 'Comprobando Enlace...' : 'Comprobar Enlace con Gestor'}</span>
          </button>
        </div>
      </div>

      {/* BANNER DE INFORME EXITOSO */}
      {reporteExitoso && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-950/90 border-2 border-emerald-500 p-5 rounded-3xl text-emerald-200 space-y-3 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
            <div className="flex items-center gap-2 font-black text-white text-base">
              <CheckCircle2 size={24} className="text-emerald-400" />
              <span>¡Reporte Registrado y Enviado con Éxito!</span>
            </div>
            <span className="font-mono text-xs bg-emerald-900 px-3 py-1 rounded-xl text-emerald-300 border border-emerald-700 font-bold">
              {reporteExitoso}
            </span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
            El reporte fue guardado y sincronizado a la oficina central de <strong>{empresaActiva.nombreCorto}</strong>. El departamento técnico ya puede revisarlo y procesar los repuestos.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setReporteExitoso(null)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono transition cursor-pointer shadow-md"
            >
              + Levantar Otro Reporte de Obra
            </button>
            <button
              onClick={() => {
                setReporteExitoso(null);
                setActiveTab('HISTORIAL');
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold rounded-xl text-xs font-mono transition cursor-pointer border border-emerald-700"
            >
              Ver en Historial
            </button>
          </div>
        </motion.div>
      )}

      {/* VISTA 1: FORMULARIO DE NUEVO REPORTE */}
      {activeTab === 'NUEVO_REPORTE' && (
        <div className="space-y-5">

          {/* PASO 1: TIPO DE REPORTE (BOTONES GRANDES Y CLAROS) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">1</span>
                <span>¿Qué tipo de trabajo estás realizando?</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Selección Rápida</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Botón 1: Reporte de Daños / Avería */}
              <button
                type="button"
                onClick={() => {
                  setTipoReporte('INSPECCION_DANIOS');
                  setPrioridad('CRITICA');
                  setEstadoEquipo('DETENIDO');
                }}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  tipoReporte === 'INSPECCION_DANIOS'
                    ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🚨</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${tipoReporte === 'INSPECCION_DANIOS' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    Prioridad Alta
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Reporte de Daños / Avería</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Ascensor parado, fallas, ruidos anormales o rotura</p>
                </div>
              </button>

              {/* Botón 2: Mantenimiento Preventivo */}
              <button
                type="button"
                onClick={() => {
                  setTipoReporte('MANTENIMIENTO_PREVENTIVO');
                  setPrioridad('NORMAL');
                  setEstadoEquipo('OPERATIVO');
                }}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  tipoReporte === 'MANTENIMIENTO_PREVENTIVO'
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🛠️</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${tipoReporte === 'MANTENIMIENTO_PREVENTIVO' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    Rutina
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Mantenimiento Preventivo</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Revisión mensual, lubricación, ajustes y limpieza</p>
                </div>
              </button>

              {/* Botón 3: Visita p/ Presupuesto u Obra */}
              <button
                type="button"
                onClick={() => {
                  setTipoReporte('VISITA_PRESUPUESTO');
                  setPrioridad('ALTA');
                }}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  tipoReporte === 'VISITA_PRESUPUESTO'
                    ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📐</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${tipoReporte === 'VISITA_PRESUPUESTO' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    Levantamiento
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Levantamiento / Cotización</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Medición de foso, cabina o modernización</p>
                </div>
              </button>
            </div>
          </div>

          {/* PASO 2: EDIFICIO / CLIENTE & EQUIPO */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">2</span>
                <span>¿En qué edificio o ascensor estás?</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Ubicación</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                  🏢 Seleccionar de la lista de clientes registrados:
                </label>
                <select
                  value={selectedClienteId}
                  onChange={(e) => {
                    setSelectedClienteId(e.target.value);
                    if (e.target.value) {
                      const cli = clientes.find(c => c.id === e.target.value);
                      if (cli) {
                        setUbicacionObra(cli.direccion);
                        if (cli.equipos && cli.equipos.length > 0) {
                          setEquipoAscensor(cli.equipos[0].nombreEquipo || 'Ascensor #1');
                        }
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs rounded-2xl p-3 font-sans transition outline-none"
                >
                  <option value="">-- O seleccionar Cliente Registrado --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} ({c.rif})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                  ✍️ O escribe el nombre del Edificio / Obra:
                </label>
                <input
                  type="text"
                  value={clienteManual}
                  onChange={(e) => setClienteManual(e.target.value)}
                  placeholder="Ej: Res. Parque Cristal, Torre A"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs rounded-2xl p-3 transition outline-none"
                />
              </div>
            </div>

            {/* SELECCIÓN RÁPIDA DE ASCENSOR Y ESTADO ACTUAL */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                  🛗 Ascensor / Equipo:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Ascensor #1', 'Ascensor #2', 'Ascensor #3', 'Montacargas', 'Panorámico'].map(eq => (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => setEquipoAscensor(eq)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                        equipoAscensor === eq
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={equipoAscensor}
                  onChange={(e) => setEquipoAscensor(e.target.value)}
                  placeholder="Ej: Ascensor Principal #1"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                  ⚡ Estado en que encontraste el ascensor:
                </label>
                <div className="grid grid-cols-3 gap-1.5 h-10">
                  <button
                    type="button"
                    onClick={() => setEstadoEquipo('OPERATIVO')}
                    className={`rounded-xl text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      estadoEquipo === 'OPERATIVO'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>🟢</span>
                    <span className="hidden sm:inline">Operativo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoEquipo('FALLAS')}
                    className={`rounded-xl text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      estadoEquipo === 'FALLAS'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>🟡</span>
                    <span className="hidden sm:inline">Con Fallas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoEquipo('DETENIDO')}
                    className={`rounded-xl text-[11px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      estadoEquipo === 'DETENIDO'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>🔴</span>
                    <span className="hidden sm:inline">Detenido</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PASO 3: CHECKLIST RÁPIDO EN 1 TOQUE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">3</span>
                <span>Checklist Rápido de Puntos Clave</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Toca para cambiar estado</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {checklist.map(item => (
                <div key={item.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{item.icono}</span>
                      <span className="truncate">{item.nombre}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistStatus(item.id, 'OK')}
                      className={`py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                        item.status === 'OK'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                      title="Buen Estado"
                    >
                      ✓ Bien
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleChecklistStatus(item.id, 'ALERTA')}
                      className={`py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                        item.status === 'ALERTA'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                      title="Atención / Desgaste"
                    >
                      ⚠️ Alerta
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleChecklistStatus(item.id, 'DANIADO')}
                      className={`py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                        item.status === 'DANIADO'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                      title="Dañado"
                    >
                      ❌ Daño
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PASO 4: DIAGNÓSTICO DE LA FALLA O REPORTE + DICTADO DE VOZ */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">4</span>
                <span>Diagnóstico, Avería o Trabajos Realizados *</span>
              </label>

              {/* BOTÓN GRANDE DE DICTADO POR VOZ */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-mono font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20 shrink-0"
              >
                <Mic size={15} className="animate-pulse" />
                <span>🎙️ Dictar por Voz (Manos Libres)</span>
              </button>
            </div>

            {/* CHIPS DE FALLAS COMUNES PARA AÑADIR CON 1 TOQUE */}
            <div>
              <p className="text-[11px] font-mono text-slate-400 mb-1.5">Toca una opción común para agregarla automáticamente:</p>
              <div className="flex flex-wrap gap-1.5">
                {FALLAS_RAPIDAS.map(f => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => handleAddFallaRapida(f.texto)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[11px] font-sans transition cursor-pointer text-left"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ÁREA DE TEXTO PRINCIPAL */}
            <div>
              <textarea
                rows={4}
                value={diagnosticoFalla}
                onChange={(e) => setDiagnosticoFalla(e.target.value)}
                placeholder="Escribe o dicta el diagnóstico aquí. Ejemplo: Se detectó ruido en la polea desviadora y las guayas de tracción tienen desgaste en el piso 4. El motor arranca con sobrecalentamiento."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs sm:text-sm rounded-2xl p-4 leading-relaxed transition outline-none font-sans"
              />
            </div>
          </div>

          {/* PASO 5: FOTOS Y EVIDENCIAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[11px] font-black">5</span>
                <span>Fotos de la Avería o Trabajo</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Toma fotos con tu teléfono</span>
            </div>

            <PhotoUploader
              photos={photos}
              onChange={(updatedPhotos) => setPhotos(updatedPhotos)}
              maxPhotos={8}
              label="📷 Presiona aquí para tomar fotos de la avería, placa del motor o foso"
            />
          </div>

          {/* PASO 6: REPUESTOS O MATERIALES FALTANTES (OPCIONAL) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">6</span>
                <span>Repuestos o Materiales Necesarios (Opcional)</span>
              </label>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                Oficina valorará el precio
              </span>
            </div>

            {/* CHIPS RÁPIDOS DE REPUESTOS */}
            <div>
              <p className="text-[11px] font-mono text-slate-400 mb-1.5">Agregar repuestos frecuentes con 1 toque:</p>
              <div className="flex flex-wrap gap-1.5">
                {MATERIALES_RAPIDOS.map(m => (
                  <button
                    key={m.nombre}
                    type="button"
                    onClick={() => handleAddMaterialRapido(m)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/50 rounded-xl text-[11px] font-mono transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>{m.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* O AGREGAR UNO MANUAL */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={repuestoNombreLibre}
                onChange={(e) => setRepuestoNombreLibre(e.target.value)}
                placeholder="O escribe otro repuesto necesario..."
                className="flex-1 w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 outline-none focus:border-amber-500"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-xs text-white px-2 font-bold">{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2 font-mono"
                >
                  <option value="Und">Und</option>
                  <option value="Mts">Mts</option>
                  <option value="Juego">Juego</option>
                  <option value="Litros">Litros</option>
                </select>

                <button
                  type="button"
                  onClick={handleAgregarRepuestoManual}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl font-mono shrink-0 cursor-pointer"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* LISTA DE MATERIALES AÑADIDOS */}
            {itemsRepuestos.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-mono text-slate-400">Materiales en la lista ({itemsRepuestos.length}):</p>
                {itemsRepuestos.map((item, idx) => (
                  <div 
                    key={item.id}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono font-bold">#{idx + 1}</span>
                      <span className="text-white font-medium">{item.nombreRepuesto}</span>
                      <span className="text-slate-400 font-mono">({item.cantidad} {item.unidad})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarRepuesto(item.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PASO 7: FIRMA DIGITAL TÁCTIL (OPCIONAL) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[11px] font-black">7</span>
                <span>Firma de Conformidad en Pantalla (Opcional)</span>
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-rose-400 font-mono hover:underline cursor-pointer"
                >
                  Borrar Firma
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-mono">Dibuja la firma con el dedo:</p>
                <div className="bg-slate-950 border border-dashed border-slate-700 rounded-2xl overflow-hidden touch-none relative h-28 flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                  />
                  {!hasSignature && (
                    <span className="absolute text-slate-600 font-mono text-xs pointer-events-none">
                      ✍️ Tocar aquí para firmar con el dedo
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-mono">Nombre de quien recibe / conserje:</p>
                <input
                  type="text"
                  value={firmanteNombre}
                  onChange={(e) => setFirmanteNombre(e.target.value)}
                  placeholder="Ej: Sr. Manuel (Conserje / Junta de Condominio)"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* BOTÓN GIGANTE DE ENVÍO */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl space-y-3 text-center">
            <button
              type="button"
              onClick={handleSubmitReporte}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-sm sm:text-base font-mono transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Enviando reporte a la oficina central...</span>
                </span>
              ) : (
                <>
                  <Send size={20} />
                  <span>🚀 ENVIAR REPORTE AL GESTOR ERP</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 font-mono">
              Se sincroniza automáticamente con la oficina de <strong>{empresaActiva.nombreCorto}</strong>
            </p>
          </div>

        </div>
      )}

      {/* VISTA 2: HISTORIAL DE REPORTES ENVIADOS */}
      {activeTab === 'HISTORIAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-mono font-bold text-xs uppercase tracking-wider">
              <History size={16} className="text-amber-400" />
              <span>Carpeta de Obra: {tecnicoActivo.nombre} ({reportesTecnicos.filter(r => r.tecnicoNombre?.includes(tecnicoActivo.nombre) || r.tecnicoNombre?.includes(tecnicoActivo.id)).length})</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('NUEVO_REPORTE')}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs font-mono rounded-xl cursor-pointer"
            >
              + Nuevo Reporte
            </button>
          </div>

          {reportesTecnicos.filter(r => r.tecnicoNombre?.includes(tecnicoActivo.nombre) || r.tecnicoNombre?.includes(tecnicoActivo.id)).length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <span className="text-4xl">📁</span>
              <p className="text-xs text-slate-400 font-mono">No hay reportes en la carpeta personal de <strong>{tecnicoActivo.nombre}</strong>.</p>
              <p className="text-[11px] text-slate-500 font-mono">Tus inspecciones y levantamientos técnicos aparecerán aquí agrupados por obra y ascensor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reportesTecnicos
                .filter(r => r.tecnicoNombre?.includes(tecnicoActivo.nombre) || r.tecnicoNombre?.includes(tecnicoActivo.id))
                .map(rep => (
                <div 
                  key={rep.id} 
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">{rep.correlativo}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      rep.estado === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rep.estado.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">{rep.clienteNombre}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{rep.equipoAscensor}</p>
                  <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                    {rep.diagnosticoDanio}
                  </p>

                  {rep.photos && rep.photos.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 pt-1">
                      <Camera size={13} />
                      <span>{rep.photos.length} Fotos adjuntas</span>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-850 flex justify-between">
                    <span>Obra: {rep.ubicacionObra || 'N/A'}</span>
                    <span>{rep.fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DICTADO POR VOZ */}
      <VoiceDictationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyDictation={handleApplyVoiceDictation}
        initialIngeniero={tecnicoActivo.nombre}
        initialProyecto={clienteManual || selectedClienteId}
        initialDescripcion={diagnosticoFalla}
      />

      {/* MODAL QR OBRA */}
      <PortalTecnicoQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

    </div>
  );
}
