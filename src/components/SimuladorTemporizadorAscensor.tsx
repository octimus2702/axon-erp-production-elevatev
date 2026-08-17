import React, { useState, useEffect, useRef } from 'react';
import { EquipoAscensor } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Zap, 
  Activity, 
  Building2, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
  DoorOpen,
  DoorClosed
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  equipo?: EquipoAscensor;
  clienteNombre?: string;
  onClose?: () => void;
}

export default function SimuladorTemporizadorAscensor({ equipo, clienteNombre, onClose }: Props) {
  // Datos del ascensor
  const equipoNombre = equipo?.nombreEquipo || 'Ascensor Principal ITA Torre 1 (VVVF Yaskawa)';
  const totalParadas = equipo?.paradas || 14;
  const maniobra = equipo?.tipoManiobra || 'VVVF CanBus Inteligente';

  // Estados de Simulación
  const [pisoActual, setPisoActual] = useState(1);
  const [pisoDestino, setPisoDestino] = useState(totalParadas);
  const [modoTemporizador, setModoTemporizador] = useState<'RECORRIDO' | 'MANTENIMIENTO' | 'PUERTAS'>('RECORRIDO');

  // Timer de Recorrido
  const [segundosPorPiso, setSegundosPorPiso] = useState(2); // 2 segundos por piso
  const [isRunning, setIsRunning] = useState(false);
  const [tiempoRestanteTotal, setTiempoRestanteTotal] = useState(0);
  const [estadoMovimiento, setEstadoMovimiento] = useState<'DETENIDO' | 'SUBIENDO' | 'BAJANDO' | 'PUERTAS_ABIERTAS' | 'EMERGENCIA'>('DETENIDO');
  const [puertasAbiertas, setPuertasAbiertas] = useState(false);
  const [temporizadorPuertas, setTemporizadorPuertas] = useState(0);

  // Timer de Mantenimiento Preventivo (Demo)
  const [tiempoMantenimientoTotal, setTiempoMantenimientoTotal] = useState(30); // 30s demo
  const [tiempoMantenimientoRestante, setTiempoMantenimientoRestante] = useState(30);
  const [pasoMantenimiento, setPasoMantenimiento] = useState(0);

  // Sonido
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Interval Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Pasos de rutina de mantenimiento con temporizador
  const pasosMantenimientoList = [
    { title: 'Chequeo de Cadena de Seguridad & Relés Omron', duration: 7 },
    { title: 'Verificación de Variador VVVF & Parámetros de Frecuencia', duration: 8 },
    { title: 'Test de Cortina Infrarroja de Seguridad (128 Haces)', duration: 7 },
    { title: 'Prueba de Frenado Electromecánico & Techo de Cabina', duration: 8 }
  ];

  // Iniciar Simulación de Viaje con Temporizador
  const handleIniciarRecorrido = () => {
    if (pisoActual === pisoDestino) return;
    
    const pisosADesplazar = Math.abs(pisoDestino - pisoActual);
    const tiempoTotalCalc = pisosADesplazar * segundosPorPiso;
    
    setTiempoRestanteTotal(tiempoTotalCalc);
    setEstadoMovimiento(pisoDestino > pisoActual ? 'SUBIENDO' : 'BAJANDO');
    setPuertasAbiertas(false);
    setIsRunning(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTiempoRestanteTotal((prev) => {
        if (prev <= 1) {
          // Llegada a destino
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setPisoActual(pisoDestino);
          setEstadoMovimiento('PUERTAS_ABIERTAS');
          setPuertasAbiertas(true);
          setTemporizadorPuertas(5); // 5s puertas abiertas
          setIsRunning(false);
          return 0;
        }

        // Calcular avance de piso progresivo
        setPisoActual((currPiso) => {
          if (pisoDestino > currPiso) {
            return Math.min(currPiso + 1, pisoDestino);
          } else if (pisoDestino < currPiso) {
            return Math.max(currPiso - 1, pisoDestino);
          }
          return currPiso;
        });

        return prev - segundosPorPiso;
      });
    }, segundosPorPiso * 1000);
  };

  // Manejo del temporizador de puertas abiertas
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoMovimiento === 'PUERTAS_ABIERTAS' && temporizadorPuertas > 0) {
      interval = setInterval(() => {
        setTemporizadorPuertas((prev) => {
          if (prev <= 1) {
            setPuertasAbiertas(false);
            setEstadoMovimiento('DETENIDO');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoMovimiento, temporizadorPuertas]);

  // Iniciar Temporizador de Mantenimiento Preventivo
  const handleIniciarMantenimiento = () => {
    setIsRunning(true);
    setTiempoMantenimientoRestante(tiempoMantenimientoTotal);
    setPasoMantenimiento(1);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTiempoMantenimientoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsRunning(false);
          setPasoMantenimiento(4);
          return 0;
        }

        // Actualizar paso según tiempo transcurrido
        const tiempoTranscurrido = tiempoMantenimientoTotal - (prev - 1);
        if (tiempoTranscurrido < 7) setPasoMantenimiento(1);
        else if (tiempoTranscurrido < 15) setPasoMantenimiento(2);
        else if (tiempoTranscurrido < 22) setPasoMantenimiento(3);
        else setPasoMantenimiento(4);

        return prev - 1;
      });
    }, 1000);
  };

  // Pausar o Reiniciar
  const handlePausar = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  const handleParadaEmergencia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setEstadoMovimiento('EMERGENCIA');
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setPisoActual(1);
    setPisoDestino(totalParadas);
    setEstadoMovimiento('DETENIDO');
    setPuertasAbiertas(false);
    setTiempoRestanteTotal(0);
    setTiempoMantenimientoRestante(30);
    setPasoMantenimiento(0);
  };

  // Porcentaje de avance de piso para animación visual
  const porcentajeAltura = ((pisoActual - 1) / Math.max(totalParadas - 1, 1)) * 100;

  return (
    <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
      
      {/* HEADER CON IDENTIFICADOR Y BOTONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} />
              Mantenimiento & Demostración en Vivo
            </span>
            {clienteNombre && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                {clienteNombre}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-2">
            Simulador Temporizador de Ascensores AXON ERP
          </h3>
          <p className="text-xs text-slate-400">
            {equipoNombre} — Maniobra {maniobra} ({totalParadas} Paradas)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Silenciado'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* MODOS DE TEMPORIZADOR */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => { handleReset(); setModoTemporizador('RECORRIDO'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
            modoTemporizador === 'RECORRIDO' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUp size={14} />
          <span>1. Viaje & Recorrido</span>
        </button>

        <button
          onClick={() => { handleReset(); setModoTemporizador('MANTENIMIENTO'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
            modoTemporizador === 'MANTENIMIENTO' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck size={14} />
          <span>2. Mantenimiento Preventivo</span>
        </button>

        <button
          onClick={() => { handleReset(); setModoTemporizador('PUERTAS'); }}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
            modoTemporizador === 'PUERTAS' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DoorOpen size={14} />
          <span>3. Prueba de Puertas</span>
        </button>
      </div>

      {/* ÁREA PRINCIPAL SIMULADOR VIRTUAL Y CONTROLES */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: TORRE VIRTUAL DE ASCENSOR Y ANIMACIÓN VISUAL */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden">
          
          <div className="w-full flex justify-between items-center border-b border-slate-800 pb-2 text-xs font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Activity size={13} /> TORRE PRINCIPAL
            </span>
            <span className="text-slate-400">Total: {totalParadas} Pisos</span>
          </div>

          {/* INDICADOR DIGITAL LED DE PISO Y ESTADO */}
          <div className="my-3 w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-center space-y-1 shadow-inner">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              INDICADOR DE PISO DIGITAL
            </div>
            
            <div className="flex items-center justify-center gap-3">
              {estadoMovimiento === 'SUBIENDO' && (
                <motion.div animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <ArrowUp className="text-emerald-400 font-bold" size={24} />
                </motion.div>
              )}
              {estadoMovimiento === 'BAJANDO' && (
                <motion.div animate={{ y: [2, -2, 2] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <ArrowDown className="text-amber-400 font-bold" size={24} />
                </motion.div>
              )}

              <span className="text-4xl font-black font-mono text-amber-400 tracking-wider">
                {pisoActual < 10 ? `0${pisoActual}` : pisoActual}
              </span>

              {puertasAbiertas ? (
                <DoorOpen className="text-cyan-400 animate-pulse" size={24} />
              ) : (
                <DoorClosed className="text-slate-500" size={20} />
              )}
            </div>

            {/* ESTADO CON BADGE */}
            <div className="pt-1">
              {estadoMovimiento === 'SUBIENDO' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-bold">
                  ⬆️ SUBIENDO ({tiempoRestanteTotal}s restantes)
                </span>
              )}
              {estadoMovimiento === 'BAJANDO' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-[10px] font-bold">
                  ⬇️ BAJANDO ({tiempoRestanteTotal}s restantes)
                </span>
              )}
              {estadoMovimiento === 'PUERTAS_ABIERTAS' && (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">
                  🚪 PUERTAS ABIERTAS ({temporizadorPuertas}s)
                </span>
              )}
              {estadoMovimiento === 'EMERGENCIA' && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-mono text-[10px] font-bold">
                  🛑 PARADA DE EMERGENCIA ACTIVADA
                </span>
              )}
              {estadoMovimiento === 'DETENIDO' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                  DETENIDO EN PISO {pisoActual}
                </span>
              )}
            </div>
          </div>

          {/* REPRESENTACIÓN VISUAL DE LA ESCOTILLA Y CABINA QUE SUBE/BAJA */}
          <div className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl relative p-2 flex justify-between">
            {/* Regla de Pisos */}
            <div className="flex flex-col justify-between h-full text-[9px] font-mono text-slate-500 border-r border-slate-800 pr-2">
              <span>P{totalParadas}</span>
              <span>P{Math.round(totalParadas / 2)}</span>
              <span>P01</span>
            </div>

            {/* Escotilla y Cabina Móvil */}
            <div className="relative flex-1 mx-3 h-full bg-slate-900/60 rounded border border-dashed border-slate-800">
              
              {/* Cable de Tracción */}
              <div 
                className="absolute top-0 w-0.5 bg-slate-600 left-1/2 -translate-x-1/2 transition-all duration-500"
                style={{ height: `${100 - porcentajeAltura}%` }}
              ></div>

              {/* Cabina con Animación */}
              <motion.div
                className={`absolute left-1/2 -translate-x-1/2 w-24 h-14 rounded-lg border-2 p-1.5 flex flex-col justify-between shadow-lg transition-all duration-500 ${
                  estadoMovimiento === 'EMERGENCIA'
                    ? 'bg-red-950/80 border-red-500'
                    : puertasAbiertas
                    ? 'bg-cyan-950/80 border-cyan-400'
                    : 'bg-slate-800 border-amber-500'
                }`}
                style={{ bottom: `${porcentajeAltura}%` }}
              >
                <div className="flex justify-between items-center text-[8px] font-mono font-bold text-amber-300">
                  <span>ITA-CABINA</span>
                  <span>P{pisoActual}</span>
                </div>

                <div className="flex justify-center items-center gap-1 my-0.5">
                  <div className={`h-4 w-6 rounded border transition-all ${puertasAbiertas ? 'bg-cyan-500/30 border-cyan-400' : 'bg-slate-950 border-slate-700'}`}></div>
                  <div className={`h-4 w-6 rounded border transition-all ${puertasAbiertas ? 'bg-cyan-500/30 border-cyan-400' : 'bg-slate-950 border-slate-700'}`}></div>
                </div>

                <div className="text-[7.5px] font-mono text-slate-400 text-center truncate">
                  {maniobra.split(' ')[0]}
                </div>
              </motion.div>
            </div>

            {/* Matrix de Indicadores de Pisos LED */}
            <div className="flex flex-col justify-between h-full text-[8.5px] font-mono space-y-0.5">
              {Array.from({ length: Math.min(totalParadas, 8) }).map((_, i) => {
                const numPiso = totalParadas - i;
                const isCurrent = numPiso === pisoActual;
                return (
                  <div 
                    key={numPiso}
                    className={`px-1.5 py-0.5 rounded text-center transition ${
                      isCurrent ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-600'
                    }`}
                  >
                    P{numPiso < 10 ? `0${numPiso}` : numPiso}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* PANEL DERECHO: CONTROLES DE TEMPORIZADOR Y DEMOSTRACIÓN */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          
          {/* MODO 1: RECORRIDO CON TEMPORIZADOR DE VIAJE */}
          {modoTemporizador === 'RECORRIDO' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Clock size={14} />
                  Configurar Recorrido & Temporizador
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Velocidad: {segundosPorPiso}s / piso
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Piso de Origen:</label>
                  <select
                    value={pisoActual}
                    onChange={(e) => setPisoActual(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-amber-500"
                  >
                    {Array.from({ length: totalParadas }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Piso {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Piso Destino (Llegada):</label>
                  <select
                    value={pisoDestino}
                    onChange={(e) => setPisoDestino(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-amber-500"
                  >
                    {Array.from({ length: totalParadas }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Piso {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AJUSTE DE TIEMPO POR PISO */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>TIEMPO TEMPORIZADOR POR PISO:</span>
                  <span className="text-amber-400 font-bold">{segundosPorPiso} Segundos / Piso</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={segundosPorPiso}
                  onChange={(e) => setSegundosPorPiso(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg"
                />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {!isRunning ? (
                  <button
                    onClick={handleIniciarRecorrido}
                    className="col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold font-mono py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Iniciar Temporizador</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePausar}
                    className="col-span-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Pause size={16} fill="currentColor" />
                    <span>Pausar</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar</span>
                </button>
              </div>

              <button
                onClick={handleParadaEmergencia}
                className="w-full bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-500/40 font-bold font-mono py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <AlertTriangle size={15} />
                <span>Simular Parada de Emergencia</span>
              </button>
            </div>
          )}

          {/* MODO 2: TEMPORIZADOR DE MANTENIMIENTO PREVENTIVO EN VIVO */}
          {modoTemporizador === 'MANTENIMIENTO' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Rutina Temporizada de Mantenimiento (Demo)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {tiempoMantenimientoRestante}s Restantes
                </span>
              </div>

              {/* PROGRESO DE TIMER DE INSPECCIÓN */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>TIEMPO TOTAL DE PRUEBA:</span>
                  <span className="text-white font-bold">{tiempoMantenimientoTotal} Segundos</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-500"
                    style={{ width: `${((tiempoMantenimientoTotal - tiempoMantenimientoRestante) / tiempoMantenimientoTotal) * 100}%` }}
                  ></motion.div>
                </div>
              </div>

              {/* LISTA DE COMPROBACIONES PASO A PASO */}
              <div className="space-y-2">
                {pasosMantenimientoList.map((paso, idx) => {
                  const numPaso = idx + 1;
                  const isDone = pasoMantenimiento > numPaso;
                  const isActive = pasoMantenimiento === numPaso && isRunning;
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                        isDone 
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                          : isActive 
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px]">
                            {numPaso}
                          </span>
                        )}
                        <span className="font-semibold text-[11px]">{paso.title}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-75">{paso.duration}s</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleIniciarMantenimiento}
                  disabled={isRunning}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Iniciar Rutina Mantenimiento</span>
                </button>

                <button
                  onClick={handleReset}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}

          {/* MODO 3: PRUEBA Y TEMPORIZADOR DE PUERTAS */}
          {modoTemporizador === 'PUERTAS' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <DoorOpen size={14} />
                  Prueba de Temporizador de Puertas
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Operador Fermator VVVF
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-3">
                <div className="text-slate-400 text-[11px]">
                  Pulse el botón para activar el temporizador de permanencia de puertas abiertas en piso:
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setEstadoMovimiento('PUERTAS_ABIERTAS');
                      setPuertasAbiertas(true);
                      setTemporizadorPuertas(5);
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl font-mono text-xs transition cursor-pointer"
                  >
                    Abrir Puertas (5s Timer)
                  </button>

                  <button
                    onClick={() => {
                      setEstadoMovimiento('PUERTAS_ABIERTAS');
                      setPuertasAbiertas(true);
                      setTemporizadorPuertas(10);
                    }}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl font-mono text-xs transition cursor-pointer"
                  >
                    Abrir Puertas Carga (10s Timer)
                  </button>
                </div>

                {puertasAbiertas && (
                  <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-sm font-bold animate-pulse">
                    🚪 PUERTAS ABIERTAS — Cierre en {temporizadorPuertas} segundos
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESUMEN TÉCNICO Y CONSEJO */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10.5px] text-slate-400 flex items-start gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Demostración para ITA ASCENSORES:</strong> Este temporizador simula en tiempo real la lógica CanBus de los cuadros de maniobra VVVF, permitiendo mostrar a los clientes la precisión de tiempos de parada, apertura de puertas y ciclos de mantenimiento.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
