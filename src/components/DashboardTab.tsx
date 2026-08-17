import React from 'react';
import { useApp } from '../context/AppContext';
import { clasificarFamilia, FAMILIAS_INVENTARIO, MOCK_COSTS } from '../data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';
import { DollarSign, ShieldAlert, FileText, Wifi, WifiOff, Trash2, ArrowRight } from 'lucide-react';

interface DashboardTabProps {
  onNavigateToStock: (familyFilter?: string) => void;
}

export default function DashboardTab({ onNavigateToStock }: DashboardTabProps) {
  const { products, vales, networkStatus, syncQueue, activeDivision } = useApp();

  // Filtrar productos de la división activa
  const divisionProducts = products.filter(p => p.division === activeDivision);

  // 1. Calcular Stock Valorizado ($)
  const stockValorizado = divisionProducts.reduce((acc, p) => {
    const cost = MOCK_COSTS[p.val_c] || 50; // Costo por defecto para productos de emergencia
    return acc + (p.val_s * cost);
  }, 0);

  // 2. Repuestos bajo mínimos críticos
  const bajoMinimoCount = divisionProducts.filter(p => {
    const fam = clasificarFamilia(p.val_d);
    return p.val_s < fam.minVal;
  }).length;

  // 3. Transacciones creadas de la división actual
  const valesDivision = vales.filter(v => v.division === activeDivision);
  const transaccionesHoyCount = valesDivision.length;

  // 4. Agrupamiento de Recharts por Familia de Productos
  const chartData = FAMILIAS_INVENTARIO.map(fam => {
    const famProducts = divisionProducts.filter(p => clasificarFamilia(p.val_d).key === fam.key);
    
    // Suma de Stock Actual de los productos de esta familia
    const totalActual = famProducts.reduce((sum, p) => sum + p.val_s, 0);
    // Suma de mínimos recomendados para todos los productos de esta familia
    const totalMinimo = famProducts.reduce((sum) => sum + fam.minVal, 0);

    return {
      name: fam.label,
      "Stock Actual": totalActual,
      "Mínimo Requerido": totalMinimo,
      key: fam.key,
      deficient: totalActual < totalMinimo,
      deficitVal: Math.max(0, totalMinimo - totalActual)
    };
  });

  // Urgencias calculadas para el Panel Lateral
  const urgentFamilias = chartData.filter(item => item.deficient);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="dashboard-tab">
      {/* SECCIÓN IZQUIERDA Y CENTRAL: MÉTRICAS Y GRÁFICO (3 Columnas) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* FILA DE METRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card: Stock Valorizado */}
          <div 
            id="kpi-valorizado"
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition hover:border-emerald-500/30"
          >
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-emerald-400">
              <DollarSign size={100} />
            </div>
            <p className="text-xs font-sans tracking-wide text-zinc-400 uppercase">Stock Valorizado (Costo Est.)</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">
              ${stockValorizado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] font-mono text-zinc-500 mt-1 block">Ficticio basado en costes estándar</span>
          </div>

          {/* Card: Bajo Mínimo Crítico */}
          <div 
            id="kpi-bajo-minimo"
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition hover:border-pink-500/30"
          >
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-pink-400">
              <ShieldAlert size={100} />
            </div>
            <p className="text-xs font-sans tracking-wide text-zinc-400 uppercase">Alertas Bajo Mínimo</p>
            <p className="text-2xl font-mono font-bold text-pink-500 mt-2">
              {bajoMinimoCount} <span className="text-sm font-sans text-zinc-500 font-normal">items</span>
            </p>
            <span className={`text-[10px] font-semibold mt-1 block ${bajoMinimoCount > 0 ? 'text-pink-400/80 animate-pulse' : 'text-emerald-400/80'}`}>
              {bajoMinimoCount > 0 ? '⚠️ Requiere reposición inmediata' : '✓ Stock equilibrado'}
            </span>
          </div>

          {/* Card: Transacciones de Hoy */}
          <div 
            id="kpi-transacciones"
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition hover:border-cyan-500/30"
          >
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-cyan-400">
              <FileText size={100} />
            </div>
            <p className="text-xs font-sans tracking-wide text-zinc-400 uppercase">Vales Despachados (Total)</p>
            <p className="text-2xl font-mono font-bold text-cyan-400 mt-2">
              {transaccionesHoyCount} <span className="text-sm font-sans text-zinc-500 font-normal">vales</span>
            </p>
            <span className="text-[10px] font-mono text-zinc-500 mt-1 block">Historial acumulado local</span>
          </div>

          {/* Card: Estado de Sincronización */}
          <div 
            id="kpi-sincronizacion"
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition"
          >
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-indigo-400">
              {networkStatus === 'OFFLINE' ? <WifiOff size={100} /> : <Wifi size={100} />}
            </div>
            <p className="text-xs font-sans tracking-wide text-zinc-400 uppercase">Sincronizador local</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                networkStatus === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                networkStatus === 'INTERMITTENT' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }`} />
              <p className="text-lg font-mono font-bold text-zinc-200">
                {networkStatus === 'ONLINE' ? 'Online' : 
                 networkStatus === 'INTERMITTENT' ? 'Intermitente' : 'Modo Local'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 mt-1 block">
              {syncQueue.length} cambios pendientes en cola
            </span>
          </div>

        </div>

        {/* CONTENEDOR GRÁFICO RECHARTS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
            <div>
              <h3 className="text-base font-sans font-medium text-zinc-100">
                Análisis de Stock Crítico por Familia
              </h3>
              <p className="text-xs text-zinc-400">
                Comparativa entre el inventario físico total y el nivel mínimo sugerido para la división {activeDivision === 'AUTOMATION' ? 'AUTOMACIÓN' : 'HEAVY POWER'}
              </p>
            </div>
            <div className="text-[10px] bg-slate-950 font-mono py-1 px-2 border border-slate-800 rounded text-zinc-400 uppercase tracking-wider">
              Actualizado en tiempo real
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#f4f4f5', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                />
                <Bar dataKey="Stock Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mínimo Requerido" fill="#ec4899" opacity={0.65} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COLUMNA DERECHA: PANEL LATERAL DE ACCIONES URGENTES (1 Columna) */}
      <div className="space-y-6">
        
        {/* PANEL LATERAL DE ACCIONES URGENTES */}
        <div 
          id="urgent-actions-panel"
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-full flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800 text-pink-500">
              <ShieldAlert size={18} className="animate-bounce" />
              <h3 className="text-sm font-sans font-bold tracking-wide uppercase text-zinc-100">
                Resguardo de Déficit
              </h3>
            </div>
            
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Las siguientes familias operativas en <span className="font-mono text-zinc-200">{activeDivision}</span> registran cantidades totales inferiores al resguardo de seguridad:
            </p>

            {urgentFamilias.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-4 text-center">
                <span className="text-emerald-400 text-xs block font-bold mb-1">✓ INVENTARIO SEGURO</span>
                <span className="text-zinc-400 text-[11px] block">No se reportan déficits operativos en esta sub-operadora.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentFamilias.map(fam => (
                  <div 
                    key={fam.key}
                    onClick={() => onNavigateToStock(fam.key)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-pink-500/40 transition group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-sans font-medium text-zinc-200 group-hover:text-cyan-400 transition">
                        {fam.name}
                      </span>
                      <span className="text-[10px] bg-pink-950 text-pink-400 font-semibold px-1.5 py-0.5 rounded">
                        Déficit: -{fam.deficitVal}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2 pt-2 border-t border-slate-900">
                      <span>Físico: {fam["Stock Actual"]} unids</span>
                      <span>Mín: {fam["Mínimo Requerido"]} unids</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6">
            <button 
              onClick={() => onNavigateToStock()}
              className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400 text-zinc-300 py-2.5 px-4 rounded-lg text-xs font-sans font-medium transition flex items-center justify-center gap-2"
            >
              Abastecer / Ver Todos los Items
              <ArrowRight size={14} />
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-2 font-mono">
              Sujeto a normas de auditoría ISO-9001
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
