import React, { useState, useEffect } from 'react';
import { useApp, INITIAL_EMPRESAS } from '../context/AppContext';
import CompanyLogo from './CompanyLogo';
import { Lock, User, ShieldCheck, Eye, EyeOff, AlertTriangle, KeyRound, Wrench, Code, Sparkles, Building2, Download, Smartphone, CheckCircle2, Laptop, Globe, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginScreen() {
  const { login, showDemoLogins, setShowDemoLogins, empresaActiva, empresasDisponibles = [], setEmpresaActivaId } = useApp();
  const safeEmpresa = empresaActiva || (empresasDisponibles && empresasDisponibles[0]) || INITIAL_EMPRESAS[0];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para capturar el evento PWA de instalación en PC / Móvil
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si la aplicación ya se ejecuta en modo standalone (instalada)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert(`💡 Para instalar ${safeEmpresa.nombreCorto} en tu PC o Teléfono:\n\n1. En Google Chrome o Edge, busca el icono 📥 ("Instalar aplicación") en la barra de dirección del navegador.\n2. Haz clic en "Instalar" para guardarla como Aplicación de Escritorio o Móvil sin depender del navegador.`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    // Pequeña simulación de delay para feedback industrial
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = login(username, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Acceso denegado.');
    }
  };

  // Prefilling demo users (UX premium)
  const prefillUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0c111d] flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-zinc-950 font-sans relative overflow-hidden" id="login-container">
      
      {/* Elementos decorativos de fondo industrial */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Cabecera / Logotipo Dinámico de la Empresa y Axon ERP */}
        <div className="text-center mb-6 space-y-3">

          {/* Logo Dinámico de la Empresa Seleccionada */}
          <div className="flex justify-center items-center py-2">
            <div className="p-3.5 bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-xl">
              <CompanyLogo empresa={safeEmpresa} size={48} showText={true} textColor="text-zinc-100" />
            </div>
          </div>

          {/* Subtítulo del Sistema e Identificador RIF */}
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-bold mb-1 ${
              safeEmpresa.id === 'TECNO_ELEVATEV'
                ? 'text-cyan-400 border-cyan-500/30'
                : safeEmpresa.id === 'PROYECTOS_VERTICALES_AB'
                ? 'text-emerald-400 border-emerald-500/30'
                : 'text-amber-400 border-amber-500/30'
            }`}>
              <span>RIF: {safeEmpresa.rif}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Portal de Acceso ERP • {safeEmpresa.nombre}
            </p>
          </div>

          {/* Selector de Empresa para el Portal */}
          {empresasDisponibles.length > 1 && (
            <div className="pt-2 space-y-2">
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block font-bold">
                🏢 Seleccionar Empresa:
              </span>
              <div className="flex flex-wrap justify-center items-center gap-1.5">
                {empresasDisponibles.map((emp) => {
                  const isActive = safeEmpresa.id === emp.id;
                  let activeClass = 'bg-slate-900/80 text-zinc-400 border-slate-800 hover:border-slate-700 hover:text-zinc-200';
                  
                  if (isActive) {
                    if (emp.id === 'TECNO_ELEVATEV') {
                      activeClass = 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40 font-black';
                    } else if (emp.id === 'ITA_ASCENSORES') {
                      activeClass = 'bg-amber-950/90 text-amber-300 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40 font-black';
                    } else if (emp.id === 'PROYECTOS_VERTICALES_AB') {
                      activeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/40 font-black';
                    } else {
                      activeClass = 'bg-indigo-950/90 text-indigo-300 border-indigo-500/70 shadow-[0_0_12px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/40 font-black';
                    }
                  }

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setEmpresaActivaId(emp.id as any)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${activeClass}`}
                    >
                      <Building2 size={13} className={isActive ? 'text-cyan-400' : 'text-zinc-500'} />
                      <span>{emp.nombreCorto}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <span className="text-[9px] bg-slate-950 text-cyan-400 font-mono py-0.5 px-2 border border-slate-800/80 rounded absolute top-4 right-4 uppercase tracking-widest font-bold">
            SSL SECURE
          </span>

          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-6 border-b border-slate-800 pb-3 flex items-center gap-1.5">
            <KeyRound size={14} className="text-cyan-400" />
            Acceso al Sistema ERP - {safeEmpresa.nombreCorto}
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Mensaje de error */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-950/40 border border-rose-900/60 p-3.5 rounded-xl flex items-start gap-2 text-xs"
              >
                <AlertTriangle className="text-pink-500 shrink-0 mt-0.5" size={15} />
                <div className="text-left">
                  <span className="font-semibold text-pink-400 block">Error de autenticación</span>
                  <span className="text-zinc-400">{errorMsg}</span>
                </div>
              </motion.div>
            )}

            {/* Usuario */}
            <div className="space-y-1 text-left">
              <label htmlFor="username-input" className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
                ID de Usuario:
              </label>
              <div className="relative flex items-center">
                <input
                  id="username-input"
                  type="text"
                  required
                  placeholder="Ej: admin, supervisor, ingeniero"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition font-mono"
                />
                <User size={14} className="text-zinc-500 absolute left-3.5" />
              </div>
            </div>

            {/* Clave */}
            <div className="space-y-1 text-left">
              <label htmlFor="password-input" className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
                Contraseña ERP / WMS:
              </label>
              <div className="relative flex items-center">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Introduzca su clave..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:border-cyan-500 transition font-mono"
                />
                <Lock size={14} className="text-zinc-500 absolute left-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition"
                  id="toggle-password-btn"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              id="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  <span>Iniciar Sesión en Axon ERP</span>
                </>
              )}
            </button>
          </form>

          {/* Tarjeta de Acceso PWA / Seguridad */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
            
            {/* Botón Prominente de Instalación de PWA (Escritorio/Móvil) */}
            <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-left shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-800/50">
                  <Laptop size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Instalar App ({safeEmpresa.nombreCorto})
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Acceso de escritorio & offline
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 size={12} />
                  <span>Instalado ✓</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-3 py-1.5 rounded-lg transition shadow-md cursor-pointer shrink-0"
                >
                  <Download size={13} />
                  <span>Instalar PWA</span>
                </button>
              )}
            </div>

            {/* Accesos de prueba / demo (Ocultos por defecto para Producción) */}
            {showDemoLogins && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-wider text-left font-semibold">
                    Credenciales Rápidas ERP:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDemoLogins(false)}
                    className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer transition"
                  >
                    Ocultar
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-left mt-2">
                  {[
                    { label: 'Administrador', user: 'admin', p: 'admin', roleClass: 'hover:border-cyan-500/40 text-cyan-400' },
                    { label: 'Supervisor', user: 'supervisor', p: 'supervisor', roleClass: 'hover:border-pink-500/40 text-pink-400' },
                    { label: 'Ingeniero', user: 'ingeniero', p: 'ingeniero', roleClass: 'hover:border-indigo-500/40 text-indigo-400' },
                    { label: 'Técnico Campo', user: 'tecnico', p: 'tec123', roleClass: 'hover:border-amber-500/40 text-amber-400' }
                  ].map((opt) => (
                    <button
                      key={opt.user}
                      type="button"
                      onClick={() => prefillUser(opt.user, opt.p)}
                      className={`bg-slate-950/80 border border-slate-800 rounded-lg p-2 transition flex flex-col text-[10px] cursor-pointer ${opt.roleClass}`}
                    >
                      <span className="font-semibold truncate">{opt.label}</span>
                      <span className="font-mono text-[9px] text-zinc-500 mt-0.5">ID: {opt.user}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer del login con crédito a Manuel Guerra y empresa */}
        <div className="text-center mt-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-slate-300 shadow-md">
            <Code size={13} className="text-cyan-400" />
            <span>Desarrollado por:</span>
            <strong className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              Manuel Guerra
            </strong>
            <Sparkles size={12} className="text-amber-400 animate-pulse" />
          </div>

          <p className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider block">
            Axon ERP Enterprise • Gestión Contable, Facturación, Presupuestos & Inspecciones
          </p>
        </div>

      </motion.div>
    </div>
  );
}

