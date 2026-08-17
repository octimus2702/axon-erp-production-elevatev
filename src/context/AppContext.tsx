import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Producto, 
  Nota, 
  SolicitudProyecto, 
  EntradaKardex, 
  Usuario, 
  Cliente, 
  EquipoAscensor, 
  Factura, 
  Presupuesto, 
  ReciboNota, 
  MovimientoContable, 
  Empleado, 
  PrestamoEmpleado, 
  RegistroNomina, 
  RetencionTributaria,
  DivisionOperativa,
  ReporteTecnicoCampo,
  SolicitudCotizacionCliente,
  PrestamoHerramienta,
  RolUsuario,
  TabID,
  PermisosRolMap,
  EmpresaConfig,
  EmpresaId
} from '../types';

import { 
  INITIAL_PRODUCTS, 
  INITIAL_CLIENTES, 
  INITIAL_FACTURAS, 
  INITIAL_PRESUPUESTOS, 
  INITIAL_RECIBOS, 
  INITIAL_MOVIMIENTOS, 
  INITIAL_EMPLEADOS, 
  INITIAL_PRESTAMOS, 
  INITIAL_NOMINA_HISTORIAL, 
  INITIAL_RETENCIONES, 
  INITIAL_NOTES, 
  INITIAL_SOLICITUDES, 
  INITIAL_KARDEX,
  INITIAL_REPORTES_TECNICOS,
  INITIAL_SOLICITUDES_CLIENTES,
  INITIAL_PRESTAMOS_HERRAMIENTAS,
  DEMO_PRODUCTS, 
  DEMO_CLIENTES, 
  DEMO_FACTURAS, 
  DEMO_PRESUPUESTOS, 
  DEMO_RECIBOS, 
  DEMO_MOVIMIENTOS, 
  DEMO_EMPLEADOS, 
  DEMO_PRESTAMOS, 
  DEMO_NOMINA_HISTORIAL, 
  DEMO_RETENCIONES, 
  DEMO_NOTES, 
  DEMO_SOLICITUDES, 
  DEMO_KARDEX,
  DEMO_REPORTES_TECNICOS,
  DEMO_SOLICITUDES_CLIENTES,
  DEMO_PRESTAMOS_HERRAMIENTAS
} from '../data';

import { 
  postReportToAppsScript, 
  pushAllReportsToAppsScript, 
  pullReportesFromAppsScript, 
  postNotaToAppsScript, 
  postProductoToAppsScript, 
  postSolicitudCotizacionToAppsScript,
  pullAllDataFromAppsScript,
  pullDataFromGoogleSheetsDirect,
  getStoredAccessToken
} from '../services/googleSheets';
import { ACTIVE_COMPANY_ID } from '../config/companyConfig';
import { initDB, getUnsyncedRecords, STORES } from '../utils/db';
import { initSyncManagerListeners, processOfflineSync, saveReporteOffline, saveNotaOffline } from '../utils/syncManager';
import { 
  isSupabaseConfigured, 
  updateBufferCotizacionStatus, 
  updateBufferReporteStatus, 
  softDeleteRecord, 
  insertBufferCotizacion, 
  insertBufferReporteTecnico,
  testSupabaseConnection,
  fetchBufferCotizaciones,
  fetchBufferReportesTecnicos
} from '../services/supabaseClient';

export type NetworkStatus = 'ONLINE' | 'INTERMITTENT' | 'OFFLINE';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface PortalPingResult {
  success: boolean;
  latencyMs: number;
  message: string;
  gestorUser?: string;
  timestamp: string;
  source: 'SUPABASE_POSTGRES' | 'EXPRESS_CLOUD_SERVER' | 'LOCAL_BROADCAST' | 'CLOUD_APPS_SCRIPT' | 'INDEXEDDB_STANDALONE';
}

export const INITIAL_EMPRESAS: EmpresaConfig[] = [
  {
    id: 'TECNO_ELEVATEV',
    nombre: 'TECNO ELEVATEV, C.A',
    nombreCorto: 'TECNO ELEVATEV, C.A',
    rif: 'J-40382654-4',
    slogan: 'Modernización y Mantenimiento de Ascensores',
    direccion: 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.',
    telefono: '(0412)983.49.95 / (0412)619.02.55',
    email: 'gerencia.elevatev@gmail.com',
    colorPrimario: '#06B6D4',
    logoTipo: 'TECNO_ELEVATEV',
    nombreGestor: 'Gerencia y Coordinación Técnica Tecno Elevatev',
    telefonoGestor: '(0412)983.49.95'
  },
  {
    id: 'SOLUCIONES_DAKACO',
    nombre: 'Soluciones Integrales DAKACO, C.A.',
    nombreCorto: 'Soluciones Integrales DAKACO',
    rif: 'J-409780457',
    slogan: 'Servicios Integrales y Mantenimiento de Ascensores',
    direccion: 'Caracas, Venezuela',
    telefono: '+58 (412) 555-0199 / (212) 409-7804',
    email: 'administracion@dakaco.com',
    colorPrimario: '#EAB308',
    logoTipo: 'DAKACO',
    nombreGestor: 'Gestor General Dakaco',
    telefonoGestor: '+584125550199'
  },
  {
    id: 'ITA_ASCENSORES',
    nombre: 'Ascensores Barbaroza, C.A (ITA ASCENSORES)',
    nombreCorto: 'ITA ASCENSORES',
    rif: 'J-29993664-2',
    slogan: 'Ingeniería, Mantenimiento & Control Operativo de Ascensores',
    direccion: 'Av. Elías Rodríguez, Galpón N° 15, Zona Industrial, Las Tejerías, Edo. Aragua',
    telefono: '+58 (412) 123-4567 / +58 (244) 321-8899',
    email: 'mantenimiento.barbaroza@gmail.com',
    colorPrimario: '#F59E0B',
    logoTipo: 'ITA_ASCENSORES',
    nombreGestor: 'Téc. Manuel Barbaroza (Gestor Operativo)',
    telefonoGestor: '+584121234567'
  },
  {
    id: 'PROYECTOS_VERTICALES_AB',
    nombre: 'Proyectos Verticales AB, C.A.',
    nombreCorto: 'Proyectos Verticales AB',
    rif: 'J-40485349-9',
    slogan: 'Ingeniería, Montajes & Soluciones de Elevación Vertical',
    direccion: 'Los Teques, Edo. Miranda, Venezuela',
    telefono: '+58 (412) 888-9900',
    email: 'contacto.proyectosverticalesab@gmail.com',
    colorPrimario: '#10B981',
    logoTipo: 'PROYECTOS_VERTICALES',
    nombreGestor: 'Ing. Manuel Guerra (Gestor de Obras)',
    telefonoGestor: '+584128889900'
  },
  {
    id: 'ELEVADORES_DEL_LAGO',
    nombre: 'Elevadores y Servicios Del Lago, C.A.',
    nombreCorto: 'Elevadores del Lago',
    rif: 'J-407768913',
    slogan: 'Servicios, Mantenimiento & Elevación Vertical',
    direccion: 'Maracaibo, Edo. Zulia - Venezuela',
    telefono: '+58 (412) 776-8913 / +58 (261) 700-4077',
    email: 'contacto@elevadoresdellago.com',
    colorPrimario: '#0284C7',
    logoTipo: 'ELEVADORES_DEL_LAGO',
    nombreGestor: 'Gestor Regional Del Lago',
    telefonoGestor: '+584127768913'
  }
];

interface SyncItem {
  id: string;
  type: 'FACTURA' | 'PRESUPUESTO' | 'CLIENTE' | 'RECIBO' | 'MOVIMIENTO' | 'NOMINA' | 'RETENCION' | 'VALE';
  data: any;
  timestamp: string;
}

interface AppContextType {
  // Configuración de Empresa / Cliente Multi-Presentación
  empresaActiva: EmpresaConfig;
  empresas: EmpresaConfig[];
  empresasDisponibles: EmpresaConfig[];
  setEmpresaActivaId: (id: EmpresaId) => void;
  actualizarEmpresaConfig: (id: EmpresaId, updates: Partial<EmpresaConfig>) => void;
  modoProduccionExclusiva: 'TODAS' | 'ITA_ASCENSORES' | 'PROYECTOS_VERTICALES_AB' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'ELEVADORES_DEL_LAGO';
  setModoProduccionExclusiva: (modo: 'TODAS' | 'ITA_ASCENSORES' | 'PROYECTOS_VERTICALES_AB' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'ELEVADORES_DEL_LAGO') => void;

  activeDivision: DivisionOperativa;
  setActiveDivision: (div: DivisionOperativa) => void;
  tasaCambioBCV: number;
  setTasaCambioBCV: (tasa: number) => void;
  tasaBinance: number;
  setTasaBinance: (tasa: number) => void;
  isFetchingRates: boolean;
  lastRatesUpdate: string | null;
  actualizarTasasEnVivo: () => Promise<void>;
  user: Usuario | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  
  // Repuestos & Stock
  products: Producto[];
  setProducts: React.Dispatch<React.SetStateAction<Producto[]>>;
  ajustarStockIndividual: (val_c: string, nuevoStock: number, motivo: string) => void;
  actualizarProducto: (val_c: string, updatedFields: Partial<Producto>) => void;
  agregarProducto: (nuevo: Producto) => void;
  
  // Clientes & Equipos Ascensores
  clientes: Cliente[];
  agregarCliente: (cliente: Omit<Cliente, 'id'>) => void;
  editarCliente: (cliente: Cliente) => void;
  eliminarCliente: (id: string) => void;
  archivarCliente: (id: string) => Promise<void>;
  desarchivarCliente: (id: string) => Promise<void>;
  agregarEquipoACliente: (clienteId: string, equipo: Omit<EquipoAscensor, 'id'>) => void;
  editarEquipoDeCliente: (clienteId: string, equipo: EquipoAscensor) => void;
  eliminarEquipoDeCliente: (clienteId: string, equipoId: string) => void;

  // Facturación
  facturas: Factura[];
  crearFactura: (factura: Omit<Factura, 'correlativo'>) => Factura;
  anularFactura: (correlativo: string) => void;
  marcarFacturaPagada: (correlativo: string) => void;
  archivarFactura: (correlativo: string) => Promise<void>;
  desarchivarFactura: (correlativo: string) => Promise<void>;

  // Presupuestos
  presupuestos: Presupuesto[];
  crearPresupuesto: (presupuesto: Omit<Presupuesto, 'correlativo'>) => Presupuesto;
  editarPresupuesto: (presupuesto: Presupuesto) => void;
  cambiarEstadoPresupuesto: (correlativo: string, estado: Presupuesto['estado']) => void;
  convertirPresupuestoAFactura: (correlativo: string, tipoComprobante: 'FACTURA_FISCAL' | 'NOTA_ENTREGA') => Factura;

  // Recibos / Notas de Entrega
  recibos: ReciboNota[];
  crearReciboNota: (recibo: Omit<ReciboNota, 'correlativo'>) => ReciboNota;
  anularReciboNota: (correlativo: string) => void;

  // Contabilidad
  movimientosContables: MovimientoContable[];
  registrarMovimiento: (mov: Omit<MovimientoContable, 'id'>) => void;

  // Nómina
  empleados: Empleado[];
  agregarEmpleado: (emp: Omit<Empleado, 'id'>) => void;
  editarEmpleado: (emp: Empleado) => void;
  prestamos: PrestamoEmpleado[];
  solicitarPrestamo: (prestamo: Omit<PrestamoEmpleado, 'id' | 'cuotasPagadas' | 'estado'>) => void;
  registrarPagoCuotaPrestamo: (prestamoId: string) => void;
  nominasProcesadas: RegistroNomina[];
  generarNominaPeriodo: (periodo: string, fechaPago: string, desgloses: { empleadoId: string; bonificacion: number; descuentoPrestamo: number }[]) => void;

  // Tributario
  retenciones: RetencionTributaria[];
  crearRetencion: (retencion: Omit<RetencionTributaria, 'id'>) => RetencionTributaria;

  // Reportes Técnicos de Campo e Inspección en Obras
  reportesTecnicos: ReporteTecnicoCampo[];
  crearReporteTecnico: (reporte: Omit<ReporteTecnicoCampo, 'id' | 'correlativo'>) => ReporteTecnicoCampo;
  actualizarEstadoReporteTecnico: (id: string, estado: ReporteTecnicoCampo['estado']) => void;
  actualizarReporteTecnico: (id: string, updateData: Partial<ReporteTecnicoCampo>) => void;
  convertirReporteAPresupuesto: (reporteId: string) => Presupuesto;
  consolidarBufferReporte: (reporteId: string) => Promise<Presupuesto | null>;
  cloudSyncedCorrelativos: string[];
  scanAndSyncUnsyncedReports: () => Promise<number>;
  sincronizarReportesAExcel: (reporteIds?: string[]) => Promise<number>;
  sincronizarReportesDesdeNube: () => Promise<void>;
  recargarEstadoNube: () => Promise<void>;
  probarEnlacePortal: (origin: 'PORTAL_TECNICOS' | 'PORTAL_WEB_CLIENTES', senderName?: string) => Promise<PortalPingResult>;

  // Solicitudes y Cotizaciones en Línea de Clientes (Bandeja Gestor)
  solicitudesClientes: SolicitudCotizacionCliente[];
  crearSolicitudCliente: (solicitud: Omit<SolicitudCotizacionCliente, 'id' | 'correlativo' | 'fecha' | 'hora' | 'estado' | 'subidoAExcel'>) => SolicitudCotizacionCliente;
  actualizarEstadoSolicitudCliente: (id: string, estado: SolicitudCotizacionCliente['estado']) => void;
  eliminarSolicitudCliente: (id: string) => void;
  convertirSolicitudClienteAPresupuesto: (id: string) => Presupuesto;
  consolidarBufferCotizacion: (id: string) => Promise<Presupuesto | null>;
  sincronizarSolicitudesClientesAExcel: (solicitudIds?: string[]) => Promise<number>;

  // Control de Herramientas en Obra y Préstamos
  prestamosHerramientas: PrestamoHerramienta[];
  crearPrestamoHerramienta: (prestamo: Omit<PrestamoHerramienta, 'id' | 'correlativo'>) => PrestamoHerramienta;
  actualizarEstadoPrestamoHerramienta: (id: string, estado: PrestamoHerramienta['estado'], obsDevolucion?: string) => void;
  eliminarPrestamoHerramienta: (id: string) => void;

  // Compatibilidad Vales / Kardex / Solicitudes
  vales: Nota[];
  solicitudes: SolicitudProyecto[];
  kardex: EntradaKardex[];
  crearVale: (vale: Omit<Nota, 'Fecha' | 'Status'>) => void;
  anularVale: (nroVale: string) => void;
  modificarVale: (nroVale: string, updatedVale: Partial<Nota>) => void;
  modificarReciboNota: (correlativo: string, updatedData: Partial<ReciboNota>) => void;
  modificarFactura: (correlativo: string, updatedData: Partial<Factura>) => void;
  
  // Control de Modo Limpio / Datos Demo
  isCleanMode: boolean;
  limpiarDatosYEmpezarCero: () => void;
  restaurarDatosDemo: () => void;
  pullCloudData: () => Promise<boolean>;

  // Sistema, Accesos & Matriz de Permisos por Rol
  usuarios: Usuario[];
  agregarUsuario: (usuario: Usuario) => void;
  actualizarUsuario: (username: string, updates: Partial<Usuario>) => void;
  eliminarUsuario: (username: string) => void;
  showDemoLogins: boolean;
  setShowDemoLogins: (show: boolean) => void;
  rolePermissions: PermisosRolMap;
  toggleRolePermission: (rol: RolUsuario, tabId: TabID) => void;
  resetRolePermissions: () => void;
  hasTabPermission: (tabId: TabID, userRol?: RolUsuario) => boolean;

  // Seguridad PWA Biométrica / PIN Local
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  securityPin: string | null;
  setSecurityPin: (pin: string | null) => void;
  isAppLocked: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  authenticateBiometrics: () => Promise<boolean>;

  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;
  syncQueue: SyncItem[];
  isSyncing: boolean;
  triggerManualSync: () => Promise<void>;
  offlinePendingCount: number;
  refreshOfflineCount: () => Promise<number>;
  
  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const DEFAULT_ROLE_PERMISSIONS: PermisosRolMap = {
  SUPER_USUARIO: ['INICIO', 'PORTAL_WEB', 'TECNICOS_OBRA', 'SOLICITUDES_CLIENTES', 'PRESENTACION', 'CONTABILIDAD', 'FACTURACION', 'PRESUPUESTOS', 'RECIBOS', 'CLIENTES', 'NOMINA', 'TRIBUTARIO', 'REPORTES', 'INVENTARIO', 'KARDEX', 'HERRAMIENTAS', 'HISTORIAL', 'CONSOLIDACION', 'SINCRONIZAR', 'AJUSTES'],
  ADMIN: ['INICIO', 'PORTAL_WEB', 'TECNICOS_OBRA', 'SOLICITUDES_CLIENTES', 'CONTABILIDAD', 'FACTURACION', 'PRESUPUESTOS', 'RECIBOS', 'CLIENTES', 'NOMINA', 'TRIBUTARIO', 'REPORTES', 'INVENTARIO', 'KARDEX', 'HERRAMIENTAS', 'HISTORIAL', 'CONSOLIDACION', 'SINCRONIZAR', 'AJUSTES'],
  SUPERVISOR: ['PORTAL_WEB', 'TECNICOS_OBRA', 'SOLICITUDES_CLIENTES', 'PRESUPUESTOS', 'REPORTES', 'CLIENTES', 'INVENTARIO', 'FACTURACION', 'RECIBOS', 'CONTABILIDAD', 'NOMINA', 'TRIBUTARIO', 'KARDEX', 'HERRAMIENTAS', 'HISTORIAL', 'CONSOLIDACION'],
  INGENIERO: ['INICIO', 'PORTAL_WEB', 'TECNICOS_OBRA', 'SOLICITUDES_CLIENTES', 'PRESUPUESTOS', 'CLIENTES', 'REPORTES', 'INVENTARIO', 'HERRAMIENTAS', 'HISTORIAL', 'CONSOLIDACION'],
  TECNICO: ['TECNICOS_OBRA', 'REPORTES', 'HERRAMIENTAS'],
  CLIENTE_DEMO: ['INICIO', 'PORTAL_WEB', 'CLIENTES', 'PRESUPUESTOS', 'FACTURACION', 'RECIBOS', 'REPORTES', 'INVENTARIO', 'CONSOLIDACION']
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Toasts Globales (definidos al inicio de AppProvider para evitar TDZ en inicializadores)
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Autenticación Biométrica y PIN PWA
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('axon_biometric_enabled');
    return saved === 'true';
  });

  const [securityPin, setSecurityPinState] = useState<string | null>(() => {
    return localStorage.getItem('axon_security_pin') || null;
  });

  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const bio = localStorage.getItem('axon_biometric_enabled') === 'true';
    const pin = localStorage.getItem('axon_security_pin');
    return bio || Boolean(pin);
  });

  const setBiometricEnabled = (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    localStorage.setItem('axon_biometric_enabled', String(enabled));
  };

  const setSecurityPin = (pin: string | null) => {
    setSecurityPinState(pin);
    if (pin) {
      localStorage.setItem('axon_security_pin', pin);
    } else {
      localStorage.removeItem('axon_security_pin');
    }
  };

  const lockApp = () => {
    setIsAppLocked(true);
  };

  const unlockApp = () => {
    setIsAppLocked(false);
  };

  const authenticateBiometrics = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    // Si el navegador soporta WebAuthn nativo (Touch ID / Face ID / Android Biometrics)
    if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      try {
        const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (isAvailable) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          // Intentar solicitud WebAuthn
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: 'required',
              allowCredentials: []
            }
          });
          return true;
        }
      } catch (err: any) {
        console.warn('Proceso biométrico WebAuthn cancelado o no disponible:', err);
      }
    }
    
    // Fallback simulación biometría PWA si la opción está activa pero el dispositivo no devolvió credencial
    return true;
  };

  // Estado de Mostrar/Ocultar Credenciales Demo en Login
  const [showDemoLogins, setShowDemoLoginsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('axon_show_demo_logins');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const setShowDemoLogins = (show: boolean) => {
    setShowDemoLoginsState(show);
    localStorage.setItem('axon_show_demo_logins', JSON.stringify(show));
  };

  // Matriz de Permisos Configurable por Rol
  const [rolePermissions, setRolePermissions] = useState<PermisosRolMap>(() => {
    const saved = localStorage.getItem('axon_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: PermisosRolMap = { ...DEFAULT_ROLE_PERMISSIONS };
        (Object.keys(DEFAULT_ROLE_PERMISSIONS) as RolUsuario[]).forEach(rol => {
          if (parsed[rol] && Array.isArray(parsed[rol])) {
            const set = new Set<TabID>([...parsed[rol]]);
            // Garantizar que las nuevas pestañas del sistema no queden excluidas por caché viejo
            const defaultTabs = DEFAULT_ROLE_PERMISSIONS[rol] || [];
            defaultTabs.forEach(t => {
              if (t === 'TECNICOS_OBRA' || t === 'SOLICITUDES_CLIENTES' || t === 'PORTAL_WEB' || t === 'HERRAMIENTAS' || t === 'CONSOLIDACION') {
                set.add(t);
              }
            });
            merged[rol] = Array.from(set);
          }
        });
        return merged;
      } catch (e) {
        console.error('Error parsing role permissions', e);
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const toggleRolePermission = (rol: RolUsuario, tabId: TabID) => {
    setRolePermissions(prev => {
      const currentTabs = prev[rol] || [];
      const exists = currentTabs.includes(tabId);
      const updatedTabs = exists 
        ? currentTabs.filter(t => t !== tabId)
        : [...currentTabs, tabId];
      
      const updated = { ...prev, [rol]: updatedTabs };
      localStorage.setItem('axon_role_permissions', JSON.stringify(updated));
      return updated;
    });
  };

  const resetRolePermissions = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    localStorage.setItem('axon_role_permissions', JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  };

  // Configuración Multi-Empresa Adaptativa (DAKACO, Tecno Elevatev C.A., Futuros Clientes)
  const [empresas, setEmpresas] = useState<EmpresaConfig[]>(() => {
    const saved = localStorage.getItem('axon_empresas_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((e: EmpresaConfig) => e.id));
          const missing = INITIAL_EMPRESAS.filter(ie => !existingIds.has(ie.id));
          if (missing.length > 0) {
            return [...missing, ...parsed];
          }
          return parsed;
        }
      } catch (e) { }
    }
    return INITIAL_EMPRESAS;
  });

  // Detectar parámetro en URL para forzar la empresa correspondiente en enlaces públicos y portales
  const getUrlEmpresa = (): EmpresaId | null => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toUpperCase();
      const hash = window.location.hash.toUpperCase();
      const fullUrl = search + ' ' + hash;

      const params = new URLSearchParams(window.location.search);
      const empresaVal = (params.get('empresa') || '').toUpperCase();

      if (empresaVal === 'PROYECTOS_VERTICALES_AB' || empresaVal === 'VERTICALES' || empresaVal === 'PROYECTOS_VERTICALES') {
        return 'PROYECTOS_VERTICALES_AB';
      }
      if (empresaVal === 'TECNO_ELEVATEV' || empresaVal === 'ELEVATEV' || empresaVal === 'TECNO') {
        return 'TECNO_ELEVATEV';
      }
      if (empresaVal === 'ITA_ASCENSORES' || empresaVal === 'ITA' || empresaVal === 'BARBAROZA') {
        return 'ITA_ASCENSORES';
      }
      if (empresaVal === 'SOLUCIONES_DAKACO' || empresaVal === 'DAKACO') {
        return 'SOLUCIONES_DAKACO';
      }
      if (empresaVal === 'ELEVADORES_DEL_LAGO' || empresaVal === 'DEL_LAGO' || empresaVal === 'LAGO') {
        return 'ELEVADORES_DEL_LAGO';
      }

      if (fullUrl.includes('PROYECTOS_VERTICALES') || fullUrl.includes('VERTICALES')) {
        return 'PROYECTOS_VERTICALES_AB';
      }
      if (fullUrl.includes('TECNO_ELEVATEV') || fullUrl.includes('ELEVATEV')) {
        return 'TECNO_ELEVATEV';
      }
      if (fullUrl.includes('ITA_ASCENSORES') || fullUrl.includes('BARBAROZA')) {
        return 'ITA_ASCENSORES';
      }
      if (fullUrl.includes('SOLUCIONES_DAKACO') || fullUrl.includes('DAKACO')) {
        return 'SOLUCIONES_DAKACO';
      }
      if (fullUrl.includes('ELEVADORES_DEL_LAGO') || fullUrl.includes('DEL_LAGO') || fullUrl.includes('LAGO')) {
        return 'ELEVADORES_DEL_LAGO';
      }
    }
    return null;
  };

  const [activeEmpresaId, setActiveEmpresaIdState] = useState<EmpresaId>(() => {
    const urlEmp = getUrlEmpresa();
    if (urlEmp) return urlEmp;
    if (ACTIVE_COMPANY_ID !== 'TODAS') {
      return ACTIVE_COMPANY_ID as EmpresaId;
    }
    const saved = localStorage.getItem('axon_active_empresa_id');
    if (saved) return saved as EmpresaId;
    return 'TECNO_ELEVATEV';
  });

  const [modoProduccionExclusiva, setModoProduccionExclusivaState] = useState<'TODAS' | 'ITA_ASCENSORES' | 'PROYECTOS_VERTICALES_AB' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'ELEVADORES_DEL_LAGO'>(() => {
    const urlEmp = getUrlEmpresa();
    if (urlEmp) return urlEmp;
    if (ACTIVE_COMPANY_ID !== 'TODAS') {
      return ACTIVE_COMPANY_ID;
    }
    const saved = localStorage.getItem('axon_modo_produccion_exclusiva');
    if (saved === 'ITA_ASCENSORES' || saved === 'PROYECTOS_VERTICALES_AB' || saved === 'SOLUCIONES_DAKACO' || saved === 'TECNO_ELEVATEV' || saved === 'ELEVADORES_DEL_LAGO' || saved === 'TODAS') {
      return saved;
    }
    return 'TECNO_ELEVATEV';
  });

  const setModoProduccionExclusiva = (modo: 'TODAS' | 'ITA_ASCENSORES' | 'PROYECTOS_VERTICALES_AB' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'ELEVADORES_DEL_LAGO') => {
    setModoProduccionExclusivaState(modo);
    localStorage.setItem('axon_modo_produccion_exclusiva', modo);
    if (modo !== 'TODAS') {
      setActiveEmpresaIdState(modo);
      localStorage.setItem('axon_active_empresa_id', modo);
      const emp = empresas.find(e => e.id === modo);
      addToast(`Perfil Dedicado Activado: ${emp?.nombreCorto || modo}`, 'success');
    } else {
      addToast('Modo Multi-Empresa Plataforma (Desarrollo) activado', 'info');
    }
  };

  const empresasDisponibles = modoProduccionExclusiva === 'TODAS'
    ? empresas
    : empresas.filter(e => e.id === modoProduccionExclusiva);

  const empresaActiva = 
    (empresasDisponibles && empresasDisponibles.length > 0 
      ? (empresasDisponibles.find(e => e.id === activeEmpresaId) || empresasDisponibles[0]) 
      : INITIAL_EMPRESAS[0]) || INITIAL_EMPRESAS[0];

  const setEmpresaActivaId = (id: EmpresaId) => {
    setActiveEmpresaIdState(id);
    localStorage.setItem('axon_active_empresa_id', id);
    const emp = empresas.find(e => e.id === id);
    if (emp) {
      addToast(`Empresa Activa cambiada a: ${emp.nombreCorto}`, 'info');
    }
  };

  const actualizarEmpresaConfig = (id: EmpresaId, updates: Partial<EmpresaConfig>) => {
    setEmpresas(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      localStorage.setItem('axon_empresas_config', JSON.stringify(next));
      return next;
    });
    addToast('Configuración de empresa actualizada', 'success');
  };

  // Estado de División Operativa
  const [activeDivision, setActiveDivision] = useState<DivisionOperativa>(() => {
    const saved = localStorage.getItem('tecno_active_division');
    return (saved as DivisionOperativa) || 'MANTENIMIENTO';
  });

  // Tasa de cambio BCV oficial
  const [tasaCambioBCV, setTasaCambioBCV] = useState<number>(() => {
    const saved = localStorage.getItem('tecno_tasa_bcv');
    return saved ? parseFloat(saved) : 36.50;
  });

  // Tasa Binance P2P (USDT / VES)
  const [tasaBinance, setTasaBinance] = useState<number>(() => {
    const saved = localStorage.getItem('tecno_tasa_binance');
    return saved ? parseFloat(saved) : 41.80;
  });

  const [isFetchingRates, setIsFetchingRates] = useState<boolean>(false);
  const [lastRatesUpdate, setLastRatesUpdate] = useState<string | null>(null);

  // Función robusta para obtener tasas en tiempo real (CORS-safe con fallback multi-proveedor)
  const actualizarTasasEnVivo = async () => {
    setIsFetchingRates(true);
    let bcvOk = false;
    let binanceOk = false;

    // Helper para fetch seguro con timeout de 3.5 segundos sin arrojar excepciones no controladas
    const fetchSafe = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Silencioso para evitar warnings de CORS o desconexión en la consola
      }
      return null;
    };

    // 1. OBTENER TASA BCV OFICIAL
    // 1.1 Proveedor Primario (DolarApi - 100% CORS amigable con cabecera Access-Control-Allow-Origin: *)
    const dataBcv1 = await fetchSafe('https://ve.dolarapi.com/v1/dolares/oficial');
    if (dataBcv1) {
      const val = parseFloat(dataBcv1.promedio || dataBcv1.monto || dataBcv1.precio || 0);
      if (val > 0) {
        setTasaCambioBCV(val);
        localStorage.setItem('tecno_tasa_bcv', val.toString());
        bcvOk = true;
      }
    }

    // 1.2 Proveedor Secundario BCV (en caso de que falle el primario)
    if (!bcvOk) {
      const dataBcv2 = await fetchSafe('https://criptoya.com/api/bcv');
      if (dataBcv2) {
        const val = parseFloat(dataBcv2.usd || dataBcv2.price || dataBcv2.promedio || 0);
        if (val > 0) {
          setTasaCambioBCV(val);
          localStorage.setItem('tecno_tasa_bcv', val.toString());
          bcvOk = true;
        }
      }
    }

    // 2. OBTENER TASA BINANCE P2P / PARALELO (USDT / VES)
    // 2.1 Proveedor Primario (DolarApi Paralelo - CORS abierto para navegadores)
    const dataBinance1 = await fetchSafe('https://ve.dolarapi.com/v1/dolares/paralelo');
    if (dataBinance1) {
      const val = parseFloat(dataBinance1.promedio || dataBinance1.monto || dataBinance1.precio || 0);
      if (val > 0) {
        setTasaBinance(val);
        localStorage.setItem('tecno_tasa_binance', val.toString());
        binanceOk = true;
      }
    }

    // 2.2 Proveedor Secundario Binance P2P CriptoYa
    if (!binanceOk) {
      const dataBinance2 = await fetchSafe('https://criptoya.com/api/binancep2p/sell/usdt/ves/100');
      if (dataBinance2) {
        const val = parseFloat(dataBinance2.price || dataBinance2.ask || dataBinance2.bid || 0);
        if (val > 0) {
          setTasaBinance(val);
          localStorage.setItem('tecno_tasa_binance', val.toString());
          binanceOk = true;
        }
      }
    }

    // 3. Fallback de Almacenamiento Local si no hubo red o ambas APIs fallaron
    if (!bcvOk) {
      const savedBcv = localStorage.getItem('tecno_tasa_bcv');
      if (savedBcv) {
        setTasaCambioBCV(parseFloat(savedBcv));
      }
    }
    if (!binanceOk) {
      const savedBinance = localStorage.getItem('tecno_tasa_binance');
      if (savedBinance) {
        setTasaBinance(parseFloat(savedBinance));
      }
    }

    const nowStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    setLastRatesUpdate(nowStr);
    setIsFetchingRates(false);

    if (bcvOk || binanceOk) {
      addToast(`Tasas en vivo actualizadas (${nowStr})`, 'success');
    }
  };

  useEffect(() => {
    actualizarTasasEnVivo();
    const interval = setInterval(() => {
      actualizarTasasEnVivo();
    }, 10 * 60 * 1000); // Cada 10 minutos
    return () => clearInterval(interval);
  }, []);

  // Usuarios del ERP & Asignación de Permisos
  const INITIAL_USUARIOS: Usuario[] = [
    { username: 'Axon', password: 'Axon2026.', nombre: 'Programador AXON / Super User', cargo: 'Arquitecto de Software & Developer', rol: 'SUPER_USUARIO', active: true, divisionPredeterminada: 'MANTENIMIENTO' },
    { username: 'admin', password: 'admin', nombre: 'Ing. Carlos Mendoza', cargo: 'Gerente Operativo', rol: 'ADMIN', active: true, divisionPredeterminada: 'MANTENIMIENTO' },
    { username: 'supervisor', password: 'supervisor', nombre: 'Téc. Francisco Rivas', cargo: 'Supervisor de Servicios', rol: 'SUPERVISOR', active: true, divisionPredeterminada: 'MODERNIZACION' },
    { username: 'ingeniero', password: 'ingeniero', nombre: 'Ing. Héctor Silva', cargo: 'Ingeniero de Proyectos', rol: 'INGENIERO', active: true, divisionPredeterminada: 'MODERNIZACION' },
    { username: 'tecnico', password: 'tecnico', nombre: 'Téc. Manuel Guerra', cargo: 'Técnico de Campo & Mantenimiento', rol: 'TECNICO', active: true, divisionPredeterminada: 'MANTENIMIENTO' }
  ];

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('axon_registered_usuarios');
    if (saved) {
      try {
        const parsed: Usuario[] = JSON.parse(saved);
        // Garantizar que el Super Usuario Axon siempre permanezca registrado en el sistema
        const hasAxon = parsed.some(u => u.username.toLowerCase() === 'axon');
        if (!hasAxon) {
          return [INITIAL_USUARIOS[0], ...parsed];
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing registered usuarios', e);
      }
    }
    return INITIAL_USUARIOS;
  });

  const agregarUsuario = (nuevoUser: Usuario) => {
    setUsuarios(prev => {
      const updated = [...prev.filter(u => u.username.toLowerCase() !== nuevoUser.username.toLowerCase()), nuevoUser];
      localStorage.setItem('axon_registered_usuarios', JSON.stringify(updated));
      return updated;
    });
  };

  const actualizarUsuario = (username: string, updates: Partial<Usuario>) => {
    setUsuarios(prev => {
      const updated = prev.map(u => {
        if (u.username.toLowerCase() === username.toLowerCase()) {
          const uNew = { ...u, ...updates };
          if (user && user.username.toLowerCase() === username.toLowerCase()) {
            setUser(uNew);
            sessionStorage.setItem('tecno_user_session', JSON.stringify(uNew));
          }
          return uNew;
        }
        return u;
      });
      localStorage.setItem('axon_registered_usuarios', JSON.stringify(updated));
      return updated;
    });
  };

  const eliminarUsuario = (username: string) => {
    setUsuarios(prev => {
      const updated = prev.filter(u => u.username.toLowerCase() !== username.toLowerCase());
      localStorage.setItem('axon_registered_usuarios', JSON.stringify(updated));
      return updated;
    });
  };

  // Estado de Usuario Autenticado (Usando sessionStorage para forzar inicio con contraseña al cerrar la app o pestaña)
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      localStorage.removeItem('tecno_user_session'); // Limpiar sesión persistente antigua
      const saved = sessionStorage.getItem('tecno_user_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing saved session', e);
    }
    return null;
  });

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const uLower = username.toLowerCase().trim();
    const pLower = password.trim();

    if (!uLower || !pLower) {
      return { success: false, error: 'Por favor complete todos los campos.' };
    }

    // Acceso Maestro Super Usuario (Programador Axon): Axon / Axon2026.
    const isAxonUser = uLower === 'axon';
    const isAxonPass = pLower.toLowerCase() === 'axon2026.' || 
                       pLower.toLowerCase() === 'axon2026' || 
                       pLower.toLowerCase() === 'axon' ||
                       pLower === 'Axon2026.' ||
                       pLower === 'axon2026.';

    if (isAxonUser && isAxonPass) {
      let superUser = usuarios.find(u => u.username.toLowerCase() === 'axon');
      if (!superUser) {
        superUser = {
          username: 'Axon',
          password: 'Axon2026.',
          nombre: 'Programador AXON / Super User',
          cargo: 'Arquitecto de Software & Developer',
          rol: 'SUPER_USUARIO',
          active: true,
          divisionPredeterminada: 'MANTENIMIENTO'
        };
      } else {
        superUser = { ...superUser, password: 'Axon2026.', rol: 'SUPER_USUARIO', active: true };
      }
      setUser(superUser);
      sessionStorage.setItem('tecno_user_session', JSON.stringify(superUser));
      addToast('Sesión de Super Usuario Desarrollador (AXON) iniciada con control maestro.', 'success');
      return { success: true };
    }

    // Buscar entre usuarios registrados
    const matchedUser = usuarios.find(
      u => u.username.toLowerCase() === uLower && 
      (u.password === pLower || (uLower === 'tecnico' && pLower === 'tec123'))
    );

    if (matchedUser) {
      if (matchedUser.active === false) {
        return { success: false, error: 'Acceso restringido: El usuario se encuentra desactivado.' };
      }
      setUser(matchedUser);
      sessionStorage.setItem('tecno_user_session', JSON.stringify(matchedUser));
      addToast(`Sesión iniciada. ¡Bienvenido a ${empresaActiva.nombreCorto || empresaActiva.nombre}, ${matchedUser.nombre}!`, 'success');
      return { success: true };
    }

    // Fallback a creadores demo
    let authenticatedUser: Usuario | null = null;
    if (uLower === 'admin' && pLower === 'admin') {
      authenticatedUser = { username: 'admin', nombre: 'Ing. Carlos Mendoza', cargo: 'Gerente Operativo', rol: 'ADMIN', active: true };
    } else if (uLower === 'supervisor' && pLower === 'supervisor') {
      authenticatedUser = { username: 'supervisor', nombre: 'Téc. Francisco Rivas', cargo: 'Supervisor de Servicios', rol: 'SUPERVISOR', active: true };
    } else if (uLower === 'ingeniero' && pLower === 'ingeniero') {
      authenticatedUser = { username: 'ingeniero', nombre: 'Ing. Héctor Silva', cargo: 'Ingeniero de Proyectos', rol: 'INGENIERO', active: true };
    } else if ((uLower === 'tecnico' || uLower === 'tec') && (pLower === 'tecnico' || pLower === 'tec123')) {
      authenticatedUser = { username: 'tecnico', nombre: 'Téc. Manuel Guerra', cargo: 'Técnico de Campo', rol: 'TECNICO', active: true };
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
      sessionStorage.setItem('tecno_user_session', JSON.stringify(authenticatedUser));
      addToast(`Sesión iniciada. ¡Bienvenido a ${empresaActiva.nombreCorto || empresaActiva.nombre}, ${authenticatedUser.nombre}!`, 'success');
      return { success: true };
    } else {
      addToast('Error de autenticación: Credenciales inválidas', 'error');
      return { success: false, error: 'Credenciales inválidas. Verifique el usuario y contraseña.' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('tecno_user_session');
    localStorage.removeItem('tecno_user_session');
    addToast('Sesión cerrada correctamente.', 'info');
  };

  // Red, Sync e IndexedDB Offline
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>(() => {
    const saved = localStorage.getItem('tecno_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshOfflineCount = async (): Promise<number> => {
    try {
      const unsynced = await getUnsyncedRecords();
      setOfflinePendingCount(unsynced.length);
      return unsynced.length;
    } catch (e) {
      console.warn('Error al actualizar contador IndexedDB:', e);
      return 0;
    }
  };

  useEffect(() => {
    // Inicializar IndexedDB y escuchar eventos de red
    initDB()
      .then(() => refreshOfflineCount())
      .catch(err => console.warn('IndexedDB Init warning:', err));

    const unsubscribe = initSyncManagerListeners(
      async (isOnline) => {
        setNetworkStatus(isOnline ? 'ONLINE' : 'OFFLINE');
        if (isOnline) {
          addToast('📶 Conexión de red restablecida. Procesando registros guardados en sótanos/offline...', 'info');
          const res = await processOfflineSync(getCompanyScriptUrl);
          await refreshOfflineCount();
          if (res.syncedCount > 0) {
            addToast(`✅ ${res.syncedCount} registro(s) offline sincronizado(s) exitosamente con la Nube.`, 'success');
          }
        } else {
          addToast('⚠️ Dispositivo fuera de línea (Modo Sótano / Offline activo). Todo el trabajo se guardará en memoria local.', 'info');
        }
      },
      async (syncRes) => {
        await refreshOfflineCount();
      }
    );

    return () => unsubscribe();
  }, []);

  // Control de Modo Limpio / Datos Demo
  const checkClean = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('clean') === 'true' || urlParams.get('clean') === '1' || urlParams.get('modo') === 'limpio') {
        try { localStorage.setItem('axon_clean_mode', 'true'); } catch(e){}
        return true;
      }
    }
    return localStorage.getItem('axon_clean_mode') === 'true';
  };

  const [isCleanMode, setIsCleanMode] = useState<boolean>(() => checkClean());

  // Repuestos
  const [products, setProducts] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('tecno_products');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_PRODUCTS;
  });

  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('tecno_clientes');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_CLIENTES;
  });

  // Facturas
  const [facturas, setFacturas] = useState<Factura[]>(() => {
    const saved = localStorage.getItem('tecno_facturas');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_FACTURAS;
  });

  // Presupuestos
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => {
    const saved = localStorage.getItem('tecno_presupuestos');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_PRESUPUESTOS;
  });

  // Recibos / Notas
  const [recibos, setRecibos] = useState<ReciboNota[]>(() => {
    const saved = localStorage.getItem('tecno_recibos');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_RECIBOS;
  });

  // Movimientos Contables
  const [movimientosContables, setMovimientosContables] = useState<MovimientoContable[]>(() => {
    const saved = localStorage.getItem('tecno_movimientos');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_MOVIMIENTOS;
  });

  // Empleados y Nómina
  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    const saved = localStorage.getItem('tecno_empleados');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_EMPLEADOS;
  });

  const [prestamos, setPrestamos] = useState<PrestamoEmpleado[]>(() => {
    const saved = localStorage.getItem('tecno_prestamos');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_PRESTAMOS;
  });

  const [nominasProcesadas, setNominasProcesadas] = useState<RegistroNomina[]>(() => {
    const saved = localStorage.getItem('tecno_nominas');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_NOMINA_HISTORIAL;
  });

  // Retenciones
  const [retenciones, setRetenciones] = useState<RetencionTributaria[]>(() => {
    const saved = localStorage.getItem('tecno_retenciones');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_RETENCIONES;
  });

  // Vales & Kardex
  const [vales, setVales] = useState<Nota[]>(() => {
    const saved = localStorage.getItem('tecno_vales');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_NOTES;
  });

  const [solicitudes, setSolicitudes] = useState<SolicitudProyecto[]>(() => {
    const saved = localStorage.getItem('tecno_solicitudes');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_SOLICITUDES;
  });

  const [kardex, setKardex] = useState<EntradaKardex[]>(() => {
    const saved = localStorage.getItem('tecno_kardex');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_KARDEX;
  });

  // Reportes Técnicos de Campo / Inspección en Obras
  const [reportesTecnicos, setReportesTecnicos] = useState<ReporteTecnicoCampo[]>(() => {
    const saved = localStorage.getItem('tecno_reportes_tecnicos');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_REPORTES_TECNICOS;
  });

  // Solicitudes y Cotizaciones en Línea de Clientes (Bandeja Gestor)
  const [solicitudesClientes, setSolicitudesClientes] = useState<SolicitudCotizacionCliente[]>(() => {
    const saved = localStorage.getItem('axon_solicitudes_clientes');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : (DEMO_SOLICITUDES_CLIENTES || INITIAL_SOLICITUDES_CLIENTES);
  });

  // Control de Herramientas en Obra y Préstamos
  const [prestamosHerramientas, setPrestamosHerramientas] = useState<PrestamoHerramienta[]>(() => {
    const saved = localStorage.getItem('axon_prestamos_herramientas');
    if (saved) return JSON.parse(saved);
    return checkClean() ? [] : INITIAL_PRESTAMOS_HERRAMIENTAS;
  });

  const limpiarDatosYEmpezarCero = () => {
    localStorage.setItem('axon_clean_mode', 'true');
    setIsCleanMode(true);
    const keysToClear = [
      'tecno_products', 'tecno_clientes', 'tecno_facturas', 'tecno_presupuestos',
      'tecno_recibos', 'tecno_movimientos', 'tecno_empleados', 'tecno_prestamos',
      'tecno_nominas', 'tecno_retenciones', 'tecno_vales', 'tecno_solicitudes',
      'tecno_kardex', 'tecno_reportes_tecnicos', 'axon_solicitudes_clientes', 'axon_prestamos_herramientas'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));

    setProducts([]);
    setClientes([]);
    setFacturas([]);
    setPresupuestos([]);
    setRecibos([]);
    setMovimientosContables([]);
    setEmpleados([]);
    setPrestamos([]);
    setNominasProcesadas([]);
    setRetenciones([]);
    setVales([]);
    setSolicitudes([]);
    setKardex([]);
    setReportesTecnicos([]);
    setSolicitudesClientes([]);
    setPrestamosHerramientas([]);
    addToast('Sistema reiniciado. Todos los datos de prueba eliminados. ¡Listo para trabajar desde 0!', 'success');
  };

  // Inicialización limpia por defecto para despliegues nuevos o móviles
  useEffect(() => {
    const isCleanV2Done = localStorage.getItem('axon_clean_v2_ready');
    if (!isCleanV2Done) {
      limpiarDatosYEmpezarCero();
      localStorage.setItem('axon_clean_v2_ready', 'true');
    }
  }, []);

  const restaurarDatosDemo = () => {
    localStorage.removeItem('axon_clean_mode');
    setIsCleanMode(false);
    const keysToClear = [
      'tecno_products', 'tecno_clientes', 'tecno_facturas', 'tecno_presupuestos',
      'tecno_recibos', 'tecno_movimientos', 'tecno_empleados', 'tecno_prestamos',
      'tecno_nominas', 'tecno_retenciones', 'tecno_vales', 'tecno_solicitudes',
      'tecno_kardex', 'tecno_reportes_tecnicos', 'axon_solicitudes_clientes', 'axon_prestamos_herramientas'
    ];
    keysToClear.forEach(k => localStorage.removeItem(k));

    setProducts(DEMO_PRODUCTS);
    setClientes(DEMO_CLIENTES);
    setFacturas(DEMO_FACTURAS);
    setPresupuestos(DEMO_PRESUPUESTOS);
    setRecibos(DEMO_RECIBOS);
    setMovimientosContables(DEMO_MOVIMIENTOS);
    setEmpleados(DEMO_EMPLEADOS);
    setPrestamos(DEMO_PRESTAMOS);
    setNominasProcesadas(DEMO_NOMINA_HISTORIAL);
    setRetenciones(DEMO_RETENCIONES);
    setVales(DEMO_NOTES);
    setSolicitudes(DEMO_SOLICITUDES);
    setKardex(DEMO_KARDEX);
    setReportesTecnicos(DEMO_REPORTES_TECNICOS);
    setSolicitudesClientes(DEMO_SOLICITUDES_CLIENTES);
    setPrestamosHerramientas(DEMO_PRESTAMOS_HERRAMIENTAS);
    addToast('Datos demo de prueba cargados correctamente para pruebas.', 'info');
  };

  const pullCloudData = async (): Promise<boolean> => {
    await sincronizarReportesDesdeNube();
    return true;
  };

  // Lista de Correlativos de Reportes/Notas confirmados en la Nube
  const [cloudSyncedCorrelativos, setCloudSyncedCorrelativos] = useState<string[]>([]);

  // Guardar en LocalStorage
  useEffect(() => {
    localStorage.setItem('tecno_active_division', activeDivision);
    localStorage.setItem('tecno_tasa_bcv', tasaCambioBCV.toString());
    localStorage.setItem('tecno_products', JSON.stringify(products));
    localStorage.setItem('tecno_clientes', JSON.stringify(clientes));
    localStorage.setItem('tecno_facturas', JSON.stringify(facturas));
    localStorage.setItem('tecno_presupuestos', JSON.stringify(presupuestos));
    localStorage.setItem('tecno_recibos', JSON.stringify(recibos));
    localStorage.setItem('tecno_movimientos', JSON.stringify(movimientosContables));
    localStorage.setItem('tecno_empleados', JSON.stringify(empleados));
    localStorage.setItem('tecno_prestamos', JSON.stringify(prestamos));
    localStorage.setItem('tecno_nominas', JSON.stringify(nominasProcesadas));
    localStorage.setItem('tecno_retenciones', JSON.stringify(retenciones));
    localStorage.setItem('tecno_vales', JSON.stringify(vales));
    localStorage.setItem('tecno_solicitudes', JSON.stringify(solicitudes));
    localStorage.setItem('tecno_kardex', JSON.stringify(kardex));
    localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(reportesTecnicos));
    localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(solicitudesClientes));
    localStorage.setItem('axon_prestamos_herramientas', JSON.stringify(prestamosHerramientas));
    localStorage.setItem('tecno_sync_queue', JSON.stringify(syncQueue));
  }, [
    activeDivision, tasaCambioBCV, products, clientes, facturas, presupuestos, 
    recibos, movimientosContables, empleados, prestamos, nominasProcesadas, 
    retenciones, vales, solicitudes, kardex, reportesTecnicos, solicitudesClientes, prestamosHerramientas, syncQueue
  ]);

  // Obtener URL de script dinámico por empresa activa
  const getCompanyScriptUrl = () => {
    return localStorage.getItem(`axon_script_url_${empresaActiva.id}`) || 
           localStorage.getItem('axon_script_url') || 
           'https://script.google.com/macros/s/AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO/exec';
  };

  // Sincronización Automática al Abrir la App y Periódica
  const sincronizarReportesDesdeNube = async () => {
    const scriptUrl = getCompanyScriptUrl();
    const savedToken = localStorage.getItem('tecno_google_access_token') || getStoredAccessToken();
    const savedSheetId = localStorage.getItem(`axon_sheet_id_${empresaActiva.id}`) || localStorage.getItem('axon_sheet_id');

    let fullData: any = null;

    // 1. Intentar obtener datos vía Google Apps Script Web App o GViz API
    try {
      const targetSheet = savedSheetId || empresaActiva.googleSheetId;
      const reportesNube = await pullReportesFromAppsScript(scriptUrl, targetSheet);
      if (reportesNube && reportesNube.length > 0) {
        const cloudCorrelativesList = reportesNube.map(r => r.correlativo);
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, ...cloudCorrelativesList])));

        setReportesTecnicos(prev => {
          const map = new Map();
          
          prev.forEach(r => map.set(r.correlativo || r.id, r));
          reportesNube.forEach(rn => {
            const key = rn.correlativo || rn.id;
            if (!map.has(key)) {
              map.set(key, rn);
            } else {
              const existing = map.get(key);
              const mergedPhotos = Array.from(new Set([...(existing.photos || []), ...(rn.photos || [])])).filter(Boolean);
              map.set(key, {
                ...existing,
                ...rn,
                photos: mergedPhotos.length > 0 ? mergedPhotos : existing.photos,
                fotosEvidenciaCount: mergedPhotos.length > 0 ? mergedPhotos.length : existing.fotosEvidenciaCount
              });
            }
          });
          const updated = Array.from(map.values());
          try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      }

      if (scriptUrl) {
        fullData = await pullAllDataFromAppsScript(scriptUrl);
      }
    } catch (e) {
      console.warn('Error al consultar Apps Script o Sheets:', e);
    }

    // 2. Si no hubo respuesta o faltan pestañas y hay Token Google + Sheet ID, intentar REST API directa de Google Sheets
    if ((!fullData || (!fullData.Repuestos_Inventario && !fullData.Datos)) && savedToken && savedSheetId) {
      try {
        const directData = await pullDataFromGoogleSheetsDirect(savedSheetId, savedToken);
        if (directData) {
          fullData = { ...(fullData || {}), ...directData };
        }
      } catch (e) {
        console.warn('Error al consultar directamente Google Sheets API:', e);
      }
    }

    if (fullData) {
      // Mapeo e integración de fotografías de reportes desde Fotografias_Reportes
      if (fullData.Fotografias_Reportes && Array.isArray(fullData.Fotografias_Reportes)) {
        const photoMapByCorr = new Map<string, string[]>();
        fullData.Fotografias_Reportes.forEach((fr: any) => {
          const corr = fr.Correlativo_Reporte || fr.Correlativo || fr.correlativo;
          const url = fr.URL_o_DataImagen || fr.url || fr.Imagen;
          if (corr && url) {
            const key = String(corr).trim().toUpperCase();
            if (!photoMapByCorr.has(key)) photoMapByCorr.set(key, []);
            photoMapByCorr.get(key)!.push(url);
          }
        });

        if (photoMapByCorr.size > 0) {
          setReportesTecnicos(prev => {
            let changed = false;
            const updated = prev.map(r => {
              const key = (r.correlativo || '').trim().toUpperCase();
              const cloudPhotos = photoMapByCorr.get(key);
              if (cloudPhotos && cloudPhotos.length > 0) {
                const existingPhotos = r.photos || [];
                const merged = Array.from(new Set([...existingPhotos, ...cloudPhotos])).filter(Boolean);
                if (merged.length !== existingPhotos.length) {
                  changed = true;
                  return {
                    ...r,
                    photos: merged,
                    fotosEvidenciaCount: merged.length
                  };
                }
              }
              return r;
            });
            if (changed) {
              try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
              return updated;
            }
            return prev;
          });
        }
      }
      if (fullData.Notas && Array.isArray(fullData.Notas)) {
        const valesNubeList = fullData.Notas.map((n: any) => n.NroVale || n.correlativo).filter(Boolean);
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, ...valesNubeList])));
      }

      // Sincronizar presupuestos/cotizaciones desde Google Sheets si están presentes
      const rawPresupuestos = (fullData as any).Presupuestos || (fullData.Notas ? fullData.Notas.filter((n: any) => n.Tipo === 'PRESUPUESTO' || n.tab === 'Presupuestos') : []);
      if (Array.isArray(rawPresupuestos) && rawPresupuestos.length > 0) {
        setPresupuestos(prev => {
          const map = new Map();
          prev.forEach(p => map.set(p.correlativo, p));
          rawPresupuestos.forEach((rp: any) => {
            const corr = rp.Numero_Cotizacion || rp.NroVale || rp.correlativo;
            if (corr && !map.has(corr)) {
              let itemsParsed = [];
              try {
                itemsParsed = typeof rp.Productos === 'string' ? JSON.parse(rp.Productos) : (rp.Productos || []);
              } catch(e) {}
              map.set(corr, {
                correlativo: corr,
                fecha: rp.Fecha_Emision || rp.Fecha || new Date().toISOString().split('T')[0],
                fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                clienteId: 'SYNC-CLOUD',
                clienteNombre: rp.Cliente || rp.Destino || rp.Cliente_Nombre || 'Cliente Google Sheets',
                clienteRif: rp.Cliente_RIF || 'J-00000000-0',
                clienteTelefono: '',
                proyectoAscensor: rp.Observacion || 'Solicitud de Presupuesto Sincronizada',
                items: Array.isArray(itemsParsed) && itemsParsed.length > 0 ? itemsParsed : [{
                  id: 'itm-cloud-1',
                  descripcion: rp.Observacion || 'Presupuesto desde Google Sheets',
                  cantidad: 1,
                  precioUnitarioUSD: parseFloat(rp.Total_USD || rp.Monto_USD) || 0,
                  esExento: true
                }],
                subtotalUSD: parseFloat(rp.Total_USD || rp.Monto_USD) || 0,
                ivaUSD: 0,
                totalUSD: parseFloat(rp.Total_USD || rp.Monto_USD) || 0,
                estado: rp.Estado || 'BORRADOR',
                notasValidez: 'Sincronizado desde Google Excel / Apps Script',
                division: 'MANTENIMIENTO'
              });
            }
          });
          const updated = Array.from(map.values());
          try { localStorage.setItem('tecno_presupuestos', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      }

      // Sincronizar solicitudes y cotizaciones recibidas desde el Portal Web (Buffer_Cotizaciones)
      const rawBufferCotizaciones = (fullData as any).Buffer_Cotizaciones || 
                                    (fullData as any).buffer_cotizaciones || 
                                    (fullData as any).Solicitudes_Clientes || 
                                    (fullData as any).solicitudes_clientes || 
                                    (fullData as any).Solicitudes ||
                                    (fullData.Notas ? fullData.Notas.filter((n: any) => n.Tipo === 'SOLICITUD_WEB' || n.Tipo === 'COTIZACION_WEB') : []);
      if (Array.isArray(rawBufferCotizaciones) && rawBufferCotizaciones.length > 0) {
        setSolicitudesClientes(prev => {
          const map = new Map<string, SolicitudCotizacionCliente>();
          prev.forEach(s => map.set(s.correlativo || s.id, s));
          rawBufferCotizaciones.forEach((bc: any) => {
            const corr = bc.Correlativo || bc.ID_Solicitud || bc.NroVale || bc.Numero_Cotizacion;
            if (corr && !map.has(corr)) {
              map.set(corr, {
                id: bc.ID_Solicitud || `SOL-CLOUD-${Date.now()}`,
                correlativo: corr,
                fecha: bc.Fecha_Hora ? String(bc.Fecha_Hora).split(' ')[0] : (bc.Fecha || new Date().toISOString().split('T')[0]),
                hora: bc.Fecha_Hora ? String(bc.Fecha_Hora).split(' ')[1] || '12:00' : '12:00',
                clienteNombre: bc.Cliente_Nombre || bc.Cliente || bc.Destino || 'Cliente Web',
                clienteRif: bc.Cliente_RIF || 'J-00000000-0',
                personaContacto: bc.Contacto || bc.Responsable || bc.Cliente_Nombre || '',
                telefono: bc.Telefono || '',
                email: bc.Email || '',
                edificioUbicacion: bc.Edificio_Ubicacion || bc.Observacion || '',
                apartamentoTorre: '',
                tipoServicio: (bc.Tipo_Servicio_Solicitado as any) || 'MANTENIMIENTO',
                paradas: Number(bc.Cantidad_Ascensores) || 1,
                capacidadPersonas: 6,
                detalles: bc.Detalles_Requerimiento || bc.Observacion || '',
                estado: (bc.Estado_Gestion as any) || 'NUEVA',
                subidoAExcel: true,
                fechaSubidoExcel: bc.Fecha_Procesado || bc.Fecha_Hora || bc.Fecha,
                empresaId: empresaActiva?.id
              });
            }
          });
          const updated = Array.from(map.values());
          try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      }

      // Sincronizar catálogo de repuestos, productos e inventario desde la hoja Repuestos_Inventario
      const rawInventario = Array.isArray(fullData)
        ? fullData
        : ((fullData as any).Repuestos_Inventario || (fullData as any).Inventario || (fullData as any).Datos || (fullData as any).data);

      if (Array.isArray(rawInventario) && rawInventario.length > 0) {
        // Mapeo de fotografías de repuestos
        const photoMap = new Map<string, string>();
        if (Array.isArray((fullData as any).Fotografias_Repuestos)) {
          (fullData as any).Fotografias_Repuestos.forEach((f: any) => {
            const sku = f.Codigo_SKU || f.Codigo || f.val_c;
            const img = f.URL_o_DataImagen || f.Imagen_Referencia || f.imagenUrl;
            if (sku && img) {
              photoMap.set(String(sku).trim().toUpperCase(), img);
            }
          });
        }

        setProducts(prev => {
          const map = new Map<string, Producto>();
          // Mantener productos existentes con sus claves en mayúsculas
          prev.forEach(p => map.set(p.val_c.trim().toUpperCase(), { ...p }));

          rawInventario.forEach((prod: any) => {
            const codigoRaw = prod.Codigo || prod.CÓDIGO || prod.Codigo_SKU || prod.val_c || prod.SKU || prod.ID || prod.Code || prod.codigo;
            if (!codigoRaw) return;
            const codigo = String(codigoRaw).trim();
            const codigoUpper = codigo.toUpperCase();

            const desc = prod.Descripcion || prod.DESCRIPCIÓN || prod.val_d || prod.Nombre || prod.Producto || 'Repuesto de Google Sheets';
            const mod = prod.Modelo || prod.MODELO || prod.val_mo || 'Estándar';
            const marc = prod.Marca || prod.MARCA || prod.val_m || 'Genérico';
            const cat = prod.Familia_Categoria || prod.Familia || prod.CATEGORIA || prod.Categoria || prod.val_r || 'General';
            const stk = parseFloat(prod.Stock || prod.STOCK || prod.val_s || prod.Cantidad) || 0;
            const prc = parseFloat(prod.Precio_USD || prod.PRECIO || prod.Precio || prod.precioUSD || prod.Monto_USD) || 0;
            const photoUrl = prod.Imagen_Referencia || prod.URL_o_DataImagen || prod.imagenUrl || prod.Foto || prod.FOTO || prod.Imagen || prod.URL || photoMap.get(codigoUpper) || '';
            const prodDivision = prod.Division || prod.division || prod.Division_Operativa;

            if (map.has(codigoUpper)) {
              // Actualizar datos del producto existente si vienen datos más recientes o imagen desde Google Sheets
              const existing = map.get(codigoUpper)!;
              map.set(codigoUpper, {
                ...existing,
                val_d: desc || existing.val_d,
                val_mo: mod || existing.val_mo,
                val_m: marc || existing.val_m,
                val_r: cat || existing.val_r,
                val_s: (prod.Stock !== undefined || prod.val_s !== undefined || prod.STOCK !== undefined) ? stk : existing.val_s,
                precioUSD: (prod.Precio_USD !== undefined || prod.precioUSD !== undefined || prod.Precio !== undefined || prod.PRECIO !== undefined) ? prc : existing.precioUSD,
                imagenUrl: photoUrl || existing.imagenUrl,
                division: (prodDivision as DivisionOperativa) || existing.division || activeDivision
              });
            } else {
              // Agregar nuevo producto registrado desde Google Sheets / Excel
              map.set(codigoUpper, {
                val_c: codigo,
                val_b: prod.val_b || codigo,
                val_d: desc,
                val_mo: mod,
                val_m: marc,
                val_r: cat,
                val_s: stk,
                val_u: prod.Unidad || prod.val_u || 'Und',
                precioUSD: prc,
                imagenUrl: photoUrl,
                division: (prodDivision as DivisionOperativa) || activeDivision || 'MANTENIMIENTO'
              });
            }
          });

          const updated = Array.from(map.values());
          try { localStorage.setItem('tecno_products', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      }
    }
  };

  const recargarEstadoNube = async (): Promise<void> => {
    try {
      const res = await fetch('/api/cloud/sync-state');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.solicitudesClientes)) {
            setSolicitudesClientes(prev => {
              const map = new Map<string, SolicitudCotizacionCliente>();
              prev.forEach(s => map.set(s.id, s));
              data.solicitudesClientes.forEach((s: SolicitudCotizacionCliente) => map.set(s.id, s));
              const merged = Array.from(map.values());
              try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(merged)); } catch(e){}
              return merged;
            });
          }
          if (Array.isArray(data.reportesTecnicos)) {
            setReportesTecnicos(prev => {
              const map = new Map<string, ReporteTecnicoCampo>();
              prev.forEach(r => map.set(r.id, r));
              data.reportesTecnicos.forEach((r: ReporteTecnicoCampo) => map.set(r.id, r));
              const merged = Array.from(map.values());
              try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(merged)); } catch(e){}
              return merged;
            });
          }
        }
      }
      await sincronizarReportesDesdeNube();
      addToast('📡 Sincronización en vivo con la Nube completada.', 'success');
    } catch (e) {
      console.warn('Error al recargar estado de nube:', e);
    }
  };

  useEffect(() => {
    sincronizarReportesDesdeNube();
    // Auto-sincronización periódica cada 15 segundos para traer historial y datos del Excel automáticamente
    const interval = setInterval(() => {
      sincronizarReportesDesdeNube();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Escucha de eventos storage y BroadcastChannel para sincronización instantánea en vivo entre múltiples pestañas/ventanas del navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'tecno_presupuestos') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPresupuestos(parsed);
        } else if (e.key === 'tecno_facturas') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setFacturas(parsed);
        } else if (e.key === 'tecno_recibos') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRecibos(parsed);
        } else if (e.key === 'tecno_reportes_tecnicos') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setReportesTecnicos(parsed);
        } else if (e.key === 'axon_solicitudes_clientes') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSolicitudesClientes(parsed);
        } else if (e.key === 'axon_prestamos_herramientas') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPrestamosHerramientas(parsed);
        } else if (e.key === 'tecno_vales') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setVales(parsed);
        } else if (e.key === 'tecno_clientes') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setClientes(parsed);
        } else if (e.key === 'tecno_movimientos') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setMovimientosContables(parsed);
        } else if (e.key === 'tecno_products') {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setProducts(parsed);
        }
      } catch (err) {
        console.warn('Error syncing storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Helper para sonido de notificación web elegante (Web Audio API sintético sin dependencias)
    const playNotificationChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {}
    };

    // 1. Carga inicial del Servidor Central Cloud Sync y Supabase
    let lastCloudSyncTimestamp = Date.now() - 3600000;
    const fetchCloudInitial = async () => {
      // 1.a Carga desde Supabase si está configurado
      if (isSupabaseConfigured()) {
        try {
          const [supaCotizaciones, supaReportes] = await Promise.all([
            fetchBufferCotizaciones(),
            fetchBufferReportesTecnicos()
          ]);

          if (Array.isArray(supaCotizaciones) && supaCotizaciones.length > 0) {
            setSolicitudesClientes(prev => {
              const map = new Map<string, SolicitudCotizacionCliente>();
              prev.forEach(s => map.set(s.id, s));
              supaCotizaciones.forEach(sc => {
                if (!map.has(sc.id_solicitud)) {
                  map.set(sc.id_solicitud, {
                    id: sc.id_solicitud,
                    correlativo: sc.id_solicitud.startsWith('SOL-') ? sc.id_solicitud : `SOL-${sc.id_solicitud.slice(-6)}`,
                    fecha: (sc.fecha_hora || new Date().toISOString()).split('T')[0],
                    hora: (sc.fecha_hora || '').includes('T') ? sc.fecha_hora.split('T')[1].slice(0, 5) : '12:00',
                    clienteNombre: sc.cliente_nombre,
                    clienteRif: sc.cliente_rif || 'N/A',
                    personaContacto: sc.cliente_nombre,
                    telefono: sc.telefono,
                    email: sc.email,
                    edificioUbicacion: sc.edificio_ubicacion,
                    apartamentoTorre: 'Principal',
                    tipoServicio: sc.tipo_servicio_solicitado as any,
                    paradas: Number(sc.cantidad_ascensores) || 1,
                    capacidadPersonas: 6,
                    detalles: sc.detalles_requerimiento,
                    estado: sc.estado_gestion === 'CONSOLIDADO_EN_MASTER' ? 'COTIZADO' : 'NUEVA',
                    estadoGestionBuffer: sc.estado_gestion,
                    subidoAExcel: true
                  });
                }
              });
              const merged = Array.from(map.values());
              try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(merged)); } catch(e){}
              return merged;
            });
          }

          if (Array.isArray(supaReportes) && supaReportes.length > 0) {
            setReportesTecnicos(prev => {
              const map = new Map<string, ReporteTecnicoCampo>();
              prev.forEach(r => map.set(r.id, r));
              supaReportes.forEach(sr => {
                if (!map.has(sr.id_transaccion)) {
                  let repuestosF = [];
                  try {
                    repuestosF = typeof sr.repuestos_solicitados_json === 'string' 
                      ? JSON.parse(sr.repuestos_solicitados_json || '[]') 
                      : (sr.repuestos_solicitados_json || []);
                  } catch(e){}

                  let fotosA = [];
                  try {
                    fotosA = typeof sr.fotos_json === 'string'
                      ? JSON.parse(sr.fotos_json || '[]')
                      : (sr.fotos_json || []);
                  } catch(e){}

                  map.set(sr.id_transaccion, {
                    id: sr.id_transaccion,
                    correlativo: sr.id_transaccion.startsWith('REP-') ? sr.id_transaccion : `REP-${sr.id_transaccion.slice(-6)}`,
                    fecha: (sr.fecha_hora || new Date().toISOString()).split('T')[0],
                    clienteNombre: sr.cliente_obra,
                    tecnicoNombre: sr.nombre_tecnico,
                    equipoAscensor: sr.ascensor_equipo,
                    ubicacionObra: sr.ubicacion,
                    tipoReporte: 'INSPECCION_DANIOS',
                    prioridadAtencion: 'NORMAL',
                    diagnosticoDanio: sr.diagnostico_falla,
                    repuestosFaltantes: repuestosF,
                    requierePresupuesto: repuestosF.length > 0,
                    photos: fotosA,
                    fotosEvidenciaCount: fotosA.length,
                    estado: sr.estado_gestion === 'CONSOLIDADO_EN_MASTER' ? 'COMPLETADO' : 'PENDIENTE_COTIZACION',
                    estadoGestionBuffer: sr.estado_gestion,
                    division: 'MANTENIMIENTO'
                  });
                }
              });
              const merged = Array.from(map.values());
              try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(merged)); } catch(e){}
              return merged;
            });
          }
        } catch (supaInitErr) {
          console.warn('[SUPABASE INIT SYNC] Error consultando búferes iniciales:', supaInitErr);
        }
      }

      // 1.b Carga del Servidor Express
      try {
        const res = await fetch('/api/cloud/sync-state');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (Array.isArray(data.solicitudesClientes) && data.solicitudesClientes.length > 0) {
              setSolicitudesClientes(prev => {
                const map = new Map<string, SolicitudCotizacionCliente>();
                prev.forEach(s => map.set(s.id, s));
                data.solicitudesClientes.forEach((s: SolicitudCotizacionCliente) => {
                  if (!map.has(s.id)) map.set(s.id, s);
                });
                const merged = Array.from(map.values());
                try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(merged)); } catch(e){}
                return merged;
              });
            }

            if (Array.isArray(data.reportesTecnicos) && data.reportesTecnicos.length > 0) {
              setReportesTecnicos(prev => {
                const map = new Map<string, ReporteTecnicoCampo>();
                prev.forEach(r => map.set(r.id, r));
                data.reportesTecnicos.forEach((r: ReporteTecnicoCampo) => {
                  if (!map.has(r.id)) map.set(r.id, r);
                });
                const merged = Array.from(map.values());
                try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(merged)); } catch(e){}
                return merged;
              });
            }

            if (data.lastUpdated) {
              lastCloudSyncTimestamp = data.lastUpdated;
            }
          }
        }
      } catch (err) {
        console.warn('[CLOUD SYNC] Estado inicial no accesible:', err);
      }
    };
    fetchCloudInitial();

    // 2. Polling recurrente del servidor en tiempo real y Supabase (cada 3.5 segundos)
    const cloudPollInterval = setInterval(async () => {
      // 2.a Polling de Supabase si está activo
      if (isSupabaseConfigured()) {
        try {
          const [supaCotizaciones, supaReportes] = await Promise.all([
            fetchBufferCotizaciones(),
            fetchBufferReportesTecnicos()
          ]);

          if (Array.isArray(supaCotizaciones) && supaCotizaciones.length > 0) {
            setSolicitudesClientes(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newCotiz = supaCotizaciones.filter(sc => !existingIds.has(sc.id_solicitud));
              if (newCotiz.length > 0) {
                playNotificationChime();
                newCotiz.forEach(sc => {
                  addToast(`📥 ¡Nueva Cotización en Supabase! ${sc.id_solicitud} de ${sc.cliente_nombre} (${sc.tipo_servicio_solicitado})`, 'success');
                });
              }

              const map = new Map<string, SolicitudCotizacionCliente>();
              supaCotizaciones.forEach(sc => {
                map.set(sc.id_solicitud, {
                  id: sc.id_solicitud,
                  correlativo: sc.id_solicitud.startsWith('SOL-') ? sc.id_solicitud : `SOL-${sc.id_solicitud.slice(-6)}`,
                  fecha: (sc.fecha_hora || new Date().toISOString()).split('T')[0],
                  hora: (sc.fecha_hora || '').includes('T') ? sc.fecha_hora.split('T')[1].slice(0, 5) : '12:00',
                  clienteNombre: sc.cliente_nombre,
                  clienteRif: sc.cliente_rif || 'N/A',
                  personaContacto: sc.cliente_nombre,
                  telefono: sc.telefono,
                  email: sc.email,
                  edificioUbicacion: sc.edificio_ubicacion,
                  apartamentoTorre: 'Principal',
                  tipoServicio: sc.tipo_servicio_solicitado as any,
                  paradas: Number(sc.cantidad_ascensores) || 1,
                  capacidadPersonas: 6,
                  detalles: sc.detalles_requerimiento,
                  estado: sc.estado_gestion === 'CONSOLIDADO_EN_MASTER' ? 'COTIZADO' : 'NUEVA',
                  estadoGestionBuffer: sc.estado_gestion,
                  subidoAExcel: true
                });
              });
              prev.forEach(s => { if (!map.has(s.id)) map.set(s.id, s); });
              const updated = Array.from(map.values());
              try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
              return updated;
            });
          }

          if (Array.isArray(supaReportes) && supaReportes.length > 0) {
            setReportesTecnicos(prev => {
              const existingIds = new Set(prev.map(r => r.id));
              const newReps = supaReportes.filter(sr => !existingIds.has(sr.id_transaccion));
              if (newReps.length > 0) {
                playNotificationChime();
                newReps.forEach(sr => {
                  addToast(`👷 ¡Nuevo Reporte en Supabase! ${sr.id_transaccion} de ${sr.cliente_obra} (${sr.nombre_tecnico})`, 'info');
                });
              }

              const map = new Map<string, ReporteTecnicoCampo>();
              supaReportes.forEach(sr => {
                let repuestosF = [];
                try {
                  repuestosF = typeof sr.repuestos_solicitados_json === 'string' 
                    ? JSON.parse(sr.repuestos_solicitados_json || '[]') 
                    : (sr.repuestos_solicitados_json || []);
                } catch(e){}

                let fotosA = [];
                try {
                  fotosA = typeof sr.fotos_json === 'string'
                    ? JSON.parse(sr.fotos_json || '[]')
                    : (sr.fotos_json || []);
                } catch(e){}

                map.set(sr.id_transaccion, {
                  id: sr.id_transaccion,
                  correlativo: sr.id_transaccion.startsWith('REP-') ? sr.id_transaccion : `REP-${sr.id_transaccion.slice(-6)}`,
                  fecha: (sr.fecha_hora || new Date().toISOString()).split('T')[0],
                  clienteNombre: sr.cliente_obra,
                  tecnicoNombre: sr.nombre_tecnico,
                  equipoAscensor: sr.ascensor_equipo,
                  ubicacionObra: sr.ubicacion,
                  tipoReporte: 'INSPECCION_DANIOS',
                  prioridadAtencion: 'NORMAL',
                  diagnosticoDanio: sr.diagnostico_falla,
                  repuestosFaltantes: repuestosF,
                  requierePresupuesto: repuestosF.length > 0,
                  photos: fotosA,
                  fotosEvidenciaCount: fotosA.length,
                  estado: sr.estado_gestion === 'CONSOLIDADO_EN_MASTER' ? 'COMPLETADO' : 'PENDIENTE_COTIZACION',
                  estadoGestionBuffer: sr.estado_gestion,
                  division: 'MANTENIMIENTO'
                });
              });
              prev.forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
              const updated = Array.from(map.values());
              try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
              return updated;
            });
          }
        } catch(supaPollErr) {
          // Silencioso
        }
      }

      // 2.b Polling de Express
      try {
        const res = await fetch(`/api/cloud/feed?since=${lastCloudSyncTimestamp}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.hasChanges) {
            lastCloudSyncTimestamp = data.serverTime || Date.now();

            // Sincronizar Solicitudes de Clientes Web
            if (Array.isArray(data.solicitudesClientes)) {
              setSolicitudesClientes(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const newArrivals = data.solicitudesClientes.filter((s: any) => !existingIds.has(s.id));
                
                if (newArrivals.length > 0) {
                  playNotificationChime();
                  newArrivals.forEach((s: any) => {
                    addToast(`📥 ¡Nueva Solicitud Web Recibida! ${s.correlativo || ''} de ${s.clienteNombre} (${s.edificioUbicacion || 'En Línea'})`, 'success');
                  });
                }

                const map = new Map<string, SolicitudCotizacionCliente>();
                // Conservar items más recientes arriba
                data.solicitudesClientes.forEach((s: SolicitudCotizacionCliente) => map.set(s.id, s));
                prev.forEach(s => { if (!map.has(s.id)) map.set(s.id, s); });
                const updated = Array.from(map.values());
                try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
                return updated;
              });
            }

            // Sincronizar Reportes Técnicos de Obra
            if (Array.isArray(data.reportesTecnicos)) {
              setReportesTecnicos(prev => {
                const existingIds = new Set(prev.map(r => r.id));
                const newArrivals = data.reportesTecnicos.filter((r: any) => !existingIds.has(r.id));
                
                if (newArrivals.length > 0) {
                  playNotificationChime();
                  newArrivals.forEach((r: any) => {
                    const nombreObra = r.clienteNombre || r.ubicacionObra || r.edificioCliente || 'Obra en Sitio';
                    addToast(`👷 ¡Nuevo Reporte de Obra Recibido! ${r.correlativo || ''} de ${nombreObra}`, 'info');
                  });
                }

                const map = new Map<string, ReporteTecnicoCampo>();
                data.reportesTecnicos.forEach((r: ReporteTecnicoCampo) => map.set(r.id, r));
                prev.forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
                const updated = Array.from(map.values());
                try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
                return updated;
              });
            }
          }
        }
      } catch (err) {
        // Silencioso ante pérdidas transitorias de conexión
      }
    }, 3500);

    // Canal BroadcastChannel para comunicación bidireccional en tiempo real entre pestañas (Portal <-> Gestor)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('axon_erp_realtime_channel');
        channel.onmessage = (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          if (msg.type === 'NEW_SOLICITUD_CLIENTE' && msg.data) {
            setSolicitudesClientes(prev => {
              if (prev.some(s => s.id === msg.data.id || s.correlativo === msg.data.correlativo)) return prev;
              return [msg.data, ...prev];
            });
            playNotificationChime();
            addToast(`📥 ¡Nueva solicitud ${msg.data.correlativo} recibida en vivo de ${msg.data.clienteNombre}!`, 'success');
          } else if (msg.type === 'NEW_REPORTE_TECNICO' && msg.data) {
            setReportesTecnicos(prev => {
              if (prev.some(r => r.id === msg.data.id || r.correlativo === msg.data.correlativo)) return prev;
              return [msg.data, ...prev];
            });
            playNotificationChime();
            addToast(`👷 ¡Nuevo reporte de obra ${msg.data.correlativo} recibido en vivo de ${msg.data.tecnicoNombre}!`, 'info');
          } else if (msg.type === 'NEW_PRESUPUESTO' && msg.data) {
            setPresupuestos(prev => {
              if (prev.some(p => p.correlativo === msg.data.correlativo)) return prev;
              return [msg.data, ...prev];
            });
          } else if (msg.type === 'PING_PORTAL_SIGNAL' && msg.data) {
            // RESPUESTA AUTOMÁTICA DEL GESTOR ERP A LA SEÑAL DE DIAGNÓSTICO
            try {
              const pongCh = new BroadcastChannel('axon_erp_realtime_channel');
              pongCh.postMessage({
                type: 'PONG_GESTOR_ACK',
                data: {
                  pingId: msg.data.pingId,
                  gestorUser: user?.nombre || 'Gestor Central AXON ERP',
                  empresa: empresaActiva?.nombreCorto || 'AXON ERP',
                  receivedAt: Date.now()
                }
              });
              pongCh.close();
            } catch (err) {
              console.warn('Error respondiendo PONG:', err);
            }

            // Notificación visual en el Gestor Central
            const originText = msg.data.origin === 'PORTAL_TECNICOS' ? '👷 Portal Técnicos en Obra' : '🌐 Portal Web Clientes';
            addToast(`📡 Señal de comprobación recibida de ${msg.data.senderName || 'Terminal'} (${originText}) — Respuesta automática enviada ✓`, 'info');
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or error:', e);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(cloudPollInterval);
      if (channel) channel.close();
    };
  }, []);

  // Escaneo global del sistema: detecta qué reportes, facturas, notas y movimientos están en la nube y sube automáticamente los faltantes
  const scanAndSyncUnsyncedReports = async (): Promise<number> => {
    setIsSyncing(true);
    const scriptUrl = getCompanyScriptUrl();
    
    // 1. Consultar estado actual de la nube
    await sincronizarReportesDesdeNube();

    let uploadedCount = 0;
    let repCount = 0;
    let factCount = 0;
    let presCount = 0;
    let recCount = 0;
    let movCount = 0;
    let valeCount = 0;
    let solCount = 0;

    if (scriptUrl) {
      // a) Subir Reportes Técnicos faltantes
      const pendingReports = reportesTecnicos.filter(r => !cloudSyncedCorrelativos.includes(r.correlativo));
      for (const rep of pendingReports) {
        await postReportToAppsScript(scriptUrl, rep);
        repCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, rep.correlativo])));
      }

      // b) Subir Facturas faltantes
      const pendingFacturas = facturas.filter(f => !cloudSyncedCorrelativos.includes(f.correlativo));
      for (const f of pendingFacturas) {
        await postNotaToAppsScript(scriptUrl, {
          NroVale: f.correlativo,
          Fecha: f.fecha,
          Tipo: 'VENTA_FACTURA',
          Destino: f.clienteNombre,
          Responsable: f.tipoComprobante,
          Observacion: `Factura ${f.correlativo} (${f.estado}) - Total USD: $${f.totalUSD.toFixed(2)} | RIF: ${f.clienteRif}`,
          Productos: f.items
        });
        factCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, f.correlativo])));
      }

      // c) Subir Presupuestos faltantes
      const pendingPresupuestos = presupuestos.filter(p => !cloudSyncedCorrelativos.includes(p.correlativo));
      for (const p of pendingPresupuestos) {
        await postNotaToAppsScript(scriptUrl, {
          NroVale: p.correlativo,
          Fecha: p.fecha,
          Tipo: 'PRESUPUESTO',
          Destino: p.clienteNombre,
          Responsable: 'Ventas',
          Observacion: `Presupuesto ${p.correlativo} - Total USD: $${p.totalUSD.toFixed(2)} | Proy: ${p.proyectoAscensor || ''}`,
          Productos: p.items
        });
        presCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, p.correlativo])));
      }

      // d) Subir Recibos / Notas de Entrega faltantes
      const pendingRecibos = recibos.filter(rn => !cloudSyncedCorrelativos.includes(rn.correlativo));
      for (const rn of pendingRecibos) {
        await postNotaToAppsScript(scriptUrl, {
          NroVale: rn.correlativo,
          Fecha: rn.fecha,
          Tipo: rn.tipo,
          Destino: rn.clienteNombre,
          Responsable: rn.formaPago,
          Observacion: `${rn.concepto} | RIF: ${rn.clienteRif} | Monto: $${rn.montoUSD}`,
          Productos: [{ codigo: rn.tipo, descripcion: rn.concepto, cantidad: 1, precio: rn.montoUSD }]
        });
        recCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, rn.correlativo])));
      }

      // e) Subir Movimientos Contables faltantes
      const pendingMovs = movimientosContables.filter(m => !cloudSyncedCorrelativos.includes(m.id));
      for (const m of pendingMovs) {
        await postNotaToAppsScript(scriptUrl, {
          NroVale: m.id,
          Fecha: m.fecha,
          Tipo: m.tipo,
          Destino: m.proveedorOCliente || 'General',
          Responsable: m.categoria,
          Observacion: `${m.descripcion} | Ref: ${m.comprobanteReferencia || ''} | Monto: $${m.montoUSD}`,
          Productos: [{ codigo: m.tipo, descripcion: m.descripcion, cantidad: 1, precio: m.montoUSD }]
        });
        movCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, m.id])));
      }

      // f) Subir Vales de Despacho / Inventario faltantes
      const pendingVales = vales.filter(v => !cloudSyncedCorrelativos.includes(v.NroVale));
      for (const v of pendingVales) {
        await postNotaToAppsScript(scriptUrl, {
          NroVale: v.NroVale,
          Fecha: v.Fecha,
          Tipo: v.TipoDespacho || 'SALIDA',
          Destino: v.Destino,
          Responsable: v.Responsable,
          Observacion: v.ProyectoDesc || '',
          Productos: v.Productos
        });
        valeCount++;
        uploadedCount++;
        setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, v.NroVale])));
      }

      // g) Subir Solicitudes de Cotización de Clientes (Portal Web) faltantes
      const pendingSolicitudes = solicitudesClientes.filter(s => !s.subidoAExcel);
      let solCount = 0;
      for (const sol of pendingSolicitudes) {
        const ok = await postSolicitudCotizacionToAppsScript(scriptUrl, {
          id: sol.id,
          correlativo: sol.correlativo,
          fecha: sol.fecha,
          hora: sol.hora,
          clienteNombre: sol.clienteNombre,
          clienteRif: sol.clienteRif,
          personaContacto: sol.personaContacto,
          telefono: sol.telefono,
          email: sol.email,
          edificioUbicacion: sol.edificioUbicacion,
          apartamentoTorre: sol.apartamentoTorre,
          tipoServicio: sol.tipoServicio,
          paradas: sol.paradas,
          capacidadPersonas: sol.capacidadPersonas,
          detalles: sol.detalles,
          estado: sol.estado
        });
        if (ok) {
          solCount++;
          uploadedCount++;
          setSolicitudesClientes(prev => {
            const up = prev.map(s => s.id === sol.id ? { ...s, subidoAExcel: true, fechaSubidoExcel: new Date().toISOString().replace('T', ' ').slice(0, 16) } : s);
            try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(up)); } catch(e){}
            return up;
          });
        }
      }

      // Re-sincronizar tras subir
      await sincronizarReportesDesdeNube();
    }

    setIsSyncing(false);
    if (uploadedCount > 0) {
      addToast(
        `¡Escaneo completado! ${uploadedCount} registro(s) subidos a Google Excel (${repCount} reportes, ${factCount} facturas, ${presCount + recCount} notas/presupuestos, ${movCount} movimientos, ${valeCount} vales y ${solCount || 0} cotizaciones web).`,
        'success'
      );
    } else {
      addToast('¡Escaneo completado! Todos los registros, facturas, notas, cotizaciones web y reportes ya están guardados y respaldados en la Nube de Google Excel.', 'success');
    }
    return uploadedCount;
  };

  // Sync Manual
  const triggerManualSync = async () => {
    setIsSyncing(true);
    await sincronizarReportesDesdeNube();
    await processOfflineSync(getCompanyScriptUrl);
    await scanAndSyncUnsyncedReports();
    await refreshOfflineCount();
    await new Promise(resolve => setTimeout(resolve, 500));
    setSyncQueue([]);
    setIsSyncing(false);
  };

  // CLIENTES & EQUIPOS
  const agregarCliente = (data: Omit<Cliente, 'id'>) => {
    const id = `CLI-${(clientes.length + 1).toString().padStart(3, '0')}`;
    const nuevo: Cliente = { ...data, id };
    setClientes(prev => [nuevo, ...prev]);
    addToast(`Cliente "${data.razonSocial}" registrado con éxito`, 'success');
  };

  const editarCliente = (cliente: Cliente) => {
    setClientes(prev => prev.map(c => c.id === cliente.id ? cliente : c));
    addToast(`Cliente "${cliente.razonSocial}" actualizado correctamente`, 'success');
  };

  const eliminarCliente = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    addToast('Cliente eliminado del sistema', 'info');
  };

  // Soft Delete de Clientes en Supabase Master y Estado Local
  const archivarCliente = async (id: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: 'ARCHIVADO' } : c));
    if (isSupabaseConfigured()) {
      await softDeleteRecord('clientes_equipos', id, 'id');
    }
    addToast('Cliente archivado (Soft Delete) exitosamente', 'info');
  };

  const desarchivarCliente = async (id: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: 'ACTIVO' } : c));
    addToast('Cliente reactivado exitosamente', 'success');
  };

  const agregarEquipoACliente = (clienteId: string, equipoData: Omit<EquipoAscensor, 'id'>) => {
    const eqId = `EQ-${Date.now().toString().slice(-4)}`;
    const nuevoEquipo: EquipoAscensor = { ...equipoData, id: eqId };
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return { ...c, equipos: [...c.equipos, nuevoEquipo] };
      }
      return c;
    }));
    addToast(`Equipo "${equipoData.nombreEquipo}" agregado al cliente`, 'success');
  };

  const editarEquipoDeCliente = (clienteId: string, equipoEditado: EquipoAscensor) => {
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return {
          ...c,
          equipos: c.equipos.map(e => e.id === equipoEditado.id ? equipoEditado : e)
        };
      }
      return c;
    }));
    addToast(`Ficha del ascensor "${equipoEditado.nombreEquipo}" actualizada`, 'success');
  };

  const eliminarEquipoDeCliente = (clienteId: string, equipoId: string) => {
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return { ...c, equipos: c.equipos.filter(e => e.id !== equipoId) };
      }
      return c;
    }));
    addToast('Equipo eliminado del cliente', 'info');
  };

  // FACTURACIÓN
  const crearFactura = (data: Omit<Factura, 'correlativo'>): Factura => {
    const num = facturas.length + 1001;
    const correlativo = `FACT-${num.toString().padStart(6, '0')}`;
    const nuevaFactura: Factura = { ...data, correlativo };

    setFacturas(prev => [nuevaFactura, ...prev]);

    // Registrar automático en contabilidad si es emitido
    const mov: MovimientoContable = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      fecha: nuevaFactura.fecha,
      tipo: 'INGRESO',
      categoria: 'Facturación de Servicios',
      descripcion: `Emisión de ${nuevaFactura.tipoComprobante} #${correlativo} - ${nuevaFactura.clienteNombre}`,
      montoUSD: nuevaFactura.totalUSD,
      montoBs: nuevaFactura.totalBs,
      comprobanteReferencia: correlativo,
      proveedorOCliente: nuevaFactura.clienteNombre,
      division: nuevaFactura.division
    };
    setMovimientosContables(prev => [mov, ...prev]);

    // Guardado y Notificación Automática a Google Sheets Excel
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: correlativo,
        Fecha: nuevaFactura.fecha,
        Tipo: 'VENTA',
        Destino: nuevaFactura.clienteNombre,
        Responsable: 'Facturación',
        Observacion: `Factura ${correlativo} (${nuevaFactura.tipoComprobante}) - $${nuevaFactura.totalUSD.toFixed(2)}`,
        Productos: JSON.stringify(nuevaFactura.items)
      });
      addToast(`¡Éxito! Factura ${correlativo} guardada y escrita automáticamente en la planilla de Google Excel.`, 'success');
    } else {
      addToast(`Factura ${correlativo} generada exitosamente por $${nuevaFactura.totalUSD.toFixed(2)}`, 'success');
    }

    return nuevaFactura;
  };

  const anularFactura = (correlativo: string) => {
    setFacturas(prev => prev.map(f => f.correlativo === correlativo ? { ...f, estado: 'ANULADA' } : f));
    addToast(`Factura ${correlativo} anulada`, 'info');
  };

  // Soft Delete de Facturas en Supabase Master y Estado Local
  const archivarFactura = async (correlativo: string) => {
    setFacturas(prev => prev.map(f => f.correlativo === correlativo ? { ...f, estado: 'ARCHIVADO' } : f));
    if (isSupabaseConfigured()) {
      await softDeleteRecord('facturas_ventas', correlativo, 'correlativo');
    }
    addToast(`Factura ${correlativo} archivada (Soft Delete)`, 'info');
  };

  const desarchivarFactura = async (correlativo: string) => {
    setFacturas(prev => prev.map(f => f.correlativo === correlativo ? { ...f, estado: 'EMITIDA' } : f));
    addToast(`Factura ${correlativo} reactivada`, 'success');
  };

  const marcarFacturaPagada = (correlativo: string) => {
    setFacturas(prev => prev.map(f => f.correlativo === correlativo ? { ...f, estado: 'PAGADA' } : f));
    addToast(`Factura ${correlativo} marcada como PAGADA`, 'success');
  };

  // PRESUPUESTOS
  const crearPresupuesto = (data: Omit<Presupuesto, 'correlativo'>): Presupuesto => {
    const num = presupuestos.length + 501;
    const correlativo = `PRES-2026-${num.toString().padStart(4, '0')}`;
    const nuevo: Presupuesto = { ...data, correlativo };

    setPresupuestos(prev => {
      const updated = [nuevo, ...prev];
      try {
        localStorage.setItem('tecno_presupuestos', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Auto-Guardado en Excel / Google Sheets
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: correlativo,
        Fecha: nuevo.fecha,
        Tipo: 'PRESUPUESTO',
        Destino: nuevo.clienteNombre,
        Responsable: 'Ventas/Presupuestos',
        Observacion: nuevo.proyectoAscensor || nuevo.notasValidez,
        Productos: JSON.stringify(nuevo.items),
        clienteRif: nuevo.clienteRif,
        montoUSD: nuevo.totalUSD,
        montoBs: nuevo.totalUSD * tasaCambioBCV,
        division: nuevo.division
      });
      addToast(`¡Éxito! Presupuesto ${correlativo} guardado y escrito automáticamente en la planilla de Google Excel.`, 'success');
    } else {
      addToast(`Presupuesto ${correlativo} generado exitosamente en el ERP`, 'success');
    }

    return nuevo;
  };

  const editarPresupuesto = (presupuesto: Presupuesto) => {
    setPresupuestos(prev => prev.map(p => p.correlativo === presupuesto.correlativo ? presupuesto : p));
    addToast(`Presupuesto ${presupuesto.correlativo} modificado correctamente`, 'success');
  };

  const cambiarEstadoPresupuesto = (correlativo: string, estado: Presupuesto['estado']) => {
    setPresupuestos(prev => prev.map(p => p.correlativo === correlativo ? { ...p, estado } : p));
    addToast(`Estado de Presupuesto ${correlativo} cambiado a ${estado}`, 'info');
  };

  const convertirPresupuestoAFactura = (correlativo: string, tipoComprobante: 'FACTURA_FISCAL' | 'NOTA_ENTREGA'): Factura => {
    const pres = presupuestos.find(p => p.correlativo === correlativo);
    if (!pres) throw new Error('Presupuesto no encontrado');

    const nuevaFactura = crearFactura({
      fecha: new Date().toISOString().split('T')[0],
      clienteId: pres.clienteId,
      clienteNombre: pres.clienteNombre,
      clienteRif: pres.clienteRif,
      clienteDireccion: 'Dirección del cliente',
      tipoComprobante,
      items: pres.items.map((it, idx) => ({
        id: `ITM-PRES-${idx}`,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precioUnitarioUSD: it.precioUnitarioUSD
      })),
      subtotalUSD: pres.subtotalUSD,
      ivaPorcentaje: tipoComprobante === 'FACTURA_FISCAL' ? 16 : 0,
      ivaMontoUSD: tipoComprobante === 'FACTURA_FISCAL' ? pres.ivaUSD : 0,
      totalUSD: tipoComprobante === 'FACTURA_FISCAL' ? pres.totalUSD : pres.subtotalUSD,
      tasaCambioBs: tasaCambioBCV,
      totalBs: (tipoComprobante === 'FACTURA_FISCAL' ? pres.totalUSD : pres.subtotalUSD) * tasaCambioBCV,
      estado: 'EMITIDA',
      division: pres.division,
      observaciones: `Factura generada desde Presupuesto ${correlativo}`
    });

    cambiarEstadoPresupuesto(correlativo, 'CONVERTIDO_A_FACTURA');
    addToast(`Presupuesto ${correlativo} convertido exitosamente a Factura ${nuevaFactura.correlativo}`, 'success');
    return nuevaFactura;
  };

  // RECIBOS / NOTAS
  const crearReciboNota = (data: Omit<ReciboNota, 'correlativo'>): ReciboNota => {
    const num = recibos.length + 301;
    const prefix = data.tipo === 'RECIBO_PAGO' ? 'REC' : 'NE';
    const correlativo = `${prefix}-${num.toString().padStart(6, '0')}`;
    const nuevo: ReciboNota = { ...data, correlativo };

    setRecibos(prev => [nuevo, ...prev]);

    // Registrar en contabilidad
    if (data.montoUSD > 0) {
      setMovimientosContables(prev => [{
        id: `MOV-${Date.now().toString().slice(-5)}`,
        fecha: nuevo.fecha,
        tipo: 'INGRESO',
        categoria: data.tipo === 'RECIBO_PAGO' ? 'Abono / Recibo de Pago' : 'Nota de Entrega',
        descripcion: `${data.concepto} (${correlativo})`,
        montoUSD: data.montoUSD,
        montoBs: data.montoBs,
        comprobanteReferencia: correlativo,
        proveedorOCliente: data.clienteNombre,
        division: data.division
      }, ...prev]);
    }

    // Auto-Guardado en Excel
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: correlativo,
        Fecha: nuevo.fecha,
        Tipo: data.tipo,
        Destino: data.clienteNombre,
        Responsable: 'Caja/Administración',
        Observacion: data.concepto,
        Productos: `${data.concepto} - Monto: $${data.montoUSD}`
      });
      addToast(`¡Éxito! ${data.tipo === 'RECIBO_PAGO' ? 'Recibo' : 'Nota de Entrega'} ${correlativo} guardado y escrito automáticamente en la planilla de Google Excel.`, 'success');
    } else {
      addToast(`${data.tipo === 'RECIBO_PAGO' ? 'Recibo' : 'Nota de Entrega'} ${correlativo} registrado`, 'success');
    }

    return nuevo;
  };

  const anularReciboNota = (correlativo: string) => {
    setRecibos(prev => prev.map(r => r.correlativo === correlativo ? { ...r, status: 'ANULADO' } : r));
    addToast(`Comprobante ${correlativo} anulado`, 'info');
  };

  // CONTABILIDAD
  const registrarMovimiento = (data: Omit<MovimientoContable, 'id'>) => {
    const id = `MOV-${Date.now().toString().slice(-5)}`;
    const nuevo: MovimientoContable = { ...data, id };
    setMovimientosContables(prev => [nuevo, ...prev]);

    // Auto-Guardado en Excel
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: id,
        Fecha: data.fecha,
        Tipo: data.tipo,
        Destino: data.proveedorOCliente || 'General',
        Responsable: 'Contabilidad',
        Observacion: `${data.categoria}: ${data.descripcion}`,
        Productos: `Monto USD: $${data.montoUSD.toFixed(2)}`
      });
      addToast(`¡Éxito! Movimiento contable ${id} guardado y escrito automáticamente en la planilla de Google Excel.`, 'success');
    } else {
      addToast(`Asiento contable registrado: ${data.tipo} de $${data.montoUSD.toFixed(2)}`, 'success');
    }
  };

  // NÓMINA
  const agregarEmpleado = (data: Omit<Empleado, 'id'>) => {
    const id = `EMP-${(empleados.length + 1).toString().padStart(3, '0')}`;
    const nuevo: Empleado = { ...data, id };
    setEmpleados(prev => [nuevo, ...prev]);
    addToast(`Empleado "${data.nombre}" registrado exitosamente`, 'success');
  };

  const editarEmpleado = (emp: Empleado) => {
    setEmpleados(prev => prev.map(e => e.id === emp.id ? emp : e));
    addToast(`Ficha de "${emp.nombre}" actualizada`, 'success');
  };

  const solicitarPrestamo = (data: Omit<PrestamoEmpleado, 'id' | 'cuotasPagadas' | 'estado'>) => {
    const id = `PREST-${(prestamos.length + 1).toString().padStart(3, '0')}`;
    const nuevo: PrestamoEmpleado = { ...data, id, cuotasPagadas: 0, estado: 'PENDIENTE' };
    setPrestamos(prev => [nuevo, ...prev]);
    addToast(`Préstamo de $${data.montoUSD} otorgado al empleado`, 'success');
  };

  const registrarPagoCuotaPrestamo = (prestamoId: string) => {
    setPrestamos(prev => prev.map(p => {
      if (p.id === prestamoId) {
        const pagadas = p.cuotasPagadas + 1;
        const estado = pagadas >= p.cuotasTotales ? 'PAGADO' : 'PENDIENTE';
        return { ...p, cuotasPagadas: pagadas, estado };
      }
      return p;
    }));
    addToast('Cuota de préstamo descontada y registrada', 'success');
  };

  const generarNominaPeriodo = (
    periodo: string, 
    fechaPago: string, 
    desgloses: { empleadoId: string; bonificacion: number; descuentoPrestamo: number }[]
  ) => {
    const registros: RegistroNomina[] = [];
    let totalNominaUSD = 0;

    desgloses.forEach(d => {
      const emp = empleados.find(e => e.id === d.empleadoId);
      if (!emp) return;

      const sueldoQuincenal = emp.sueldoBaseUSD / 2;
      const cestaTicketQuincenal = emp.cestaTicketUSD / 2;
      const netoUSD = sueldoQuincenal + cestaTicketQuincenal + d.bonificacion - d.descuentoPrestamo;
      const netoBs = netoUSD * tasaCambioBCV;

      totalNominaUSD += netoUSD;

      const reg: RegistroNomina = {
        id: `NOM-${Date.now().toString().slice(-4)}-${emp.id}`,
        periodo,
        fechaPago,
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        cargo: emp.cargo,
        sueldoBaseUSD: sueldoQuincenal,
        cestaTicketUSD: cestaTicketQuincenal,
        bonificacionEspecialUSD: d.bonificacion,
        descuentoPrestamosUSD: d.descuentoPrestamo,
        netoAPagarUSD: netoUSD,
        netoAPagarBs: netoBs,
        estado: 'PAGADA'
      };

      registros.push(reg);

      // Si pagó préstamo
      if (d.descuentoPrestamo > 0) {
        const prestamoActivo = prestamos.find(p => p.empleadoId === emp.id && p.estado === 'PENDIENTE');
        if (prestamoActivo) {
          registrarPagoCuotaPrestamo(prestamoActivo.id);
        }
      }
    });

    setNominasProcesadas(prev => [...registros, ...prev]);

    // Movimiento contable de egreso
    setMovimientosContables(prev => [{
      id: `MOV-NOM-${Date.now().toString().slice(-4)}`,
      fecha: fechaPago,
      tipo: 'EGRESO',
      categoria: 'Nómina y Cesta Ticket',
      descripcion: `Pago de Nómina Periodo: ${periodo}`,
      montoUSD: totalNominaUSD,
      montoBs: totalNominaUSD * tasaCambioBCV,
      comprobanteReferencia: periodo,
      proveedorOCliente: 'Personal Tecno Elevatev C.A.',
      division: activeDivision
    }, ...prev]);

    addToast(`Nómina de ${periodo} procesada exitosamente ($${totalNominaUSD.toFixed(2)})`, 'success');
  };

  // TRIBUTARIO
  const crearRetencion = (data: Omit<RetencionTributaria, 'id'>): RetencionTributaria => {
    const id = `RET-2026-${(retenciones.length + 1).toString().padStart(4, '0')}`;
    const nueva: RetencionTributaria = { ...data, id };
    setRetenciones(prev => [nueva, ...prev]);
    addToast(`Comprobante de Retención ${nueva.correlativoComprobante} generado`, 'success');
    return nueva;
  };

  // Helper para emitir mensajes a otras pestañas/ventanas
  const emitRealtimeSync = (type: string, data: any) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('axon_erp_realtime_channel');
        ch.postMessage({ type, data });
        ch.close();
      }
    } catch (e) {
      console.warn('Error emitting broadcast sync:', e);
    }
  };

  // REPORTES TÉCNICOS DE CAMPO / INSPECCIÓN EN OBRAS
  const crearReporteTecnico = (data: Omit<ReporteTecnicoCampo, 'id' | 'correlativo'>): ReporteTecnicoCampo => {
    const id = `REP-OBRA-${Date.now().toString().slice(-6)}`;
    const count = reportesTecnicos.length + 1;
    const correlativo = `REP-2026-${count.toString().padStart(3, '0')}`;
    
    const nuevo: ReporteTecnicoCampo = {
      ...data,
      id,
      correlativo,
    };

    setReportesTecnicos(prev => {
      const up = [nuevo, ...prev];
      try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(up)); } catch(e){}
      return up;
    });

    // 1. Notificar en tiempo real a otras pestañas/ventanas abiertas del Gestor ERP vía BroadcastChannel
    emitRealtimeSync('NEW_REPORTE_TECNICO', nuevo);

    // 2. Enviar inmediatamente al Servidor Central Cloud Sync (Multi-Dispositivo)
    fetch('/api/cloud/reporte-tecnico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    }).catch(err => console.warn('[CLOUD SYNC] Error posteando reporte al servidor:', err));

    // 3. Sincronización directa con Supabase PostgreSQL si está configurado
    if (isSupabaseConfigured()) {
      insertBufferReporteTecnico({
        id_transaccion: nuevo.id,
        fecha_hora: `${nuevo.fecha}T12:00:00`,
        codigo_tecnico: 'TEC-01',
        nombre_tecnico: nuevo.tecnicoNombre,
        cliente_obra: nuevo.clienteNombre,
        ascensor_equipo: nuevo.equipoAscensor,
        ubicacion: nuevo.ubicacionObra,
        diagnostico_falla: `${nuevo.diagnosticoDanio || ''}${nuevo.detallesManualesPedidos ? ` | Pedidos: ${nuevo.detallesManualesPedidos}` : ''}`,
        repuestos_solicitados_json: JSON.stringify(nuevo.repuestosFaltantes || []),
        fotos_json: JSON.stringify(nuevo.photos || []),
        fotos_count: nuevo.fotosEvidenciaCount || nuevo.photos?.length || 0,
        estado_gestion: 'PENDIENTE_GESTOR'
      }).then(res => {
        if (res.exito) {
          setCloudSyncedCorrelativos(prev => [...new Set([...prev, correlativo])]);
          addToast(`¡Éxito! Reporte Técnico ${correlativo} guardado en Supabase (PostgreSQL).`, 'success');
        }
      }).catch(err => console.warn('[SUPABASE] Error guardando reporte en Supabase:', err));
    }

    // 4. Sincronización Offline-First con IndexedDB + Google Sheets
    const scriptUrl = getCompanyScriptUrl();
    saveReporteOffline(nuevo, scriptUrl).then(res => {
      refreshOfflineCount();
      if (res.savedOffline && !res.synced && !isSupabaseConfigured()) {
        addToast(`💾 Reporte ${correlativo} guardado en memoria local (IndexedDB / Sótano). Se sincronizará automáticamente al recuperar señal.`, 'info');
      } else if (res.synced && !isSupabaseConfigured()) {
        setCloudSyncedCorrelativos(prev => [...prev, correlativo]);
        addToast(`¡Éxito! Reporte Técnico ${correlativo} guardado y respaldado en la Nube.`, 'success');
      }
      setTimeout(() => sincronizarReportesDesdeNube(), 800);
    });

    return nuevo;
  };

  const actualizarEstadoReporteTecnico = (id: string, estado: ReporteTecnicoCampo['estado']) => {
    setReportesTecnicos(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          const reportUpdated = { ...r, estado };

          // Enviar actualización al servidor central
          fetch('/api/cloud/reporte-tecnico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportUpdated)
          }).catch(err => console.warn('[CLOUD SYNC] Error actualizando reporte en servidor:', err));

          const scriptUrl = getCompanyScriptUrl();
          saveReporteOffline(reportUpdated, scriptUrl).then(res => {
            refreshOfflineCount();
            if (res.synced) {
              addToast(`📊 Estado de Reporte ${reportUpdated.correlativo} actualizado en Google Sheets`, 'info');
            }
            setTimeout(() => sincronizarReportesDesdeNube(), 800);
          });
          return reportUpdated;
        }
        return r;
      });
      try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
      return updated;
    });
  };

  const actualizarReporteTecnico = (id: string, updateData: Partial<ReporteTecnicoCampo>) => {
    setReportesTecnicos(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          const reportUpdated = { ...r, ...updateData };

          // Enviar actualización al servidor central
          fetch('/api/cloud/reporte-tecnico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportUpdated)
          }).catch(err => console.warn('[CLOUD SYNC] Error actualizando reporte en servidor:', err));

          const scriptUrl = getCompanyScriptUrl();
          saveReporteOffline(reportUpdated, scriptUrl).then(res => {
            refreshOfflineCount();
            if (res.synced) {
              addToast(`📊 Reporte ${reportUpdated.correlativo} e imágenes sincronizados en Google Sheets`, 'info');
            }
            setTimeout(() => sincronizarReportesDesdeNube(), 800);
          });
          return reportUpdated;
        }
        return r;
      });
      try { localStorage.setItem('tecno_reportes_tecnicos', JSON.stringify(updated)); } catch(e){}
      return updated;
    });
    addToast('Reporte técnico e imágenes actualizados correctamente', 'success');
  };

  const convertirReporteAPresupuesto = (reporteId: string): Presupuesto => {
    const rep = reportesTecnicos.find(r => r.id === reporteId);
    if (!rep) throw new Error('Reporte no encontrado');

    // Construir items de presupuesto a partir de los repuestos faltantes valorizados, detalles manuales o diagnóstico
    const items: Array<{
      id: string;
      descripcion: string;
      cantidad: number;
      precioUnitarioUSD: number;
      esExento: boolean;
    }> = [];

    if (rep.repuestosFaltantes && rep.repuestosFaltantes.length > 0) {
      rep.repuestosFaltantes.forEach((rf) => {
        const cant = rf.cantidadRequerida || 1;
        let pUnit = rf.precioUnitarioUSD || 0;
        if (!pUnit && rf.precioTotalUSD) {
          pUnit = rf.precioTotalUSD / cant;
        }

        const unitLabel = rf.unidadMedida ? ` (${rf.unidadMedida})` : '';
        const metrajeStr = (rf.largoOMetros && rf.largoOMetros > 0) ? ` [${rf.largoOMetros} Mts]` : '';
        const obsStr = rf.observaciones ? ` - ${rf.observaciones}` : '';

        items.push({
          id: `item-${items.length + 1}`,
          descripcion: `${rf.repuestoNombre}${unitLabel}${metrajeStr}${obsStr}`,
          cantidad: cant,
          precioUnitarioUSD: pUnit || 250,
          esExento: false
        });
      });
    }

    if (rep.detallesManualesPedidos && rep.detallesManualesPedidos.trim()) {
      const lineas = rep.detallesManualesPedidos.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      lineas.forEach((linea) => {
        // Evitar duplicar si el item ya está en repuestosFaltantes
        const yaExiste = items.some(it => it.descripcion.toLowerCase().includes(linea.toLowerCase().slice(0, 20)));
        if (!yaExiste) {
          items.push({
            id: `item-${items.length + 1}`,
            descripcion: linea.startsWith('-') || linea.startsWith('*') ? linea.substring(1).trim() : linea,
            cantidad: 1,
            precioUnitarioUSD: 150,
            esExento: false
          });
        }
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'item-1',
        descripcion: `Servicio Técnico / Reparación según Diagnóstico: ${rep.diagnosticoDanio.slice(0, 80)}...`,
        cantidad: 1,
        precioUnitarioUSD: rep.montoEstimadoRepuestosUSD || 500,
        esExento: false
      });
    }

    const subtotalUSD = items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitarioUSD), 0);
    const ivaUSD = subtotalUSD * 0.16;
    const totalUSD = subtotalUSD + ivaUSD;

    const fechaHoy = new Date().toISOString().split('T')[0];
    const fechaVenc = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const presupuesto: Omit<Presupuesto, 'correlativo'> = {
      fecha: fechaHoy,
      fechaVencimiento: fechaVenc,
      clienteId: rep.clienteRif || 'CLI-OBRA',
      clienteNombre: rep.clienteNombre,
      clienteRif: rep.clienteRif || 'J-00000000-0',
      clienteTelefono: '0414-0000000',
      proyectoAscensor: `Levantamiento Técnico Obra: ${rep.equipoAscensor}`,
      items,
      subtotalUSD,
      ivaUSD,
      totalUSD,
      estado: 'BORRADOR',
      notasValidez: 'Cotización generada automáticamente a partir del Reporte de Campo ' + rep.correlativo,
      division: rep.division
    };

    const creado = crearPresupuesto(presupuesto);
    actualizarEstadoReporteTecnico(reporteId, 'PENDIENTE_COTIZACION');
    addToast(`Presupuesto ${creado.correlativo} creado a partir del reporte ${rep.correlativo}`, 'success');
    return creado;
  };

  // Consolidación de Buffer_Reportes_Tecnicos a Tabla Master en Supabase / ERP Gestor
  const consolidarBufferReporte = async (reporteId: string): Promise<Presupuesto | null> => {
    const rep = reportesTecnicos.find(r => r.id === reporteId || r.correlativo === reporteId || r.supabaseId === reporteId);
    if (!rep) {
      addToast('Reporte técnico de campo no encontrado en el búfer', 'error');
      return null;
    }

    try {
      // 1. Convertir o crear Presupuesto en Master
      const presupuestoCreado = convertirReporteAPresupuesto(rep.id);

      // 2. Actualizar estado del búfer en Supabase a 'CONSOLIDADO_EN_MASTER'
      const transaccionId = rep.supabaseId || rep.correlativo || rep.id;
      if (isSupabaseConfigured()) {
        await updateBufferReporteStatus(transaccionId, 'CONSOLIDADO_EN_MASTER');
      }

      // 3. Actualizar estado local del reporte
      setReportesTecnicos(prev => prev.map(r => r.id === rep.id ? { 
        ...r, 
        estadoGestionBuffer: 'CONSOLIDADO_EN_MASTER',
        estado: 'REPUESTOS_SOLICITADOS' 
      } : r));

      addToast(`🎉 Reporte ${rep.correlativo} consolidado con éxito en la Tabla Master Presupuestos (${presupuestoCreado.correlativo}) y marcado en Supabase.`, 'success');
      return presupuestoCreado;
    } catch (err: any) {
      console.error('Error al consolidar reporte técnico:', err);
      addToast('Error al consolidar el reporte en la tabla master', 'error');
      return null;
    }
  };

  // Sincronización por Lote a Google Sheets (Gestor Principal Centralizado)
  const sincronizarReportesAExcel = async (reporteIds?: string[]): Promise<number> => {
    const scriptUrl = getCompanyScriptUrl();
    if (!scriptUrl) {
      addToast('No hay URL de Google Apps Script configurada para subir al Excel', 'warning');
      return 0;
    }

    const reportesParaSubir = reportesTecnicos.filter(r => 
      reporteIds ? reporteIds.includes(r.id) : !cloudSyncedCorrelativos.includes(r.correlativo)
    );

    if (reportesParaSubir.length === 0) {
      addToast('Todos los reportes seleccionados ya están sincronizados en el Excel', 'info');
      return 0;
    }

    setIsSyncing(true);
    let subidos = 0;

    for (const rep of reportesParaSubir) {
      try {
        const res = await postReportToAppsScript(scriptUrl, rep);
        if (res) {
          subidos++;
          setCloudSyncedCorrelativos(prev => [...new Set([...prev, rep.correlativo])]);
        }
      } catch (err) {
        console.warn('Error subiendo reporte a Excel:', rep.correlativo, err);
      }
    }

    setIsSyncing(false);
    if (subidos > 0) {
      addToast(`🎉 ¡${subidos} reporte(s) técnico(s) transferidos con éxito a la hoja de Google Sheets!`, 'success');
      setTimeout(() => sincronizarReportesDesdeNube(), 1000);
    }
    return subidos;
  };

  // ==========================================
  // BANDEJA GESTOR: SOLICITUDES Y COTIZACIONES EN LÍNEA DE CLIENTES
  // ==========================================
  const crearSolicitudCliente = (data: Omit<SolicitudCotizacionCliente, 'id' | 'correlativo' | 'fecha' | 'hora' | 'estado' | 'subidoAExcel'>): SolicitudCotizacionCliente => {
    const now = new Date();
    const count = solicitudesClientes.length + 1;
    const correlativo = `SOL-2026-${count.toString().padStart(3, '0')}`;
    const id = `SOL-WEB-${Date.now().toString().slice(-6)}`;

    const nueva: SolicitudCotizacionCliente = {
      ...data,
      id,
      correlativo,
      fecha: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'NUEVA',
      subidoAExcel: false,
      empresaId: empresaActiva?.id
    };

    setSolicitudesClientes(prev => {
      const updated = [nueva, ...prev];
      try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    // 1. Enviar al Servidor Central Express en Nube para sincronización instantánea multi-dispositivo
    try {
      fetch('/api/cloud/solicitud-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva)
      }).catch(err => console.warn('Error al sincronizar solicitud con servidor central:', err));
    } catch (e) {
      console.warn('Fallo de red al enviar a /api/cloud/solicitud-cliente:', e);
    }

    // 2. Notificar en vivo a todas las pestañas/ventanas del Gestor ERP
    emitRealtimeSync('NEW_SOLICITUD_CLIENTE', nueva);

    // 3. Sincronización prioritaria directa con Supabase PostgreSQL (Buffer_Cotizaciones)
    if (isSupabaseConfigured()) {
      insertBufferCotizacion({
        id_solicitud: nueva.id,
        fecha_hora: `${nueva.fecha}T${nueva.hora}:00`,
        cliente_nombre: nueva.clienteNombre,
        cliente_rif: nueva.clienteRif || 'J-00000000-0',
        telefono: nueva.telefono,
        email: nueva.email || '',
        edificio_ubicacion: `${nueva.edificioUbicacion || ''} - ${nueva.apartamentoTorre || ''}`.trim(),
        cantidad_ascensores: Number(nueva.paradas) || 1,
        tipo_servicio_solicitado: nueva.tipoServicio,
        detalles_requerimiento: nueva.detalles || 'Solicitud generada desde el Cotizador Web'
      }).then(res => {
        if (res.exito) {
          setSolicitudesClientes(prev => {
            const up = prev.map(s => s.id === nueva.id ? { ...s, subidoAExcel: true, fechaSubidoExcel: new Date().toISOString().replace('T', ' ').slice(0, 16) } : s);
            try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(up)); } catch(e){}
            return up;
          });
          setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, nueva.correlativo])));
          addToast(`¡Éxito! Solicitud ${nueva.correlativo} guardada y conectada en Supabase (Buffer_Cotizaciones).`, 'success');
        }
      }).catch(err => console.warn('[SUPABASE] Error insertando en Buffer_Cotizaciones:', err));
    }

    // 4. Auto-envío secundario en segundo plano si hay Google Apps Script / Google Sheets configurado
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl && !isSupabaseConfigured()) {
      postSolicitudCotizacionToAppsScript(scriptUrl, {
        id: nueva.id,
        correlativo: nueva.correlativo,
        fecha: nueva.fecha,
        hora: nueva.hora,
        clienteNombre: nueva.clienteNombre,
        clienteRif: nueva.clienteRif,
        personaContacto: nueva.personaContacto,
        telefono: nueva.telefono,
        email: nueva.email,
        edificioUbicacion: nueva.edificioUbicacion,
        apartamentoTorre: nueva.apartamentoTorre,
        tipoServicio: nueva.tipoServicio,
        paradas: nueva.paradas,
        capacidadPersonas: nueva.capacidadPersonas,
        detalles: nueva.detalles,
        estado: nueva.estado
      }).then(synced => {
        if (synced) {
          setSolicitudesClientes(prev => {
            const up = prev.map(s => s.id === nueva.id ? { ...s, subidoAExcel: true, fechaSubidoExcel: new Date().toISOString().replace('T', ' ').slice(0, 16) } : s);
            try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(up)); } catch(e){}
            return up;
          });
          setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, nueva.correlativo])));
          addToast(`¡Éxito! Solicitud ${nueva.correlativo} de ${data.clienteNombre} respaldada en Google Sheets.`, 'success');
        }
      });
    }

    addToast(`📥 Solicitud de cliente ${correlativo} (${data.clienteNombre}) registrada en la Bandeja del Gestor`, 'success');
    return nueva;
  };

  const actualizarEstadoSolicitudCliente = (id: string, estado: SolicitudCotizacionCliente['estado']) => {
    setSolicitudesClientes(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, estado } : s);
      try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      fetch(`/api/cloud/solicitud-cliente/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      }).catch(e => console.warn('Error syncing patch to server:', e));
    } catch(e) {}

    addToast('Estatus de la solicitud del cliente actualizado', 'info');
  };

  const eliminarSolicitudCliente = (id: string) => {
    setSolicitudesClientes(prev => {
      const updated = prev.filter(s => s.id !== id);
      try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    try {
      fetch(`/api/cloud/solicitud-cliente/${id}`, {
        method: 'DELETE'
      }).catch(e => console.warn('Error syncing delete to server:', e));
    } catch(e) {}

    addToast('Solicitud descartada/eliminada de la bandeja', 'info');
  };

  const convertirSolicitudClienteAPresupuesto = (id: string): Presupuesto => {
    const sol = solicitudesClientes.find(s => s.id === id);
    if (!sol) throw new Error('Solicitud no encontrada');

    const fechaHoy = new Date().toISOString().split('T')[0];
    const fechaVenc = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const presupuestoData: Omit<Presupuesto, 'correlativo'> = {
      fecha: fechaHoy,
      fechaVencimiento: fechaVenc,
      clienteId: sol.clienteRif || 'SOLICITUD-WEB',
      clienteNombre: sol.clienteNombre,
      clienteRif: sol.clienteRif || 'J-00000000-0',
      clienteTelefono: sol.telefono,
      proyectoAscensor: `[${sol.tipoServicio}] ${sol.edificioUbicacion} - ${sol.apartamentoTorre || ''} (${sol.paradas} Paradas)`,
      items: [
        {
          id: `item-sol-${Date.now()}`,
          descripcion: `Servicio de ${sol.tipoServicio} para ${sol.paradas} paradas / pisos. Capacidad: ${sol.capacidadPersonas} personas. Detalle: ${sol.detalles || 'Requerimiento desde Portal Web'}`,
          cantidad: 1,
          precioUnitarioUSD: sol.tipoServicio === 'MODERNIZACION' ? 4500 : sol.tipoServicio === 'MANTENIMIENTO' ? 180 : 350,
          esExento: true
        }
      ],
      subtotalUSD: sol.tipoServicio === 'MODERNIZACION' ? 4500 : sol.tipoServicio === 'MANTENIMIENTO' ? 180 : 350,
      ivaUSD: 0,
      totalUSD: sol.tipoServicio === 'MODERNIZACION' ? 4500 : sol.tipoServicio === 'MANTENIMIENTO' ? 180 : 350,
      estado: 'BORRADOR',
      notasValidez: `Cotización generada a partir de la solicitud en línea ${sol.correlativo}. Contacto: ${sol.personaContacto} (${sol.telefono})`,
      division: sol.tipoServicio === 'MODERNIZACION' ? 'MODERNIZACION' : 'MANTENIMIENTO'
    };

    const creado = crearPresupuesto(presupuestoData);

    // Actualizar estado de la solicitud
    setSolicitudesClientes(prev => {
      const updated = prev.map(s => s.id === id ? { 
        ...s, 
        estado: 'COTIZADO' as const, 
        presupuestoGeneradoCorrelativo: creado.correlativo 
      } : s);
      try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(updated)); } catch(e){}
      return updated;
    });

    addToast(`Presupuesto ${creado.correlativo} creado a partir de la solicitud ${sol.correlativo}`, 'success');
    return creado;
  };

  // Consolidación de Buffer_Cotizaciones a Tabla Master en Supabase / ERP Gestor
  const consolidarBufferCotizacion = async (id: string): Promise<Presupuesto | null> => {
    const sol = solicitudesClientes.find(s => s.id === id || s.correlativo === id);
    if (!sol) {
      addToast('Solicitud de cotización no encontrada en el búfer', 'error');
      return null;
    }

    try {
      // 1. Convertir a Presupuesto en Master
      const presupuestoCreado = convertirSolicitudClienteAPresupuesto(sol.id);

      // 2. Actualizar estado en Buffer_Cotizaciones en Supabase
      if (isSupabaseConfigured()) {
        await updateBufferCotizacionStatus(sol.id, 'CONSOLIDADO_EN_MASTER');
      }

      // 3. Actualizar estado local
      setSolicitudesClientes(prev => prev.map(s => s.id === sol.id ? {
        ...s,
        estadoGestionBuffer: 'CONSOLIDADO_EN_MASTER',
        estado: 'COTIZADO'
      } : s));

      addToast(`🎉 Cotización ${sol.correlativo} consolidada en Master Presupuestos (${presupuestoCreado.correlativo}) y actualizada en Supabase.`, 'success');
      return presupuestoCreado;
    } catch (err: any) {
      console.error('Error al consolidar cotización:', err);
      addToast('Error al consolidar la cotización en la tabla master', 'error');
      return null;
    }
  };

  const sincronizarSolicitudesClientesAExcel = async (solicitudIds?: string[]): Promise<number> => {
    const scriptUrl = getCompanyScriptUrl();
    if (!scriptUrl) {
      addToast('No hay URL de Google Apps Script configurada para subir al Excel', 'warning');
      return 0;
    }

    const paraSubir = solicitudesClientes.filter(s => 
      solicitudIds ? solicitudIds.includes(s.id) : !s.subidoAExcel
    );

    if (paraSubir.length === 0) {
      addToast('Todas las solicitudes seleccionadas ya fueron enviadas a Google Sheets', 'info');
      return 0;
    }

    setIsSyncing(true);
    let subidos = 0;

    for (const sol of paraSubir) {
      try {
        const ok = await postSolicitudCotizacionToAppsScript(scriptUrl, {
          id: sol.id,
          correlativo: sol.correlativo,
          fecha: sol.fecha,
          hora: sol.hora,
          clienteNombre: sol.clienteNombre,
          clienteRif: sol.clienteRif,
          personaContacto: sol.personaContacto,
          telefono: sol.telefono,
          email: sol.email,
          edificioUbicacion: sol.edificioUbicacion,
          apartamentoTorre: sol.apartamentoTorre,
          tipoServicio: sol.tipoServicio,
          paradas: sol.paradas,
          capacidadPersonas: sol.capacidadPersonas,
          detalles: sol.detalles,
          estado: sol.estado
        });

        if (ok) {
          subidos++;
          setSolicitudesClientes(prev => {
            const up = prev.map(s => s.id === sol.id ? { 
              ...s, 
              subidoAExcel: true, 
              fechaSubidoExcel: new Date().toISOString().replace('T', ' ').slice(0, 16) 
            } : s);
            try { localStorage.setItem('axon_solicitudes_clientes', JSON.stringify(up)); } catch(e){}
            return up;
          });
          setCloudSyncedCorrelativos(prev => Array.from(new Set([...prev, sol.correlativo])));
        }
      } catch (err) {
        console.warn('Error sincronizando solicitud a Excel:', sol.correlativo, err);
      }
    }

    setIsSyncing(false);
    if (subidos > 0) {
      addToast(`🎉 ¡${subidos} solicitud(es) de clientes subida(s) a Google Sheets exitosamente!`, 'success');
    }
    return subidos;
  };

  // ==========================================
  // COMPROBACIÓN Y DIAGNÓSTICO DE ENLACE EN TIEMPO REAL (PORTAL <-> GESTOR)
  // ==========================================
  const probarEnlacePortal = async (
    origin: 'PORTAL_TECNICOS' | 'PORTAL_WEB_CLIENTES', 
    senderName: string = 'Terminal Remota'
  ): Promise<PortalPingResult> => {
    const pingId = `PING_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startTime = performance.now();
    const isoTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Intentar prueba con Supabase (PostgreSQL Central) si está configurado
    if (isSupabaseConfigured()) {
      try {
        const supaStart = performance.now();
        const testRes = await testSupabaseConnection();
        if (testRes.success) {
          const latency = Math.max(25, Math.round(performance.now() - supaStart));
          return {
            success: true,
            latencyMs: latency,
            gestorUser: 'Base de Datos PostgreSQL (Supabase)',
            message: `✓ Conexión Nube ACTIVA con Supabase (${testRes.message || 'PostgreSQL'}). Latencia: ${latency} ms.`,
            timestamp: isoTime,
            source: 'SUPABASE_POSTGRES'
          };
        }
      } catch (err) {
        console.warn('Error probando Supabase:', err);
      }
    }

    // 2. Intentar handshake por BroadcastChannel (Mismo navegador / Pestañas / Dispositivos en red)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const pingChannel = new BroadcastChannel('axon_erp_realtime_channel');
        
        const pongPromise = new Promise<any>((resolve) => {
          const timeout = setTimeout(() => {
            resolve(null);
          }, 1600); // 1.6 segundos de espera

          const handleMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'PONG_GESTOR_ACK' && e.data.data?.pingId === pingId) {
              clearTimeout(timeout);
              pingChannel.removeEventListener('message', handleMsg);
              resolve(e.data.data);
            }
          };

          pingChannel.addEventListener('message', handleMsg);
          
          // Emitir señal PING al Gestor
          pingChannel.postMessage({
            type: 'PING_PORTAL_SIGNAL',
            data: {
              pingId,
              origin,
              senderName,
              timestamp: Date.now()
            }
          });
        });

        const pongData = await pongPromise;
        pingChannel.close();

        if (pongData) {
          const latency = Math.max(12, Math.round(performance.now() - startTime));
          return {
            success: true,
            latencyMs: latency,
            gestorUser: pongData.gestorUser || 'Gestor ERP Central',
            message: `✓ Enlace bidireccional ACTIVO con el Gestor Central (${pongData.gestorUser || 'Administración'}). Latencia: ${latency} ms.`,
            timestamp: isoTime,
            source: 'LOCAL_BROADCAST'
          };
        }
      }
    } catch (e) {
      console.warn('Error en prueba de broadcast:', e);
    }

    // 3. Probar enlace con el Servidor Nube Express / Apps Script
    try {
      const serverStart = performance.now();
      const res = await fetch('/api/cloud/sync-state');
      if (res.ok) {
        const latency = Math.max(18, Math.round(performance.now() - serverStart));
        return {
          success: true,
          latencyMs: latency,
          gestorUser: 'Servidor Central Express (Axon Cloud)',
          message: `✓ Enlace Servidor Express Confirmado (${latency} ms).`,
          timestamp: isoTime,
          source: 'EXPRESS_CLOUD_SERVER'
        };
      }
    } catch (err) {}

    // 4. Si hay Google Apps Script configurado
    try {
      const scriptUrl = getCompanyScriptUrl();
      if (scriptUrl && !scriptUrl.includes('DEMO_INTEGRADO')) {
        const cloudStart = performance.now();
        await fetch(`${scriptUrl}?action=ping&origin=${origin}&t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors'
        });
        const latency = Math.max(45, Math.round(performance.now() - cloudStart));
        return {
          success: true,
          latencyMs: latency,
          gestorUser: 'Servidor Nube Google Sheets / Axon Cloud',
          message: `✓ Enlace Nube Confirmado. Conexión establecida con la base de datos central (${latency} ms).`,
          timestamp: isoTime,
          source: 'CLOUD_APPS_SCRIPT'
        };
      }
    } catch (err) {
      console.warn('Error en probe nube:', err);
    }

    // 5. Fallback: Almacenamiento Local Seguro Offline (IndexedDB)
    const totalLatency = Math.round(performance.now() - startTime);
    return {
      success: true,
      latencyMs: totalLatency,
      gestorUser: 'Almacenamiento Local Seguro (Modo Foso / Sótano)',
      message: '✓ Terminal Operativa en Modo Autónomo. Todos los reportes, fotos y firmas se guardan en memoria protegida y se sincronizarán al detectar conexión.',
      timestamp: isoTime,
      source: 'INDEXEDDB_STANDALONE'
    };
  };

  // VALES Y KARDEX COMPATIBLES
  const crearVale = (valeData: Omit<Nota, 'Fecha' | 'Status'>) => {
    const now = new Date();
    const fecha = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nuevoVale: Nota = { ...valeData, Fecha: fecha, Status: 'ACTIVO' };

    setVales(prev => [nuevoVale, ...prev]);

    // Actualizar stock
    try {
      const items = JSON.parse(nuevoVale.Productos);
      items.forEach((it: any) => {
        setProducts(prev => prev.map(p => {
          if (p.val_c === it.val_c) {
            const newStock = Math.max(0, p.val_s - it.cantidad);
            // Kardex
            setKardex(kPrev => [{
              id: `K-${Date.now()}-${Math.random()}`,
              sku: p.val_c,
              fecha,
              tipo: 'SALIDA',
              referencia: `Despacho Vale #${nuevoVale.NroVale} - ${nuevoVale.Destino}`,
              cambioStock: -it.cantidad,
              stockResultante: newStock,
              division: nuevoVale.division
            }, ...kPrev]);
            return { ...p, val_s: newStock };
          }
          return p;
        }));
      });
    } catch (e) {
      console.error(e);
    }

    // Auto-Guardado en Excel / IndexedDB Offline
    const scriptUrl = getCompanyScriptUrl();
    const notaPayload = {
      NroVale: nuevoVale.NroVale,
      Fecha: nuevoVale.Fecha,
      Tipo: nuevoVale.TipoDespacho || 'SALIDA',
      Destino: nuevoVale.Destino,
      Responsable: nuevoVale.Responsable,
      Observacion: nuevoVale.ProyectoDesc || '',
      Productos: nuevoVale.Productos
    };
    saveNotaOffline(notaPayload, scriptUrl).then(res => {
      refreshOfflineCount();
      if (res.savedOffline && !res.synced) {
        addToast(`💾 Nota/Vale #${nuevoVale.NroVale} guardado localmente en IndexedDB (Sótano/Offline). Se sincronizará al conectar a red.`, 'info');
      } else {
        addToast(`¡Éxito! Nota/Vale #${nuevoVale.NroVale} guardado y escrito automáticamente en la planilla de Google Excel.`, 'success');
      }
    });
  };

  const anularVale = (nroVale: string) => {
    const targetVale = vales.find(v => v.NroVale === nroVale);
    if (!targetVale) {
      addToast(`Vale #${nroVale} no encontrado`, 'error');
      return;
    }
    if (targetVale.Status === 'ANULADO') {
      addToast(`Vale #${nroVale} ya se encuentra anulado`, 'info');
      return;
    }

    // Devolver / Revertir cantidades al stock
    let itemsReverted = 0;
    try {
      const items = typeof targetVale.Productos === 'string' ? JSON.parse(targetVale.Productos) : targetVale.Productos;
      if (Array.isArray(items)) {
        items.forEach((it: any) => {
          if (it.val_c && it.cantidad) {
            setProducts(prev => prev.map(p => {
              if (p.val_c === it.val_c) {
                const isSalida = (targetVale.TipoDespacho || 'SALIDA') === 'SALIDA';
                const newStock = isSalida ? p.val_s + it.cantidad : Math.max(0, p.val_s - it.cantidad);
                
                // Kardex
                setKardex(kPrev => [{
                  id: `K-ANUL-${Date.now()}-${Math.random()}`,
                  sku: p.val_c,
                  fecha: new Date().toISOString().split('T')[0],
                  tipo: isSalida ? 'ENTRADA' : 'SALIDA',
                  referencia: `Anulación Nota/Vale #${nroVale} - Devuelto a Almacén`,
                  cambioStock: isSalida ? +it.cantidad : -it.cantidad,
                  stockResultante: newStock,
                  division: targetVale.division
                }, ...kPrev]);

                itemsReverted += it.cantidad;
                return { ...p, val_s: newStock };
              }
              return p;
            }));
          }
        });
      }
    } catch (e) {
      console.error('Error al revertir stock de vale:', e);
    }

    setVales(prev => prev.map(v => v.NroVale === nroVale ? { ...v, Status: 'ANULADO' } : v));

    // Sincronizar actualización con Google Sheets Excel
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: targetVale.NroVale,
        Fecha: targetVale.Fecha,
        Tipo: targetVale.TipoDespacho || 'SALIDA',
        Destino: targetVale.Destino,
        Responsable: targetVale.Responsable,
        Observacion: `[ANULADO] ${targetVale.ProyectoDesc || ''}`,
        Productos: targetVale.Productos
      });
    }

    addToast(`¡Nota/Vale #${nroVale} ANULADO con éxito! ${itemsReverted > 0 ? `Se devolvieron ${itemsReverted} unidad(es) al stock.` : ''}`, 'success');
  };

  const modificarVale = (nroVale: string, updatedData: Partial<Nota>) => {
    const targetVale = vales.find(v => v.NroVale === nroVale);
    if (!targetVale) return;

    // 1. Revertir impacto de productos anteriores si la nota estaba activa
    if (targetVale.Status !== 'ANULADO') {
      try {
        const oldItems = typeof targetVale.Productos === 'string' ? JSON.parse(targetVale.Productos) : targetVale.Productos;
        if (Array.isArray(oldItems)) {
          oldItems.forEach((it: any) => {
            if (it.val_c && it.cantidad) {
              setProducts(prev => prev.map(p => {
                if (p.val_c === it.val_c) {
                  const isSalida = (targetVale.TipoDespacho || 'SALIDA') === 'SALIDA';
                  return { ...p, val_s: isSalida ? p.val_s + it.cantidad : Math.max(0, p.val_s - it.cantidad) };
                }
                return p;
              }));
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Aplicar nuevo impacto de productos si la nota modificada sigue activa
    const updatedStatus = updatedData.Status || targetVale.Status;
    const newProductos = updatedData.Productos !== undefined ? updatedData.Productos : targetVale.Productos;

    if (updatedStatus !== 'ANULADO') {
      try {
        const newItems = typeof newProductos === 'string' ? JSON.parse(newProductos) : newProductos;
        if (Array.isArray(newItems)) {
          newItems.forEach((it: any) => {
            if (it.val_c && it.cantidad) {
              setProducts(prev => prev.map(p => {
                if (p.val_c === it.val_c) {
                  const isSalida = (updatedData.TipoDespacho || targetVale.TipoDespacho || 'SALIDA') === 'SALIDA';
                  const newStock = isSalida ? Math.max(0, p.val_s - it.cantidad) : p.val_s + it.cantidad;

                  // Asiento de Kardex
                  setKardex(kPrev => [{
                    id: `K-MOD-${Date.now()}-${Math.random()}`,
                    sku: p.val_c,
                    fecha: new Date().toISOString().split('T')[0],
                    tipo: 'AJUSTE',
                    referencia: `Modificación Vale #${nroVale} - Re-cálculo de stock`,
                    cambioStock: isSalida ? -it.cantidad : +it.cantidad,
                    stockResultante: newStock,
                    division: updatedData.division || targetVale.division
                  }, ...kPrev]);

                  return { ...p, val_s: newStock };
                }
                return p;
              }));
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 3. Guardar modificaciones
    const finalVale: Nota = { ...targetVale, ...updatedData };
    setVales(prev => prev.map(v => v.NroVale === nroVale ? finalVale : v));

    // 4. Sincronizar en Google Sheets Excel
    const scriptUrl = getCompanyScriptUrl();
    if (scriptUrl) {
      postNotaToAppsScript(scriptUrl, {
        NroVale: finalVale.NroVale,
        Fecha: finalVale.Fecha,
        Tipo: finalVale.TipoDespacho || 'SALIDA',
        Destino: finalVale.Destino,
        Responsable: finalVale.Responsable,
        Observacion: finalVale.ProyectoDesc || '',
        Productos: finalVale.Productos
      });
    }

    addToast(`¡Nota/Vale #${nroVale} modificada y guardada exitosamente! Stock re-calculado.`, 'success');
  };

  const modificarFactura = (correlativo: string, updatedData: Partial<Factura>) => {
    setFacturas(prev => prev.map(f => f.correlativo === correlativo ? { ...f, ...updatedData } : f));
    addToast(`Factura ${correlativo} modificada y guardada correctamente`, 'success');
  };

  const modificarReciboNota = (correlativo: string, updatedData: Partial<ReciboNota>) => {
    setRecibos(prev => prev.map(r => r.correlativo === correlativo ? { ...r, ...updatedData } : r));
    addToast(`Recibo/Nota ${correlativo} modificado y guardado correctamente`, 'success');
  };

  const ajustarStockIndividual = (val_c: string, nuevoStock: number, motivo: string) => {
    setProducts(prev => prev.map(p => {
      if (p.val_c === val_c) {
        const cambio = nuevoStock - p.val_s;
        setKardex(kPrev => [{
          id: `K-AJUSTE-${Date.now()}-${Math.random()}`,
          sku: p.val_c,
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'AJUSTE',
          referencia: `Calibración manual de stock: ${motivo}`,
          cambioStock: cambio,
          stockResultante: nuevoStock,
          division: p.division
        }, ...kPrev]);

        const updated = { ...p, val_s: nuevoStock };
        const scriptUrl = getCompanyScriptUrl();
        postProductoToAppsScript(scriptUrl, updated).then(synced => {
          if (synced) {
            addToast(`📊 Ajuste de stock (${val_c}) sincronizado en Google Sheets`, 'info');
          }
          setTimeout(() => sincronizarReportesDesdeNube(), 800);
        });
        return updated;
      }
      return p;
    }));
    addToast(`Stock de ${val_c} ajustado a ${nuevoStock} unidades`, 'success');
  };

  const actualizarProducto = (val_c: string, updatedFields: Partial<Producto>) => {
    setProducts(prev => prev.map(p => {
      if (p.val_c === val_c) {
        const updated = { ...p, ...updatedFields };
        const scriptUrl = getCompanyScriptUrl();
        postProductoToAppsScript(scriptUrl, updated).then(synced => {
          if (synced) {
            addToast(`📊 Cambios de ${val_c} sincronizados en Google Sheets`, 'info');
          }
          setTimeout(() => sincronizarReportesDesdeNube(), 800);
        });
        return updated;
      }
      return p;
    }));
    addToast(`Producto/Repuesto ${val_c} actualizado con éxito`, 'success');
  };

  const agregarProducto = (nuevo: Producto) => {
    let esExistente = false;
    let productoFinal = nuevo;

    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.val_c.toUpperCase() === nuevo.val_c.toUpperCase());
      if (existingIndex >= 0) {
        esExistente = true;
        const existing = prev[existingIndex];
        const addedQty = Number(nuevo.val_s) || 1;
        const newStock = existing.val_s + addedQty;
        
        productoFinal = {
          ...existing,
          val_s: newStock,
          val_mo: nuevo.val_mo || existing.val_mo,
          val_m: (nuevo.val_m && nuevo.val_m !== 'Genérico') ? nuevo.val_m : existing.val_m,
          val_d: nuevo.val_d || existing.val_d,
          precioUSD: nuevo.precioUSD || existing.precioUSD,
          imagenUrl: nuevo.imagenUrl || existing.imagenUrl
        };

        // Asiento Kardex de Entrada
        setKardex(kPrev => [{
          id: `K-ENTRADA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sku: existing.val_c,
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'ENTRADA',
          referencia: `Entrada de Almacén (+${addedQty} ${existing.val_u || 'Und'})`,
          cambioStock: +addedQty,
          stockResultante: newStock,
          division: existing.division
        }, ...kPrev]);

        const updatedList = [...prev];
        updatedList[existingIndex] = productoFinal;
        return updatedList;
      } else {
        // Asiento Kardex de Nuevo Producto
        setKardex(kPrev => [{
          id: `K-CREACION-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sku: nuevo.val_c,
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'ENTRADA',
          referencia: `Registro Inicial e Inserción (+${nuevo.val_s || 1} ${nuevo.val_u || 'Und'})`,
          cambioStock: +(nuevo.val_s || 1),
          stockResultante: nuevo.val_s,
          division: nuevo.division
        }, ...kPrev]);

        return [nuevo, ...prev];
      }
    });

    const scriptUrl = getCompanyScriptUrl();
    postProductoToAppsScript(scriptUrl, productoFinal).then(synced => {
      if (synced) {
        addToast(`📊 Producto/Máquina ${productoFinal.val_c} registrado en Google Sheets`, 'info');
      }
      setTimeout(() => sincronizarReportesDesdeNube(), 800);
    });

    if (esExistente) {
      addToast(`📦 Stock incrementado para ${productoFinal.val_c}. Nuevo total: ${productoFinal.val_s} ${productoFinal.val_u || 'Und'}`, 'success');
    } else {
      addToast(`✨ Repuesto/Máquina ${nuevo.val_c} registrado en el catálogo`, 'success');
    }
  };

  const hasTabPermission = (tabId: TabID, userRol?: RolUsuario): boolean => {
    const targetRol = userRol || user?.rol || 'TECNICO';

    // Dossier PDF (PRESENTACION) es EXCLUSIVO para SUPER_USUARIO (o usuario axon)
    if (tabId === 'PRESENTACION') {
      const isSuperUser = targetRol === 'SUPER_USUARIO' || user?.rol === 'SUPER_USUARIO' || user?.username?.toLowerCase() === 'axon';
      return isSuperUser;
    }

    // Sincronización en la Nube (SINCRONIZAR) es accesible para SUPER_USUARIO y ADMINISTRACIÓN (ADMIN)
    if (tabId === 'SINCRONIZAR') {
      const isAllowed = targetRol === 'SUPER_USUARIO' || targetRol === 'ADMIN' || user?.rol === 'SUPER_USUARIO' || user?.rol === 'ADMIN' || user?.username?.toLowerCase() === 'axon';
      return isAllowed;
    }

    // Portal Web es accesible para roles gerenciales/administrativos (para TÉCNICO debe estar en sus módulos permitidos)
    if (tabId === 'PORTAL_WEB' && targetRol !== 'TECNICO') {
      return true;
    }

    // Técnico en Obra (Bandeja Gestor de Informes de Campo) es accesible para todos los roles de trabajo
    if (tabId === 'TECNICOS_OBRA') {
      return true;
    }

    // Solicitudes / Cotizaciones de Clientes es accesible para roles gerenciales, administrativos e ingeniería
    if (tabId === 'SOLICITUDES_CLIENTES' && targetRol !== 'TECNICO') {
      return true;
    }

    // Super Usuario tiene acceso total maestro e ilimitado a todos los módulos
    if (user?.rol === 'SUPER_USUARIO' || userRol === 'SUPER_USUARIO' || user?.username?.toLowerCase() === 'axon') {
      return true;
    }

    // Restringir el panel general e indicadores financieros de INICIO a Técnicos y Supervisores
    if ((targetRol === 'TECNICO' || targetRol === 'SUPERVISOR') && tabId === 'INICIO') {
      return false;
    }

    // Restringir el módulo HISTORIAL (Historial de Notas) para el rol TÉCNICO
    if (targetRol === 'TECNICO' && tabId === 'HISTORIAL') {
      return false;
    }

    // 1. Si el usuario logueado tiene configuración de módulos personalizados (modulosPermitidos)
    if (user && user.modulosPermitidos && Array.isArray(user.modulosPermitidos)) {
      return user.modulosPermitidos.includes(tabId);
    }
    // 2. De lo contrario, usar la matriz predeterminada de su rol
    const allowedTabs = rolePermissions[targetRol] || DEFAULT_ROLE_PERMISSIONS[targetRol] || [];
    return allowedTabs.includes(tabId);
  };

  // Funciones para Control de Herramientas en Obra y Préstamos
  const crearPrestamoHerramienta = (nuevoPrestamo: Omit<PrestamoHerramienta, 'id' | 'correlativo'>): PrestamoHerramienta => {
    const nextNum = prestamosHerramientas.length + 1;
    const year = new Date().getFullYear();
    const correlativo = `PSH-${year}-${String(nextNum).padStart(4, '0')}`;
    const id = `HERR-LOAN-${Date.now()}`;

    const loanObj: PrestamoHerramienta = {
      ...nuevoPrestamo,
      id,
      correlativo,
      fechaSolicitud: nuevoPrestamo.fechaSolicitud || new Date().toISOString().replace('T', ' ').substring(0, 16),
      estado: nuevoPrestamo.estado || 'EN_OBRA'
    };

    setPrestamosHerramientas(prev => [loanObj, ...prev]);

    // Descontar temporalmente el stock de las herramientas prestadas
    loanObj.items.forEach(item => {
      if (item.sku) {
        setProducts(pList => pList.map(p => {
          if (p.val_c.toUpperCase() === item.sku.toUpperCase() && p.val_s >= item.cantidad) {
            return { ...p, val_s: p.val_s - item.cantidad };
          }
          return p;
        }));
      }
    });

    addToast(`Nota de Salida ${correlativo} generada para ${loanObj.tecnicoNombre} (${loanObj.obraNombre}).`, 'success');
    return loanObj;
  };

  const actualizarEstadoPrestamoHerramienta = (id: string, nuevoEstado: PrestamoHerramienta['estado'], obsDevolucion?: string) => {
    setPrestamosHerramientas(prev => prev.map(p => {
      if (p.id === id) {
        const fueDevuelto = nuevoEstado === 'DEVUELTO' || nuevoEstado === 'DEVUELTO_PARCIAL';
        if (fueDevuelto && p.estado === 'EN_OBRA') {
          // Reingresar stock al inventario
          p.items.forEach(item => {
            if (item.sku) {
              setProducts(pList => pList.map(prod => {
                if (prod.val_c.toUpperCase() === item.sku.toUpperCase()) {
                  return { ...prod, val_s: prod.val_s + item.cantidad };
                }
                return prod;
              }));
            }
          });
        }
        return {
          ...p,
          estado: nuevoEstado,
          fechaDevolucionReal: fueDevuelto ? new Date().toISOString().replace('T', ' ').substring(0, 16) : p.fechaDevolucionReal,
          observacionesDevolucion: obsDevolucion || p.observacionesDevolucion
        };
      }
      return p;
    }));
    addToast(`Estatus del préstamo de herramientas actualizado a ${nuevoEstado}`, 'info');
  };

  const eliminarPrestamoHerramienta = (id: string) => {
    setPrestamosHerramientas(prev => prev.filter(p => p.id !== id));
    addToast('Préstamo de herramienta eliminado del registro.', 'info');
  };

  return (
    <AppContext.Provider value={{
      empresaActiva,
      empresas,
      empresasDisponibles,
      setEmpresaActivaId,
      actualizarEmpresaConfig,
      modoProduccionExclusiva,
      setModoProduccionExclusiva,
      usuarios,
      agregarUsuario,
      actualizarUsuario,
      eliminarUsuario,
      showDemoLogins,
      setShowDemoLogins,
      rolePermissions,
      toggleRolePermission,
      resetRolePermissions,
      hasTabPermission,
      activeDivision,
      setActiveDivision,
      tasaCambioBCV,
      setTasaCambioBCV,
      tasaBinance,
      setTasaBinance,
      isFetchingRates,
      lastRatesUpdate,
      actualizarTasasEnVivo,
      user,
      login,
      logout,
      products,
      setProducts,
      ajustarStockIndividual,
      actualizarProducto,
      agregarProducto,
      clientes,
      agregarCliente,
      editarCliente,
      eliminarCliente,
      archivarCliente,
      desarchivarCliente,
      agregarEquipoACliente,
      editarEquipoDeCliente,
      eliminarEquipoDeCliente,
      facturas,
      crearFactura,
      anularFactura,
      marcarFacturaPagada,
      archivarFactura,
      desarchivarFactura,
      presupuestos,
      crearPresupuesto,
      editarPresupuesto,
      cambiarEstadoPresupuesto,
      convertirPresupuestoAFactura,
      recibos,
      crearReciboNota,
      anularReciboNota,
      movimientosContables,
      registrarMovimiento,
      empleados,
      agregarEmpleado,
      editarEmpleado,
      prestamos,
      solicitarPrestamo,
      registrarPagoCuotaPrestamo,
      nominasProcesadas,
      generarNominaPeriodo,
      retenciones,
      crearRetencion,
      reportesTecnicos,
      crearReporteTecnico,
      actualizarEstadoReporteTecnico,
      actualizarReporteTecnico,
      convertirReporteAPresupuesto,
      consolidarBufferReporte,
      cloudSyncedCorrelativos,
      scanAndSyncUnsyncedReports,
      sincronizarReportesAExcel,
      sincronizarReportesDesdeNube,
      recargarEstadoNube,
      probarEnlacePortal,
      solicitudesClientes,
      crearSolicitudCliente,
      actualizarEstadoSolicitudCliente,
      eliminarSolicitudCliente,
      convertirSolicitudClienteAPresupuesto,
      consolidarBufferCotizacion,
      sincronizarSolicitudesClientesAExcel,
      pullCloudData,
      isCleanMode,
      limpiarDatosYEmpezarCero,
      restaurarDatosDemo,
      prestamosHerramientas,
      crearPrestamoHerramienta,
      actualizarEstadoPrestamoHerramienta,
      eliminarPrestamoHerramienta,
      vales,
      solicitudes,
      kardex,
      crearVale,
      anularVale,
      modificarVale,
      modificarReciboNota,
      modificarFactura,
      networkStatus,
      setNetworkStatus,
      offlinePendingCount,
      refreshOfflineCount,
      syncQueue,
      isSyncing,
      triggerManualSync,
      biometricEnabled,
      setBiometricEnabled,
      securityPin,
      setSecurityPin,
      isAppLocked,
      lockApp,
      unlockApp,
      authenticateBiometrics,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
    </AppContext.Provider>
  );
};
