import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cliente, EquipoAscensor } from '../types';
import { 
  Building2, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  ChevronRight,
  ShieldAlert,
  Wrench,
  Clock,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SimuladorTemporizadorAscensor from './SimuladorTemporizadorAscensor';

export default function ClientesEquiposTab() {
  const { 
    clientes, 
    agregarCliente, 
    editarCliente, 
    eliminarCliente, 
    archivarCliente,
    desarchivarCliente,
    agregarEquipoACliente, 
    editarEquipoDeCliente, 
    eliminarEquipoDeCliente, 
    activeDivision, 
    addToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFacturacion, setFilterFacturacion] = useState<'TODOS' | 'FACTURA_FISCAL' | 'NOTA_ENTREGA' | 'AMBAS'>('TODOS');
  const [showArchivados, setShowArchivados] = useState(false);
  
  // Modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<EquipoAscensor | null>(null);

  // Simulador & Temporizador de Ascensores (Demostración)
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [activeSimulatorData, setActiveSimulatorData] = useState<{ equipo?: EquipoAscensor; clienteNombre?: string } | null>(null);

  // Form Cliente
  const [rif, setRif] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [personaContacto, setPersonaContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipoFacturacionPreferida, setTipoFacturacionPreferida] = useState<'FACTURA_FISCAL' | 'NOTA_ENTREGA' | 'AMBAS'>('FACTURA_FISCAL');

  // Form Equipo (Ascensor)
  const [nombreEquipo, setNombreEquipo] = useState('Ascensor Principal Torre A');
  const [marca, setMarca] = useState('Schindler');
  const [modelo, setModelo] = useState('Smart 001 VVVF');
  const [capacidadKg, setCapacidadKg] = useState('800');
  const [personas, setPersonas] = useState('10');
  const [paradas, setParadas] = useState('14');
  const [tipoManiobra, setTipoManiobra] = useState('Frecuencia Variable VVVF');
  const [serialFabrica, setSerialFabrica] = useState('');
  const [estadoTecnico, setEstadoTecnico] = useState<'OPERATIVO' | 'EN_MANTENIMIENTO' | 'REPARACION_URGENTE' | 'FUERA_DE_SERVICIO'>('OPERATIVO');
  const [observaciones, setObservaciones] = useState('');

  // Filtrado (respetando estado ARCHIVADO soft delete)
  const clientesFiltrados = clientes.filter(c => {
    if (!showArchivados && c.estado === 'ARCHIVADO') return false;
    if (showArchivados && c.estado !== 'ARCHIVADO') return false;

    const matchDiv = c.division === activeDivision;
    const matchFact = filterFacturacion === 'TODOS' || c.tipoFacturacionPreferida === filterFacturacion;
    const matchSearch = 
      c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.personaContacto.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDiv && matchFact && matchSearch;
  });

  const handleOpenNewCliente = () => {
    setEditingCliente(null);
    setRif('J-');
    setRazonSocial('');
    setPersonaContacto('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setTipoFacturacionPreferida('FACTURA_FISCAL');
    setShowClienteModal(true);
  };

  const handleOpenEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setRif(c.rif);
    setRazonSocial(c.razonSocial);
    setPersonaContacto(c.personaContacto);
    setTelefono(c.telefono);
    setEmail(c.email);
    setDireccion(c.direccion);
    setTipoFacturacionPreferida(c.tipoFacturacionPreferida);
    setShowClienteModal(true);
  };

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCliente) {
      editarCliente({
        ...editingCliente,
        rif,
        razonSocial,
        personaContacto,
        telefono,
        email,
        direccion,
        tipoFacturacionPreferida
      });
    } else {
      agregarCliente({
        rif,
        razonSocial,
        personaContacto,
        telefono,
        email,
        direccion,
        tipoFacturacionPreferida,
        equipos: [],
        division: activeDivision
      });
    }
    setShowClienteModal(false);
  };

  // Guardar Equipo (Ascensor)
  const handleOpenNewEquipo = (c: Cliente) => {
    setSelectedCliente(c);
    setEditingEquipo(null);
    setNombreEquipo(`Ascensor Principal - ${c.razonSocial.split(' ')[0]}`);
    setMarca('Schindler');
    setModelo('Smart 001');
    setCapacidadKg('800');
    setPersonas('10');
    setParadas('12');
    setTipoManiobra('Frecuencia Variable VVVF');
    setSerialFabrica(`SCH-${Math.floor(Math.random() * 90000 + 10000)}`);
    setEstadoTecnico('OPERATIVO');
    setObservaciones('En inspección periódica quincenal.');
    setShowEquipoModal(true);
  };

  const handleOpenEditEquipo = (c: Cliente, eq: EquipoAscensor) => {
    setSelectedCliente(c);
    setEditingEquipo(eq);
    setNombreEquipo(eq.nombreEquipo);
    setMarca(eq.marca);
    setModelo(eq.modelo);
    setCapacidadKg(eq.capacidadKg.toString());
    setPersonas(eq.personas.toString());
    setParadas(eq.paradas.toString());
    setTipoManiobra(eq.tipoManiobra);
    setSerialFabrica(eq.serialFabrica);
    setEstadoTecnico(eq.estadoTecnico);
    setObservaciones(eq.observaciones || '');
    setShowEquipoModal(true);
  };

  const handleSaveEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;

    const today = new Date().toISOString().split('T')[0];

    if (editingEquipo) {
      editarEquipoDeCliente(selectedCliente.id, {
        ...editingEquipo,
        nombreEquipo,
        marca,
        modelo,
        capacidadKg: parseInt(capacidadKg) || 800,
        personas: parseInt(personas) || 10,
        paradas: parseInt(paradas) || 10,
        tipoManiobra,
        serialFabrica,
        estadoTecnico,
        ultimoMantenimiento: today,
        proximoMantenimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        observaciones
      });
    } else {
      agregarEquipoACliente(selectedCliente.id, {
        nombreEquipo,
        marca,
        modelo,
        capacidadKg: parseInt(capacidadKg) || 800,
        personas: parseInt(personas) || 10,
        paradas: parseInt(paradas) || 10,
        tipoManiobra,
        serialFabrica,
        estadoTecnico,
        ultimoMantenimiento: today,
        proximoMantenimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        observaciones
      });
    }

    setShowEquipoModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Building2 size={14} />
            <span>MÓDULO 5: CLIENTES Y EQUIPOS INSTALADOS</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Directorio de Clientes & PARQUE DE ASCENSORES — <span className="text-cyan-400">{activeDivision}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de edificación/condominios, tipo de facturación preferida y registro técnico de ascensores por cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveSimulatorData({ clienteNombre: 'ITA ASCENSORES (Ascensores Barbaroza)' });
              setShowSimulatorModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-amber-500/20 cursor-pointer font-mono text-xs"
          >
            <Clock size={16} />
            <span>⏱️ Demostración Temporizador</span>
          </button>

          <button
            onClick={handleOpenNewCliente}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition shadow-lg shadow-cyan-500/20 cursor-pointer text-xs"
          >
            <PlusCircle size={18} />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtro por Tipo de Comprobante */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, RIF o contacto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            {(['TODOS', 'FACTURA_FISCAL', 'NOTA_ENTREGA', 'AMBAS'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterFacturacion(t)}
                className={`px-3 py-1.5 rounded-md transition font-mono ${
                  filterFacturacion === t ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowArchivados(!showArchivados)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              showArchivados 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Ver clientes archivados (Soft Delete)"
          >
            <Archive size={13} />
            <span>{showArchivados ? 'Archivados' : 'Papelera'}</span>
          </button>
        </div>
      </div>

      {/* Listado de Clientes con Ficha de Ascensores */}
      <div className="grid grid-cols-1 gap-6">
        {clientesFiltrados.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div key={c.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              {/* Encabezado del Cliente */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white tracking-tight">{c.razonSocial}</h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                      {c.rif}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono">
                      Prefiere: {c.tipoFacturacionPreferida}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Contacto: <strong className="text-slate-200">{c.personaContacto}</strong> ({c.telefono} | {c.email})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.direccion}</p>
                </div>

                <div className="flex items-center gap-2">
                  {c.estado === 'ARCHIVADO' ? (
                    <button
                      onClick={() => desarchivarCliente(c.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
                      title="Reactivar Cliente"
                    >
                      <ArchiveRestore size={15} />
                      <span>Reactivar</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenNewEquipo(c)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle size={15} />
                        <span>Agregar Ascensor</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditCliente(c)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => archivarCliente(c.id)}
                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
                        title="Archivar Cliente (Soft Delete)"
                      >
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => eliminarCliente(c.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title="Eliminar Cliente Definitivamente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Fichas de Equipos Ascensores Registrados en este Cliente */}
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-400" />
                  Equipos / Ascensores Asignados ({c.equipos.length})
                </h4>

                {c.equipos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    No hay equipos de elevación registrados para este cliente. Haga clic en "Agregar Ascensor".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {c.equipos.map((eq) => (
                      <div key={eq.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative group">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-white text-sm">{eq.nombreEquipo}</h5>
                            <p className="text-xs font-mono text-cyan-400">{eq.marca} {eq.modelo}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            eq.estadoTecnico === 'OPERATIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            eq.estadoTecnico === 'REPARACION_URGENTE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {eq.estadoTecnico}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 border-t border-b border-slate-900 py-2">
                          <div>Paradas: <span className="text-slate-200 font-bold">{eq.paradas} pisos</span></div>
                          <div>Capacidad: <span className="text-slate-200 font-bold">{eq.capacidadKg} kg</span></div>
                          <div>Maniobra: <span className="text-slate-200 truncate block">{eq.tipoManiobra}</span></div>
                          <div>Serial: <span className="text-slate-200">{eq.serialFabrica}</span></div>
                        </div>

                        {eq.observaciones && (
                          <p className="text-[11px] text-slate-400 italic truncate">{eq.observaciones}</p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => {
                              setActiveSimulatorData({ equipo: eq, clienteNombre: c.razonSocial });
                              setShowSimulatorModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Probar Temporizador y Simulación de Ascensor"
                          >
                            <Clock size={12} />
                            <span>⏱️ Temporizador</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditEquipo(c, eq)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                              title="Editar Ascensor"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => eliminarEquipoDeCliente(c.id, eq.id)}
                              className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              title="Eliminar Ascensor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      <AnimatePresence>
        {showClienteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-cyan-400" />
                  {editingCliente ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <button
                  onClick={() => setShowClienteModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCliente} className="space-y-3 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">RIF / Identificación</label>
                    <input 
                      type="text"
                      required
                      value={rif}
                      onChange={(e) => setRif(e.target.value)}
                      placeholder="J-30129481-2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Razón Social / Condominio</label>
                    <input 
                      type="text"
                      required
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej: Residencias Altamira Plaza"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Persona de Contacto</label>
                    <input 
                      type="text"
                      required
                      value={personaContacto}
                      onChange={(e) => setPersonaContacto(e.target.value)}
                      placeholder="Dra. Carmen Mendoza"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Teléfono</label>
                    <input 
                      type="text"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="0414-0000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Correo Electrónico</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="condominio@empresa.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Dirección Completa del Edificio</label>
                  <textarea 
                    rows={2}
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Av. San Juan Bosco con 3ra Transversal, Caracas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Facturación Preferida</label>
                  <select 
                    value={tipoFacturacionPreferida}
                    onChange={(e) => setTipoFacturacionPreferida(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FACTURA_FISCAL">FACTURA FISCAL CON IVA</option>
                    <option value="NOTA_ENTREGA">NOTA DE ENTREGA / VALE</option>
                    <option value="AMBAS">AMBAS SEGÚN SOLICITUD</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowClienteModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AGREGAR / EDITAR ASCENSOR */}
      <AnimatePresence>
        {showEquipoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Wrench size={20} className="text-cyan-400" />
                  {editingEquipo ? 'Editar Ascensor' : `Nuevo Ascensor en ${selectedCliente?.razonSocial}`}
                </h3>
                <button
                  onClick={() => setShowEquipoModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEquipo} className="space-y-3 overflow-y-auto pr-1 flex-1">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Nombre / Identificación del Equipo</label>
                  <input 
                    type="text"
                    required
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                    placeholder="Ej: Ascensor Subida Principal Torre A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Marca</label>
                    <input 
                      type="text"
                      required
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      placeholder="Schindler, Otis, Kone, Thyssen"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Modelo</label>
                    <input 
                      type="text"
                      required
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Smart 001 / VVVF"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Capacidad (kg)</label>
                    <input 
                      type="number"
                      required
                      value={capacidadKg}
                      onChange={(e) => setCapacidadKg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Personas</label>
                    <input 
                      type="number"
                      required
                      value={personas}
                      onChange={(e) => setPersonas(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Paradas / Pisos</label>
                    <input 
                      type="number"
                      required
                      value={paradas}
                      onChange={(e) => setParadas(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white text-center font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Tipo de Maniobra</label>
                  <input 
                    type="text"
                    required
                    value={tipoManiobra}
                    onChange={(e) => setTipoManiobra(e.target.value)}
                    placeholder="Ej: Frecuencia Variable VVVF"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Serial de Fábrica</label>
                    <input 
                      type="text"
                      value={serialFabrica}
                      onChange={(e) => setSerialFabrica(e.target.value)}
                      placeholder="SCH-99201"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Estado Técnico</label>
                    <select 
                      value={estadoTecnico}
                      onChange={(e) => setEstadoTecnico(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="OPERATIVO">OPERATIVO 100%</option>
                      <option value="EN_MANTENIMIENTO">EN MANTENIMIENTO</option>
                      <option value="REPARACION_URGENTE">REPARACIÓN URGENTE</option>
                      <option value="FUERA_DE_SERVICIO">FUERA DE SERVICIO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Observaciones Técnicas</label>
                  <textarea 
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Estado de cables, patines, botoneras..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEquipoModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    Guardar Ascensor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal de Simulador & Temporizador de Ascensores */}
        {showSimulatorModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl"
            >
              <SimuladorTemporizadorAscensor 
                equipo={activeSimulatorData?.equipo}
                clienteNombre={activeSimulatorData?.clienteNombre || 'ITA ASCENSORES'}
                onClose={() => setShowSimulatorModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
