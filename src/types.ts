// --- ITA ASCENSORES, PROYECTOS VERTICALES AB, TECNO ELEVATEV C.A., DAKACO & ELEVADORES DEL LAGO - TIPOS DEL SISTEMA ---

// Empresa Presentación Comercial Multi-Cliente
export type EmpresaId = 'ITA_ASCENSORES' | 'PROYECTOS_VERTICALES_AB' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'ELEVADORES_DEL_LAGO' | string;

export interface EmpresaConfig {
  id: EmpresaId;
  nombre: string;
  nombreCorto: string;
  rif: string;
  slogan: string;
  direccion: string;
  telefono: string;
  email: string;
  colorPrimario: string;
  logoTipo: 'TECNO_ELEVATEV' | 'DAKACO' | 'GENERIC' | string;
  nombreGestor?: string;
  telefonoGestor?: string;
}

export interface TecnicoObraPIN {
  id: string;
  codigoPin: string;
  nombre: string;
  cargo: string;
  telefono: string;
  empresaId: string;
  activo: boolean;
}

// División Operativa
export type DivisionOperativa = 'MODERNIZACION' | 'MANTENIMIENTO';

// 1. INVENTARIO & REPUESTOS DE ASCENSORES
export interface Producto {
  val_c: string;   // Código SKU Correlativo (Ej: "ASC-001")
  val_mo: string;  // Modelo técnico (Ej: "KD700-4T / Yaskawa L1000A")
  val_d: string;   // Descripción (Ej: "Variador de Frecuencia VVVF 15HP")
  val_b: string;   // Serial / Código de Barra
  val_m: string;   // Marca (Ej: "Schindler", "Otis", "Yaskawa", "Kone", "Fermator")
  val_r: string;   // Referencia técnica / Categoría (Cabina, Maniobra, Tracción, Puertas)
  val_s: number;   // Stock Disponible
  val_u?: string;  // Unidad (Und, Juego, Mts)
  precioUSD?: number; // Precio de lista USD
  imagenUrl?: string; // URL o Base64 Data-URI de la fotografía de referencia visual del repuesto
  division: DivisionOperativa;
  esHerramienta?: boolean; // Tag/Etiqueta permanente que define que es una herramienta / activo de obra
}

// 2. CLIENTES & EQUIPOS INSTALADOS (ASCENSORES)
export interface EquipoAscensor {
  id: string;
  nombreEquipo: string; // Ej: "Ascensor Principal Torre A", "Ascensor Carga Servicio"
  marca: string;        // Ej: "Schindler", "Otis", "ThyssenKrupp", "Kone", "Orona"
  modelo: string;       // Ej: "Smart 001", "GeN2", "Custom VVVF"
  capacidadKg: number;  // Ej: 800
  personas: number;     // Ej: 10
  paradas: number;      // Ej: 14
  tipoManiobra: string; // Ej: "Frecuencia Variable VVVF", "Dos Velocidades", "Hidráulico"
  serialFabrica: string;
  estadoTecnico: 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'REPARACION_URGENTE' | 'FUERA_DE_SERVICIO';
  ultimoMantenimiento?: string;
  proximoMantenimiento?: string;
  observaciones?: string;
}

export interface Cliente {
  id: string; // Ej: "CLI-001"
  rif: string; // Ej: "J-30491823-1"
  razonSocial: string; // Ej: "Residencias Altamira Plaza", "Centro Empresarial Capital"
  personaContacto: string;
  telefono: string;
  email: string;
  direccion: string;
  tipoFacturacionPreferida: 'FACTURA_FISCAL' | 'NOTA_ENTREGA' | 'AMBAS';
  equipos: EquipoAscensor[]; // Listado de ascensores asignados
  division: DivisionOperativa;
  estado?: 'ACTIVO' | 'INACTIVO' | 'ARCHIVADO'; // Soft Delete
}

// 3. FACTURACIÓN
export interface ItemFactura {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioUSD: number;
  esExento?: boolean;
}

export interface Factura {
  id?: string;
  correlativo: string; // Ej: "FACT-001001"
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  clienteRif: string;
  clienteDireccion: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  concepto?: string;
  condicionesPago?: string;
  tipoComprobante: 'FACTURA_FISCAL' | 'FACTURA_PREHECHA' | 'NOTA_ENTREGA';
  items: ItemFactura[];
  subtotalUSD: number;
  ivaPorcentaje: number; // Ej: 16
  ivaMontoUSD: number;
  totalUSD: number;
  tasaCambioBs: number; // Ej: 36.50
  totalBs: number;
  estado: 'EMITIDA' | 'PAGADA' | 'ANULADA' | 'ARCHIVADO'; // Soft Delete
  observaciones?: string;
  division: DivisionOperativa;
}

export interface PlantillaFacturaPrehecha {
  id: string;
  titulo: string; // Ej: "Mantenimiento Preventivo Mensual Ascensor Residencia"
  descripcion: string;
  items: Omit<ItemFactura, 'id'>[];
  montoSugeridoUSD: number;
}

// 4. PRESUPUESTOS (COTIZACIONES)
export interface ItemPresupuesto {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioUSD: number;
  esExento?: boolean;
}

export interface Presupuesto {
  id?: string;
  correlativo: string; // Ej: "PRES-2026-0101"
  fecha: string;
  fechaVencimiento: string;
  clienteId: string;
  clienteNombre: string;
  clienteRif: string;
  clienteTelefono: string;
  clienteEmail?: string;
  clienteDireccion?: string;
  condicionesPago?: string;
  proyectoAscensor: string; // Ej: "Modernización de Cuadro de Maniobra a VVVF"
  items: ItemPresupuesto[];
  subtotalUSD: number;
  ivaUSD: number;
  totalUSD: number;
  estado: 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO' | 'CONVERTIDO_A_FACTURA';
  notasValidez: string;
  division: DivisionOperativa;
}

// 5. RECIBOS / NOTAS DE ENTREGA
export interface ItemReciboNota {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioUSD?: number;
  precioUSD?: number;
  precio?: number;
  montoUSD?: number;
  esExento?: boolean;
}

export interface ReciboNota {
  id?: string;
  correlativo: string; // Ej: "REC-000501" o "NE-001201"
  tipo: 'RECIBO_PAGO' | 'NOTA_ENTREGA';
  fecha: string;
  clienteNombre: string;
  clienteRif: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteDireccion?: string;
  concepto: string; // Ej: "Recibo por abono de 50% de modernización de variador"
  observaciones?: string;
  montoUSD: number;
  montoBs: number;
  formaPago: 'TRANSFERENCIA' | 'EFECTIVO' | 'ZELLE' | 'PAGO_MOVIL';
  referenciaPago?: string;
  firmaConformidad?: string;
  photos?: string[];
  items?: ItemReciboNota[];
  status: 'ACTIVO' | 'ANULADO';
  division: DivisionOperativa;
}

// 6. CONTABILIDAD (INGRESOS, GASTOS, COMPRAS)
export interface MovimientoContable {
  id: string;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO' | 'COMPRA_INVENTARIO';
  categoria: string; // Ej: "Cobro de Mantenimiento", "Compra de Cuadros de Mando", "Nómina", "Servicios Operativos", "Herramientas"
  descripcion: string;
  montoUSD: number;
  montoBs: number;
  comprobanteReferencia?: string; // Ej: "FACT-001001" o "COMPRA-8832"
  proveedorOCliente?: string;
  division: DivisionOperativa;
}

// 7. GESTIÓN DE NÓMINA (EMPLEADOS, CESTA TICKET, PRÉSTAMOS, VACACIONES)
export interface Empleado {
  id: string; // Ej: "EMP-001"
  cedula: string;
  nombre: string;
  cargo: 'INGENIERO_JEFE' | 'TECNICO_ELEVADORISTA' | 'AYUDANTE_TECNICO' | 'SUPERVISOR' | 'ADMINISTRATIVO';
  fechaIngreso: string;
  sueldoBaseUSD: number;
  cestaTicketUSD: number; // Ej: 40 USD
  cuentaBancaria: string;
  estatus: 'ACTIVO' | 'VACACIONES' | 'INACTIVO';
}

export interface PrestamoEmpleado {
  id: string;
  empleadoId: string;
  fecha: string;
  montoUSD: number;
  motivo: string;
  cuotasTotales: number;
  cuotasPagadas: number;
  estado: 'PENDIENTE' | 'PAGADO';
}

export interface RegistroNomina {
  id: string;
  periodo: string; // Ej: "Primera Quincena Julio 2026"
  fechaPago: string;
  empleadoId: string;
  empleadoNombre: string;
  cargo: string;
  sueldoBaseUSD: number;
  cestaTicketUSD: number;
  bonificacionEspecialUSD: number;
  descuentoPrestamosUSD: number;
  netoAPagarUSD: number;
  netoAPagarBs: number;
  estado: 'BORRADOR' | 'PROCESADA' | 'PAGADA';
}

export interface SolicitudVacacion {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  diasTotales: number;
  montoBonoVacacionalUSD: number;
  estado: 'SOLICITADA' | 'APROBADA' | 'DISFRUTADA';
}

// 8. TRIBUTARIO (RETENCIONES DE IVA, ISLR, MUNICIPALES)
export interface RetencionTributaria {
  id: string; // Ej: "RET-2026-00012"
  correlativoComprobante: string; // Ej: "20260700000088"
  fechaEmision: string;
  tipoRetencion: 'IVA_COMPRA' | 'ISLR' | 'MUNICIPAL_PATENTE';
  proveedorNombre: string;
  proveedorRif: string;
  nroFacturaAfectada: string;
  nroControlAfectado: string;
  montoBaseUSD: number;
  porcentajeRetencion: number; // Ej: 75% o 100% para IVA, 1%, 2%, 3% para ISLR
  montoRetenidoUSD: number;
  montoRetenidoBs: number;
  division: DivisionOperativa;
}

// 9. AUDITORÍA / KARDEX DE REPUESTOS
export interface EntradaKardex {
  id: string;
  sku: string;
  fecha: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  referencia: string;
  cambioStock: number;
  stockResultante: number;
  division: DivisionOperativa;
}

// 10. REPORTES TÉCNICOS DE CAMPO / INSPECCIÓN EN OBRAS
export type TipoReporteTecnico = 'INSPECCION_DANIOS' | 'FALTANTE_REPUESTOS' | 'VISITA_PRESUPUESTO' | 'MANTENIMIENTO_PREVENTIVO';

export interface RepuestoFaltanteDetalle {
  id: string;
  repuestoNombre: string; // Ej: "Guaya 10mm (5 tramos de 30m)", "Tablero de control VVVF"
  cantidadRequerida: number;
  unidadMedida?: string; // Ej: "Mts", "Tramos", "Und", "Juego"
  largoOMetros?: number; // Ej: 30 (si son 5 tramos de 30m => total 150m)
  precioUnitarioUSD?: number; // Ej: 4.50 por metro o por unidad
  precioTotalUSD?: number; // Ej: 150 * 4.50 = 675.00
  origenPrecio?: 'CATALOGO' | 'HISTORICO_ANTERIOR' | 'MANUAL_PENDIENTE' | 'COTIZADO';
  referenciaObraAnterior?: string; // Ej: "Cotizado en Obra Res. Altamira ($2,800.00)"
  prioridad: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';
  observaciones?: string;
}

export interface ReporteTecnicoCampo {
  id: string; // Ej: "REP-OBRA-001"
  correlativo: string;
  fecha: string;
  tecnicoNombre: string;
  clienteNombre: string; // Edificio / Condominio / Obra
  clienteRif?: string;
  ubicacionObra: string; // Ej: "Av. Francisco de Miranda, Torre A, Chacao"
  equipoAscensor: string; // Ej: "Ascensor Principal #1 (Schindler 14P)"
  tipoReporte: TipoReporteTecnico;
  prioridadAtencion: 'CRITICA' | 'ALTA' | 'NORMAL';
  
  // Diagnóstico técnico / levantamiento de daños
  diagnosticoDanio: string; // Ej: "Tarjeta principal quemada por sobretensión, variador en falla F04"
  detallesManualesPedidos?: string; // Texto libre con materiales/detalles a pedir (Ej: "5 tramos de guaya 13mm de 130m, variador de frecuencia, tablero de control")
  repuestosFaltantes: RepuestoFaltanteDetalle[];
  
  // Levantamiento para Presupuesto
  requierePresupuesto: boolean;
  montoEstimadoRepuestosUSD?: number;
  observacionesCotizacion?: string;
  
  // Fotos y Firmas
  fotosEvidenciaCount?: number;
  photos?: string[];
  firmaTecnico?: string;
  firmaClienteObra?: string;
  
  estado: 'PENDIENTE_COTIZACION' | 'REPUESTOS_SOLICITADOS' | 'EN_REPARACION' | 'COMPLETADO' | 'ARCHIVADO';
  estadoGestionBuffer?: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO';
  supabaseId?: string;
  division: DivisionOperativa;
}

// USUARIOS DEL ERP & MATRIZ DE PERMISOS
export type RolUsuario = 'SUPER_USUARIO' | 'ADMIN' | 'SUPERVISOR' | 'INGENIERO' | 'TECNICO' | 'CLIENTE_DEMO';

export type TabID = 
  | 'INICIO' 
  | 'PORTAL_WEB'
  | 'TECNICOS_OBRA'
  | 'SOLICITUDES_CLIENTES'
  | 'PRESENTACION'
  | 'CONTABILIDAD' 
  | 'FACTURACION' 
  | 'PRESUPUESTOS' 
  | 'RECIBOS' 
  | 'CLIENTES' 
  | 'NOMINA' 
  | 'TRIBUTARIO' 
  | 'REPORTES' 
  | 'INVENTARIO' 
  | 'KARDEX' 
  | 'HERRAMIENTAS'
  | 'HISTORIAL'
  | 'CONSOLIDACION'
  | 'SINCRONIZAR' 
  | 'AJUSTES';

// 12. SOLICITUDES Y COTIZACIONES EN LÍNEA DE CLIENTES (BANDEJA GESTOR)
export interface SolicitudCotizacionCliente {
  id: string; // Ej: "SOL-WEB-8821"
  correlativo: string; // Ej: "SOL-2026-001"
  fecha: string;
  hora: string;
  clienteNombre: string;
  clienteRif?: string;
  personaContacto: string;
  telefono: string;
  email?: string;
  edificioUbicacion: string; // Ej: "Residencias Altamira Plaza, Chacao"
  apartamentoTorre?: string;
  tipoServicio: 'MODERNIZACION' | 'NUEVO_ASCENSOR' | 'MANTENIMIENTO' | 'EMERGENCIA' | 'REPUESTOS';
  paradas: number;
  capacidadPersonas: number;
  detalles: string;
  estado: 'NUEVA' | 'EN_EVALUACION' | 'COTIZADO' | 'APROBADO_CLIENTE' | 'DESCARTADO' | 'ARCHIVADO';
  estadoGestionBuffer?: 'PENDIENTE_GESTOR' | 'CONSOLIDADO_EN_MASTER' | 'RECHAZADO' | 'ARCHIVADO';
  presupuestoGeneradoCorrelativo?: string;
  subidoAExcel?: boolean;
  fechaSubidoExcel?: string;
  empresaId?: string;
}

// 11. CONTROL DE HERRAMIENTAS EN OBRA Y PRÉSTAMOS
export interface ItemHerramientaPrestada {
  sku: string;
  nombre: string;
  cantidad: number;
  serialOCodigo?: string;
  observacionEstado?: string;
}

export interface PrestamoHerramienta {
  id: string; // Ej: "HERR-LOAN-001"
  correlativo: string; // Ej: "PSH-2026-0001"
  fechaSolicitud: string; // YYYY-MM-DD o ISO
  tecnicoNombre: string; // Técnico que solicita
  tecnicoTelefono?: string; // Teléfono para recordatorios WhatsApp
  obraNombre: string; // Nombre de la obra / cliente / edificio
  ubicacionObra?: string;
  items: ItemHerramientaPrestada[];
  fechaDevolucionEstimada?: string;
  fechaDevolucionReal?: string;
  estado: 'EN_OBRA' | 'DEVUELTO' | 'DEVUELTO_PARCIAL' | 'VENCIDO';
  observacionesSalida?: string;
  observacionesDevolucion?: string;
  firmaTecnico?: string;
  division: DivisionOperativa;
  empresaId?: string;
}

export type PermisosRolMap = Record<RolUsuario, TabID[]>;

export interface Usuario {
  username: string;
  nombre: string;
  cargo: string;
  rol: RolUsuario;
  password?: string;
  active?: boolean;
  divisionPredeterminada?: DivisionOperativa;
  modulosPermitidos?: TabID[];
}

// ESTRUCTURA DE VALES/NOTAS COMPATIBLES
export interface Nota {
  NroVale: string;
  Fecha: string;
  Responsable: string;
  Destino: string;
  ProyectoDesc?: string;
  TipoDespacho: string;
  Productos: string;
  Firma?: string;
  photos?: string[];
  Status?: string;
  division: DivisionOperativa;
  Rif?: string;
}

export interface SolicitudProyecto {
  id: string;
  Fecha: string;
  Ingeniero: string;
  Proyecto: string;
  Descripcion: string;
  Status: 'PENDIENTE' | 'DESPACHADO' | 'ANULADO';
  division: DivisionOperativa;
  Productos: string;
}

export interface ConteoAuditoria {
  sku: string;
  modelo?: string;
  marca?: string;
  descripcion?: string;
  sistema?: number;
  stockLogico?: number;
  stockFisico?: number | null;
  conteoFisico?: number;
  diferencia?: number;
}



