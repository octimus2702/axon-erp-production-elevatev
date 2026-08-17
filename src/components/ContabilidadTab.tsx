import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENT_COMPANY } from '../config/companyConfig';
import { RetencionTributaria } from '../types';
import NominaTab from './NominaTab';
import TributarioTab from './TributarioTab';
import FacturacionTab from './FacturacionTab';
import RecibosNotasTab from './RecibosNotasTab';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Search, 
  Calendar, 
  Briefcase, 
  FileText,
  Building,
  CheckCircle2,
  Filter,
  BookOpen,
  BookMarked,
  Landmark,
  BarChart3,
  Printer,
  Download,
  Building2,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  FileCheck,
  Receipt,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { exportAllDataToExcelCSV } from '../utils/excelExporter';

type SubTab = 'MOVIMIENTOS' | 'FACTURACION' | 'RECIBOS' | 'LIBRO_DIARIO' | 'LIBRO_MAYOR' | 'NOMINA' | 'TRIBUTARIO' | 'REPORTES';

interface ContabilidadTabProps {
  initialSubTab?: SubTab;
}

export default function ContabilidadTab({ initialSubTab }: ContabilidadTabProps) {
  const { 
    empresaActiva,
    movimientosContables, 
    registrarMovimiento, 
    activeDivision, 
    tasaCambioBCV, 
    addToast,
    retenciones,
    crearRetencion,
    facturas,
    recibos,
    reportesTecnicos,
    presupuestos,
    clientes,
    empleados
  } = useApp();

  // Sub-tab activa
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab || 'MOVIMIENTOS');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Filtros Movimientos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'TODOS' | 'INGRESO' | 'EGRESO' | 'COMPRA_INVENTARIO'>('TODOS');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form Movimientos
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO' | 'COMPRA_INVENTARIO'>('EGRESO');
  const [categoria, setCategoria] = useState('Repuestos y Componentes');
  const [descripcion, setDescripcion] = useState('');
  const [montoUSD, setMontoUSD] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [tercero, setTercero] = useState('');

  // Form Retención Tributaria
  const [showRetencionModal, setShowRetencionModal] = useState(false);
  const [previewRet, setPreviewRet] = useState<RetencionTributaria | null>(null);
  const [tipoRet, setTipoRet] = useState<'IVA' | 'ISLR' | 'MUNICIPAL'>('IVA');
  const [proveedorNombre, setProveedorNombre] = useState('Yaskawa Electric Corp / Dist. Elevadores C.A.');
  const [proveedorRif, setProveedorRif] = useState('J-00129841-9');
  const [nroFacturaOrigen, setNroFacturaOrigen] = useState('FACT-99201');
  const [montoBaseUSD, setMontoBaseUSD] = useState('1200');
  const [porcentajeRetencion, setPorcentajeRetencion] = useState('75');

  // Filtro de Mayor
  const [selectedCuentaMayor, setSelectedCuentaMayor] = useState<string>('1.1.01'); // Banco Banesco USD

  // Reportes state
  const [tipoReporte, setTipoReporte] = useState<'RESUMEN_EJECUTIVO' | 'FACTURACION_VS_PRESUPUESTO' | 'MANTENIMIENTO_EQUIPOS' | 'TRIBUTARIO_SENIAT'>('RESUMEN_EJECUTIVO');

  // -------------------------------------------------------------
  // CÁLCULOS GENERALES
  // -------------------------------------------------------------
  const movimientosFiltrados = movimientosContables.filter(m => {
    const matchDiv = m.division === activeDivision;
    const matchType = filterTipo === 'TODOS' || m.tipo === filterTipo;
    const matchSearch = 
      m.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.comprobanteReferencia && m.comprobanteReferencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.proveedorOCliente && m.proveedorOCliente.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchDiv && matchType && matchSearch;
  });

  const totalIngresosUSD = movimientosContables
    .filter(m => m.division === activeDivision && m.tipo === 'INGRESO')
    .reduce((acc, curr) => acc + curr.montoUSD, 0);

  const totalEgresosUSD = movimientosContables
    .filter(m => m.division === activeDivision && (m.tipo === 'EGRESO' || m.tipo === 'COMPRA_INVENTARIO'))
    .reduce((acc, curr) => acc + curr.montoUSD, 0);

  const balanceUSD = totalIngresosUSD - totalEgresosUSD;

  // -------------------------------------------------------------
  // LIBRO DIARIO CONTABLE (Asientos dinámicos construidos)
  // -------------------------------------------------------------
  const asientosLibroDiario = [
    {
      asientoNro: "001",
      fecha: "2026-07-01",
      concepto: "Asiento de Apertura - Saldo Inicial de Caja y Banco Banesco USD/Bs",
      detalles: [
        { cuentaCodigo: "1.1.01", cuentaNombre: "Banco Banesco USD", debeUSD: 25000, haberUSD: 0, debeBs: 25000 * tasaCambioBCV, haberBs: 0 },
        { cuentaCodigo: "1.1.02", cuentaNombre: "Caja Chica Bolívares", debeUSD: 1000, haberUSD: 0, debeBs: 1000 * tasaCambioBCV, haberBs: 0 },
        { cuentaCodigo: "3.1.01", cuentaNombre: "Capital Social Tecno Elevatev C.A.", debeUSD: 0, haberUSD: 26000, debeBs: 0, haberBs: 26000 * tasaCambioBCV }
      ]
    },
    ...movimientosContables.filter(m => m.division === activeDivision).map((m, idx) => ({
      asientoNro: (idx + 2).toString().padStart(3, '0'),
      fecha: m.fecha,
      concepto: `${m.tipo === 'INGRESO' ? 'Cobro / Ingreso: ' : 'Pago / Egreso: '} ${m.descripcion} (${m.proveedorOCliente || 'Cliente/Proveedor General'})`,
      detalles: m.tipo === 'INGRESO' ? [
        { cuentaCodigo: "1.1.01", cuentaNombre: "Banco Banesco USD", debeUSD: m.montoUSD, haberUSD: 0, debeBs: m.montoBs, haberBs: 0 },
        { cuentaCodigo: "4.1.01", cuentaNombre: m.division === 'MODERNIZACION' ? "Ingresos por Modernización" : "Ingresos por Mantenimiento", debeUSD: 0, haberUSD: m.montoUSD, debeBs: 0, haberBs: m.montoBs }
      ] : [
        { cuentaCodigo: "5.1.01", cuentaNombre: `Gastos Operativos - ${m.categoria}`, debeUSD: m.montoUSD, haberUSD: 0, debeBs: m.montoBs, haberBs: 0 },
        { cuentaCodigo: "1.1.01", cuentaNombre: "Banco Banesco USD", debeUSD: 0, haberUSD: m.montoUSD, debeBs: 0, haberBs: m.montoBs }
      ]
    }))
  ];

  // -------------------------------------------------------------
  // LIBRO MAYOR (Cuentas T)
  // -------------------------------------------------------------
  const cuentasMayorPlan = [
    { codigo: "1.1.01", nombre: "Banco Banesco USD", tipo: "ACTIVO" },
    { codigo: "1.1.02", nombre: "Caja Chica Bolívares", tipo: "ACTIVO" },
    { codigo: "1.2.01", nombre: "Cuentas por Cobrar Condominios", tipo: "ACTIVO" },
    { codigo: "2.1.01", nombre: "Cuentas por Pagar Proveedores (Fermator/Yaskawa)", tipo: "PASIVO" },
    { codigo: "2.1.02", nombre: "Fiscal - Retenciones IVA por Enterar SENIAT", tipo: "PASIVO" },
    { codigo: "3.1.01", nombre: "Capital Social Tecno Elevatev C.A.", tipo: "PATRIMONIO" },
    { codigo: "4.1.01", nombre: "Ingresos por Modernización y Mantenimiento", tipo: "INGRESO" },
    { codigo: "5.1.01", nombre: "Gastos Operativos & Compras de Repuestos", tipo: "EGRESO" }
  ];

  // Generar movimientos de Mayor para la cuenta seleccionada
  const mayorMovimientos = [];
  let saldoAcumuladoUSD = 0;

  if (selectedCuentaMayor === "1.1.01") {
    saldoAcumuladoUSD = 25000;
    mayorMovimientos.push({
      fecha: "2026-07-01",
      referencia: "AS-001 Apertura",
      concepto: "Saldo Inicial Banco Banesco USD",
      debeUSD: 25000,
      haberUSD: 0,
      saldoUSD: saldoAcumuladoUSD
    });

    movimientosContables.filter(m => m.division === activeDivision).forEach((m, idx) => {
      if (m.tipo === 'INGRESO') {
        saldoAcumuladoUSD += m.montoUSD;
        mayorMovimientos.push({
          fecha: m.fecha,
          referencia: `AS-${(idx+2).toString().padStart(3,'0')}`,
          concepto: m.descripcion,
          debeUSD: m.montoUSD,
          haberUSD: 0,
          saldoUSD: saldoAcumuladoUSD
        });
      } else {
        saldoAcumuladoUSD -= m.montoUSD;
        mayorMovimientos.push({
          fecha: m.fecha,
          referencia: `AS-${(idx+2).toString().padStart(3,'0')}`,
          concepto: m.descripcion,
          debeUSD: 0,
          haberUSD: m.montoUSD,
          saldoUSD: saldoAcumuladoUSD
        });
      }
    });
  } else if (selectedCuentaMayor === "4.1.01") {
    saldoAcumuladoUSD = 0;
    movimientosContables.filter(m => m.division === activeDivision && m.tipo === 'INGRESO').forEach((m, idx) => {
      saldoAcumuladoUSD += m.montoUSD;
      mayorMovimientos.push({
        fecha: m.fecha,
        referencia: `AS-ING-${idx+1}`,
        concepto: m.descripcion,
        debeUSD: 0,
        haberUSD: m.montoUSD,
        saldoUSD: saldoAcumuladoUSD
      });
    });
  } else if (selectedCuentaMayor === "5.1.01") {
    saldoAcumuladoUSD = 0;
    movimientosContables.filter(m => m.division === activeDivision && m.tipo !== 'INGRESO').forEach((m, idx) => {
      saldoAcumuladoUSD += m.montoUSD;
      mayorMovimientos.push({
        fecha: m.fecha,
        referencia: `AS-EGR-${idx+1}`,
        concepto: m.descripcion,
        debeUSD: m.montoUSD,
        haberUSD: 0,
        saldoUSD: saldoAcumuladoUSD
      });
    });
  } else {
    mayorMovimientos.push({
      fecha: "2026-07-01",
      referencia: "AS-001",
      concepto: "Asiento de Control Contable",
      debeUSD: 0,
      haberUSD: 0,
      saldoUSD: 0
    });
  }

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSubmitMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    const valUSD = parseFloat(montoUSD);
    if (isNaN(valUSD) || valUSD <= 0) {
      addToast('Ingrese un monto válido mayor a 0 USD', 'error');
      return;
    }

    registrarMovimiento({
      fecha: new Date().toISOString().split('T')[0],
      tipo,
      categoria,
      descripcion,
      montoUSD: valUSD,
      montoBs: valUSD * tasaCambioBCV,
      comprobanteReferencia: comprobante || undefined,
      proveedorOCliente: tercero || undefined,
      division: activeDivision
    });

    setShowAddModal(false);
    setDescripcion('');
    setMontoUSD('');
    setComprobante('');
    setTercero('');
  };

  const handleSubmitRetencion = (e: React.FormEvent) => {
    e.preventDefault();
    const baseUSD = parseFloat(montoBaseUSD) || 0;
    const pct = parseFloat(porcentajeRetencion) || 0;
    const ivaUSD = baseUSD * 0.16;
    const retUSD = tipoRet === 'IVA' ? (ivaUSD * (pct / 100)) : (baseUSD * (pct / 100));

    const period = new Date().toISOString().slice(0, 7).replace('-', '');
    const corrNum = (retenciones.length + 1).toString().padStart(8, '0');
    const correlativoComprobante = `2026${period}${corrNum}`;

    const nueva = crearRetencion({
      tipo: tipoRet,
      fecha: new Date().toISOString().split('T')[0],
      correlativoComprobante,
      proveedorNombre,
      proveedorRif,
      nroFacturaOrigen,
      montoBaseUSD: baseUSD,
      montoIvaUSD: ivaUSD,
      porcentajeRetencion: pct,
      montoRetenidoUSD: retUSD,
      montoRetenidoBs: retUSD * tasaCambioBCV,
      division: activeDivision
    });

    setShowRetencionModal(false);
    setPreviewRet(nueva);
  };

  const handleExportarExcel = () => {
    addToast('Generando archivo Excel (.csv UTF-8) con el informe contable y operativo consolidado...', 'info');
    exportAllDataToExcelCSV({
      facturas,
      recibos,
      movimientosContables,
      reportesTecnicos,
      presupuestos,
      clientes
    });
    addToast('¡Descarga iniciada! Archivo Excel consolidado generado con éxito.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER INTEGRADO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
              <DollarSign size={14} />
              <span>SISTEMA INTEGRADO DE CONTABILIDAD, LIBROS, TRIBUTARIO Y REPORTES</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Módulo Contable Unificado — Tecno Elevatev (<span className="text-cyan-400">{activeDivision}</span>)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Registro de Movimientos, Libro Diario, Libro Mayor T-Accounts, Nómina & Prestaciones, Comprobantes de Retención SENIAT y Reportes Consolidados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportarExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition border border-slate-700 cursor-pointer shadow-md"
            >
              <Download size={15} />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Printer size={15} />
              <span>Imprimir Módulo</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVEGACIÓN INTERNA EN PESTAÑAS (LOS NÚCLEOS CONTABLES UNIFICADOS) */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          {[
            { id: 'MOVIMIENTOS', label: '1. Movimientos & Caja', icon: DollarSign },
            { id: 'FACTURACION', label: '2. Facturación SENIAT', icon: Receipt },
            { id: 'RECIBOS', label: '3. Recibos & Notas', icon: FileCheck2 },
            { id: 'LIBRO_DIARIO', label: '4. Libro Diario', icon: BookOpen },
            { id: 'LIBRO_MAYOR', label: '5. Libro Mayor', icon: BookMarked },
            { id: 'NOMINA', label: '6. Nómina & Prestaciones', icon: Users },
            { id: 'TRIBUTARIO', label: '7. Tributario SENIAT', icon: Landmark },
            { id: 'REPORTES', label: '8. Centro de Reportes', icon: BarChart3 }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as SubTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <IconComp size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SECCIÓN: MOVIMIENTOS & CAJA */}
      {/* ========================================================================= */}
      {subTab === 'MOVIMIENTOS' && (
        <div className="space-y-6">
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Total Ingresos ({activeDivision})</span>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">${totalIngresosUSD.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">Bs. {(totalIngresosUSD * tasaCambioBCV).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Total Egresos & Compras</span>
                <h3 className="text-2xl font-bold text-rose-400 mt-1">${totalEgresosUSD.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">Bs. {(totalEgresosUSD * tasaCambioBCV).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <TrendingDown size={24} />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Flujo Neto / Balance</span>
                <h3 className={`text-2xl font-bold mt-1 ${balanceUSD >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  ${balanceUSD.toFixed(2)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">Bs. {(balanceUSD * tasaCambioBCV).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Filtros y Botón Registrar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por concepto, comprobante o cliente..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="EGRESO">Egresos</option>
                <option value="COMPRA_INVENTARIO">Compras Repuestos</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 w-full md:w-auto"
            >
              <PlusCircle size={16} />
              <span>Registrar Movimiento Contable</span>
            </button>
          </div>

          {/* Tabla de Movimientos */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción / Tercero</th>
                    <th className="p-4">Comprobante</th>
                    <th className="p-4 text-right">Monto USD</th>
                    <th className="p-4 text-right">Monto Bs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No hay movimientos registrados en esta división.
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono text-xs text-slate-400">{m.fecha}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                            m.tipo === 'INGRESO' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : m.tipo === 'COMPRA_INVENTARIO'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">{m.categoria}</td>
                        <td className="p-4">
                          <div className="font-medium text-slate-200">{m.descripcion}</div>
                          {m.proveedorOCliente && (
                            <div className="text-xs text-slate-500 font-mono">{m.proveedorOCliente}</div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-cyan-400">{m.comprobanteReferencia || '-'}</td>
                        <td className={`p-4 text-right font-mono font-bold ${
                          m.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {m.tipo === 'INGRESO' ? '+' : '-'}${m.montoUSD.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-mono text-xs text-slate-400">
                          Bs. {m.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECCIÓN: LIBRO DIARIO CONTABLE */}
      {/* ========================================================================= */}
      {subTab === 'LIBRO_DIARIO' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen size={20} className="text-cyan-400" />
                  Libro Diario Contable (Asientos Cronológicos SENIAT / VEN-NIF)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro ordenado de transacciones debitadas y acreditadas en la divisa oficial y Bolívares.
                </p>
              </div>

              <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs rounded-xl font-bold">
                {asientosLibroDiario.length} Asientos Contables Generados
              </span>
            </div>

            <div className="space-y-6">
              {asientosLibroDiario.map((asiento) => (
                <div key={asiento.asientoNro} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-cyan-400">ASIENTO NRO: {asiento.asientoNro}</span>
                    <span className="text-slate-400">FECHA: {asiento.fecha}</span>
                  </div>

                  <div className="p-4 text-xs font-mono text-slate-300 border-b border-slate-800/60 bg-slate-900/30 font-bold">
                    CONCEPTO: <span className="text-white font-sans">{asiento.concepto}</span>
                  </div>

                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] border-b border-slate-850">
                      <tr>
                        <th className="p-3">Código Cuenta</th>
                        <th className="p-3">Nombre de Cuenta Contable</th>
                        <th className="p-3 text-right text-emerald-400">Debe USD</th>
                        <th className="p-3 text-right text-rose-400">Haber USD</th>
                        <th className="p-3 text-right text-slate-400">Debe Bs</th>
                        <th className="p-3 text-right text-slate-400">Haber Bs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {asiento.detalles.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-900/50">
                          <td className="p-3 text-cyan-400 font-bold">{d.cuentaCodigo}</td>
                          <td className="p-3 text-white font-sans">{d.cuentaNombre}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">
                            {d.debeUSD > 0 ? `$${d.debeUSD.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-400">
                            {d.haberUSD > 0 ? `$${d.haberUSD.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-400">
                            {d.debeBs > 0 ? `Bs. ${d.debeBs.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right text-slate-400">
                            {d.haberBs > 0 ? `Bs. ${d.haberBs.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECCIÓN: LIBRO MAYOR T-ACCOUNTS */}
      {/* ========================================================================= */}
      {subTab === 'LIBRO_MAYOR' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookMarked size={20} className="text-cyan-400" />
                  Libro Mayor Contable (Cuentas T y Saldos Acumulados)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidado por código de cuenta contable del Plan de Cuentas de Tecno Elevatev C.A.
                </p>
              </div>

              {/* Selector de cuenta */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Seleccionar Cuenta:</span>
                <select
                  value={selectedCuentaMayor}
                  onChange={(e) => setSelectedCuentaMayor(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs rounded-xl px-3 py-2 focus:border-cyan-500 font-bold"
                >
                  {cuentasMayorPlan.map(c => (
                    <option key={c.codigo} value={c.codigo}>
                      [{c.codigo}] {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vista detalle de la Cuenta Mayor seleccionada */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">CÓDIGO & CUENTA SELECCIONADA:</span>
                  <span className="text-lg font-extrabold text-cyan-400">
                    [{selectedCuentaMayor}] {cuentasMayorPlan.find(c => c.codigo === selectedCuentaMayor)?.nombre}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 uppercase text-[10px] block">SALDO ACTUAL ACUMULADO:</span>
                  <span className="text-xl font-bold text-emerald-400">${saldoAcumuladoUSD.toFixed(2)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Referencia Asiento</th>
                      <th className="p-3">Concepto Contable</th>
                      <th className="p-3 text-right text-emerald-400">Debe USD</th>
                      <th className="p-3 text-right text-rose-400">Haber USD</th>
                      <th className="p-3 text-right text-cyan-400">Saldo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {mayorMovimientos.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="p-3 text-slate-400">{m.fecha}</td>
                        <td className="p-3 text-cyan-400 font-bold">{m.referencia}</td>
                        <td className="p-3 font-sans text-white">{m.concepto}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">
                          {m.debeUSD > 0 ? `$${m.debeUSD.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 text-right text-rose-400 font-bold">
                          {m.haberUSD > 0 ? `$${m.haberUSD.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 text-right text-cyan-400 font-bold">
                          ${m.saldoUSD.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECCIÓN: FACTURACIÓN SENIAT */}
      {/* ========================================================================= */}
      {subTab === 'FACTURACION' && (
        <FacturacionTab />
      )}

      {/* ========================================================================= */}
      {/* 3. SECCIÓN: RECIBOS & NOTAS DE ENTREGA */}
      {/* ========================================================================= */}
      {subTab === 'RECIBOS' && (
        <RecibosNotasTab />
      )}

      {/* ========================================================================= */}
      {/* 4. SECCIÓN: NÓMINA & PRESTACIONES */}
      {/* ========================================================================= */}
      {subTab === 'NOMINA' && (
        <NominaTab />
      )}

      {/* ========================================================================= */}
      {/* 5. SECCIÓN: TRIBUTARIO SENIAT & RETENCIONES */}
      {/* ========================================================================= */}
      {subTab === 'TRIBUTARIO' && (
        <TributarioTab />
      )}

      {/* ========================================================================= */}
      {/* 5. SECCIÓN: CENTRO DE REPORTES & ANALÍTICA */}
      {/* ========================================================================= */}
      {subTab === 'REPORTES' && (
        <div className="space-y-6">
          {/* Selectores de Tipo de Reporte */}
          <div className="flex flex-wrap bg-slate-900/80 p-2 rounded-2xl border border-slate-800 gap-2">
            {[
              { id: 'RESUMEN_EJECUTIVO', label: 'Resumen Ejecutivo' },
              { id: 'FACTURACION_VS_PRESUPUESTO', label: 'Facturación vs Presupuestos' },
              { id: 'MANTENIMIENTO_EQUIPOS', label: 'Parque de Ascensores' },
              { id: 'TRIBUTARIO_SENIAT', label: 'Reporte Tributario SENIAT' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setTipoReporte(r.id as any)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                  tipoReporte === r.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {tipoReporte === 'RESUMEN_EJECUTIVO' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-mono text-slate-400 uppercase">Facturación Emitida</span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  ${facturas.filter(f => f.division === activeDivision).reduce((a, b) => a + b.totalUSD, 0).toFixed(2)}
                </h3>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-mono text-slate-400 uppercase">Total Cobrado</span>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                  ${facturas.filter(f => f.division === activeDivision && f.estado === 'PAGADA').reduce((a, b) => a + b.totalUSD, 0).toFixed(2)}
                </h3>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-mono text-slate-400 uppercase">Presupuestado Activo</span>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">
                  ${presupuestos.filter(p => p.division === activeDivision).reduce((a, b) => a + b.totalUSD, 0).toFixed(2)}
                </h3>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-mono text-slate-400 uppercase">Clientes Condominios</span>
                <h3 className="text-2xl font-bold text-cyan-400 mt-1">
                  {clientes.filter(c => c.division === activeDivision).length} Registrados
                </h3>
              </div>
            </div>
          )}

          {tipoReporte === 'TRIBUTARIO_SENIAT' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Acumulado de Retenciones IVA e ISLR</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span>Total Retenido IVA USD:</span>
                  <span className="font-bold text-emerald-400">
                    ${retenciones.filter(r => r.division === activeDivision).reduce((a, b) => a + b.montoRetenidoUSD, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Retenido Bolívares (Tasa Oficial BCV {tasaCambioBCV}):</span>
                  <span className="font-bold text-cyan-400">
                    Bs. {(retenciones.filter(r => r.division === activeDivision).reduce((a, b) => a + b.montoRetenidoUSD, 0) * tasaCambioBCV).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL AGREGAR MOVIMIENTO */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <DollarSign size={20} className="text-cyan-400" />
                Registrar Movimiento Contable
              </h3>

              <form onSubmit={handleSubmitMovimiento} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo Movimiento</label>
                    <select 
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500"
                    >
                      <option value="INGRESO">INGRESO / COBRO</option>
                      <option value="EGRESO">EGRESO / GASTO</option>
                      <option value="COMPRA_INVENTARIO">COMPRA DE REPUESTOS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Monto ($ USD)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={montoUSD}
                      onChange={(e) => setMontoUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-cyan-400 font-mono font-bold focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Descripción</label>
                  <input 
                    type="text"
                    required
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Pago de Mantenimiento Preventivo Jul 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Comprobante / Nro Ref</label>
                    <input 
                      type="text"
                      value={comprobante}
                      onChange={(e) => setComprobante(e.target.value)}
                      placeholder="Nro Transferencia / Cheque"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cliente / Proveedor</label>
                    <input 
                      type="text"
                      value={tercero}
                      onChange={(e) => setTercero(e.target.value)}
                      placeholder="Nombre del tercero"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded text-sm">Guardar Movimiento</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR RETENCIÓN TRIBUTARIA */}
      <AnimatePresence>
        {showRetencionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Landmark size={20} className="text-cyan-400" />
                Generar Comprobante de Retención SENIAT
              </h3>

              <form onSubmit={handleSubmitRetencion} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Impuesto</label>
                    <select 
                      value={tipoRet}
                      onChange={(e) => setTipoRet(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500"
                    >
                      <option value="IVA">RETENCIÓN IVA</option>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 font-mono"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Base Imponible ($)</label>
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowRetencionModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded text-sm">Generar Comprobante</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VISTA PREVIA IMPRESIÓN COMPROBANTE OFICIAL SENIAT */}
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
