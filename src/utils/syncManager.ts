/**
 * Gestor de Sincronización Automática (Sync Manager)
 * Procesa la cola de datos registrados en sótanos/offline mediante IndexedDB
 * y los envía al servidor / Google Apps Script / Firebase al recuperar cobertura.
 */

import { getUnsyncedRecords, markRecordSynced, saveLocalRecord, STORES, OfflineRecord } from './db';
import { postReportToAppsScript, postNotaToAppsScript } from '../services/googleSheets';

export interface SyncResult {
  totalPending: number;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ localId: string; error: string }>;
}

export type NetworkChangeCallback = (isOnline: boolean) => void;
export type SyncStatusCallback = (result: SyncResult) => void;

let isSyncInProgress = false;
const networkCallbacks: Set<NetworkChangeCallback> = new Set();
const syncCallbacks: Set<SyncStatusCallback> = new Set();

/**
 * Escuchar cambios de estado de red (online / offline)
 */
export const initSyncManagerListeners = (
  onNetworkChange?: NetworkChangeCallback,
  onSyncStatus?: SyncStatusCallback
) => {
  if (onNetworkChange) networkCallbacks.add(onNetworkChange);
  if (onSyncStatus) syncCallbacks.add(onSyncStatus);

  const handleOnline = async () => {
    console.log('[SyncManager] Dispositivo en línea. Iniciando sincronización de cola offline...');
    networkCallbacks.forEach(cb => cb(true));
    
    // Auto-procesar cola con pequeño retraso para asegurar estabilización de red
    setTimeout(async () => {
      await processOfflineSync();
    }, 1500);
  };

  const handleOffline = () => {
    console.warn('[SyncManager] Dispositivo en modo Offline (Sin conexión a red).');
    networkCallbacks.forEach(cb => cb(false));
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (onNetworkChange) networkCallbacks.delete(onNetworkChange);
    if (onSyncStatus) syncCallbacks.delete(onSyncStatus);
  };
};

/**
 * Guardar reporte de campo de forma transparente cuando el usuario está offline o falla la red
 */
export const saveReporteOffline = async (reporte: any, scriptUrl?: string): Promise<{ savedOffline: boolean; synced: boolean }> => {
  try {
    // 1. Siempre guardar en IndexedDB como salvaguarda
    await saveLocalRecord(STORES.REPORTES, reporte, 'reportes');

    // 2. Si hay red, intentar envío inmediato (vía Apps Script o API Directa Google Sheets)
    if (navigator.onLine) {
      try {
        const ok = await postReportToAppsScript(scriptUrl || '', reporte);
        if (ok) {
          await markRecordSynced(STORES.REPORTES, reporte.id || reporte.localId || reporte.correlativo);
          return { savedOffline: false, synced: true };
        }
      } catch (err) {
        console.warn('[SyncManager] Error de red enviando reporte. Se mantendrá en cola IndexedDB:', err);
        return { savedOffline: true, synced: false };
      }
    }

    return { savedOffline: true, synced: false };
  } catch (e) {
    console.error('[SyncManager] Error guardando en IndexedDB:', e);
    return { savedOffline: true, synced: false };
  }
};

/**
 * Guardar vale / nota / comprobante de forma transparente cuando el usuario está offline
 */
export const saveNotaOffline = async (notaPayload: any, scriptUrl?: string): Promise<{ savedOffline: boolean; synced: boolean }> => {
  try {
    await saveLocalRecord(STORES.NOTAS, notaPayload, 'notas');

    if (navigator.onLine && scriptUrl && !scriptUrl.includes('DEMO_INTEGRADO')) {
      try {
        const ok = await postNotaToAppsScript(scriptUrl, notaPayload);
        if (ok) {
          await markRecordSynced(STORES.NOTAS, notaPayload.NroVale || notaPayload.localId || notaPayload.correlativo);
          return { savedOffline: false, synced: true };
        }
      } catch (err) {
        console.warn('[SyncManager] Error de red enviando nota. Se mantendrá en cola IndexedDB:', err);
      }
    }

    return { savedOffline: true, synced: false };
  } catch (e) {
    console.error('[SyncManager] Error guardando en IndexedDB:', e);
    return { savedOffline: true, synced: false };
  }
};

/**
 * Procesar la cola de sincronización de datos offline (processOfflineSync)
 */
export const processOfflineSync = async (getScriptUrl?: () => string): Promise<SyncResult> => {
  if (isSyncInProgress) {
    console.log('[SyncManager] Sincronización en curso. Omitiendo duplicado.');
    return { totalPending: 0, syncedCount: 0, failedCount: 0, errors: [] };
  }

  if (!navigator.onLine) {
    console.warn('[SyncManager] Omitiendo sincronización: Dispositivo aún desconectado.');
    return { totalPending: 0, syncedCount: 0, failedCount: 0, errors: [] };
  }

  isSyncInProgress = true;
  const result: SyncResult = {
    totalPending: 0,
    syncedCount: 0,
    failedCount: 0,
    errors: []
  };

  try {
    const pendingRecords = await getUnsyncedRecords();
    result.totalPending = pendingRecords.length;

    if (pendingRecords.length === 0) {
      console.log('[SyncManager] No hay registros pendientes de sincronización.');
      isSyncInProgress = false;
      return result;
    }

    console.log(`[SyncManager] Sincronizando ${pendingRecords.length} registros pendientes...`);

    const activeCompanyId = localStorage.getItem('axon_active_empresa_id') || 'SOLUCIONES_DAKACO';
    const defaultScriptUrl = localStorage.getItem(`axon_script_url_${activeCompanyId}`) || 
                             localStorage.getItem('axon_script_url') || 
                             '';
    const scriptUrl = getScriptUrl ? getScriptUrl() : defaultScriptUrl;

    for (const record of pendingRecords) {
      const storeName = record.type === 'reportes' ? STORES.REPORTES : STORES.NOTAS;

      try {
        if (record.type === 'reportes') {
          const ok = await postReportToAppsScript(scriptUrl || '', record.payload);
          if (ok) {
            await markRecordSynced(storeName, record.localId);
            result.syncedCount++;
          } else {
            result.failedCount++;
          }
        } else {
          // Notas, Vales, Facturas, etc.
          const ok = await postNotaToAppsScript(scriptUrl || '', record.payload);
          if (ok) {
            await markRecordSynced(storeName, record.localId);
            result.syncedCount++;
          } else {
            result.failedCount++;
          }
        }
      } catch (err: any) {
        console.error(`[SyncManager] Error sincronizando registro ${record.localId}:`, err);
        result.failedCount++;
        result.errors.push({
          localId: record.localId,
          error: err?.message || 'Error de conexión o timeout'
        });
      }
    }

    // Notificar a observadores
    syncCallbacks.forEach(cb => cb(result));

  } catch (error: any) {
    console.error('[SyncManager] Error general en processOfflineSync:', error);
  } finally {
    isSyncInProgress = false;
  }

  return result;
};
