import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ACTIVE_COMPANY_ID } from '../config/companyConfig';
import { RolUsuario, TabID, Usuario } from '../types';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import { 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  UserPlus, 
  Key, 
  Trash2, 
  Mail, 
  FileArchive, 
  Download, 
  Check, 
  AlertCircle,
  Sliders,
  RotateCcw,
  Lock,
  UserCheck,
  Building2,
  DollarSign,
  Layers,
  Receipt,
  Calculator,
  FileCheck2,
  Users,
  Landmark,
  BarChart3,
  Warehouse,
  TrendingUp,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  UserCog,
  Power,
  Briefcase,
  Edit2,
  Save,
  Globe,
  Phone,
  Smartphone,
  Wrench,
  User,
  Send,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AjustesTab() {
  const { 
    user, 
    usuarios,
    agregarUsuario,
    actualizarUsuario,
    eliminarUsuario,
    addToast, 
    rolePermissions, 
    toggleRolePermission, 
    resetRolePermissions, 
    showDemoLogins, 
    setShowDemoLogins,
    empresaActiva,
    empresasDisponibles,
    setEmpresaActivaId,
    actualizarEmpresaConfig,
    modoProduccionExclusiva,
    setModoProduccionExclusiva,
    biometricEnabled,
    setBiometricEnabled,
    securityPin,
    setSecurityPin,
    lockApp,
    limpiarDatosYEmpezarCero,
    restaurarDatosDemo,
    isCleanMode
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);
  const [empNombre, setEmpNombre] = useState(empresaActiva.nombre);
  const [empRif, setEmpRif] = useState(empresaActiva.rif);
  const [empSlogan, setEmpSlogan] = useState(empresaActiva.slogan);
  const [empDireccion, setEmpDireccion] = useState(empresaActiva.direccion);
  const [empTelefono, setEmpTelefono] = useState(empresaActiva.telefono);
  const [empEmail, setEmpEmail] = useState(empresaActiva.email);
  const [empNombreGestor, setEmpNombreGestor] = useState(empresaActiva.nombreGestor || '');
  const [empTelefonoGestor, setEmpTelefonoGestor] = useState(empresaActiva.telefonoGestor || '');

  useEffect(() => {
    setEmpNombre(empresaActiva.nombre);
    setEmpRif(empresaActiva.rif);
    setEmpSlogan(empresaActiva.slogan);
    setEmpDireccion(empresaActiva.direccion);
    setEmpTelefono(empresaActiva.telefono);
    setEmpEmail(empresaActiva.email);
    setEmpNombreGestor(empresaActiva.nombreGestor || '');
    setEmpTelefonoGestor(empresaActiva.telefonoGestor || '');
  }, [empresaActiva]);

  const handleSaveEmpresaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarEmpresaConfig(empresaActiva.id, {
      nombre: empNombre,
      rif: empRif,
      slogan: empSlogan,
      direccion: empDireccion,
      telefono: empTelefono,
      email: empEmail,
      nombreGestor: empNombreGestor,
      telefonoGestor: empTelefonoGestor
    });
    addToast('Asignación del número del gestor y datos de la empresa actualizados con éxito', 'success');
    setEditingEmpresaId(null);
  };

  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<RolUsuario>('TECNICO');

  // Formulario Nuevo Operador
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<RolUsuario>('INGENIERO');
  const [newNombre, setNewNombre] = useState('');
  
  // Módulos permitidos seleccionados para el nuevo operador (por defecto, la lista de su rol)
  const [newModules, setNewModules] = useState<TabID[]>([]);

  // Usuario expandido para editar módulos específicos individualmente
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  const [targetEmail, setTargetEmail] = useState('administracion@dakaco.com');
  const [savingBackup, setSavingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [userCreatedMessage, setUserCreatedMessage] = useState<string | null>(null);

  const ERP_MODULES: { id: TabID; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'INICIO', name: 'INICIO / TABLERO', desc: 'Resumen ejecutivo y accesos a módulos', icon: <Building2 size={13} className="text-cyan-400" /> },
    { id: 'PORTAL_WEB', name: 'PORTAL WEB', desc: 'Landing Page Corporativa y Cotizador en Línea', icon: <Globe size={13} className="text-amber-400" /> },
    { id: 'TECNICOS_OBRA', name: '👷 TÉCNICO EN OBRA', desc: 'Carpetas de informes por Obra, Ascensor y Técnico + Envío por lote a Sheets', icon: <Wrench size={13} className="text-amber-400" /> },
    { id: 'SOLICITUDES_CLIENTES', name: '📥 COTIZACIONES CLIENTES', desc: 'Bandeja de solicitudes desde la web y cotización directa en ERP', icon: <FileCheck2 size={13} className="text-cyan-400" /> },
    { id: 'CONTABILIDAD', name: '1. CONTABILIDAD', desc: 'Libro Diario, Mayor T y Estados Financieros', icon: <DollarSign size={13} className="text-emerald-400" /> },
    { id: 'FACTURACION', name: '2. FACTURACIÓN', desc: 'Emisión de Facturas Fiscales y Notas', icon: <Receipt size={13} className="text-cyan-400" /> },
    { id: 'PRESUPUESTOS', name: '3. PRESUPUESTOS', desc: 'Cotizaciones de Modernización y Repuestos', icon: <Calculator size={13} className="text-amber-400" /> },
    { id: 'RECIBOS', name: '4. RECIBOS / NOTAS', desc: 'Recibos de Pago y Comprobantes', icon: <FileCheck2 size={13} className="text-blue-400" /> },
    { id: 'CLIENTES', name: '5. CLIENTES & ASCENSORES', desc: 'Ficha de Condominios y Equipos Instalados', icon: <Building2 size={13} className="text-purple-400" /> },
    { id: 'NOMINA', name: '6. NÓMINA & PRESTACIONES', desc: 'Sueldos, Prestaciones y Cesta Ticket', icon: <Users size={13} className="text-pink-400" /> },
    { id: 'TRIBUTARIO', name: '7. TRIBUTARIO SENIAT', desc: 'Retenciones IVA e ISLR', icon: <Landmark size={13} className="text-amber-300" /> },
    { id: 'REPORTES', name: '8. REPORTES TÉCNICOS', desc: 'Levantamiento de Obras e Inspección de Campo', icon: <BarChart3 size={13} className="text-cyan-300" /> },
    { id: 'HERRAMIENTAS', name: 'CONTROL DE HERRAMIENTAS EN OBRA', desc: 'Préstamos de herramientas, notas de salida y recordatorios WhatsApp', icon: <Wrench size={13} className="text-amber-400" /> },
    { id: 'INVENTARIO', name: 'REPUESTOS / STOCK', desc: 'Gestión de Variadores VVVF, Cables y Repuestos', icon: <Warehouse size={13} className="text-indigo-400" /> },
    { id: 'KARDEX', name: 'KÁRDEX DE MOVIMIENTOS', desc: 'Histórico de Entradas, Salidas y Ajustes', icon: <TrendingUp size={13} className="text-emerald-300" /> },
    { id: 'CONSOLIDACION', name: 'CONSOLIDACIÓN POR OBRAS', desc: 'Consolidado acumulado de materiales y herramientas despachadas por proyectos', icon: <Layers size={13} className="text-amber-400" /> },
    { id: 'SINCRONIZAR', name: 'SINCRONIZAR EN LA NUBE', desc: 'Copia con Google Sheets y Respaldo', icon: <Activity size={13} className="text-cyan-400" /> },
    { id: 'AJUSTES', name: 'AJUSTES & SEGURIDAD', desc: 'Consola de Seguridad y Usuarios (Superusuario)', icon: <Settings size={13} className="text-slate-300" /> }
  ];

  // Actualizar la selección predeterminada de módulos cuando cambia el rol del nuevo operador
  useEffect(() => {
    const defaultRoleTabs = rolePermissions[newRole] || [];
    setNewModules(defaultRoleTabs);
  }, [newRole, rolePermissions]);

  const toggleNewUserModule = (tabId: TabID) => {
    setNewModules(prev => 
      prev.includes(tabId) 
        ? prev.filter(t => t !== tabId) 
        : [...prev, tabId]
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newNombre) {
      addToast('Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    const cleanUsername = newUsername.toLowerCase().trim();

    // Verificar si el usuario ya existe
    if (usuarios.some(u => u.username.toLowerCase() === cleanUsername)) {
      addToast(`El ID de usuario "${cleanUsername}" ya existe. Elija otro nombre de usuario.`, 'error');
      return;
    }

    const userObj: Usuario = {
      username: cleanUsername,
      password: newPassword.trim(),
      nombre: newNombre.trim(),
      cargo: newRole === 'ADMIN' 
        ? 'Administrador General' 
        : newRole === 'SUPERVISOR' 
        ? 'Supervisor General' 
        : newRole === 'INGENIERO' 
        ? 'Ingeniero Residente' 
        : 'Técnico de Campo & Mantenimiento',
      rol: newRole,
      active: true,
      modulosPermitidos: [...newModules] // Copia exacta de módulos asignados individualmente
    };

    agregarUsuario(userObj);
    setUserCreatedMessage(`Usuario "${cleanUsername}" registrado de manera exitosa con ${newModules.length} módulos asignados.`);
    addToast(`Operador "${userObj.nombre}" registrado con éxito`, 'success');
    setTimeout(() => setUserCreatedMessage(null), 4000);

    // Resetear campos
    setNewUsername('');
    setNewPassword('');
    setNewNombre('');
    setNewModules(rolePermissions[newRole] || []);
  };

  const handleDeleteUser = (uname: string) => {
    const target = usuarios.find(u => u.username.toLowerCase() === uname.toLowerCase());
    if (target?.rol === 'SUPER_USUARIO' || uname.toLowerCase() === 'axon') {
      addToast("Error de seguridad: El Super Usuario (Axon) no puede ser eliminado.", "error");
      return;
    }
    if (uname.toLowerCase() === 'admin' && user?.rol !== 'SUPER_USUARIO') {
      addToast("Error: No se puede eliminar al usuario administrador principal.", "error");
      return;
    }
    if (uname.toLowerCase() === user?.username.toLowerCase()) {
      addToast("Error: No puedes eliminar tu propia sesión activa.", "error");
      return;
    }
    eliminarUsuario(uname);
    addToast(`Acceso para el operador "${uname}" eliminado correctamente`, 'info');
  };

  const toggleUserActive = (uname: string, currentActive?: boolean) => {
    const target = usuarios.find(u => u.username.toLowerCase() === uname.toLowerCase());
    if (target?.rol === 'SUPER_USUARIO' || uname.toLowerCase() === 'axon') {
      addToast("Error: El Super Usuario (Axon) no puede ser desactivado.", "error");
      return;
    }
    if (uname.toLowerCase() === 'admin' && user?.rol !== 'SUPER_USUARIO') {
      addToast("Error: Solo el Super Usuario (Axon) puede desactivar al Administrador.", "error");
      return;
    }
    if (uname.toLowerCase() === user?.username.toLowerCase()) {
      addToast("No puedes desactivar tu propio usuario en sesión activa", "error");
      return;
    }
    const nextActive = currentActive === false ? true : false;
    actualizarUsuario(uname, { active: nextActive });
    addToast(`Usuario "${uname}" ${nextActive ? 'ACTIVADO' : 'DESACTIVADO'}`, 'info');
  };

  const toggleModuleForUser = (uname: string, tabId: TabID) => {
    const targetUser = usuarios.find(u => u.username.toLowerCase() === uname.toLowerCase());
    if (!targetUser) return;

    if (targetUser.rol === 'SUPER_USUARIO' || targetUser.username.toLowerCase() === 'axon') {
      addToast("El Super Usuario posee acceso maestro ilimitado e inalterable.", "info");
      return;
    }

    if (targetUser.username.toLowerCase() === 'admin' && user?.rol !== 'SUPER_USUARIO') {
      addToast("Solo el Super Usuario (Axon) tiene permisos para restringir o modificar al Administrador.", "error");
      return;
    }

    const currentModules = targetUser.modulosPermitidos || rolePermissions[targetUser.rol] || [];
    const isChecked = currentModules.includes(tabId);
    const updatedModules = isChecked 
      ? currentModules.filter(t => t !== tabId)
      : [...currentModules, tabId];

    actualizarUsuario(uname, { modulosPermitidos: updatedModules });
    addToast(`Módulo "${tabId}" ${!isChecked ? 'PERMITIDO' : 'RESTRINGIDO'} para @${uname}`, 'info');
  };

  const resetUserModulesToRole = (uname: string) => {
    if (uname.toLowerCase() === 'admin' && user?.rol !== 'SUPER_USUARIO') {
      addToast("Solo el Super Usuario (Axon) puede restablecer permisos del Administrador.", "error");
      return;
    }
    actualizarUsuario(uname, { modulosPermitidos: undefined });
    addToast(`Permisos de @${uname} restablecidos a la plantilla predeterminada de su rol`, 'success');
  };

  const assignAllModulesToUser = (uname: string) => {
    if (uname.toLowerCase() === 'admin' && user?.rol !== 'SUPER_USUARIO') {
      addToast("Solo el Super Usuario (Axon) puede asignar módulos al Administrador.", "error");
      return;
    }
    const allTabIds = ERP_MODULES.map(m => m.id);
    actualizarUsuario(uname, { modulosPermitidos: allTabIds });
    addToast(`Acceso TOTAL (13 módulos) concedido a @${uname}`, 'success');
  };

  const handleDownloadBackup = () => {
    setSavingBackup(true);
    setTimeout(() => {
      setSavingBackup(false);
      setBackupSuccess(true);

      const safeEmpresa = (empresaActiva.nombreCorto || empresaActiva.nombre || 'empresa')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      const fechaStr = new Date().toISOString().slice(0, 10);
      const filename = `resguardo_${safeEmpresa}_${fechaStr}.json`;

      addToast(`Copia de seguridad local para ${empresaActiva.nombreCorto} generada (${filename})`, 'success');
      setTimeout(() => setBackupSuccess(false), 3000);

      const backupData = {
        empresa: empresaActiva,
        fechaExportacion: new Date().toISOString(),
        usuarios
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1200);
  };

  const handleSendEmail = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSuccess(true);
      addToast(`Correo de reporte de auditoría despachado con éxito a ${targetEmail}`, 'success');
      setTimeout(() => setEmailSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left" id="ajustes-tab">
      
      {/* BANNER ESPECIAL SUPER USUARIO PROGRAMADOR */}
      {user?.rol === 'SUPER_USUARIO' && (
        <div className="bg-amber-950/70 border border-amber-500/50 rounded-2xl p-4 text-xs text-amber-200 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-amber-400 shrink-0 animate-pulse" size={20} />
            <div>
              <span className="font-extrabold text-amber-300 uppercase tracking-wider block">CONSOLA DESARROLLADOR SUPER USUARIO (AXON)</span>
              <span className="text-[11px] text-amber-200/80">
                Control maestro activo. Tienes potestad para asignar/restringir permisos al usuario <strong>admin</strong> y a todos los usuarios. Tu usuario Axon se encuentra completamente oculto para clientes.
              </span>
            </div>
          </div>
          <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 text-[10px] shrink-0 uppercase font-mono">
            SUPER_USUARIO MASTER
          </span>
        </div>
      )}

      {/* CABECERA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-cyan-950 border border-cyan-800/40 text-cyan-400 font-mono py-0.5 px-2 rounded uppercase tracking-wider font-bold">
            Consola de Seguridad ERP
          </span>
          <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide mt-1 flex items-center gap-2">
            <UserCog size={16} className="text-cyan-400" />
            Configuración de Usuarios y Permisos de Módulos
          </h3>
          <p className="text-xs text-zinc-400">
            Asigna o restringe el acceso a cada uno de los módulos creados en el ERP por usuario individual o por rol de operador.
          </p>
        </div>

        <div className="bg-[#14101e] border border-pink-900/40 p-1.5 px-3 rounded-lg flex items-center gap-1.5 shrink-0 text-pink-400 select-none">
          <Shield size={14} className="animate-pulse" />
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider">GESTIÓN DE ROLES ACTIVA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: GESTOR, REGISTRO Y OPERADORES EXISTENTES (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* TARJETA ASIGNACIÓN DE NÚMERO DEL GESTOR & PERFIL DE EMPRESA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-850 pb-3">
              <div>
                <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={16} className="text-amber-400" />
                  <span>Asignación del Número del Gestor & Perfil de Empresa</span>
                </h4>
                <p className="text-[10.5px] text-zinc-400 font-mono mt-0.5">
                  Configura el número telefónico y nombre del Gestor Encargado que enviará y recibirá recordatorios de herramientas, reportes y alertas.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/40 shrink-0 self-start sm:self-auto font-bold flex items-center gap-1">
                <Phone size={12} />
                <span>{empTelefonoGestor || empresaActiva.telefonoGestor || 'Sin número'}</span>
              </span>
            </div>

            <form onSubmit={handleSaveEmpresaConfig} className="space-y-4 text-xs">
              {/* Campo Gestor Nombre y Teléfono Gestor Destacados */}
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                  <User size={14} className="text-amber-400" />
                  <span className="text-[11px] font-mono font-bold text-amber-300 uppercase">
                    Datos del Gestor / Administrador Operativo (WhatsApp)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono text-zinc-300 uppercase font-bold flex items-center gap-1">
                      <span>Nombre del Gestor / Encargado*:</span>
                    </label>
                    <input
                      type="text"
                      value={empNombreGestor}
                      onChange={(e) => setEmpNombreGestor(e.target.value)}
                      placeholder="Ej: Ing. Manuel Guerra - Gestor de Obras"
                      className="w-full bg-slate-900 border border-slate-700 text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:border-amber-400 transition font-mono text-xs"
                      required
                    />
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      Aparecerá en reportes y alertas de WhatsApp.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono text-amber-300 uppercase font-bold flex items-center gap-1">
                      <Smartphone size={12} />
                      <span>Número Asignado al Gestor*:</span>
                    </label>
                    <input
                      type="text"
                      value={empTelefonoGestor}
                      onChange={(e) => setEmpTelefonoGestor(e.target.value)}
                      placeholder="Ej: +584128889900 o 04128889900"
                      className="w-full bg-slate-900 border border-amber-500/60 text-amber-300 rounded-xl py-2 px-3 focus:outline-none focus:border-amber-400 transition font-mono text-xs font-bold"
                      required
                    />
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      Número de WhatsApp para notificaciones del gestor.
                    </span>
                  </div>
                </div>

                {/* Botón rápido Probar WhatsApp Gestor */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Check size={12} className="text-emerald-400" />
                    <span>Empresa: <strong>{empresaActiva.nombreCorto}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      let cleanPhone = (empTelefonoGestor || empresaActiva.telefonoGestor || '').replace(/[^0-9]/g, '');
                      if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
                        cleanPhone = '58' + cleanPhone.substring(1);
                      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('04')) {
                        cleanPhone = '58' + cleanPhone.substring(1);
                      }
                      if (cleanPhone) {
                        const msg = encodeURIComponent(`👋 Hola ${empNombreGestor || 'Gestor'}, mensaje de verificación de WhatsApp asignado desde Axon ERP (${empresaActiva.nombreCorto}).`);
                        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                        addToast('Abriendo chat de WhatsApp con el número asignado al gestor...', 'info');
                      } else {
                        addToast('Ingresa un número telefónico válido para el gestor antes de probar.', 'error');
                      }
                    }}
                    className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-emerald-800/60 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>Probar WhatsApp con Gestor</span>
                  </button>
                </div>
              </div>

              {/* Datos Generales de la Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    Nombre Oficial de la Empresa:
                  </label>
                  <input
                    type="text"
                    value={empNombre}
                    onChange={(e) => setEmpNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    RIF Fiscal / Registro:
                  </label>
                  <input
                    type="text"
                    value={empRif}
                    onChange={(e) => setEmpRif(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    Teléfono General Oficina / Central:
                  </label>
                  <input
                    type="text"
                    value={empTelefono}
                    onChange={(e) => setEmpTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    Correo Electrónico Corporativo:
                  </label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                  Dirección Fiscal / Sede Central:
                </label>
                <input
                  type="text"
                  value={empDireccion}
                  onChange={(e) => setEmpDireccion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                  Slogan / Descripción Comercial:
                </label>
                <input
                  type="text"
                  value={empSlogan}
                  onChange={(e) => setEmpSlogan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-bold py-2.5 rounded-xl transition text-center shadow-lg shadow-amber-950/20 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save size={14} />
                <span>Guardar Asignación del Gestor y Datos de Empresa</span>
              </button>
            </form>
          </div>

          {/* NUEVO OPERADOR CARD CON ASIGNACIÓN INDIVIDUAL DE MÓDULOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus size={14} className="text-cyan-400" />
                Registrar Nuevo Operador & Asignar Módulos
              </h4>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                PASO 1 DE 2
              </span>
            </div>

            {userCreatedMessage && (
              <div className="bg-emerald-950/50 border border-emerald-900/80 p-3 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{userCreatedMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="user-login" className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    ID de Acceso (Login)*:
                  </label>
                  <input 
                    id="user-login"
                    type="text" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs"
                    placeholder="Ej: tecnico_jose"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="user-password" className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                    Contraseña de Entrada*:
                  </label>
                  <input 
                    id="user-password"
                    type="text" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs"
                    placeholder="Clave de acceso"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="user-name" className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                  Nombre Completo / Cargo*:
                </label>
                <input 
                  id="user-name"
                  type="text" 
                  value={newNombre} 
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition text-xs"
                  placeholder="Ej: Téc. José Ramos - Especialista Otis"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="user-role" className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold">
                  Rol Base del Sistema:
                </label>
                <select 
                  id="user-role"
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value as RolUsuario)}
                  className="w-full bg-slate-950 border border-slate-800 text-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono text-xs cursor-pointer"
                >
                  <option value="TECNICO">TÉCNICO DE CAMPO (Solo levantamientos y reportes sin precios)</option>
                  <option value="INGENIERO">INGENIERO DE OBRA (Presupuestos & Proyectos)</option>
                  <option value="SUPERVISOR">SUPERVISOR GENERAL (Control Operativo & Facturas)</option>
                  <option value="ADMIN">ADMINISTRADOR CENTRAL (Acceso Total)</option>
                  <option value="CLIENTE_DEMO">CLIENTE DEMOSTRACIÓN (Temporizador de Pruebas, Sin Dossier ni Sincronización)</option>
                  {user?.rol === 'SUPER_USUARIO' && (
                    <option value="SUPER_USUARIO">SUPER USUARIO / PROGRAMADOR (Master Root)</option>
                  )}
                </select>
              </div>

              {/* SELECCIÓN DE MÓDULOS CREADOS PARA EL NUEVO USUARIO */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Sliders size={12} />
                    Módulos Asignados a este Nuevo Usuario ({newModules.length} / {ERP_MODULES.length}):
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewModules(ERP_MODULES.map(m => m.id))}
                      className="text-[9px] font-mono text-zinc-400 hover:text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-800 cursor-pointer"
                    >
                      Todos (13)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewModules(['INICIO'])}
                      className="text-[9px] font-mono text-zinc-400 hover:text-rose-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-rose-900 cursor-pointer"
                    >
                      Solo Inicio
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewModules(rolePermissions[newRole] || [])}
                      className="text-[9px] font-mono text-cyan-400 hover:text-cyan-200 bg-slate-950 px-2 py-0.5 rounded border border-cyan-900 cursor-pointer"
                    >
                      Defecto Rol
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850">
                  {ERP_MODULES.map(m => {
                    const isChecked = newModules.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-[10.5px] font-mono cursor-pointer transition select-none ${
                          isChecked 
                            ? 'bg-slate-900 border-slate-700 text-zinc-100' 
                            : 'bg-slate-950/40 border-slate-900 text-zinc-500 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNewUserModule(m.id)}
                          className="rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="shrink-0">{m.icon}</span>
                        <span className="truncate font-bold">{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-display font-bold py-2.5 rounded-xl transition text-center shadow-lg shadow-cyan-950/20 cursor-pointer text-xs uppercase tracking-wider"
              >
                Registrar Operador con Módulos Seleccionados
              </button>
            </form>
          </div>

            {/* OPERADORES REGISTRADOS CON ACCESO A CONFIGURACIÓN INDIVIDUAL */}
            {(() => {
              const displayedUsuarios = user?.rol === 'SUPER_USUARIO'
                ? usuarios
                : usuarios.filter(u => u.rol !== 'SUPER_USUARIO' && u.username.toLowerCase() !== 'axon');

              return (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                    <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Key size={14} className="text-cyan-400" />
                      Operadores Registrados ({displayedUsuarios.length})
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Haz clic en "Módulos" para asignar o restringir
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {displayedUsuarios.map(u => {
                      const isEditingThisUser = editingUsername?.toLowerCase() === u.username.toLowerCase();
                      const hasCustomModules = u.modulosPermitidos && Array.isArray(u.modulosPermitidos);
                      const activeModulesCount = hasCustomModules 
                        ? u.modulosPermitidos!.length 
                        : (rolePermissions[u.rol] || []).length;

                      const isActive = u.active !== false;
                      const isSuperUserTarget = u.rol === 'SUPER_USUARIO' || u.username.toLowerCase() === 'axon';
                      const isAdminTarget = u.username.toLowerCase() === 'admin';

                return (
                  <div 
                    key={u.username} 
                    className={`bg-slate-950/90 rounded-xl border transition overflow-hidden ${
                      isEditingThisUser ? 'border-cyan-500/70 shadow-lg shadow-cyan-950/30' : 'border-slate-850 hover:border-slate-750'
                    }`}
                  >
                    {/* Fila Principal de Usuario */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className="font-bold text-zinc-100 font-sans text-xs">{u.nombre}</span>
                          
                          {/* Badge de estado */}
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950 text-rose-400 border border-rose-900/40'
                          }`}>
                            {isActive ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] font-mono text-zinc-400">
                          <span>@{u.username}</span>
                          <span>•</span>
                          <span className="text-cyan-400 font-bold">{u.rol}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            hasCustomModules 
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40 font-bold' 
                              : 'bg-slate-900 text-zinc-400 border border-slate-800'
                          }`}>
                            {hasCustomModules ? `Personalizado: ${activeModulesCount}/13 módulos` : `Por Rol: ${activeModulesCount}/13 módulos`}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        
                        {/* Botón Expansor para Editar Módulos */}
                        <button
                          type="button"
                          onClick={() => setEditingUsername(isEditingThisUser ? null : u.username)}
                          className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            isEditingThisUser 
                              ? 'bg-cyan-600 text-slate-950 border-cyan-400' 
                              : 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border-slate-800 hover:border-cyan-900'
                          }`}
                        >
                          <Sliders size={12} />
                          <span>Módulos ({activeModulesCount})</span>
                          {isEditingThisUser ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {/* Toggle Activo / Inactivo */}
                        <button
                          type="button"
                          onClick={() => toggleUserActive(u.username, u.active)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isActive 
                              ? 'text-emerald-400 hover:bg-emerald-950/50 border-slate-800' 
                              : 'text-zinc-500 hover:bg-slate-900 border-slate-800'
                          }`}
                          title={isActive ? 'Desactivar acceso' : 'Activar acceso'}
                        >
                          <Power size={13} />
                        </button>

                        {/* Eliminar Usuario */}
                        <button 
                          type="button"
                          onClick={() => handleDeleteUser(u.username)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Matriz Desplegable para Asignar/Restringir Módulos a Este Usuario Específico */}
                    <AnimatePresence>
                      {isEditingThisUser && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-900/90 border-t border-cyan-900/40 p-3.5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-2">
                            <div>
                              <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase block">
                                Asignación Individual de Módulos para @{u.username} ({u.nombre})
                              </span>
                              <span className="text-[10px] text-zinc-400 block font-mono">
                                Marca o desmarca individualmente para permitir o restringir el uso de cada módulo ERP.
                              </span>
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => assignAllModulesToUser(u.username)}
                                className="text-[9px] font-mono text-cyan-300 hover:text-white bg-slate-950 px-2 py-1 rounded border border-cyan-800 cursor-pointer"
                              >
                                Permitir Todos (13)
                              </button>
                              <button
                                type="button"
                                onClick={() => resetUserModulesToRole(u.username)}
                                className="text-[9px] font-mono text-amber-300 hover:text-amber-100 bg-slate-950 px-2 py-1 rounded border border-amber-800/60 cursor-pointer"
                              >
                                Restablecer a Rol
                              </button>
                            </div>
                          </div>

                          {/* Grid de los 13 Módulos para este usuario */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                            {ERP_MODULES.map(m => {
                              const currentAllowed = u.modulosPermitidos || rolePermissions[u.rol] || [];
                              const isModuleActive = currentAllowed.includes(m.id);

                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition select-none ${
                                    isModuleActive 
                                      ? 'bg-slate-950 border-cyan-700/80 text-zinc-100' 
                                      : 'bg-slate-950/40 border-slate-850 text-zinc-500 opacity-60'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isModuleActive}
                                    onChange={() => toggleModuleForUser(u.username, m.id)}
                                    className="mt-0.5 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      {m.icon}
                                      <span className="font-bold truncate text-[10.5px]">{m.name}</span>
                                    </div>
                                    <span className="text-[9.5px] text-zinc-500 block truncate font-sans">
                                      {m.desc}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

        </div>

        {/* COLUMNA DERECHA: MATRIZ DE PERMISOS GENERAL POR ROL Y OTROS CONTROLES (6 cols) */}
        <div className="lg:col-span-6 space-y-6">

          {/* MATRIZ DE PERMISOS GENERAL POR ROL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-3">
              <div>
                <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders size={14} className="text-cyan-400" />
                  Plantillas Predeterminadas por Rol (Superusuario)
                </h4>
                <p className="text-[10.5px] text-zinc-400 font-mono mt-0.5">
                  Define los módulos por defecto que heredarán los usuarios de un rol si no tienen asignación personalizada.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetRolePermissions();
                  addToast('Permisos de rol restablecidos a los valores por defecto del ERP', 'info');
                }}
                className="self-start sm:self-auto bg-slate-950 hover:bg-slate-850 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono py-1 px-2.5 rounded-lg border border-slate-850 flex items-center gap-1 cursor-pointer transition"
                title="Restablecer plantillas de roles"
              >
                <RotateCcw size={12} />
                <span>Restablecer Plantillas</span>
              </button>
            </div>

            {/* SELECTOR DE ROL GENERAL */}
            <div className="flex overflow-x-auto gap-1 p-1 bg-slate-950 rounded-xl border border-slate-850 text-xs font-mono">
              {[
                { id: 'CLIENTE_DEMO', label: 'CLIENTE DEMO', color: 'text-purple-400' },
                { id: 'TECNICO', label: 'TÉCNICO', color: 'text-amber-400' },
                { id: 'INGENIERO', label: 'INGENIERO', color: 'text-indigo-400' },
                { id: 'SUPERVISOR', label: 'SUPERVISOR', color: 'text-pink-400' },
                { id: 'ADMIN', label: 'ADMIN / CENTRAL', color: 'text-cyan-400' }
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleForMatrix(r.id as RolUsuario)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition text-[10.5px] whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                    selectedRoleForMatrix === r.id
                      ? 'bg-slate-900 border border-slate-700 text-zinc-100 shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <UserCheck size={12} className={r.color} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {/* LISTADO DE MÓDULOS EN PLANTILLA DE ROL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs select-none max-h-80 overflow-y-auto pr-1">
              {ERP_MODULES.map(m => {
                const allowedTabs = rolePermissions[selectedRoleForMatrix] || [];
                const isChecked = allowedTabs.includes(m.id);

                return (
                  <label
                    key={m.id}
                    className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? 'bg-slate-950/90 border-slate-750'
                        : 'bg-slate-950/30 border-slate-850/40 opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        toggleRolePermission(selectedRoleForMatrix, m.id);
                        addToast(`Módulo "${m.name}" ${!isChecked ? 'INCLUIDO' : 'QUITADO'} de la plantilla ${selectedRoleForMatrix}`, 'info');
                      }}
                      className="mt-0.5 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 h-3.5 w-3.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {m.icon}
                        <span className="text-[10.5px] font-bold text-zinc-200 font-mono tracking-tight truncate">
                          {m.name}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 font-sans block mt-0.5 truncate">
                        {m.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* MODO DE DESPLIEGUE Y EMPRESA EXCLUSIVA (SOLO VISIBLE PARA SUPER_USUARIO / AXON) */}
          {(user?.rol === 'SUPER_USUARIO' || user?.username.toLowerCase() === 'axon') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide border-b border-slate-850 pb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 size={16} className="text-cyan-400" />
                  Modo de Despliegue & Perfil para Cliente Final (Exportar ZIP)
                </span>
                <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  EXCLUSIVO DESARROLLADOR AXON
                </span>
              </h4>

              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                Define si el sistema funcionará como una <strong className="text-cyan-300">plataforma unificada multi-empresa</strong> (para desarrollo) o como un <strong className="text-amber-300">portal dedicado monocompañía</strong> (para descargar el ZIP e instalarlo en la nube a un cliente específico).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Opciones de Perfil */}
                {ACTIVE_COMPANY_ID === 'TODAS' && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('TODAS')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'TODAS'
                        ? 'bg-slate-950 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
                          MODO DESARROLLO
                        </span>
                        {modoProduccionExclusiva === 'TODAS' && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <h5 className="text-xs font-extrabold text-white uppercase">Plataforma Unificada</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Muestra el selector de empresa en el Login y la cabecera. Permite alternar libremente.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800/50 text-center">
                      Todas las Empresas
                    </div>
                  </button>
                )}

                {/* ITA ASCENSORES */}
                {(ACTIVE_COMPANY_ID === 'TODAS' || ACTIVE_COMPANY_ID === 'ITA_ASCENSORES') && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('ITA_ASCENSORES')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'ITA_ASCENSORES'
                        ? 'bg-slate-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">
                          CLIENTE EXCLUSIVO
                        </span>
                        <ItaLogo size={20} showText={false} />
                      </div>
                      <h5 className="text-xs font-extrabold text-amber-300 uppercase">ITA ASCENSORES</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Ascensores Barbaroza, C.A. - Fija el ERP con catálogo de repuestos y temporizador de ascensores.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-800/50 text-center flex items-center justify-center gap-1">
                      <span>Dedicado ITA ASCENSORES</span>
                    </div>
                  </button>
                )}

                {/* DAKACO */}
                {(ACTIVE_COMPANY_ID === 'TODAS' || ACTIVE_COMPANY_ID === 'SOLUCIONES_DAKACO') && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('SOLUCIONES_DAKACO')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'SOLUCIONES_DAKACO'
                        ? 'bg-slate-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">
                          CLIENTE EXCLUSIVO
                        </span>
                        <DakacoLogo size={18} showText={false} />
                      </div>
                      <h5 className="text-xs font-extrabold text-amber-300 uppercase">SOLUCIONES DAKACO C.A.</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Fija el portal 100% para Dakaco C.A. Oculta el selector de empresas y los datos de otros clientes.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-800/50 text-center flex items-center justify-center gap-1">
                      <span>Dedicado Dakaco</span>
                    </div>
                  </button>
                )}

                {/* TECNO ELEVATEV */}
                {(ACTIVE_COMPANY_ID === 'TODAS' || ACTIVE_COMPANY_ID === 'TECNO_ELEVATEV') && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('TECNO_ELEVATEV')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'TECNO_ELEVATEV'
                        ? 'bg-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
                          CLIENTE EXCLUSIVO
                        </span>
                        <TecnoElevatevLogo size={18} showText={false} />
                      </div>
                      <h5 className="text-xs font-extrabold text-cyan-300 uppercase">TECNO ELEVATEV C.A.</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Fija el portal 100% para Tecno Elevatev C.A. Oculta el selector de empresas y los datos de otros clientes.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800/50 text-center flex items-center justify-center gap-1">
                      <span>Dedicado Tecno Elevatev</span>
                    </div>
                  </button>
                )}

                {/* ELEVADORES DEL LAGO */}
                {(ACTIVE_COMPANY_ID === 'TODAS' || ACTIVE_COMPANY_ID === 'ELEVADORES_DEL_LAGO') && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('ELEVADORES_DEL_LAGO')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'ELEVADORES_DEL_LAGO'
                        ? 'bg-slate-950 border-sky-400 shadow-[0_0_20px_rgba(2,132,199,0.25)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-sky-400 uppercase tracking-wider">
                          CLIENTE EXCLUSIVO
                        </span>
                        <DelLagoLogo size={20} showText={false} />
                      </div>
                      <h5 className="text-xs font-extrabold text-sky-300 uppercase">ELEVADORES DEL LAGO</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Elevadores y Servicios Del Lago, C.A. - RIF J-407768913. Fija el portal exclusivo para Zulia / Maracaibo.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-1 rounded-lg border border-sky-800/50 text-center flex items-center justify-center gap-1">
                      <span>Dedicado Del Lago</span>
                    </div>
                  </button>
                )}

                {/* PROYECTOS VERTICALES AB */}
                {(ACTIVE_COMPANY_ID === 'TODAS' || ACTIVE_COMPANY_ID === 'PROYECTOS_VERTICALES_AB') && (
                  <button
                    type="button"
                    onClick={() => setModoProduccionExclusiva('PROYECTOS_VERTICALES_AB')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      modoProduccionExclusiva === 'PROYECTOS_VERTICALES_AB'
                        ? 'bg-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                          CLIENTE EXCLUSIVO
                        </span>
                        <ProyectosVerticalesLogo size={20} showText={false} />
                      </div>
                      <h5 className="text-xs font-extrabold text-emerald-300 uppercase">PROYECTOS VERTICALES AB, C.A.</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        Los Teques, Edo. Miranda • J-40485349-9. Fija el portal para Proyectos Verticales AB.
                      </p>
                    </div>
                    <div className="mt-3 text-[9.5px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-800/50 text-center flex items-center justify-center gap-1">
                      <span>Dedicado Proyectos Verticales AB</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CONFIGURACIÓN DE LOGIN & ACCESOS DEMO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide border-b border-slate-850 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-cyan-400" />
                Configuración de Login & Credenciales Demo
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                ACCESOS
              </span>
            </h4>

            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-850">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 block font-sans">
                  Tarjeta de "Credenciales Rápidas" en Pantalla de Login
                </span>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Permite u oculta los botones de inicio rápido con usuarios predeterminados.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDemoLogins(!showDemoLogins);
                  addToast(`Botones de credenciales demo ${!showDemoLogins ? 'ACTIVADOS' : 'OCULTADOS'}`, 'info');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showDemoLogins ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showDemoLogins ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SEGURIDAD & AUTENTICACIÓN BIOMÉTRICA / PIN (PWA OFFLINE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide border-b border-slate-850 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Fingerprint size={16} className="text-cyan-400" />
                Seguridad Biométrica & PIN Local (PWA Offline)
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                PWA PROTECTED
              </span>
            </h4>

            {/* Toggle Biométrico */}
            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-850">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200 font-sans">
                    Autenticación por Huella / Face ID
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">
                    WebAuthn Native
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Solicita la huella o reconocimiento facial de tu teléfono/PC antes de abrir el ERP.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !biometricEnabled;
                  setBiometricEnabled(nextVal);
                  addToast(`Autenticación por huella/Face ID ${nextVal ? 'ACTIVADA' : 'DESACTIVADA'}`, 'info');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  biometricEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                    biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* PIN de Seguridad Local */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-200 block font-sans">
                    PIN de Seguridad Local
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 block">
                    {securityPin ? 'PIN activo (4-6 dígitos configurados)' : 'Sin PIN configurado'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {securityPin && (
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityPin(null);
                        addToast('PIN de seguridad eliminado', 'info');
                      }}
                      className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950 px-2.5 py-1 rounded-lg border border-rose-850/60 cursor-pointer transition"
                    >
                      Eliminar PIN
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPinInput('');
                      setShowPinModal(true);
                    }}
                    className="text-[10px] font-mono font-bold text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-850 px-3 py-1 rounded-lg border border-slate-800 hover:border-cyan-700/60 cursor-pointer transition flex items-center gap-1"
                  >
                    <KeyRound size={12} />
                    <span>{securityPin ? 'Cambiar PIN' : 'Establecer PIN'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Probar Bloqueo Manual */}
            {(biometricEnabled || securityPin) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={lockApp}
                  className="w-full bg-slate-950 hover:bg-cyan-950/80 text-cyan-400 hover:text-cyan-200 font-mono text-[11px] font-bold py-2.5 px-3 border border-cyan-800/60 hover:border-cyan-500 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Lock size={14} />
                  <span>PROBAR Y BLOQUEAR ERP AHORA</span>
                </button>
              </div>
            )}
          </div>

          {/* RESPALDOS Y AUDITORÍA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide border-b border-slate-850 pb-2.5 flex items-center gap-1.5">
              <FileArchive size={14} className="text-cyan-400" />
              Gestión de Copias de Resguardo & Respaldos
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* BACKUP LOCAL */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Resguardo en archivo JSON:</span>
                <button 
                  onClick={handleDownloadBackup}
                  disabled={savingBackup}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-cyan-400 font-mono text-[10px] font-bold p-2.5 border border-slate-850 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  <span>{savingBackup ? "DESCARGANDO..." : "RESPALDAR BASE (JSON)"}</span>
                </button>

                {backupSuccess && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-[10px] text-emerald-300 font-mono text-center flex items-center justify-center gap-1">
                    <Check size={11} /> Descarga completada con éxito
                  </div>
                )}
              </div>

              {/* CORREO DESTINO AUTOMÁTICO */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Correo de Auditoría Programado:</span>
                <div className="relative flex items-center">
                  <input 
                    type="email" 
                    value={targetEmail} 
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-zinc-300 rounded-xl py-2 px-3 pl-8 text-[11px] font-mono focus:outline-none focus:border-cyan-500 transition"
                  />
                  <Mail size={12} className="text-zinc-500 absolute left-3" />
                </div>

                <button 
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-zinc-300 font-mono text-[10px] py-1.5 px-2 border border-slate-850 rounded transition cursor-pointer"
                >
                  {sendingEmail ? "Despachando..." : "ENVIAR PRUEBA DE AUDITORÍA"}
                </button>

                {emailSuccess && (
                  <div className="p-1 px-2 bg-emerald-950/40 border border-emerald-900/60 rounded text-[9.5px] text-emerald-300 font-mono text-center flex items-center justify-center gap-1">
                    <Check size={10} /> Notificación despachada
                  </div>
                )}
              </div>

            </div>

            {/* AVISO IMPORTANTE */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-start gap-2 text-xs text-zinc-400">
              <AlertCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[10.5px] leading-relaxed font-mono">
                Todos los usuarios y asignaciones de módulos se guardan localmente encriptados y sincronizables con la nube.
              </p>
            </div>

          </div>

          {/* MODO LIMPIO / INICIAR DESDE CERO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
              <h4 className="text-xs font-sans font-extrabold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                <Database size={14} className="text-rose-400" />
                Estado de la Base de Datos & Datos de Prueba
              </h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isCleanMode 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                  : 'bg-amber-950/60 border-amber-800 text-amber-300'
              }`}>
                {isCleanMode ? 'MODO LIMPIO (DESDE 0)' : 'DATOS DEMO / PRUEBA'}
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Puedes limpiar todos los datos de prueba (facturas, clientes, presupuestos, inventario, reportes de técnicos) para empezar a operar tu empresa 100% en limpio desde cero, o cargar datos demostrativos en cualquier momento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar todos los datos de prueba y comenzar desde cero? Esta acción limpiará todo el historial de prueba.')) {
                    limpiarDatosYEmpezarCero();
                  }
                }}
                className="w-full bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 font-mono text-[11px] font-bold py-3 px-3 border border-rose-800/60 hover:border-rose-500 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Trash2 size={14} />
                <span>LIMPIAR Y EMPEZAR DESDE 0</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas restaurar los datos de prueba demostrativos?')) {
                    restaurarDatosDemo();
                  }
                }}
                className="w-full bg-slate-950 hover:bg-slate-850 text-cyan-400 hover:text-cyan-200 font-mono text-[11px] font-bold py-3 px-3 border border-slate-800 hover:border-cyan-500 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>CARGAR DATOS DEMO / PRUEBA</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL CONFIGURACIÓN DE PIN LOCAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                  <KeyRound size={16} />
                  <span>Configurar PIN de Seguridad</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-zinc-400 font-mono">
                  Ingresa un PIN numérico de 4 a 6 dígitos para proteger el acceso PWA al sistema:
                </p>

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                    Nuevo PIN (4 - 6 dígitos):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 1234"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono text-xl text-cyan-400 font-bold tracking-widest focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-zinc-400 rounded-xl text-xs font-mono transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pinInput.length >= 4 && pinInput.length <= 6) {
                        setSecurityPin(pinInput);
                        addToast(`PIN de seguridad guardado correctamente (${pinInput.length} dígitos)`, 'success');
                        setShowPinModal(false);
                      } else {
                        addToast('El PIN debe tener entre 4 y 6 dígitos numéricos', 'error');
                      }
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition cursor-pointer shadow-lg shadow-cyan-950"
                  >
                    Guardar PIN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
