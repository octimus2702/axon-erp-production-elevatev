import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ReporteTecnicoCampo, Producto, Factura, Presupuesto, Cliente, ReciboNota, MovimientoContable, Nota as ValeDespacho } from '../types';

// Inicializar Firebase App (Reutilizar si existe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;

export const initGoogleAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el Token de acceso de Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  }
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getStoredAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Extraer ID de la hoja desde una URL de Google Sheets
export const extractSheetId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

// Esquema de pestañas y encabezados oficiales de Tecno Elevatev C.A.
export const SHEETS_SCHEMA: Record<string, string[]> = {
  "Reportes_Tecnicos": [
    "ID_Reporte", "Correlativo", "Fecha", "Cliente_Nombre", "Cliente_RIF", 
    "Ascensor_Ubicacion", "Tecnico_Responsable", "Tipo_Servicio", "Estado", 
    "Diagnostico_Danio", "Trabajos_Realizados", "Repuestos_Faltantes", "Monto_Estimado_USD",
    "Fotos_Cantidad", "Fotos_Evidencias"
  ],
  "Fotografias_Reportes": [
    "ID_Reporte", "Correlativo_Reporte", "Fecha", "Cliente_Nombre", "Equipo_Ascensor", "Tecnico_Responsable", "Nro_Foto", "URL_o_DataImagen"
  ],
  "Repuestos_Inventario": [
    "Codigo", "Modelo", "Descripcion", "Familia_Categoria", "Marca", "Stock", "Precio_USD", "Imagen_Referencia", "Division"
  ],
  "Fotografias_Repuestos": [
    "Codigo_SKU", "Modelo", "Descripcion", "Marca", "URL_o_DataImagen"
  ],
  "Facturas_Ventas": [
    "Numero_Factura", "Division", "Cliente_RIF", "Cliente_Nombre", "Total_USD", "Total_Bs", "Tasa_BCV", "Estado", "Fecha"
  ],
  "Recibos_Notas": [
    "Correlativo", "Fecha", "Tipo", "Cliente_RIF", "Cliente_Nombre", "Concepto", "Monto_USD", "Monto_Bs", "Forma_Pago", "Estado", "Division"
  ],
  "Movimientos_Contables": [
    "ID_Transaccion", "Fecha", "Tipo", "Categoria", "Descripcion", "Monto_USD", "Monto_Bs", "Comprobante_Ref", "Proveedor_Cliente", "Division"
  ],
  "Presupuestos": [
    "Numero_Cotizacion", "Cliente", "Division", "Total_USD", "Estado", "Fecha_Emision"
  ],
  "Clientes_Equipos": [
    "RIF_CI", "Nombre_Cliente", "Telefono", "Email", "Direccion", "Ascensores_Contratados"
  ],
  "Vales_Despacho": [
    "Nro_Vale", "Fecha", "Tipo_Despacho", "Destino", "Responsable", "Proyecto_Obra", "Items_Productos"
  ],
  "Buffer_Cotizaciones": [
    "ID_Solicitud", "Fecha_Hora", "Cliente_Nombre", "Cliente_RIF", "Telefono", "Email", "Edificio_Ubicacion", "Cantidad_Ascensores", "Tipo_Servicio_Solicitado", "Detalles_Requerimiento", "Estado_Gestion", "Fecha_Procesado"
  ],
  "Buffer_Reportes_Tecnicos": [
    "ID_Transaccion", "Fecha_Hora", "Codigo_Tecnico", "Nombre_Tecnico", "Cliente_Obra", "Ubicacion", "Ascensor_Equipo", "Diagnostico_Falla", "Repuestos_Solicitados_JSON", "Fotos_Evidencias_Count", "Fotos_JSON", "Estado_Gestion", "Fecha_Procesado"
  ]
};

/**
  Crear o buscar la Hoja de Cálculo en Google Drive
 */
export const findOrCreateSpreadsheet = async (
  token: string, 
  customSheetIdOrUrl?: string,
  companyName: string = 'Tecno_Elevatev'
): Promise<string> => {
  if (customSheetIdOrUrl && customSheetIdOrUrl.trim().length > 5) {
    const customId = extractSheetId(customSheetIdOrUrl);
    await ensureSheetHeaders(customId, token);
    return customId;
  }

  const safeCompanyName = companyName.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  const sheetTitle = `Axon_ERP_${safeCompanyName}_DB`;

  // 1. Buscar si ya existe una hoja con el nombre de la empresa en Google Drive
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name%20%3D%20'${sheetTitle}'%20and%20mimeType%20%3D%20'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%20%3D%20false`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const existingId = data.files[0].id;
        await ensureSheetHeaders(existingId, token);
        return existingId;
      }
    }
  } catch (err) {
    console.warn('Error al buscar hoja existente:', err);
  }

  // 2. Si no existe, crear la Hoja de Cálculo en blanco con la estructura inicial
  const createRes = await fetch('https://www.googleapis.com/sheets/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle
      },
      sheets: Object.keys(SHEETS_SCHEMA).map(title => ({
        properties: { title }
      }))
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error al crear la planilla de Google Sheets: ${errText}`);
  }

  const newSheetData = await createRes.json();
  const spreadsheetId = newSheetData.spreadsheetId;

  // 3. Escribir los encabezados en cada pestaña recién creada
  await ensureSheetHeaders(spreadsheetId, token);

  return spreadsheetId;
};

/**
  Garantizar que existan los encabezados en la Fila 1 de cada pestaña
 */
export const ensureSheetHeaders = async (spreadsheetId: string, token: string) => {
  for (const sheetName of Object.keys(SHEETS_SCHEMA)) {
    const headers = SHEETS_SCHEMA[sheetName];
    try {
      // Verificar si ya tiene contenido en A1
      const checkRes = await fetch(
        `https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.values && data.values.length > 0) {
          // Ya tiene encabezados en la fila 1
          continue;
        }
      }

      // Si A1 está vacío, escribir los encabezados oficiales
      await fetch(
        `https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [headers]
          })
        }
      );
    } catch (e) {
      console.warn(`No se pudo verificar o escribir encabezados en pestaña ${sheetName}:`, e);
    }
  }
};

/**
  Añadir registros sin borrar ni reescribir datos existentes (Garantía de integridad)
 */
export const appendRowsToSheet = async (
  spreadsheetId: string,
  tabName: string,
  rows: any[][],
  token: string
) => {
  if (!rows || rows.length === 0) return;

  const url = `https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    const errData = await res.text();
    throw new Error(`Error al sincronizar datos en Google Sheets (${tabName}): ${errData}`);
  }

  return await res.json();
};

/**
  Sincronizar todo el lote de datos a Google Sheets
 */
export const syncAllDataToSheet = async (
  spreadsheetId: string,
  token: string,
  data: {
    reportes: ReporteTecnicoCampo[];
    products: Producto[];
    facturas: Factura[];
    presupuestos: Presupuesto[];
    clientes: Cliente[];
    recibos?: ReciboNota[];
    movimientosContables?: MovimientoContable[];
    vales?: ValeDespacho[];
  }
) => {
  await ensureSheetHeaders(spreadsheetId, token);

  // 1. Reportes Técnicos & Fotografías
  if (data.reportes && data.reportes.length > 0) {
    const rows = data.reportes.map(r => {
      const photosCount = r.photos ? r.photos.length : (r.fotosEvidenciaCount || 0);
      const photosLinks = r.photos && r.photos.length > 0 
        ? r.photos.slice(0, 3).join(' | ') 
        : 'Sin evidencias fotográficas';

      return [
        r.id,
        r.correlativo,
        r.fecha,
        r.clienteNombre,
        r.clienteRif || '',
        r.equipoAscensor,
        r.tecnicoNombre,
        r.tipoReporte,
        r.estado,
        r.diagnosticoDanio,
        r.detallesManualesPedidos || '',
        (r.repuestosFaltantes || []).map(p => `${p.cantidadRequerida}x ${p.repuestoNombre}`).join('; '),
        r.montoEstimadoRepuestosUSD || 0,
        photosCount,
        photosLinks
      ];
    });
    await appendRowsToSheet(spreadsheetId, 'Reportes_Tecnicos', rows, token);

    // 1b. Pestaña Dedicada de Fotografías de Inspección en Google Sheets
    const photoRows: (string | number)[][] = [];
    data.reportes.forEach(r => {
      if (r.photos && r.photos.length > 0) {
        r.photos.forEach((photoDataOrUrl, idx) => {
          photoRows.push([
            r.id,
            r.correlativo,
            r.fecha,
            r.clienteNombre,
            r.equipoAscensor,
            r.tecnicoNombre,
            `Foto #${idx + 1}`,
            photoDataOrUrl
          ]);
        });
      }
    });

    if (photoRows.length > 0) {
      await appendRowsToSheet(spreadsheetId, 'Fotografias_Reportes', photoRows, token);
    }
  }

  // 2. Repuestos / Inventario
  if (data.products && data.products.length > 0) {
    const rows = data.products.map(p => [
      p.val_c,
      p.val_mo,
      p.val_d,
      p.val_r,
      p.val_m,
      p.val_s,
      p.precioUSD || 0,
      p.imagenUrl || 'Sin foto de referencia'
    ]);
    await appendRowsToSheet(spreadsheetId, 'Repuestos_Inventario', rows, token);

    // Pestaña Dedicada de Fotografías de Repuestos
    const prodPhotoRows: (string | number)[][] = [];
    data.products.forEach(p => {
      if (p.imagenUrl) {
        prodPhotoRows.push([
          p.val_c,
          p.val_mo,
          p.val_d,
          p.val_m,
          p.imagenUrl
        ]);
      }
    });
    if (prodPhotoRows.length > 0) {
      await appendRowsToSheet(spreadsheetId, 'Fotografias_Repuestos', prodPhotoRows, token);
    }
  }

  // 3. Facturas
  if (data.facturas && data.facturas.length > 0) {
    const rows = data.facturas.map(f => [
      f.correlativo,
      f.division,
      f.clienteRif,
      f.clienteNombre,
      f.totalUSD,
      f.totalBs,
      f.tasaCambioBs,
      f.estado,
      f.fecha
    ]);
    await appendRowsToSheet(spreadsheetId, 'Facturas_Ventas', rows, token);
  }

  // 4. Recibos / Notas de Entrega
  if (data.recibos && data.recibos.length > 0) {
    const rows = data.recibos.map(rn => [
      rn.correlativo,
      rn.fecha,
      rn.tipo,
      rn.clienteRif,
      rn.clienteNombre,
      rn.concepto,
      rn.montoUSD,
      rn.montoBs,
      rn.formaPago,
      rn.status,
      rn.division
    ]);
    await appendRowsToSheet(spreadsheetId, 'Recibos_Notas', rows, token);
  }

  // 5. Movimientos Contables
  if (data.movimientosContables && data.movimientosContables.length > 0) {
    const rows = data.movimientosContables.map(m => [
      m.id,
      m.fecha,
      m.tipo,
      m.categoria,
      m.descripcion,
      m.montoUSD,
      m.montoBs,
      m.comprobanteReferencia || '',
      m.proveedorOCliente || '',
      m.division
    ]);
    await appendRowsToSheet(spreadsheetId, 'Movimientos_Contables', rows, token);
  }

  // 6. Presupuestos
  if (data.presupuestos && data.presupuestos.length > 0) {
    const rows = data.presupuestos.map(p => [
      p.correlativo,
      p.clienteNombre,
      p.division,
      p.totalUSD,
      p.estado,
      p.fecha
    ]);
    await appendRowsToSheet(spreadsheetId, 'Presupuestos', rows, token);
  }

  // 7. Clientes
  if (data.clientes && data.clientes.length > 0) {
    const rows = data.clientes.map(c => [
      c.rif,
      c.razonSocial,
      c.telefono,
      c.email,
      c.direccion,
      (c.equipos || []).map(e => `${e.nombreEquipo} (${e.marca} ${e.modelo})`).join('; ')
    ]);
    await appendRowsToSheet(spreadsheetId, 'Clientes_Equipos', rows, token);
  }

  // 8. Vales de Despacho
  if (data.vales && data.vales.length > 0) {
    const rows = data.vales.map(v => [
      v.NroVale,
      v.Fecha,
      v.TipoDespacho || 'SALIDA',
      v.Destino,
      v.Responsable,
      v.ProyectoDesc || '',
      typeof v.Productos === 'string' ? v.Productos : JSON.stringify(v.Productos || [])
    ]);
    await appendRowsToSheet(spreadsheetId, 'Vales_Despacho', rows, token);
  }
};

/**
  Publicar un nuevo reporte técnico de campo a la Web App de Google Apps Script
 */
export const postReportToAppsScript = async (url: string, report: ReporteTecnicoCampo): Promise<boolean> => {
  let success = false;

  const photosCount = report.photos ? report.photos.length : (report.fotosEvidenciaCount || 0);
  const photosSummary = photosCount > 0 
    ? `${photosCount} Evidencia(s) Fotográfica(s) Anexada(s)` 
    : 'Sin evidencias fotográficas';

  // 1. Intentar POST a Google Apps Script Web App si se dispone de una URL activa
  if (url && url.startsWith('http') && !url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) {
    try {
      // Payload universal compatible tanto con 'guardarReporte' como con 'REPORTAR_INSPECCION_OBRA' (Buffer_Reportes_Tecnicos)
      const payload = {
        action: 'REPORTAR_INSPECCION_OBRA',
        tab: 'Buffer_Reportes_Tecnicos',
        ID_Transaccion: report.id,
        Fecha_Hora: `${report.fecha} ${new Date().toLocaleTimeString('es-VE')}`,
        Codigo_Tecnico: report.tecnicoNombre ? report.tecnicoNombre.replace(/\s+/g, '_').toUpperCase() : 'TEC-001',
        Nombre_Tecnico: report.tecnicoNombre,
        Cliente_Obra: report.clienteNombre,
        Ubicacion: report.ubicacionObra || report.clienteNombre,
        Ascensor_Equipo: report.equipoAscensor || 'Ascensor Principal',
        Diagnostico_Falla: report.diagnosticoDanio,
        Repuestos_Solicitados_JSON: JSON.stringify(report.repuestosFaltantes || []),
        Fotos_Evidencias_Count: photosCount,
        Fotos_JSON: JSON.stringify(report.photos || []),
        Estado_Gestion: 'PENDIENTE_GESTOR',

        // Parámetros compatibles con pestaña Reportes_Tecnicos directa y acción guardarReporte
        ID_Reporte: report.id,
        Correlativo: report.correlativo,
        Fecha: report.fecha,
        Cliente_Nombre: report.clienteNombre,
        Cliente_RIF: report.clienteRif || '',
        Ascensor_Ubicacion: `${report.ubicacionObra || report.clienteNombre} - ${report.equipoAscensor || ''}`.trim(),
        Tecnico_Responsable: report.tecnicoNombre,
        Tipo_Servicio: report.tipoReporte,
        Estado: report.estado,
        Diagnostico_Danio: report.diagnosticoDanio,
        Trabajos_Realizados: report.detallesManualesPedidos || '',
        Repuestos_Faltantes: (report.repuestosFaltantes || []).map(p => `${p.cantidadRequerida}x ${p.repuestoNombre}`).join('; '),
        Monto_Estimado_USD: report.montoEstimadoRepuestosUSD || 0,
        Fotos_Cantidad: photosCount,
        Fotos_Evidencias: photosSummary,
        photos: report.photos || [],
        Firma_Tecnico: (report.firmaTecnico || '').slice(0, 1000),
        Firma_Cliente: (report.firmaClienteObra || '').slice(0, 1000),
        Division: report.division || 'MANTENIMIENTO',
        division: report.division || 'MANTENIMIENTO',
        
        // Compatibilidad con Somerinca Apps Script
        NroVale: report.correlativo,
        Tipo: report.tipoReporte,
        Destino: report.clienteNombre,
        Responsable: report.tecnicoNombre,
        Observacion: report.diagnosticoDanio,
        Productos: report.detallesManualesPedidos || ''
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (res.ok || res.status === 0 || res.status === 200) {
        success = true;
      }

      console.log('Reporte Técnico publicado exitosamente a Google Apps Script:', report.correlativo);
    } catch (err) {
      console.warn('Error publicando reporte a Apps Script:', err);
    }
  }

  // 2. Intentar inserción directa vía Google Sheets REST API con OAuth si no se usó Apps Script
  if (!success) {
    try {
      const activeCompanyId = localStorage.getItem('axon_active_empresa_id') || 'SOLUCIONES_DAKACO';
      const savedToken = localStorage.getItem('tecno_google_access_token') || getStoredAccessToken();
      const savedSheetId = localStorage.getItem('axon_sheet_id') || 
                           localStorage.getItem('tecno_google_sheet_id') ||
                           localStorage.getItem(`axon_sheet_id_${activeCompanyId}`) ||
                           localStorage.getItem('axon_sheet_id_SOLUCIONES_DAKACO') ||
                           localStorage.getItem('axon_sheet_id_TECNO_ELEVATEV');
      if (savedToken && savedSheetId) {
        const row = [
          report.id,
          report.correlativo,
          report.fecha,
          report.clienteNombre,
          report.clienteRif || '',
          report.equipoAscensor || report.ubicacionObra || '',
          report.tecnicoNombre,
          report.tipoReporte,
          report.estado,
          report.diagnosticoDanio,
          report.detallesManualesPedidos || '',
          (report.repuestosFaltantes || []).map(p => `${p.cantidadRequerida}x ${p.repuestoNombre}`).join('; '),
          report.montoEstimadoRepuestosUSD || 0,
          photosCount,
          photosSummary,
          report.division || 'MANTENIMIENTO'
        ];
        await appendRowsToSheet(savedSheetId, 'Reportes_Tecnicos', [row], savedToken);

        // Agregar fotografías en la pestaña Fotografias_Reportes
        if (report.photos && report.photos.length > 0) {
          const photoRows = report.photos.map((p, idx) => [
            report.id,
            report.correlativo,
            report.fecha,
            report.clienteNombre,
            report.equipoAscensor || report.ubicacionObra || '',
            report.tecnicoNombre,
            `Foto #${idx + 1}`,
            (p || '').slice(0, 45000)
          ]);
          await appendRowsToSheet(savedSheetId, 'Fotografias_Reportes', photoRows, savedToken).catch(() => {});
        }
        success = true;
      }
    } catch (err) {
      console.warn('Error enviando reporte por API directa Google Sheets:', err);
    }
  }

  return success;
};

/**
 * Publicar una Nota / Vale / Movimiento a la Web App de Google Apps Script
 */
export const postNotaToAppsScript = async (url: string, nota: {
  NroVale: string;
  Fecha?: string;
  Tipo: string;
  Destino?: string;
  Responsable?: string;
  Observacion?: string;
  Productos?: any;
  tab?: string;
  clienteRif?: string;
  montoUSD?: number;
  montoBs?: number;
  division?: string;
}): Promise<boolean> => {
  if (!url || !url.startsWith('http') || url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) return false;
  try {
    let prodsFormatted = '[]';
    if (typeof nota.Productos === 'string') {
      try {
        JSON.parse(nota.Productos);
        prodsFormatted = nota.Productos;
      } catch {
        prodsFormatted = JSON.stringify([{ codigo: 'GEN', descripcion: nota.Productos, cantidad: 1 }]);
      }
    } else if (Array.isArray(nota.Productos)) {
      prodsFormatted = JSON.stringify(nota.Productos);
    } else if (nota.Productos && typeof nota.Productos === 'object') {
      prodsFormatted = JSON.stringify([nota.Productos]);
    } else {
      prodsFormatted = JSON.stringify([{ codigo: 'GEN', descripcion: String(nota.Observacion || 'Registro'), cantidad: 1 }]);
    }

    // Determinar la pestaña de destino según el tipo
    let targetTab = nota.tab || 'Notas';
    const tUpper = nota.Tipo.toUpperCase();
    if (tUpper.includes('FACTURA') || tUpper.includes('VENTA')) {
      targetTab = 'Facturas_Ventas';
    } else if (tUpper.includes('RECIBO') || tUpper.includes('ENTREGA')) {
      targetTab = 'Recibos_Notas';
    } else if (tUpper.includes('INGRESO') || tUpper.includes('EGRESO') || tUpper.includes('MOVIMIENTO') || tUpper.includes('CONTABLE')) {
      targetTab = 'Movimientos_Contables';
    } else if (tUpper.includes('PRESUPUESTO') || tUpper.includes('COTIZACION')) {
      targetTab = 'Presupuestos';
    } else if (tUpper.includes('DESPACHO') || tUpper.includes('VALE') || tUpper.includes('SALIDA')) {
      targetTab = 'Vales_Despacho';
    }

    const payload = {
      action: 'guardarNota',
      tab: targetTab,
      NroVale: nota.NroVale,
      Fecha: nota.Fecha || new Date().toLocaleString(),
      Tipo: nota.Tipo,
      Destino: nota.Destino || 'General',
      Responsable: nota.Responsable || 'Operador',
      Observacion: nota.Observacion || '',
      Productos: prodsFormatted,

      // Mapeo amplio para scripts estructurados (Facturas, Recibos, Contabilidad)
      Numero_Factura: nota.NroVale,
      Numero_Cotizacion: nota.NroVale,
      Correlativo: nota.NroVale,
      ID_Transaccion: nota.NroVale,
      Cliente_Nombre: nota.Destino || '',
      Cliente: nota.Destino || '',
      Cliente_RIF: nota.clienteRif || '',
      Concepto: nota.Observacion || '',
      Total_USD: nota.montoUSD || 0,
      Monto_USD: nota.montoUSD || 0,
      Monto_Bs: nota.montoBs || 0,
      Total_Bs: nota.montoBs || 0,
      Division: nota.division || 'OPERACIONES',
      Estado: 'EMITIDA'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    console.log(`Registro (${targetTab}) enviado a Apps Script:`, nota.NroVale);
    return res.ok;
  } catch (err) {
    console.warn('Error guardando nota en Apps Script:', err);
    return false;
  }
};

/**
 * Publicar/Actualizar un producto en la hoja "Datos" de Apps Script
 */
export const postProductoToAppsScript = async (url: string, prod: {
  val_c: string;
  val_d?: string;
  val_mo?: string;
  val_b?: string;
  val_m?: string;
  val_r?: string;
  val_esp?: string;
  val_s?: number;
  val_u?: string;
  precioUSD?: number;
  imagenUrl?: string;
  division?: string;
}): Promise<boolean> => {
  let success = false;

  // 1. Intentar POST a Google Apps Script Web App si se dispone de una URL activa
  if (url && url.startsWith('http') && !url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) {
    try {
      const payload = {
        action: 'editarProducto',
        tab: 'Repuestos_Inventario',
        Codigo: prod.val_c,
        Modelo: prod.val_mo || '',
        Descripcion: prod.val_d || '',
        Familia_Categoria: prod.val_r || 'General',
        Marca: prod.val_m || 'Genérico',
        Stock: prod.val_s !== undefined ? prod.val_s : 0,
        Precio_USD: prod.precioUSD || 0,
        Imagen_Referencia: prod.imagenUrl || 'Sin foto',
        Division: prod.division || 'MANTENIMIENTO',
        val_c: prod.val_c,
        val_d: prod.val_d || '',
        val_mo: prod.val_mo || '',
        val_b: prod.val_b || prod.val_c,
        val_m: prod.val_m || '',
        val_r: prod.val_r || '',
        val_esp: prod.val_esp || '',
        val_s: prod.val_s !== undefined ? prod.val_s : 0,
        val_u: prod.val_u || 'Und',
        precioUSD: prod.precioUSD || 0,
        imagenUrl: prod.imagenUrl || '',
        division: prod.division || 'MANTENIMIENTO'
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      success = res.ok;
      console.log(`Producto (${prod.val_c}) enviado a Apps Script Google Sheets:`, prod.val_d);
    } catch (err) {
      console.warn('Error editando producto en Apps Script:', err);
    }
  }

  // 2. Intentar inserción directa vía Google Sheets REST API con OAuth si está iniciado sesión
  try {
    const savedToken = localStorage.getItem('tecno_google_access_token') || getStoredAccessToken();
    const savedSheetId = localStorage.getItem('axon_sheet_id') || 
                         localStorage.getItem('tecno_google_sheet_id') ||
                         localStorage.getItem('axon_sheet_id_TECNO_ELEVATEV') ||
                         localStorage.getItem('axon_sheet_id_SOLUCIONES_DAKACO');
    if (savedToken && savedSheetId) {
      const row = [
        prod.val_c,
        prod.val_mo || '',
        prod.val_d || '',
        prod.val_r || 'General',
        prod.val_m || 'Genérico',
        prod.val_s !== undefined ? prod.val_s : 0,
        prod.precioUSD || 0,
        prod.imagenUrl || 'Sin foto'
      ];
      await appendRowsToSheet(savedSheetId, 'Repuestos_Inventario', [row], savedToken);
      success = true;
    }
  } catch (err) {
    console.warn('Error enviando producto por API directa Google Sheets:', err);
  }

  return success;
};

/**
 * Traer todos los datos completos (Datos, Repuestos_Inventario, Fotografias_Repuestos, Presupuestos, etc.) desde Apps Script
 */
export const pullAllDataFromAppsScript = async (url: string): Promise<{
  Datos?: any[];
  Usuarios?: any[];
  Notas?: any[];
  Mensajes?: any[];
  Repuestos_Inventario?: any[];
  Fotografias_Repuestos?: any[];
  Presupuestos?: any[];
  Reportes_Tecnicos?: any[];
  Fotografias_Reportes?: any[];
  [key: string]: any;
} | null> => {
  if (!url || !url.startsWith('http') || url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) return null;
  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=obtenerDatos`;
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        if (Array.isArray(json.data)) {
          const sheetName = json.sheetName || 'Repuestos_Inventario';
          return {
            Repuestos_Inventario: json.data,
            Inventario: json.data,
            Datos: json.data,
            [sheetName]: json.data
          };
        } else if (typeof json.data === 'object') {
          return json.data;
        }
      } else if (json && Array.isArray(json)) {
        return {
          Repuestos_Inventario: json,
          Inventario: json,
          Datos: json
        };
      }
    }
  } catch (err) {
    console.warn('Error al obtener datos completos de Apps Script:', err);
  }
  return null;
};

/**
  Obtener todos los datos directamente desde Google Sheets REST API v4 usando OAuth Token
 */
export const pullDataFromGoogleSheetsDirect = async (
  spreadsheetId: string, 
  token: string
): Promise<Record<string, any[]> | null> => {
  if (!spreadsheetId || !token) return null;
  try {
    const result: Record<string, any[]> = {};
    const tabNames = Object.keys(SHEETS_SCHEMA);

    for (const tabName of tabNames) {
      try {
        const url = `https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:Z1000`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.values && json.values.length > 1) {
            const headers = json.values[0] as string[];
            const rows = json.values.slice(1).map((row: any[]) => {
              const rowObj: Record<string, any> = {};
              headers.forEach((h, idx) => {
                rowObj[h] = row[idx] !== undefined ? row[idx] : '';
              });
              return rowObj;
            });
            result[tabName] = rows;
          }
        }
      } catch (e) {
        console.warn(`Error al leer pestaña ${tabName} desde Google Sheets REST API:`, e);
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('Error en pullDataFromGoogleSheetsDirect:', err);
  }
  return null;
};

/**
  Push masivo de todos los reportes locales a la Web App de Google Apps Script
 */
export const pushAllReportsToAppsScript = async (url: string, reports: ReporteTecnicoCampo[]) => {
  if (!url || !url.startsWith('http') || url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO') || !reports || reports.length === 0) return;
  try {
    const formattedRows = reports.map(r => {
      const photosCount = r.photos ? r.photos.length : (r.fotosEvidenciaCount || 0);
      const photosSummary = photosCount > 0 
        ? `${photosCount} Evidencia(s) Fotográfica(s) Anexada(s)` 
        : 'Sin evidencias fotográficas';

      return {
        ID_Reporte: r.id,
        Correlativo: r.correlativo,
        Fecha: r.fecha,
        Cliente_Nombre: r.clienteNombre,
        Cliente_RIF: r.clienteRif || '',
        Ascensor_Ubicacion: r.equipoAscensor || r.ubicacionObra || '',
        Tecnico_Responsable: r.tecnicoNombre,
        Tipo_Servicio: r.tipoReporte,
        Estado: r.estado,
        Diagnostico_Danio: r.diagnosticoDanio,
        Trabajos_Realizados: r.detallesManualesPedidos || '',
        Repuestos_Faltantes: (r.repuestosFaltantes || []).map(p => `${p.cantidadRequerida}x ${p.repuestoNombre}`).join('; '),
        Monto_Estimado_USD: r.montoEstimadoRepuestosUSD || 0,
        Fotos_Cantidad: photosCount,
        Fotos_Evidencias: photosSummary,
        Division: r.division || 'MANTENIMIENTO'
      };
    });

    // Reescritura masiva en tabla Reportes_Tecnicos
    const payload = {
      action: 'REWRITE_ALL',
      tab: 'Reportes_Tecnicos',
      data: formattedRows
    };

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Error en pushAllReportsToAppsScript:', err);
  }
};

/**
  Consulta pública vía Google Visualization API (GViz)
  Permite leer registros de la Hoja de Google Sheets sin necesidad de OAuth o Apps Script.
 */
export const fetchReportesFromGViz = async (sheetId: string): Promise<ReporteTecnicoCampo[] | null> => {
  if (!sheetId) return null;
  try {
    const cleanId = sheetId.trim();
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=Reportes_Tecnicos`;
    const res = await fetch(gvizUrl);
    if (!res.ok) return null;

    const text = await res.text();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;

    const jsonStr = text.substring(startIdx, endIdx + 1);
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.table || !parsed.table.rows) return null;

    const cols: string[] = (parsed.table.cols || []).map((c: any) => (c && c.label) ? String(c.label).trim() : '');
    const rows = parsed.table.rows;

    if (rows.length === 0) return [];

    return rows.map((rowObj: any, idx: number) => {
      const cells = rowObj.c || [];
      const getValue = (colName: string, defaultIdx: number) => {
        const foundColIdx = cols.findIndex(c => c.toLowerCase() === colName.toLowerCase());
        const targetIdx = foundColIdx !== -1 ? foundColIdx : defaultIdx;
        const cell = cells[targetIdx];
        if (!cell || cell.v === null || cell.v === undefined) return '';
        return String(cell.v);
      };

      const rawEvidencias = getValue('Fotos_Evidencias', 14);
      let parsedPhotos: string[] = [];
      if (rawEvidencias && rawEvidencias !== 'Sin evidencias fotográficas') {
        parsedPhotos = rawEvidencias.split(' | ').filter(p => p.trim().length > 0);
      }

      return {
        id: getValue('ID_Reporte', 0) || `REP-GVIZ-${idx}-${Date.now()}`,
        correlativo: getValue('Correlativo', 1) || `REP-2026-${(idx + 1).toString().padStart(3, '0')}`,
        fecha: getValue('Fecha', 2) || new Date().toISOString().split('T')[0],
        clienteNombre: getValue('Cliente_Nombre', 3) || 'Cliente Sincronizado',
        clienteRif: getValue('Cliente_RIF', 4) || '',
        ubicacionObra: getValue('Ascensor_Ubicacion', 5) || '',
        equipoAscensor: getValue('Ascensor_Ubicacion', 5) || 'Ascensor Principal',
        tecnicoNombre: getValue('Tecnico_Responsable', 6) || 'Técnico de Campo',
        tipoReporte: (getValue('Tipo_Servicio', 7) as any) || 'INSPECCION_DANIOS',
        prioridadAtencion: 'NORMAL',
        diagnosticoDanio: getValue('Diagnostico_Danio', 9) || 'Sin diagnóstico',
        detallesManualesPedidos: getValue('Trabajos_Realizados', 10) || '',
        repuestosFaltantes: getValue('Repuestos_Faltantes', 11) ? [{
          id: `rep-gviz-${idx}`,
          repuestoNombre: getValue('Repuestos_Faltantes', 11),
          cantidadRequerida: 1,
          prioridad: 'ALTA'
        }] : [],
        requierePresupuesto: Boolean(parseFloat(getValue('Monto_Estimado_USD', 12)) > 0),
        montoEstimadoRepuestosUSD: parseFloat(getValue('Monto_Estimado_USD', 12)) || 0,
        fotosEvidenciaCount: parsedPhotos.length,
        photos: parsedPhotos,
        firmaTecnico: '',
        firmaClienteObra: '',
        estado: (getValue('Estado', 8) as any) || 'REPUESTOS_SOLICITADOS',
        division: 'MANTENIMIENTO'
      };
    });
  } catch (err) {
    console.warn('Error fetching GViz Google Sheet:', err);
    return null;
  }
};

/**
 * Enviar solicitud de cotización recibida desde el Portal Web directamente a Google Apps Script / Google Sheets
 */
export const postSolicitudCotizacionToAppsScript = async (
  url: string,
  sol: {
    id: string;
    correlativo: string;
    fecha: string;
    hora: string;
    clienteNombre: string;
    clienteRif?: string;
    personaContacto: string;
    telefono: string;
    email?: string;
    edificioUbicacion: string;
    apartamentoTorre?: string;
    tipoServicio: string;
    paradas?: number;
    capacidadPersonas?: number;
    detalles: string;
    estado: string;
  }
): Promise<boolean> => {
  let success = false;

  // 1. Intentar POST a Google Apps Script Web App si se dispone de una URL activa
  if (url && url.startsWith('http') && !url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) {
    try {
      const payload = {
        action: 'SOLICITAR_COTIZACION_WEB',
        tab: 'Buffer_Cotizaciones',
        ID_Solicitud: sol.id,
        Correlativo: sol.correlativo,
        Fecha_Hora: `${sol.fecha} ${sol.hora}`,
        Cliente_Nombre: sol.clienteNombre,
        Cliente_RIF: sol.clienteRif || 'J-00000000-0',
        Contacto: sol.personaContacto,
        Telefono: sol.telefono,
        Email: sol.email || '',
        Edificio_Ubicacion: `${sol.edificioUbicacion} - ${sol.apartamentoTorre || ''}`.trim(),
        Cantidad_Ascensores: sol.paradas || 1,
        Tipo_Servicio_Solicitado: sol.tipoServicio,
        Detalles_Requerimiento: sol.detalles || 'Solicitud de cliente desde Portal Web',
        Estado_Gestion: sol.estado,
        Presupuesto_ERP: '',

        // Compatibilidad universal con Google Sheets / Apps Script en caso de scripts heredados
        NroVale: sol.correlativo,
        Numero_Cotizacion: sol.correlativo,
        Fecha: sol.fecha,
        Tipo: 'SOLICITUD_WEB',
        Destino: sol.clienteNombre,
        Responsable: sol.personaContacto || sol.clienteNombre,
        Observacion: `[SOLICITUD WEB - ${sol.tipoServicio}] Ubicación: ${sol.edificioUbicacion} | Tel: ${sol.telefono} | ${sol.detalles || ''}`,
        Productos: JSON.stringify([{ codigo: 'WEB-COTIZACION', descripcion: `${sol.tipoServicio} (${sol.paradas || 1} paradas)`, cantidad: 1 }])
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok || res.status === 0 || res.status === 200) {
        success = true;
        console.log('Solicitud de cotización sincronizada exitosamente con Google Apps Script:', sol.correlativo);
      }
    } catch (err) {
      console.warn('Error enviando solicitud a Apps Script:', err);
    }
  }

  // 2. Fallback: Inserción directa vía Google Sheets REST API con token OAuth si no se usó o falló Apps Script
  if (!success) {
    try {
      const activeCompanyId = localStorage.getItem('axon_active_empresa_id') || 'SOLUCIONES_DAKACO';
      const savedToken = localStorage.getItem('tecno_google_access_token') || getStoredAccessToken();
      const savedSheetId = localStorage.getItem('axon_sheet_id') || 
                           localStorage.getItem('tecno_google_sheet_id') ||
                           localStorage.getItem(`axon_sheet_id_${activeCompanyId}`) ||
                           localStorage.getItem('axon_sheet_id_SOLUCIONES_DAKACO') ||
                           localStorage.getItem('axon_sheet_id_TECNO_ELEVATEV');

      if (savedToken && savedSheetId) {
        const row = [
          sol.id,
          sol.correlativo,
          `${sol.fecha} ${sol.hora}`,
          sol.clienteNombre,
          sol.clienteRif || '',
          sol.personaContacto,
          sol.telefono,
          sol.email || '',
          `${sol.edificioUbicacion} - ${sol.apartamentoTorre || ''}`.trim(),
          sol.paradas || 1,
          sol.tipoServicio,
          sol.detalles || '',
          sol.estado
        ];
        await appendRowsToSheet(savedSheetId, 'Buffer_Cotizaciones', [row], savedToken).catch(async () => {
          // Intentar en pestaña alternativa si Buffer_Cotizaciones aún no existe
          await appendRowsToSheet(savedSheetId, 'Notas', [[
            sol.correlativo,
            sol.fecha,
            'SOLICITUD_WEB',
            sol.clienteNombre,
            sol.personaContacto,
            `[SOLICITUD ${sol.tipoServicio}] ${sol.edificioUbicacion} - Tel: ${sol.telefono} - ${sol.detalles}`,
            `[{"codigo":"WEB","descripcion":"${sol.tipoServicio}","cantidad":1}]`
          ]], savedToken);
        });
        success = true;
        console.log('Solicitud de cotización escrita directamente en Google Sheets vía REST API:', sol.correlativo);
      }
    } catch (err) {
      console.warn('Error escribiendo solicitud por API directa Google Sheets:', err);
    }
  }

  return success;
};

export const pullReportesFromAppsScript = async (url?: string, sheetIdFallback?: string): Promise<ReporteTecnicoCampo[] | null> => {
  if (url && url.startsWith('http') && !url.includes('AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO')) {
    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}tab=Reportes_Tecnicos`;
      const res = await fetch(fetchUrl);
      if (res.ok) {
        const json = await res.json();
        let rawList: any[] = [];
        
        if (json && Array.isArray(json.data)) {
          rawList = json.data;
        } else if (json && json.data && Array.isArray(json.data.Reportes_Tecnicos)) {
          rawList = json.data.Reportes_Tecnicos;
        } else if (json && Array.isArray(json.Reportes_Tecnicos)) {
          rawList = json.Reportes_Tecnicos;
        } else if (json && json.data && Array.isArray(json.data.Notas)) {
          rawList = json.data.Notas;
        } else if (json && json.data && Array.isArray(json.data.Datos)) {
          rawList = json.data.Datos;
        }

        if (rawList.length > 0) {
          return rawList.map((r: any, idx: number) => {
            const rawEvidencias = r.Fotos_Evidencias || r.photosLinks || r.photos;
            let parsedPhotos: string[] = [];
            if (Array.isArray(rawEvidencias)) {
              parsedPhotos = rawEvidencias;
            } else if (typeof rawEvidencias === 'string' && rawEvidencias.trim() !== '' && rawEvidencias !== 'Sin evidencias fotográficas') {
              parsedPhotos = rawEvidencias.split(' | ').filter(p => p.trim().length > 0);
            }

            return {
              id: r.ID_Reporte || r.id || `REP-SYNC-${idx}-${Date.now()}`,
              correlativo: r.Correlativo || r.NroVale || r.correlativo || `REP-2026-${(idx + 1).toString().padStart(3, '0')}`,
              fecha: r.Fecha || r.fecha ? String(r.Fecha || r.fecha).substring(0, 10) : new Date().toISOString().split('T')[0],
              clienteNombre: r.Cliente_Nombre || r.Destino || r.clienteNombre || 'Cliente Sincronizado',
              clienteRif: r.Cliente_RIF || r.clienteRif || '',
              ubicacionObra: r.Ascensor_Ubicacion || r.equipoAscensor || r.ubicacionObra || '',
              equipoAscensor: r.Ascensor_Ubicacion || r.equipoAscensor || 'Ascensor Principal',
              tecnicoNombre: r.Tecnico_Responsable || r.Responsable || r.tecnicoNombre || 'Técnico de Campo',
              tipoReporte: (r.Tipo_Servicio || r.Tipo || r.tipoReporte as any) || 'INSPECCION_DANIOS',
              prioridadAtencion: 'NORMAL',
              diagnosticoDanio: r.Diagnostico_Danio || r.Observacion || r.diagnosticoDanio || 'Sin diagnóstico reportado',
              detallesManualesPedidos: r.Trabajos_Realizados || r.Productos || r.detallesManualesPedidos || '',
              repuestosFaltantes: r.Repuestos_Faltantes ? [{
                id: `rep-s-${idx}`,
                repuestoNombre: String(r.Repuestos_Faltantes),
                cantidadRequerida: 1,
                prioridad: 'ALTA'
              }] : [],
              requierePresupuesto: Boolean(r.Monto_Estimado_USD && parseFloat(r.Monto_Estimado_USD) > 0),
              montoEstimadoRepuestosUSD: parseFloat(r.Monto_Estimado_USD || r.montoEstimadoRepuestosUSD) || 0,
              fotosEvidenciaCount: parsedPhotos.length,
              photos: parsedPhotos,
              firmaTecnico: r.Firma_Tecnico || r.firmaTecnico || '',
              firmaClienteObra: r.Firma_Cliente || r.firmaClienteObra || '',
              estado: (r.Estado || r.estado as any) || 'REPUESTOS_SOLICITADOS',
              division: (r.Division || r.division || r.Division_Operativa as any) || 'MANTENIMIENTO'
            };
          });
        }
      }
    } catch (err) {
      console.warn('Error obteniendo reportes de Apps Script:', err);
    }
  }

  // Fallback a GViz API directa de la Hoja de Google Sheets
  if (sheetIdFallback) {
    const gvizReports = await fetchReportesFromGViz(sheetIdFallback);
    if (gvizReports && gvizReports.length > 0) {
      return gvizReports;
    }
  }

  return null;
};

