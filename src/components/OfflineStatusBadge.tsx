import React from 'react';
import { Wifi, WifiOff, HardDrive, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineStatusBadge: React.FC = () => {
  const { networkStatus, offlinePendingCount, isSyncing, triggerManualSync } = useApp();
  const isOnline = networkStatus === 'ONLINE';

  return (
    <div className="flex items-center gap-2">
      {/* Insignia Estado de Red */}
      <div 
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition shadow-sm ${
          isOnline 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
            : 'bg-amber-950/60 border-amber-800/80 text-amber-300 animate-pulse'
        }`}
        title={isOnline ? 'Conexión a red activa' : 'Sin cobertura (Modo Sótano / Offline activo)'}
      >
        {isOnline ? (
          <>
            <Wifi size={13} className="text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">EN LÍNEA</span>
          </>
        ) : (
          <>
            <WifiOff size={13} className="text-amber-400 shrink-0 animate-bounce" />
            <span>MODO SÓTANO (OFFLINE)</span>
          </>
        )}
      </div>

      {/* Registros Pendientes en IndexedDB */}
      {offlinePendingCount > 0 && (
        <button
          onClick={triggerManualSync}
          disabled={isSyncing || !isOnline}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 text-[11px] font-mono font-bold transition cursor-pointer disabled:opacity-50"
          title="Registros locales guardados en IndexedDB. Haz clic para sincronizar."
        >
          <HardDrive size={13} className="text-cyan-400 shrink-0" />
          <span>{offlinePendingCount} en IndexedDB</span>
          <RefreshCw size={12} className={`ml-0.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
