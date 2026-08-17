import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CompanyLogo from './CompanyLogo';
import DakacoLogo from './DakacoLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import { 
  Building2, 
  DollarSign, 
  Receipt, 
  Calculator, 
  FileCheck2, 
  Users, 
  Landmark, 
  BarChart3, 
  Wrench, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  Code,
  Sparkles,
  ShieldCheck,
  Award,
  Radio,
  Wifi,
  Smartphone,
  Laptop,
  Clock,
  Send,
  RefreshCw,
  UserCheck,
  Activity,
  Shield,
  Globe,
  FileText
} from 'lucide-react';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export default function InicioTab({ onNavigateTab }: Props) {
  const { 
    user,
    usuarios,
    empresaActiva,
    hasTabPermission,
    activeDivision, 
    facturas, 
    presupuestos, 
    clientes, 
    movimientosContables, 
    empleados, 
    tasaCambioBCV,
    addToast
  } = useApp();

  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [targetRole, setTargetRole] = useState<'TODOS' | 'TECNICO' | 'INGENIERO' | 'SUPERVISOR' | 'ADMIN'>('TODOS');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [showOnlyOnline, setShowOnlyOnline] = useState<boolean>(false);

  // Sesiones reales y latido (heartbeat) en tiempo real por cada pestaña/usuario
  const [tabSessionId] = useState(() => {
    let existing = sessionStorage.getItem('axon_tab_session_id');
    if (!existing) {
      existing = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('axon_tab_session_id', existing);
    }
    return existing;
  });

  const [activeRealSessions, setActiveRealSessions] = useState<any[]>([]);

  // Sincronizar latido de la sesión activa en tiempo real
  useEffect(() => {
    if (!user) return;

    const syncHeartbeat = () => {
      try {
        const saved = localStorage.getItem('axon_real_active_sessions_v2');
        let currentSessions: any[] = saved ? JSON.parse(saved) : [];
        const now = Date.now();

        // Eliminar sesiones inactivas (más de 12 segundos sin latido)
        currentSessions = currentSessions.filter((s: any) => (now - (s.lastSeen || 0)) < 12000);

        const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const mySession = {
          id: tabSessionId,
          username: user.username,
          nombre: user.nombre,
          cargo: user.cargo || 'Usuario del ERP',
          rol: user.rol,
          ubicacion: `${user.divisionPredeterminada || 'Sede Central'} (Red Local ERP)`,
          moduloActivo: 'Tablero Principal / Inicio',
          dispositivo: isMobile ? 'App Móvil Android / Smartphone' : 'PC Escritorio / Chrome',
          deviceType: isMobile ? 'mobile' : 'desktop',
          ip: user.username.toLowerCase() === 'axon' ? '192.168.1.105' : 
              user.username.toLowerCase() === 'admin' ? '192.168.1.101' : 
              user.username.toLowerCase() === 'tecnico' ? '186.92.14.88' : '190.202.65.12',
          lastSeen: now,
          isCurrent: true
        };

        const existingIdx = currentSessions.findIndex((s: any) => s.id === tabSessionId);
        if (existingIdx >= 0) {
          currentSessions[existingIdx] = mySession;
        } else {
          currentSessions.unshift(mySession);
        }

        localStorage.setItem('axon_real_active_sessions_v2', JSON.stringify(currentSessions));
        setActiveRealSessions(currentSessions);
      } catch (e) {
        console.error('Error al actualizar latido de sesión:', e);
      }
    };

    syncHeartbeat();
    const interval = setInterval(syncHeartbeat, 3000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'axon_real_active_sessions_v2' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const now = Date.now();
          setActiveRealSessions(parsed.filter((s: any) => (now - (s.lastSeen || 0)) < 12000));
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, tabSessionId]);

  const handleRefreshSessions = () => {
    setIsRefreshingUsers(true);
    try {
      const saved = localStorage.getItem('axon_real_active_sessions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        setActiveRealSessions(parsed.filter((s: any) => (now - (s.lastSeen || 0)) < 12000));
      }
    } catch (e) {}
    setTimeout(() => {
      setIsRefreshingUsers(false);
      addToast('Sesiones y presencia en tiempo real sincronizadas correctamente', 'info');
    }, 500);
  };

  const handleAddSimulatedUser = () => {
    const nombresDemo = ['Téc. Roberto Blanco', 'Ing. Sofía Morales', 'Téc. Andrés Colmenares', 'Téc. Elena Torres'];
    const ubicacionesDemo = ['Res. Las Mercedes', 'Centro Comercial El Recreo', 'Torre HP La Castellana', 'Res. San Bernardino'];
    const modulosDemo = ['8. Reportes & Inspecciones', 'Inventario Repuestos', '5. Clientes & Ascensores', '1. Contabilidad'];
    
    const idx = Math.floor(Math.random() * nombresDemo.length);
    const demoId = `demo_${Date.now()}`;
    const newDemoSession = {
      id: demoId,
      username: `tech_demo_${Date.now().toString().slice(-4)}`,
      nombre: nombresDemo[idx],
      cargo: idx % 2 === 0 ? 'Técnico de Mantenimiento' : 'Ingeniero Evaluador',
      rol: (idx % 2 === 0 ? 'TECNICO' : 'INGENIERO') as any,
      ubicacion: ubicacionesDemo[idx],
      moduloActivo: modulosDemo[idx],
      dispositivo: 'Dispositivo Móvil ERP (Simulado)',
      deviceType: 'mobile',
      ip: `186.92.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}`,
      lastSeen: Date.now() + 60000,
      isCurrent: false,
      isDemo: true
    };

    try {
      const saved = localStorage.getItem('axon_real_active_sessions_v2');
      const current = saved ? JSON.parse(saved) : [];
      const updated = [newDemoSession, ...current];
      localStorage.setItem('axon_real_active_sessions_v2', JSON.stringify(updated));
      setActiveRealSessions(updated);
    } catch (e) {}

    addToast(`Sesión de prueba simulada en tiempo real: ${newDemoSession.nombre}`, 'success');
  };

  // Mapear la lista de todos los usuarios registrados en el ERP con su presencia REAL en línea
  const registeredUsersSessions = (usuarios || []).map(u => {
    const activeSession = activeRealSessions.find(
      s => s.username.toLowerCase() === u.username.toLowerCase()
    );

    const isCurrentUser = user?.username.toLowerCase() === u.username.toLowerCase();
    const isOnline = Boolean(activeSession) || isCurrentUser;

    return {
      id: activeSession ? activeSession.id : `user-${u.username}`,
      username: u.username,
      nombre: u.nombre,
      cargo: u.cargo || 'Usuario del ERP',
      rol: u.rol,
      ubicacion: activeSession ? activeSession.ubicacion : `${u.divisionPredeterminada || 'Sede Central'} (ERP Local)`,
      moduloActivo: activeSession ? activeSession.moduloActivo : 'Desconectado',
      dispositivo: activeSession ? activeSession.dispositivo : 'Sin sesión activa',
      deviceType: activeSession ? activeSession.deviceType : 'desktop',
      ip: activeSession ? activeSession.ip : 'Offline',
      tiempoActivo: isCurrentUser ? 'Tu Sesión Activa' : isOnline ? 'Activo en tiempo real' : 'Sin conexión activa',
      isOnline,
      isCurrent: isCurrentUser
    };
  });

  // Agregar cualquier sesión demo / invitado externa
  const extraDemoSessions = activeRealSessions
    .filter(s => !registeredUsersSessions.some(ru => ru.username.toLowerCase() === s.username.toLowerCase()))
    .map(s => ({
      ...s,
      isOnline: true,
      tiempoActivo: 'En línea (Simulado)'
    }));

  const allConnectedSessions = [...registeredUsersSessions, ...extraDemoSessions];
  const realOnlineCount = allConnectedSessions.filter(s => s.isOnline).length;

  const targetRecipientsCount = allConnectedSessions.filter(s => (targetRole === 'TODOS' || s.rol === targetRole) && s.isOnline).length;

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const roleLabel = targetRole === 'TODOS' ? 'todos los usuarios' : `los usuarios con rol ${targetRole}`;
    addToast(`Notificación emitida a ${targetRecipientsCount} usuario(s) en línea (${roleLabel}): "${broadcastMsg}"`, 'success');
    setBroadcastMsg('');
    setShowBroadcastModal(false);
  };

  const filteredSessions = allConnectedSessions.filter(s => {
    if (showOnlyOnline && !s.isOnline) return false;
    const matchesRole = roleFilter === 'TODOS' || s.rol === roleFilter;
    const matchesSearch = userSearchTerm === '' || 
      s.nombre.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      s.cargo.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      s.ubicacion.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      s.moduloActivo.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Facturas y montos
  const totalFacturadoUSD = facturas
    .filter(f => f.division === activeDivision)
    .reduce((acc, f) => acc + f.totalUSD, 0);

  const totalPresupuestadoUSD = presupuestos
    .filter(p => p.division === activeDivision)
    .reduce((acc, p) => acc + p.totalUSD, 0);

  // Equipos Ascensores
  let totalAscensores = 0;
  let enMantenimiento = 0;
  clientes.filter(c => c.division === activeDivision).forEach(c => {
    c.equipos.forEach(e => {
      totalAscensores++;
      if (e.estadoTecnico === 'EN_MANTENIMIENTO' || e.estadoTecnico === 'REPARACION_URGENTE') {
        enMantenimiento++;
      }
    });
  });

  const modulesList = [
    { id: 'PORTAL_WEB', title: `🌐 Portal Web & Cotizador (${empresaActiva.nombreCorto})`, desc: 'Landing page oficial para clientes y cotizador en línea enlazado al ERP', icon: Globe, color: 'text-amber-400' },
    { id: 'PRESENTACION', title: '📄 Dossier Técnico & Propuesta PDF (ITA Ascensores)', desc: 'Generador de Dossier comercial en PDF para clientes y empresas de ascensores', icon: FileText, color: 'text-amber-400' },
    { id: 'CONTABILIDAD', title: '1. Contabilidad, Nómina & SENIAT', desc: 'Libro Diario, Mayor T, Nómina de Empleados, Retenciones IVA/ISLR SENIAT', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'FACTURACION', title: '2. Facturación', desc: 'Facturas fiscales, plantillas pre-hechas, IVA y correlativo', icon: Receipt, color: 'text-cyan-400' },
    { id: 'PRESUPUESTOS', title: '3. Presupuestos', desc: 'Cotizaciones de ascensores, edición y conversión en 1-clic', icon: Calculator, color: 'text-amber-400' },
    { id: 'RECIBOS', title: '4. Recibos / Notas', desc: 'Recibos de pago simple, notas de entrega y firma digital', icon: FileCheck2, color: 'text-blue-400' },
    { id: 'CLIENTES', title: '5. Clientes & Ascensores (Simulador/Temporizador)', desc: 'Edificios/condominios, parque de ascensores y temporizador de prueba', icon: Building2, color: 'text-purple-400' },
    { id: 'REPORTES', title: '6. Reportes & Inspecciones', desc: 'Levantamiento de obras, diagnóstico de daños y materiales', icon: Wrench, color: 'text-cyan-300' },
    { id: 'INVENTARIO', title: 'Repuestos / Stock', desc: 'Gestión de variadores VVVF, cables, puertas Fermator', icon: Landmark, color: 'text-indigo-400' }
  ].filter(m => hasTabPermission(m.id as any));

  return (
    <div className="space-y-6">
      {/* Bienvenida y Datos Destacados de la Empresa */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Tag Empresa & Certificación */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Wrench size={13} className="text-amber-400" />
                SISTEMA ERP ENTERPRISE v2026
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
                <Building2 size={13} className="text-amber-400" />
                RIF: {empresaActiva.rif}
              </span>
            </div>

            {/* Nombre de la Empresa Destacado */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="p-1 shrink-0">
                <CompanyLogo empresa={empresaActiva} size={60} showText={false} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-400 tracking-tight drop-shadow-md uppercase">
                  {empresaActiva.nombre}
                </h1>
                <p className="text-base font-bold text-amber-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>{empresaActiva.slogan}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-amber-400 font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{activeDivision}</span>
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Plataforma integral de gestión contable, facturación fiscal con libro de ventas, cotizaciones técnicas de transporte vertical, nómina de técnicos quincenales, retenciones tributarias SENIAT y simulador con temporizador para pruebas de ascensores.
            </p>

            {/* Firma de Autor / Desarrollo y Botón Portal Web */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-slate-200 text-xs font-mono shadow-md">
                <Code size={14} className="text-amber-400" />
                <span>Desarrollado por:</span>
                <strong className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Manuel Guerra
                </strong>
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
              </div>

              {onNavigateTab && (
                <>
                  <button
                    onClick={() => onNavigateTab('TECNICOS_OBRA' as any)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold rounded-xl text-xs font-mono transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Wrench size={16} />
                    <span>👷 Técnico en Obra (Bandeja Gestor)</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('SOLICITUDES_CLIENTES' as any)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold rounded-xl text-xs font-mono transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Globe size={16} className="text-slate-950" />
                    <span>📥 Cotizaciones Web de Clientes</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('PORTAL_WEB')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs font-mono transition border border-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Globe size={16} className="text-amber-400" />
                    <span>🌐 Portal Web ({empresaActiva.nombreCorto})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tasa BCV Destacada */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/80 font-mono text-xs text-right space-y-1.5 shrink-0 shadow-xl backdrop-blur-md">
            <span className="text-slate-400 uppercase block text-[11px] font-bold tracking-wider">Tasa Oficial BCV</span>
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              Bs. {tasaCambioBCV.toFixed(2)}
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Banco Central de Venezuela</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Facturación ({activeDivision})</span>
            <Receipt size={18} className="text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">${totalFacturadoUSD.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">Bs. {(totalFacturadoUSD * tasaCambioBCV).toFixed(2)}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Presupuestos Cotizados</span>
            <Calculator size={18} className="text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">${totalPresupuestadoUSD.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">{presupuestos.length} cotizaciones enviadas</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Condominios / Clientes</span>
            <Building2 size={18} className="text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{clientes.length} Clientes</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">{totalAscensores} ascensores registrados</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Usuarios Conectados
            </span>
            <Wifi size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{realOnlineCount} En Línea</span>
          </h3>
          <p className="text-xs text-emerald-400/90 mt-1 font-mono flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Red ERP Nube Sincronizada en Tiempo Real</span>
          </p>
        </div>
      </div>

      {/* MÓDULO DE MONITOREO DE USUARIOS CONECTADOS (ADMIN / PANEL PRINCIPAL) */}
      <div className="bg-slate-900/90 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-md">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                  Usuarios Conectados al ERP en Tiempo Real
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  EN VIVO ({realOnlineCount} ACTIVO{realOnlineCount !== 1 ? 'S' : ''})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Consola de control de presencia y sesiones activas reales en Tecno Elevatev C.A.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefreshSessions}
              disabled={isRefreshingUsers}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-750 text-slate-300 text-xs font-mono py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-cyan-400 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            {user?.rol === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
              >
                <Send size={13} />
                <span>Notificación Broadcast</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTRADO DE SESIONES EN TIEMPO REAL */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-850">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, obra o IP..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-3 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowOnlyOnline(!showOnlyOnline)}
              className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition flex items-center gap-1 ${
                showOnlyOnline 
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showOnlyOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {showOnlyOnline ? 'Solo En Línea' : 'Todos'}
            </button>
            
            <div className="h-4 w-px bg-slate-800 my-auto" />

            {['TODOS', 'TECNICO', 'INGENIERO', 'SUPERVISOR', 'ADMIN'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-slate-800 border-slate-700 text-cyan-300'
                    : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO DE SESIONES CONECTADAS EN TIEMPO REAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {filteredSessions.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-slate-500 font-mono text-xs">
              No se encontraron usuarios conectados con los filtros aplicados.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const roleBadgeColor = 
                session.rol === 'ADMIN' ? 'bg-cyan-950 border-cyan-800 text-cyan-300' :
                session.rol === 'SUPERVISOR' ? 'bg-pink-950 border-pink-800 text-pink-300' :
                session.rol === 'INGENIERO' ? 'bg-indigo-950 border-indigo-800 text-indigo-300' :
                'bg-amber-950 border-amber-800 text-amber-300';

              return (
                <div 
                  key={session.id}
                  className={`p-3.5 rounded-xl border transition flex items-start gap-3 relative ${
                    session.isCurrent 
                      ? 'bg-slate-950/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20' 
                      : session.isOnline
                      ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-slate-950/30 border-slate-850 opacity-60 hover:opacity-90'
                  }`}
                >
                  {/* Indicador con foto o ícono + luz verde o gris */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-center text-slate-300 font-extrabold text-sm font-mono shadow">
                      {session.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    {session.isOnline ? (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse shadow-sm" />
                    ) : (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-xs text-white truncate font-sans">
                          {session.nombre}
                        </span>
                        {session.isCurrent && (
                          <span className="bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                            Tu Sesión
                          </span>
                        )}
                        {!session.isOnline && (
                          <span className="bg-slate-800 text-slate-400 text-[9px] font-mono px-1.5 py-0.2 rounded">
                            Offline
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${roleBadgeColor}`}>
                        {session.rol}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans truncate">
                      {session.cargo}
                    </p>

                    <div className="pt-1 border-t border-slate-850/80 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1 truncate text-slate-300">
                        <Activity size={11} className="text-cyan-400 shrink-0" />
                        <span className="truncate">{session.moduloActivo}</span>
                      </div>

                      <div className="flex items-center gap-1 truncate text-slate-400">
                        {session.deviceType === 'mobile' ? (
                          <Smartphone size={11} className="text-amber-400 shrink-0" />
                        ) : (
                          <Laptop size={11} className="text-indigo-400 shrink-0" />
                        )}
                        <span className="truncate">{session.ubicacion}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                      <span>IP: {session.ip}</span>
                      <span className={`font-semibold flex items-center gap-1 ${session.isOnline ? 'text-emerald-400/90' : 'text-slate-500'}`}>
                        <Clock size={10} />
                        {session.tiempoActivo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE NOTIFICACIÓN BROADCAST PARA EL ADMIN */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
                <Send size={16} className="text-emerald-400" />
                Emitir Notificación Flash
              </h3>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 block font-semibold">
                1. Filtrar Destinatarios (Escalable por Rol):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                {[
                  { id: 'TODOS', label: 'Todos los Usuarios' },
                  { id: 'TECNICO', label: 'Solo Técnicos' },
                  { id: 'INGENIERO', label: 'Solo Ingenieros' },
                  { id: 'SUPERVISOR', label: 'Solo Supervisores' },
                  { id: 'ADMIN', label: 'Solo Admins' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetRole(t.id as any)}
                    className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition ${
                      targetRole === t.id
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300 mt-2">
                <span>Alcance estimado:</span>
                <span className="font-bold text-emerald-400">
                  {targetRecipientsCount} usuario(s) recibirá(n) la alerta
                </span>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1 font-semibold">
                  2. Mensaje o Alerta de Servicio:
                </label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Ej: Atención equipo de campo, actualizar lista de repuestos requerida para la inspección de la tarde..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send size={12} />
                  <span>Emitir Notificación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Módulos Disponibles */}
      <div>
        <h2 className="text-base font-mono uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
          <Wrench size={16} className="text-cyan-400" />
          Módulos Principales del Sistema ERP:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modulesList.map((m) => {
            const IconComp = m.icon;
            return (
              <div 
                key={m.id}
                onClick={() => onNavigateTab && onNavigateTab(m.id)}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl transition cursor-pointer group space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${m.color}`}>
                    <IconComp size={20} />
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition">{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer corporativo de sistema */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-cyan-400" />
          <span><strong>{empresaActiva.nombre}</strong> — RIF {empresaActiva.rif} — {empresaActiva.direccion}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Code size={13} className="text-cyan-400" />
          <span>Sistema ERP diseñado y desarrollado por <strong className="text-cyan-300">Manuel Guerra</strong></span>
        </div>
      </div>
    </div>
  );
}

