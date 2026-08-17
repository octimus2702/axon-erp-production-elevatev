import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SolicitudProyecto, Producto } from '../types';
import { ShoppingCart, Plus, Trash2, CheckCircle, XCircle, FilePlus2, User, Landmark, HelpCircle, GitPullRequest, Mic, Radio, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VoiceDictationModal from './VoiceDictationModal';

interface SolicitudesTabProps {
  onNavigateToDespacho: () => void;
}

export default function SolicitudesTab({ onNavigateToDespacho }: SolicitudesTabProps) {
  const { 
    products, 
    solicitudes, 
    activeDivision, 
    crearSolicitud, 
    despacharSolicitud,
    anularSolicitud,
    crearVale 
  } = useApp();

  // Estados para Formulario de Carga
  const [showForm, setShowForm] = useState<boolean>(false);
  const [ingeniero, setIngeniero] = useState<string>("");
  const [proyecto, setProyecto] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // Aplicar dictado por voz al formulario
  const handleApplyVoiceDictation = (data: { ingeniero: string; proyecto: string; descripcion: string }) => {
    if (data.ingeniero) setIngeniero(data.ingeniero);
    if (data.proyecto) setProyecto(data.proyecto);
    if (data.descripcion) setDescripcion(data.descripcion);
    setShowForm(true);
  };

  // Enviar solicitud a la nube directamente mediante comando de voz Manos Libres
  const handleSendVoiceToCloud = (data: { ingeniero: string; proyecto: string; descripcion: string }) => {
    const ingFinal = data.ingeniero || "Ing. Técnico de Campo";
    const proyFinal = (data.proyecto || "PROYECTO DE CAMPO").toUpperCase();
    const descFinal = data.descripcion || "Solicitud enviada por dictado de voz manos libres.";

    // Asignar items por defecto si no se seleccionaron individualmente
    const defaultItems = reqItems.length > 0 
      ? reqItems 
      : [{ val_c: divisionProducts[0]?.val_c || "REQ-VOICE-GEN", cantidad: 1 }];

    crearSolicitud({
      Ingeniero: ingFinal,
      Proyecto: proyFinal,
      Descripcion: `[DICTADO DE VOZ] ${descFinal}`,
      Productos: JSON.stringify(defaultItems),
      division: activeDivision
    });

    // Resetear
    setIngeniero("");
    setProyecto("");
    setDescripcion("");
    setReqItems([]);
    setShowForm(false);
  };
  
  // Items de la Solicitud Temporal
  const [reqItems, setReqItems] = useState<Array<{ val_c: string; cantidad: number }>>([]);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // Filtrar solicitudes de la división activa
  const divisionSolicitudes = solicitudes.filter(s => s.division === activeDivision);
  
  // Productos elegibles del almacén central único para solicitudes
  const divisionProducts = products;

  // Añadir componente al requerimiento temporal
  const handleAddItemToReq = () => {
    if (!selectedSku) return;
    setReqItems(prev => {
      const existing = prev.find(item => item.val_c === selectedSku);
      if (existing) {
        return prev.map(item => item.val_c === selectedSku ? { ...item, cantidad: item.cantidad + selectedQty } : item);
      }
      return [...prev, { val_c: selectedSku, cantidad: selectedQty }];
    });
    setSelectedSku("");
    setSelectedQty(1);
  };

  // Remover item del requerimiento temporal
  const handleRemoveItemFromReq = (sku: string) => {
    setReqItems(prev => prev.filter(item => item.val_c !== sku));
  };

  // Someter solicitud final
  const handleSubmitSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingeniero || !proyecto || reqItems.length === 0) return;

    crearSolicitud({
      Ingeniero: ingeniero,
      Proyecto: proyecto.toUpperCase(),
      Descripcion: descripcion || "N/A",
      Productos: JSON.stringify(reqItems),
      division: activeDivision
    });

    // Resetear formulario
    setIngeniero("");
    setProyecto("");
    setDescripcion("");
    setReqItems([]);
    setShowForm(false);
  };

  // Formalizar Despacho de la Solicitud (Saca de inventario físico)
  const handleFormalDispatch = (sol: SolicitudProyecto) => {
    const confirmDispatch = confirm(`¿Desea formalizar el despacho inmediato de la Solicitud ${sol.id}? Se descontarán las cantidades indicadas del inventario maestro.`);
    if (!confirmDispatch) return;

    // Crear un Vale de Entrega correspondiente de forma transparente
    const numVale = Math.floor(Math.random() * 90000 + 10000).toString();
    const parsedReqItems: Array<{ val_c: string; cantidad: number }> = JSON.parse(sol.Productos);

    const valesItems = parsedReqItems.map(item => {
      const match = products.find(p => p.val_c === item.val_c);
      return {
        val_c: item.val_c,
        val_mo: match ? match.val_mo : "MOCK-EM",
        val_d: match ? match.val_d : "Componente de Solicitud de Proyecto",
        val_m: match ? match.val_m : "Generico",
        cantidad: item.cantidad
      };
    });

    // Despachar a través del contexto
    const success = despacharSolicitud(sol.id, "Supervisor WMS");
    if (success) {
      crearVale({
        NroVale: numVale,
        Responsable: sol.Ingeniero,
        Destino: sol.Proyecto,
        ProyectoDesc: sol.Descripcion,
        TipoDespacho: "Nota de Entrega",
        Productos: JSON.stringify(valesItems),
        division: activeDivision
      });

      alert(`¡Solicitud consolidada! Se ha generado la Nota de Entrega #N-000${numVale} y se ajustó el stock maestro.`);
    }
  };

  return (
    <div className="space-y-6" id="solicitudes-tab">
      
      {/* SECCIÓN CABECERA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left space-y-1">
          <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <GitPullRequest size={15} className="text-rose-500 animate-pulse" />
            Planificación de Requerimientos de Compras e Insumos
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Permite a los ingenieros preestablecer requerimientos de insumos vinculados a proyectos de obra. <strong className="text-rose-400">Nota:</strong> El stock disponible no sufre descuentos lógicos hasta que el administrador despache formalmente la solicitud.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowVoiceModal(true)}
            className="bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-sans font-bold text-xs py-2 px-3.5 rounded-lg transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Mic size={14} className="text-cyan-400 animate-pulse" />
            🎙️ Dictar Solicitud / Manos Libres
          </button>

          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-rose-600 hover:bg-rose-500 text-zinc-950 font-sans font-bold text-xs py-2 px-4 rounded-lg transition flex items-center gap-2 cursor-pointer"
          >
            <FilePlus2 size={14} />
            {showForm ? "Ocultar Formulario" : "Ingresar Solicitud Ingeniero"}
          </button>
        </div>
      </div>

      {/* FORMULARIO DE REQUERIMIENTOS INGENIEROS */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmitSolicitud} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-sans font-bold text-zinc-200 block uppercase border-b border-slate-850 pb-2">
                Nueva Solicitud de Insumos - Ingeniería de Proyectos
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Nombre del Ingeniero Solicitante:</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Ing. Carola Pérez..."
                      value={ingeniero}
                      onChange={(e) => setIngeniero(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 pl-9 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <User size={12} className="text-zinc-500 absolute left-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Proyecto / Obra designada:</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: PLANTA PEPSI SUR..."
                      value={proyecto}
                      onChange={(e) => setProyecto(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 pl-9 focus:outline-none focus:border-cyan-500 transition font-sans"
                    />
                    <Landmark size={12} className="text-zinc-500 absolute left-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Descripción del Lazo / Proyecto:</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Instrumentación de Calderas..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

              </div>

              {/* LISTA ADICIÓN COMPONENTES */}
              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                <div className="space-y-1 md:col-span-2 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Seleccionar Componente Solicitado:</label>
                  <select 
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-300 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none"
                  >
                    <option value="">-- Buscar SKU / Modelo --</option>
                    {divisionProducts.map(p => (
                      <option key={p.val_c} value={p.val_c}>
                        {p.val_c} - {p.val_mo} ({p.val_m}) - Disp: {p.val_s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Cantidad Req:</label>
                  <input 
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none font-mono"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleAddItemToReq}
                  disabled={!selectedSku}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 py-2.5 px-3 rounded-lg text-xs font-semibold font-mono disabled:opacity-40 select-none cursor-pointer text-center"
                >
                  Insertar Componente
                </button>

              </div>

              {/* RE-CONSOLIDADO INTERNO DE COMPONENTES SOLICITADOS EN EL NUEVO VALE */}
              {reqItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-550 block uppercase">Desglose de la Solicitud Temporal:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {reqItems.map(item => {
                      const match = products.find(p => p.val_c === item.val_c);
                      return (
                        <div key={item.val_c} className="bg-slate-950 border border-slate-850 p-2 rounded-lg flex justify-between items-center text-xs">
                          <div className="text-left">
                            <span className="font-mono font-bold text-cyan-400">{item.val_c}</span>
                            <span className="text-zinc-300 font-mono text-[11px] ml-2">Mod: {match?.val_mo || "N/A"} ({match?.val_m || "G"})</span>
                            <p className="text-[10px] text-zinc-500 truncate max-w-sm">{match?.val_d}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono font-bold text-emerald-400">Cant: {item.cantidad} unids</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveItemFromReq(item.val_c)}
                              className="text-zinc-650 hover:text-rose-450 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FOOTER SUBMIT FORM */}
              <div className="pt-2 border-t border-slate-850 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => {
                    setReqItems([]);
                    setShowForm(false);
                  }}
                  className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-zinc-400 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={reqItems.length === 0 || !ingeniero || !proyecto}
                  className="bg-rose-600 disabled:opacity-40 hover:bg-rose-500 text-zinc-950 px-5 py-2 font-semibold rounded-lg transition"
                >
                  Someter Requerimiento de Proyecto
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLANILLA O HISTORIAL DE REQUERIMIENTOS DE PROYECTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {divisionSolicitudes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-zinc-550 font-mono text-xs col-span-2">
            <GitPullRequest size={24} className="mx-auto mb-2 opacity-30 text-zinc-400" />
            No hay requerimientos cargados para {activeDivision}.
            <span className="text-[10px] text-zinc-600 block mt-1">Haga clic en el botón superior para ingresar su primera ficha técnica de ingeniería.</span>
          </div>
        ) : (
          divisionSolicitudes.map(sol => {
            const isPending = sol.Status === 'PENDIENTE';
            const isDespachado = sol.Status === 'DESPACHADO';
            const isAnulado = sol.Status === 'ANULADO';

            let borderStyle = "border-slate-800 bg-slate-900";
            if (isDespachado) borderStyle = "border-emerald-900 bg-slate-900/40 opacity-75";
            if (isAnulado) borderStyle = "border-slate-850 bg-slate-950/20 opacity-55";

            let parsedList: Array<{ val_c: string; cantidad: number }> = [];
            try {
              parsedList = JSON.parse(sol.Productos);
            } catch (_) {}

            return (
              <div 
                key={sol.id}
                className={`border rounded-xl p-5 shadow-lg transition flex flex-col justify-between space-y-4 ${borderStyle}`}
              >
                {/* HEADER TARJETA */}
                <div>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
                    <div className="text-left font-mono">
                      <span className="text-[11px] font-bold text-rose-400 block">{sol.id}</span>
                      <span className="text-[9px] text-zinc-500">{sol.Fecha}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      isPending ? 'bg-amber-950 text-amber-400 border border-amber-900/40' :
                      isDespachado ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 
                      'bg-slate-950 text-zinc-500 border border-slate-900'
                    }`}>
                      {sol.Status}
                    </span>
                  </div>

                  {/* DATOS GENERALES */}
                  <div className="space-y-1.5 text-xs text-left">
                    <p className="text-zinc-200 font-sans font-bold uppercase">{sol.Proyecto}</p>
                    <p className="text-[10px] font-mono text-zinc-550">Ingeniero: {sol.Ingeniero}</p>
                    <p className="text-[11px] text-zinc-450 italic font-sans truncate">{sol.Descripcion}</p>
                  </div>
                </div>

                {/* COMPONENTES REQUERIDOS */}
                <div>
                  <span className="text-[10px] font-mono text-zinc-550 block uppercase mb-1.5 pt-2 border-t border-slate-850">
                    Componentes Solicitados:
                  </span>
                  <div className="space-y-1">
                    {parsedList.map(item => {
                      const matchComp = products.find(p => p.val_c === item.val_c);
                      return (
                        <div key={item.val_c} className="flex justify-between items-center text-[11px] font-mono bg-slate-950/60 p-1.5 rounded border border-slate-850">
                          <span className="text-zinc-300 font-bold">{item.val_c}</span>
                          <span className="text-zinc-500 text-[10px] truncate max-w-[150px] font-sans">
                            {matchComp?.val_mo || "Ins. Aux."}
                          </span>
                          <span className="text-cyan-400 text-right font-bold">x{item.cantidad}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACCIONES DEL DESPACHO */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-850 mt-2 flex justify-end gap-2 text-xs">
                    <button 
                      onClick={() => {
                        if (confirm("¿Seguro que desea rechazar y anular esta solicitud?")) {
                          anularSolicitud(sol.id);
                        }
                      }}
                      className="bg-slate-950 text-rose-400 hover:bg-slate-900 px-3 py-1.5 font-mono text-[10px] border border-slate-800 rounded-lg transition"
                    >
                      Anular
                    </button>
                    <button 
                      onClick={() => handleFormalDispatch(sol)}
                      className="bg-rose-600 hover:bg-rose-500 text-zinc-950 px-4 py-1.5 font-sans font-bold text-[10px] rounded-lg transition flex items-center gap-1"
                    >
                      <ShoppingCart size={11} />
                      Despachar formalmente
                    </button>
                  </div>
                )}

                {!isPending && (
                  <div className="pt-2 border-t border-zinc-850/20 text-[10px] font-mono text-zinc-500 text-center italic">
                    {isDespachado ? "✓ Consolidado y descontado de stock regulado" : "☒ Solicitud desestimada administrativamente"}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE DICTADO POR VOZ MANOS LIBRES */}
      <VoiceDictationModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onApplyDictation={handleApplyVoiceDictation}
        onSendToCloud={handleSendVoiceToCloud}
        initialIngeniero={ingeniero}
        initialProyecto={proyecto}
        initialDescripcion={descripcion}
      />

    </div>
  );
}
