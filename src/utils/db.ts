/**
 * Capa de Abstracción Nativa con IndexedDB para Arquitectura Offline-First
 * Diseñada para permitir a técnicos de campo registrar reportes y vales en sótanos/zonas sin cobertura.
 */

const DB_NAME = 'AXON_ERP_OFFLINE_DB';
const DB_VERSION = 1;

export interface OfflineRecord<T = any> {
  localId: string;
  type: 'reportes' | 'notas' | 'facturas' | 'presupuestos' | 'vales' | 'movimientos';
  payload: T;
  createdAt: string;
  synced: boolean;
  syncedAt?: string;
  errorCount?: number;
  lastError?: string;
}

export const STORES = {
  REPORTES: 'reportes',
  NOTAS: 'notas',
  OFFLINE_QUEUE: 'offlineQueue'
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Inicializar / Abrir la Base de Datos IndexedDB
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está soportado en este navegador.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      // Manejar cierre repentino
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store para Reportes Técnicos de Campo
      if (!db.objectStoreNames.contains(STORES.REPORTES)) {
        const reportStore = db.createObjectStore(STORES.REPORTES, { keyPath: 'localId' });
        reportStore.createIndex('synced', 'synced', { unique: false });
        reportStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Store para Vales / Notas de Despacho y Comprobantes
      if (!db.objectStoreNames.contains(STORES.NOTAS)) {
        const notaStore = db.createObjectStore(STORES.NOTAS, { keyPath: 'localId' });
        notaStore.createIndex('synced', 'synced', { unique: false });
        notaStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. Store Cola Transaccional Genérica (Offline Queue)
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'localId' });
        queueStore.createIndex('synced', 'synced', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

/**
 * Guardar un registro localmente en IndexedDB
 */
export const saveLocalRecord = async <T = any>(
  storeName: string,
  record: T & { id?: string; localId?: string; correlativo?: string; NroVale?: string },
  type: OfflineRecord['type'] = 'reportes'
): Promise<OfflineRecord<T>> => {
  const db = await initDB();
  const idStr = record.localId || record.id || record.correlativo || record.NroVale || `LOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const offlineItem: OfflineRecord<T> = {
    localId: idStr,
    type,
    payload: record,
    createdAt: new Date().toISOString(),
    synced: false,
    errorCount: 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, STORES.OFFLINE_QUEUE], 'readwrite');
    const targetStore = tx.objectStore(storeName);
    const queueStore = tx.objectStore(STORES.OFFLINE_QUEUE);

    targetStore.put(offlineItem);
    queueStore.put(offlineItem);

    tx.oncomplete = () => {
      console.log(`[IndexedDB] Registro guardado localmente en ${storeName}:`, idStr);
      resolve(offlineItem);
    };

    tx.onerror = () => {
      console.error(`[IndexedDB] Error al guardar en ${storeName}:`, tx.error);
      reject(tx.error);
    };
  });
};

/**
 * Obtener todos los registros de un store específico
 */
export const getLocalRecords = async <T = any>(storeName: string): Promise<OfflineRecord<T>[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Error al obtener registros de ${storeName}:`, request.error);
      reject(request.error);
    };
  });
};

/**
 * Obtener todos los registros pendientes de sincronización (synced: false)
 */
export const getUnsyncedRecords = async (): Promise<OfflineRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.OFFLINE_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => {
      const all: OfflineRecord[] = request.result || [];
      const pending = all.filter(r => !r.synced);
      resolve(pending);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Error al consultar registros pendientes:', request.error);
      reject(request.error);
    };
  });
};

/**
 * Marcar un registro local como sincronizado exitosamente
 */
export const markRecordSynced = async (storeName: string, localId: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, STORES.OFFLINE_QUEUE], 'readwrite');
    const targetStore = tx.objectStore(storeName);
    const queueStore = tx.objectStore(STORES.OFFLINE_QUEUE);

    const getReq = targetStore.get(localId);

    getReq.onsuccess = () => {
      const record: OfflineRecord = getReq.result;
      if (record) {
        record.synced = true;
        record.syncedAt = new Date().toISOString();
        targetStore.put(record);
      }
      
      const queueReq = queueStore.get(localId);
      queueReq.onsuccess = () => {
        const queueRecord: OfflineRecord = queueReq.result;
        if (queueRecord) {
          queueRecord.synced = true;
          queueRecord.syncedAt = new Date().toISOString();
          queueStore.put(queueRecord);
        }
      };
    };

    tx.oncomplete = () => {
      console.log(`[IndexedDB] Registro marcado como sincronizado:`, localId);
      resolve(true);
    };

    tx.onerror = () => {
      console.error(`[IndexedDB] Error al marcar sincronizado:`, tx.error);
      reject(false);
    };
  });
};

/**
 * Eliminar un registro local de IndexedDB
 */
export const removeLocalRecord = async (storeName: string, localId: string): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, STORES.OFFLINE_QUEUE], 'readwrite');
    const targetStore = tx.objectStore(storeName);
    const queueStore = tx.objectStore(STORES.OFFLINE_QUEUE);

    targetStore.delete(localId);
    queueStore.delete(localId);

    tx.oncomplete = () => {
      console.log(`[IndexedDB] Registro eliminado localmente:`, localId);
      resolve(true);
    };

    tx.onerror = () => {
      console.error(`[IndexedDB] Error al eliminar registro local:`, tx.error);
      reject(false);
    };
  });
};

/**
 * Limpieza periódica de registros sincronizados antiguos
 */
export const clearSyncedRecords = async (storeName: string): Promise<number> => {
  const db = await initDB();
  const records = await getLocalRecords(storeName);
  const synced = records.filter(r => r.synced);

  let removedCount = 0;
  for (const item of synced) {
    await removeLocalRecord(storeName, item.localId);
    removedCount++;
  }
  return removedCount;
};
