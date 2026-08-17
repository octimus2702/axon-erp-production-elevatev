import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Box, Search, Calendar, Landmark, GitCommit, ListFilter } from 'lucide-react';
import { motion } from 'motion/react';

export default function KardexTab() {
  const { products, kardex, activeDivision } = useApp();
  const [selectedSku, setSelectedSku] = useState<string>("");

  // Obtener todos los productos del almacén central
  const divisionProducts = products;

  // Auto-seleccionar primer producto disponible si no hay SKU seleccionado
  useEffect(() => {
    if (!selectedSku && divisionProducts.length > 0) {
      setSelectedSku(divisionProducts[0].val_c);
    }
  }, [selectedSku, divisionProducts]);

  // Si cambia de división, resetear SKU para que tome uno válido de esa sección
  useEffect(() => {
    if (divisionProducts.length > 0) {
      setSelectedSku(divisionProducts[0].val_c);
    }
  }, [activeDivision]);

  // Buscar ficha del producto seleccionado
  const productInfo = products.find(p => p.val_c === selectedSku);

  // Filtrar movimientos del Kardex vinculados al SKU seleccionado, ordenados por fecha de más reciente a más antigua
  const productMovements = kardex
    .filter(k => k.sku === selectedSku)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-6" id="kardex-tab">
      
      {/* CUADRE CONFIGURACIÓN: SELECTOR SKU RAPIDO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <Landmark size={15} className="text-cyan-400" />
            Consulta de Kardex Físico Valorado
          </h3>
          <p className="text-xs text-zinc-400">
            Seleccione un código maestro para consultar su historial de ingresos, salidas, ajustes de piso y saldos acumulados:
          </p>
        </div>

        {/* SELECTOR DROPDOWN DE SKU */}
        <div className="w-full md:w-80 flex items-center gap-2">
          <label className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">SKU Actual:</label>
          <select 
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
          >
            {divisionProducts.length === 0 ? (
              <option value="">Sin productos cargados</option>
            ) : (
              divisionProducts.map(p => (
                <option key={p.val_c} value={p.val_c} className="font-mono">
                  {p.val_c} - {p.val_mo} ({p.val_m})
                </option>
              ))
            )}
          </select>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* PANEL IZQUIERDO: EXPLICACIÓN Y FICHA TÉCNICA DEL SKU (1 Columna) */}
        {productInfo ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-full space-y-4">
            
            <div className="pb-2 border-b border-slate-800">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Clasificación Maestro</span>
              <h4 className="text-sm font-sans font-extrabold text-zinc-100 uppercase">{productInfo.val_mo}</h4>
              <p className="text-xs text-zinc-400 mt-1">{productInfo.val_d}</p>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-zinc-500">CODIGO SKU:</span>
                <span className="text-cyan-400 font-bold">{productInfo.val_c}</span>
              </div>

              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-zinc-500">BARRA / SERIAL:</span>
                <span className="text-zinc-300">{productInfo.val_b || "H-1082-99"}</span>
              </div>

              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-zinc-500">DEF REGISTRO:</span>
                <span className="text-zinc-300">{productInfo.val_r}</span>
              </div>

              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-zinc-500">UNIDAD DE MEDIDA:</span>
                <span className="text-zinc-300">{productInfo.val_u || "Und"}</span>
              </div>

              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span className="text-zinc-500">DIVISION CONTABLE:</span>
                <span className="text-zinc-300">{productInfo.division}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-center">
                <span className="text-[10px] text-zinc-500 block uppercase mb-1">Inventario Lógico en Mano</span>
                <span className="text-xl font-bold text-cyan-400">{productInfo.val_s} {productInfo.val_u || 'Und'}</span>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-zinc-500 text-xs font-mono col-span-1">
            Componente de referencia extraviado.
          </div>
        )}

        {/* REPORTE CENTRAL: LEDGER INTEGRAL CHRONOLOGICO (3 Columnas) */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-full flex flex-col justify-between">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha Movimiento</th>
                    <th className="py-3 px-4">Transacción / Referencia</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4 text-center">Impacto Unitario</th>
                    <th className="py-3 px-4 text-center">Inventario Neto</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-850 font-mono">
                  {productMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs font-mono">
                        <Box size={20} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                        No se han registrado auditorías ni egresos sobre este SKU aún.
                      </td>
                    </tr>
                  ) : (
                    productMovements.map(m => {
                      
                      let impactBadge = "-";
                      let typeLabel = "AJUSTE";
                      let typeColor = "bg-slate-950 text-zinc-400 border-slate-800";

                      if (m.tipo === "ENTRADA") {
                        impactBadge = <span className="text-emerald-400 font-bold">+{m.cambioStock} unids</span>;
                        typeLabel = "ENTRADA";
                        typeColor = "bg-emerald-950 text-emerald-400 border-emerald-900/40";
                      } else if (m.tipo === "SALIDA") {
                        impactBadge = <span className="text-pink-400 font-bold">{m.cambioStock} unids</span>;
                        typeLabel = "SALIDA";
                        typeColor = "bg-rose-950 text-rose-400 border-rose-900/40";
                      } else {
                        impactBadge = m.cambioStock >= 0 
                          ? <span className="text-cyan-400 font-bold">+{m.cambioStock} unids</span>
                          : <span className="text-amber-500 font-bold">{m.cambioStock} unids</span>;
                        typeColor = "bg-indigo-950 text-indigo-400 border-indigo-900/30";
                      }

                      return (
                        <tr key={m.id} className="hover:bg-slate-950/20 transition">
                          {/* FECHA */}
                          <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                            {m.fecha}
                          </td>

                          {/* REFCIA */}
                          <td className="py-3.5 px-4 text-zinc-200 font-sans font-medium text-xs">
                            {m.referencia}
                          </td>

                          {/* TIPO */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 border text-[9px] rounded font-bold tracking-wider ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </td>

                          {/* IMPACTO STOCK */}
                          <td className="py-3.5 px-4 text-center font-bold text-[11px]">
                            {impactBadge}
                          </td>

                          {/* INVENTARIO PARCIAL */}
                          <td className="py-3.5 px-4 text-center text-cyan-400 font-extrabold font-mono">
                            {m.stockResultante} unids
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

              </table>
            </div>

            <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 text-[10px] text-zinc-500 font-sans flex justify-between">
              <span>Libro Diario del WMS de Demostración</span>
              <span className="font-mono">Total Cambios: {productMovements.length}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
