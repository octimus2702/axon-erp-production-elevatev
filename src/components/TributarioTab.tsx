import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENT_COMPANY } from '../config/companyConfig';
import { RetencionTributaria } from '../types';
import { 
  Landmark, 
  PlusCircle, 
  Printer, 
  Search, 
  ShieldAlert, 
  FileCheck, 
  DollarSign,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TributarioTab() {
  const { 
    empresaActiva,
    retenciones, 
    crearRetencion, 
    activeDivision, 
    tasaCambioBCV, 
    addToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewRet, setPreviewRet] = useState<RetencionTributaria | null>(null);

  // Form states
  const [tipo, setTipo] = useState<'IVA' | 'ISLR' | 'MUNICIPAL'>('IVA');
  const [proveedorNombre, setProveedorNombre] = useState('Yaskawa Electric Corp / Dist. Elevadores C.A.');
  const [proveedorRif, setProveedorRif] = useState('J-00129841-9');
  const [nroFacturaOrigen, setNroFacturaOrigen] = useState('FACT-99201');
  const [montoBaseUSD, setMontoBaseUSD] = useState('1200');
  const [porcentajeRetencion, setPorcentajeRetencion] = useState('75');

  // Filtrado
  const retencionesFiltradas = retenciones.filter(r => {
    const matchDiv = r.division === activeDivision;
    const matchSearch = 
      r.correlativoComprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.proveedorRif.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDiv && matchSearch;
  });

  const baseUSD = parseFloat(montoBaseUSD) || 0;
  const pct = parseFloat(porcentajeRetencion) || 0;
  const ivaCalculadoUSD = baseUSD * 0.16;
  const retencionMontoUSD = tipo === 'IVA' ? (ivaCalculadoUSD * (pct / 100)) : (baseUSD * (pct / 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const period = new Date().toISOString().slice(0, 7).replace('-', '');
    const corrNum = (retenciones.length + 1).toString().padStart(8, '0');
    const correlativoComprobante = `2026${period}${corrNum}`;

    const nueva = crearRetencion({
      tipo,
      fecha: new Date().toISOString().split('T')[0],
      correlativoComprobante,
      proveedorNombre,
      proveedorRif,
      nroFacturaOrigen,
      montoBaseUSD: baseUSD,
      montoIvaUSD: ivaCalculadoUSD,
      porcentajeRetencion: pct,
      montoRetenidoUSD: retencionMontoUSD,
      montoRetenidoBs: retencionMontoUSD * tasaCambioBCV,
      division: activeDivision
    });

    setShowModal(false);
    setPreviewRet(nueva);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Landmark size={14} />
            <span>MÓDULO 7: GESTIÓN TRIBUTARIA Y RETENCIONES</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Comprobantes de Retención (IVA 75%/100%, ISLR, Municipales) — Tecno Elevatev
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Generación y correlativo legal SENIAT para retenciones de IVA en compras de repuestos y servicios técnicos.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <PlusCircle size={18} />
          <span>Generar Comprobante de Retención</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Comprobante, RIF o Proveedor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tabla Retenciones */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Nro Comprobante</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Proveedor / RIF</th>
                <th className="p-4">Factura Origen</th>
                <th className="p-4 text-right">Base USD</th>
                <th className="p-4 text-right">Monto Retenido USD</th>
                <th className="p-4 text-right">Monto Retenido Bs</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {retencionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No hay comprobantes de retención tributaria registrados.
                  </td>
                </tr>
              ) : (
                retencionesFiltradas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-cyan-400">{r.correlativoComprobante}</td>
                    <td className="p-4 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold uppercase">
                        {r.tipo} ({r.porcentajeRetencion}%)
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{r.fecha}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{r.proveedorNombre}</div>
                      <div className="text-xs font-mono text-slate-500">{r.proveedorRif}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">{r.nroFacturaOrigen}</td>
                    <td className="p-4 text-right font-mono">${r.montoBaseUSD.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">${r.montoRetenidoUSD.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-xs text-slate-400">Bs. {r.montoRetenidoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setPreviewRet(r)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                        title="Imprimir Comprobante SENIAT"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR RETENCIÓN */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
            >
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Landmark size={20} className="text-cyan-400" />
                Generar Comprobante de Retención
              </h3>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Impuesto</label>
                    <select 
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500"
                    >
                      <option value="IVA">RETENCIÓN IVA EN COMPRA</option>
                      <option value="ISLR">RETENCIÓN ISLR</option>
                      <option value="MUNICIPAL">IMPUESTO MUNICIPAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">% Retención</label>
                    <select 
                      value={porcentajeRetencion}
                      onChange={(e) => setPorcentajeRetencion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500 font-mono"
                    >
                      <option value="75">75% (IVA Estándar SENIAT)</option>
                      <option value="100">100% (IVA Total Esp.)</option>
                      <option value="2">2% (ISLR Servicios)</option>
                      <option value="5">5% (ISLR Honorarios)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Proveedor / Vendedor</label>
                    <input 
                      type="text"
                      required
                      value={proveedorNombre}
                      onChange={(e) => setProveedorNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">RIF Proveedor</label>
                    <input 
                      type="text"
                      required
                      value={proveedorRif}
                      onChange={(e) => setProveedorRif(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nro Factura Compra</label>
                    <input 
                      type="text"
                      required
                      value={nroFacturaOrigen}
                      onChange={(e) => setNroFacturaOrigen(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Monto Base Imponible ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={montoBaseUSD}
                      onChange={(e) => setMontoBaseUSD(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-cyan-400 font-mono font-bold focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>IVA Calculado (16%):</span>
                    <span>${ivaCalculadoUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Monto a Retener USD:</span>
                    <span>${retencionMontoUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Monto a Retener Bs (Tasa {tasaCambioBCV}):</span>
                    <span>Bs. {(retencionMontoUSD * tasaCambioBCV).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded text-sm">Generar Comprobante</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VISTA PREVIA COMPROBANTE OFICIAL SENIAT */}
      <AnimatePresence>
        {previewRet && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative space-y-4 sm:space-y-6 my-4 sm:my-8 max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none"
            >
              <div className="border-b-2 border-slate-900 pb-3 text-center">
                <h1 className="text-xl font-black text-slate-900">COMPROBANTE DE RETENCIÓN DEL IMPUESTO AL VALOR AGREGADO (IVA)</h1>
                <p className="text-xs text-slate-600 font-mono">Ley del Impuesto al Valor Agregado - Artículo 11</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Agente de Retención:</span>
                  <span className="font-bold text-slate-900">{empresaActiva.nombre}</span>
                  <p className="font-mono text-slate-700">RIF: {empresaActiva.rif}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Nro Comprobante:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">{previewRet.correlativoComprobante}</span>
                  <p className="font-mono text-slate-700">Fecha: {previewRet.fecha}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">Sujeto Retenido (Proveedor):</span>
                  <span className="font-bold text-slate-900">{previewRet.proveedorNombre}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">RIF Proveedor:</span>
                  <span className="font-mono font-bold text-slate-900">{previewRet.proveedorRif}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-bold uppercase text-slate-700">
                    <th className="py-2">Factura Origen</th>
                    <th className="py-2 text-right">Base Imponible USD</th>
                    <th className="py-2 text-right">IVA USD</th>
                    <th className="py-2 text-center">% Ret</th>
                    <th className="py-2 text-right">Monto Retenido USD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 font-mono font-bold">{previewRet.nroFacturaOrigen}</td>
                    <td className="py-2 text-right font-mono">${previewRet.montoBaseUSD.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono">${previewRet.montoIvaUSD.toFixed(2)}</td>
                    <td className="py-2 text-center font-mono font-bold">{previewRet.porcentajeRetencion}%</td>
                    <td className="py-2 text-right font-mono font-bold text-rose-600">${previewRet.montoRetenidoUSD.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-slate-900 text-white p-3 rounded-xl text-center space-y-1 font-mono">
                <p className="text-[10px] uppercase text-slate-400">Total Retenido en Bolívares (Tasa Oficial BCV)</p>
                <h3 className="text-xl font-bold text-cyan-400">Bs. {previewRet.montoRetenidoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
                <button onClick={() => setPreviewRet(null)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-bold text-xs">Cerrar</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded font-bold text-xs flex items-center gap-2">
                  <Printer size={14} /> Imprimir Comprobante Oficial
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
