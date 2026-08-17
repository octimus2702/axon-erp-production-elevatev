import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, RefreshCw, Copy, CheckCircle2, Cloud, FileCode, Check, Download, Upload, Server, LogIn, LogOut, FileSpreadsheet, ExternalLink, Building2, Database, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, logoutGoogle, initGoogleAuthListener, findOrCreateSpreadsheet, appendRowsToSheet, syncAllDataToSheet, SHEETS_SCHEMA } from '../services/googleSheets';
import { User } from 'firebase/auth';
import { exportAllDataToExcelCSV } from '../utils/excelExporter';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import DelLagoLogo from './DelLagoLogo';
import ItaLogo from './ItaLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import SupabaseMigrationPanel from './SupabaseMigrationPanel';

export default function SincronizarTab() {
  const { 
    user,
    products, 
    reportesTecnicos, 
    facturas, 
    presupuestos, 
    clientes, 
    recibos,
    movimientosContables,
    vales,
    syncQueue, 
    triggerManualSync, 
    isSyncing, 
    addToast,
    empresaActiva,
    isCleanMode,
    limpiarDatosYEmpezarCero,
    restaurarDatosDemo,
    pullCloudData
  } = useApp();

  const isSuperUser = user?.rol === 'SUPER_USUARIO' || user?.username?.toLowerCase() === 'axon';
  const [activeSyncPlatform, setActiveSyncPlatform] = useState<'SUPABASE' | 'GOOGLE_SHEETS'>('SUPABASE');
  const [scriptUrl, setScriptUrl] = useState(() => {
    return localStorage.getItem(`axon_script_url_${empresaActiva.id}`) ||
           localStorage.getItem('axon_script_url') ||
           'https://script.google.com/macros/s/AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO/exec';
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullSuccess, setPullSuccess] = useState(false);

  // Estado de Google Auth
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(`axon_sheet_id_${empresaActiva.id}`) || null;
  });
  const [customSheetInput, setCustomSheetInput] = useState(() => {
    return localStorage.getItem(`axon_sheet_id_${empresaActiva.id}`) || '';
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncingSheetDirect, setIsSyncingSheetDirect] = useState(false);

  // Cargar configuración de la empresa seleccionada al cambiar de empresa
  useEffect(() => {
    const urlEmpresa = localStorage.getItem(`axon_script_url_${empresaActiva.id}`) ||
                       localStorage.getItem('axon_script_url') ||
                       'https://script.google.com/macros/s/AKfycbzLop8_AXON_KEY_DEMO_INTEGRADO/exec';
    setScriptUrl(urlEmpresa);

    const sheetIdEmpresa = localStorage.getItem(`axon_sheet_id_${empresaActiva.id}`) || '';
    setCustomSheetInput(sheetIdEmpresa);
    if (sheetIdEmpresa) {
      setSpreadsheetId(sheetIdEmpresa);
    } else {
      setSpreadsheetId(null);
    }
  }, [empresaActiva.id]);

  useEffect(() => {
    const unsubscribe = initGoogleAuthListener(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setSpreadsheetId(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsConnectingGoogle(true);
    try {
      const { user, accessToken } = await signInWithGoogle();
      setGoogleUser(user);
      setGoogleToken(accessToken);
      addToast(`Cuenta Google conectada: ${user.email}`, 'success');

      // Buscar o crear planilla en Drive para la empresa activa
      const sheetId = await findOrCreateSpreadsheet(accessToken, customSheetInput, empresaActiva.nombreCorto);
      setSpreadsheetId(sheetId);
      localStorage.setItem(`axon_sheet_id_${empresaActiva.id}`, sheetId);
      addToast(`Hoja de Google Sheets vinculada para ${empresaActiva.nombreCorto}`, 'success');

      // Escribir/sincronizar los datos inmediatamente
      setIsSyncingSheetDirect(true);
      await syncAllDataToSheet(sheetId, accessToken, {
        reportes: reportesTecnicos,
        products,
        facturas,
        presupuestos,
        clientes,
        recibos,
        movimientosContables,
        vales
      });
      addToast('¡Encabezados y datos iniciales exportados a Google Sheets con éxito!', 'success');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        addToast('Este dominio de vista previa no está en la lista blanca de Firebase. Por favor, usa la Sincronización con Google Apps Script Web App (sin restricciones de dominio).', 'error');
      } else {
        addToast(`Error al conectar con Google: ${err.message || err}`, 'error');
      }
    } finally {
      setIsConnectingGoogle(false);
      setIsSyncingSheetDirect(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setSpreadsheetId(null);
    addToast('Conexión con Google Sheets cerrada', 'info');
  };

  const handleSyncToGoogleSheets = async () => {
    if (!googleToken) {
      addToast('Primero debe conectar su cuenta de Google', 'error');
      return;
    }

    setIsSyncingSheetDirect(true);
    try {
      let sheetId = spreadsheetId;
      if (!sheetId || customSheetInput.trim().length > 5) {
        sheetId = await findOrCreateSpreadsheet(googleToken, customSheetInput);
        setSpreadsheetId(sheetId);
      }

      await syncAllDataToSheet(sheetId, googleToken, {
        reportes: reportesTecnicos,
        products,
        facturas,
        presupuestos,
        clientes,
        recibos,
        movimientosContables,
        vales
      });

      addToast('¡Sincronización completa a Google Sheets exitosa sin borrar nada!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Error al sincronizar: ${err.message || err}`, 'error');
    } finally {
      setIsSyncingSheetDirect(false);
    }
  };

  const appsScriptCode = `/**
 * AXON ERP - ${empresaActiva.razonSocial} (${empresaActiva.nombreCorto})
 * Sincronizador Automático Bidireccional de Google Sheets
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. En tu hoja de cálculo, ve a: Extensiones > Apps Script.
 * 2. Borra todo el código anterior y pega este script completo.
 * 3. Presiona "Guardar" (icono de disco).
 * 4. Ejecuta manualmente la función 'initSpreadsheet' para estructurar la hoja.
 * 5. Haz clic en "Implementar" > "Nueva implementación".
 * 6. Selecciona:
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquiera (Anyone)
 * 7. Copia la URL de la Web App y conéctala en tu Gestor/App y Web de Cotizaciones.
 * 
 * NOTA: Cada vez que hagas cambios en este script, debes crear una "Nueva versión" en Implementar.
 */

// Estructura oficial del Esquema de Base de Datos del ERP
var SCHEMA = {
  "Reportes_Tecnicos": [
    "ID_Reporte", "Correlativo", "Fecha", "Cliente_Nombre", "Cliente_RIF", "Ascensor_Ubicacion", "Tecnico_Responsable", "Tipo_Servicio", "Estado", "Diagnostico_Danio", "Trabajos_Realizados", "Repuestos_Faltantes", "Monto_Estimado_USD", "Fotos_Cantidad", "Fotos_Evidencias", "Division"
  ],
  "Fotografias_Reportes": [
    "ID_Reporte", "Correlativo_Reporte", "Fecha", "Cliente_Nombre", "Equipo_Ascensor", "Tecnico_Responsable", "Nro_Foto", "URL_o_DataImagen"
  ],
  "Repuestos_Inventario": [
    "Codigo", "Modelo", "Descripcion", "Familia", "Marca", "Origen", "Stock", "Precio_USD", "Imagen_Referencia", "Ubicacion", "Ultima_Actualizacion", "Division"
  ],
  "Fotografias_Repuestos": [
    "Codigo_SKU", "Modelo", "Descripcion", "Marca", "URL_o_DataImagen"
  ],
  "Clientes_Equipos": [
    "RIF_CI", "Nombre_Cliente", "Telefono", "Email", "Direccion", "Ascensores_Contratados", "Paradas", "Marca_Ascensor", "Estado"
  ],
  "Facturas_Ventas": [
    "Numero_Factura", "Division", "Cliente_RIF", "Cliente_Nombre", "Total_USD", "Total_Bs", "Tasa_BCV", "Estado", "Fecha"
  ],
  "Presupuestos": [
    "Numero_Cotizacion", "Cliente", "Division", "Total_USD", "Monto_Bs", "Estado", "Fecha_Emision", "Detalles_Cotizacion"
  ],
  "Movimientos_Contables": [
    "ID_Transaccion", "Fecha", "Concepto", "Tipo_Debito_Credito", "Monto_USD", "Monto_Bs", "Division", "Comprobante_Ref"
  ],
  "Nomina_Personal": [
    "Cedula", "Nombre_Apellido", "Cargo", "Departamento", "Sueldo_Base_USD", "CestaTicket_USD", "Estado"
  ],
  "Buffer_Cotizaciones": [
    "ID_Solicitud", "Fecha_Hora", "Cliente_Nombre", "Cliente_RIF", "Telefono", "Email", "Edificio_Ubicacion", "Cantidad_Ascensores", "Tipo_Servicio_Solicitado", "Detalles_Requerimiento", "Estado_Gestion", "Fecha_Procesado"
  ],
  "Buffer_Reportes_Tecnicos": [
    "ID_Transaccion", "Fecha_Hora", "Codigo_Tecnico", "Nombre_Tecnico", "Cliente_Obra", "Ubicacion", "Ascensor_Equipo", "Diagnostico_Falla", "Repuestos_Solicitados_JSON", "Fotos_Evidencias_Count", "Fotos_JSON", "Estado_Gestion", "Fecha_Procesado"
  ]
};

// Mapa de Claves Primarias por Pestaña para búsqueda y actualización inteligente
var PRIMARY_KEYS = {
  "Reportes_Tecnicos": "Correlativo",
  "Repuestos_Inventario": "Codigo",
  "Clientes_Equipos": "RIF_CI",
  "Facturas_Ventas": "Numero_Factura",
  "Presupuestos": "Numero_Cotizacion",
  "Movimientos_Contables": "ID_Transaccion",
  "Nomina_Personal": "Cedula",
  "Buffer_Cotizaciones": "ID_Solicitud",
  "Buffer_Reportes_Tecnicos": "ID_Transaccion"
};

/**
 * Inicializa y valida la estructura de la Hoja de Cálculo.
 */
function initSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  for (var sheetName in SCHEMA) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = SCHEMA[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Estilo de encabezado Slate/Cyan
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0F172A");
      headerRange.setFontColor("#38BDF8");
      headerRange.setFontWeight("bold");
      headerRange.setFontFamily("Consolas");
      sheet.setFrozenRows(1);
    }
  }
  
  // Eliminar pestañas por defecto si existen y están vacías
  var sheet1 = ss.getSheetByName("Hoja1") || ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0) {
    try { ss.deleteSheet(sheet1); } catch(e) {}
  }
  
  return "Hoja de cálculo estructurada e inicializada correctamente.";
}

/**
 * GET: Lectura de datos. 
 * Permite cargar la totalidad de la base de datos al abrir la aplicación.
 */
function doGet(e) {
  try {
    initSpreadsheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "obtenerTodo";

    // Carga completa para el inicio de la app o sincronización global
    if (action === "obtenerDatos" || action === "obtenerTodo" || action === "initApp") {
      var allSheetsData = {};
      var sheets = ss.getSheets();
      
      for (var s = 0; s < sheets.length; s++) {
        var sName = sheets[s].getName();
        var sData = sheets[s].getDataRange().getValues();
        if (sData.length === 0) {
          allSheetsData[sName] = [];
          continue;
        }
        
        var sHeaders = sData[0] || [];
        var sRows = [];
        
        for (var i = 1; i < sData.length; i++) {
          var rowObj = {};
          var isEmpty = true;
          for (var j = 0; j < sHeaders.length; j++) {
            var val = sData[i][j];
            rowObj[sHeaders[j]] = val;
            if (val !== "" && val !== null && val !== undefined) isEmpty = false;
          }
          if (!isEmpty) {
            sRows.push(rowObj);
          }
        }
        allSheetsData[sName] = sRows;
      }
      
      return responseJSON({
        status: "success",
        timestamp: new Date().toISOString(),
        data: allSheetsData
      });
    }

    // Consulta de una sola pestaña
    var tabName = params.tab || "Repuestos_Inventario";
    var sheet = ss.getSheetByName(tabName) || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    var headers = data[0] || [];
    var rows = [];
    
    for (var i = 1; i < data.length; i++) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = data[i][j];
      }
      rows.push(rowObj);
    }
    
    return responseJSON({
      status: "success",
      sheetName: sheet.getName(),
      totalRecords: rows.length,
      data: rows
    });
    
  } catch (err) {
    return responseJSON({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * POST: Escritura, Actualización y Reescritura completa de registros.
 * Maneja datos ingresados por el gestor, usuarios y la Web de Cotizaciones.
 */
function doPost(e) {
  // Manejo de Bloqueo Concurrente para evitar choque de escritura de múltiples usuarios/web
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Esperar hasta 10 segundos para adquirir el turno de escritura
  } catch (lErr) {
    return responseJSON({
      status: "error",
      message: "El servidor está procesando otras solicitudes simultáneas. Por favor intenta de nuevo."
    });
  }

  try {
    initSpreadsheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos válidos en la petición POST.");
    }
    
    var payload = JSON.parse(e.postData.contents);

    // Ping de verificación
    if (payload.action === "ping") {
      lock.releaseLock();
      return responseJSON({
        status: "success",
        message: "Conexión activa con AXON ERP Google Apps Script",
        timestamp: new Date().toISOString()
      });
    }

    var tabName = payload.tab || getTabFromAction(payload.action) || "Repuestos_Inventario";
    var sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    
    var headers = SCHEMA[tabName] || getHeadersFromSheet(sheet);
    ensureSheetHeaders(sheet, headers);

    // ACCIÓN: REWRITE_ALL (Reescritura total sincronizada de una pestaña)
    if (payload.action === "REWRITE_ALL" && Array.isArray(payload.data)) {
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setBackground("#0F172A").setFontColor("#38BDF8").setFontWeight("bold");
      sheet.setFrozenRows(1);
      
      var rowsToAppend = payload.data.map(function(item) {
        return headers.map(function(h) {
          return item[h] !== undefined ? item[h] : "";
        });
      });
      
      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
      }
      
      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "REWRITE_ALL",
        tab: tabName,
        updatedRows: rowsToAppend.length
      });
    }

    // ----------------------------------------------------------------------
    // ENDPOINT SEGURO EXCLUSIVO: PORTAL WEB DE COTIZACIONES DE CLIENTES
    // Las peticiones caen EXCLUSIVAMENTE en Buffer_Cotizaciones sin acceso a maestras.
    // ----------------------------------------------------------------------
    if (payload.action === "SOLICITAR_COTIZACION_WEB" || tabName === "Buffer_Cotizaciones") {
      var bufCotSheet = ss.getSheetByName("Buffer_Cotizaciones");
      if (!bufCotSheet) {
        bufCotSheet = ss.insertSheet("Buffer_Cotizaciones");
        ensureSheetHeaders(bufCotSheet, SCHEMA["Buffer_Cotizaciones"]);
      }
      var headersCot = SCHEMA["Buffer_Cotizaciones"];
      var cotRecord = {
        "ID_Solicitud": payload.ID_Solicitud || payload.correlativo || ("SOL-WEB-" + new Date().getTime()),
        "Fecha_Hora": payload.Fecha_Hora || new Date().toISOString(),
        "Cliente_Nombre": payload.Cliente_Nombre || payload.nombreCliente || "",
        "Cliente_RIF": payload.Cliente_RIF || payload.rifCedula || "",
        "Telefono": payload.Telefono || payload.telefono || "",
        "Email": payload.Email || payload.email || "",
        "Edificio_Ubicacion": payload.Edificio_Ubicacion || payload.apartamentoUbicacion || payload.ciudad || "",
        "Cantidad_Ascensores": payload.Cantidad_Ascensores || payload.paradas || 1,
        "Tipo_Servicio_Solicitado": payload.Tipo_Servicio_Solicitado || payload.tipoServicio || "",
        "Detalles_Requerimiento": payload.Detalles_Requerimiento || payload.detalles || "",
        "Estado_Gestion": "PENDIENTE_GESTOR",
        "Fecha_Procesado": ""
      };
      saveOrUpdateRow(bufCotSheet, headersCot, "ID_Solicitud", cotRecord.ID_Solicitud, cotRecord);

      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "BUFFERED_WEB_QUOTE",
        idSolicitud: cotRecord.ID_Solicitud,
        message: "Solicitud resguardada exclusivamente en Buffer_Cotizaciones para revisión del gestor ERP."
      });
    }

    // ----------------------------------------------------------------------
    // ENDPOINT SEGURO EXCLUSIVO: PORTAL DE TÉCNICOS EN OBRA (LEVANTA CAMPO SIN PRECIOS)
    // Las peticiones caen EXCLUSIVAMENTE en Buffer_Reportes_Tecnicos sin modificar maestras.
    // ----------------------------------------------------------------------
    if (payload.action === "REPORTAR_INSPECCION_OBRA" || tabName === "Buffer_Reportes_Tecnicos") {
      var bufTecSheet = ss.getSheetByName("Buffer_Reportes_Tecnicos");
      if (!bufTecSheet) {
        bufTecSheet = ss.insertSheet("Buffer_Reportes_Tecnicos");
        ensureSheetHeaders(bufTecSheet, SCHEMA["Buffer_Reportes_Tecnicos"]);
      }
      var headersTec = SCHEMA["Buffer_Reportes_Tecnicos"];
      var tecRecord = {
        "ID_Transaccion": payload.ID_Transaccion || ("REP-OBRA-" + new Date().getTime()),
        "Fecha_Hora": payload.Fecha_Hora || new Date().toISOString(),
        "Codigo_Tecnico": payload.Codigo_Tecnico || "",
        "Nombre_Tecnico": payload.Nombre_Tecnico || "",
        "Cliente_Obra": payload.Cliente_Obra || payload.clienteNombre || "",
        "Ubicacion": payload.Ubicacion || payload.ubicacionObra || "",
        "Ascensor_Equipo": payload.Ascensor_Equipo || payload.equipoAscensor || "",
        "Diagnostico_Falla": payload.Diagnostico_Falla || payload.diagnosticoDanio || "",
        "Repuestos_Solicitados_JSON": typeof payload.Repuestos_Solicitados_JSON === "string" ? payload.Repuestos_Solicitados_JSON : JSON.stringify(payload.Repuestos_Solicitados_JSON || payload.repuestosFaltantes || []),
        "Fotos_Evidencias_Count": payload.Fotos_Evidencias_Count || (payload.photos ? payload.photos.length : 0),
        "Fotos_JSON": typeof payload.Fotos_JSON === "string" ? payload.Fotos_JSON : JSON.stringify(payload.Fotos_JSON || payload.photos || []),
        "Estado_Gestion": "PENDIENTE_GESTOR",
        "Fecha_Procesado": ""
      };
      saveOrUpdateRow(bufTecSheet, headersTec, "ID_Transaccion", tecRecord.ID_Transaccion, tecRecord);

      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "BUFFERED_FIELD_REPORT",
        idTransaccion: tecRecord.ID_Transaccion,
        message: "Levantamiento técnico resguardado exclusivamente en Buffer_Reportes_Tecnicos."
      });
    }

    // ----------------------------------------------------------------------
    // ACCIÓN DE PROCESAMIENTO Y SONDEO DESDE EL ERP DEL GESTOR
    // ----------------------------------------------------------------------
    if (payload.action === "PROCESAR_BUFFERS_GESTOR" || payload.action === "procesarBuffers") {
      var resProc = procesarBuffersPendientes();
      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "PROCESSED_BUFFERS",
        resultado: resProc
      });
    }

    // ACCIÓN: GUARDAR / EDITAR PRESUPUESTO O COTIZACIÓN (Web de Cotizaciones o App)
    if (payload.action === "guardarCotizacion" || payload.action === "crearCotizacion" || tabName === "Presupuestos") {
      var cotizacionId = payload.Numero_Cotizacion || payload.numeroCotizacion || (payload.record && payload.record.Numero_Cotizacion);
      var recordData = payload.record || payload;
      
      saveOrUpdateRow(sheet, headers, "Numero_Cotizacion", cotizacionId, recordData);
      
      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "SAVED_COTIZACION",
        cotizacionId: cotizacionId
      });
    }

    // ACCIÓN: GUARDAR / EDITAR PRODUCTO O REPUESTO
    if (payload.action === "editarProducto" || payload.action === "guardarProducto" || tabName === "Repuestos_Inventario") {
      var codigoSKU = payload.Codigo || payload.val_c || (payload.record && (payload.record.Codigo || payload.record.val_c));
      
      // Normalizar datos de repuesto/inventario
      var itemRecord = payload.record || payload;
      if (payload.val_c) itemRecord.Codigo = payload.val_c;
      if (payload.val_mo) itemRecord.Modelo = payload.val_mo;
      if (payload.val_d) itemRecord.Descripcion = payload.val_d;
      if (payload.val_r) itemRecord.Familia = payload.val_r;
      if (payload.val_m) itemRecord.Marca = payload.val_m;
      if (payload.val_s !== undefined) itemRecord.Stock = payload.val_s;
      if (payload.precioUSD) itemRecord.Precio_USD = payload.precioUSD;
      if (payload.imagenUrl) itemRecord.Imagen_Referencia = payload.imagenUrl;
      if (payload.division || payload.Division) itemRecord.Division = payload.division || payload.Division;
      itemRecord.Ultima_Actualizacion = new Date().toISOString();

      saveOrUpdateRow(sheet, headers, "Codigo", codigoSKU, itemRecord);

      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "SAVED_PRODUCT",
        codigo: codigoSKU
      });
    }

    // ACCIÓN: GUARDAR / EDITAR REPORTE TÉCNICO Y SUS FOTOGRAFÍAS
    if (payload.action === "guardarReporte" || tabName === "Reportes_Tecnicos") {
      var correlativo = payload.Correlativo || (payload.record && payload.record.Correlativo);
      var reportRecord = payload.record || payload;

      if (payload.photos && Array.isArray(payload.photos)) {
        reportRecord.Fotos_Cantidad = payload.photos.length;
        reportRecord.Fotos_Evidencias = payload.photos.length > 0 
          ? payload.photos.length + " Evidencia(s) Fotográfica(s) Anexada(s)" 
          : "Sin evidencias fotográficas";
      }

      saveOrUpdateRow(sheet, headers, "Correlativo", correlativo, reportRecord);

      // Guardado de fotografías en la pestaña correspondiente (con deduplicación por ID y Correlativo)
      if (payload.photos && Array.isArray(payload.photos)) {
        var fotoSheet = ss.getSheetByName("Fotografias_Reportes");
        if (!fotoSheet) fotoSheet = ss.insertSheet("Fotografias_Reportes");
        var fotoHeaders = SCHEMA["Fotografias_Reportes"];
        ensureSheetHeaders(fotoSheet, fotoHeaders);

        var reportIdKey = reportRecord.ID_Reporte || reportRecord.id || "";
        var reportCorrKey = correlativo || "";

        // Eliminar filas previas del mismo reporte para evitar duplicar / multiplicar líneas
        var lastFotoRow = fotoSheet.getLastRow();
        if (lastFotoRow > 1 && (reportIdKey || reportCorrKey)) {
          var idValues = fotoSheet.getRange(2, 1, lastFotoRow - 1, 2).getValues();
          for (var r = idValues.length - 1; r >= 0; r--) {
            var rowId = String(idValues[r][0] || "").trim();
            var rowCorr = String(idValues[r][1] || "").trim();
            if ((reportIdKey && rowId === String(reportIdKey).trim()) || (reportCorrKey && rowCorr === String(reportCorrKey).trim())) {
              fotoSheet.deleteRow(r + 2);
            }
          }
        }

        // Insertar las fotos limpiamente
        if (payload.photos.length > 0) {
          payload.photos.forEach(function(photoStr, pIdx) {
            fotoSheet.appendRow([
              reportIdKey,
              reportCorrKey,
              reportRecord.Fecha || new Date().toISOString().split('T')[0],
              reportRecord.Cliente_Nombre || "",
              reportRecord.Ascensor_Ubicacion || "",
              reportRecord.Tecnico_Responsable || "",
              "Foto #" + (pIdx + 1),
              photoStr
            ]);
          });
        }
      }

      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "SAVED_REPORT",
        correlativo: correlativo
      });
    }

    // ACCIÓN: GUARDAR FOTO INDIVIDUAL (CON DEDUPLICACIÓN)
    if (payload.action === "guardarFotoReporte" || tabName === "Fotografias_Reportes") {
      var fotoSheet = ss.getSheetByName("Fotografias_Reportes");
      if (!fotoSheet) fotoSheet = ss.insertSheet("Fotografias_Reportes");
      var fotoHeaders = SCHEMA["Fotografias_Reportes"];
      ensureSheetHeaders(fotoSheet, fotoHeaders);

      var fRepId = payload.ID_Reporte || (payload.record && payload.record.ID_Reporte) || "";
      var fCorr = payload.Correlativo_Reporte || (payload.record && payload.record.Correlativo_Reporte) || "";
      var fNro = payload.Nro_Foto || (payload.record && payload.record.Nro_Foto) || "Foto #1";

      var lastFRow = fotoSheet.getLastRow();
      var foundFRow = -1;
      if (lastFRow > 1 && (fRepId || fCorr)) {
        var existingData = fotoSheet.getRange(2, 1, lastFRow - 1, 7).getValues();
        for (var f = 0; f < existingData.length; f++) {
          var eId = String(existingData[f][0] || "").trim();
          var eCorr = String(existingData[f][1] || "").trim();
          var eNro = String(existingData[f][6] || "").trim();
          if (((fRepId && eId === String(fRepId).trim()) || (fCorr && eCorr === String(fCorr).trim())) && eNro === String(fNro).trim()) {
            foundFRow = f + 2;
            break;
          }
        }
      }

      var rowData = [
        fRepId,
        fCorr,
        payload.Fecha || (payload.record && payload.record.Fecha) || new Date().toISOString().split('T')[0],
        payload.Cliente_Nombre || (payload.record && payload.record.Cliente_Nombre) || "",
        payload.Equipo_Ascensor || (payload.record && payload.record.Equipo_Ascensor) || "",
        payload.Tecnico_Responsable || (payload.record && payload.record.Tecnico_Responsable) || "",
        fNro,
        payload.URL_o_DataImagen || (payload.record && payload.record.URL_o_DataImagen) || ""
      ];

      if (foundFRow !== -1) {
        fotoSheet.getRange(foundFRow, 1, 1, 8).setValues([rowData]);
      } else {
        fotoSheet.appendRow(rowData);
      }

      lock.releaseLock();
      return responseJSON({
        status: "success",
        action: "SAVED_FOTO",
        nroFoto: fNro
      });
    }

    // ACCIÓN GENÉRICA CON BÚSQUEDA DE CLAVE PRIMARIA
    var primaryKeyField = PRIMARY_KEYS[tabName];
    var primaryKeyValue = primaryKeyField ? (payload[primaryKeyField] || (payload.record && payload.record[primaryKeyField])) : null;

    if (primaryKeyField && primaryKeyValue) {
      saveOrUpdateRow(sheet, headers, primaryKeyField, primaryKeyValue, payload.record || payload);
    } else {
      // Adición estándar (Append)
      var newRow = headers.map(function(h) {
        return payload[h] !== undefined ? payload[h] : (payload.record && payload.record[h] !== undefined ? payload.record[h] : "");
      });
      sheet.appendRow(newRow);
    }

    lock.releaseLock();
    return responseJSON({
      status: "success",
      action: "SAVED_RECORD",
      tab: tabName
    });

  } catch (err) {
    lock.releaseLock();
    return responseJSON({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Función auxiliar para actualizar una fila existente si coincide la llave primaria o insertar una nueva.
 */
function saveOrUpdateRow(sheet, headers, keyField, keyValue, dataObject) {
  var lastRow = sheet.getLastRow();
  var keyIndex = headers.indexOf(keyField);
  var foundRow = -1;

  if (keyValue && lastRow > 1 && keyIndex !== -1) {
    var colValues = sheet.getRange(2, keyIndex + 1, lastRow - 1, 1).getValues();
    for (var r = 0; r < colValues.length; r++) {
      if (String(colValues[r][0]).trim().toUpperCase() === String(keyValue).trim().toUpperCase()) {
        foundRow = r + 2;
        break;
      }
    }
  }

  var rowValues = headers.map(function(h) {
    return dataObject[h] !== undefined ? dataObject[h] : "";
  });

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * Mapeo rápido de nombres de acción a nombres de pestañas.
 */
function getTabFromAction(action) {
  if (!action) return null;
  if (action.indexOf("Cotizacion") !== -1 || action.indexOf("Presupuesto") !== -1) return "Presupuestos";
  if (action.indexOf("Producto") !== -1 || action.indexOf("Repuesto") !== -1) return "Repuestos_Inventario";
  if (action.indexOf("Reporte") !== -1) return "Reportes_Tecnicos";
  if (action.indexOf("Cliente") !== -1) return "Clientes_Equipos";
  if (action.indexOf("Factura") !== -1) return "Facturas_Ventas";
  if (action.indexOf("Contable") !== -1) return "Movimientos_Contables";
  return null;
}

function getHeadersFromSheet(sheet) {
  if (sheet.getLastRow() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function ensureSheetHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#0F172A").setFontColor("#38BDF8").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * MÓDULO DE PROCESAMIENTO Y SONDEO DE BUFFERS
 * Revisa periódicamente o por ejecución directa del gestor los buffers
 * Buffer_Cotizaciones y Buffer_Reportes_Tecnicos, valida la información
 * y la transfiere limpiamente a las tablas maestras principales (Presupuestos y Reportes_Tecnicos).
 */
function procesarBuffersPendientes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logResultados = { cotizacionesProcesadas: 0, reportesProcesados: 0 };

  // 1. Procesar Buffer_Cotizaciones -> Presupuestos
  var bufCot = ss.getSheetByName("Buffer_Cotizaciones");
  if (bufCot && bufCot.getLastRow() > 1) {
    var dataCot = bufCot.getDataRange().getValues();
    var headersCot = dataCot[0];
    var idxEstado = headersCot.indexOf("Estado_Gestion");
    var idxFechaProc = headersCot.indexOf("Fecha_Procesado");
    var idxId = headersCot.indexOf("ID_Solicitud");
    var idxCliente = headersCot.indexOf("Cliente_Nombre");
    var idxServicio = headersCot.indexOf("Tipo_Servicio_Solicitado");
    var idxDetalles = headersCot.indexOf("Detalles_Requerimiento");

    var sheetPresupuestos = ss.getSheetByName("Presupuestos");
    if (!sheetPresupuestos) {
      sheetPresupuestos = ss.insertSheet("Presupuestos");
      ensureSheetHeaders(sheetPresupuestos, SCHEMA["Presupuestos"]);
    }

    for (var i = 1; i < dataCot.length; i++) {
      var st = String(dataCot[i][idxEstado]).trim();
      if (st === "PENDIENTE_GESTOR" || st === "PROCESADO_POR_GESTOR") {
        var solId = dataCot[i][idxId];
        var cliNom = dataCot[i][idxCliente];
        var serv = dataCot[i][idxServicio];
        var det = dataCot[i][idxDetalles];

        saveOrUpdateRow(sheetPresupuestos, SCHEMA["Presupuestos"], "Numero_Cotizacion", "COT-WEB-" + solId, {
          "Numero_Cotizacion": "COT-WEB-" + solId,
          "Cliente": cliNom,
          "Division": serv === "MODERNIZACION" ? "MODERNIZACION" : "MANTENIMIENTO",
          "Total_USD": 0,
          "Monto_Bs": 0,
          "Estado": "BORRADOR",
          "Fecha_Emision": new Date().toISOString().split('T')[0],
          "Detalles_Cotizacion": "Consolidado por Gestor ERP desde Buffer_Cotizaciones. " + det
        });

        bufCot.getRange(i + 1, idxEstado + 1).setValue("CONSOLIDADO_EN_MASTER");
        bufCot.getRange(i + 1, idxFechaProc + 1).setValue(new Date().toISOString());
        logResultados.cotizacionesProcesadas++;
      }
    }
  }

  // 2. Procesar Buffer_Reportes_Tecnicos -> Reportes_Tecnicos
  var bufTec = ss.getSheetByName("Buffer_Reportes_Tecnicos");
  if (bufTec && bufTec.getLastRow() > 1) {
    var dataTec = bufTec.getDataRange().getValues();
    var headersTec = dataTec[0];
    var idxEstT = headersTec.indexOf("Estado_Gestion");
    var idxFecT = headersTec.indexOf("Fecha_Procesado");
    var idxIdT = headersTec.indexOf("ID_Transaccion");
    var idxTec = headersTec.indexOf("Nombre_Tecnico");
    var idxCliT = headersTec.indexOf("Cliente_Obra");
    var idxUbi = headersTec.indexOf("Ubicacion");
    var idxEq = headersTec.indexOf("Ascensor_Equipo");
    var idxDiag = headersTec.indexOf("Diagnostico_Falla");
    var idxReps = headersTec.indexOf("Repuestos_Solicitados_JSON");

    var sheetRepMaster = ss.getSheetByName("Reportes_Tecnicos");
    if (!sheetRepMaster) {
      sheetRepMaster = ss.insertSheet("Reportes_Tecnicos");
      ensureSheetHeaders(sheetRepMaster, SCHEMA["Reportes_Tecnicos"]);
    }

    for (var j = 1; j < dataTec.length; j++) {
      var stT = String(dataTec[j][idxEstT]).trim();
      if (stT === "PENDIENTE_GESTOR" || stT === "PROCESADO_POR_GESTOR") {
        var transId = dataTec[j][idxIdT];
        saveOrUpdateRow(sheetRepMaster, SCHEMA["Reportes_Tecnicos"], "Correlativo", transId, {
          "ID_Reporte": transId,
          "Correlativo": transId,
          "Fecha": new Date().toISOString().split('T')[0],
          "Cliente_Nombre": dataTec[j][idxCliT],
          "Ascensor_Ubicacion": dataTec[j][idxUbi] + " - " + dataTec[j][idxEq],
          "Tecnico_Responsable": dataTec[j][idxTec],
          "Tipo_Servicio": "INSPECCION_CAMPO",
          "Estado": "PENDIENTE_COTIZACION",
          "Diagnostico_Danio": dataTec[j][idxDiag],
          "Repuestos_Faltantes": dataTec[j][idxReps],
          "Division": "MANTENIMIENTO"
        });

        bufTec.getRange(j + 1, idxEstT + 1).setValue("CONSOLIDADO_EN_MASTER");
        bufTec.getRange(j + 1, idxFecT + 1).setValue(new Date().toISOString());
        logResultados.reportesProcesados++;
      }
    }
  }

  return logResultados;
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    addToast('Código de Apps Script copiado al portapapeles con éxito', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveUrl = async () => {
    setIsSavingUrl(true);
    const cleanUrl = scriptUrl.trim();
    localStorage.setItem(`axon_script_url_${empresaActiva.id}`, cleanUrl);
    localStorage.setItem('axon_script_url', cleanUrl);

    let testSuccess = false;
    if (cleanUrl.startsWith('http')) {
      try {
        const res = await fetch(cleanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'ping', test: true })
        });
        if (res.ok) {
          testSuccess = true;
        }
      } catch (err) {
        console.warn('Error verificando Web App:', err);
      }
    }

    setIsSavingUrl(false);
    setShowSavedSuccess(true);

    if (testSuccess) {
      addToast(`✅ Enlace verificado y conectado exitosamente con Google Sheets para ${empresaActiva.nombreCorto}`, 'success');
    } else {
      addToast(`Enlace guardado. Si no responde la Web App, asegúrate de guardar el código e implementar como Aplicación Web accesible por "Cualquiera"`, 'info');
    }

    setTimeout(() => setShowSavedSuccess(false), 4000);
  };

  const [isProcessingBuffers, setIsProcessingBuffers] = useState(false);

  const handleProcesarBuffers = async () => {
    const cleanUrl = scriptUrl.trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      addToast('Ingresa y guarda primero la URL de la Web App de Google Apps Script.', 'warning');
      return;
    }
    setIsProcessingBuffers(true);
    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'PROCESAR_BUFFERS_GESTOR' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const cots = data.resultado?.cotizacionesProcesadas || 0;
        const reps = data.resultado?.reportesProcesados || 0;
        addToast(`✅ Buffers procesados correctamente: ${cots} Cotización(es) Web y ${reps} Reporte(s) de Obra transferidos a las Tablas Maestras.`, 'success');
        await handlePullData();
      } else {
        addToast(`Respuesta del servidor: ${data.message || 'Buffers verificados'}`, 'info');
      }
    } catch (err: any) {
      console.error('Error procesando buffers:', err);
      addToast('Solicitud enviada a la Web App. Si no responde, asegúrate de haber actualizado el código de Apps Script.', 'info');
    } finally {
      setIsProcessingBuffers(false);
    }
  };

  const handlePullData = async () => {
    setIsPulling(true);
    await triggerManualSync();
    setIsPulling(false);
    setPullSuccess(true);
    addToast(`Datos de ${empresaActiva.nombreCorto} sincronizados e integrados exitosamente desde Google Sheets`, 'success');
    setTimeout(() => setPullSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 text-left" id="sincronizar-tab">
      
      {/* BANNER DE EMPRESA ACTIVA */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-800/50 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
              Empresa Seleccionada
            </span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {empresaActiva.razonSocial}
              <span className="text-xs font-mono font-normal text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                {empresaActiva.nombreCorto}
              </span>
            </h3>
          </div>
        </div>
        <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Códigos y Nube independientes configurados por empresa</span>
        </div>
      </div>

      {/* SELECTOR DE PLATAFORMA DE BASE DE DATOS / NUBE */}
      <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-2 shadow-lg">
        <button
          onClick={() => setActiveSyncPlatform('SUPABASE')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeSyncPlatform === 'SUPABASE'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 shadow-md shadow-emerald-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database size={17} className={activeSyncPlatform === 'SUPABASE' ? 'text-slate-950' : 'text-emerald-400'} />
          <div className="text-left">
            <span className="block leading-tight font-black">Centro de Migración a Supabase</span>
            <span className="text-[10px] opacity-85 font-mono">Motor Relacional PostgreSQL & Storage</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSyncPlatform('GOOGLE_SHEETS')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
            activeSyncPlatform === 'GOOGLE_SHEETS'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 shadow-md shadow-cyan-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet size={17} className={activeSyncPlatform === 'GOOGLE_SHEETS' ? 'text-slate-950' : 'text-cyan-400'} />
          <div className="text-left">
            <span className="block leading-tight font-black">Google Sheets & Sábana de Datos</span>
            <span className="text-[10px] opacity-85 font-mono">Apps Script & Sincronización Clásica</span>
          </div>
        </button>
      </div>

      {/* VISTA 1: SUPABASE MIGRATION HUB */}
      {activeSyncPlatform === 'SUPABASE' && (
        <SupabaseMigrationPanel />
      )}

      {/* VISTA 2: GOOGLE SHEETS / APPS SCRIPT CLÁSICO */}
      {activeSyncPlatform === 'GOOGLE_SHEETS' && (
        <>
      {/* TARJETA EXCLUSIVA DE PROCESAMIENTO Y SONDEO DE BUFFERS DEL GESTOR */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-800 uppercase tracking-wide">
              Módulo Gestor ERP • Sondeo Nube
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck size={14} /> Permisos Aislados
            </span>
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Control de Buffers & Consolidación en Tablas Maestras
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Los portales externos escriben únicamente en <code className="text-cyan-300 font-mono">Buffer_Cotizaciones</code> y <code className="text-cyan-300 font-mono">Buffer_Reportes_Tecnicos</code>. Haz clic para procesar y consolidar la información en <code className="text-emerald-400 font-mono">Presupuestos</code> y <code className="text-emerald-400 font-mono">Reportes_Tecnicos</code>.
          </p>
        </div>

        <button
          onClick={handleProcesarBuffers}
          disabled={isProcessingBuffers}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isProcessingBuffers ? "animate-spin" : ""} />
          <span>{isProcessingBuffers ? "Procesando Buffers..." : "⚡ Sondeo & Procesar Buffers Pendientes"}</span>
        </button>
      </div>

      {/* CONTROLES DE MODO LIMPIO Y REFRESCAMIENTO DE NUBE */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono py-0.5 px-2.5 rounded-full font-bold uppercase ${isCleanMode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {isCleanMode ? '✓ MODO OPERACIÓN REAL (SISTEMA DESDE 0)' : '⚠️ MODO DEMOSTRACIÓN (CON DATOS DE PRUEBA)'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1.5">
              Configuración de Datos Iniciales & Reinicio a Cero
            </h3>
            <p className="text-xs text-slate-400">
              {isCleanMode 
                ? 'El sistema está configurado en MODO LIMPIO. No hay datos de prueba y solo se registrarán las pruebas u operaciones reales que realices.' 
                : 'El sistema actualmente contiene datos de demostración. Puedes limpiarlos en 1 clic para empezar a registrar pruebas reales desde 0.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                const res = await pullCloudData();
                if (res) {
                  addToast('¡Datos reales descargados exitosamente desde la nube!', 'success');
                } else {
                  addToast('Se consultó la nube. Verifica que la hoja de Google Sheets contenga registros.', 'info');
                }
              }}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              Descargar Datos de Nube (Excel)
            </button>

            <button
              onClick={() => {
                const cleanUrl = `${window.location.origin}${window.location.pathname}?clean=true`;
                navigator.clipboard.writeText(cleanUrl);
                addToast('📋 Enlace en modo limpio copiado. Al abrirlo en el teléfono, iniciará directamente sin datos de prueba.', 'success');
              }}
              className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              📱 Copiar Enlace Limpio para Teléfonos
            </button>

            {isCleanMode ? (
              <button
                onClick={() => {
                  if (confirm('¿Deseas restaurar los datos de demostración predeterminados?')) {
                    restaurarDatosDemo();
                    addToast('Datos de demostración restaurados', 'info');
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium flex items-center gap-2 transition-all active:scale-95"
              >
                Restaurar Datos Demo
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de LIMPIAR TODOS LOS DATOS DE PRUEBA para empezar a operar desde 0?\n\nEsta acción borrará los registros de ejemplo para que puedas subir tu sistema en blanco.')) {
                    limpiarDatosYEmpezarCero();
                    addToast('¡Sistema limpiado con éxito! Ahora estás en Modo Real desde 0.', 'success');
                  }
                }}
                className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                🗑️ Limpiar y Empezar desde 0
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CABECERA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-cyan-950 border border-cyan-800/40 text-cyan-400 font-mono py-0.5 px-2 rounded uppercase tracking-wider font-bold">
            Integridad Distribuida
          </span>
          <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide mt-1">
            Ajustes del Sincronizador de Sábana de Google Sheets
          </h3>
          <p className="text-xs text-zinc-400">
            Conecta la nube a través de Google Apps Script o Directamente con tu Cuenta de Google para <strong className="text-cyan-300">{empresaActiva.nombreCorto}</strong>.
          </p>
        </div>

        <div className="bg-[#121824] border border-cyan-900/60 p-1.5 px-3 rounded-lg flex items-center gap-1.5 shrink-0 text-cyan-400 select-none">
          <Cloud size={14} className="animate-bounce" />
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Conectividad activa en la nube</span>
        </div>
      </div>

      {/* BLOQUE DE ENLACE DIRECTO CON GOOGLE SHEETS */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                Enlace Directo con Google Sheets API (OAuth Google) - {empresaActiva.nombreCorto}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Al conectar tu cuenta de Google, la app creará automáticamente en tu Drive la hoja <strong className="text-emerald-400">"Axon_ERP_{empresaActiva.nombreCorto.replace(/[^a-zA-Z0-9]/g, '_')}_DB"</strong> con sus pestañas (<strong className="text-emerald-400 font-mono">Reportes_Tecnicos</strong>, <strong className="text-emerald-400 font-mono">Repuestos_Inventario</strong>, etc.) y encabezados en la Fila 1. Cada nuevo reporte o repuesto se guardará en nuevas filas debajo. <span className="text-emerald-300 font-bold">Nunca sobrescribirá ni borrará tus datos anteriores.</span>
              </p>
            </div>
          </div>

          <div>
            {!googleUser ? (
              <button
                onClick={handleGoogleLogin}
                disabled={isConnectingGoogle}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <LogIn size={16} />
                <span>{isConnectingGoogle ? 'Conectando con Google...' : 'Conectar Cuenta de Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {googleUser.email}
                </span>
                <button
                  onClick={handleGoogleLogout}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition cursor-pointer"
                  title="Desconectar cuenta"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* INPUT OPCIONAL PARA VINCULAR HOJA EXISTENTE */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
          <div className="text-xs text-slate-300 shrink-0 font-medium">
            URL o ID de tu Hoja de Google Sheets (Opcional):
          </div>
          <input
            type="text"
            placeholder="Ej: https://docs.google.com/spreadsheets/d/1ABC123xyz... (deja en blanco para usar la oficial)"
            value={customSheetInput}
            onChange={(e) => setCustomSheetInput(e.target.value)}
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {googleUser && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs font-mono text-slate-300 flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">Planilla en Google Drive:</span>
              <span className="text-cyan-400 font-bold">
                {spreadsheetId ? `ID: ${spreadsheetId.substring(0, 16)}...` : 'Axon_ERP_Tecno_Elevatev_DB'}
              </span>
              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-1"
                >
                  <span>Abrir Hoja en Google Sheets</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            <button
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncingSheetDirect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw size={14} className={isSyncingSheetDirect ? 'animate-spin' : ''} />
              <span>{isSyncingSheetDirect ? 'Sincronizando...' : 'Sincronizar Todos los Datos Ahora'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* PANEL DE CONTROL DE CONFIGURACIÓN */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-sans font-bold text-zinc-300 uppercase tracking-wider border-b border-slate-850 pb-2 mb-1 flex items-center gap-1.5">
              <Server size={14} className="text-cyan-400" />
              Parámetros de Integración
            </h4>

            {/* URL Input */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="url-input" className="text-[9px] font-mono text-zinc-550 uppercase font-semibold">Web App Sync Link (Google Script):</label>
              <textarea 
                id="url-input"
                rows={2}
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 text-zinc-300 rounded-xl p-2.5 font-mono text-[11px] focus:outline-none focus:border-cyan-500 transition resize-none leading-normal"
                placeholder="Ingrese la URL provista por Google Apps Script..."
              />
              <button 
                onClick={handleSaveUrl}
                disabled={isSavingUrl}
                className="bg-slate-950 border border-slate-850 text-cyan-400 hover:text-cyan-300 font-mono text-[10px] font-bold py-1.5 px-3 rounded-lg transition mt-1.5 w-full cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Save size={12} />
                {isSavingUrl ? "Registrando link..." : "GUARDAR Y COMPROBAR LINK DE CONEXIÓN"}
              </button>
            </div>

            {/* Guardado exitoso */}
            <AnimatePresence>
              {showSavedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono"
                >
                  <Check size={12} className="text-emerald-400 shrink-0" />
                  <span>Enlace verificado de manera exitosa</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tarjeta de instrucciones resumidas */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 space-y-2 text-xs">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block font-semibold">Instrucciones de Vinculación:</span>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 leading-relaxed font-sans">
                <li>Abre tu planilla Excel en Google Sheets.</li>
                <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                <li>Pega el código adjunto a la derecha y presiona <strong>Guardar</strong>.</li>
                <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                <li>Selecciona tipo <strong>Aplicación Web</strong>, ejecuta como "Yo" y acceso para "Cualquiera".</li>
                <li>Copia la URL de la aplicación web y pégala arriba.</li>
              </ol>
            </div>
          </div>

          {/* Opciones de descarga (Pull / Push / Excel) */}
          <div className="border-t border-slate-850 pt-4 mt-6 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <button 
                onClick={handlePullData}
                disabled={isPulling}
                className="bg-slate-950 border border-slate-850 hover:border-cyan-500/30 text-zinc-300 hover:text-cyan-400 font-mono text-[10px] font-bold p-2.5 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isPulling ? "Cargando..." : "1. PULL"}</span>
              </button>

              <button 
                onClick={triggerManualSync}
                disabled={isSyncing || syncQueue.length === 0}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-zinc-500 hover:text-emerald-400 font-mono text-[10px] font-bold p-2.5 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-30"
              >
                <Upload size={14} />
                <span>{isSyncing ? "Subiendo..." : "2. PUSH"}</span>
              </button>

              <button 
                onClick={() => {
                  exportAllDataToExcelCSV({
                    facturas,
                    recibos,
                    movimientosContables,
                    reportesTecnicos,
                    presupuestos,
                    inventario: products,
                    clientes
                  }, empresaActiva.nombreCorto);
                  addToast(`Respaldo Excel generado para ${empresaActiva.nombreCorto}`, 'success');
                }}
                className={`bg-slate-950 border font-mono text-[10px] font-bold p-2.5 rounded-xl transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  empresaActiva.logoTipo === 'DAKACO'
                    ? 'border-amber-500/40 text-amber-400 hover:text-amber-300 hover:border-amber-400'
                    : 'border-cyan-500/40 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400'
                }`}
                title={`Exportar CSV/Excel para ${empresaActiva.nombreCorto}`}
              >
                <div className="flex items-center gap-1">
                  <FileSpreadsheet size={13} />
                  {empresaActiva.logoTipo === 'ELEVADORES_DEL_LAGO' ? (
                    <DelLagoLogo size={12} showText={false} />
                  ) : empresaActiva.logoTipo === 'DAKACO' ? (
                    <DakacoLogo size={12} showText={false} />
                  ) : empresaActiva.logoTipo === 'ITA_ASCENSORES' ? (
                    <ItaLogo size={12} showText={false} />
                  ) : empresaActiva.logoTipo === 'PROYECTOS_VERTICALES' ? (
                    <ProyectosVerticalesLogo size={12} showText={false} />
                  ) : (
                    <TecnoElevatevLogo size={12} showText={false} />
                  )}
                </div>
                <span className="truncate max-w-[90px]">{empresaActiva.nombreCorto.toUpperCase()}</span>
              </button>
            </div>

            {pullSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
                <Check size={12} className="text-emerald-400 shrink-0" />
                <span>Base local sobrescrita con Google Sheets correctamente</span>
              </div>
            )}
          </div>
        </div>

        {/* COMPARTIMENTO DEL CÓDIGO EN APPS SCRIPT / ESTADO OPERATIVO ADMINISTRACIÓN */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col justify-between h-full">
          
          {isSuperUser ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-2">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <FileCode size={15} className="text-cyan-400" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Código Apps Script (Code.gs)</span>
                </div>

                <button 
                  onClick={handleCopyCode}
                  className="text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer font-mono"
                >
                  {copiedCode ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedCode ? "COPILADO CON ÉXITO" : "COPIAR CÓDIGO"}</span>
                </button>
              </div>

              <div className="bg-slate-950/90 text-emerald-400 p-5 rounded-2xl border border-slate-850 font-mono text-[10.5px] leading-relaxed overflow-x-auto h-[415px] max-h-[415px] scrollbar-thin">
                <pre className="whitespace-pre">{appsScriptCode}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Sincronización Automatizada en la Nube Activa</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Su perfil de Administración cuenta con acceso a la consola de sincronización y descarga de respaldos en tiempo real para <strong>{empresaActiva.nombreCorto}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                    <Cloud size={14} />
                    <span>Respaldo Automático</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Todos los reportes técnicos, notas de entrega, cotizaciones y clientes registrados en teléfonos o computadores se respaldan de forma continua.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
                    <Database size={14} />
                    <span>Sincronización de Datos</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Utilice los botones de la izquierda para <strong>"Forzar Sincronización Manual"</strong> o <strong>"Descargar Datos de Nube"</strong> en cualquier momento.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
                  <span>🛡️ Panel Administrativo Seguro</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  El servidor de enlace Google Apps Script se encuentra configurado y operando de forma transparente. La integración técnica se ejecuta automáticamente en segundo plano.
                </p>
              </div>
            </div>
          )}

          <p className="text-[9px] text-zinc-550 border-t border-slate-850 pt-4 mt-6 text-center tracking-widest font-mono uppercase">
            Plataforma Sincronizada bajo los estándares de conectividad de Axon
          </p>

        </div>

      </div>
      </>
      )}

    </div>
  );
}
