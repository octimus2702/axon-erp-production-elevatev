import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, FastForward, CheckCircle, Info, Radio, MonitorPlay, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';

const CAPACITACION_SLIDES = [
  {
    title: "1. ARQUITECTURA HÍBRIDA DE TRIPLE CAPA",
    text: "El sistema Axon ERP posee una arquitectura híbrida única a prueba de interrupciones externas. El núcleo del navegador actúa como un búfer redundante persistente en memoria local, por lo cual puedes registrar entradas y salidas de repuestos en sótanos y ubicaciones sin señal telefónica o de wifi.",
    audioText: "El sistema Axon ERP posee una arquitectura híbrida única a prueba de interrupciones externas. El núcleo del navegador actúa como un búfer redundante persistente en memoria local, por lo cual puedes registrar entradas y salidas de repuestos en sótanos y ubicaciones sin señal telefónica o de wifi."
  },
  {
    title: "2. INTERCAMBIO CON GOOGLE SHEETS EN SEGUNDO PLANO",
    text: "Al recuperar la energía o señal a internet, la cola local sincroniza automáticamente los datos acumulados sin sobrescribir o dañar operaciones de operadores paralelos. Esto genera un flujo permanente libre de cuellos de botella.",
    audioText: "Al recuperar la energía o señal a internet, la cola local sincroniza automáticamente los datos acumulados sin sobrescribir o dañar operaciones de operadores paralelos. Esto genera un flujo permanente libre de cuellos de botella."
  },
  {
    title: "3. CONTROL INTEGRAL DE SEGURIDAD OPERATIVA",
    text: "Los permisos de visualización y edición se administran modularmente según el rol: Administrador general de planta, Supervisor general de turno, e Ingeniero residente de proyectos. De esta manera, cada operando interactúa exactamente con lo necesario.",
    audioText: "Los permisos de funcionamiento y seguridad se administran modularmente según el rol: Administrador de planta, Supervisor de turno, e Ingeniero de obra. De esta manera, cada operando interactúa exactamente con lo necesario."
  },
  {
    title: "4. VALIDACIÓN PREVENTIVA DE STOCK CRÍTICO",
    text: "La sección de base de stock emite banderas naranjas y rojas instantáneas cuando los repuestos técnicos cruciales para elevadores o automatización caen por debajo de los límites autorizados de seguridad.",
    audioText: "La sección de base de stock emite banderas naranjas y rojas instantáneas cuando los repuestos técnicos cruciales para elevadores o automatización caen por debajo de los límites autorizados de seguridad."
  },
  {
    title: "5. AUDITORÍA CONSTANTE Y SEGURIDAD ISO",
    text: "Todas las transacciones y firmas de despacho quedan registradas de manera inmutable bajo un código histórico. El sistema cumple los estándares de trazabilidad de la norma ISO nove mil uno dos mil dieciocho.",
    audioText: "Todas las transacciones y firmas de despacho quedan registradas de manera inmutable bajo un código histórico. El sistema cumple los estándares de trazabilidad de la norma ISO nove mil uno dos mil dieciocho."
  }
];

export default function PresentacionAudioTab() {
  const { empresaActiva, empresasDisponibles = [], setEmpresaActivaId } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1); // 0.8x, 1x, 1.2x etc.
  const [autoAdvance, setAutoAdvance] = useState(true);

  const slide = CAPACITACION_SLIDES[currentSlide];

  // Stop active speech when navigation or unload happens
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentSlide]);

  const handlePlayVoice = () => {
    if (!window.speechSynthesis) {
      alert("Tu navegador no soporta sintetizador de voz nativo.");
      return;
    }

    window.speechSynthesis.cancel(); // Detener cualquier reproducción previa
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(slide.audioText);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;

    utterance.onend = () => {
      setIsPlaying(false);
      if (autoAdvance && currentSlide < CAPACITACION_SLIDES.length - 1) {
        setCurrentSlide(prev => prev + 1);
        // Pequeño delay antes del siguiente slide
        setTimeout(() => {
          // Si sigue activo el auto play, el useEffect limpiará y podríamos volver a iniciar
        }, 500);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  // En caso de que cambie de slide mientras suena, reproducir el nuevo slide automáticamente
  useEffect(() => {
    if (isPlaying) {
      handlePlayVoice();
    }
  }, [currentSlide]);

  return (
    <div className="space-y-6 text-left" id="capacitacion-narrada-tab">
      
      {/* HEADER DE CAPACITACIÓN & DOSSIER TÉCNICO DE LA EMPRESA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-950 border border-amber-500/30 rounded-xl shrink-0 flex items-center justify-center">
            {empresaActiva.logoTipo === 'ELEVADORES_DEL_LAGO' ? (
              <DelLagoLogo size={36} showText={false} />
            ) : empresaActiva.logoTipo === 'DAKACO' ? (
              <DakacoLogo size={36} showText={false} />
            ) : empresaActiva.logoTipo === 'ITA_ASCENSORES' ? (
              <ItaLogo size={36} showText={false} />
            ) : empresaActiva.logoTipo === 'PROYECTOS_VERTICALES' ? (
              <ProyectosVerticalesLogo size={36} showText={false} />
            ) : (
              <TecnoElevatevLogo size={32} showText={false} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono py-0.5 px-2 rounded uppercase tracking-wider font-bold">
                DOSSIER TÉCNICO CORPORATIVO
              </span>
              <span className="text-[9px] bg-slate-950 text-slate-400 font-mono py-0.5 px-2 rounded border border-slate-800">
                RIF: {empresaActiva.rif}
              </span>
            </div>
            <h3 className="text-sm font-sans font-black text-zinc-100 uppercase tracking-wide mt-1">
              {empresaActiva.nombre} — Dossier Técnico
            </h3>
            <p className="text-xs text-amber-400/90 font-mono">
              {empresaActiva.slogan} • {empresaActiva.direccion}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {empresasDisponibles.length > 1 && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
              <Building2 size={13} className="text-amber-400 mr-1.5" />
              <span className="text-[10px] text-zinc-400 font-bold mr-1.5 uppercase">Empresa Dossier:</span>
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

          <div className="bg-slate-950 border border-emerald-950 text-emerald-400 font-mono text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shrink-0 select-none">
            <MonitorPlay size={12} className="animate-pulse" />
            <span>AUDIO CAPACITACIÓN {empresaActiva.nombreCorto.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* PANEL DE AUDIO CONTROLES */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-sans font-bold text-zinc-300 uppercase tracking-wider border-b border-slate-850 pb-2 mb-1 flex items-center gap-1.5">
              <Volume2 size={14} className="text-emerald-400" />
              Sintetizador de Voz Axon
            </h4>

            {/* Visualizador de onda de sonido simulada si está reproduciendo */}
            <div className="h-10 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-center gap-1 px-4 overflow-hidden relative">
              {isPlaying ? (
                <div className="flex items-end justify-center gap-0.8 h-6">
                  {[...Array(14)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, Math.random() * 20 + 6, 4] }}
                      transition={{ duration: 0.5 + Math.random() * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Sintetizador Pausado</span>
              )}
            </div>

            {/* Controles de velocidad de voz */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold leading-none">Velocidad de Voz:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { value: 0.8, label: '0.8x Lento' },
                  { value: 1.0, label: '1.0x Normal' },
                  { value: 1.25, label: '1.25x Rápido' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSpeechRate(opt.value)}
                    className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold border transition cursor-pointer ${
                      speechRate === opt.value 
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
                        : 'bg-slate-950 border-slate-850 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración de Auto-Avanzar */}
            <label className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850/80 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 h-4 w-4"
              />
              <div className="text-left">
                <span className="text-[11px] font-sans font-bold text-zinc-300 block">AUTO-AVANZAR DIAPOSITIVA</span>
                <span className="text-[9px] font-mono text-zinc-550 block uppercase leading-none mt-0.5">Avanza al terminar el audio</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-850 flex gap-2">
            {!isPlaying ? (
              <button
                onClick={handlePlayVoice}
                className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-zinc-955 font-display font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <Play size={13} fill="currentColor" />
                <span>NARRAR DIAPOSITIVA</span>
              </button>
            ) : (
              <button
                onClick={handleStopVoice}
                className="flex-grow bg-rose-600 hover:bg-rose-500 text-zinc-100 font-display font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 cursor-pointer"
              >
                <Square size={12} fill="currentColor" />
                <span>DETENER NARRACIÓN</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO DIAPOSITIVA */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between h-full">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-2">
              <span className="text-[10px] bg-slate-950 border border-slate-850 text-cyan-400 font-mono py-0.5 px-2 rounded uppercase tracking-wider font-bold">
                DIAPOSITIVA ACTIVA
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                DIAPOSITIVA {currentSlide + 1} DE {CAPACITACION_SLIDES.length}
              </span>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-sans font-extrabold text-zinc-100 uppercase tracking-wide">
                {slide.title}
              </h5>
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 min-h-[140px] flex items-center">
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {slide.text}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 mt-6 border-t border-slate-850">
            <div className="flex gap-1.5">
              {CAPACITACION_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                  aria-label={`Ir a diapositiva ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % CAPACITACION_SLIDES.length)}
              className="text-cyan-450 hover:text-cyan-400 font-mono text-[10px] font-bold flex items-center gap-1 transition uppercase cursor-pointer"
            >
              <span>Siguiente slide</span>
              <FastForward size={12} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
