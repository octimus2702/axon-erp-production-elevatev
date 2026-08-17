import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Nota } from '../types';
import { Search, Eye, XCircle, AlertTriangle, FileText, CheckCircle2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizarTexto } from '../data';

export default function HistorialTab() {
  const { vales, anularVale, activeDivision } = useApp();
  const [deepQuery, setDeepQuery] = useState<string>("");
  const [selectedVale, setSelectedVale] = useState<Nota | null>(null);

  // Filtrar vales de la división activa
  const divisionVales = vales.filter(v => v.division === activeDivision);

  // Motor Especial: Escaneo Profundo de Vales
  const filteredVales = divisionVales.filter(vale => {
    if (!deepQuery.trim()) return true;

    const normQuery = normalizarTexto(deepQuery);

    // 1. Escaneo de campos básicos
    const basicFields = [
      vale.NroVale,
      vale.Responsable,
      vale.Destino,
      vale.ProyectoDesc || "",
      vale.TipoDespacho,
      vale.Status || "ACTIVO",
      vale.Rif || ""
    ].map(f => normalizarTexto(f)).join(" ");

    if (basicFields.includes(normQuery)) return true;

    // 2. Escaneo profundo recursivo de los Productos encasquetados (JSON String)
    try {
      const items: Array<{ val_c: string; val_mo: string; val_d: string; val_m: string }> = JSON.parse(vale.Productos);
      return items.some(item => {
        const itemFields = [
          item.val_c,
          item.val_mo,
          item.val_d,
          item.val_m
        ].map(i => normalizarTexto(i)).join(" ");
        return itemFields.includes(normQuery);
      });
    } catch (_) {
      return false;
    }
  });

  return (
    <div className="space-y-6" id="historial-tab">
      
      {/* CUADRO DE BUSQUEDA CON ESCANEO PROFUNDO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
          Buscador con Escaneo Profundo (Deep Search Engine)
        </label>
        <div className="relative flex items-center">
          <input 
            type="text"
            placeholder="Tipee códigos de componente, modelos anidados o encargados de obra..."
            value={deepQuery}
            onChange={(e) => setDeepQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2.5 pl-9 pr-4 focus:outline-none focus:border-cyan-500 transition font-mono"
          />
          <Search size={14} className="text-zinc-500 absolute left-3" />
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">
          🗃️ El motor analiza recursivamente el JSON envasado de cada vale rastreando componentes secundarios asignados.
        </p>
      </div>

      {/* PLANILLA DE HISTORIAL DE VALES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">N° Vale Correlativo</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Autoriza / Recibe</th>
                <th className="py-3 px-4">Obra de Destino</th>
                <th className="py-3 px-4">Tipo Canal</th>
                <th className="py-3 px-4">Cant. Items</th>
                <th className="py-3 px-4">Estatus Interno</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-850">
              {filteredVales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 text-xs font-mono">
                    <FileText size={24} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                    No se localizaron transacciones en el historial.
                  </td>
                </tr>
              ) : (
                filteredVales.map(v => {
                  let cantItems = 0;
                  try {
                    const parsed = JSON.parse(v.Productos);
                    cantItems = parsed.reduce((sum: number, item: any) => sum + (item.cantidad || 1), 0);
                  } catch (_) {}

                  const isAnulado = v.Status === "ANULADO";

                  return (
                    <tr 
                      key={v.NroVale}
                      className={`hover:bg-slate-950/30 transition ${isAnulado ? 'bg-slate-950/10 opacity-60' : ''}`}
                    >
                      {/* CORRELATIVO */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-300">
                        #N-000{v.NroVale}
                      </td>

                      {/* FECHA */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {v.Fecha}
                      </td>

                      {/* ENCARGADO */}
                      <td className="py-3.5 px-4 text-zinc-200 font-medium">
                        {v.Responsable}
                      </td>

                      {/* DESTINO */}
                      <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate" title={v.Destino}>
                        {v.Destino}
                      </td>

                      {/* TIPO */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-400">
                        {v.TipoDespacho}
                      </td>

                      {/* TOTAL PRODUCTOS */}
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        {cantItems} unids
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider ${
                          isAnulado 
                            ? 'bg-rose-950/50 border border-rose-900/40 text-rose-400' 
                            : 'bg-emerald-950/50 border border-emerald-900/40 text-emerald-400'
                        }`}>
                          {isAnulado ? 'ANULADO' : 'ACTIVO'}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setSelectedVale(v)}
                            className="p-1 hover:bg-slate-950 hover:text-cyan-400 border border-slate-800 rounded text-zinc-400 transition"
                            title="Ver Ficha Completa del Vale"
                          >
                            <Eye size={13} />
                          </button>
                          
                          {!isAnulado && (
                            <button 
                              onClick={() => {
                                if (confirm(`¿Confirma que desea ANULAR el Vale N-000${v.NroVale}? Esto devolverá automáticamente las cantidades indicadas al stock lógico.`)) {
                                  anularVale(v.NroVale);
                                }
                              }}
                              className="p-1 hover:bg-slate-950 hover:text-rose-400 border border-slate-800 rounded text-rose-500/80 transition"
                              title="Anular vale y reembolsar stock"
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE VALE CON FIRMA TÁCTIL */}
      <AnimatePresence>
        {selectedVale && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1 text-cyan-400">
                  <FileText size={15} />
                  Ficha Resumen Vale #N-000{selectedVale.NroVale}
                </span>
                <button 
                  onClick={() => setSelectedVale(null)}
                  className="text-zinc-500 hover:text-zinc-300 font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Tipo Documento:</span>
                  <span className="font-sans font-bold text-zinc-300">{selectedVale.TipoDespacho}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Fecha Emisión Local:</span>
                  <span className="font-mono text-zinc-350">{selectedVale.Fecha}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Autoriza / Transporta:</span>
                  <span className="font-sans text-zinc-300">{selectedVale.Responsable}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Estatus Actual:</span>
                  <span className={`inline-block px-2 py-0.5 font-mono font-bold rounded ${selectedVale.Status === 'ANULADO' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {selectedVale.Status || 'ACTIVO'}
                  </span>
                </div>
                <div className="col-span-2 space-y-1.5 border-t border-slate-850 pt-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Destino Final Proyecto:</span>
                  <span className="font-sans text-zinc-300 block">{selectedVale.Destino}</span>
                  {selectedVale.Rif && (
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">ID RIF: {selectedVale.Rif}</span>
                  )}
                  {selectedVale.ProyectoDesc && (
                    <p className="text-[11px] text-zinc-400 bg-slate-950 p-2 rounded mt-1.5 italic font-sans border border-slate-850">
                      Desc. Obra: {selectedVale.ProyectoDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* LISTADO INTERNO DE ITEMS */}
              <div className="border-t border-slate-850 pt-4.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-2">Artículos Despachados:</span>
                <div className="bg-slate-950 rounded-lg border border-slate-850 p-2 select-none max-h-40 overflow-y-auto space-y-1">
                  {JSON.parse(selectedVale.Productos).map((item: any) => (
                    <div key={item.val_c} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-2 rounded text-xs">
                      <div>
                        <span className="font-mono font-bold text-cyan-400">{item.val_c}</span>
                        <span className="text-zinc-300 ml-2 font-mono text-[11px]">{item.val_mo}</span>
                        <p className="text-[10px] text-zinc-500 truncate max-w-xs font-sans mt-0.5">{item.val_d}</p>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-400 text-xs text-right shrink-0">
                        x{item.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FIRMA DE CONFORMIDAD RECEPTOR */}
              <div className="border-t border-slate-850 pt-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Firma Digitalizada de Receptor:</span>
                {selectedVale.Firma ? (
                  <div className="bg-slate-950 p-2 rounded border border-slate-850 flex justify-center">
                    <img 
                      src={selectedVale.Firma} 
                      alt="Firma Conductor" 
                      referrerPolicy="no-referrer"
                      className="h-16 w-auto max-w-[240px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-950 py-3 rounded border border-dashed border-slate-800 text-center text-[10px] text-zinc-500 font-mono uppercase">
                    Confirmado por protocolo seguro sin firma visual
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
                {selectedVale.Status !== 'ANULADO' && (
                  <button 
                    onClick={() => {
                      if (confirm("¿Seguro de anular este vale?")) {
                        anularVale(selectedVale.NroVale);
                        setSelectedVale(null);
                      }
                    }}
                    className="bg-rose-950 text-rose-400 border border-rose-900/40 hover:bg-rose-900 hover:text-white px-4 py-2 font-semibold rounded-lg transition"
                  >
                    Anular Vale
                  </button>
                )}
                <button 
                  onClick={() => setSelectedVale(null)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-5 py-2 font-semibold rounded-lg transition"
                >
                  Entendido
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
