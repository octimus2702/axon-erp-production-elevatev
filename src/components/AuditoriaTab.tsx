import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { coincidenPalabrasClave } from '../data';
import { Producto, ConteoAuditoria } from '../types';
import { Search, Plus, AlertTriangle, CheckCircle, Trash2, ArrowUpRight, ArrowDownRight, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuditoriaTab() {
  const { products, activeDivision, aplicarAuditoriaCiega } = useApp();

  // Buscar SKU elegible para auditoría
  const [skuQuery, setSkuQuery] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Lista de conteos de la sesión de auditoría activa
  const [sessionConteos, setSessionConteos] = useState<ConteoAuditoria[]>([]);

  // Checkbox de confirmación de supervisor
  const [supervisorConfirmed, setSupervisorConfirmed] = useState<boolean>(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);

  // Filtrar productos de la división activa elegibles
  const eligibleProducts = products
    .filter(p => p.division === activeDivision)
    .filter(p => coincidenPalabrasClave(p, skuQuery));

  // Añadir SKU a la planilla de auditoría activa
  const addProductToAudit = (p: Producto) => {
    // Si ya existe en planilla, no re-añadir
    if (sessionConteos.some(c => c.sku === p.val_c)) {
      setSkuQuery("");
      setShowDropdown(false);
      return;
    }

    const nuevoConteo: ConteoAuditoria = {
      sku: p.val_c,
      modelo: p.val_mo,
      descripcion: p.val_d,
      marca: p.val_m,
      stockLogico: p.val_s,
      stockFisico: null // Esperando entrada del auditor
    };

    setSessionConteos(prev => [...prev, nuevoConteo]);
    setSkuQuery("");
    setShowDropdown(false);
  };

  // Actualizar conteo físico en planilla
  const handlePhysicalCountChange = (sku: string, val: string) => {
    const parsedVal = val === "" ? null : Math.max(0, parseInt(val) || 0);
    setSessionConteos(prev => prev.map(c => c.sku === sku ? { ...c, stockFisico: parsedVal } : c));
  };

  // Quitar item de la planilla
  const removeAuditItem = (sku: string) => {
    setSessionConteos(prev => prev.filter(c => c.sku !== sku));
  };

  // Aplicar Todos los Ajustes de Auditoría
  const handleApplyAuditoria = () => {
    if (sessionConteos.length === 0 || !supervisorConfirmed) return;

    // Ejecutar sobre el Contexto el ajuste en lote
    aplicarAuditoriaCiega(sessionConteos);

    // Limpiar planilla y estados
    setSessionConteos([]);
    setSupervisorConfirmed(false);
    setShowSuccessBanner(true);

    // Ocultar banner de éxito después de unos segundos
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 5000);
  };

  return (
    <div className="space-y-6" id="auditoria-tab">
      
      {/* CUADRO DE EXPLICACION AUDITORIA DE CIEGO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-cyan-400">
          <ClipboardList size={140} />
        </div>
        <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <ClipboardList size={15} className="text-cyan-400" />
          Procolos de Conteo de Ciego - Hoja de Piso
        </h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-3xl">
          La <strong>Auditoría de Ciego</strong> compara de manera precisa el inventario real disponible en los estantes físicos contra el inventario lógico registrado en la bases de datos del WMS. Complete los códigos SKU, registre las cantidades físicas contabilizadas en el almacén, verifique la desviación teórica e introduzca la firma de conformidad del supervisor.
        </p>
      </div>

      {showSuccessBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl flex items-center gap-3"
        >
          <CheckCircle className="text-emerald-400 shrink-0" size={18} />
          <div className="text-xs">
            <span className="font-sans font-bold text-emerald-400 block">Sincronización de Auditoría Completada</span>
            <span className="text-zinc-400">Los stocks se han calibrado con éxito. Se crearon los reportes de ajuste y trazabilidad en el Kardex Diario.</span>
          </div>
        </motion.div>
      )}

      {/* DISPOSITIVO DE CARGA DE SKU */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="relative">
          <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
            Buscar y Añadir SKU / Barcode para Auditar en Piso:
          </label>
          <div className="relative flex items-center">
            <input 
              type="text"
              placeholder="Ej: AU0001, HP0002 o escanee barra..."
              value={skuQuery}
              onChange={(e) => {
                setSkuQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2.5 pl-9 pr-4 focus:outline-none focus:border-cyan-500 transition font-mono"
            />
            <Search size={14} className="text-zinc-500 absolute left-3" />
          </div>

          {/* DROPDOWN PREDICTIVO PARA AGREGAR SKU */}
          {showDropdown && skuQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 bg-slate-950 border border-zinc-800 mt-2 rounded-lg py-1 max-h-48 overflow-y-auto z-10 shadow-2xl">
              {eligibleProducts.length === 0 ? (
                <div className="text-center text-[10px] text-zinc-500 font-mono py-3">No hay coincidencias de SKU.</div>
              ) : (
                eligibleProducts.map(p => (
                  <div 
                    key={p.val_c}
                    onClick={() => addProductToAudit(p)}
                    className="px-4 py-2 hover:bg-slate-900 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <span className="font-mono text-xs text-cyan-400 font-bold">{p.val_c}</span>
                      <span className="text-zinc-400 text-[11px] ml-2 font-sans">{p.val_mo} ({p.val_m})</span>
                      <p className="text-[10px] text-zinc-500 truncate max-w-md mt-0.5">{p.val_d}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Piso Lógico: {p.val_s}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* PLANILLA DE CONTROL ACTIVA DE AUDITORÍA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Código SKU</th>
                <th className="py-3 px-4">Modelo Técnico / Marca</th>
                <th className="py-3 px-4">Descripción General</th>
                <th className="py-3 px-4 text-center">Inventario Lógico (A)</th>
                <th className="py-3 px-4 text-center">Conteo Físico Real (B)</th>
                <th className="py-3 px-4 text-center">Desviación (B - A)</th>
                <th className="py-3 px-4 text-center">Estado Auditor</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {sessionConteos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 text-xs font-mono">
                    <ClipboardList size={22} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                    Bandeja de Conteos Vacía.
                    <span className="text-[10px] text-zinc-650 block mt-1">Busque y cargue un SKU arriba para registrar el balance de piso.</span>
                  </td>
                </tr>
              ) : (
                sessionConteos.map(item => {
                  const hasValue = item.stockFisico !== null;
                  const variance = hasValue ? (item.stockFisico as number) - item.stockLogico : 0;
                  
                  let varianceBadge = "-";
                  let rowAltClass = "";

                  if (hasValue) {
                    if (variance === 0) {
                      varianceBadge = (
                        <span className="text-emerald-400 font-mono font-bold flex items-center justify-center gap-0.5">
                          ✓ Match Exacto (0)
                        </span>
                      );
                    } else if (variance > 0) {
                      varianceBadge = (
                        <span className="text-cyan-400 font-mono font-bold flex items-center justify-center gap-0.5">
                          <ArrowUpRight size={12} /> +{variance} (Sobrante)
                        </span>
                      );
                      rowAltClass = "bg-cyan-950/5";
                    } else {
                      varianceBadge = (
                        <span className="text-pink-400 font-mono font-bold flex items-center justify-center gap-0.5 animate-pulse">
                          <ArrowDownRight size={12} /> {variance} (Faltante)
                        </span>
                      );
                      rowAltClass = "bg-rose-950/5";
                    }
                  }

                  return (
                    <tr 
                      key={item.sku} 
                      className={`hover:bg-slate-950/20 transition ${rowAltClass}`}
                    >
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">{item.sku}</td>

                      {/* MODELO / MARCA */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-cyan-300 font-semibold">{item.modelo}</span>
                        <p className="text-[10px] font-mono text-zinc-500">{item.marca}</p>
                      </td>

                      {/* DESC */}
                      <td className="py-3.5 px-4 text-zinc-400 truncate max-w-xs" title={item.descripcion}>
                        {item.descripcion}
                      </td>

                      {/* STOCK LOGICO (SISTEMA) */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-400">
                        {item.stockLogico} unids
                      </td>

                      {/* CONTEO FISICO REAL EDITABLE */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <input 
                            type="number"
                            min="0"
                            placeholder="Ingrese conteo..."
                            value={item.stockFisico === null ? "" : item.stockFisico}
                            onChange={(e) => handlePhysicalCountChange(item.sku, e.target.value)}
                            className="bg-slate-950 text-center w-24 rounded border border-slate-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 py-1"
                          />
                        </div>
                      </td>

                      {/* VARIANCE */}
                      <td className="py-3.5 px-4 text-center">
                        {varianceBadge}
                      </td>

                      {/* ESTADO AUDITOR */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                          hasValue ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-950 text-zinc-650'
                        }`}>
                          {hasValue ? 'CONTADO' : 'PENDIENTE'}
                        </span>
                      </td>

                      {/* ELIMINAR LINEA */}
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => removeAuditItem(item.sku)}
                          className="text-zinc-600 hover:text-rose-400 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ACCIONES Y CONFIRMACIONES */}
        {sessionConteos.length > 0 && (
          <div className="bg-slate-950 p-5 border-t border-slate-800 space-y-4">
            
            {/* PANEL CONFIRMACIÓN SUPERVISOR */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={supervisorConfirmed}
                  onChange={(e) => setSupervisorConfirmed(e.target.checked)}
                  className="h-4 w-4 bg-slate-950 text-cyan-500 border border-slate-800 rounded focus:ring-0"
                />
                <div className="text-left">
                  <span className="text-xs font-sans font-bold text-zinc-200 block">Autorización del Supervisor de Almacén</span>
                  <span className="text-[10px] font-mono text-zinc-500 block">Doy fe de que los conteos físicos de estantería ingresados coinciden con la planilla física.</span>
                </div>
              </label>

              <button 
                onClick={handleApplyAuditoria}
                disabled={!supervisorConfirmed}
                className="w-full md:w-auto bg-cyan-600 disabled:bg-slate-800 disabled:text-zinc-500 hover:bg-cyan-500 text-zinc-950 hover:text-zinc-900 font-sans font-bold text-xs py-2.5 px-6 rounded-lg transition"
              >
                Confirmar y Aplicar Ajuste
              </button>
            </div>

            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>Sesión activa: {sessionConteos.length} items agregados</span>
              <span>ISO 9001:2018 - Registro Físico de Trazabilidad</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
