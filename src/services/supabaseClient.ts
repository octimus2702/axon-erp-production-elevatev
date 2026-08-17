import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { compressImage } from '../utils/imageCompressor';

// Claves de configuración con fallback a localStorage para flexibilidad inmediata
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = localStorage.getItem('axon_supabase_url') || '';
  const savedKey = localStorage.getItem('axon_supabase_anon_key') || '';

  return {
    url: (savedUrl || envUrl).trim(),
    anonKey: (savedKey || envKey).trim()
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseInstance;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
};

// ============================================================================
// 1. MANEJO Y SUBIDA DE FOTOGRAFÍAS A SUPABASE STORAGE (Bucket: "evidencias")
// ============================================================================

export interface SubidaFotoResult {
  url: string;
  nombreArchivo: string;
  pesoKb: number;
  exito: boolean;
  error?: string;
}

/**
 * Optimiza y sube una fotografía al bucket "evidencias" en Supabase Storage
 * Comprime a máx 1200px y calidad 80% (150KB - 300KB)
 */
export async function uploadFotoEvidencia(
  archivoOB64: File | string,
  carpeta: 'inspecciones' | 'cotizaciones' | 'repuestos' | 'comprobantes' = 'inspecciones',
  prefijoNombre: string = 'foto'
): Promise<SubidaFotoResult> {
  const supabase = getSupabase();
  if (!supabase) {
    // Si no hay Supabase configurado, devolver DataURL localmente
    if (typeof archivoOB64 === 'string') {
      return { url: archivoOB64, nombreArchivo: 'local.webp', pesoKb: 0, exito: true };
    }
    const localOptimized = await compressImage(archivoOB64, `${prefijoNombre}.webp`);
    return { url: localOptimized.dataUrl, nombreArchivo: localOptimized.fileName, pesoKb: localOptimized.compressedSizeKb, exito: true };
  }

  try {
    // 1. Comprimir en cliente a 1200px máx y 80% calidad
    const timestamp = Date.now();
    const randomHash = Math.random().toString(36).substring(2, 8);
    const fileName = `${prefijoNombre}_${timestamp}_${randomHash}.webp`;
    const compression = await compressImage(archivoOB64, fileName, 1200, 0.80);

    const bucketName = 'evidencias';
    const filePath = `${carpeta}/${compression.fileName}`;

    // 2. Subir Blob optimizado a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, compression.blob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.warn('Error subiendo imagen a Supabase Storage (intentando fallback DataURL):', uploadError);
      return {
        url: compression.dataUrl,
        nombreArchivo: compression.fileName,
        pesoKb: compression.compressedSizeKb,
        exito: false,
        error: uploadError.message
      };
    }

    // 3. Obtener URL pública directa
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      nombreArchivo: compression.fileName,
      pesoKb: compression.compressedSizeKb,
      exito: true
    };
  } catch (err: any) {
    console.error('Excepción al procesar y subir imagen a Supabase:', err);
    return {
      url: typeof archivoOB64 === 'string' ? archivoOB64 : '',
      nombreArchivo: 'error.webp',
      pesoKb: 0,
      exito: false,
      error: err.message || 'Error desconocido al subir foto'
    };
  }
}

// ============================================================================
// 2. PORTAL WEB DE COTIZACIONES (CLIENTES) -> Buffer_Cotizaciones
// ============================================================================

export interface BufferCotizacionRecord {
  id_solicitud: string;
  fecha_hora: string;
  cliente_nombre: string;
  cliente_rif?: string;
  telefono: string;
  email: string;
  edificio_ubicacion: string;
  cantidad_ascensores: number;
  tipo_servicio_solicitado: string;
  detalles_requerimiento: string;
  estado_gestion: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO';
  created_at?: string;
}

/**
 * Inserta una solicitud de cotización web en la tabla Buffer_Cotizaciones
 */
export async function insertBufferCotizacion(
  solicitud: Omit<BufferCotizacionRecord, 'estado_gestion'> & { estado_gestion?: 'PENDIENTE_GESTOR' }
): Promise<{ exito: boolean; mensaje: string; id?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { exito: false, mensaje: 'Supabase no está configurado (URL o Clave faltante).' };
  }

  const payload: BufferCotizacionRecord = {
    id_solicitud: solicitud.id_solicitud || `COT-WEB-${Date.now()}`,
    fecha_hora: solicitud.fecha_hora || new Date().toISOString(),
    cliente_nombre: solicitud.cliente_nombre,
    cliente_rif: solicitud.cliente_rif || 'N/A',
    telefono: solicitud.telefono,
    email: solicitud.email,
    edificio_ubicacion: solicitud.edificio_ubicacion,
    cantidad_ascensores: Number(solicitud.cantidad_ascensores) || 1,
    tipo_servicio_solicitado: solicitud.tipo_servicio_solicitado,
    detalles_requerimiento: solicitud.detalles_requerimiento,
    estado_gestion: 'PENDIENTE_GESTOR'
  };

  try {
    const { data, error } = await supabase
      .from('Buffer_Cotizaciones')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insertando en Buffer_Cotizaciones:', error);
      return { exito: false, mensaje: error.message };
    }

    return { exito: true, mensaje: 'Solicitud registrada exitosamente en Buffer_Cotizaciones', id: payload.id_solicitud };
  } catch (err: any) {
    console.error('Excepción al insertar cotización en Supabase:', err);
    return { exito: false, mensaje: err.message || 'Error de conexión' };
  }
}

/**
 * Consulta las solicitudes en Buffer_Cotizaciones
 */
export async function fetchBufferCotizaciones(): Promise<BufferCotizacionRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('Buffer_Cotizaciones')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error obteniendo Buffer_Cotizaciones:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Excepción al consultar Buffer_Cotizaciones:', err);
    return [];
  }
}

/**
 * Actualiza el estado de una cotización en el Buffer (ej: CONSOLIDADO_EN_MASTER)
 */
export async function updateBufferCotizacionStatus(
  id_solicitud: string,
  nuevoEstado: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('Buffer_Cotizaciones')
      .update({ estado_gestion: nuevoEstado })
      .eq('id_solicitud', id_solicitud);

    if (error) {
      console.error('Error actualizando estado en Buffer_Cotizaciones:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Excepción actualizando estado en Buffer_Cotizaciones:', err);
    return false;
  }
}

// ============================================================================
// 3. PORTAL DE TÉCNICOS EN OBRA -> Buffer_Reportes_Tecnicos
// ============================================================================

export interface BufferReporteTecnicoRecord {
  id_transaccion: string;
  fecha_hora: string;
  codigo_tecnico: string;
  nombre_tecnico: string;
  cliente_obra: string;
  ubicacion: string;
  ascensor_equipo: string;
  diagnostico_falla: string;
  repuestos_solicitados_json: string; // JSON Array de repuestos solicitados
  fotos_json?: string; // JSON Array de URLs públicas de Supabase Storage
  fotos_count?: number;
  estado_gestion: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO';
  created_at?: string;
}

/**
 * Inserta un reporte de inspección de campo en la tabla Buffer_Reportes_Tecnicos
 */
export async function insertBufferReporteTecnico(
  reporte: Omit<BufferReporteTecnicoRecord, 'estado_gestion'> & { estado_gestion?: 'PENDIENTE_GESTOR' }
): Promise<{ exito: boolean; mensaje: string; id?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { exito: false, mensaje: 'Supabase no está configurado (URL o Clave faltante).' };
  }

  const payload: BufferReporteTecnicoRecord = {
    id_transaccion: reporte.id_transaccion || `REP-${Date.now()}`,
    fecha_hora: reporte.fecha_hora || new Date().toISOString(),
    codigo_tecnico: reporte.codigo_tecnico || 'TEC-001',
    nombre_tecnico: reporte.nombre_tecnico,
    cliente_obra: reporte.cliente_obra,
    ubicacion: reporte.ubicacion,
    ascensor_equipo: reporte.ascensor_equipo || 'Ascensor Principal',
    diagnostico_falla: reporte.diagnostico_falla,
    repuestos_solicitados_json: typeof reporte.repuestos_solicitados_json === 'string' 
      ? reporte.repuestos_solicitados_json 
      : JSON.stringify(reporte.repuestos_solicitados_json || []),
    fotos_json: typeof reporte.fotos_json === 'string'
      ? reporte.fotos_json
      : JSON.stringify(reporte.fotos_json || []),
    fotos_count: reporte.fotos_count || 0,
    estado_gestion: 'PENDIENTE_GESTOR'
  };

  try {
    const { data, error } = await supabase
      .from('Buffer_Reportes_Tecnicos')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insertando en Buffer_Reportes_Tecnicos:', error);
      return { exito: false, mensaje: error.message };
    }

    return { exito: true, mensaje: 'Reporte registrado exitosamente en Buffer_Reportes_Tecnicos', id: payload.id_transaccion };
  } catch (err: any) {
    console.error('Excepción al insertar reporte en Supabase:', err);
    return { exito: false, mensaje: err.message || 'Error de conexión' };
  }
}

/**
 * Consulta los reportes en Buffer_Reportes_Tecnicos
 */
export async function fetchBufferReportesTecnicos(): Promise<BufferReporteTecnicoRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('Buffer_Reportes_Tecnicos')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error obteniendo Buffer_Reportes_Tecnicos:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Excepción al consultar Buffer_Reportes_Tecnicos:', err);
    return [];
  }
}

/**
 * Actualiza el estado de un reporte en el Buffer (ej: CONSOLIDADO_EN_MASTER)
 */
export async function updateBufferReporteStatus(
  id_transaccion: string,
  nuevoEstado: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('Buffer_Reportes_Tecnicos')
      .update({ estado_gestion: nuevoEstado })
      .eq('id_transaccion', id_transaccion);

    if (error) {
      console.error('Error actualizando estado en Buffer_Reportes_Tecnicos:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Excepción actualizando estado en Buffer_Reportes_Tecnicos:', err);
    return false;
  }
}

// ============================================================================
// 4. SOFT DELETE PATTERN (Cambiar estado a 'ARCHIVADO')
// ============================================================================

/**
 * Guarda las credenciales de Supabase en LocalStorage y reinicia el cliente
 */
export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem('axon_supabase_url', url.trim());
  localStorage.setItem('axon_supabase_anon_key', anonKey.trim());
  resetSupabaseClient();
}

/**
 * Obtiene las credenciales guardadas de Supabase
 */
export function getStoredSupabaseCredentials() {
  return getSupabaseConfig();
}

/**
 * Prueba la conexión con el servidor Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tablesFound?: string[]; bucketOk?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Faltan las credenciales de Supabase (URL o Anon Key).' };
  }

  try {
    const testResults: string[] = [];

    // Test 1: Buffer_Cotizaciones
    const { error: cotizErr } = await supabase.from('Buffer_Cotizaciones').select('id_solicitud').limit(1);
    if (!cotizErr) testResults.push('Buffer_Cotizaciones');

    // Test 2: Buffer_Reportes_Tecnicos
    const { error: repErr } = await supabase.from('Buffer_Reportes_Tecnicos').select('id_transaccion').limit(1);
    if (!repErr) testResults.push('Buffer_Reportes_Tecnicos');

    // Test 3: clientes_equipos
    const { error: cliErr } = await supabase.from('clientes_equipos').select('id').limit(1);
    if (!cliErr) testResults.push('clientes_equipos');

    // Test 4: presupuestos
    const { error: presErr } = await supabase.from('presupuestos').select('id').limit(1);
    if (!presErr) testResults.push('presupuestos');

    // Test 5: Storage bucket evidencias
    let bucketOk = false;
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (!bErr && buckets) {
      bucketOk = buckets.some(b => b.name === 'evidencias');
    }

    if (testResults.length > 0) {
      return {
        success: true,
        message: `¡Conexión exitosa con PostgreSQL de Supabase! Tablas detectadas: ${testResults.join(', ')}`,
        tablesFound: testResults,
        bucketOk
      };
    } else {
      return {
        success: true,
        message: 'Conexión a Supabase establecida. Recuerda ejecutar el script SQL oficial para crear las tablas y el bucket.',
        tablesFound: [],
        bucketOk
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error conectando con Supabase: ${err.message || err}`
    };
  }
}

/**
 * Migra todo el conjunto de datos de la aplicación a Supabase PostgreSQL
 */
export async function migrateAllDataToSupabase(
  dataset: {
    clientes?: any[];
    productos?: any[];
    presupuestos?: any[];
    facturas?: any[];
    reportesTecnicos?: any[];
    recibos?: any[];
    movimientosContables?: any[];
    solicitudesClientes?: any[];
  },
  onProgress?: (tabla: string, procesados: number, total: number, estado: 'PROCESANDO' | 'OK' | 'ERROR', errorMsg?: string) => void
): Promise<{ success: boolean; resumen: Record<string, { total: number; insertados: number; error?: string }> }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase no está configurado. Ingrese la URL y la Anon Key.');
  }

  const resumen: Record<string, { total: number; insertados: number; error?: string }> = {};

  // 1. MIGRAR CLIENTES Y EQUIPOS
  if (dataset.clientes && dataset.clientes.length > 0) {
    const total = dataset.clientes.length;
    onProgress?.('clientes_equipos', 0, total, 'PROCESANDO');
    try {
      const records = dataset.clientes.map(c => ({
        id: c.id,
        nombre: c.nombre || 'Cliente Sin Nombre',
        rif: c.rif || 'N/A',
        telefono: c.telefono || '',
        email: c.email || '',
        direccion: c.direccion || '',
        tipo_facturacion: c.tipoFacturacionPreferida || 'AMBAS',
        division: c.division || 'TECNOLOGIA',
        equipos_json: c.equipos || [],
        estado: c.estado || 'ACTIVO',
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('clientes_equipos').upsert(records, { onConflict: 'id' });
      if (error) throw error;
      resumen['clientes_equipos'] = { total, insertados: total };
      onProgress?.('clientes_equipos', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando clientes_equipos:', err);
      resumen['clientes_equipos'] = { total, insertados: 0, error: err.message };
      onProgress?.('clientes_equipos', 0, total, 'ERROR', err.message);
    }
  }

  // 2. MIGRAR INVENTARIO / REPUESTOS
  if (dataset.productos && dataset.productos.length > 0) {
    const total = dataset.productos.length;
    onProgress?.('inventario_repuestos', 0, total, 'PROCESANDO');
    try {
      const records = dataset.productos.map(p => ({
        val_c: p.val_c,
        codigo_fabrica: p.c_fabrica || '',
        descripcion: p.descripcion || '',
        ubicacion: p.ubicacion || '',
        categoria: p.categoria || 'REPUESTOS',
        stock: Number(p.stock) || 0,
        minimo: Number(p.minimo) || 0,
        costo_usd: Number(p.costoUSD) || 0,
        precio_usd: Number(p.precioUSD) || 0,
        division: p.division || 'TECNOLOGIA',
        foto_url: p.fotoUrl || '',
        estado: p.estado || 'ACTIVO',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('inventario_repuestos').upsert(records, { onConflict: 'val_c' });
      if (error) throw error;
      resumen['inventario_repuestos'] = { total, insertados: total };
      onProgress?.('inventario_repuestos', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando inventario_repuestos:', err);
      resumen['inventario_repuestos'] = { total, insertados: 0, error: err.message };
      onProgress?.('inventario_repuestos', 0, total, 'ERROR', err.message);
    }
  }

  // 3. MIGRAR PRESUPUESTOS
  if (dataset.presupuestos && dataset.presupuestos.length > 0) {
    const total = dataset.presupuestos.length;
    onProgress?.('presupuestos', 0, total, 'PROCESANDO');
    try {
      const records = dataset.presupuestos.map(p => ({
        id: p.id,
        correlativo: p.correlativo || p.id,
        fecha: p.fecha || new Date().toISOString().split('T')[0],
        cliente_nombre: p.clienteNombre || 'Cliente',
        cliente_rif: p.clienteRif || 'N/A',
        subtotal: Number(p.subtotal) || 0,
        iva: Number(p.iva) || 0,
        total: Number(p.total) || 0,
        items_json: p.items || [],
        estado: p.estado || 'PENDIENTE',
        division: p.division || 'TECNOLOGIA',
        observaciones: p.observaciones || '',
        origen_solicitud_id: p.origenSolicitudId || null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('presupuestos').upsert(records, { onConflict: 'id' });
      if (error) throw error;
      resumen['presupuestos'] = { total, insertados: total };
      onProgress?.('presupuestos', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando presupuestos:', err);
      resumen['presupuestos'] = { total, insertados: 0, error: err.message };
      onProgress?.('presupuestos', 0, total, 'ERROR', err.message);
    }
  }

  // 4. MIGRAR REPORTES TÉCNICOS
  if (dataset.reportesTecnicos && dataset.reportesTecnicos.length > 0) {
    const total = dataset.reportesTecnicos.length;
    onProgress?.('reportes_tecnicos', 0, total, 'PROCESANDO');
    try {
      const records = dataset.reportesTecnicos.map(r => ({
        id: r.id,
        correlativo: r.correlativo || r.id,
        fecha: r.fecha || new Date().toISOString().split('T')[0],
        cliente_nombre: r.clienteNombre || '',
        tecnico_nombre: r.tecnicoNombre || '',
        equipo_ascensor: r.equipoAscensor || r.ascensorNombre || '',
        ubicacion_obra: r.ubicacionObra || '',
        tipo_servicio: r.tipoServicio || 'PREVENTIVO',
        diagnostico_danio: r.diagnosticoDanio || r.observaciones || '',
        trabajos_realizados: r.trabajosRealizados || '',
        repuestos_faltantes_json: r.repuestosFaltantes || [],
        fotos_json: r.fotos || [],
        estado: r.estado || 'COMPLETADO',
        division: r.division || 'TECNOLOGIA',
        origen_transaccion_id: r.origenTransaccionId || null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('reportes_tecnicos').upsert(records, { onConflict: 'id' });
      if (error) throw error;
      resumen['reportes_tecnicos'] = { total, insertados: total };
      onProgress?.('reportes_tecnicos', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando reportes_tecnicos:', err);
      resumen['reportes_tecnicos'] = { total, insertados: 0, error: err.message };
      onProgress?.('reportes_tecnicos', 0, total, 'ERROR', err.message);
    }
  }

  // 5. MIGRAR FACTURAS
  if (dataset.facturas && dataset.facturas.length > 0) {
    const total = dataset.facturas.length;
    onProgress?.('facturas_ventas', 0, total, 'PROCESANDO');
    try {
      const records = dataset.facturas.map(f => ({
        id: f.correlativo || `FAC-${Date.now()}`,
        numero_control: f.numeroControl || f.correlativo,
        fecha: f.fecha || new Date().toISOString().split('T')[0],
        cliente_nombre: f.clienteNombre || '',
        cliente_rif: f.clienteRif || 'N/A',
        monto_total: Number(f.total) || 0,
        monto_pagado: f.estado === 'PAGADA' ? Number(f.total) : 0,
        estado: f.estado || 'EMITIDA',
        division: f.division || 'TECNOLOGIA',
        items_json: f.items || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('facturas_ventas').upsert(records, { onConflict: 'id' });
      if (error) throw error;
      resumen['facturas_ventas'] = { total, insertados: total };
      onProgress?.('facturas_ventas', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando facturas_ventas:', err);
      resumen['facturas_ventas'] = { total, insertados: 0, error: err.message };
      onProgress?.('facturas_ventas', 0, total, 'ERROR', err.message);
    }
  }

  // 6. MIGRAR SOLICITUDES CLIENTES A BUFFER_COTIZACIONES
  if (dataset.solicitudesClientes && dataset.solicitudesClientes.length > 0) {
    const total = dataset.solicitudesClientes.length;
    onProgress?.('Buffer_Cotizaciones', 0, total, 'PROCESANDO');
    try {
      const records = dataset.solicitudesClientes.map(s => ({
        id_solicitud: s.id || s.correlativo,
        fecha_hora: s.fecha || new Date().toISOString(),
        cliente_nombre: s.clienteNombre || '',
        cliente_rif: s.clienteRif || 'N/A',
        telefono: s.telefono || '',
        email: s.email || '',
        edificio_ubicacion: s.edificioUbicacion || '',
        cantidad_ascensores: Number(s.cantidadAscensores) || 1,
        tipo_servicio_solicitado: s.tipoServicioSolicitado || 'MANTENIMIENTO',
        detalles_requerimiento: s.detallesRequerimiento || '',
        estado_gestion: s.estado === 'CONSOLIDADO' ? 'CONSOLIDADO_EN_MASTER' : (s.estado || 'PENDIENTE_GESTOR'),
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('Buffer_Cotizaciones').upsert(records, { onConflict: 'id_solicitud' });
      if (error) throw error;
      resumen['Buffer_Cotizaciones'] = { total, insertados: total };
      onProgress?.('Buffer_Cotizaciones', total, total, 'OK');
    } catch (err: any) {
      console.error('Error migrando Buffer_Cotizaciones:', err);
      resumen['Buffer_Cotizaciones'] = { total, insertados: 0, error: err.message };
      onProgress?.('Buffer_Cotizaciones', 0, total, 'ERROR', err.message);
    }
  }

  return { success: true, resumen };
}

/**
 * Descarga todos los datos desde Supabase PostgreSQL para poblar o actualizar el ERP
 */
export async function pullAllDataFromSupabase(): Promise<{
  clientes?: any[];
  productos?: any[];
  presupuestos?: any[];
  reportesTecnicos?: any[];
  facturas?: any[];
  bufferCotizaciones?: any[];
  bufferReportes?: any[];
}> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  const results: any = {};

  // 1. Clientes
  const { data: cliData } = await supabase.from('clientes_equipos').select('*');
  if (cliData) {
    results.clientes = cliData.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      rif: c.rif,
      telefono: c.telefono,
      email: c.email,
      direccion: c.direccion,
      tipoFacturacionPreferida: c.tipo_facturacion,
      division: c.division,
      equipos: Array.isArray(c.equipos_json) ? c.equipos_json : [],
      estado: c.estado || 'ACTIVO',
      createdAt: c.created_at
    }));
  }

  // 2. Inventario
  const { data: prodData } = await supabase.from('inventario_repuestos').select('*');
  if (prodData) {
    results.productos = prodData.map((p: any) => ({
      val_c: p.val_c,
      c_fabrica: p.codigo_fabrica,
      descripcion: p.descripcion,
      ubicacion: p.ubicacion,
      categoria: p.categoria,
      stock: Number(p.stock) || 0,
      minimo: Number(p.minimo) || 0,
      costoUSD: Number(p.costo_usd) || 0,
      precioUSD: Number(p.precio_usd) || 0,
      division: p.division,
      fotoUrl: p.foto_url,
      estado: p.estado || 'ACTIVO'
    }));
  }

  // 3. Presupuestos
  const { data: presData } = await supabase.from('presupuestos').select('*');
  if (presData) {
    results.presupuestos = presData.map((p: any) => ({
      id: p.id,
      correlativo: p.correlativo || p.id,
      fecha: p.fecha,
      clienteNombre: p.cliente_nombre,
      clienteRif: p.cliente_rif,
      subtotal: Number(p.subtotal) || 0,
      iva: Number(p.iva) || 0,
      total: Number(p.total) || 0,
      items: Array.isArray(p.items_json) ? p.items_json : [],
      estado: p.estado || 'PENDIENTE',
      division: p.division || 'TECNOLOGIA',
      observaciones: p.observaciones,
      origenSolicitudId: p.origen_solicitud_id
    }));
  }

  // 4. Reportes Técnicos
  const { data: repData } = await supabase.from('reportes_tecnicos').select('*');
  if (repData) {
    results.reportesTecnicos = repData.map((r: any) => ({
      id: r.id,
      correlativo: r.correlativo || r.id,
      fecha: r.fecha,
      clienteNombre: r.cliente_nombre,
      tecnicoNombre: r.tecnico_nombre,
      equipoAscensor: r.equipo_ascensor,
      ubicacionObra: r.ubicacion_obra,
      tipoServicio: r.tipo_servicio,
      diagnosticoDanio: r.diagnostico_danio,
      trabajosRealizados: r.trabajos_realizados,
      repuestosFaltantes: Array.isArray(r.repuestos_faltantes_json) ? r.repuestos_faltantes_json : [],
      fotos: Array.isArray(r.fotos_json) ? r.fotos_json : [],
      estado: r.estado || 'COMPLETADO',
      division: r.division || 'TECNOLOGIA',
      origenTransaccionId: r.origen_transaccion_id
    }));
  }

  // 5. Facturas
  const { data: facData } = await supabase.from('facturas_ventas').select('*');
  if (facData) {
    results.facturas = facData.map((f: any) => ({
      correlativo: f.id,
      numeroControl: f.numero_control,
      fecha: f.fecha,
      clienteNombre: f.cliente_nombre,
      clienteRif: f.cliente_rif,
      subtotal: Number(f.monto_total) / 1.16,
      iva: Number(f.monto_total) - (Number(f.monto_total) / 1.16),
      total: Number(f.monto_total) || 0,
      estado: f.estado || 'EMITIDA',
      division: f.division || 'TECNOLOGIA',
      items: Array.isArray(f.items_json) ? f.items_json : []
    }));
  }

  return results;
}

/**
 * Aplica Soft Delete a cualquier registro cambiando su columna 'estado' o 'estado_gestion' a 'ARCHIVADO'
 */
export async function softDeleteRecord(
  tableName: string,
  idColumn: string,
  idValue: string | number,
  statusColumn: string = 'estado'
): Promise<{ exito: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { exito: false, error: 'Supabase no configurado' };
  }

  try {
    const updateObj: Record<string, any> = {};
    updateObj[statusColumn] = 'ARCHIVADO';
    updateObj['updated_at'] = new Date().toISOString();

    const { error } = await supabase
      .from(tableName)
      .update(updateObj)
      .eq(idColumn, idValue);

    if (error) {
      return { exito: false, error: error.message };
    }
    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

// ============================================================================
// 5. SCRIPT SQL OFICIAL PARA CONFIGURAR SUPABASE (Copiar en SQL Editor)
// ============================================================================

export const SUPABASE_SQL_INIT_SCHEMA = `-- ============================================================================
-- AXON ELEVADORES - ESQUEMA SUPABASE POSTGRESQL + STORAGE BUCKET "evidencias"
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. EXTENSIONES Y BUCKET DE ALMACENAMIENTO DE FOTOGRAFÍAS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para el bucket "evidencias" (Lectura pública y Subida anónima)
CREATE POLICY "Permitir lectura publica de evidencias" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'evidencias');

CREATE POLICY "Permitir subida publica/autenticada de evidencias" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'evidencias');

CREATE POLICY "Permitir actualizacion de evidencias" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'evidencias');

-- 2. TABLA BUFFER DE COTIZACIONES WEB (Portal Clientes)
CREATE TABLE IF NOT EXISTS public."Buffer_Cotizaciones" (
  id_solicitud TEXT PRIMARY KEY,
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  cliente_nombre TEXT NOT NULL,
  cliente_rif TEXT DEFAULT 'N/A',
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  edificio_ubicacion TEXT NOT NULL,
  cantidad_ascensores INTEGER DEFAULT 1,
  tipo_servicio_solicitado TEXT NOT NULL,
  detalles_requerimiento TEXT,
  estado_gestion TEXT DEFAULT 'PENDIENTE_GESTOR', -- 'PENDIENTE_GESTOR', 'CONSOLIDADO_EN_MASTER', 'RECHAZADO', 'ARCHIVADO'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_buffer_cotiz_estado ON public."Buffer_Cotizaciones"(estado_gestion);
CREATE INDEX IF NOT EXISTS idx_buffer_cotiz_fecha ON public."Buffer_Cotizaciones"(fecha_hora DESC);

-- 3. TABLA BUFFER DE REPORTES TÉCNICOS EN OBRA (Portal Técnicos)
CREATE TABLE IF NOT EXISTS public."Buffer_Reportes_Tecnicos" (
  id_transaccion TEXT PRIMARY KEY,
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  codigo_tecnico TEXT NOT NULL,
  nombre_tecnico TEXT NOT NULL,
  cliente_obra TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  ascensor_equipo TEXT NOT NULL,
  diagnostico_falla TEXT NOT NULL,
  repuestos_solicitados_json JSONB DEFAULT '[]'::jsonb,
  fotos_json JSONB DEFAULT '[]'::jsonb,
  fotos_count INTEGER DEFAULT 0,
  estado_gestion TEXT DEFAULT 'PENDIENTE_GESTOR', -- 'PENDIENTE_GESTOR', 'CONSOLIDADO_EN_MASTER', 'RECHAZADO', 'ARCHIVADO'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buffer_rep_estado ON public."Buffer_Reportes_Tecnicos"(estado_gestion);
CREATE INDEX IF NOT EXISTS idx_buffer_rep_fecha ON public."Buffer_Reportes_Tecnicos"(fecha_hora DESC);

-- 4. TABLAS MAESTRAS DEL ERP (Para Consolidación y Soft Delete)
CREATE TABLE IF NOT EXISTS public."clientes_equipos" (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rif TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  tipo_facturacion TEXT DEFAULT 'AMBAS',
  division TEXT DEFAULT 'TECNOLOGIA',
  equipos_json JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'ARCHIVADO' (Soft Delete)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."inventario_repuestos" (
  val_c TEXT PRIMARY KEY,
  codigo_fabrica TEXT,
  descripcion TEXT NOT NULL,
  ubicacion TEXT,
  categoria TEXT DEFAULT 'REPUESTOS',
  stock NUMERIC(15,2) DEFAULT 0,
  minimo NUMERIC(15,2) DEFAULT 0,
  costo_usd NUMERIC(15,2) DEFAULT 0,
  precio_usd NUMERIC(15,2) DEFAULT 0,
  division TEXT DEFAULT 'TECNOLOGIA',
  foto_url TEXT,
  estado TEXT DEFAULT 'ACTIVO', -- 'ACTIVO', 'ARCHIVADO'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."presupuestos" (
  id TEXT PRIMARY KEY,
  correlativo TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_rif TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  iva NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  items_json JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'FACTURADO', 'ARCHIVADO' (Soft Delete)
  division TEXT DEFAULT 'TECNOLOGIA',
  observaciones TEXT,
  origen_solicitud_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."reportes_tecnicos" (
  id TEXT PRIMARY KEY,
  correlativo TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  tecnico_nombre TEXT NOT NULL,
  equipo_ascensor TEXT,
  ubicacion_obra TEXT,
  tipo_servicio TEXT,
  diagnostico_danio TEXT,
  trabajos_realizados TEXT,
  repuestos_faltantes_json JSONB DEFAULT '[]'::jsonb,
  fotos_json JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'COMPLETADO', -- 'COMPLETADO', 'PENDIENTE_PRESUPUESTO', 'ARCHIVADO'
  division TEXT DEFAULT 'TECNOLOGIA',
  origen_transaccion_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."facturas_ventas" (
  id TEXT PRIMARY KEY,
  numero_control TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  cliente_nombre TEXT NOT NULL,
  cliente_rif TEXT,
  monto_total NUMERIC(15,2) DEFAULT 0,
  monto_pagado NUMERIC(15,2) DEFAULT 0,
  estado TEXT DEFAULT 'EMITIDA', -- 'EMITIDA', 'PAGADA', 'ANULADA', 'ARCHIVADO' (Soft Delete)
  division TEXT DEFAULT 'TECNOLOGIA',
  items_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS) CON POLÍTICAS PÚBLICAS Y AUTENTICADAS
ALTER TABLE public."Buffer_Cotizaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Buffer_Reportes_Tecnicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."clientes_equipos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inventario_repuestos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."presupuestos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reportes_tecnicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."facturas_ventas" ENABLE ROW LEVEL SECURITY;

-- Políticas de inserción libre para portales web/técnicos
CREATE POLICY "Permitir insercion publica en Buffer_Cotizaciones" 
ON public."Buffer_Cotizaciones" FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir lectura general en Buffer_Cotizaciones" 
ON public."Buffer_Cotizaciones" FOR SELECT 
USING (true);

CREATE POLICY "Permitir actualizacion en Buffer_Cotizaciones" 
ON public."Buffer_Cotizaciones" FOR UPDATE 
USING (true);

CREATE POLICY "Permitir insercion publica en Buffer_Reportes_Tecnicos" 
ON public."Buffer_Reportes_Tecnicos" FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir lectura general en Buffer_Reportes_Tecnicos" 
ON public."Buffer_Reportes_Tecnicos" FOR SELECT 
USING (true);

CREATE POLICY "Permitir actualizacion en Buffer_Reportes_Tecnicos" 
ON public."Buffer_Reportes_Tecnicos" FOR UPDATE 
USING (true);

CREATE POLICY "Permitir todo en clientes_equipos" 
ON public."clientes_equipos" FOR ALL USING (true);

CREATE POLICY "Permitir todo en inventario_repuestos" 
ON public."inventario_repuestos" FOR ALL USING (true);

CREATE POLICY "Permitir todo en presupuestos" 
ON public."presupuestos" FOR ALL USING (true);

CREATE POLICY "Permitir todo en reportes_tecnicos" 
ON public."reportes_tecnicos" FOR ALL USING (true);

CREATE POLICY "Permitir todo en facturas_ventas" 
ON public."facturas_ventas" FOR ALL USING (true);
`;
