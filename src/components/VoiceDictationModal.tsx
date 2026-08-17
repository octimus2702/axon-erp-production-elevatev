import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Send, Sparkles, X, Check, RefreshCw, Radio, Layers, User, Landmark, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

// Declaración de tipos para Web Speech API en navegador
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceDictationResult {
  rawTranscript: string;
  ingeniero?: string;
  proyecto?: string;
  descripcion?: string;
  comandoEnviar?: boolean;
}

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDictation: (data: { ingeniero: string; proyecto: string; descripcion: string }) => void;
  onSendToCloud?: (data: { ingeniero: string; proyecto: string; descripcion: string }) => void;
  initialIngeniero?: string;
  initialProyecto?: string;
  initialDescripcion?: string;
}

export default function VoiceDictationModal({
  isOpen,
  onClose,
  onApplyDictation,
  onSendToCloud,
  initialIngeniero = '',
  initialProyecto = '',
  initialDescripcion = ''
}: VoiceDictationModalProps) {
  const { addToast } = useApp();

  const [isListening, setIsListening] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isProcessingIA, setIsProcessingIA] = useState<boolean>(false);

  // Campos extraídos
  const [ingeniero, setIngeniero] = useState<string>(initialIngeniero);
  const [proyecto, setProyecto] = useState<string>(initialProyecto);
  const [descripcion, setDescripcion] = useState<string>(initialDescripcion);
  const [autoSendVoice, setAutoSendVoice] = useState<boolean>(true);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef<string>('');
  const rawTranscriptRef = useRef<string>('');

  // Sincronizar valores iniciales
  useEffect(() => {
    if (isOpen) {
      setIngeniero(initialIngeniero);
      setProyecto(initialProyecto);
      setDescripcion(initialDescripcion);
      setRawTranscript('');
      setInterimTranscript('');
      setLastVoiceCommand('');
      baseTranscriptRef.current = '';
      rawTranscriptRef.current = '';
    }
  }, [isOpen, initialIngeniero, initialProyecto, initialDescripcion]);

  // Inicializar Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: any) => {
      let currentSessionFinal = '';
      let interimStr = '';

      for (let i = 0; i < event.results.length; ++i) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentSessionFinal += chunk + ' ';
        } else {
          interimStr += chunk;
        }
      }

      const prefix = baseTranscriptRef.current ? baseTranscriptRef.current.trim() + ' ' : '';
      const fullText = (prefix + currentSessionFinal).trim();

      rawTranscriptRef.current = fullText;
      setRawTranscript(fullText);
      setInterimTranscript(interimStr);

      if (fullText) {
        evaluarComandosYFormulario(fullText);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Error en SpeechRecognition:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Guardar lo acumulado en baseTranscriptRef antes de reiniciar la sesión de reconocimiento
      baseTranscriptRef.current = rawTranscriptRef.current;

      // Si el usuario no presionó pausar explícitamente y la ventana sigue abierta, reiniciamos el micrófono en modo manos libres
      if (recognitionRef.current && recognitionRef.current.shouldRestart) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.shouldRestart = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Función de síntesis de voz (Respuesta por audio al técnico)
  const hablarRespuestaAudio = (texto: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Evaluar comandos de voz directos (Manos Libres)
  const evaluarComandosYFormulario = (textoCompleto: string) => {
    const textoLower = textoCompleto.toLowerCase();

    // Detección de Comando "Enviar a la nube"
    if (
      textoLower.includes('enviar a la nube') ||
      textoLower.includes('enviar solicitud') ||
      textoLower.includes('guardar solicitud') ||
      textoLower.includes('comando enviar')
    ) {
      setLastVoiceCommand('Comando detectado: ¡ENVIAR A LA NUBE!');
      detenerMicrofono();
      
      hablarRespuestaAudio('Comando de voz recibido. Procesando y enviando solicitud a la nube.');
      addToast('🎙️ Comando de voz: Procesando envío a la nube...', 'info');

      // Procesar rápidamente con IA para extraer los datos finales si hace falta
      procesarDictadoConIA(textoCompleto, true);
      return;
    }

    // Detección de Comando "Limpiar"
    if (textoLower.includes('comando limpiar') || textoLower.includes('borrar todo')) {
      setLastVoiceCommand('Comando detectado: Limpiar');
      baseTranscriptRef.current = '';
      rawTranscriptRef.current = '';
      setRawTranscript('');
      setInterimTranscript('');
      setIngeniero('');
      setProyecto('');
      setDescripcion('');
      hablarRespuestaAudio('Formulario de dictado limpiado.');
      return;
    }

    // Extracción básica en tiempo real por palabras clave
    extraerCamposPatronesSimples(textoCompleto);
  };

  // Patrones sencillos para extraer campos sobre la marcha
  const extraerCamposPatronesSimples = (texto: string) => {
    const regexIngeniero = /(?:técnico|ingeniero|solicitante|habla|soy)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,30})(?=\s+proyecto|\s+obra|\s+descripción|\s+necesito|\s+requiero|$)/i;
    const regexProyecto = /(?:proyecto|obra|edificio|planta|ubicación)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]{3,35})(?=\s+descripción|\s+necesito|\s+requiero|\s+técnico|\s+ingeniero|$)/i;
    const regexDesc = /(?:descripción|nota|requiero|necesito|detalle)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s\.,]{5,100})/i;

    const mIng = texto.match(regexIngeniero);
    if (mIng && mIng[1]) {
      setIngeniero(mIng[1].trim());
    }

    const mProy = texto.match(regexProyecto);
    if (mProy && mProy[1]) {
      setProyecto(mProy[1].trim());
    }

    const mDesc = texto.match(regexDesc);
    if (mDesc && mDesc[1]) {
      setDescripcion(mDesc[1].trim());
    } else if (!descripcion && texto.length > 10) {
      // Si no hay etiqueta fija, usar el texto completo como descripción preliminar
      setDescripcion(texto);
    }
  };

  // Iniciar / Detener Micrófono
  const toggleMicrofono = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      detenerMicrofono();
    } else {
      iniciarMicrofono();
    }
  };

  const iniciarMicrofono = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.shouldRestart = true;
      recognitionRef.current.start();
      setIsListening(true);
      addToast('🎙️ Micrófono activado. Habla con libertad (Modo Manos Libres)...', 'info');
      hablarRespuestaAudio('Escuchando dictado del técnico.');
    } catch (e) {
      console.error('Error al iniciar reconocimiento de voz:', e);
    }
  };

  const detenerMicrofono = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.shouldRestart = false;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
    setIsListening(false);
  };

  // Procesar transcripción hablada con IA Gemini para formatear perfectamente
  const procesarDictadoConIA = async (texto: string, enviarDespues: boolean = false) => {
    const textoAProcesar = texto || rawTranscript;
    if (!textoAProcesar.trim()) {
      addToast('Aún no has dictado nada para estructurar con la IA', 'info');
      return;
    }

    setIsProcessingIA(true);
    addToast('🤖 La IA de Axon está estructurando tu dictado técnico...', 'info');

    try {
      const apiKeyClient = (import.meta as any).env?.VITE_GEMINI_API_KEY;

      let resultParsed = null;

      // Intento 1: Servidor Backend
      try {
        const res = await fetch('/api/gemini/parse-voice-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: textoAProcesar })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result) {
            resultParsed = data.result;
          }
        }
      } catch (err) {
        console.warn('Backend server no respondió a la estructura de voz, intentando cliente directo...');
      }

      // Intento 2: Gemini Directo con SDK en cliente si hay clave o si falló el backend
      if (!resultParsed && apiKeyClient) {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: apiKeyClient });

        const prompt = `Eres el Asistente de Control de Voz para AXON ERP de Técnicos de Campo e Ingenieros de Ascensores/Mantenimiento.
Procesa el siguiente audio dictado por el técnico que tiene las manos ocupadas:
"${textoAProcesar}"

Extrae y estructura con total precisión:
1. 'ingeniero': Nombre o título del técnico o ingeniero solicitante. (Si no se especifica, deduce un nombre probable o "Técnico de Campo").
2. 'proyecto': Nombre de la obra, proyecto o cliente/edificio indicado. (Ej: "Torre Empresarial", "Planta Pepsi Sur", etc.).
3. 'descripcion': Descripción limpia y profesional del requerimiento técnico o componentes indicados.
4. 'comandoEnviar': booleano true si el técnico dijo algún comando de enviar ("enviar a la nube", "guardar", "enviar solicitud", etc.).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ingeniero: { type: Type.STRING },
                proyecto: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                comandoEnviar: { type: Type.BOOLEAN }
              },
              required: ['ingeniero', 'proyecto', 'descripcion']
            }
          }
        });

        if (response.text) {
          resultParsed = JSON.parse(response.text);
        }
      }

      if (resultParsed) {
        const ingFinal = resultParsed.ingeniero || ingeniero || 'Ing. Técnico de Campo';
        const proyFinal = (resultParsed.proyecto || proyecto || 'PROYECTO GENERAL').toUpperCase();
        const descFinal = resultParsed.descripcion || descripcion || textoAProcesar;

        setIngeniero(ingFinal);
        setProyecto(proyFinal);
        setDescripcion(descFinal);

        addToast('✨ Dictado estructurado exitosamente por IA', 'success');

        if (enviarDespues || (resultParsed.comandoEnviar && autoSendVoice)) {
          handleEnviarANubeDirecto(ingFinal, proyFinal, descFinal);
        }
      } else {
        // Fallback simple si no hay IA disponible
        const ingFinal = ingeniero || 'Técnico de Campo';
        const proyFinal = (proyecto || 'PROYECTO DE CAMPO').toUpperCase();
        const descFinal = descripcion || textoAProcesar;

        if (enviarDespues) {
          handleEnviarANubeDirecto(ingFinal, proyFinal, descFinal);
        }
      }
    } catch (error: any) {
      console.error('Error al procesar dictado por voz:', error);
      addToast('No se pudo procesar con IA. Se aplicó el dictado directo.', 'warning');
      if (enviarDespues) {
        handleEnviarANubeDirecto(ingeniero || 'Técnico de Campo', (proyecto || 'PROYECTO GENERAL').toUpperCase(), descripcion || textoAProcesar);
      }
    } finally {
      setIsProcessingIA(false);
    }
  };

  const handleEnviarANubeDirecto = (ing: string, proy: string, desc: string) => {
    if (onSendToCloud) {
      onSendToCloud({ ingeniero: ing, proyecto: proy, descripcion: desc });
      hablarRespuestaAudio(`Solicitud enviada a la nube para el proyecto ${proy}`);
      detenerMicrofono();
      onClose();
    } else {
      onApplyDictation({ ingeniero: ing, proyecto: proy, descripcion: desc });
      hablarRespuestaAudio('Datos aplicados al formulario');
      detenerMicrofono();
      onClose();
    }
  };

  const handleConfirmarManual = () => {
    detenerMicrofono();
    onApplyDictation({
      ingeniero: ingeniero || 'Ing. Técnico de Campo',
      proyecto: (proyecto || 'PROYECTO GENERAL').toUpperCase(),
      descripcion: descripcion || rawTranscript || 'N/A'
    });
    addToast('Datos de dictado aplicados al formulario', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Cabecera */}
        <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isListening ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' : 'bg-rose-600/10 text-rose-400'}`}>
              <Radio size={20} className={isListening ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Asistente de Dictado por Voz - Modo Manos Libres
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30">
                  AXON VOICE
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Diseñado para técnicos e ingenieros en sitio con las manos ocupadas.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              detenerMicrofono();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">

          {!speechSupported && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
              <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong>Navegador sin soporte de Dictado Web nativo.</strong>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  Recomendamos usar Google Chrome, Microsoft Edge o Safari en tu dispositivo o teléfono inteligente para utilizar la entrada de micrófono continua.
                </p>
              </div>
            </div>
          )}

          {/* Botón Central de Micrófono & Estado */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-slate-850 rounded-2xl relative">
            <div className="relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
              )}
              <button
                onClick={toggleMicrofono}
                disabled={!speechSupported}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white hover:bg-rose-500 ring-4 ring-rose-500/30'
                    : 'bg-slate-800 text-rose-400 hover:bg-slate-700 hover:text-rose-300 border border-slate-700'
                }`}
              >
                {isListening ? <Mic size={32} /> : <MicOff size={32} />}
              </button>
            </div>

            <div className="mt-4 text-center space-y-1">
              <span className="text-xs font-bold text-zinc-200 block uppercase tracking-wider">
                {isListening ? '🎙️ Escuchando tu dictado...' : 'Micrófono Pausado'}
              </span>
              <p className="text-[11px] text-zinc-400">
                {isListening
                  ? 'Di lo que necesites. Puedes incluir "Técnico [Nombre]", "Proyecto [Nombre]", "Descripción..."'
                  : 'Haz clic en el botón para activar el dictado continuo por voz.'}
              </p>
            </div>

            {lastVoiceCommand && (
              <div className="mt-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5">
                <Check size={14} />
                {lastVoiceCommand}
              </div>
            )}
          </div>

          {/* Transcripción en vivo */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <FileText size={13} className="text-cyan-400" />
                Transcripción en Vivo:
              </span>
              {rawTranscript && (
                <button
                  onClick={() => {
                    baseTranscriptRef.current = '';
                    rawTranscriptRef.current = '';
                    setRawTranscript('');
                    setInterimTranscript('');
                  }}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Limpiar Texto
                </button>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 min-h-[80px] max-h-[130px] overflow-y-auto text-xs font-sans text-zinc-200 leading-relaxed">
              {rawTranscript ? (
                <span>
                  {rawTranscript}
                  <span className="text-zinc-500 italic"> {interimTranscript}</span>
                </span>
              ) : (
                <span className="text-zinc-600 italic">
                  Ejemplo de dictado: "Habla el técnico Manuel Barbaroza en el Proyecto Ascensores Chacao, solicito dos guayas de tracción de 10mm y un kit de frenos urgentes para enviar a la nube".
                </span>
              )}
            </div>
          </div>

          {/* Campos estructurados visuales */}
          <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                <Layers size={14} className="text-rose-400" />
                Datos Estructurados Extraídos:
              </span>

              <button
                type="button"
                onClick={() => procesarDictadoConIA(rawTranscript, false)}
                disabled={isProcessingIA || !rawTranscript.trim()}
                className="bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
              >
                <Sparkles size={12} className={isProcessingIA ? 'animate-spin' : ''} />
                {isProcessingIA ? 'Estructurando con IA...' : 'Estructurar con IA Gemini'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                  <User size={11} /> Técnico / Solic.:
                </label>
                <input
                  type="text"
                  value={ingeniero}
                  onChange={e => setIngeniero(e.target.value)}
                  placeholder="Ej: Ing. Carlos Pérez"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                  <Landmark size={11} /> Proyecto / Obra:
                </label>
                <input
                  type="text"
                  value={proyecto}
                  onChange={e => setProyecto(e.target.value)}
                  placeholder="Ej: TORRE EMPRESARIAL CHACAO"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <FileText size={11} /> Descripción de Insumos / Notas:
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Descripción o lista de materiales..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Guía de Comandos de Voz Manos Libres */}
          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-[11px] text-zinc-400 space-y-1">
            <span className="font-bold text-zinc-300 block">💡 Comandos de Voz Manos Libres:</span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
              <li>• <strong className="text-emerald-400">"Enviar a la nube"</strong>: Envía la solicitud directamente.</li>
              <li>• <strong className="text-rose-400">"Comando Limpiar"</strong>: Reinicia el texto dictado.</li>
              <li>• <strong className="text-cyan-400">"Técnico [Nombre]"</strong>: Asigna el solicitante.</li>
              <li>• <strong className="text-amber-400">"Proyecto [Nombre]"</strong>: Asigna el proyecto o edificio.</li>
            </ul>
          </div>

        </div>

        {/* Acciones del pie */}
        <div className="bg-slate-950 p-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleConfirmarManual}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-zinc-200 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={14} className="text-emerald-400" />
            Cargar en Formulario
          </button>

          {onSendToCloud && (
            <button
              type="button"
              onClick={() => handleEnviarANubeDirecto(ingeniero, proyecto, descripcion)}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-zinc-950 font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={14} />
              Enviar Solicitud a la Nube Inmediatamente
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
