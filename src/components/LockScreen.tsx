import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CompanyLogo from './CompanyLogo';
import { Fingerprint, Lock, ShieldCheck, KeyRound, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LockScreen() {
  const { 
    empresaActiva, 
    biometricEnabled, 
    securityPin, 
    unlockApp, 
    authenticateBiometrics,
    addToast 
  } = useApp();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [isAuthenticatingBio, setIsAuthenticatingBio] = useState(false);
  const [authMethod, setAuthMethod] = useState<'BIOMETRIC' | 'PIN'>(
    biometricEnabled ? 'BIOMETRIC' : 'PIN'
  );

  // Intentar autenticación biométrica automática al cargar si está activada
  useEffect(() => {
    if (biometricEnabled && authMethod === 'BIOMETRIC') {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    setIsAuthenticatingBio(true);
    try {
      const success = await authenticateBiometrics();
      if (success) {
        addToast('Autenticación biométrica exitosa. Acceso concedido.', 'success');
        unlockApp();
      } else {
        addToast('No se detectó verificación biométrica. Puedes ingresar tu PIN.', 'info');
        setAuthMethod('PIN');
      }
    } catch (err) {
      setAuthMethod('PIN');
    } finally {
      setIsAuthenticatingBio(false);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!securityPin) {
      unlockApp();
      return;
    }

    if (enteredPin === securityPin) {
      addToast('PIN de seguridad verificado. Bienvenido.', 'success');
      unlockApp();
    } else {
      setErrorShake(true);
      addToast('PIN de seguridad incorrecto', 'error');
      setTimeout(() => setErrorShake(false), 600);
      setEnteredPin('');
    }
  };

  const handleNumberClick = (num: string) => {
    if (enteredPin.length < 6) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      
      // Auto-submit si alcanza la longitud del PIN configurado
      if (securityPin && newPin.length === securityPin.length) {
        if (newPin === securityPin) {
          addToast('PIN de seguridad verificado', 'success');
          unlockApp();
        } else {
          setErrorShake(true);
          addToast('PIN incorrecto', 'error');
          setTimeout(() => setErrorShake(false), 600);
          setEnteredPin('');
        }
      }
    }
  };

  const handleDeleteDigit = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
      {/* Fondo con resplandor sutil y retícula industrial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative z-10 w-full max-w-sm bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 space-y-6 ${
          errorShake ? 'animate-bounce border-rose-500/80' : ''
        }`}
      >
        {/* Cabecera / Identidad Comercial */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl shadow-inner flex items-center justify-center">
            <CompanyLogo empresa={empresaActiva} size={42} showText={true} textColor="text-zinc-100" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-sans font-extrabold text-zinc-100 uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="text-cyan-400 shrink-0" size={16} />
              Acceso Protegido PWA
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">
              Autenticación local requerida para acceder
            </p>
          </div>
        </div>

        {/* Métodos de Desbloqueo: Biométrica o PIN */}
        {authMethod === 'BIOMETRIC' ? (
          <div className="flex flex-col items-center justify-center space-y-5 py-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleBiometricAuth}
              disabled={isAuthenticatingBio}
              className="relative p-6 rounded-full bg-slate-950 border-2 border-cyan-500/80 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 shadow-xl shadow-cyan-950/60 group cursor-pointer transition flex items-center justify-center"
            >
              <Fingerprint size={56} className={`${isAuthenticatingBio ? 'animate-pulse text-cyan-300' : 'group-hover:scale-110 transition'}`} />
              <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping pointer-events-none" />
            </motion.button>

            <div className="text-center space-y-1">
              <span className="text-xs font-mono font-bold text-zinc-200 block">
                {isAuthenticatingBio ? 'Verificando huella / Face ID...' : 'Toca el sensor biométrico'}
              </span>
              <span className="text-[10.5px] text-zinc-400 font-mono block">
                Usa el lector biométrico de tu teléfono o laptop
              </span>
            </div>

            {securityPin && (
              <button
                type="button"
                onClick={() => setAuthMethod('PIN')}
                className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 underline-offset-4 cursor-pointer pt-2"
              >
                Ingresar con PIN de Seguridad
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Indicador de dígitos ingresados */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[...Array(securityPin ? securityPin.length : 4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                    i < enteredPin.length
                      ? 'bg-cyan-400 border-cyan-300 scale-110 shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-950 border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Teclado Numérico Tactil PWA */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono font-bold text-base select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num)}
                  className="py-3 bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 text-zinc-100 rounded-xl border border-slate-800 hover:border-cyan-700/60 shadow transition cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="py-3 bg-slate-950 hover:bg-rose-950/40 text-rose-400 rounded-xl border border-slate-800 text-xs font-mono cursor-pointer transition"
              >
                BORRAR
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="py-3 bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 text-zinc-100 rounded-xl border border-slate-800 shadow transition cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handlePinSubmit()}
                className="py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-black text-xs cursor-pointer shadow-lg shadow-cyan-950/80 transition flex items-center justify-center"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {biometricEnabled && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('BIOMETRIC');
                    handleBiometricAuth();
                  }}
                  className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 underline-offset-4 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Fingerprint size={14} />
                  <span>Usar Huella Digital / Face ID</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-800/80 pt-4 text-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            Axon ERP • PWA Offline Security System
          </span>
        </div>
      </motion.div>
    </div>
  );
}
