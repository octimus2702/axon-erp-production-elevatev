import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Empleado, PrestamoEmpleado } from '../types';
import { 
  Users, 
  PlusCircle, 
  DollarSign, 
  Search, 
  Calendar, 
  Award, 
  ShieldCheck, 
  CreditCard, 
  FileCheck, 
  CheckCircle2, 
  UserPlus,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NominaTab() {
  const { 
    empleados, 
    agregarEmpleado, 
    editarEmpleado, 
    prestamos, 
    solicitarPrestamo, 
    nominasProcesadas, 
    generarNominaPeriodo, 
    tasaCambioBCV, 
    addToast 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'EMPLEADOS' | 'PROCESAR_NOMINA' | 'PRESTAMOS' | 'PRESTACIONES'>('PROCESAR_NOMINA');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Nuevo Empleado
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('Técnico de Mantenimiento de Ascensores');
  const [departamento, setDepartamento] = useState('MANTENIMIENTO');
  const [fechaIngreso, setFechaIngreso] = useState('2023-01-15');
  const [sueldoBaseUSD, setSueldoBaseUSD] = useState('450');
  const [cestaTicketUSD, setCestaTicketUSD] = useState('40');

  // Form Procesar Nómina
  const [periodoNomina, setPeriodoNomina] = useState('Segunda Quincena Julio 2026');
  const [fechaPagoNomina, setFechaPagoNomina] = useState(new Date().toISOString().split('T')[0]);
  const [desgloses, setDesgloses] = useState<{ [empId: string]: { bonificacion: number; descuentoPrestamo: number } }>(() => {
    const init: any = {};
    empleados.forEach(e => {
      const pActivo = prestamos.find(p => p.empleadoId === e.id && p.estado === 'PENDIENTE');
      init[e.id] = {
        bonificacion: 0,
        descuentoPrestamo: pActivo ? pActivo.montoCuotaUSD : 0
      };
    });
    return init;
  });

  // Form Préstamo
  const [showPrestamoModal, setShowPrestamoModal] = useState(false);
  const [prestamoEmpId, setPrestamoEmpId] = useState(empleados[0]?.id || '');
  const [montoPrestamoUSD, setMontoPrestamoUSD] = useState('100');
  const [cuotasTotales, setCuotasTotales] = useState('4');
  const [motivoPrestamo, setMotivoPrestamo] = useState('Adelanto quincenal para repuestos personales / emergencia');

  const handleOpenNewEmp = () => {
    setEditingEmp(null);
    setCedula('V-');
    setNombre('');
    setCargo('Técnico especialista de ascensores');
    setSueldoBaseUSD('450');
    setCestaTicketUSD('40');
    setShowEmpModal(true);
  };

  const handleSaveEmp = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      editarEmpleado({
        ...editingEmp,
        cedula,
        nombre,
        cargo,
        departamento,
        sueldoBaseUSD: parseFloat(sueldoBaseUSD) || 400,
        cestaTicketUSD: parseFloat(cestaTicketUSD) || 40
      });
    } else {
      agregarEmpleado({
        cedula,
        nombre,
        cargo,
        departamento,
        fechaIngreso,
        sueldoBaseUSD: parseFloat(sueldoBaseUSD) || 400,
        cestaTicketUSD: parseFloat(cestaTicketUSD) || 40,
        estado: 'ACTIVO'
      });
    }
    setShowEmpModal(false);
  };

  const handleGenerarNomina = () => {
    const arr = Object.keys(desgloses).map(empId => ({
      empleadoId: empId,
      bonificacion: desgloses[empId]?.bonificacion || 0,
      descuentoPrestamo: desgloses[empId]?.descuentoPrestamo || 0
    }));

    generarNominaPeriodo(periodoNomina, fechaPagoNomina, arr);
    addToast(`Nómina quincenal ${periodoNomina} procesada y registrada en contabilidad`, 'success');
  };

  const handleSavePrestamo = (e: React.FormEvent) => {
    e.preventDefault();
    const empObj = empleados.find(e => e.id === prestamoEmpId);
    if (!empObj) return;

    const monto = parseFloat(montoPrestamoUSD) || 0;
    const cuotas = parseInt(cuotasTotales) || 1;

    solicitarPrestamo({
      fecha: new Date().toISOString().split('T')[0],
      empleadoId: empObj.id,
      empleadoNombre: empObj.nombre,
      montoUSD: monto,
      cuotasTotales: cuotas,
      montoCuotaUSD: monto / cuotas,
      motivo: motivoPrestamo
    });

    setShowPrestamoModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Users size={14} />
            <span>MÓDULO 6: GESTIÓN DE NÓMINA Y PERSONAL</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Nómina, Cesta Ticket & Prestaciones — Tecno Elevatev C.A.
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Control de personal de ascensores, liquidación quincenal, cesta ticket, préstamos/adelantos y acumulado de prestaciones sociales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrestamoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition border border-slate-700 cursor-pointer"
          >
            <CreditCard size={16} />
            <span>Otorgar Préstamo</span>
          </button>
          <button
            onClick={handleOpenNewEmp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <UserPlus size={16} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Sub-Navegación de Nómina */}
      <div className="flex border-b border-slate-800 gap-2">
        {(
          [
            { id: 'PROCESAR_NOMINA', label: 'Procesar Nómina Quincenal' },
            { id: 'EMPLEADOS', label: 'Directorio de Empleados' },
            { id: 'PRESTAMOS', label: 'Préstamos y Adelantos' },
            { id: 'PRESTACIONES', label: 'Vacaciones y Prestaciones' }
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-5 py-3 text-xs font-mono font-bold transition border-b-2 cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROCESAR NÓMINA */}
      {activeSubTab === 'PROCESAR_NOMINA' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Periodo a Liquidar</label>
                <input 
                  type="text"
                  value={periodoNomina}
                  onChange={(e) => setPeriodoNomina(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Fecha de Pago</label>
                <input 
                  type="date"
                  value={fechaPagoNomina}
                  onChange={(e) => setFechaPagoNomina(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="p-3">Empleado</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3 text-right">Sueldo Quincenal ($)</th>
                    <th className="p-3 text-right">Cesta Ticket ($)</th>
                    <th className="p-3 text-center">Bono Extra ($)</th>
                    <th className="p-3 text-center">Dsc. Préstamo ($)</th>
                    <th className="p-3 text-right">Neto Pagar ($)</th>
                    <th className="p-3 text-right">Neto Pagar (Bs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {empleados.map((emp) => {
                    const sueldoQ = emp.sueldoBaseUSD / 2;
                    const cestaQ = emp.cestaTicketUSD / 2;
                    const bono = desgloses[emp.id]?.bonificacion || 0;
                    const desc = desgloses[emp.id]?.descuentoPrestamo || 0;
                    const netoUSD = sueldoQ + cestaQ + bono - desc;
                    const netoBs = netoUSD * tasaCambioBCV;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{emp.nombre}</div>
                          <div className="font-mono text-slate-500 text-[10px]">{emp.cedula}</div>
                        </td>
                        <td className="p-3 text-slate-400">{emp.cargo}</td>
                        <td className="p-3 text-right font-mono">${sueldoQ.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-amber-400">${cestaQ.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <input 
                            type="number"
                            step="0.01"
                            value={bono}
                            onChange={(e) => setDesgloses({
                              ...desgloses,
                              [emp.id]: { ...desgloses[emp.id], bonificacion: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-20 bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="number"
                            step="0.01"
                            value={desc}
                            onChange={(e) => setDesgloses({
                              ...desgloses,
                              [emp.id]: { ...desgloses[emp.id], descuentoPrestamo: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-20 bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-rose-400 focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-cyan-400">${netoUSD.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-slate-400">Bs. {netoBs.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerarNomina}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                <span>Procesar y Pagar Nómina Quincenal</span>
              </button>
            </div>
          </div>

          {/* Historial de Nóminas Procesadas */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Historial Reciente de Nóminas Procesadas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="p-3">Periodo</th>
                    <th className="p-3">Fecha Pago</th>
                    <th className="p-3">Empleado</th>
                    <th className="p-3 text-right">Neto Pagar USD</th>
                    <th className="p-3 text-right">Neto Pagar Bs</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {nominasProcesadas.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-slate-500">Sin historial de nóminas.</td></tr>
                  ) : (
                    nominasProcesadas.map((nom) => (
                      <tr key={nom.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{nom.periodo}</td>
                        <td className="p-3 font-mono text-slate-400">{nom.fechaPago}</td>
                        <td className="p-3 font-medium text-white">{nom.empleadoNombre}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">${nom.netoAPagarUSD.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-slate-400">Bs. {nom.netoAPagarBs.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                            PAGADA
                          </span>
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

      {/* TAB 2: DIRECTORIO EMPLEADOS */}
      {activeSubTab === 'EMPLEADOS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Cédula</th>
                  <th className="p-4">Empleado / Nombre</th>
                  <th className="p-4">Cargo</th>
                  <th className="p-4">Fecha Ingreso</th>
                  <th className="p-4 text-right">Sueldo Base USD</th>
                  <th className="p-4 text-right">Cesta Ticket USD</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {empleados.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-cyan-400">{e.cedula}</td>
                    <td className="p-4 font-medium text-white">{e.nombre}</td>
                    <td className="p-4 text-slate-300">{e.cargo}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{e.fechaIngreso}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">${e.sueldoBaseUSD.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-amber-400">${e.cestaTicketUSD.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {e.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRÉSTAMOS */}
      {activeSubTab === 'PRESTAMOS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">ID / Fecha</th>
                  <th className="p-4">Empleado</th>
                  <th className="p-4">Motivo</th>
                  <th className="p-4 text-right">Monto Total USD</th>
                  <th className="p-4 text-center">Cuotas Totales</th>
                  <th className="p-4 text-center">Cuotas Pagadas</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {prestamos.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Sin registro de préstamos.</td></tr>
                ) : (
                  prestamos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono text-xs text-slate-400">{p.id} ({p.fecha})</td>
                      <td className="p-4 font-medium text-white">{p.empleadoNombre}</td>
                      <td className="p-4 text-xs text-slate-300">{p.motivo}</td>
                      <td className="p-4 text-right font-mono font-bold text-amber-400">${p.montoUSD.toFixed(2)}</td>
                      <td className="p-4 text-center font-mono">{p.cuotasTotales}</td>
                      <td className="p-4 text-center font-mono font-bold text-cyan-400">{p.cuotasPagadas}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          p.estado === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRESTACIONES Y VACACIONES */}
      {activeSubTab === 'PRESTACIONES' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-lg">Cálculo de Prestaciones Sociales Acomuladas (LOTTT)</h3>
          <p className="text-xs text-slate-400">
            Estimado acumulado por empleado según la Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT).
          </p>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase">
                <tr>
                  <th className="p-3">Empleado</th>
                  <th className="p-3">Fecha Ingreso</th>
                  <th className="p-3 text-right">Sueldo Mensual USD</th>
                  <th className="p-3 text-center">Años de Servicio</th>
                  <th className="p-3 text-right">Días Acumulados LOTTT</th>
                  <th className="p-3 text-right">Prestaciones Acumuladas USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {empleados.map((emp) => {
                  const antAnos = Math.max(1, new Date().getFullYear() - parseInt(emp.fechaIngreso.split('-')[0]));
                  const diasAcumulados = antAnos * 30; // 30 días por año estimado LOTTT
                  const diarioUSD = emp.sueldoBaseUSD / 30;
                  const prestacionesEstimadasUSD = diasAcumulados * diarioUSD;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{emp.nombre}</td>
                      <td className="p-3 font-mono text-slate-400">{emp.fechaIngreso}</td>
                      <td className="p-3 text-right font-mono">${emp.sueldoBaseUSD.toFixed(2)}</td>
                      <td className="p-3 text-center font-mono font-bold text-cyan-400">{antAnos} años</td>
                      <td className="p-3 text-right font-mono">{diasAcumulados} días</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">${prestacionesEstimadasUSD.toFixed(2)} USD</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR EMPLEADO */}
      <AnimatePresence>
        {showEmpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
            >
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Registrar Empleado</h3>
              <form onSubmit={handleSaveEmp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cédula</label>
                    <input 
                      type="text" 
                      required 
                      value={cedula} 
                      onChange={(e) => setCedula(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      required 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cargo Técnico</label>
                  <input 
                    type="text" 
                    required 
                    value={cargo} 
                    onChange={(e) => setCargo(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Sueldo Base ($ Mensual)</label>
                    <input 
                      type="number" 
                      required 
                      value={sueldoBaseUSD} 
                      onChange={(e) => setSueldoBaseUSD(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-cyan-400 font-mono font-bold focus:border-cyan-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cesta Ticket ($)</label>
                    <input 
                      type="number" 
                      required 
                      value={cestaTicketUSD} 
                      onChange={(e) => setCestaTicketUSD(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-amber-400 font-mono font-bold focus:border-cyan-500" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowEmpModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded text-sm">Guardar Empleado</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SOLICITAR PRÉSTAMO */}
      <AnimatePresence>
        {showPrestamoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
            >
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Otorgar Préstamo a Empleado</h3>
              <form onSubmit={handleSavePrestamo} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Empleado Beneficiario</label>
                  <select 
                    value={prestamoEmpId}
                    onChange={(e) => setPrestamoEmpId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500"
                  >
                    {empleados.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre} ({e.cargo})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Monto en USD ($)</label>
                    <input 
                      type="number"
                      required
                      value={montoPrestamoUSD}
                      onChange={(e) => setMontoPrestamoUSD(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-cyan-400 font-mono font-bold focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Cuotas Quincenales</label>
                    <input 
                      type="number"
                      required
                      value={cuotasTotales}
                      onChange={(e) => setCuotasTotales(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white font-mono focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Motivo / Justificación</label>
                  <input 
                    type="text"
                    required
                    value={motivoPrestamo}
                    onChange={(e) => setMotivoPrestamo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-sm text-white focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowPrestamoModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-sm">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded text-sm">Otorgar Préstamo</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
