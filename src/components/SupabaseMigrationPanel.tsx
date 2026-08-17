import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Database, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  RefreshCw, 
  Save, 
  ExternalLink, 
  Server, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Layers, 
  HardDrive, 
  UploadCloud, 
  FileCode, 
  Eye, 
  EyeOff, 
  Sliders, 
  FileSpreadsheet,
  Building2,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getStoredSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  migrateAllDataToSupabase, 
  pullAllDataFromSupabase,
  SUPABASE_SQL_INIT_SCHEMA,
  isSupabaseConfigured
} from '../services/supabaseClient';

export default function SupabaseMigrationPanel() {
  const { 
    clientes, 
    products, 
    presupuestos, 
    facturas, 
    reportesTecnicos, 
    recibos, 
    movimientosContables,
    solicitudesClientes = [],
    empresaActiva, 
    addToast 
  } = useApp();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesFound?: string[]; bucketOk?: boolean } | null>(null);
  
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  // Estados de Migración
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<Array<{ tabla: string; procesados: number; total: number; estado: 'PROCESANDO' | 'OK' | 'ERROR'; errorMsg?: string }>>([]);
  const [migrationSummary, setMigrationSummary] = useState<Record<string, { total: number; insertados: number; error?: string }> | null>(null);

  // Selección de tablas a migrar
  const [selectedTables, setSelectedTables] = useState({
    clientes: true,
    productos: true,
    presupuestos: true,
    reportesTecnicos: true,
    facturas: true,
    solicitudesClientes: true
  });

  // Estado de descarga (Pull)
  const [isPulling, setIsPulling] = useState(false);

  // Cargar credenciales almacenadas al iniciar
  useEffect(() => {
    const creds = getStoredSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseAnonKey(creds.anonKey);
    if (creds.url && creds.anonKey) {
      handleTestConnection(creds.url, creds.anonKey, false);
    }
  }, []);

  const handleSaveCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      addToast('Por favor introduce la URL y la Anon Key de Supabase', 'warning');
      return;
    }
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    addToast('Credenciales de Supabase guardadas localmente', 'success');
    handleTestConnection(supabaseUrl, supabaseAnonKey, true);
  };

  const handleTestConnection = async (url?: string, key?: string, showToast = true) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (url && key) {
        saveSupabaseCredentials(url, key);
      }
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (showToast) {
        if (res.success) {
          addToast('¡Conectado exitosamente con Supabase PostgreSQL!', 'success');
        } else {
          addToast(`Error al conectar con Supabase: ${res.message}`, 'error');
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error desconocido al probar conexión'
      });
      if (showToast) addToast(`Fallo de conexión: ${err.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_INIT_SCHEMA);
    setCopiedSql(true);
    addToast('📋 Script SQL copiado al portapapeles. Pégalo en el SQL Editor de Supabase.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_INIT_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `axon_supabase_schema_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Archivo .sql descargado', 'success');
  };

  const handleRunMigration = async () => {
    if (!isSupabaseConfigured()) {
      addToast('Debes configurar y guardar la URL y la Anon Key de Supabase primero.', 'warning');
      return;
    }

    setIsMigrating(true);
    setMigrationLogs([]);
    setMigrationSummary(null);

    try {
      const payloadToMigrate: any = {};
      if (selectedTables.clientes) payloadToMigrate.clientes = clientes;
      if (selectedTables.productos) payloadToMigrate.productos = products;
      if (selectedTables.presupuestos) payloadToMigrate.presupuestos = presupuestos;
      if (selectedTables.reportesTecnicos) payloadToMigrate.reportesTecnicos = reportesTecnicos;
      if (selectedTables.facturas) payloadToMigrate.facturas = facturas;
      if (selectedTables.solicitudesClientes) payloadToMigrate.solicitudesClientes = solicitudesClientes;

      const result = await migrateAllDataToSupabase(payloadToMigrate, (tabla, procesados, total, estado, errorMsg) => {
        setMigrationLogs(prev => {
          const index = prev.findIndex(item => item.tabla === tabla);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { tabla, procesados, total, estado, errorMsg };
            return updated;
          }
          return [...prev, { tabla, procesados, total, estado, errorMsg }];
        });
      });

      setMigrationSummary(result.resumen);
      addToast('🎉 ¡Migración masiva de datos a Supabase completada con éxito!', 'success');
    } catch (err: any) {
      console.error('Error durante migración:', err);
      addToast(`Error en la migración: ${err.message || err}`, 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      addToast('Supabase no está configurado', 'warning');
      return;
    }

    setIsPulling(true);
    try {
      const cloudData = await pullAllDataFromSupabase();
      const cliCount = cloudData.clientes?.length || 0;
      const prodCount = cloudData.productos?.length || 0;
      const presCount = cloudData.presupuestos?.length || 0;
      const repCount = cloudData.reportesTecnicos?.length || 0;
      const facCount = cloudData.facturas?.length || 0;

      addToast(`✅ Datos descargados de Supabase: ${cliCount} Clientes, ${prodCount} Repuestos, ${presCount} Presupuestos, ${repCount} Reportes, ${facCount} Facturas.`, 'success');
    } catch (err: any) {
      console.error('Error en pull Supabase:', err);
      addToast(`Error al consultar Supabase: ${err.message}`, 'error');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="supabase-migration-panel">
      
      {/* HEADER SUPABASE HUB */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
            <Database size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800 uppercase tracking-wider">
                Motor PostgreSQL & Storage
              </span>
              <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                <ShieldCheck size={14} /> Nube de Alta Disponibilidad
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              Centro de Migración & Conexión Supabase
              <span className="text-xs font-mono font-normal text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {empresaActiva.nombreCorto}
              </span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Conecta tu base de datos relacional PostgreSQL en Supabase, inicializa las tablas del ERP y migra todos tus datos locales en 1 solo clic.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>Abrir Supabase Dashboard</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: CREDENCIALES & CONEXIÓN (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* TARJETA DE CREDENCIALES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Key size={15} className="text-emerald-400" />
                Credenciales de Supabase
              </h4>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${testResult?.success ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                  {testResult?.success ? 'Conectado' : 'Sin Validar'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                  URL del Proyecto Supabase:
                </label>
                <input
                  type="url"
                  placeholder="https://xyzabcdefg.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
                    Anon / Public Key:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
                  >
                    {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                    <span>{showKey ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none transition pr-8"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <Save size={14} />
                  <span>Guardar Credenciales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestConnection(supabaseUrl, supabaseAnonKey, true)}
                  disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                  className="bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 font-mono text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Probar Conexión"
                >
                  <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'Probando...' : 'Test'}</span>
                </button>
              </div>
            </form>

            {/* RESULTADO DE LA PRUEBA */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
                    <div className="space-y-1">
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.tablesFound && testResult.tablesFound.length > 0 && (
                        <div className="text-[10px] text-emerald-400">
                          ✓ Tablas verificadas: <span className="text-zinc-200">{testResult.tablesFound.join(', ')}</span>
                        </div>
                      )}
                      <div className="text-[10px] flex items-center gap-1.5">
                        <span>Bucket 'evidencias':</span>
                        <span className={testResult.bucketOk ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {testResult.bucketOk ? '✓ Activo y Público' : '⚠️ No detectado (ejecuta el script SQL)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PASO 1: ESQUEMA DDL SQL OFICIAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Paso 1</span>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <FileCode size={15} className="text-cyan-400" />
                  Esquema SQL Oficial de Tablas & Storage
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copia este script e introdúcelo en <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Run</strong> para crear las tablas (<code className="text-emerald-300 font-mono">clientes_equipos</code>, <code className="text-emerald-300 font-mono">Buffer_Cotizaciones</code>, <code className="text-emerald-300 font-mono">Buffer_Reportes_Tecnicos</code>, etc.), el bucket de imágenes <code className="text-cyan-300 font-mono">evidencias</code> y las políticas RLS.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopySql}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? '¡Copiado con Éxito!' : 'Copiar Script SQL Oficial'}</span>
              </button>

              <button
                onClick={handleDownloadSql}
                className="bg-slate-950 hover:bg-slate-800 text-zinc-300 border border-slate-700 font-mono text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Descargar archivo .sql"
              >
                <Download size={14} />
                <span>.SQL</span>
              </button>

              <button
                onClick={() => setShowSqlViewer(!showSqlViewer)}
                className="bg-slate-950 hover:bg-slate-800 text-zinc-300 border border-slate-700 font-mono text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Ver/Ocultar Código SQL"
              >
                <FileCode size={14} />
                <span>{showSqlViewer ? 'Ocultar' : 'Ver SQL'}</span>
              </button>
            </div>

            {/* VISOR DE CÓDIGO SQL */}
            <AnimatePresence>
              {showSqlViewer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-56 scrollbar-thin"
                >
                  <pre className="whitespace-pre">{SUPABASE_SQL_INIT_SCHEMA}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* COLUMNA DERECHA: ASISTENTE DE MIGRACIÓN MASIVA EN 1 CLIC (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PASO 2: PANEL DE MIGRACIÓN MASIVA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Paso 2</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud size={18} className="text-emerald-400" />
                  Migración Masiva de Datos ERP a Supabase
                </h4>
              </div>

              <span className="text-xs text-emerald-300 font-mono bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
                Modo: Upsert Seguro (Sin Duplicados)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Selecciona los módulos cuyos datos locales deseas transferir a las tablas de Supabase. El proceso utiliza operaciones <code className="text-emerald-400 font-mono font-bold">UPSERT</code>, lo que garantiza que no se perderá ninguna información previa y solo se actualizarán o agregarán nuevos registros.
            </p>

            {/* SELECCIÓN DE TABLAS A MIGRAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Clientes */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.clientes ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.clientes}
                    onChange={(e) => setSelectedTables({ ...selectedTables, clientes: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Clientes & Equipos</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: clientes_equipos</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {clientes.length} reg.
                </span>
              </label>

              {/* Repuestos */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.productos ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.productos}
                    onChange={(e) => setSelectedTables({ ...selectedTables, productos: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Inventario de Repuestos</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: inventario_repuestos</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {products.length} reg.
                </span>
              </label>

              {/* Presupuestos */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.presupuestos ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.presupuestos}
                    onChange={(e) => setSelectedTables({ ...selectedTables, presupuestos: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Presupuestos & Cotizaciones</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: presupuestos</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {presupuestos.length} reg.
                </span>
              </label>

              {/* Reportes Técnicos */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.reportesTecnicos ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.reportesTecnicos}
                    onChange={(e) => setSelectedTables({ ...selectedTables, reportesTecnicos: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Reportes Técnicos de Obra</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: reportes_tecnicos</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {reportesTecnicos.length} reg.
                </span>
              </label>

              {/* Facturas */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.facturas ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.facturas}
                    onChange={(e) => setSelectedTables({ ...selectedTables, facturas: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Facturas de Ventas</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: facturas_ventas</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {facturas.length} reg.
                </span>
              </label>

              {/* Solicitudes Clientes Web */}
              <label className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedTables.solicitudesClientes ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedTables.solicitudesClientes}
                    onChange={(e) => setSelectedTables({ ...selectedTables, solicitudesClientes: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold block">Buffer de Cotizaciones Web</span>
                    <span className="text-[10px] text-slate-400 font-mono">Tabla: Buffer_Cotizaciones</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {solicitudesClientes.length} reg.
                </span>
              </label>

            </div>

            {/* BOTÓN DE ACCIÓN DE MIGRACIÓN */}
            <div className="pt-2">
              <button
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <UploadCloud size={18} className={isMigrating ? 'animate-bounce' : ''} />
                <span>{isMigrating ? 'Migrando Conjuntos de Datos a Supabase...' : '🚀 Ejecutar Migración Masiva a Supabase'}</span>
              </button>
            </div>

            {/* REGISTROS Y PROGRESO DE MIGRACIÓN EN VIVO */}
            {migrationLogs.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                  Estado de Transferencia por Tabla:
                </span>
                <div className="space-y-2">
                  {migrationLogs.map((log) => (
                    <div key={log.tabla} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {log.estado === 'OK' && <CheckCircle2 size={14} className="text-emerald-400" />}
                        {log.estado === 'PROCESANDO' && <RefreshCw size={14} className="text-cyan-400 animate-spin" />}
                        {log.estado === 'ERROR' && <AlertCircle size={14} className="text-rose-400" />}
                        <span className="text-zinc-200">{log.tabla}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${
                          log.estado === 'OK' ? 'text-emerald-400' :
                          log.estado === 'PROCESANDO' ? 'text-cyan-400' : 'text-rose-400'
                        }`}>
                          {log.estado === 'OK' ? `✓ ${log.total} registros migrados` :
                           log.estado === 'PROCESANDO' ? `Procesando ${log.total}...` :
                           `Error: ${log.errorMsg || 'Fallo'}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PASO 3: DESCARGA INVERSA (PULL) */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Paso 3 (Opcional)</span>
                <h5 className="text-xs font-bold text-zinc-200 uppercase">
                  Sincronización Inversa (Descargar desde Supabase)
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Actualiza tu base de datos local con las últimas modificaciones registradas en Supabase.
                </p>
              </div>

              <button
                onClick={handlePullFromSupabase}
                disabled={isPulling}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-40"
              >
                <RefreshCw size={14} className={isPulling ? 'animate-spin' : ''} />
                <span>{isPulling ? 'Descargando...' : '📥 Descargar Datos de Supabase'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
