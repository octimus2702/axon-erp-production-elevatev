/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp, INITIAL_EMPRESAS } from './context/AppContext';

// Módulos Tecno Elevatev C.A.
import InicioTab from './components/InicioTab';
import ContabilidadTab from './components/ContabilidadTab';
import FacturacionTab from './components/FacturacionTab';
import PresupuestosTab from './components/PresupuestosTab';
import RecibosNotasTab from './components/RecibosNotasTab';
import ClientesEquiposTab from './components/ClientesEquiposTab';
import NominaTab from './components/NominaTab';
import TributarioTab from './components/TributarioTab';
import ReportesTab from './components/ReportesTab';
import InventarioTab from './components/InventarioTab';
import KardexTab from './components/KardexTab';
import HerramientasTab from './components/HerramientasTab';
import HistorialNotasTab from './components/HistorialNotasTab';
import ConsolidacionTab from './components/ConsolidacionTab';
import SincronizarTab from './components/SincronizarTab';
import AjustesTab from './components/AjustesTab';
import PortalWebTab from './components/PortalWebTab';
import TecnicosObraTab from './components/TecnicosObraTab';
import SolicitudesClientesTab from './components/SolicitudesClientesTab';
import PresentacionTab from './components/PresentacionTab';
import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './components/LoginScreen';
import LockScreen from './components/LockScreen';
import ToastContainer from './components/ToastContainer';
import { OfflineStatusBadge } from './components/OfflineStatusBadge';
import SimuladorTemporizadorAscensor from './components/SimuladorTemporizadorAscensor';
import CompanyLogo from './components/CompanyLogo';
import DakacoLogo from './components/DakacoLogo';
import TecnoElevatevLogo from './components/TecnoElevatevLogo';
import ItaLogo from './components/ItaLogo';
import DelLagoLogo from './components/DelLagoLogo';
import ProyectosVerticalesLogo from './components/ProyectosVerticalesLogo';
import { updateDynamicFavicon } from './utils/dynamicFavicon';

import { 
  Home, 
  DollarSign, 
  Receipt, 
  Calculator, 
  FileCheck2, 
  Building2, 
  Users, 
  Landmark, 
  BarChart3, 
  Warehouse, 
  TrendingUp, 
  History,
  Activity, 
  Settings, 
  Wrench, 
  LogOut,
  Lock, 
  Wifi, 
  WifiOff, 
  AlertOctagon, 
  Layers,
  Zap,
  Plus,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Smartphone,
  Globe,
  FileText,
  Clock,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VoiceDictationModal from './components/VoiceDictationModal';

// Secciones del ERP de Tecno Elevatev C.A.
type TabID = 
  | 'INICIO' 
  | 'PORTAL_WEB'
  | 'TECNICOS_OBRA'
  | 'SOLICITUDES_CLIENTES'
  | 'CONTABILIDAD' 
  | 'FACTURACION' 
  | 'PRESUPUESTOS' 
  | 'RECIBOS' 
  | 'CLIENTES' 
  | 'NOMINA' 
  | 'TRIBUTARIO' 
  | 'REPORTES' 
  | 'HERRAMIENTAS'
  | 'INVENTARIO' 
  | 'KARDEX' 
  | 'HISTORIAL'
  | 'CONSOLIDACION'
  | 'SINCRONIZAR' 
  | 'PRESENTACION'
  | 'AJUSTES';

function MainAppContent() {
  const { 
    empresas = [],
    empresaActiva,
    empresasDisponibles = [],
    setEmpresaActivaId,
    activeDivision, 
    setActiveDivision, 
    networkStatus, 
    setNetworkStatus, 
    syncQueue, 
    isSyncing, 
    triggerManualSync,
    products,
    user,
    logout,
    tasaCambioBCV,
    setTasaCambioBCV,
    tasaBinance,
    setTasaBinance,
    isFetchingRates,
    lastRatesUpdate,
    actualizarTasasEnVivo,
    addToast,
    hasTabPermission,
    isAppLocked,
    lockApp,
    biometricEnabled,
    securityPin,
    crearSolicitud,
    isCleanMode,
    limpiarDatosYEmpezarCero,
    solicitudesClientes = []
  } = useApp();

  const safeEmpresa = empresaActiva || (empresasDisponibles && empresasDisponibles[0]) || INITIAL_EMPRESAS[0];

  const isCotizarUrl = typeof window !== 'undefined' && (window.location.search.includes('cotizar') || window.location.search.includes('portal') || window.location.hash.includes('cotizar') || window.location.hash.includes('portal'));
  const [activeTab, setActiveTab] = useState<TabID>(isCotizarUrl ? 'PORTAL_WEB' : 'INICIO');
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [showGlobalVoiceModal, setShowGlobalVoiceModal] = useState<boolean>(false);

  // Manejar el envío de solicitudes desde el botón global de dictado
  const handleGlobalVoiceSendToCloud = (data: { ingeniero: string; proyecto: string; descripcion: string }) => {
    const ingFinal = data.ingeniero || "Ing. Técnico de Campo";
    const proyFinal = (data.proyecto || "PROYECTO DE CAMPO").toUpperCase();
    const descFinal = data.descripcion || "Solicitud enviada mediante comando de voz global.";

    const firstProd = products.find(p => p.division === activeDivision) || products[0];
    const defaultItems = [{ val_c: firstProd?.val_c || "REQ-VOICE-GEN", cantidad: 1 }];

    crearSolicitud({
      Ingeniero: ingFinal,
      Proyecto: proyFinal,
      Descripcion: `[DICTADO DE VOZ MANOS LIBRES] ${descFinal}`,
      Productos: JSON.stringify(defaultItems),
      division: activeDivision
    });

    addToast(`🚀 Solicitud enviada a la nube para ${proyFinal}`, 'success');
    setActiveTab('REPORTES'); // Navegar a vista de solicitudes/historial
  };

  // Actualización dinámica del Título de la Página y Manifiesto PWA según la empresa activa
  useEffect(() => {
    if (empresaActiva) {
      const companyTitle = `Axon ERP - ${empresaActiva.nombreCorto}`;
      document.title = companyTitle;

      // Actualizar metadatos de descripción
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${companyTitle} - Sistema ERP de Gestión Integral de Ascensores y Obras`);
      }

      // Actualizar título de Web App Apple/PWA
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitle) {
        appleTitle.setAttribute('content', companyTitle);
      }

      // Generar dinámicamente un Manifiesto PWA exclusivo para la empresa seleccionada con URLs absolutas válidas
      try {
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
        const dynamicManifest = {
          id: `${origin}/`,
          short_name: "Axon ERP",
          name: companyTitle,
          description: `Sistema ERP Enterprise para Elevadores y Obras (${empresaActiva.nombre})`,
          icons: [
            { src: `${origin}/icon.png`, type: "image/png", sizes: "512x512", purpose: "any" },
            { src: `${origin}/icon.svg`, type: "image/svg+xml", sizes: "192x192 512x512", purpose: "any" }
          ],
          start_url: `${origin}/`,
          scope: `${origin}/`,
          background_color: "#020617",
          theme_color: empresaActiva.colorPrimario || "#06b6d4",
          display: "standalone",
          orientation: "any",
          categories: ["business", "productivity", "utilities"]
        };

        const stringManifest = JSON.stringify(dynamicManifest);
        const manifestDataUri = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(stringManifest);

        let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          manifestLink.setAttribute('href', manifestDataUri);
        }

        // Actualizar favicon dinámico SVG e íconos PWA por empresa
        updateDynamicFavicon(empresaActiva);
      } catch (e) {
        console.error('Error updating dynamic PWA manifest:', e);
      }
    }
  }, [empresaActiva]);

  // Si los permisos del usuario cambian o al iniciar sesión no tiene acceso a la pestaña activa (ej: INICIO para Técnicos/Supervisores)
  useEffect(() => {
    if (!hasTabPermission(activeTab)) {
      if (hasTabPermission('PRESUPUESTOS')) {
        setActiveTab('PRESUPUESTOS');
      } else if (hasTabPermission('REPORTES')) {
        setActiveTab('REPORTES');
      } else {
        const allowed = (['PRESUPUESTOS', 'REPORTES', 'CLIENTES', 'INVENTARIO', 'KARDEX', 'HISTORIAL'] as TabID[]).find(t => hasTabPermission(t));
        if (allowed) setActiveTab(allowed);
      }
    }
  }, [user, hasTabPermission, activeTab]);

  // Modal de ajuste manual de tasas
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [editBcvInput, setEditBcvInput] = useState(tasaCambioBCV.toString());
  const [editBinanceInput, setEditBinanceInput] = useState(tasaBinance.toString());

  useEffect(() => {
    setEditBcvInput(tasaCambioBCV.toString());
  }, [tasaCambioBCV]);

  useEffect(() => {
    setEditBinanceInput(tasaBinance.toString());
  }, [tasaBinance]);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAppClick = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          addToast('¡Gracias por instalar AXON ERP Enterprise!', 'success');
        }
        setDeferredInstallPrompt(null);
      });
    } else {
      setShowPwaModal(true);
    }
  };

  const downloadDesktopShortcut = () => {
    const currentUrl = window.location.href;
    const shortcutContent = `[InternetShortcut]\nURL=${currentUrl}\nIDList=\nHotKey=0\nIconFile=${window.location.origin}/icon.svg\nIconIndex=0`;
    const blob = new Blob([shortcutContent], { type: 'application/x-mswinurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AXON_ERP_Enterprise.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Acceso directo de AXON ERP descargado con éxito para Escritorio', 'success');
  };

  // Ref y estado para la barra deslizadora del menú horizontal
  const navMenuRef = useRef<HTMLDivElement>(null);
  const [menuScrollProgress, setMenuScrollProgress] = useState(0);

  const handleMenuScroll = () => {
    if (navMenuRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navMenuRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setMenuScrollProgress((scrollLeft / maxScroll) * 100);
      } else {
        setMenuScrollProgress(0);
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMenuScrollProgress(val);
    if (navMenuRef.current) {
      const { scrollWidth, clientWidth } = navMenuRef.current;
      const maxScroll = scrollWidth - clientWidth;
      navMenuRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  const scrollMenuBy = (delta: number) => {
    if (navMenuRef.current) {
      navMenuRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Reloj dinámico
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      setCurrentTime(`${day} ${month} ${year}  —  ${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // State para alternar entre Portal Web público y Pantalla de Login ERP cuando no hay usuario
  const isExplicitLoginUrl = typeof window !== 'undefined' && (
    window.location.search.includes('login') || 
    window.location.hash.includes('login')
  );
  const isExplicitPublicUrl = typeof window !== 'undefined' && (
    window.location.search.includes('cotizar') || 
    window.location.search.includes('tecnico') || 
    window.location.search.includes('obra') || 
    window.location.hash.includes('cotizar') || 
    window.location.hash.includes('tecnico') || 
    window.location.hash.includes('obra')
  );
  const isTecnicosUrl = typeof window !== 'undefined' && (
    window.location.search.includes('tecnico') || 
    window.location.search.includes('obra') || 
    window.location.hash.includes('tecnico') || 
    window.location.hash.includes('obra')
  );
  
  // Por defecto, la app SIEMPRE arranca en la Pantalla de Login ERP (exigiendo contraseña).
  // Únicamente se abre directo en el portal público si la URL trae explícitamente ?cotizar o ?tecnico.
  const [showPublicPortal, setShowPublicPortal] = useState(!user && isExplicitPublicUrl);

  // Guardar referencia del estado previo de usuario para detectar el cierre de sesión (Logout)
  const prevUserRef = useRef(user);

  useEffect(() => {
    // Al cerrar sesión desde el gestor ERP (de user a null), redirigir a la pantalla de Login
    if (prevUserRef.current && !user) {
      setShowPublicPortal(false);
    }
    prevUserRef.current = user;
  }, [user]);

  // Listener de navegación por URL/Hash para reaccionar inmediatamente al abrir enlaces específicos
  useEffect(() => {
    const handleUrlState = () => {
      if (typeof window !== 'undefined') {
        const isExplicitLogin = window.location.search.includes('login') || window.location.hash.includes('login');
        const isExplicitPublic = window.location.search.includes('cotizar') || 
                                 window.location.search.includes('tecnico') || 
                                 window.location.search.includes('obra') || 
                                 window.location.hash.includes('cotizar') || 
                                 window.location.hash.includes('tecnico') || 
                                 window.location.hash.includes('obra');

        if (isExplicitLogin) {
          setShowPublicPortal(false);
        } else if (isExplicitPublic && !user) {
          setShowPublicPortal(true);
        }
      }
    };

    window.addEventListener('hashchange', handleUrlState);
    window.addEventListener('popstate', handleUrlState);
    handleUrlState();

    return () => {
      window.removeEventListener('hashchange', handleUrlState);
      window.removeEventListener('popstate', handleUrlState);
    };
  }, [user]);

  if (isAppLocked) {
    return <LockScreen />;
  }

  // VISTA PÚBLICA / PORTAL DE COTIZACIONES PÚBLICO (Se muestra si se solicita por URL ?cotizar o si showPublicPortal es true)
  if (showPublicPortal) {
    return (
      <div className="min-h-screen bg-[#0c111d] text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-zinc-950 font-sans relative">
        {/* HEADER SUPERIOR PÚBLICO CORPORATIVO */}
        <header className="border-b border-slate-850 bg-[#090d16] px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {safeEmpresa.logoTipo === 'ELEVADORES_DEL_LAGO' ? (
                <DelLagoLogo size={36} showText={true} textColor="text-zinc-100" />
              ) : safeEmpresa.logoTipo === 'ITA_ASCENSORES' ? (
                <ItaLogo size={38} showText={true} textColor="text-zinc-100" />
              ) : safeEmpresa.logoTipo === 'TECNO_ELEVATEV' ? (
                <TecnoElevatevLogo size={32} showText={true} textColor="text-zinc-100" />
              ) : safeEmpresa.logoTipo === 'DAKACO' ? (
                <DakacoLogo size={36} showText={true} textColor="text-zinc-100" />
              ) : safeEmpresa.logoTipo === 'PROYECTOS_VERTICALES' ? (
                <ProyectosVerticalesLogo size={36} showText={true} textColor="text-zinc-100" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black font-mono shadow-md">
                    <Building2 size={20} />
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-sm font-extrabold text-emerald-300 uppercase tracking-tight">{safeEmpresa.nombreCorto}</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono font-bold mt-0.5">RIF: {safeEmpresa.rif}</span>
                  </div>
                </div>
              )}
              <div className="hidden md:flex items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1 text-xs font-mono">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  RIF: {safeEmpresa.rif}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {empresasDisponibles.length > 1 && (
                <div className="flex items-center bg-slate-900 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs font-mono shadow-inner">
                  <span className="text-[10px] text-zinc-400 font-bold mr-1.5 uppercase">Portal:</span>
                  <select
                    value={safeEmpresa.id}
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

              <a
                href={`https://api.whatsapp.com/send?phone=584121234567&text=Hola%20${encodeURIComponent(safeEmpresa.nombreCorto)}%2C%20quisiera%20cotizar%20un%20ascensor`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition shadow-md"
              >
                <span>💬 WhatsApp {safeEmpresa.nombreCorto}</span>
              </a>

              {isTecnicosUrl ? (
                <div className="px-3.5 py-2 bg-amber-500/20 text-amber-300 font-bold rounded-xl text-xs font-mono border border-amber-500/40 flex items-center gap-1.5">
                  <Wrench size={14} />
                  <span>Portal Técnico en Obra</span>
                </div>
              ) : (
                <a
                  href="#cotizar"
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📋 Solicitar Cotización</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL: PORTAL WEB Y COTIZADOR PÚBLICO */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-grow">
          <PortalWebTab isPublicView={true} onOpenPublicView={() => setShowPublicPortal(true)} />
        </main>

        {/* FOOTER CORPORATIVO PÚBLICO */}
        <footer className="border-t border-slate-850 bg-[#070a10] py-6 px-4 text-center text-xs text-slate-400 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              © {new Date().getFullYear()} {safeEmpresa.nombre} — Todos los derechos reservados.
            </div>
            
            <div className="flex items-center gap-4 text-slate-400">
              {user && (
                <button
                  type="button"
                  onClick={() => setShowPublicPortal(false)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer font-mono"
                  title="Regresar al gestor ERP"
                >
                  <ChevronLeft size={12} />
                  <span>Volver al Gestor ERP</span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                <span>Desarrollado por</span>
                <strong className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Manuel Guerra
                </strong>
              </div>
            </div>
          </div>
        </footer>

        <ToastContainer />
      </div>
    );
  }

  if (isAppLocked) {
    return <LockScreen />;
  }

  // Si no hay sesión ni portal público activado, ir a Login
  if (!user) {
    return <LoginScreen />;
  }

  const handleNavigateFromHome = (tabKey: string) => {
    const map: { [k: string]: TabID } = {
      PORTAL_WEB: 'PORTAL_WEB',
      portal_web: 'PORTAL_WEB',
      contabilidad: 'CONTABILIDAD',
      facturacion: 'FACTURACION',
      presupuestos: 'PRESUPUESTOS',
      recibos: 'RECIBOS',
      clientes: 'CLIENTES',
      nomina: 'NOMINA',
      tributario: 'TRIBUTARIO',
      reportes: 'REPORTES',
      inventario: 'INVENTARIO',
      kardex: 'KARDEX',
      historial: 'HISTORIAL',
      sincronizar: 'SINCRONIZAR',
      ajustes: 'AJUSTES'
    };
    if (map[tabKey]) {
      setActiveTab(map[tabKey]);
    } else if (tabKey) {
      setActiveTab(tabKey as TabID);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c111d] text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-zinc-950 font-sans relative">
      
      {/* 1. HEADER CORPORATIVO MULTI-EMPRESA */}
      <header className="border-b border-slate-850 bg-[#090d16] px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Lado Izquierdo: Marca de la Empresa (Dakaco / Tecno Elevatev / Elevadores del Lago) */}
          <div className="flex flex-wrap items-center gap-3">
            {safeEmpresa.logoTipo === 'ELEVADORES_DEL_LAGO' ? (
              <DelLagoLogo size={38} showText={true} textColor="text-zinc-100" />
            ) : safeEmpresa.logoTipo === 'ITA_ASCENSORES' ? (
              <ItaLogo size={38} showText={true} textColor="text-zinc-100" />
            ) : safeEmpresa.logoTipo === 'DAKACO' ? (
              <DakacoLogo size={38} showText={true} textColor="text-zinc-100" />
            ) : safeEmpresa.logoTipo === 'TECNO_ELEVATEV' ? (
              <TecnoElevatevLogo size={32} showText={true} textColor="text-zinc-100" />
            ) : safeEmpresa.logoTipo === 'PROYECTOS_VERTICALES' ? (
              <ProyectosVerticalesLogo size={38} showText={true} textColor="text-zinc-100" />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md">
                  <Building2 size={20} />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-sm font-extrabold text-emerald-300">{safeEmpresa.nombreCorto}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono font-bold">RIF: {safeEmpresa.rif}</span>
                </div>
              </div>
            )}

            <div className="hidden sm:flex items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1 text-xs font-mono">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">RIF: {safeEmpresa.rif}</span>
            </div>

            {empresasDisponibles.length > 1 && (
              <div className="relative flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-mono ml-1">
                <span className="text-[9px] text-zinc-500 uppercase mr-2 font-bold hidden sm:inline">Empresa:</span>
                <select
                  value={safeEmpresa.id}
                  onChange={(e) => setEmpresaActivaId(e.target.value as any)}
                  className="bg-transparent text-cyan-300 font-bold text-[11px] focus:outline-none cursor-pointer pr-1"
                >
                  {empresasDisponibles.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900 text-zinc-200">
                      {emp.nombreCorto}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lado Derecho: Switcher de División Operativa y Perfil */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 w-full md:w-auto justify-between sm:justify-end">

            {/* INSIGNIA Y CONTADOR DE ARCHIVOS OFFLINE (SÓTANO / INDEXEDDB) */}
            <OfflineStatusBadge />

            {/* BOTÓN GLOBAL DE DICTADO POR VOZ MANOS LIBRES */}
            <button
              onClick={() => setShowGlobalVoiceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer shadow-sm shrink-0"
              title="Dictar por voz con manos libres (Técnicos de Campo)"
            >
              <Mic size={13} className="text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">🎙️ Dictado Voz</span>
            </button>

            {/* SWITCHER OPERATIVO (MODERNIZACIÓN / MANTENIMIENTO) */}
            <div className="flex bg-slate-950 border border-slate-850 rounded-xl p-1 shrink-0 select-none">
              <button 
                onClick={() => setActiveDivision('MODERNIZACION')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeDivision === 'MODERNIZACION' 
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_4px_12px_rgba(6,182,212,0.3)]' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                MODERNIZACIÓN
              </button>
              <button 
                onClick={() => setActiveDivision('MANTENIMIENTO')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeDivision === 'MANTENIMIENTO' 
                    ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                MANTENIMIENTO
              </button>
            </div>

            {/* PERFIL Y CERRAR SESIÓN */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-1 rounded-xl select-none">
              <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-cyan-400 flex items-center justify-center shrink-0">
                {user.nombre.charAt(0)}
              </div>
              <div className="text-left leading-none max-w-[130px] hidden sm:block pr-1">
                <span className="text-[10px] font-sans font-bold text-zinc-300 block truncate" title={user.nombre}>
                  {user.nombre}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tight block truncate mt-0.5">
                  {user.cargo}
                </span>
              </div>
              {(biometricEnabled || securityPin) && (
                <button 
                  onClick={lockApp}
                  className="h-7 w-7 flex items-center justify-center bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-cyan-400 border border-slate-800 rounded-lg transition cursor-pointer shrink-0"
                  title="Bloquear PWA Ahora (Biometría / PIN)"
                >
                  <Lock size={12} />
                </button>
              )}
              <button 
                onClick={logout}
                className="h-7 w-7 flex items-center justify-center bg-slate-900 hover:bg-rose-950 hover:text-white text-rose-500 border border-slate-800 rounded-lg transition cursor-pointer shrink-0"
                title="Cerrar Sesión Activa"
              >
                <LogOut size={12} />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* BANNER ESPECIAL DE DEMOSTRACIÓN CLIENTE (SI APLICA) */}
      {user?.rol === 'CLIENTE_DEMO' && (
        <div className="bg-purple-950/90 border-b border-purple-800/80 px-4 py-2.5 text-center flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-purple-200">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping shrink-0" />
            <span>⏱️ <strong>SESIÓN CLIENTE DEMOSTRACIÓN ACTIVADA</strong> — Pestañas Dossier Técnico y Sincronización ocultas para la prueba.</span>
          </div>
          <button
            onClick={() => setShowTimerModal(true)}
            className="mx-auto sm:mx-0 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:brightness-110 text-white font-extrabold rounded-xl shadow-lg border border-purple-400 text-xs cursor-pointer flex items-center gap-2 transition"
          >
            <Clock size={15} />
            <span>⏱️ PROBAR TEMPORIZADOR DE ASCENSORES EN VIVO</span>
          </button>
        </div>
      )}

      {/* BANNER CLOCK & TASAS BCV + BINANCE P2P EN TIEMPO REAL */}
      <div className="bg-[#090d16] border-b border-slate-850 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-left">
          <div className="flex items-center gap-2.5 bg-slate-950/85 border border-slate-850/80 px-4 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-mono font-bold text-zinc-350 uppercase tracking-wide">
              {currentTime || "Sincronizando reloj de Tecno Elevatev..."}
            </span>
          </div>

          {/* TASAS EN TIEMPO REAL: BCV + BINANCE P2P (Restringido para Técnicos y Supervisores) */}
          {user?.rol !== 'TECNICO' && user?.rol !== 'SUPERVISOR' && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              {/* Badge BCV */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/50 border border-cyan-800/70 text-cyan-300 shadow-sm">
                <Building2 size={13} className="text-cyan-400 shrink-0" />
                <span className="text-[10px] text-slate-400 uppercase font-bold">BCV:</span>
                <strong className="text-white font-extrabold text-xs">Bs. {tasaCambioBCV.toFixed(2)}</strong>
              </div>

              {/* Badge Binance P2P */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/50 border border-amber-800/70 text-amber-300 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                <span className="text-[10px] text-amber-400 uppercase font-bold">BINANCE P2P:</span>
                <strong className="text-amber-300 font-extrabold text-xs">Bs. {tasaBinance.toFixed(2)}</strong>
              </div>

              {/* Acciones de tasa */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => actualizarTasasEnVivo()}
                  disabled={isFetchingRates}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer disabled:opacity-50"
                  title={`Sincronizar tasas en vivo con BCV y Binance ${lastRatesUpdate ? `(Última: ${lastRatesUpdate})` : ''}`}
                >
                  <RefreshCw size={12} className={isFetchingRates ? "animate-spin text-cyan-400" : ""} />
                </button>

                <button
                  onClick={() => setShowRatesModal(true)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 text-[10px] font-bold transition cursor-pointer"
                  title="Ajustar o editar valores de las tasas"
                >
                  <span>Ajustar</span>
                </button>
              </div>

              <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

              <div className="flex items-center bg-slate-950/60 border border-slate-850 p-0.5 rounded-lg shrink-0 gap-0.5 text-[9px]">
                {[
                  { status: 'ONLINE', icon: <Wifi size={10} />, label: 'ONLINE' },
                  { status: 'OFFLINE', icon: <WifiOff size={10} />, label: 'OFFLINE' }
                ].map(opt => (
                  <button 
                    key={opt.status}
                    onClick={() => setNetworkStatus(opt.status as any)}
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      networkStatus === opt.status 
                        ? 'bg-slate-900 text-cyan-400 border border-slate-850' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. NAVEGACIÓN EN PESTAÑAS (LOS 8 MÓDULOS Y TABS DE TECNO ELEVATEV) */}
      <nav className="border-b border-slate-850 bg-[#090d16]/60 px-3 sm:px-6 py-2 relative">
        <div 
          ref={navMenuRef}
          onScroll={handleMenuScroll}
          className="max-w-7xl mx-auto flex overflow-x-auto gap-1.5 text-xs select-none scrollbar-none py-1 scroll-smooth"
        >
          {[
            { id: 'INICIO', icon: <Home size={14} />, label: 'INICIO' },
            { id: 'PORTAL_WEB', icon: <Globe size={14} className="text-amber-400" />, label: `🌐 PORTAL WEB (${safeEmpresa.nombreCorto})` },
            { id: 'TECNICOS_OBRA', icon: <Wrench size={14} className="text-amber-400" />, label: '👷 TÉCNICO EN OBRA' },
            { 
              id: 'SOLICITUDES_CLIENTES', 
              icon: <FileText size={14} className="text-cyan-400" />, 
              label: '📥 COTIZACIONES CLIENTES',
              badge: solicitudesClientes.filter(s => s.estado === 'NUEVA').length
            },
            { id: 'CONTABILIDAD', icon: <DollarSign size={14} />, label: '1. CONTABILIDAD' },
            { id: 'PRESUPUESTOS', icon: <Calculator size={14} />, label: '2. PRESUPUESTOS' },
            { id: 'CLIENTES', icon: <Building2 size={14} />, label: '3. CLIENTES & ASCENSORES' },
            { id: 'REPORTES', icon: <BarChart3 size={14} />, label: '4. REPORTES TÉCNICOS' },
            { id: 'HERRAMIENTAS', icon: <Wrench size={14} className="text-amber-400" />, label: '5. HERRAMIENTAS EN OBRA' },
            { id: 'CONSOLIDACION', icon: <Layers size={14} className="text-amber-400" />, label: '6. CONSOLIDACIÓN OBRAS' },
            { id: 'INVENTARIO', icon: <Warehouse size={14} />, label: 'REPUESTOS / STOCK' },
            { id: 'KARDEX', icon: <TrendingUp size={14} />, label: 'KÁRDEX' },
            { id: 'HISTORIAL', icon: <History size={14} />, label: 'HISTORIAL NOTAS' },
            { id: 'PRESENTACION', icon: <FileText size={14} className="text-amber-400" />, label: '📄 DOSSIER (PDF)' },
            { id: 'SINCRONIZAR', icon: <Activity size={14} />, label: 'SINCRONIZAR' },
            { id: 'AJUSTES', icon: <Settings size={14} />, label: 'AJUSTES' }
          ].filter(tab => hasTabPermission(tab.id as TabID)).map(tab => {
            const isTabActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-mono text-[11px] font-bold tracking-wide cursor-pointer transition-all duration-200 border shrink-0 ${
                  isTabActive 
                    ? 'bg-slate-900 border-cyan-500/40 text-cyan-400 shadow-[0_2px_8px_rgba(6,182,212,0.15)]' 
                    : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:border-slate-850/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-sans font-bold shadow-sm animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* BARRA PEQUEÑA DESLIZADORA / ESPARSIDORA PARA MOVER EL MENÚ DE LADO A LADO */}
      <div className="bg-slate-950 border-b border-slate-850 px-3 sm:px-6 py-1.5 shadow-inner select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-mono">
          
          {/* Botón desplazar izquierda */}
          <button 
            onClick={() => scrollMenuBy(-220)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition cursor-pointer shrink-0"
            title="Desplazar menú a la izquierda"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Barra deslizadora / Slider horizontal */}
          <div className="flex-1 flex items-center gap-2 max-w-2xl mx-auto bg-slate-900/90 border border-slate-800/80 px-3 py-1 rounded-full shadow-sm">
            <SlidersHorizontal size={12} className="text-cyan-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
              Mover Menú:
            </span>

            <input 
              type="range"
              min="0"
              max="100"
              value={menuScrollProgress}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all focus:outline-none"
              title="Arrastra o mueve esta barra para desplazar el menú horizontal de lado a lado"
            />

            <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0 min-w-[32px] text-right">
              {Math.round(menuScrollProgress)}%
            </span>
          </div>

          {/* Botón desplazar derecha */}
          <button 
            onClick={() => scrollMenuBy(220)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition cursor-pointer shrink-0"
            title="Desplazar menú a la derecha"
          >
            <ChevronRight size={14} />
          </button>

        </div>
      </div>



      {/* BANNER AVISO DE DATOS DE PRUEBA EN ESTE DISPOSITIVO */}
      {!isCleanMode && (
        <div className="bg-amber-950/90 border border-amber-500/50 p-3 mx-3 sm:mx-6 mt-3 mb-1 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-xs font-mono text-amber-200">
            <span className="text-amber-400 font-bold text-base">⚠️</span>
            <div>
              <span className="font-bold block text-white">Dispositivo con Datos de Ejemplo / Prueba Cargados</span>
              <span className="text-[11px] text-amber-300/80">Si abriste el enlace en tu teléfono, limpia los datos iniciales para sincronizar solo información real.</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Deseas LIMPIAR Y REINICIAR los datos de prueba en este dispositivo para empezar a operar 100% en blanco?\n\nEsto borrará los datos de muestra locales de este teléfono y lo dejará listo en modo real.')) {
                limpiarDatosYEmpezarCero();
                addToast('¡Dispositivo limpiado con éxito! Ahora está en modo real desde 0.', 'success');
              }
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>🗑️ Limpiar Datos de Prueba y Empezar desde 0</span>
          </button>
        </div>
      )}

      {/* 3. CONTENIDO DINÁMICO */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-3 sm:p-6">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab + "_" + activeDivision}
              initial={{ opacity: 0, scale: 0.99, y: 1.5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -1.5 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              {activeTab === 'INICIO' && (
                <InicioTab onNavigateTab={handleNavigateFromHome} />
              )}

              {activeTab === 'PORTAL_WEB' && (
                <PortalWebTab onNavigateTab={handleNavigateFromHome} onOpenPublicView={() => setShowPublicPortal(true)} />
              )}

              {activeTab === 'TECNICOS_OBRA' && (
                <TecnicosObraTab />
              )}

              {activeTab === 'SOLICITUDES_CLIENTES' && (
                <SolicitudesClientesTab />
              )}

              {activeTab === 'CONTABILIDAD' && (
                <ContabilidadTab />
              )}

              {activeTab === 'TRIBUTARIO' && (
                <ContabilidadTab initialSubTab="TRIBUTARIO" />
              )}

              {activeTab === 'NOMINA' && (
                <ContabilidadTab initialSubTab="NOMINA" />
              )}

              {activeTab === 'REPORTES' && (
                <ReportesTab />
              )}

              {activeTab === 'HERRAMIENTAS' && (
                <HerramientasTab />
              )}

              {activeTab === 'FACTURACION' && (
                <ContabilidadTab initialSubTab="FACTURACION" />
              )}

              {activeTab === 'PRESUPUESTOS' && (
                <PresupuestosTab />
              )}

              {activeTab === 'RECIBOS' && (
                <ContabilidadTab initialSubTab="RECIBOS" />
              )}

              {activeTab === 'CLIENTES' && (
                <ClientesEquiposTab />
              )}

              {activeTab === 'INVENTARIO' && (
                <InventarioTab 
                  initialFamilyFilter={familyFilter}
                  clearInitialFamilyFilter={() => setFamilyFilter(null)}
                />
              )}

              {activeTab === 'KARDEX' && (
                <KardexTab />
              )}

              {activeTab === 'HISTORIAL' && (
                <HistorialNotasTab />
              )}

              {activeTab === 'CONSOLIDACION' && (
                <ConsolidacionTab />
              )}

              {activeTab === 'SINCRONIZAR' && (
                <SincronizarTab />
              )}

              {activeTab === 'PRESENTACION' && (
                <PresentacionTab />
              )}

              {activeTab === 'AJUSTES' && (
                <AjustesTab />
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* 4. FOOTER CORPORATIVO */}
      <footer className="border-t border-slate-850 bg-[#090d16] py-4 px-6 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>{safeEmpresa.nombre} • {safeEmpresa.slogan}</span>
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
            <span>RIF: {safeEmpresa.rif}</span>
            <span>-</span>
            <span>{safeEmpresa.direccion}</span>
            <span>-</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      {/* NOTIFICACIONES TOAST */}
      <ToastContainer />

      {/* MODAL CONFIGURACIÓN DE TASAS EN TIEMPO REAL */}
      <AnimatePresence>
        {showRatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw size={18} className="text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">Tasas de Cambio en Tiempo Real</h3>
                </div>
                <button 
                  onClick={() => setShowRatesModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema consulta automáticamente en tiempo real la tasa oficial del Banco Central de Venezuela (BCV) y el mercado P2P de Binance (USDT/VES). Puedes forzar una actualización o ajustar manualmente los valores.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <Building2 size={14} />
                      TASA OFICIAL BCV
                    </span>
                    <span className="text-slate-500 text-[10px]">Bolívares / USD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Bs.</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={editBcvInput}
                      onChange={(e) => setEditBcvInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-bold font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <Zap size={14} />
                      TASA BINANCE P2P
                    </span>
                    <span className="text-slate-500 text-[10px]">Bolívares / USDT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Bs.</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={editBinanceInput}
                      onChange={(e) => setEditBinanceInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-amber-300 font-bold font-mono text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {lastRatesUpdate && (
                  <div className="text-[10px] text-slate-500 text-center">
                    Última sincronización con servidores en vivo: <strong className="text-slate-300">{lastRatesUpdate}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    await actualizarTasasEnVivo();
                    setEditBcvInput(tasaCambioBCV.toString());
                    setEditBinanceInput(tasaBinance.toString());
                  }}
                  disabled={isFetchingRates}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isFetchingRates ? "animate-spin" : ""} />
                  <span>Consultar Servidores</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRatesModal(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const bVal = parseFloat(editBcvInput);
                      const binVal = parseFloat(editBinanceInput);
                      if (bVal > 0) {
                        setTasaCambioBCV(bVal);
                        localStorage.setItem('tecno_tasa_bcv', bVal.toString());
                      }
                      if (binVal > 0) {
                        setTasaBinance(binVal);
                        localStorage.setItem('tecno_tasa_binance', binVal.toString());
                      }
                      addToast('Tasas de cambio guardadas correctamente', 'success');
                      setShowRatesModal(false);
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL GLOBAL TEMPORIZADOR DE ASCENSORES */}
        {showTimerModal && (
          <SimuladorTemporizadorAscensor onClose={() => setShowTimerModal(false)} />
        )}

        {/* MODAL GLOBAL DE DICTADO POR VOZ MANOS LIBRES */}
        <VoiceDictationModal
          isOpen={showGlobalVoiceModal}
          onClose={() => setShowGlobalVoiceModal(false)}
          onApplyDictation={(data) => {
            addToast('Dictado recibido. Puedes cargarlo en el módulo correspondiente.', 'info');
          }}
          onSendToCloud={handleGlobalVoiceSendToCloud}
        />

        {/* OVERLAY DE VISTA PÚBLICA DEL PORTAL WEB */}
        {showPublicPortal && (
          <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-3 sm:p-6 animate-fadeIn">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-amber-500/40 p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 font-mono text-xs text-amber-300 font-bold">
                  <Globe size={18} className="text-amber-400" />
                  <span>VISTA PREVIA PÚBLICA DEL PORTAL DE COTIZACIÓN ({safeEmpresa.nombreCorto})</span>
                </div>
                <button
                  onClick={() => setShowPublicPortal(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-mono text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  ✕ Cerrar Vista Pública
                </button>
              </div>

              <PortalWebTab isPublicView={true} />
            </div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
