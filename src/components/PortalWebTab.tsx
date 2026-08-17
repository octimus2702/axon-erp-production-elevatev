import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp, INITIAL_EMPRESAS } from '../context/AppContext';
import CompanyLogo from './CompanyLogo';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import PortalTecnicosObra from './PortalTecnicosObra';
import PortalTecnicoQRModal from './PortalTecnicoQRModal';
import { insertBufferCotizacion, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  Building2, 
  Wrench, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Award,
  ChevronRight,
  Calculator,
  FileText,
  HelpCircle,
  ExternalLink,
  Laptop,
  Share2,
  Copy,
  Check,
  MessageSquare,
  X,
  QrCode,
  Download,
  Printer,
  Smartphone,
  Users,
  UserCheck,
  Radio,
  Activity,
  Wifi,
  Globe,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  Lock,
  Cpu,
  Search,
  Image as ImageIcon,
  Eye,
  Camera,
  FileSearch,
  Siren,
  Navigation,
  Truck,
  PhoneCall,
  User,
  Play,
  AlertOctagon,
  AlertTriangle,
  History,
  Plus,
  Upload,
  FolderPlus,
  Filter,
  Signal
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
  isPublicView?: boolean;
  onOpenPublicView?: () => void;
}

// Interfaz para Galería de Proyectos y Referencias
export interface ProjectGalleryItem {
  id: string;
  titulo: string;
  clienteEdificio: string;
  categoria: 'CABINAS' | 'VVVF' | 'PANORAMICOS' | 'MONTACARGAS' | 'MANTENIMIENTO';
  descripcion: string;
  ubicacion: string;
  fecha: string;
  imagenUrl: string;
  fotoAntesUrl?: string;
  caracteristicas: string[];
}

// Interfaz para Tracking de Servicio y Atención Técnica en Tiempo Real ("Estilo Pedido")
export interface LiveServiceTrack {
  id: string; // Ej: 'EME-2026-8821'
  clienteNombre: string;
  rifCedula?: string;
  apartamentoTorre: string;
  tipoServicio: 'EMERGENCIA' | 'MANTENIMIENTO' | 'REPARACION' | 'INSPECCION';
  fallaOAsunto: string;
  step: 1 | 2 | 3 | 4 | 5; 
  // 1: Reporte Recibido, 2: Técnico Asignado, 3: En Camino, 4: En Sitio / Reparando, 5: Servicio Concluido
  tecnico: {
    nombre: string;
    cargo: string;
    telefono: string;
    vehiculo: string;
    avatarUrl?: string;
  };
  horaReporte: string;
  etaLlegada: string;
  ubicacionActual: string;
  notasAdicionales?: string;
  fotoComprobante?: string;
}

// Presets de Clientes para Identificación Interactiva en el Portal Web
interface PortalClientPreset {
  id: string;
  nombreCliente: string;
  rifCedula: string;
  personaContacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  paradasDefault: number;
  tipoServicioDefault: string;
  dispositivo: string;
}

const PRESET_CLIENTES_PORTAL: PortalClientPreset[] = [
  {
    id: 'CLI-PARK-01',
    nombreCliente: 'Residencias Park Palace, C.A.',
    rifCedula: 'J-30491823-1',
    personaContacto: 'Ing. Carlos Mendoza (Junta Condominio)',
    telefono: '+58 412 555-0199',
    email: 'condominio.parkpalace@gmail.com',
    ciudad: 'Caracas, Chacao',
    paradasDefault: 14,
    tipoServicioDefault: 'MODERNIZACION',
    dispositivo: 'iPhone 15 Pro • Safari Mobile'
  },
  {
    id: 'CLI-TORRE-02',
    nombreCliente: 'Torre Financiera Caracas, C.A.',
    rifCedula: 'J-40812934-5',
    personaContacto: 'Lic. Elena Rivas (Gerente Operaciones)',
    telefono: '+58 414 234-9012',
    email: 'administracion@torrefinanciera.com',
    ciudad: 'Caracas, El Recreo',
    paradasDefault: 22,
    tipoServicioDefault: 'MANTENIMIENTO',
    dispositivo: 'MacBook Pro • Chrome macOS'
  },
  {
    id: 'CLI-HOSP-03',
    nombreCliente: 'Hospital Clínico Las Mercedes',
    rifCedula: 'J-31092817-9',
    personaContacto: 'Dr. Miguel Torres (Director Mantenimiento)',
    telefono: '+58 424 987-6543',
    email: 'mantenimiento@hospitalclinico.ve',
    ciudad: 'Caracas, Baruta',
    paradasDefault: 8,
    tipoServicioDefault: 'EMERGENCIA',
    dispositivo: 'Samsung S24 • Android Chrome'
  },
  {
    id: 'CLI-ALTA-04',
    nombreCliente: 'Condominio Residencias Altamira',
    rifCedula: 'J-29831092-4',
    personaContacto: 'Sra. Beatriz Blanco (Administradora)',
    telefono: '+58 416 789-0123',
    email: 'res.altamira.chacao@gmail.com',
    ciudad: 'Caracas, Sucre',
    paradasDefault: 10,
    tipoServicioDefault: 'NUEVO_ASCENSOR',
    dispositivo: 'Windows PC • Firefox'
  }
];

interface ActivePortalSession {
  sessionId: string;
  client: PortalClientPreset;
  status: 'COTIZANDO' | 'EXPLORANDO' | 'SOLICITUD_ENVIADA';
  lastActivity: string;
  ipLocation: string;
  activeService: string;
  ultimasCotizaciones: string[];
}

export default function PortalWebTab({ onNavigateTab, isPublicView = false, onOpenPublicView }: Props) {
  const { 
    user,
    empresasDisponibles = [],
    empresaActiva, 
    activeDivision,
    setEmpresaActivaId,
    crearPresupuesto, 
    crearSolicitudCliente,
    tasaCambioBCV = 36.5, 
    addToast,
    hasTabPermission,
    reportesTecnicos = [],
    probarEnlacePortal
  } = useApp();

  // Diagnóstico de enlace en tiempo real con la Central ERP
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [linkTestResult, setLinkTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    gestorUser?: string;
    timestamp: string;
    source: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingLink(true);
    setLinkTestResult(null);
    try {
      const res = await probarEnlacePortal('PORTAL_WEB_CLIENTES', 'Portal Web Clientes (Cotizaciones/Emergencias)');
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

  const fallbackEmpresa = INITIAL_EMPRESAS[0];
  const activeComp = empresaActiva || (empresasDisponibles && empresasDisponibles[0]) || fallbackEmpresa;

  const isTecnicosUrl = typeof window !== 'undefined' && (
    window.location.search.includes('tecnico') || 
    window.location.search.includes('obra') || 
    window.location.hash.includes('tecnico') || 
    window.location.hash.includes('obra')
  );
  const [portalMode, setPortalMode] = useState<'CLIENTES' | 'TECNICOS'>(isTecnicosUrl ? 'TECNICOS' : 'CLIENTES');
  
  // Si se accede de manera pública externa, forzar de forma estricta e independiente el portal asignado por la URL
  const effectivePortalMode: 'CLIENTES' | 'TECNICOS' = isPublicView
    ? (isTecnicosUrl ? 'TECNICOS' : 'CLIENTES')
    : portalMode;

  const [showShareModal, setShowShareModal] = useState(false);
  const [showTechQrModal, setShowTechQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTechLink, setCopiedTechLink] = useState(false);
  const [copiedErpLink, setCopiedErpLink] = useState(false);
  const [selectedShareCompanyId, setSelectedShareCompanyId] = useState<string>(activeComp?.id || 'PROYECTOS_VERTICALES_AB');

  // Estado para consulta exclusiva de estatus y fotos por edificio/condominio
  const [searchTermBuilding, setSearchTermBuilding] = useState<string>('');
  const [modalPhoto, setModalPhoto] = useState<{ url: string; correlativo: string; cliente: string; desc: string } | null>(null);

  useEffect(() => {
    if (activeComp?.id) {
      setSelectedShareCompanyId(activeComp.id);
    }
  }, [activeComp?.id]);

  const targetCompany = (empresasDisponibles || []).find(e => e.id === selectedShareCompanyId) || activeComp || fallbackEmpresa;

  // Obtener URLs independientes por empresa
  const baseUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : '';
  const appPublicUrl = `${baseUrl}?cotizar&empresa=${targetCompany.id}`;
  const techPublicUrl = `${baseUrl}?tecnico&empresa=${targetCompany.id}`;
  const erpLoginUrl = `${baseUrl}?login&empresa=${targetCompany.id}`;

  const handleOpenPortalLink = (url: string = appPublicUrl) => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#cotizar';
    }
    if (onOpenPublicView) {
      onOpenPublicView();
    }
    try {
      window.open(url, '_blank');
    } catch (e) {
      console.warn('Pop-up bloqueado por sandbox/navegador, alternando vista interna:', e);
    }
  };

  const handleCopyLink = async (url: string, type: 'client' | 'tech' | 'erp' = 'client') => {
    let copied = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch (e) {
      console.warn('Clipboard API no disponible, usando fallback:', e);
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copied = true;
      } catch (err) {
        console.error('Error al copiar enlace:', err);
      }
    }

    if (type === 'erp') {
      setCopiedErpLink(true);
      if (addToast) addToast(`¡Enlace ERP de ${targetCompany.nombreCorto} copiado al portapapeles!`, 'success');
      setTimeout(() => setCopiedErpLink(false), 2500);
    } else if (type === 'tech') {
      setCopiedTechLink(true);
      if (addToast) addToast(`¡Enlace del Portal Técnico de ${targetCompany.nombreCorto} copiado al portapapeles!`, 'success');
      setTimeout(() => setCopiedTechLink(false), 2500);
    } else {
      setCopiedLink(true);
      if (addToast) addToast(`¡Enlace del Cotizador Web de ${targetCompany.nombreCorto} copiado al portapapeles!`, 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`¡Hola! Cotiza el mantenimiento o modernización de tu ascensor en línea a través del Portal Web de ${targetCompany.nombreCorto}: ${appPublicUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Descargar Imagen PNG del Código QR
  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-svg-${targetCompany.id}`) as unknown as SVGSVGElement | null;
    if (!svg) {
      if (addToast) addToast('Generando código QR...', 'info');
      return;
    }
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || URL;
      const url = DOMURL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 300, 300);
          ctx.drawImage(img, 0, 0, 300, 300);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Cotizador_${targetCompany.nombreCorto.replace(/\s+/g, '_')}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          DOMURL.revokeObjectURL(url);
          if (addToast) addToast(`¡Código QR descargado para ${targetCompany.nombreCorto}!`, 'success');
        }
      };
      img.src = url;
    } catch (err) {
      console.error('Error al descargar el QR:', err);
      if (addToast) addToast('No se pudo descargar la imagen del QR', 'error');
    }
  };

  // Imprimir Cartel / Ficha Informativa con el QR de la Empresa
  const handlePrintFlyer = () => {
    const svg = document.getElementById(`qr-svg-${targetCompany.id}`) as unknown as SVGSVGElement | null;
    let qrSvgHtml = '';
    if (svg) {
      qrSvgHtml = new XMLSerializer().serializeToString(svg);
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      if (addToast) addToast('Permite las ventanas emergentes en tu navegador para imprimir el cartel QR.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cartel QR Cotizador - ${targetCompany.nombre}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #ffffff;
              color: #0f172a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .poster {
              border: 4px solid #0f172a;
              border-radius: 28px;
              padding: 45px 35px;
              max-width: 520px;
              width: 100%;
              text-align: center;
              box-sizing: border-box;
              background: #ffffff;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .brand-badge {
              background: #0f172a;
              color: #ffffff;
              font-size: 13px;
              font-weight: 800;
              padding: 8px 20px;
              border-radius: 9999px;
              display: inline-block;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 26px;
              font-weight: 900;
              margin: 0 0 8px 0;
              line-height: 1.2;
              color: #0284c7;
            }
            h2 {
              font-size: 15px;
              font-weight: 600;
              margin: 0 0 25px 0;
              color: #475569;
            }
            .qr-box {
              background: #f8fafc;
              border: 3px dashed #94a3b8;
              border-radius: 24px;
              padding: 25px;
              display: inline-block;
              margin: 10px 0 20px 0;
            }
            .qr-box svg {
              width: 250px;
              height: 250px;
              display: block;
              margin: 0 auto;
            }
            .callout {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 14px;
              letter-spacing: 0.5px;
            }
            .description {
              font-size: 13px;
              color: #334155;
              line-height: 1.5;
              margin: 15px 0 25px 0;
              padding: 0 10px;
            }
            .footer {
              border-top: 2px solid #e2e8f0;
              padding-top: 18px;
              font-size: 11px;
              color: #64748b;
              line-height: 1.6;
            }
            .footer strong {
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="poster">
            <div class="brand-badge">${targetCompany.nombreCorto}</div>
            <h1>${targetCompany.nombre}</h1>
            <h2>Portal Web de Cotizaciones e Inspección Técnica</h2>

            <div class="qr-box">
              ${qrSvgHtml || '<p>Código QR</p>'}
              <div class="callout">📱 ESCANEA CON LA CÁMARA DE TU CELULAR</div>
            </div>

            <p class="description">
              Solicita cotizaciones en línea para mantenimiento preventivo, modernización de cuadros de maniobra VVVF, repuestos o inspecciones técnicas de tu ascensor directamente sin instalar aplicaciones.
            </p>

            <div class="footer">
              <p><strong>Atención Directa:</strong> ${targetCompany.telefono} | ${targetCompany.email}</p>
              <p>${targetCompany.direccion}</p>
              <p style="font-size: 10px; margin-top: 8px; color: #94a3b8; text-transform: uppercase;">
                Documento de difusión pública generado desde el ERP Oficial ${targetCompany.nombreCorto}
              </p>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Estado de Sesiones en Vivo (Multi-Cliente Simultáneo)
  const [activePortalSessions, setActivePortalSessions] = useState<ActivePortalSession[]>([
    {
      sessionId: 'SES-8821',
      client: PRESET_CLIENTES_PORTAL[0],
      status: 'COTIZANDO',
      lastActivity: 'Hace 12 seg',
      ipLocation: 'Caracas (Chacao)',
      activeService: 'Modernización VVVF',
      ultimasCotizaciones: []
    },
    {
      sessionId: 'SES-8822',
      client: PRESET_CLIENTES_PORTAL[1],
      status: 'EXPLORANDO',
      lastActivity: 'Hace 45 seg',
      ipLocation: 'Caracas (El Recreo)',
      activeService: 'Mantenimiento 24/7',
      ultimasCotizaciones: []
    },
    {
      sessionId: 'SES-8823',
      client: PRESET_CLIENTES_PORTAL[2],
      status: 'SOLICITUD_ENVIADA',
      lastActivity: 'Hace 2 min',
      ipLocation: 'Caracas (Baruta)',
      activeService: 'Reparación de Emergencia',
      ultimasCotizaciones: ['PRE-2026-003']
    }
  ]);

  // Cliente Seleccionado Actualmente en el Portal
  const [selectedClientId, setSelectedClientId] = useState<string>(PRESET_CLIENTES_PORTAL[0].id);
  const [sessionToken, setSessionToken] = useState<string>('SES-8821');
  const [showLiveMonitor, setShowLiveMonitor] = useState<boolean>(true);

  // Estado para Pestaña Principal del Portal Web (1. Bienvenida & Reseña, 2. Cotizar & 24/7, 3. Galería)
  const [activePortalTab, setActivePortalTab] = useState<'BIENVENIDA' | 'COTIZAR_EMERGENCIA' | 'GALERIA'>('BIENVENIDA');

  // Estado para Galería de Proyectos y Referencias
  const [galleryFilter, setGalleryFilter] = useState<'TODAS' | 'CABINAS' | 'VVVF' | 'PANORAMICOS' | 'MONTACARGAS'>('TODAS');
  const [selectedProject, setSelectedProject] = useState<ProjectGalleryItem | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState<boolean>(false);

  const [projectGallery, setProjectGallery] = useState<ProjectGalleryItem[]>([
    {
      id: 'PROJ-01',
      titulo: 'Modernización de Cabina en Acero Satinado AISI 304',
      clienteEdificio: 'Residencias Altamira Park Palace',
      categoria: 'CABINAS',
      descripcion: 'Transformación integral de cabina antigua por acero inoxidable satinado 304, iluminación LED antideslumbrante, indicadores digitales TFT de 7" y botonera táctil antiviral.',
      ubicacion: 'Chacao, Caracas',
      fecha: 'Julio 2026',
      imagenUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      fotoAntesUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      caracteristicas: ['Acero Inoxidable Satinado 304', 'Luz LED Ecológica', 'Botonera Táctil TFT']
    },
    {
      id: 'PROJ-02',
      titulo: 'Instalación de Cuadro de Maniobra VVVF Monarch',
      clienteEdificio: 'Torre Empresarial La Castellana',
      categoria: 'VVVF',
      descripcion: 'Reemplazo de tablero electromecánico por cuadro microprocesado Monarch NICE3000+. Parada nivelada milimétrica y reducción del 42% en consumo eléctrico.',
      ubicacion: 'La Castellana, Caracas',
      fecha: 'Junio 2026',
      imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      caracteristicas: ['Nivelación Milimétrica', 'Silencioso < 45dB', 'Ahorro Eléctrico VVVF']
    },
    {
      id: 'PROJ-03',
      titulo: 'Ascensor Panorámico de Cristal de Alta Velocidad',
      clienteEdificio: 'Centro Comercial Sambil San Cristóbal',
      categoria: 'PANORAMICOS',
      descripcion: 'Suministro e instalación de ascensor panorámico de cristal templado de 12 mm con capacidad para 16 personas y velocidad de 2.0 m/s con variador Yaskawa.',
      ubicacion: 'San Cristóbal, Táchira',
      fecha: 'Mayo 2026',
      imagenUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      caracteristicas: ['Estructura Panorámica 360°', 'Operador Fermator Automático', 'Freno Paracaídas COVENIN']
    },
    {
      id: 'PROJ-04',
      titulo: 'Montacargas Industrial de 3.5 Toneladas',
      clienteEdificio: 'Laboratorios Farmacéuticos Behrens',
      categoria: 'MONTACARGAS',
      descripcion: 'Montacargas pesado con puertas de guillotina doble hoja, piso de chapa estriada antideslizante y tracción reforzada de alta resistencia.',
      ubicacion: 'Zona Industrial Valencia, Carabobo',
      fecha: 'Abril 2026',
      imagenUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      caracteristicas: ['Capacidad 3.500 Kg', 'Chapa Antideslizante', 'Fotocélula de Barrera Multi-Haz']
    }
  ]);

  const [newProjectForm, setNewProjectForm] = useState({
    titulo: '',
    clienteEdificio: '',
    categoria: 'CABINAS' as 'CABINAS' | 'VVVF' | 'PANORAMICOS' | 'MONTACARGAS' | 'MANTENIMIENTO',
    descripcion: '',
    ubicacion: 'Caracas, Venezuela',
    fecha: 'Agosto 2026',
    imagenUrl: '',
    caracteristicasStr: 'Garantía 3 Años, Repuestos Originales, Certificado COVENIN'
  });

  // Estado del Formulario de Cotización Pública
  const [formData, setFormData] = useState({
    nombreCliente: '',
    rifCedula: '',
    personaContacto: '',
    telefono: '',
    email: '',
    ciudad: '',
    apartamentoUbicacion: '',
    tipoServicio: 'MANTENIMIENTO',
    paradas: 10,
    capacidadPersonas: 8,
    detalles: ''
  });

  // Estado para Módulo de Emergencia 24/7
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyForm, setEmergencyForm] = useState({
    nombreEdificio: '',
    apartamentoTorre: '',
    tipoEmergencia: 'PERSONAS_ATRAPADAS',
    personaContacto: '',
    telefonoContacto: '',
    detalles: ''
  });

  // Lista de Servicios en Vivo con Tracking Estilo Pedido
  const [liveServices, setLiveServices] = useState<LiveServiceTrack[]>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('axon_live_services') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedTrackingId, setSelectedTrackingId] = useState<string>('');
  const [searchTermTracking, setSearchTermTracking] = useState<string>('');

  // Handler para Reportar Emergencia 24/7 y crear Ticket con Tracking en Vivo
  const handleSendEmergencyAlert = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emergencyForm.nombreEdificio || !emergencyForm.telefonoContacto) {
      if (addToast) addToast('Ingresa el nombre del edificio y teléfono de contacto para la auxilio.', 'warning');
      return;
    }

    const newTicketId = `EME-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEmergencyTrack: LiveServiceTrack = {
      id: newTicketId,
      clienteNombre: emergencyForm.nombreEdificio,
      apartamentoTorre: emergencyForm.apartamentoTorre || 'Cabina Principal / Planta Baja',
      tipoServicio: 'EMERGENCIA',
      fallaOAsunto: `🚨 REPORTE 24/7: ${emergencyForm.tipoEmergencia.replace(/_/g, ' ')} - ${emergencyForm.detalles}`,
      step: 1, // Solicitud Recibida
      tecnico: {
        nombre: 'Ing. Alejandro Ruiz (Guardia 24/7)',
        cargo: 'Comandante de Rescate y Soporte Inmediato',
        telefono: '+58 412 888-9900',
        vehiculo: 'Moto Intervención Rápida 24/7',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      },
      horaReporte: nowTime,
      etaLlegada: 'Calculando ruta más rápida (aprox 10-15 min)',
      ubicacionActual: 'Central de Operaciones 24/7 - Despacho activado',
      notasAdicionales: `Contacto de Emergencia: ${emergencyForm.personaContacto} (${emergencyForm.telefonoContacto}). Alerta emitida desde el Portal Web.`
    };

    setLiveServices(prev => [newEmergencyTrack, ...prev]);
    setSelectedTrackingId(newTicketId);
    setShowEmergencyModal(false);

    if (addToast) {
      addToast(`🚨 ¡ALERTA 24/7 REGISTRADA N° ${newTicketId}! Despachando cuadrilla de emergencia a ${emergencyForm.nombreEdificio}...`, 'error');
    }

    // Abrir mensaje prioritario de WhatsApp para el equipo de guardia
    const textMsg = encodeURIComponent(
      `🚨 *ALERTA URGENTE DE EMERGENCIA 24/7 - RESCATE TÉCNICO*\n` +
      `----------------------------------------\n` +
      `📍 *Edificio:* ${emergencyForm.nombreEdificio}\n` +
      `🏠 *Ubicación / Apto / Torre:* ${emergencyForm.apartamentoTorre}\n` +
      `⚠️ *Tipo de Falla:* ${emergencyForm.tipoEmergencia}\n` +
      `📞 *Contacto:* ${emergencyForm.personaContacto} (${emergencyForm.telefonoContacto})\n` +
      `📝 *Detalles:* ${emergencyForm.detalles}\n` +
      `🆔 *Ticket de Tracking:* ${newTicketId}\n` +
      `----------------------------------------\n` +
      `⚡ *Solicitud generada desde el Portal Web ${activeComp.nombreCorto}*`
    );

    try {
      window.open(`https://api.whatsapp.com/send?text=${textMsg}`, '_blank');
    } catch (err) {
      console.warn('Sandbox popup blocked WhatsApp link:', err);
    }
  };

  // Handler para Agregar Nuevo Proyecto / Foto de Referencia a la Galería
  const handleAddNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.titulo || !newProjectForm.clienteEdificio) {
      if (addToast) addToast('Ingresa el título del proyecto y cliente/edificio.', 'warning');
      return;
    }

    const defaultImg = newProjectForm.imagenUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80';
    const featuresList = newProjectForm.caracteristicasStr.split(',').map(s => s.trim()).filter(Boolean);

    const newItem: ProjectGalleryItem = {
      id: `PROJ-0${projectGallery.length + 1}`,
      titulo: newProjectForm.titulo,
      clienteEdificio: newProjectForm.clienteEdificio,
      categoria: newProjectForm.categoria,
      descripcion: newProjectForm.descripcion || 'Obra ejecutada bajo estrictas especificaciones técnicas y normas Covenin.',
      ubicacion: newProjectForm.ubicacion,
      fecha: newProjectForm.fecha,
      imagenUrl: defaultImg,
      caracteristicas: featuresList.length > 0 ? featuresList : ['Instalación Certificada', 'Garantía del Grupo', 'Atención 24/7']
    };

    setProjectGallery(prev => [newItem, ...prev]);
    setShowAddProjectModal(false);
    setNewProjectForm({
      titulo: '',
      clienteEdificio: '',
      categoria: 'CABINAS',
      descripcion: '',
      ubicacion: 'Caracas, Venezuela',
      fecha: 'Agosto 2026',
      imagenUrl: '',
      caracteristicasStr: 'Garantía 3 Años, Repuestos Originales, Certificado COVENIN'
    });

    if (addToast) {
      addToast(`🎉 ¡Proyecto "${newItem.titulo}" publicado en la Galería del Portal Web!`, 'success');
    }
  };

  // Simulación Interactiva: Avanzar / Retroceder Paso de Tracking en Vivo
  const handleSimulateNextStep = (trackId: string) => {
    setLiveServices(prev => prev.map(srv => {
      if (srv.id === trackId) {
        const nextStep = Math.min(5, srv.step + 1) as 1 | 2 | 3 | 4 | 5;
        let newEta = srv.etaLlegada;
        let newUbicacion = srv.ubicacionActual;

        if (nextStep === 2) {
          newEta = 'En camino en 5 min';
          newUbicacion = 'Sede Central - Asignado a Técnico';
        } else if (nextStep === 3) {
          newEta = '8 minutos';
          newUbicacion = 'En ruta por la Avenida Principal hacia el Edificio';
        } else if (nextStep === 4) {
          newEta = 'Llegó al sitio';
          newUbicacion = 'En Sala de Máquinas y Foso de Ascensor (En Sitio)';
        } else if (nextStep === 5) {
          newEta = 'Servicio Culminado';
          newUbicacion = 'Trabajo Finalizado con Acta de Conformidad Digital';
        }

        if (addToast) {
          addToast(`🔄 Estatus de Servicio ${trackId} actualizado a Paso ${nextStep}/5`, 'info');
        }

        return {
          ...srv,
          step: nextStep,
          etaLlegada: newEta,
          ubicacionActual: newUbicacion
        };
      }
      return srv;
    }));
  };

  const handleSimulatePrevStep = (trackId: string) => {
    setLiveServices(prev => prev.map(srv => {
      if (srv.id === trackId) {
        const prevStep = Math.max(1, srv.step - 1) as 1 | 2 | 3 | 4 | 5;
        return {
          ...srv,
          step: prevStep
        };
      }
      return srv;
    }));
  };

  // Efecto para auto-completar datos al seleccionar un preset de cliente
  useEffect(() => {
    const preset = PRESET_CLIENTES_PORTAL.find(c => c.id === selectedClientId);
    if (preset) {
      setFormData({
        nombreCliente: preset.nombreCliente,
        rifCedula: preset.rifCedula,
        personaContacto: preset.personaContacto,
        telefono: preset.telefono,
        email: preset.email,
        ciudad: preset.ciudad,
        apartamentoUbicacion: 'Apto. 4-A / Torre B',
        tipoServicio: preset.tipoServicioDefault,
        paradas: preset.paradasDefault,
        capacidadPersonas: 8,
        detalles: ''
      });
      setSearchTermBuilding(preset.nombreCliente);
      // Buscar token de sesión existente o asignar uno nuevo
      const existingSession = activePortalSessions.find(s => s.client.id === preset.id);
      if (existingSession) {
        setSessionToken(existingSession.sessionId);
      } else {
        const newTok = `SES-${Math.floor(1000 + Math.random() * 9000)}`;
        setSessionToken(newTok);
      }
    }
  }, [selectedClientId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cotizacionEnviada, setCotizacionEnviada] = useState<{ correlativo: string; clienteNombre: string; sesionToken: string } | null>(null);

  const handleSubmitCotizacion = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreCliente || !formData.telefono) {
      addToast('Por favor completa al menos el Nombre/Empresa y Teléfono de contacto.', 'warning');
      return;
    }

    setIsSubmitting(true);

    setTimeout(async () => {
      // 1. Insertar en Buffer_Cotizaciones en Supabase (PostgreSQL) si está configurado
      const idSolicitud = `COT-WEB-${Date.now().toString().slice(-6)}`;
      if (isSupabaseConfigured()) {
        try {
          await insertBufferCotizacion({
            id_solicitud: idSolicitud,
            fecha_hora: new Date().toISOString(),
            cliente_nombre: formData.nombreCliente,
            cliente_rif: formData.rifCedula || 'J-00000000-0',
            telefono: formData.telefono,
            email: formData.email || '',
            edificio_ubicacion: formData.ciudad || formData.apartamentoUbicacion || 'Ubicación no especificada',
            cantidad_ascensores: Number(formData.paradas) || 1,
            tipo_servicio_solicitado: formData.tipoServicio,
            detalles_requerimiento: formData.detalles || 'Solicitud generada desde el Cotizador Web'
          });
        } catch (err) {
          console.warn('Error al insertar en Buffer_Cotizaciones:', err);
        }
      }

      // 2. Registrar solicitud en el Gestor Central (Bandeja Gestor)
      const nuevaSolicitud = crearSolicitudCliente({
        clienteNombre: formData.nombreCliente,
        clienteRif: formData.rifCedula || 'J-00000000-0',
        personaContacto: formData.personaContacto || formData.nombreCliente,
        telefono: formData.telefono,
        email: formData.email || '',
        edificioUbicacion: formData.ciudad || formData.apartamentoUbicacion || 'Ubicación no especificada',
        apartamentoTorre: formData.apartamentoUbicacion || 'Principal',
        tipoServicio: formData.tipoServicio as any,
        paradas: Number(formData.paradas) || 1,
        capacidadPersonas: Number(formData.capacidadPersonas) || 6,
        detalles: formData.detalles || 'Solicitud generada desde el Cotizador Web'
      });

      // Opcional: También registrar en Presupuestos como Borrador para conveniencia
      const nuevoPresupuesto = crearPresupuesto({
        fecha: new Date().toISOString().split('T')[0],
        fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clienteId: selectedClientId || 'SOLICITUD-WEB',
        clienteNombre: formData.nombreCliente,
        clienteRif: formData.rifCedula || 'J-00000000-0',
        clienteTelefono: formData.telefono,
        proyectoAscensor: `[SOLICITUD WEB - ${nuevaSolicitud.correlativo}] ${formData.tipoServicio} - ${formData.paradas} Paradas - ${formData.ciudad || 'N/A'}`,
        items: [
          {
            id: `item-web-${Date.now()}`,
            descripcion: `Solicitud de ${formData.tipoServicio} para ${formData.paradas} paradas / pisos (Ref ${nuevaSolicitud.correlativo}). ${formData.detalles}`,
            cantidad: 1,
            precioUnitarioUSD: 0,
            esExento: true
          }
        ],
        subtotalUSD: 0,
        ivaUSD: 0,
        totalUSD: 0,
        estado: 'BORRADOR',
        notasValidez: `Solicitud de servicio ingresada desde el Portal Web por ${formData.nombreCliente} (RIF: ${formData.rifCedula}). Recibida en la Bandeja del Gestor y Buffer_Cotizaciones.`,
        division: activeDivision || (formData.tipoServicio === 'MODERNIZACION' ? 'MODERNIZACION' : 'MANTENIMIENTO')
      });

      // Actualizar sesión activa en el monitor de sesiones
      setActivePortalSessions(prev => prev.map(s => {
        if (s.client.id === selectedClientId || s.client.nombreCliente === formData.nombreCliente) {
          return {
            ...s,
            status: 'SOLICITUD_ENVIADA',
            lastActivity: 'Hace unos instantes',
            ultimasCotizaciones: [...s.ultimasCotizaciones, nuevaSolicitud.correlativo]
          };
        }
        return s;
      }));

      setIsSubmitting(false);
      setCotizacionEnviada({
        correlativo: nuevaSolicitud.correlativo,
        clienteNombre: formData.nombreCliente,
        sesionToken: sessionToken
      });

      if (addToast) addToast(`✅ ¡Solicitud ${nuevaSolicitud.correlativo} registrada en Buffer_Cotizaciones de Supabase y en la Bandeja del Gestor!`, 'success');
    }, 500);
  };

  // Simulación Interactiva: Enviar 3 Solicitudes de 3 Clientes Distintos Simultáneamente
  const handleSimulateSimultaneousSubmissions = () => {
    if (addToast) addToast('⚡ Simulando la entrada en vivo de 3 clientes independientes...', 'info');

    const clientesSimulados = [
      {
        preset: PRESET_CLIENTES_PORTAL[0],
        servicio: 'MODERNIZACION',
        paradas: 14,
        monto: 8400,
        tok: 'SES-8821'
      },
      {
        preset: PRESET_CLIENTES_PORTAL[1],
        servicio: 'MANTENIMIENTO',
        paradas: 22,
        monto: 480,
        tok: 'SES-8822'
      },
      {
        preset: PRESET_CLIENTES_PORTAL[2],
        servicio: 'EMERGENCIA',
        paradas: 8,
        monto: 280,
        tok: 'SES-8823'
      }
    ];

    clientesSimulados.forEach((sim, idx) => {
      setTimeout(() => {
        const pres = crearPresupuesto({
          fecha: new Date().toISOString().split('T')[0],
          fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          clienteId: sim.preset.id,
          clienteNombre: sim.preset.nombreCliente,
          clienteRif: sim.preset.rifCedula,
          clienteTelefono: sim.preset.telefono,
          proyectoAscensor: `[PORTAL WEB SIMULTÁNEO - ${sim.tok}] ${sim.servicio} (${sim.paradas} Niveles)`,
          items: [
            {
              id: `item-sim-${idx}`,
              descripcion: `Solicitud de ${sim.servicio} en línea por ${sim.preset.nombreCliente} (${sim.preset.personaContacto}).`,
              cantidad: 1,
              precioUnitarioUSD: sim.monto,
              esExento: true
            }
          ],
          subtotalUSD: sim.monto,
          ivaUSD: 0,
          totalUSD: sim.monto,
          estado: 'BORRADOR',
          notasValidez: `Solicitud simultánea identificada correctamente para ${sim.preset.nombreCliente} (RIF: ${sim.preset.rifCedula}). Sesión: ${sim.tok}.`,
          division: activeDivision || (sim.servicio === 'MODERNIZACION' ? 'MODERNIZACION' : 'MANTENIMIENTO')
        });

        if (addToast) {
          addToast(`📥 [ERP Gestor] Solicitud recibida de ${sim.preset.nombreCliente} -> Cotización ${pres.correlativo} ($${sim.monto} USD)`, 'success');
        }

        setActivePortalSessions(prev => prev.map(s => {
          if (s.sessionId === sim.tok) {
            return {
              ...s,
              status: 'SOLICITUD_ENVIADA',
              lastActivity: 'Enviado ahora',
              ultimasCotizaciones: [pres.correlativo]
            };
          }
          return s;
        }));
      }, (idx + 1) * 600);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">

      {/* BANNER SUPERIOR DE ADMINISTRACIÓN (SOLO VISIBLE DENTRO DEL ERP) */}
      {!isPublicView && user && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
              <CompanyLogo empresa={activeComp} size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/40">
                  SITIO WEB OFICIAL ENLAZADO AL ERP
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">
                Portal Web {activeComp.nombreCorto}
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Los clientes pueden cotizar en línea y sus solicitudes ingresan directamente al módulo de Presupuestos de tu ERP.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleOpenPortalLink(appPublicUrl)}
              className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold font-mono transition flex flex-row items-center justify-center gap-2 cursor-pointer shadow-md"
              title="Probar y abrir la vista pública del portal"
            >
              <ExternalLink size={15} />
              <span>Probar Portal Público</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono transition flex flex-row items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <QrCode size={15} />
              <span>Compartir Enlace & QR</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('PRESUPUESTOS')}
                className="w-full md:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold font-mono transition flex flex-row items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FileText size={15} />
                <span>Ver Solicitudes en el ERP</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MONITOREO EN VIVO DEL GESTOR: CLIENTES CONECTADOS AL PORTAL DE FORMA SIMULTÁNEA */}
      {!isPublicView && user && (
        <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <Radio size={18} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Clientes Conectados en Vivo al Portal Web
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    3 Sesiones Activas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  El gestor reconoce a cada cliente en tiempo real. Aunque ingresen varios clientes a la vez, el sistema aísla sus datos.
                </p>
              </div>
            </div>

            <button
              onClick={handleSimulateSimultaneousSubmissions}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
            >
              <Activity size={15} />
              <span>Simular Envíos Simultáneos (3 Clientes)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activePortalSessions.map((session) => {
              const isSelected = selectedClientId === session.client.id;
              return (
                <div 
                  key={session.sessionId}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                          {session.sessionId}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded border border-slate-700 truncate">
                          {session.ipLocation}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-1">
                        {session.client.nombreCliente}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        RIF: {session.client.rifCedula}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedClientId(session.client.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 transition border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? 'Ver Portal' : 'Probar Cliente'}
                    </button>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Servicio:</span>
                      <span className="text-cyan-300 font-semibold">{session.activeService}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Estado:</span>
                      <span className={`font-bold ${
                        session.status === 'SOLICITUD_ENVIADA' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {session.status === 'SOLICITUD_ENVIADA' ? '✓ Cotización Enviada' : '⏳ En Vivo'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[9px]">
                      <span>Dispositivo:</span>
                      <span className="truncate max-w-[130px]">{session.client.dispositivo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE INSTRUCCIONES DE PUBLICACIÓN Y ENLACE PARA CLIENTES */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative animate-fadeIn my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={22} />
            </button>

            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                <Share2 size={26} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Portal Web & Enlaces de Cotización
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Enlace público y código QR directo para que los clientes coticen en línea para <strong className="text-amber-300">{targetCompany.nombreCorto}</strong>
                </p>
              </div>
            </div>

            {/* SELECCIÓN DE EMPRESA */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
              <label className="text-[11px] text-amber-400 font-mono uppercase font-bold flex items-center justify-between">
                <span>🏢 Selecciona Empresa para Generar Enlace & QR Exclusivo:</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-extrabold">{targetCompany.nombreCorto}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(empresasDisponibles || []).map((emp) => {
                  const isSelected = targetCompany.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedShareCompanyId(emp.id);
                        setEmpresaActivaId(emp.id as any);
                      }}
                      className={`p-3 rounded-xl border text-left transition text-xs font-mono flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 font-semibold'
                      }`}
                    >
                      <span className="text-xs font-bold text-white truncate">{emp.nombreCorto}</span>
                      <span className="text-[10px] opacity-70 font-normal">?cotizar&empresa={emp.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRID DE 2 COLUMNAS: IZQUIERDA ENLACES / DERECHA CÓDIGO QR Y PUBLICACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: ENLACES Y ACCIONES */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* ENLACE PARA CLIENTES */}
                <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-400 font-mono uppercase font-extrabold flex items-center gap-1.5">
                      <Globe size={14} className="text-amber-400" />
                      <span>Enlace 1: Portal Clientes (Cotizador Web)</span>
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      Solo Cotizaciones
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    El cliente verá <strong>exclusivamente el portal de cotización</strong> sin acceso al portal de técnicos.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={appPublicUrl}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => handleCopyLink(appPublicUrl, 'client')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-mono shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* ENLACE PARA TÉCNICOS EN OBRA */}
                <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-300 font-mono uppercase font-bold flex items-center gap-1.5">
                      <Wrench size={14} className="text-amber-300" />
                      <span>Enlace 2: Portal Técnico en Obra (Sin Precios)</span>
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded font-bold border border-amber-500/30">
                      Solo Inspección
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    El técnico verá <strong>exclusivamente el formulario de inspección</strong> sin acceso a cotizaciones ni precios.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={techPublicUrl}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={() => handleCopyLink(techPublicUrl, 'tech')}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-mono shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {copiedTechLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedTechLink ? '¡Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTechQrModal(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold font-mono shrink-0 transition flex items-center gap-1.5 cursor-pointer"
                      title="Ver e Imprimir Cartel de Código QR para Obra"
                    >
                      <QrCode size={14} />
                      <span>📱 QR</span>
                    </button>
                  </div>
                </div>

                {/* ENLACE PARA PERSONAL ERP */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-mono uppercase font-bold flex items-center gap-1.5">
                      <Lock size={14} className="text-cyan-400" />
                      <span>Enlace 3: Acceso Gestor ERP (Login Interno)</span>
                    </span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                      Requiere Clave
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={erpLoginUrl}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(erpLoginUrl, 'erp')}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold font-mono shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {copiedErpLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedErpLink ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* BOTONES DE COMPARTIR Y ABRIR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <MessageSquare size={16} />
                    <span>Enviar por WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPortalLink(appPublicUrl)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer border border-cyan-500/30 text-center shadow-md"
                  >
                    <ExternalLink size={16} />
                    <span>Abrir Portal de Cotizaciones</span>
                  </button>
                </div>

              </div>

              {/* COLUMNA DERECHA: CÓDIGO QR Y CARTEL */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-950 border border-amber-500/40 p-5 rounded-2xl space-y-4 flex flex-col items-center text-center shadow-xl">
                  <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] text-amber-400 font-mono uppercase font-extrabold flex items-center gap-1.5">
                      <QrCode size={15} className="text-amber-400" />
                      <span>Código QR Exclusivo</span>
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                      HD Scan
                    </span>
                  </div>

                  {/* QR SVG para visualización y descarga */}
                  <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/60 inline-block">
                    <QRCodeSVG
                      id={`qr-svg-${targetCompany.id}`}
                      value={appPublicUrl}
                      size={150}
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="space-y-1.5 max-w-xs">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                      <Smartphone size={15} className="text-amber-400" />
                      <span>Escaneo directo con Cámara Móvil</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Lleva a tus clientes al portal de cotización de <strong className="text-amber-300">{targetCompany.nombreCorto}</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download size={14} />
                      <span>Descargar PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintFlyer}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs font-mono rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Imprimir Cartel</span>
                    </button>
                  </div>
                </div>

                {/* NOTA GUÍA RÁPIDA */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300 font-sans">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-xs">
                    <Sparkles size={14} />
                    <span>Publicación Pública en AI Studio:</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Usa el botón <strong>"Share" (Compartir)</strong> de arriba en la barra superior de AI Studio y asegúrate de seleccionar <em>"Anyone with link can access"</em>.
                  </p>
                </div>

              </div>

            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs font-mono transition cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECCIÓN DE PORTAL: SOLO VISIBLE PARA EL GESTOR ERP DENTRO DEL SISTEMA */}
      {!isPublicView && (
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPortalMode('CLIENTES')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'CLIENTES'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 font-bold'
              }`}
            >
              <Building2 size={16} />
              <span>🏢 PREVISUALIZAR PORTAL CLIENTES</span>
            </button>

            <button
              type="button"
              onClick={() => setPortalMode('TECNICOS')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'TECNICOS'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 font-bold'
              }`}
            >
              <Wrench size={16} />
              <span>🛠️ PREVISUALIZAR PORTAL TÉCNICOS OBRA</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 hidden md:block">
            {portalMode === 'CLIENTES' ? '🌐 Vista previa del Cotizador Público' : '🪪 Vista previa del Levantamiento Técnico'}
          </div>
        </div>
      )}

      {effectivePortalMode === 'TECNICOS' ? (
        <PortalTecnicosObra />
      ) : (
        <>
          {/* BARRA DE NAVEGACIÓN EN 3 PESTAÑAS PRINCIPALES DEL PORTAL WEB */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-xl sticky top-4 z-40 backdrop-blur-md bg-slate-900/95">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          
          {/* PESTAÑA 1: BIENVENIDA Y RESEÑA HISTÓRICA */}
          <button
            type="button"
            onClick={() => setActivePortalTab('BIENVENIDA')}
            className={`px-4 py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'BIENVENIDA'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Building2 size={16} />
            <span>1. Bienvenida & Reseña Histórica</span>
          </button>

          {/* PESTAÑA 2: COTIZAR Y EMERGENCIA 24/7 */}
          <button
            type="button"
            onClick={() => setActivePortalTab('COTIZAR_EMERGENCIA')}
            className={`px-4 py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer relative ${
              activePortalTab === 'COTIZAR_EMERGENCIA'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Siren size={16} className="text-red-400 animate-pulse" />
            <span>2. Cotizar & Emergencia 24/7</span>
          </button>

          {/* PESTAÑA 3: GALERÍA DE PROYECTOS Y REFERENCIAS */}
          <button
            type="button"
            onClick={() => setActivePortalTab('GALERIA')}
            className={`px-4 py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'GALERIA'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <ImageIcon size={16} />
            <span>3. Galería de Proyectos</span>
          </button>

        </div>
      </div>

      {/* BARRA DE COMPROBACIÓN DE ENLACE ACTIVO CON EL GESTOR CENTRAL */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border transition-all ${
              linkTestResult?.success 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                : isTestingLink 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-cyan-400'
            }`}>
              <Radio size={20} className={isTestingLink ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">
                  Enlace de Comunicación en Vivo:
                </span>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                  linkTestResult?.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : isTestingLink 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {isTestingLink 
                    ? 'COMPROBANDO...' 
                    : linkTestResult?.success 
                      ? `EN LÍNEA (${linkTestResult.latencyMs}ms)` 
                      : 'ENLACE ACTIVO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                {linkTestResult 
                  ? linkTestResult.message 
                  : `Comprueba que las solicitudes y alertas se conectan automáticamente con la Central de ${targetCompany.nombreCorto}.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isTestingLink}
            onClick={handleTestConnection}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 border shadow-md ${
              isTestingLink
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/30 shadow-cyan-500/20 active:scale-98'
            }`}
          >
            <Radio size={15} className={isTestingLink ? 'animate-spin' : ''} />
            <span>{isTestingLink ? 'Comprobando...' : 'Probar Enlace en Vivo'}</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PESTAÑA 1: BIENVENIDA & RESEÑA HISTÓRICA DE LA EMPRESA */}
      {activePortalTab === 'BIENVENIDA' && (
        <div className="space-y-8 animate-fadeIn">
          {/* HERO SECTION DE LA PÁGINA WEB */}
          <section className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-mono font-bold">
                <Sparkles size={14} />
                <span>Sistemas Integrales de Elevación & Montacargas</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Ingeniería de Vanguardia en <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">Ascensores & Transporte Vertical</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                Bienvenido a <strong>{activeComp.nombre}</strong>. Nos especializamos en el diseño, instalación, modernización y mantenimiento preventivo de ascensores residenciales, comerciales e industriales con tecnología microprocesada VVVF y cumplimiento estricto de normas de seguridad COVENIN / ISO.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="text-amber-400 shrink-0" size={18} />
                  <span>Normas COVENIN 621</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
                  <Zap className="text-amber-400 shrink-0" size={18} />
                  <span>Ahorro Eléctrico VVVF (-40%)</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
                  <Clock className="text-amber-400 shrink-0" size={18} />
                  <span>Guardia 24/7 en Venezuela</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
                  <Award className="text-amber-400 shrink-0" size={18} />
                  <span>Garantía de Repuestos ERP</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button 
                  type="button"
                  onClick={() => setActivePortalTab('COTIZAR_EMERGENCIA')}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Calculator size={18} />
                  <span>Cotizar Proyecto o Emergencia 24/7</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setActivePortalTab('GALERIA')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon size={18} className="text-amber-400" />
                  <span>Ver Galería de Proyectos</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECCIÓN DE RESEÑA HISTÓRICA DE LA EMPRESA CON LÍNEA DE TIEMPO INTERACTIVA */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                <History size={16} />
                <span>Nuestra Trayectoria & Origen</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Reseña Histórica de {activeComp.nombreCorto}
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Más de dos décadas impulsando el desarrollo del transporte vertical con ingeniería confiable y respaldo técnico ininterrumpido.
              </p>
            </div>

            {/* LÍNEA DE TIEMPO DE HISTORIA */}
            <div className="relative border-l-2 border-amber-500/30 ml-4 sm:ml-8 space-y-8 pl-6 sm:pl-8">
              
              {/* HITOS 1: 1998 */}
              <div className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-950 shadow-md group-hover:scale-125 transition" />
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-amber-500/50 transition">
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Año 1998 — Fundación e Inicios
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Nacimiento de la Empresa y Cobertura Residencial
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Fundada por un equipo especializado de ingenieros electromecánicos con el objetivo de brindar mantenimiento preventivo confiable a condominios de la Gran Caracas y zona central.
                  </p>
                </div>
              </div>

              {/* HITOS 2: 2008 */}
              <div className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-950 shadow-md group-hover:scale-125 transition" />
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-amber-500/50 transition">
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Año 2008 — Transformación VVVF & Frecuencia Variable
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Pioneros en Modernización Electrónica Microprocesada
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Adoptamos la integración de cuadros de mando Monarch y variadores Yaskawa VVVF, sustituyendo tableros electromecánicos antiguos de reles por sistemas digitales de ahorro energético.
                  </p>
                </div>
              </div>

              {/* HITOS 3: 2016 */}
              <div className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-950 shadow-md group-hover:scale-125 transition" />
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-amber-500/50 transition">
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    Año 2016 — Guardia de Auxilio 24 Hours & Unidades Móviles
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Consolidación de la Red de Respuesta Rápida 24/7
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Creación de la división de respuesta inmediata para personas atrapadas con patrullaje móvil y tiempo récord de llegada en emergencias urbanas.
                  </p>
                </div>
              </div>

              {/* HITOS 4: 2024 - 2026 */}
              <div className="relative group">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-emerald-400 border-4 border-slate-950 shadow-md group-hover:scale-125 transition" />
                <div className="bg-slate-950 border border-emerald-500/40 p-5 rounded-2xl space-y-2 hover:border-emerald-400 transition">
                  <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    2024 - 2026 — Digitalización ERP & Portal Web Transparente
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Integración con ERP Enterprise & Trazabilidad para Condominios
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Implementación del Portal Web para clientes con tracking de técnico en tiempo real, fosa digital e historias técnicas bajo norma COVENIN 621.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* MISIÓN, VISIÓN Y VALORES CORPORATIVOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold border border-amber-500/30">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Nuestra Misión</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Garantizar la movilidad vertical de miles de usuarios diarios con máxima seguridad operativa, confort de marcha y respuesta técnica expedita en cada intervención.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center font-bold border border-cyan-500/30">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Nuestra Visión</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ser la corporación de ingeniería de transporte vertical de referencia nacional, destacando por la innovación técnica, transparencia presupuestaria y repuestos originales.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/30">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Nuestros Valores</h3>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li className="flex items-center gap-1.5">• <strong>Seguridad Primero:</strong> Cero tolerancia al riesgo</li>
                <li className="flex items-center gap-1.5">• <strong>Transparencia:</strong> Presupuestos sin sorpresas</li>
                <li className="flex items-center gap-1.5">• <strong>Disponibilidad:</strong> Atención de guardia 24/7</li>
              </ul>
            </div>
          </div>

          {/* INDICADORES DE TRAYECTORIA Y CONFIANZA */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">+25</span>
              <span className="text-xs font-mono text-slate-400 block font-bold">Años de Trayectoria</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">+1,200</span>
              <span className="text-xs font-mono text-slate-400 block font-bold">Ascensores en Mantenimiento</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">+18,000</span>
              <span className="text-xs font-mono text-slate-400 block font-bold">Asistencias 24/7 Exitosas</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">99.8%</span>
              <span className="text-xs font-mono text-slate-400 block font-bold">Disponibilidad Operativa</span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: COTIZAR & EMERGENCIA 24/7 */}
      {activePortalTab === 'COTIZAR_EMERGENCIA' && (
        <div className="space-y-8 animate-fadeIn">
          {/* BANNER PRINCIPAL DE EMERGENCIA Y RESCATE 24/7 CON ACCESO RÁPIDO */}
          <div className="bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 border-2 border-red-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/40 shrink-0 animate-pulse">
                  <Siren size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                      🚨 GUARDIA TÉCNICA 24 HORAS
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-bold hidden sm:inline">
                      Rescate Técnico e Intervención de Emergencia
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    Módulo de Emergencias 24/7 & Personas Atrapadas
                  </h3>
                  <p className="text-xs text-slate-300 font-sans">
                    Emita un reporte de auxilio inmediato o rastree en vivo la llegada de su técnico asignado.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer border border-red-400/30"
                >
                  <Siren size={18} className="animate-spin" />
                  <span>Reportar Emergencia 24/7</span>
                </button>

                <a
                  href="#tracking-servicio"
                  className="w-full md:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black rounded-2xl text-xs font-mono uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Truck size={18} />
                  <span>Ver Tracking en Vivo</span>
                </a>
              </div>
            </div>
          </div>

      {/* HERO SECTION DE LA PÁGINA WEB */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 p-8 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-mono font-bold">
            <Sparkles size={14} />
            <span>Sistemas Integrales de Elevación & Montacargas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Ingeniería de Vanguadia en <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">Ascensores & Transporte Vertical</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            En <strong>{activeComp.nombre}</strong> diseñamos, instalamos, modernizamos y mantenemos sistemas de elevación residenciales, comerciales e industriales con tecnología microprocesada VVVF, máxima seguridad operativa y repuestos originales.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
              <ShieldCheck className="text-amber-400 shrink-0" size={18} />
              <span>Norma de Seguridad Covenin / ISO</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
              <Zap className="text-amber-400 shrink-0" size={18} />
              <span>Ahorro Energético VVVF (-40%)</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
              <Clock className="text-amber-400 shrink-0" size={18} />
              <span>Atención 24/7 en Venezuela</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2">
              <Award className="text-amber-400 shrink-0" size={18} />
              <span>Garantía de Repuestos ERP</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <a 
              href="#cotizador-web"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Calculator size={18} />
              <span>Cotizar Proyecto en Línea</span>
            </a>
            <a 
              href="#servicios"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
            >
              <span>Explorar Catálogo de Servicios</span>
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE TRACKING DE TÉCNICO Y SERVICIO EN TIEMPO REAL ("ESTILO PEDIDO / DELIVERY TRACKER") */}
      <section id="tracking-servicio" className="bg-slate-900/95 border border-amber-500/40 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Truck size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Tracking de Técnico & Servicio en Tiempo Real
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Estatus "Estilo Pedido"
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Seguimiento etapa por etapa del técnico en ruta, ETA de llegada y estatus de reparación para condominios.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Ticket Activo:</span>
            <select
              value={selectedTrackingId}
              onChange={(e) => setSelectedTrackingId(e.target.value)}
              className="bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none"
            >
              {liveServices.map(srv => (
                <option key={srv.id} value={srv.id}>
                  {srv.id} — {srv.clienteNombre} ({srv.apartamentoTorre})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTENIDO DEL TRACKING DEL SERVICIO SELECCIONADO */}
        {(() => {
          const currentTrack = liveServices.find(s => s.id === selectedTrackingId) || liveServices[0];
          if (!currentTrack) return null;

          // Etapas del Tracking
          const trackingSteps = [
            { stepNum: 1, label: 'Solicitud Recibida', desc: 'Registrada en ERP', icon: FileText },
            { stepNum: 2, label: 'Técnico Asignado', desc: 'Asignado a Cuadrilla', icon: User },
            { stepNum: 3, label: 'Técnico en Camino', desc: 'Unidad Móvil en Ruta', icon: Truck },
            { stepNum: 4, label: 'En Sitio / Trabajos', desc: 'Intervención de Foso/Sala', icon: Wrench },
            { stepNum: 5, label: 'Servicio Concluido', desc: 'Firma & Evidencias', icon: CheckCircle2 }
          ];

          return (
            <div className="space-y-6">

              {/* FICHAS Y DETALLES PRINCIPALES DEL TICKET */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 font-mono text-xs font-black px-2.5 py-0.5 rounded border border-amber-500/30">
                      {currentTrack.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      🕒 Hora de Reporte: {currentTrack.horaReporte}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      {currentTrack.tipoServicio}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {currentTrack.clienteNombre} <span className="text-amber-300 font-mono">({currentTrack.apartamentoTorre})</span>
                  </h3>

                  <p className="text-xs text-slate-300 font-sans">
                    {currentTrack.fallaOAsunto}
                  </p>
                </div>

                {/* RELOJ / ESTIMADO LLEGADA */}
                <div className="bg-slate-900 border border-amber-500/30 p-3.5 rounded-xl text-right shrink-0 w-full md:w-auto">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                    ⏱️ Estimado / Estatus de Ruta
                  </span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {currentTrack.etaLlegada}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    📍 {currentTrack.ubicacionActual}
                  </span>
                </div>
              </div>

              {/* LÍNEA DE TIEMPO INTERACTIVA "ESTILO PEDIDO / DELIVERY TRACKER" */}
              <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Navigation size={14} className="text-amber-400" />
                    <span>Línea de Tiempo de Atención Técnica (5 Etapas)</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    Estatus Actual: Paso {currentTrack.step} de 5
                  </span>
                </div>

                {/* BARRA DE PROGRESO CON NODOS */}
                <div className="relative pt-2 pb-4">
                  {/* BARRA DE FONDO */}
                  <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-800 -translate-y-1/2 rounded-full z-0" />
                  {/* BARRA DE PROGRESO LLENA */}
                  <div 
                    className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-amber-500 to-emerald-400 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${((currentTrack.step - 1) / 4) * 100}%` }}
                  />

                  {/* PASOS / NODOS */}
                  <div className="relative z-10 grid grid-cols-5 gap-1 text-center">
                    {trackingSteps.map((st) => {
                      const isPassed = currentTrack.step > st.stepNum;
                      const isCurrent = currentTrack.step === st.stepNum;
                      const IconComp = st.icon;

                      return (
                        <div key={st.stepNum} className="flex flex-col items-center space-y-2">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-110 shadow-lg shadow-amber-500/20 font-black'
                                : isPassed
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-900 border-2 border-slate-800 text-slate-500'
                            }`}
                          >
                            {isPassed ? <Check size={18} /> : <IconComp size={18} />}
                          </div>

                          <div className="space-y-0.5 max-w-[100px]">
                            <span className={`text-[11px] font-mono font-bold block leading-tight ${
                              isCurrent ? 'text-amber-300' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              {st.label}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono hidden sm:block">
                              {st.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TARJETA DEL TÉCNICO ASIGNADO EN CAMINO */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* FOTO Y DATOS DEL TÉCNICO */}
                  <div className="md:col-span-7 flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={currentTrack.tecnico.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={currentTrack.tecnico.nombre}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                        👷 Técnico Asignado
                      </span>
                      <h4 className="text-sm font-black text-white">
                        {currentTrack.tecnico.nombre}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {currentTrack.tecnico.cargo}
                      </p>
                      <p className="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                        <Truck size={12} />
                        <span>{currentTrack.tecnico.vehiculo}</span>
                      </p>
                    </div>
                  </div>

                  {/* ACCIONES DIRECTAS CON EL TÉCNICO */}
                  <div className="md:col-span-5 flex flex-col sm:flex-row gap-2.5 justify-end">
                    <a
                      href={`tel:${currentTrack.tecnico.telefono}`}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <PhoneCall size={15} />
                      <span>Llamar al Técnico</span>
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?phone=${currentTrack.tecnico.telefono.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Hola ${currentTrack.tecnico.nombre}, le escribo desde ${currentTrack.clienteNombre} (${currentTrack.apartamentoTorre}) respecto al ticket ${currentTrack.id}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <MessageSquare size={15} />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                </div>

                {/* CONTROLES DE SIMULACIÓN INTERACTIVA (EN MODO DEMO / ERP INTERNO) */}
                {!isPublicView && (
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Sliders size={14} className="text-amber-400" />
                      <span>Simulador de Estatus (Uso Interno ERP):</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSimulatePrevStep(currentTrack.id)}
                        disabled={currentTrack.step <= 1}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
                      >
                        ◀ Paso Anterior
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateNextStep(currentTrack.id)}
                        disabled={currentTrack.step >= 5}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <Play size={12} />
                        <span>Avanzar Estatus ({currentTrack.step}/5)</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          );
        })()}
      </section>

      {/* CATÁLOGO DE SERVICIOS PÚBLICOS */}
      <section id="servicios" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest">
            Soluciones Especializadas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Nuestros Servicios de Elevación
          </h2>
          <p className="text-xs text-slate-400">
            Brindamos cobertura técnica completa para condominios residenciales, torres comerciales, hospitales e industrias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TARJETA 1: MODERNIZACIÓN */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:shadow-xl group">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
              Modernización de Tableros & VVVF
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transformación de tableros electromecánicos antiguos a cuadros microprocesados de frecuencia variable (Yaskawa / Monarch). Eliminación de frenazos bruscos y ahorro de energía.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Viaje suave y parada nivelada</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Indicadores digitales LCD en piso</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Reorganización de cableado viajero</span>
              </li>
            </ul>
          </div>

          {/* TARJETA 2: ASCENSORES NUEVOS & MONTACARGAS */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:shadow-xl group">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
              Ascensores Nuevos & Montacargas
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Suministro e instalación llave en mano de ascensores panorámicos, de pasajeros y montacargas de alta capacidad con estructuras de foso optimizadas.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Capacidades de 450 kg a 5000 kg</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Diseño de cabinas de acero inoxidable</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Operadores de puerta automáticos Fermator</span>
              </li>
            </ul>
          </div>

          {/* TARJETA 3: MANTENIMIENTO PREVENTIVO 24/7 */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:shadow-xl group">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
              <Wrench size={24} />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
              Mantenimiento Mensual & Emergencias
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planes mensuales rigurosos con inspección periódica de guías, cables de tracción, frenos y lubricación. Asistencia de emergencias 24 horas al día.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Ficha digital de mantenimiento en ERP</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Respuesta inmediata en campo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                <span>Inventario permanente de repuestos</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* FORMULARIO DE COTIZACIÓN PÚBLICA EN LÍNEA (CONECTADO AL ERP) */}
      <section id="cotizador-web" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <Calculator size={20} />
              </span>
              <h2 className="text-2xl font-black text-white">
                Cotizador de Proyectos en Línea
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Completa el formulario para generar una estimación inmediata. Tu solicitud se guardará en el ERP {activeComp.nombreCorto} para seguimiento oficial.
            </p>
          </div>

          {!isPublicView && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-right font-mono shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tasa BCV Oficial</span>
              <span className="text-sm font-black text-amber-400">Bs. {(tasaCambioBCV || 36.5).toFixed(2)} / USD</span>
            </div>
          )}
        </div>

        {/* PANEL DE IDENTIFICACIÓN MULTI-TENANT DE CLIENTES EN VIVO (SOLO PRUEBAS/GESTIÓN INTERNA DE ERP) */}
        {!isPublicView && (
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <UserCheck size={16} />
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                  Identificación de Cliente / Condominio Conectado
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800">
                  Dispositivo: {PRESET_CLIENTES_PORTAL.find(p => p.id === selectedClientId)?.dispositivo || 'Navegador Web'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sesión Activa #{sessionToken}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Selecciona el perfil de cliente o condominio para autocompletar tus datos e identificarte formalmente ante el ERP de {activeComp.nombreCorto}:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {PRESET_CLIENTES_PORTAL.map((preset) => {
                const isSelected = selectedClientId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedClientId(preset.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {preset.rifCedula}
                      </span>
                      {isSelected && <CheckCircle2 size={12} className="text-amber-400" />}
                    </div>
                    <span className="text-xs font-bold text-white leading-snug truncate">
                      {preset.nombreCliente}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono mt-1 truncate">
                      📍 {preset.ciudad}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {cotizacionEnviada ? (
          <div className="bg-emerald-950/40 border border-emerald-600/50 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-xl animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-white">
              ¡Solicitud Registrada con Éxito!
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Se ha generado la solicitud N° <strong className="text-emerald-400 font-bold">{cotizacionEnviada.correlativo}</strong> para <strong className="text-white font-bold">{cotizacionEnviada.clienteNombre}</strong> (Sesión #{cotizacionEnviada.sesionToken}) en el sistema de {activeComp.nombreCorto}.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Nuestro departamento de ingeniería revisará requerimientos y se comunicará directamente de forma confidencial.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setCotizacionEnviada(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                Enviar Otra Solicitud
              </button>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('PRESUPUESTOS')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-mono font-black transition cursor-pointer flex items-center gap-2"
                >
                  <FileText size={16} />
                  <span>Ver en ERP</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitCotizacion} className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* CAMPOS DE DATOS */}
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Nombre o Empresa / Condominio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Res. Altamira Plaza / Torres de Oficinas"
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    RIF o Cédula
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. J-30491823-1"
                    value={formData.rifCedula}
                    onChange={(e) => setFormData({ ...formData, rifCedula: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ing. Roberto Mendoza"
                    value={formData.personaContacto}
                    onChange={(e) => setFormData({ ...formData, personaContacto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. +58 412 555-0199"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Caracas, Chacao"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* BOTOÓN Y CAMPO DE APARTAMENTO, TORRE Y UBICACIÓN ESPECÍFICA */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
                    <Building2 size={14} className="text-amber-400" />
                    <span>Apartamento, Torre o Ubicación Específica (Botón Apto)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Para Condominios y Oficinas</span>
                </div>

                <input
                  type="text"
                  placeholder="Ej. Apto. 14-B / Torre Principal / Penthouse-1"
                  value={formData.apartamentoUbicacion}
                  onChange={(e) => setFormData({ ...formData, apartamentoUbicacion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Elegir Tipo:</span>
                  {[
                    '🏢 Torre A', 
                    '🏢 Torre B', 
                    '🏠 Apto. / PH', 
                    '🏬 Local Comercial', 
                    '⚙️ Sala de Máquinas', 
                    '🛗 Cabina Principal'
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        apartamentoUbicacion: prev.apartamentoUbicacion ? `${tag} - ${prev.apartamentoUbicacion}` : tag
                      }))}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-[10px] font-mono text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Tipo de Servicio
                  </label>
                  <select
                    value={formData.tipoServicio}
                    onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="MODERNIZACION">Modernización de Tablero VVVF</option>
                    <option value="NUEVO_ASCENSOR">Instalación de Ascensor Nuevo</option>
                    <option value="MANTENIMIENTO">Contrato Mantenimiento Mensual</option>
                    <option value="EMERGENCIA">Reparación de Emergencia</option>
                    <option value="REPUESTOS">Suministro de Repuestos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Número de Pisos / Paradas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.paradas}
                    onChange={(e) => setFormData({ ...formData, paradas: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                    Capacidad (Personas)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={formData.capacidadPersonas}
                    onChange={(e) => setFormData({ ...formData, capacidadPersonas: parseInt(e.target.value) || 2 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                  Detalles del Proyecto o Fallas Detectadas
                </label>
                <textarea
                  rows={3}
                  placeholder="Describa el estado actual del ascensor, marca del equipo o cualquier requerimiento especial..."
                  value={formData.detalles}
                  onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* RESUMEN DE SOLICITUD Y ENVÍO CONFIDENCIAL */}
            <div className="md:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    Solicitud de Inspección
                  </h3>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Servicio Requerido:</span>
                    <span className="text-white font-bold">{formData.tipoServicio}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Niveles / Paradas:</span>
                    <span className="text-white font-bold">{formData.paradas} pisos</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Atención Técnica:</span>
                    <span className="text-emerald-400 font-bold">Confidencial</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                    <CheckCircle2 size={14} />
                    <span>Evaluación Personalizada</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Un ingeniero especialista asignado a {activeComp.nombreCorto} evaluará su equipo y generará el informe de propuesta directamente para su condominio.
                  </p>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal">
                  * Sus datos están protegidos y solo serán accesibles para la directiva de su edificio y nuestro departamento técnico.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Registrando en ERP...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar Solicitud a {activeComp.nombreCorto}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </section>

      {/* SECCIÓN DE CONSULTA EXCLUSIVA DE ESTATUS Y EVIDENCIAS FOTOGRÁFICAS PARA CLIENTES / CONDOMINIOS */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden" id="consulta-estatus">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="text-amber-400" size={24} />
              <h2 className="text-xl font-extrabold text-white">
                Consulta de Estatus e Inspecciones de Mi Condominio
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Consulte el estado en tiempo real y las fotografías guardadas de los reportes técnicos realizados a su edificio.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-mono font-bold">
            <Lock size={14} />
            <span>Acceso Privado e Aislado por Edificio</span>
          </div>
        </div>

        {/* BUSCADOR DE EDIFICIO O RIF */}
        <div className="space-y-3">
          <label className="block text-xs font-mono text-slate-300 font-bold">
            Buscar mi Edificio, Condominio o RIF:
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Escriba el nombre de su condominio o RIF (Ej. Residencias Altamira Plaza, J-30491823-1)..."
              value={searchTermBuilding}
              onChange={(e) => setSearchTermBuilding(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>

          {/* Accesos rápidos a edificios del sistema (SOLO PRUEBAS/GESTIÓN INTERNA EN ERP) */}
          {!isPublicView && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-mono">Condominios registrados:</span>
              {PRESET_CLIENTES_PORTAL.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSearchTermBuilding(preset.nombreCliente)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                    searchTermBuilding.toLowerCase().includes(preset.nombreCliente.toLowerCase())
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  🏢 {preset.nombreCliente}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LISTA DE REPORTES Y EVIDENCIAS DE ESTE EDIFICIO */}
        {(() => {
          const filteredReports = reportesTecnicos.filter(rep => {
            if (!searchTermBuilding.trim()) return true;
            const term = searchTermBuilding.toLowerCase().trim();
            return (
              rep.clienteNombre?.toLowerCase().includes(term) ||
              rep.clienteRif?.toLowerCase().includes(term) ||
              rep.ubicacionObra?.toLowerCase().includes(term) ||
              rep.equipoAscensor?.toLowerCase().includes(term)
            );
          });

          if (filteredReports.length === 0) {
            return (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3 font-mono">
                <FileSearch size={36} className="text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  No se encontraron reportes grabados para <strong className="text-amber-400">"{searchTermBuilding}"</strong>.
                </p>
                <p className="text-[11px] text-slate-500">
                  Asegúrese de ingresar el nombre completo o RIF de su condominio. Cada cliente únicamente puede visualizar la información técnica vinculada a su propio edificio.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>Resultados de inspección para: <strong className="text-white">{searchTermBuilding || 'Todos los edificios registrados'}</strong></span>
                <span className="text-amber-400 font-bold">{filteredReports.length} Reporte(s) encontrado(s)</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredReports.map((report) => {
                  // Mapeo de Estatus
                  const getStatusBadge = (st: string) => {
                    if (st === 'ATENDIDO' || st === 'CULMINADO') {
                      return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Inspección Atendida</span>;
                    }
                    if (st === 'EN_REPARACION' || st === 'EN_PROCESO') {
                      return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Wrench size={12}/> En Proceso Técnico</span>;
                    }
                    if (st === 'REPUESTOS_SOLICITADOS' || st === 'FALTANTE_REPUESTOS') {
                      return <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Zap size={12}/> Repuestos Solicitados</span>;
                    }
                    return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Clock size={12}/> Evaluación Pendiente</span>;
                  };

                  // Obtener fotografías del reporte o fallbacks representativos del equipo
                  const sampleFallbackPhotos = [
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80'
                  ];

                  const displayPhotos = (report.photos && report.photos.length > 0)
                    ? report.photos
                    : sampleFallbackPhotos.slice(0, Math.min(3, report.fotosEvidenciaCount || 3));

                  return (
                    <div key={report.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition shadow-lg">
                      {/* ENCABEZADO DE REPORTE */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {report.correlativo}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              📅 {report.fecha}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {report.clienteNombre} — <span className="text-slate-300">{report.equipoAscensor}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            📍 {report.ubicacionObra}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(report.estado)}
                        </div>
                      </div>

                      {/* DIAGNÓSTICO Y TRABAJOS REALIZADOS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-900/60 p-3.5 rounded-xl border border-slate-850">
                        <div className="space-y-1">
                          <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1">
                            <Wrench size={12}/> Diagnóstico e Inspección Técnica
                          </span>
                          <p className="text-slate-300 leading-relaxed font-sans text-xs">
                            {report.diagnosticoDanio || 'Inspección de rutina realizada a los sistemas mecánicos y electrónicos.'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-cyan-400 uppercase font-bold block flex items-center gap-1">
                            <ShieldCheck size={12}/> Técnico Evaluador
                          </span>
                          <p className="text-slate-300 font-mono text-xs">
                            {report.tecnicoNombre}
                          </p>
                          {report.firmaClienteObra && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              Recibido por: {report.firmaClienteObra}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* REPUESTOS FALTANTES / REQUERIDOS (SIN MOSTRAR PRECIOS) */}
                      {report.repuestosFaltantes && report.repuestosFaltantes.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                            📦 Componentes y Repuestos Requeridos para su Equipo:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {report.repuestosFaltantes.map((item, idx) => (
                              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono">
                                <span className="text-slate-200 font-bold">
                                  • {item.repuestoNombre}
                                </span>
                                <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20">
                                  Cant: {item.cantidadRequerida}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GALERÍA DE FOTOGRAFÍAS / EVIDENCIAS GUARDADAS */}
                      <div className="space-y-2 pt-1 border-t border-slate-900">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                            <Camera size={14} />
                            <span>Fotografías y Evidencias de la Inspección ({displayPhotos.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Haga clic en una imagen para ampliar
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {displayPhotos.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setModalPhoto({
                                url: imgUrl,
                                correlativo: report.correlativo,
                                cliente: report.clienteNombre,
                                desc: `Fotografía N° ${imgIdx + 1} de la inspección de ${report.equipoAscensor}`
                              })}
                              className="group relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer hover:border-amber-400 transition shadow-md"
                            >
                              <img
                                src={imgUrl}
                                alt={`Evidencia ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-amber-300">
                                <Eye size={20} />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300">
                                #{imgIdx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>
      </div>
      )}

      {/* CONTENIDO PESTAÑA 3: GALERÍA DE PROYECTOS & REFERENCIAS */}
      {activePortalTab === 'GALERIA' && (
        <div className="space-y-8 animate-fadeIn">
          {/* CABECERA DE LA GALERÍA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={16} />
                  <span>Portafolio de Obras Ejecutadas</span>
                </span>
                <h2 className="text-2xl font-black text-white">
                  Galería de Proyectos & Fotos de Referencia
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  Explore nuestras instalaciones de cabinas, cuadros de control VVVF, ascensores panorámicos y proyectos industriales.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProjectModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={18} />
                <span>Publicar Nueva Referencia</span>
              </button>
            </div>

            {/* FILTROS POR CATEGORÍA */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400 mr-1 font-bold">Categoría:</span>
              {[
                { id: 'TODAS', label: 'Todas las Obras' },
                { id: 'CABINAS', label: 'Cabinas & Acero' },
                { id: 'VVVF', label: 'Cuadros VVVF' },
                { id: 'PANORAMICOS', label: 'Panorámicos' },
                { id: 'MONTACARGAS', label: 'Montacargas & Industria' },
                { id: 'MANTENIMIENTO', label: 'Mantenimiento Preventivo' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGalleryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    galleryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* GRID DE FOTOGRAFÍAS Y PROYECTOS */}
          {(() => {
            const filteredGallery = projectGallery.filter(item => {
              if (galleryFilter === 'TODAS') return true;
              return item.categoria === galleryFilter;
            });

            if (filteredGallery.length === 0) {
              return (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <ImageIcon size={48} className="text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white font-mono">No hay fotos en esta categoría</h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Utilice el botón "Publicar Nueva Referencia" para subir proyectos ejecutados a esta categoría.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map(proj => (
                  <div
                    key={proj.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl transition duration-300 flex flex-col group"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-950">
                      <img
                        src={proj.imagenUrl}
                        alt={proj.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 uppercase">
                        {proj.categoria}
                      </span>
                      <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-800">
                        {proj.fecha}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-amber-300 transition">
                          {proj.titulo}
                        </h3>
                        <p className="text-xs text-amber-400 font-mono font-bold">
                          📍 {proj.clienteEdificio} — <span className="text-slate-400">{proj.ubicacion}</span>
                        </p>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                          {proj.descripcion}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap gap-1.5">
                          {proj.caracteristicas.map((car, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px] font-mono">
                              ✓ {car}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProject(proj)}
                          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold font-mono text-xs rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye size={15} />
                          <span>Ver Proyecto Ampliado</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL VER PROYECTO AMPLIADO DE LA GALERÍA */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative space-y-4 p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-amber-500/30 uppercase">
                  {selectedProject.categoria} • {selectedProject.fecha}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {selectedProject.titulo}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  📍 {selectedProject.clienteEdificio} — {selectedProject.ubicacion}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={selectedProject.imagenUrl}
                alt={selectedProject.titulo}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              {selectedProject.descripcion}
            </p>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
              {selectedProject.caracteristicas.map((car, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 text-[11px] font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-amber-400" />
                  <span>{car}</span>
                </span>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR / SUBIR NUEVO PROYECTO O REFERENCIA FOTOGRÁFICA */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Camera size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Publicar Proyecto / Foto de Referencia
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Añade un nuevo proyecto ejecutado al portafolio público del portal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewProject} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono text-amber-300 font-bold mb-1">
                  Título del Proyecto / Trabajo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Modernización de Cabina en Acero Satinado 304"
                  value={newProjectForm.titulo}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, titulo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Cliente / Edificio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Res. Altamira Plaza"
                    value={newProjectForm.clienteEdificio}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, clienteEdificio: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Categoría del Proyecto
                  </label>
                  <select
                    value={newProjectForm.categoria}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, categoria: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="CABINAS">Modernización de Cabinas</option>
                    <option value="VVVF">Cuadros de Control VVVF</option>
                    <option value="PANORAMICOS">Ascensores Panorámicos</option>
                    <option value="MONTACARGAS">Montacargas & Industria</option>
                    <option value="MANTENIMIENTO">Mantenimiento Preventivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Chacao, Caracas"
                    value={newProjectForm.ubicacion}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, ubicacion: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Fecha de Ejecución
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Agosto 2026"
                    value={newProjectForm.fecha}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, fecha: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                  URL de la Fotografía (o selector de ejemplo)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProjectForm.imagenUrl}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, imagenUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />
                <div className="flex gap-2 pt-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Imágenes de Ejemplo:</span>
                  <button
                    type="button"
                    onClick={() => setNewProjectForm({ ...newProjectForm, imagenUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80' })}
                    className="text-[10px] text-amber-400 font-mono underline hover:text-white cursor-pointer"
                  >
                    Cabina
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjectForm({ ...newProjectForm, imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' })}
                    className="text-[10px] text-amber-400 font-mono underline hover:text-white cursor-pointer"
                  >
                    Cuadro VVVF
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjectForm({ ...newProjectForm, imagenUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' })}
                    className="text-[10px] text-amber-400 font-mono underline hover:text-white cursor-pointer"
                  >
                    Panorámico
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  placeholder="Describa el alcance de la obra, componentes instalados o ventajas para los usuarios..."
                  value={newProjectForm.descripcion}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, descripcion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                  Características Destacadas (separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="Acero Satinado 304, Luz LED, Garantía COVENIN"
                  value={newProjectForm.caracteristicasStr}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, caracteristicasStr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Publicar en Galería Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER FOTOGRAFÍA EN ALTA RESOLUCIÓN */}
      {modalPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white font-mono">
                  Evidencia Fotográfica — {modalPhoto.correlativo}
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  {modalPhoto.cliente}
                </p>
              </div>
              <button
                onClick={() => setModalPhoto(null)}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img
                src={modalPhoto.url}
                alt="Evidencia Ampliada"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-300 font-mono text-center">
              {modalPhoto.desc}
            </p>
          </div>
        </div>
      )}

      {/* MODAL MÓDULO DE EMERGENCIA 24/7 & PERSONAS ATRAPADAS */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-950 border-2 border-red-500 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative space-y-5 p-6 sm:p-8">
            
            {/* CABECERA ROJA DE ALERTA */}
            <div className="flex items-start justify-between border-b border-red-900/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600/20 text-red-400 rounded-2xl border border-red-500/50 animate-bounce">
                  <Siren size={30} />
                </div>
                <div>
                  <span className="bg-red-600 text-white text-[10px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    🚨 ATENCIÓN PRIORITARIA LEVEL-1
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Módulo de Emergencia 24/7 & Auxilio Inmediato
                  </h3>
                  <p className="text-xs text-slate-300 font-sans">
                    Guarda de intervención técnica directa para edificios y personas atrapadas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORMULARIO DE EMERGENCIA */}
            <form onSubmit={handleSendEmergencyAlert} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono text-red-300 font-bold mb-1">
                  Nombre del Edificio / Condominio / Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Residencias Park Palace / Torre Empresarial"
                  value={emergencyForm.nombreEdificio}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, nombreEdificio: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-amber-300 font-bold mb-1">
                    Apartamento / Torre / Piso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Apto. 14-B / Torre Principal"
                    value={emergencyForm.apartamentoTorre}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, apartamentoTorre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-amber-300 font-bold mb-1">
                    Tipo de Falla / Alerta *
                  </label>
                  <select
                    value={emergencyForm.tipoEmergencia}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, tipoEmergencia: e.target.value })}
                    className="w-full bg-slate-900 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:border-red-500 focus:outline-none"
                  >
                    <option value="PERSONAS_ATRAPADAS">🚨 PERSONAS ATRAPADAS EN CABINA</option>
                    <option value="FALLA_CRITICA_ENERGIA">⚡ Falla Crítica de Energía / Tablero</option>
                    <option value="PUERTA_TRANCADA">🚪 Puerta Trancada / Fuera de Guía</option>
                    <option value="RUIDO_PELIGROSO">⚠️ Ruido Extraño o Desnivel Peligroso</option>
                    <option value="OTRA_EMERGENCIA">❓ Otra Emergencia de Elevación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Persona de Contacto en Sitio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Vigilante / Ing. de Guardia"
                    value={emergencyForm.personaContacto}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, personaContacto: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                    Teléfono Directo para Cuadrilla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. +58 412 888-9900"
                    value={emergencyForm.telefonoContacto}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, telefonoContacto: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">
                  Descripción Corta de la Situación
                </label>
                <textarea
                  rows={2}
                  placeholder="Indique piso donde se encuentra detenido el ascensor o si hay personas dentro..."
                  value={emergencyForm.detalles}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, detalles: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer border border-red-400/30"
                >
                  <Siren size={18} className="animate-spin" />
                  <span>EMITIR ALERTA DE AUXILIO 24/7</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FOOTER DEL PORTAL PÚBLICO */}
      <footer className="bg-slate-950 border border-slate-850 rounded-2xl p-6 font-mono text-xs text-slate-400 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-amber-400 shrink-0" />
            <span>{activeComp.direccion}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-amber-400 shrink-0" />
            <span>{activeComp.telefono}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-amber-400 shrink-0" />
            <span>{activeComp.email}</span>
          </div>
        </div>

        <div className="border-t border-slate-850 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
          <span>{activeComp.nombre} • RIF: {activeComp.rif}</span>
          <span>© 2026 Todos los derechos reservados • Enlazado con Axon ERP Enterprise</span>
        </div>
      </footer>
        </>
      )}

      {/* MODAL CÓDIGO QR PARA PORTAL TÉCNICO EN OBRA */}
      <PortalTecnicoQRModal
        isOpen={showTechQrModal}
        onClose={() => setShowTechQrModal(false)}
      />

    </div>
  );
}
