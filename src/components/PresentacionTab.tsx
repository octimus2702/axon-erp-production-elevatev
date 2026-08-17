import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Zap, 
  Warehouse, 
  Smartphone, 
  Lock, 
  RefreshCw,
  Mail,
  MapPin,
  Phone,
  Layers,
  Award,
  DollarSign,
  TrendingDown,
  Tag,
  Percent,
  Plus,
  Trash2,
  Edit3,
  Calculator,
  Check,
  HelpCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { exportDossierPDF, exportCotizacionPresentacionPDF, exportCartaPresentacionPDF, exportComparativoMercadoPDF } from '../utils/pdfDossierExporter';

export interface CotizacionItem {
  id: string;
  concepto: string;
  descripcion: string;
  precioMercadoUsd: number;
  precioAxonUsd: number;
}

export default function PresentacionTab() {
  const { empresaActiva, empresasDisponibles = [], setEmpresaActivaId, tasaCambioBCV, addToast } = useApp();

  // Pestaña principal activa: 'DOSSIER' o 'COTIZACION'
  const [viewMode, setViewMode] = useState<'DOSSIER' | 'COTIZACION'>('DOSSIER');

  // Datos de cliente / destinatario
  const [empresa, setEmpresa] = useState(empresaActiva?.nombre || '');
  const [nombreComercial, setNombreComercial] = useState(empresaActiva?.nombreCorto || '');
  const [rif, setRif] = useState(empresaActiva?.rif || '');
  const [direccion, setDireccion] = useState(empresaActiva?.direccion || '');
  const [email, setEmail] = useState(empresaActiva?.email || '');
  const [destinatario, setDestinatario] = useState('Gerencia General & Equipo Operativo');
  const [cargoDestinatario, setCargoDestinatario] = useState('Dirección de Mantenimiento e Instalaciones');
  const [remitente, setRemitente] = useState('Manuel Guerra - Creador & Gestor AXON ERP');

  // Sincronizar campos cuando cambie la empresa activa
  React.useEffect(() => {
    if (empresaActiva) {
      setEmpresa(empresaActiva.nombre || empresaActiva.razonSocial);
      setNombreComercial(empresaActiva.nombreCorto || empresaActiva.nombre);
      setRif(empresaActiva.rif);
      setDireccion(empresaActiva.direccion);
      setEmail(empresaActiva.email);
    }
  }, [empresaActiva]);

  // Cotización Editable Manualmente
  const [validezDias, setValidezDias] = useState(15);
  const [condicionesPago, setCondicionesPago] = useState('50% al iniciar la implementación y 50% contra entrega de accesos y capacitación de personal.');
  const [moneda, setMoneda] = useState<'USD' | 'BS'>('USD');
  const [modificarPorcentajeManual, setModificarPorcentajeManual] = useState(false);
  const [porcentajeDescuentoManual, setPorcentajeDescuentoManual] = useState(50);

  // Items de Cotización totalmente modificables
  const [itemsCotizacion, setItemsCotizacion] = useState<CotizacionItem[]>([
    {
      id: '1',
      concepto: 'Puesta en Marcha & Configuración Inicial',
      descripcion: 'Parametrización del catálogo de repuestos, carga inicial de inventario, creación de usuarios, roles e inducción técnica operativa.',
      precioMercadoUsd: 1200,
      precioAxonUsd: 450
    },
    {
      id: '2',
      concepto: 'Licencia Nube, Servidores & Mantenimiento Mensual',
      descripcion: 'Hospedaje en infraestructura de alta velocidad, respaldos diarios automáticos en la nube, soporte técnico y actualizaciones continuas.',
      precioMercadoUsd: 150,
      precioAxonUsd: 60
    }
  ]);

  // Nuevo item borrador
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoMercado, setNuevoMercado] = useState(200);
  const [nuevoAxon, setNuevoAxon] = useState(90);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const dossierPdfRef = useRef<HTMLDivElement>(null);
  const cotizacionPdfRef = useRef<HTMLDivElement>(null);

  // Preset para cargar datos de ITA ASCENSORES
  const loadItaAscensores = () => {
    setEmpresa('Ascensores Barbaroza, C.A');
    setNombreComercial('ITA ASCENSORES');
    setRif('J-29993664-2');
    setDireccion('Av. Elías Rodríguez, Galpón N° 15, Zona Industrial, Las Tejerías, Edo. Aragua, Venezuela');
    setEmail('mantenimiento.barbaroza@gmail.com');
    setDestinatario('Ing. Gerencia de Operaciones');
    setCargoDestinatario('Dirección Técnica & Mantenimiento de Ascensores');
    addToast('¡Datos de ITA ASCENSORES cargados con éxito!', 'success');
  };

  // Agregar item a cotización
  const handleAgregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoConcepto.trim()) {
      addToast('Ingresa el nombre del concepto', 'warning');
      return;
    }
    const nuevo: CotizacionItem = {
      id: Date.now().toString(),
      concepto: nuevoConcepto,
      descripcion: nuevaDescripcion || 'Servicio especializado complementario AXON ERP',
      precioMercadoUsd: Number(nuevoMercado) || 0,
      precioAxonUsd: Number(nuevoAxon) || 0
    };
    setItemsCotizacion([...itemsCotizacion, nuevo]);
    setNuevoConcepto('');
    setNuevaDescripcion('');
    setNuevoMercado(100);
    setNuevoAxon(40);
    addToast('¡Concepto agregado a la cotización!', 'success');
  };

  // Eliminar item de cotización
  const handleEliminarItem = (id: string) => {
    if (itemsCotizacion.length <= 1) {
      addToast('Debe haber al menos un concepto en la cotización', 'warning');
      return;
    }
    setItemsCotizacion(itemsCotizacion.filter(item => item.id !== id));
    addToast('Concepto eliminado', 'info');
  };

  // Actualizar costo de un item
  const handleActualizarItem = (id: string, field: keyof CotizacionItem, value: any) => {
    setItemsCotizacion(itemsCotizacion.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Totales
  const totalMercadoUsd = itemsCotizacion.reduce((acc, item) => acc + item.precioMercadoUsd, 0);
  const totalAxonUsd = itemsCotizacion.reduce((acc, item) => acc + item.precioAxonUsd, 0);
  const totalAhorroUsd = totalMercadoUsd - totalAxonUsd;
  const porcentajeAhorroCalculado = totalMercadoUsd > 0 ? Math.round((totalAhorroUsd / totalMercadoUsd) * 100) : 0;
  const porcentajeAhorroFinal = modificarPorcentajeManual ? porcentajeDescuentoManual : porcentajeAhorroCalculado;

  // Formateador de moneda
  const formatPrecio = (montoUsd: number) => {
    if (moneda === 'BS') {
      const montoBs = montoUsd * (tasaCambioBCV || 1);
      return `Bs. ${montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${montoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  // Descargar PDF (Dossier o Cotización)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    if (addToast) addToast('Generando documento PDF de alta definición...', 'info');

    try {
      if (viewMode === 'DOSSIER') {
        exportDossierPDF({
          nombreComercial,
          empresa,
          rif,
          direccion,
          destinatario,
          cargoDestinatario,
          email,
          remitente
        });
      } else {
        exportCotizacionPresentacionPDF({
          nombreComercial,
          empresa,
          rif,
          direccion,
          destinatario,
          cargoDestinatario,
          email,
          remitente,
          itemsCotizacion,
          validezDias,
          condicionesPago,
          moneda,
          tasaCambioBCV
        });
      }
      if (addToast) addToast('¡PDF generado y descargado exitosamente!', 'success');
    } catch (error) {
      console.error('Error generando PDF:', error);
      if (addToast) addToast('Error al generar PDF. Intentando imprimir...', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Descargar Carta de Presentación en PDF
  const handleDownloadCartaPdf = async () => {
    setIsGeneratingPdf(true);
    if (addToast) addToast('Generando Carta de Presentación en PDF...', 'info');
    try {
      exportCartaPresentacionPDF({
        nombreComercial,
        empresa,
        rif,
        direccion,
        destinatario,
        cargoDestinatario,
        email,
        remitente
      });
      if (addToast) addToast('¡Carta de Presentación en PDF descargada!', 'success');
    } catch (error) {
      console.error('Error generando Carta PDF:', error);
      if (addToast) addToast('Error al generar la carta en PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Descargar PDF Comparativo de Mercado (AXON vs Odoo, SAP & Tradicional)
  const handleDownloadComparativoPdf = async () => {
    setIsGeneratingPdf(true);
    if (addToast) addToast('Generando Informe Comparativo de Mercado en PDF (AXON vs Odoo & SAP)...', 'info');
    try {
      exportComparativoMercadoPDF({
        nombreComercial,
        empresa,
        rif,
        direccion,
        destinatario,
        cargoDestinatario,
        email,
        remitente
      });
      if (addToast) addToast('¡Informe Comparativo de Mercado PDF generado exitosamente!', 'success');
    } catch (error) {
      console.error('Error generando PDF Comparativo:', error);
      if (addToast) addToast('Error al generar el informe comparativo en PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  // Copiar resumen de WhatsApp según pestaña activa
  const handleCopyText = () => {
    let text = '';
    if (viewMode === 'DOSSIER') {
      text = `*DOSSIER TÉCNICO Y PROPUESTA EJECUTIVA - AXON ERP*
*SISTEMA GESTOR DE SOFTWARE EMPRESARIAL MULTI-SECTOR*

*Cliente:* ${nombreComercial} (${empresa})
*RIF:* ${rif}
*Atención:* ${destinatario}
*Remitente:* ${remitente}

Estimados Sres. de *${nombreComercial}*:
Presentamos el Dossier Ejecutivo de *AXON ERP*, plataforma creadora de software adaptada a múltiples áreas (Contabilidad, Seguros, Textil, Mantenimiento y Comercio).

*Móudlos Clave:*
1. 📦 Inventario y Kárdex de Repuestos (VVVF, Tarjetas, Relés).
2. 📱 Vales y Reportes Digitales con Firma en Pantalla.
3. 📋 Portal Web de Cotizaciones e Integración WhatsApp.
4. 📊 Integración con Hojas de Cálculo (Excel / Sheets).
5. 🔒 Seguridad PIN, Biométrica y Perfiles de Acceso.`;
    } else {
      text = `*COTIZACIÓN OFICIAL DE SERVICIOS - AXON ERP*
*PLATAFORMA GESTORA DE SOFTWARE MULTI-INDUSTRIA*

*Cliente:* ${nombreComercial} (${empresa})
*RIF:* ${rif}
*Fecha:* ${new Date().toLocaleDateString('es-ES')}
*Validez:* ${validezDias} días continuos

*DETALLE DE COTIZACIÓN (AHORRO PREFERENCIAL > ${porcentajeAhorroFinal}%):*
${itemsCotizacion.map((item, idx) => `${idx + 1}. *${item.concepto}*:
   • Ref. Mercado: ${formatPrecio(item.precioMercadoUsd)}
   • *Tarifa AXON ERP:* ${formatPrecio(item.precioAxonUsd)}`).join('\n')}

*RESUMEN TOTAL:*
• *Inversión Total AXON ERP:* ${formatPrecio(totalAxonUsd)}
• *Ahorro Total Directo:* ${formatPrecio(totalAhorroUsd)} (-${porcentajeAhorroFinal}% DTO)

*Condiciones de Pago:* ${condicionesPago}`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('¡Resumen copiado para WhatsApp!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 text-left" id="dossier-cotizacion-container">
      
      {/* HEADER PRINCIPAL Y SELECTOR DE SECCIONES (DOSSIER VS COTIZACIÓN SEPARADA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                AXON ERP • Módulo Ejecutivo
              </span>
            </div>
            <h3 className="text-lg font-sans font-extrabold text-zinc-100 uppercase tracking-wide mt-1">
              Documentación Comercial & Cotizaciones
            </h3>
            <p className="text-xs text-zinc-400">
              Gestione en forma independiente el Dossier Técnico Ejecutivo y la Cotización de Costos Personalizada.
            </p>
          </div>

          {/* ACCIONES DE DESCARGA E IMPRESIÓN */}
          <div className="flex flex-wrap items-center gap-2">
            {empresasDisponibles.length > 1 && (
              <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono shadow-inner">
                <Building2 size={13} className="text-amber-400 mr-1.5" />
                <span className="text-[10px] text-zinc-400 font-bold mr-1.5 uppercase">Empresa:</span>
                <select
                  value={empresaActiva.id}
                  onChange={(e) => setEmpresaActivaId(e.target.value as any)}
                  className="bg-transparent text-amber-300 font-extrabold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  {empresasDisponibles.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900 text-zinc-200">
                      {emp.nombreCorto}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(empresasDisponibles.length > 1 || empresaActiva?.id === 'ITA_ASCENSORES') && (
              <button
                onClick={loadItaAscensores}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Cargar datos de ITA ASCENSORES"
              >
                <Building2 size={14} />
                <span>Preset ITA</span>
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isGeneratingPdf ? 'Generando...' : `Descargar PDF (${viewMode === 'DOSSIER' ? 'Dossier' : 'Cotización'})`}</span>
            </button>

            <button
              onClick={handleDownloadCartaPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs font-mono transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar Carta Explicativa de Virtudes y Adaptabilidad en PDF"
            >
              <FileText size={14} />
              <span>Carta PDF</span>
            </button>

            <button
              onClick={handleDownloadComparativoPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs font-mono transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar PDF con Virtudes de Adaptabilidad Multi-Ramo y Cuadro Comparativo vs Odoo/SAP"
            >
              <Award size={14} />
              <span>PDF Comparativo vs Odoo/SAP</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} className="text-cyan-400" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑA: DOSSIER TÉCNICO VS COTIZACIÓN DE SERVICIO */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 max-w-xl">
          <button
            onClick={() => setViewMode('DOSSIER')}
            className={`flex-1 py-2 px-4 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'DOSSIER'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <FileText size={15} />
            <span>1. DOSSIER TÉCNICO (PDF)</span>
          </button>

          <button
            onClick={() => setViewMode('COTIZACION')}
            className={`flex-1 py-2 px-4 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'COTIZACION'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <DollarSign size={15} />
            <span>2. COTIZACIÓN DEL SERVICIO (EDITABLE)</span>
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL LATERAL CONFIGURABLE (EDICIÓN DE CLIENTE Y PRECIOS) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl print:hidden">
          
          {/* TARJETA INFORMATIVA: DESCARGAR COMPARATIVO CON ODOO / SAP */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-2.5 shadow-md border-t-2 border-t-emerald-400">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Award size={16} className="shrink-0 text-emerald-400" />
              <span className="uppercase tracking-wider">Informe Comparativo PDF</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Exporta un documento ejecutivo en PDF de 2 páginas especificando las virtudes de la adaptabilidad multi-ramo de AXON ERP y la matriz comparativa frente a <strong>Odoo ERP, SAP Business One y Software Tradicional</strong>.
            </p>
            <button
              onClick={handleDownloadComparativoPdf}
              disabled={isGeneratingPdf}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>📄 Descargar PDF Comparativo Mercado</span>
            </button>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <Building2 size={13} />
              Datos del Cliente / Destinatario
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Nombre Comercial:</label>
              <input 
                type="text" 
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Razón Social:</label>
              <input 
                type="text" 
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">RIF Fiscal:</label>
                <input 
                  type="text" 
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Correo Electrónico:</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Dirección de la Empresa:</label>
              <textarea 
                rows={2}
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Atención a (Destinatario):</label>
              <input 
                type="text" 
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Remitente / Software Gestor:</label>
              <input 
                type="text" 
                value={remitente}
                onChange={(e) => setRemitente(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* CONTROLES EXCLUSIVOS DE COTIZACIÓN CUANDO ESTÁ EN MODO COTIZACION */}
          {viewMode === 'COTIZACION' && (
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Calculator size={14} />
                  Editor de Costos de Cotización
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-bold">
                  Editable
                </span>
              </div>

              {/* MONEDA Y VALIDEZ */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Moneda Muestra:</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-bold rounded-xl py-2 px-2.5 focus:outline-none"
                  >
                    <option value="USD">Dólares (USD $)</option>
                    <option value="BS">Bolívares (Bs. BCV)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Validez (Días):</label>
                  <input 
                    type="number"
                    value={validezDias}
                    onChange={(e) => setValidezDias(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* LISTA DE ITEMS EDITABLES */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Conceptos e Inversión (Editar Montos):
                </span>

                {itemsCotizacion.map((item, index) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        #{index + 1} Concepto
                      </span>
                      <button
                        onClick={() => handleEliminarItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1 transition"
                        title="Eliminar concepto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <input 
                      type="text" 
                      value={item.concepto}
                      onChange={(e) => handleActualizarItem(item.id, 'concepto', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-zinc-200 rounded-lg py-1 px-2 text-xs font-bold"
                      placeholder="Nombre del concepto"
                    />

                    <textarea
                      rows={2}
                      value={item.descripcion}
                      onChange={(e) => handleActualizarItem(item.id, 'descripcion', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-400 rounded-lg py-1 px-2 text-[10px]"
                      placeholder="Descripción breve..."
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-mono block">Ref Mercado ($):</span>
                        <input 
                          type="number"
                          value={item.precioMercadoUsd}
                          onChange={(e) => handleActualizarItem(item.id, 'precioMercadoUsd', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-400 line-through rounded-lg py-1 px-2 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-emerald-400 uppercase font-mono block">Tarifa AXON ($):</span>
                        <input 
                          type="number"
                          value={item.precioAxonUsd}
                          onChange={(e) => handleActualizarItem(item.id, 'precioAxonUsd', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-emerald-500/50 text-emerald-400 font-bold rounded-lg py-1 px-2 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FORMULARIO PARA AGREGAR NUEVO ITEM */}
              <form onSubmit={handleAgregarItem} className="bg-slate-950/80 border border-dashed border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                  <Plus size={12} />
                  Agregar Nuevo Concepto
                </span>
                
                <input 
                  type="text" 
                  value={nuevoConcepto}
                  onChange={(e) => setNuevoConcepto(e.target.value)}
                  placeholder="Ej: Migración de Base de Datos"
                  className="w-full bg-slate-900 border border-slate-800 text-zinc-200 rounded-lg py-1 px-2 text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    value={nuevoMercado}
                    onChange={(e) => setNuevoMercado(Number(e.target.value))}
                    placeholder="Ref. Mercado ($)"
                    className="w-full bg-slate-900 border border-slate-800 text-zinc-400 rounded-lg py-1 px-2 text-xs font-mono"
                  />
                  <input 
                    type="number" 
                    value={nuevoAxon}
                    onChange={(e) => setNuevoAxon(Number(e.target.value))}
                    placeholder="Precio AXON ($)"
                    className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg py-1 px-2 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                >
                  + Añadir a Cotización
                </button>
              </form>

              {/* AJUSTE MANUAL DE DESCUENTO O CONDICIONES */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Forzar % Ahorro en Documento:
                  </label>
                  <input 
                    type="checkbox"
                    checked={modificarPorcentajeManual}
                    onChange={(e) => setModificarPorcentajeManual(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                </div>

                {modificarPorcentajeManual && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={porcentajeDescuentoManual}
                      onChange={(e) => setPorcentajeDescuentoManual(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl py-1 px-2 font-mono"
                    />
                    <span className="text-xs font-mono text-emerald-400 font-bold">% DTO</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Condiciones de Pago:</label>
                  <textarea 
                    rows={2}
                    value={condicionesPago}
                    onChange={(e) => setCondicionesPago(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-300 rounded-xl py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* CONTENIDO PRINCIPAL: VISTA PREVIA DEL DOCUMENTO SELECCIONADO (DOSSIER O COTIZACIÓN) */}
        <div className="lg:col-span-8 flex justify-center">
          
          {/* OPCIÓN 1: DOSSIER TÉCNICO Y EJECUTIVO */}
          {viewMode === 'DOSSIER' && (
            <div 
              ref={dossierPdfRef}
              id="dossier-pdf-content"
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 space-y-6 font-sans text-xs print:p-0 print:shadow-none print:border-none print:max-w-none print:rounded-none"
            >
              {/* CABECERA CORPORATIVA DOBLE: AXON ERP GESTOR & CLIENTE (ITA ASCENSORES) */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
                
                {/* AXON ERP GESTOR LOGO & DATOS */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center text-amber-400 font-black font-mono text-base shadow border border-amber-500/30">
                      AX
                    </div>
                    <div>
                      <h1 className="text-base font-black tracking-wider text-slate-900 font-mono">
                        AXON ERP
                      </h1>
                      <p className="text-[10px] font-bold text-amber-600 font-mono uppercase tracking-widest">
                        GESTOR CREADOR DE SOFTWARE EMPRESARIAL MULTI-SECTOR
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                    <p><strong>Desarrollador & Gestor:</strong> Manuel Guerra | <strong>Sistemas:</strong> AXON ERP</p>
                    <p><strong>Especialidad:</strong> Contabilidad, Seguros, Textil, Ascensores & Comercio</p>
                  </div>
                </div>

                {/* DATOS DEL CLIENTE OBJETIVO (ITA ASCENSORES) */}
                <div className="text-right space-y-1 max-w-[260px]">
                  <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border border-slate-300">
                    DESTINATARIO OFICIAL
                  </span>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {nombreComercial}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-700">{empresa}</p>
                  <p className="text-[9.5px] font-mono text-slate-500">RIF: {rif}</p>
                  <p className="text-[9px] text-slate-500 leading-tight">{direccion}</p>
                </div>
              </div>

              {/* TÍTULO DEL DOSSIER EJECUTIVO */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md border-l-4 border-amber-500 space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  DOSSIER TÉCNICO Y PRESENTACIÓN EJECUTIVA 2026
                </span>
                <h2 className="text-base sm:text-lg font-black uppercase font-mono tracking-tight text-white">
                  SISTEMA GESTOR AXON ERP - PLATAFORMA CREADORA DE SOFTWARE MULTI-INDUSTRIA
                </h2>
                <p className="text-[10px] text-slate-300 font-sans">
                  Servicio presentado por AXON ERP para {empresa} ({nombreComercial})
                </p>
              </div>

              {/* SECCIÓN 1: INTRODUCCIÓN Y CONTEXTO OPERATIVO */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-300 pb-1 flex items-center gap-1.5">
                  <Award size={13} className="text-amber-600" />
                  1. Resumen Ejecutivo & Adaptabilidad Multi-Sector
                </h3>
                <p className="text-slate-700 leading-relaxed text-[11px] text-justify">
                  Estimados directores y equipo directivo de <strong>{empresa}</strong> (<em>{nombreComercial}</em>):
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px] text-justify">
                  Nos complace presentar formalmente el <strong>Sistema AXON ERP / AXON Gestor</strong>, una avanzada plataforma creadora de software empresarial concebida para adaptarse de forma nativa a diversas ramas industriales y comerciales, destacando en <strong>Contabilidad y Finanzas, Seguros y Pólizas, Industria Textil y Confección, Mantenimiento Operativo de Ascensores y Transporte Vertical, así como Comercio, Importación y Distribución</strong>.
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px] text-justify">
                  Como gestor y desarrollador tecnológico, AXON unifica en una sola infraestructura la automatización contable, gestión de pólizas y siniestros, matriz de lotes/tallas textiles, control de stock multialmacén, facturación multimoneda (USD/Bs. BCV), reportes de campo con firma digital y catálogo interactivo QR.
                </p>
              </div>

              {/* SECCIÓN 2: MÓDULOS DE AXON ERP */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-300 pb-1 flex items-center gap-1.5">
                  <Layers size={13} className="text-amber-600" />
                  2. Módulos y Soluciones Adaptadas
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Zap size={15} className="text-amber-600 shrink-0" />
                      <span>Contabilidad, Finanzas & BCV</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Libros diarios, estados financieros, cuentas por cobrar/pagar, facturación multimoneda y sincronización con la tasa BCV oficial.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Lock size={15} className="text-amber-600 shrink-0" />
                      <span>Seguros & Control de Pólizas</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Administración de asegurados, vencimiento de coberturas, seguimiento de siniestros, cuotas de pago y cobros.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Layers size={15} className="text-amber-600 shrink-0" />
                      <span>Industria Textil & Confección</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Control de insumos (telas, hilos), patrones de producción, matrices por lote, color y talla, y manufactura.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Smartphone size={15} className="text-amber-600 shrink-0" />
                      <span>Mantenimiento, Ascensores & Campo</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Hojas de ruta para técnicos, reportes de servicio e inspección con evidencia fotográfica en vivo y firmas digitales en sitio.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Warehouse size={15} className="text-amber-600 shrink-0" />
                      <span>Inventarios, Catálogo QR & Despachos</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Control multialmacén, catálogo interactivo con código QR para clientes, órdenes de despacho y reversión automática de stock.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <Award size={15} className="text-amber-600 shrink-0" />
                      <span>Seguridad Multi-Empresa & Nube</span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-snug">
                      Niveles de acceso para Administradores, Operadores y Técnicos con auditoría PIN/Biometría y respaldo en Google Sheets/Cloud.
                    </p>
                  </div>

                </div>
              </div>

              {/* SECCIÓN 3: VENTAJAS TECNOLÓGICAS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-300 pb-1 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-600" />
                  3. Garantía Tecnológica y Respaldos
                </h3>
                <ul className="space-y-1.5 text-slate-700 text-[10.5px]">
                  <li className="flex items-start gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Sincronización Cloud Automática:</strong> Integración transparente con Google Sheets / Excel para exportación masiva.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Acceso Multi-dispositivo PWA:</strong> Funciona desde computadoras, tablets y teléfonos inteligentes sin instalación pesada.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Arquitectura Resiliente:</strong> Funcionamiento garantizado con persistencia local en caso de caídas de conectividad.</span>
                  </li>
                </ul>
              </div>

              {/* FIRMAS DE CONFORMIDAD EN DOSSIER */}
              <div className="border-t-2 border-slate-200 pt-6 mt-6">
                <div className="grid grid-cols-2 gap-8 text-center text-[10px] font-mono">
                  <div className="space-y-8">
                    <div className="border-b border-slate-400 w-3/4 mx-auto pb-1"></div>
                    <div>
                      <p className="font-bold text-slate-900">{remitente}</p>
                      <p className="text-slate-500 font-semibold">AXON ERP • Software Gestor</p>
                      <p className="text-amber-600 font-semibold">Desarrollo & Soporte ERP</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="border-b border-slate-400 w-3/4 mx-auto pb-1"></div>
                    <div>
                      <p className="font-bold text-slate-900">{destinatario}</p>
                      <p className="text-slate-700 font-semibold">{empresa}</p>
                      <p className="text-slate-500">{nombreComercial}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 font-mono mt-6 pt-2 border-t border-slate-100">
                  Dossier Ejecutivo generado por AXON ERP • {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>

            </div>
          )}

          {/* OPCIÓN 2: COTIZACIÓN DEL SERVICIO INDEPENDIENTE (CON EDICIÓN DE COSTO) */}
          {viewMode === 'COTIZACION' && (
            <div 
              ref={cotizacionPdfRef}
              id="cotizacion-pdf-content"
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 space-y-6 font-sans text-xs print:p-0 print:shadow-none print:border-none print:max-w-none print:rounded-none"
            >
              {/* CABECERA DE COTIZACIÓN AXON ERP */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-950 rounded-lg flex items-center justify-center text-emerald-400 font-black font-mono text-lg shadow border border-emerald-500/30">
                      $
                    </div>
                    <div>
                      <h1 className="text-lg font-black tracking-wider text-slate-900 font-mono uppercase">
                        AXON ERP
                      </h1>
                      <p className="text-[10px] font-bold text-emerald-700 font-mono uppercase tracking-widest">
                        PROPUESTA ECONÓMICA DE SOFTWARE GESTOR
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                    <p><strong>Remitente:</strong> {remitente}</p>
                    <p><strong>Sistema:</strong> AXON ERP Gestor Multi-Sector</p>
                  </div>
                </div>

                {/* BLOQUE DE COTIZACIÓN NÚMERO Y FECHA */}
                <div className="text-right space-y-1">
                  <div className="bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg inline-block shadow">
                    COTIZACIÓN N° AXON-{new Date().getFullYear()}-084
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 font-semibold pt-1">
                    <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700 font-bold">
                    <strong>Validez:</strong> {validezDias} días continuos
                  </p>
                </div>

              </div>

              {/* RECUADRO DE DATOS DEL CLIENTE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-[10.5px]">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block mb-0.5">CLIENTE BENEFICIARIO:</span>
                  <p className="font-bold text-slate-900 text-xs">{nombreComercial}</p>
                  <p className="text-slate-700 font-medium">{empresa}</p>
                  <p className="font-mono text-slate-500 text-[10px]">RIF: {rif}</p>
                </div>

                <div>
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block mb-0.5">ATENCIÓN A:</span>
                  <p className="font-bold text-slate-900">{destinatario}</p>
                  <p className="text-slate-600 text-[10px]">{cargoDestinatario}</p>
                  <p className="font-mono text-slate-500 text-[10px]">Email: {email}</p>
                </div>
              </div>

              {/* AVISO DE DESCUENTO Y AHORRO PREFERENCIAL */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold font-mono text-xs">
                    %{porcentajeAhorroFinal}
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs uppercase font-mono">
                      Tarifa Preferencial con &gt; {porcentajeAhorroFinal}% de Ahorro Directo
                    </h4>
                    <p className="text-[10px] text-emerald-800">
                      Inversión ajustada exclusivamente para <strong>{nombreComercial}</strong> por debajo de los costos estándar del mercado industrial.
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-500 block uppercase">Ahorro Estimado:</span>
                  <strong className="text-emerald-700 text-sm font-black">{formatPrecio(totalAhorroUsd)}</strong>
                </div>
              </div>

              {/* TABLA DETALLADA DE COTIZACIÓN */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono flex items-center gap-1.5 border-b border-slate-300 pb-1">
                  <DollarSign size={14} className="text-emerald-600" />
                  Detalle de Conceptos e Inversión AXON ERP
                </h3>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono text-[9.5px]">
                        <th className="p-2.5 border-b border-slate-800">Concepto / Servicio</th>
                        <th className="p-2.5 border-b border-slate-800 text-center">Referencia Mercado</th>
                        <th className="p-2.5 border-b border-slate-800 text-center bg-emerald-900 text-emerald-300 font-bold">Tarifa AXON ERP</th>
                        <th className="p-2.5 border-b border-slate-800 text-center">Ahorro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {itemsCotizacion.map((item, idx) => {
                        const ahorroItemUsd = item.precioMercadoUsd - item.precioAxonUsd;
                        const pctItem = item.precioMercadoUsd > 0 ? Math.round((ahorroItemUsd / item.precioMercadoUsd) * 100) : 0;
                        return (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2.5">
                              <strong className="text-slate-900 font-bold">{item.concepto}</strong>
                              <p className="text-[9.5px] text-slate-500 mt-0.5 leading-snug">{item.descripcion}</p>
                            </td>
                            <td className="p-2.5 text-center text-slate-400 line-through font-mono">
                              {formatPrecio(item.precioMercadoUsd)}
                            </td>
                            <td className="p-2.5 text-center font-bold font-mono text-emerald-800 bg-emerald-50/80 text-xs">
                              {formatPrecio(item.precioAxonUsd)}
                            </td>
                            <td className="p-2.5 text-center font-bold text-emerald-600 font-mono text-[10px]">
                              -{pctItem}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALES Y FORMAS DE PAGO */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
                
                <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-[10px]">
                  <strong className="font-mono text-slate-900 uppercase block font-bold text-[10.5px]">
                    Términos y Condiciones de Pago:
                  </strong>
                  <p className="text-slate-700 leading-snug">{condicionesPago}</p>
                  <p className="text-slate-500 pt-1 border-t border-slate-200 text-[9.5px]">
                    * Tasa de conversión BCV oficial referencial: <strong>Bs. {(tasaCambioBCV || 1).toFixed(2)} / USD</strong>.
                  </p>
                </div>

                <div className="md:col-span-5 bg-slate-900 text-white rounded-xl p-3.5 space-y-2 font-mono text-right shadow-md">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Subtotal Mercado:</span>
                    <span className="line-through">{formatPrecio(totalMercadoUsd)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>Descuento Especial (-{porcentajeAhorroFinal}%):</span>
                    <span>-{formatPrecio(totalAhorroUsd)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between text-xs font-black text-amber-400">
                    <span>TOTAL AXON ERP:</span>
                    <span className="text-sm text-emerald-400">{formatPrecio(totalAxonUsd)}</span>
                  </div>
                </div>

              </div>

              {/* FIRMAS EN COTIZACIÓN */}
              <div className="border-t-2 border-slate-200 pt-6 mt-6">
                <div className="grid grid-cols-2 gap-8 text-center text-[10px] font-mono">
                  <div className="space-y-8">
                    <div className="border-b border-slate-400 w-3/4 mx-auto pb-1"></div>
                    <div>
                      <p className="font-bold text-slate-900">{remitente}</p>
                      <p className="text-emerald-700 font-bold">AXON ERP • Cotización Oficial</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="border-b border-slate-400 w-3/4 mx-auto pb-1"></div>
                    <div>
                      <p className="font-bold text-slate-900">{destinatario}</p>
                      <p className="text-slate-700 font-semibold">{nombreComercial}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 font-mono mt-6 pt-2 border-t border-slate-100">
                  Cotización generada por AXON ERP • Válida por {validezDias} días desde su emisión
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
