import { 
  Producto, 
  Cliente, 
  Factura, 
  Presupuesto, 
  ReciboNota, 
  MovimientoContable, 
  Empleado, 
  PrestamoEmpleado, 
  RegistroNomina, 
  RetencionTributaria,
  PlantillaFacturaPrehecha,
  Nota, 
  SolicitudProyecto, 
  EntradaKardex,
  ReporteTecnicoCampo
} from './types';

// 1. REPUESTOS E INVENTARIO TECNO ELEVATEV C.A. (DEMO)
export const DEMO_PRODUCTS: Producto[] = [
  // --- DIVISION MODERNIZACION ---
  {
    val_c: "ASC-001",
    val_mo: "YASKAWA L1000A",
    val_d: "Variador de Frecuencia VVVF 15HP para Ascensor Frecuencia Variable",
    val_b: "750302148901",
    val_m: "Yaskawa",
    val_r: "Maniobra y Control",
    val_s: 6,
    val_u: "Und",
    precioUSD: 1450,
    division: "MODERNIZACION"
  },
  {
    val_c: "ASC-002",
    val_mo: "FERMATOR VVVF4+",
    val_d: "Operador de Puerta de Cabina Automática Telespópica/Central",
    val_b: "750302148902",
    val_m: "Fermator",
    val_r: "Puertas y Operadores",
    val_s: 10,
    val_u: "Juego",
    precioUSD: 680,
    division: "MODERNIZACION"
  },
  {
    val_c: "ASC-003",
    val_mo: "MONARCH NICE-3000+",
    val_d: "Cuadro de Mando Integrado CanBus con Tarjeta Principal de Control",
    val_b: "750302148903",
    val_m: "Monarch / Inovance",
    val_r: "Maniobra y Control",
    val_s: 4,
    val_u: "Und",
    precioUSD: 1850,
    division: "MODERNIZACION"
  },
  {
    val_c: "ASC-004",
    val_mo: "CAB-TRAC-10MM",
    val_d: "Cable de Tracción Especial de Acero 10mm Alma de Fibra Drako (Metro)",
    val_b: "750302148904",
    val_m: "Drako",
    val_r: "Tracción y Pasajeros",
    val_s: 450,
    val_u: "Mts",
    precioUSD: 8.5,
    division: "MODERNIZACION"
  },
  {
    val_c: "ASC-005",
    val_mo: "BOT-COP-TOUCH",
    val_d: "Botonera de Cabina COP Inoxidable con Pantalla TFT 7 Pulgadas",
    val_b: "750302148905",
    val_m: "Elevatev Custom",
    val_r: "Señalización y Botoneras",
    val_s: 8,
    val_u: "Und",
    precioUSD: 380,
    division: "MODERNIZACION"
  },
  {
    val_c: "ASC-006",
    val_mo: "FOTO-CORT-3D",
    val_d: "Cortina Fotoeléctrica Infarroja de Seguridad 128 Haces",
    val_b: "750302148906",
    val_m: "WECO",
    val_r: "Seguridad y Fosa",
    val_s: 14,
    val_u: "Juego",
    precioUSD: 190,
    division: "MODERNIZACION"
  },

  // --- DIVISION MANTENIMIENTO ---
  {
    val_c: "MNT-001",
    val_mo: "ACEITE-SINT-ISO220",
    val_d: "Lubricante Sintético Especial de Alta Viscosidad para Máquinas de Tracción (Garrafa 5L)",
    val_b: "750302148907",
    val_m: "Shell Omala",
    val_r: "Consumibles Mantenimiento",
    val_s: 25,
    val_u: "Und",
    precioUSD: 45,
    division: "MANTENIMIENTO"
  },
  {
    val_c: "MNT-002",
    val_mo: "ZAP-GUIA-16MM",
    val_d: "Zapatas de Guía con Inserto de Teplón autolubricante 16mm",
    val_b: "750302148908",
    val_m: "Schindler / Otis",
    val_r: "Mecánica y Guías",
    val_s: 40,
    val_u: "Und",
    precioUSD: 22,
    division: "MANTENIMIENTO"
  },
  {
    val_c: "MNT-003",
    val_mo: "RELE-SEG-24V",
    val_d: "Relé de Cadena de Seguridad Parada de Emergencia 24VDC",
    val_b: "750302148909",
    val_m: "Omron",
    val_r: "Eléctrico y Enclavamientos",
    val_s: 30,
    val_u: "Und",
    precioUSD: 18,
    division: "MANTENIMIENTO"
  },
  {
    val_c: "MNT-004",
    val_mo: "PATIN-RETRAC-220V",
    val_d: "Patin Retráctil Electroimán Desbloqueo de Puertas de Piso",
    val_b: "750302148910",
    val_m: "Otis Type",
    val_r: "Mecánica de Puertas",
    val_s: 12,
    val_u: "Und",
    precioUSD: 110,
    division: "MANTENIMIENTO"
  },

  // --- HERRAMIENTAS Y EQUIPOS DE CAMPO (ETIQUETA PERMANENTE ES_HERRAMIENTA) ---
  {
    val_c: "HERR-001",
    val_mo: "FLUKE-87V",
    val_d: "Multímetro Digital Industrial Fluke 87V TRMS para Ascensores y Variadores",
    val_b: "HERR-750302001",
    val_m: "Fluke",
    val_r: "Herramientas de Medición",
    val_s: 5,
    val_u: "Und",
    precioUSD: 420,
    division: "MANTENIMIENTO",
    esHerramienta: true
  },
  {
    val_c: "HERR-002",
    val_mo: "PINZA-AMP-376",
    val_d: "Pinza Amperimétrica de Gancho Fluke 376 FC con Sonda iFlex CA/CC",
    val_b: "HERR-750302002",
    val_m: "Fluke",
    val_r: "Herramientas de Medición",
    val_s: 3,
    val_u: "Und",
    precioUSD: 380,
    division: "MANTENIMIENTO",
    esHerramienta: true
  },
  {
    val_c: "HERR-003",
    val_mo: "MALETIN-KNIPEX-1000V",
    val_d: "Maletín Profesional de Herramientas Aisladas 1000V Knipex para Alta Tensión",
    val_b: "HERR-750302003",
    val_m: "Knipex",
    val_r: "Herramientas Manuales",
    val_s: 4,
    val_u: "Juego",
    precioUSD: 520,
    division: "MODERNIZACION",
    esHerramienta: true
  },
  {
    val_c: "HERR-004",
    val_mo: "TECLE-PALANCA-1.5T",
    val_d: "Tecle / Polipasto Manual de Palanca 1.5 Toneladas con Guaya de Cadena",
    val_b: "HERR-750302004",
    val_m: "Yale",
    val_r: "Equipos de Izaje",
    val_s: 2,
    val_u: "Und",
    precioUSD: 290,
    division: "MODERNIZACION",
    esHerramienta: true
  },
  {
    val_c: "HERR-005",
    val_mo: "TALADRO-DEWALT-20V",
    val_d: "Taladro Percutor e Inalámbrico DeWalt 20V Max XR Brushless con 2 Baterías",
    val_b: "HERR-750302005",
    val_m: "DeWalt",
    val_r: "Herramientas Eléctricas",
    val_s: 6,
    val_u: "Und",
    precioUSD: 240,
    division: "MANTENIMIENTO",
    esHerramienta: true
  }
];

// 1.1 PRÉSTAMOS E HISTORIAL DE HERRAMIENTAS EN OBRA (DEMO)
export const DEMO_PRESTAMOS_HERRAMIENTAS: any[] = [
  {
    id: "HERR-LOAN-2026-001",
    correlativo: "PSH-2026-0001",
    fechaSolicitud: "2026-08-01 08:30",
    tecnicoNombre: "Téc. Manuel Guerra",
    tecnicoTelefono: "+584123049182",
    obraNombre: "Residencias Altamira Plaza - Torre A",
    ubicacionObra: "Av. San Juan Bosco, Chacao, Caracas",
    items: [
      {
        sku: "HERR-001",
        nombre: "Multímetro Digital Industrial Fluke 87V",
        cantidad: 1,
        serialOCodigo: "SN-FL87V-9921",
        observacionEstado: "En perfecto estado en estuche de protección"
      },
      {
        sku: "HERR-004",
        nombre: "Tecle / Polipasto Manual de Palanca 1.5T",
        cantidad: 1,
        serialOCodigo: "SN-YL15T-0043",
        observacionEstado: "Cadena lubricada y traba de seguridad activa"
      }
    ],
    fechaDevolucionEstimada: "2026-08-08",
    estado: "EN_OBRA",
    observacionesSalida: "Despacho para modernización de variador de frecuencia y alineación de máquina.",
    division: "MODERNIZACION"
  },
  {
    id: "HERR-LOAN-2026-002",
    correlativo: "PSH-2026-0002",
    fechaSolicitud: "2026-08-03 09:15",
    tecnicoNombre: "Téc. Francisco Rivas",
    tecnicoTelefono: "+584128889900",
    obraNombre: "Centro Empresarial Capital",
    ubicacionObra: "Av. Francisco de Miranda, El Recreo",
    items: [
      {
        sku: "HERR-002",
        nombre: "Pinza Amperimétrica de Gancho Fluke 376 FC",
        cantidad: 1,
        serialOCodigo: "SN-FL376-1102",
        observacionEstado: "Incluye sonda flexible iFlex"
      }
    ],
    fechaDevolucionEstimada: "2026-08-10",
    estado: "EN_OBRA",
    observacionesSalida: "Medición de consumo eléctrico en arranques de motor de ascensor #2.",
    division: "MANTENIMIENTO"
  }
];

// 2. CLIENTES CON EQUIPOS DE ASCENSORES REGISTRADOS (DEMO)
export const DEMO_CLIENTES: Cliente[] = [
  {
    id: "CLI-ITA-001",
    rif: "J-29993664-2",
    razonSocial: "Ascensores Barbaroza, C.A (ITA ASCENSORES)",
    personaContacto: "Gerencia General & Dirección Técnica ITA",
    telefono: "+58 (412) 123-4567",
    email: "mantenimiento.barbaroza@gmail.com",
    direccion: "Av. Elías Rodríguez, Galpón N° 15, Zona Industrial, Las Tejerías, Edo. Aragua",
    tipoFacturacionPreferida: "FACTURA_FISCAL",
    division: "MANTENIMIENTO",
    equipos: [
      {
        id: "EQ-ITA-001",
        nombreEquipo: "Ascensor Principal ITA Torre 1 (VVVF Yaskawa)",
        marca: "ITA Spec / Yaskawa",
        modelo: "L1000A - Frecuencia Variable",
        capacidadKg: 1000,
        personas: 13,
        paradas: 14,
        tipoManiobra: "VVVF CanBus Inteligente",
        serialFabrica: "ITA-2026-T1",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-07-28",
        proximoMantenimiento: "2026-08-28",
        observaciones: "Operativo con temporizador de viaje habilitado para demostración técnica."
      },
      {
        id: "EQ-ITA-002",
        nombreEquipo: "Ascensor Carga & Servicio Galpón 15",
        marca: "Fermator / Monarch",
        modelo: "NICE-3000+ Heavy Duty",
        capacidadKg: 1600,
        personas: 20,
        paradas: 6,
        tipoManiobra: "Operador Telescópico Automático",
        serialFabrica: "ITA-GALP-015",
        estadoTecnico: "EN_MANTENIMIENTO",
        ultimoMantenimiento: "2026-08-01",
        proximoMantenimiento: "2026-08-15",
        observaciones: "Inspección mensual de cadenas de seguridad y guías autolubricadas."
      },
      {
        id: "EQ-ITA-003",
        nombreEquipo: "Ascensor Panorámico Executive VIP",
        marca: "Schindler / ITA Custom",
        modelo: "Smart Glass VVVF",
        capacidadKg: 800,
        personas: 10,
        paradas: 12,
        tipoManiobra: "Frecuencia Variable Silenciosa",
        serialFabrica: "ITA-PAN-99",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-07-30",
        proximoMantenimiento: "2026-08-30",
        observaciones: "Cabina panorámica con pantalla TFT y cortina de seguridad 128 haces."
      }
    ]
  },
  {
    id: "CLI-ITA-002",
    rif: "J-29993664-2",
    razonSocial: "Ascensores Barbaroza, C.A (ITA ASCENSORES - Modernizaciones)",
    personaContacto: "Ing. Coordinación de Proyectos ITA",
    telefono: "+58 (412) 123-4567",
    email: "mantenimiento.barbaroza@gmail.com",
    direccion: "Av. Elías Rodríguez, Galpón N° 15, Zona Industrial, Las Tejerías, Edo. Aragua",
    tipoFacturacionPreferida: "FACTURA_FISCAL",
    division: "MODERNIZACION",
    equipos: [
      {
        id: "EQ-ITA-004",
        nombreEquipo: "Proyecto Modernización Cuadro Maniobra CanBus",
        marca: "Yaskawa / Monarch",
        modelo: "Nice-3000+ VVVF",
        capacidadKg: 1000,
        personas: 13,
        paradas: 18,
        tipoManiobra: "Reemplazo Electrónico Completo",
        serialFabrica: "MOD-ITA-004",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-08-02",
        proximoMantenimiento: "2026-09-02",
        observaciones: "Pruebas de temporizador de arranque suave y frenado regenerativo."
      }
    ]
  },
  {
    id: "CLI-001",
    rif: "J-30129481-2",
    razonSocial: "Residencias Altamira Plaza C.A.",
    personaContacto: "Dra. Carmen Mendoza (Junta de Condominio)",
    telefono: "0414-2391022",
    email: "condominio@altamiraplaza.com",
    direccion: "Av. San Juan Bosco con 3ra Transversal, Altamira, Caracas",
    tipoFacturacionPreferida: "FACTURA_FISCAL",
    division: "MANTENIMIENTO",
    equipos: [
      {
        id: "EQ-001",
        nombreEquipo: "Ascensor Subida Principal Torre A",
        marca: "Schindler",
        modelo: "Smart 001 VVVF",
        capacidadKg: 800,
        personas: 10,
        paradas: 16,
        tipoManiobra: "Frecuencia Variable VVVF",
        serialFabrica: "SCH-99201-A",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-07-10",
        proximoMantenimiento: "2026-08-10",
        observaciones: "Operando perfectamente. Cambio de zapatas en última inspección."
      },
      {
        id: "EQ-002",
        nombreEquipo: "Ascensor Servicio / Carga Torre A",
        marca: "Otis",
        modelo: "2000 VF",
        capacidadKg: 1200,
        personas: 15,
        paradas: 16,
        tipoManiobra: "Frecuencia Variable VVVF",
        serialFabrica: "OTIS-88210-S",
        estadoTecnico: "REPARACION_URGENTE",
        ultimoMantenimiento: "2026-07-02",
        proximoMantenimiento: "2026-08-02",
        observaciones: "Pendiente reemplazo de cortina infrarroja de seguridad."
      }
    ]
  },
  {
    id: "CLI-002",
    rif: "J-40992018-0",
    razonSocial: "Centro Financiero Capital C.A.",
    personaContacto: "Ing. Roberto Alarcón (Gerente de Operaciones)",
    telefono: "0412-8819022",
    email: "operaciones@centrocapital.com.ve",
    direccion: "Av. Francisco de Miranda, El Chacao",
    tipoFacturacionPreferida: "FACTURA_FISCAL",
    division: "MODERNIZACION",
    equipos: [
      {
        id: "EQ-003",
        nombreEquipo: "Batería Ascensores Expresos 1-4",
        marca: "Kone",
        modelo: "MonoSpace 500",
        capacidadKg: 1000,
        personas: 13,
        paradas: 22,
        tipoManiobra: "Dúplex Colectiva en Bajada",
        serialFabrica: "KONE-2021-EXP",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-07-15",
        proximoMantenimiento: "2026-08-15",
        observaciones: "Contrato de modernización integral de cabinas aprobado."
      }
    ]
  },
  {
    id: "CLI-003",
    rif: "J-50112839-4",
    razonSocial: "Hotel Suites Las Mercedes",
    personaContacto: "Lic. Gustavo Paredes",
    telefono: "0424-1192834",
    email: "mantenimiento@hotellasmercedes.com",
    direccion: "Calle Paris con Toluca, Las Mercedes",
    tipoFacturacionPreferida: "NOTA_ENTREGA",
    division: "MANTENIMIENTO",
    equipos: [
      {
        id: "EQ-004",
        nombreEquipo: "Ascensor Panorámico Principal",
        marca: "ThyssenKrupp",
        modelo: "Elegance Glass",
        capacidadKg: 630,
        personas: 8,
        paradas: 8,
        tipoManiobra: "VVVF Silencioso Deluxe",
        serialFabrica: "TK-PAN-004",
        estadoTecnico: "OPERATIVO",
        ultimoMantenimiento: "2026-07-20",
        proximoMantenimiento: "2026-08-20",
        observaciones: "Revisión quincenal de patines y botonera con pantalla TFT."
      }
    ]
  }
];

// 3. FACTURAS (DEMO)
export const DEMO_FACTURAS: Factura[] = [
  {
    correlativo: "FACT-001001",
    fecha: "2026-07-15",
    clienteId: "CLI-001",
    clienteNombre: "Residencias Altamira Plaza C.A.",
    clienteRif: "J-30129481-2",
    clienteDireccion: "Av. San Juan Bosco, Altamira",
    tipoComprobante: "FACTURA_FISCAL",
    items: [
      {
        id: "ITM-1",
        codigo: "MNT-SERV",
        descripcion: "Mantenimiento mensual preventivo y correctivo de 2 ascensores (Julio 2026)",
        cantidad: 1,
        precioUnitarioUSD: 350
      },
      {
        id: "ITM-2",
        codigo: "ASC-006",
        descripcion: "Suministro e instalación de Cortina Fotoeléctrica 3D WECO de Seguridad",
        cantidad: 1,
        precioUnitarioUSD: 190
      }
    ],
    subtotalUSD: 540,
    ivaPorcentaje: 16,
    ivaMontoUSD: 86.4,
    totalUSD: 626.4,
    tasaCambioBs: 36.5,
    totalBs: 22863.6,
    estado: "PAGADA",
    division: "MANTENIMIENTO"
  },
  {
    correlativo: "FACT-001002",
    fecha: "2026-07-22",
    clienteId: "CLI-002",
    clienteNombre: "Centro Financiero Capital C.A.",
    clienteRif: "J-40992018-0",
    clienteDireccion: "Av. Francisco de Miranda, El Chacao",
    tipoComprobante: "FACTURA_FISCAL",
    items: [
      {
        id: "ITM-3",
        codigo: "ASC-001",
        descripcion: "Anticipo 50% Modernización de Cuadro de Maniobra Yaskawa L1000A",
        cantidad: 2,
        precioUnitarioUSD: 1450
      }
    ],
    subtotalUSD: 2900,
    ivaPorcentaje: 16,
    ivaMontoUSD: 464,
    totalUSD: 3364,
    tasaCambioBs: 36.5,
    totalBs: 122786,
    estado: "EMITIDA",
    division: "MODERNIZACION"
  }
];

// PLANTILLAS DE FACTURA Y PRESUPUESTOS PRE-HECHAS (SERVICIOS MÁS COMUNES)
export const PLANTILLAS_PREHECHAS: PlantillaFacturaPrehecha[] = [
  {
    id: "PLANT-01",
    titulo: "1. Mantenimiento Preventivo Mensual",
    descripcion: "Revisión mensual de seguridades, lubricación de guías, limpieza de fosa, prueba de frenos y atención de emergencias 24/7.",
    items: [
      {
        codigo: "MNT-PREV-01",
        descripcion: "Servicio de Mantenimiento Preventivo Mensual de Ascensores y Atención de Guardias 24/7",
        cantidad: 1,
        precioUnitarioUSD: 350
      }
    ],
    montoSugeridoUSD: 350
  },
  {
    id: "PLANT-02",
    titulo: "2. Mantenimiento Correctivo y Diagnóstico en Sitio",
    descripcion: "Atención técnica urgente por paralización, diagnóstico electrónico, destraba de cabina y corrección de fallas críticas.",
    items: [
      {
        codigo: "MNT-CORR-01",
        descripcion: "Servicio de Mantenimiento Correctivo URGENTE, corrección de fallas eléctricas y destraba técnica",
        cantidad: 1,
        precioUnitarioUSD: 180
      }
    ],
    montoSugeridoUSD: 180
  },
  {
    id: "PLANT-03",
    titulo: "3. Ajustes Técnicos, Nivelación y Calibración",
    descripcion: "Ajuste de frenos electromecánicos, calibración de pesacargas, alineación de paradas de piso y ajuste de holguras de puertas.",
    items: [
      {
        codigo: "SERV-AJUSTES",
        descripcion: "Servicio de Ajuste Técnico Especializado, Calibración de Paradas de Piso y Regulación de Frenos",
        cantidad: 1,
        precioUnitarioUSD: 150
      }
    ],
    montoSugeridoUSD: 150
  },
  {
    id: "PLANT-04",
    titulo: "4. Reparación y Reemplazo de Componentes Dañados",
    descripcion: "Reparación de operador de puerta, rebobinado de motor de tracción, cambio de contactores y cortinas de luz WECO.",
    items: [
      {
        codigo: "REP-COMP-01",
        descripcion: "Servicio de Reparación y Sustitución de Componentes Mecánicos/Eléctricos de Ascensor",
        cantidad: 1,
        precioUnitarioUSD: 420
      }
    ],
    montoSugeridoUSD: 420
  },
  {
    id: "PLANT-05",
    titulo: "5. Modernización Integral a Tecnología VVVF",
    descripcion: "Kit de modernización completa: Cuadro de Mando Integrado CanBus, Variador Yaskawa L1000A, Botoneras COP táctil y cortina 3D.",
    items: [
      {
        codigo: "MOD-KIT-FULL",
        descripcion: "Suministro e instalación de Cuadro de Maniobra Microprocesado VVVF de última generación",
        cantidad: 1,
        precioUnitarioUSD: 2200
      },
      {
        codigo: "FERMATOR-OP",
        descripcion: "Operador de Puerta de Cabina Fermator VVVF4+",
        cantidad: 1,
        precioUnitarioUSD: 680
      }
    ],
    montoSugeridoUSD: 2880
  },
  {
    id: "PLANT-06",
    titulo: "6. Nuevas Instalaciones de Ascensores y Montacargas",
    descripcion: "Suministro, armado de estructura en fosa, montaje de guías de acero, máquina de tracción e instalación completa llave en mano.",
    items: [
      {
        codigo: "NUEVA-INST-01",
        descripcion: "Instalación Completa de Equipo Ascensor / Montacargas Nuevo (Obra Civil, Mecánica y Eléctrica)",
        cantidad: 1,
        precioUnitarioUSD: 8500
      }
    ],
    montoSugeridoUSD: 8500
  },
  {
    id: "PLANT-07",
    titulo: "7. Transporte, Flete y Logística de Equipos Pesados",
    descripcion: "Traslado especializado en camión de estacas/grúa de máquinas de tracción, contrapesos, tableros y bobinas de cable a obra.",
    items: [
      {
        codigo: "LOG-TRANSP-01",
        descripcion: "Servicio de Transporte Especializado, Flete Pesado y Maniobrabilidad de Equipos a Obra",
        cantidad: 1,
        precioUnitarioUSD: 220
      }
    ],
    montoSugeridoUSD: 220
  },
  {
    id: "PLANT-08",
    titulo: "8. Implementación y Licencia de Axon ERP Enterprise System",
    descripcion: "Puesta en marcha del sistema Axon ERP, configuración de PWA offline, biometría, módulo multi-empresa, nómina/contabilidad SENIAT e instalación local.",
    items: [
      {
        codigo: "AXON-ERP-800",
        descripcion: "Licencia e Implementación Integral del Sistema Axon ERP Enterprise (PWA Offline, Seguridad Biométrica/PIN, Multi-empresa, Módulo de Ascensores, Contabilidad, Facturación y Nómina SENIAT)",
        cantidad: 1,
        precioUnitarioUSD: 800
      }
    ],
    montoSugeridoUSD: 800
  }
];

// 4. PRESUPUESTOS (COTIZACIONES) (DEMO)
export const DEMO_PRESUPUESTOS: Presupuesto[] = [
  {
    correlativo: "PRES-2026-0800",
    fecha: "2026-08-01",
    fechaVencimiento: "2026-08-31",
    clienteId: "CLI-002",
    clienteNombre: "Centro Financiero Capital C.A.",
    clienteRif: "J-40992018-0",
    clienteTelefono: "0412-8819022",
    proyectoAscensor: "Implementación e Instalación de Sistema Axon ERP Enterprise",
    items: [
      {
        id: "ITM-AX1",
        descripcion: "Implementación e Instalación Integral de Axon ERP Enterprise System (Incluye PWA Offline, Seguridad Biométrica/PIN, Soporte Multi-Empresa, Contabilidad, Nómina SENIAT y Automatizadores Locales .bat)",
        cantidad: 1,
        precioUnitarioUSD: 800
      }
    ],
    subtotalUSD: 800,
    ivaUSD: 0,
    totalUSD: 800,
    estado: "APROBADO",
    notasValidez: "Presupuesto y propuesta técnica por $800,00 USD. Incluye instalación en servidor/PC local, acceso PWA y capacitación.",
    division: "MODERNIZACION"
  },
  {
    correlativo: "PRES-2026-0501",
    fecha: "2026-07-20",
    fechaVencimiento: "2026-08-20",
    clienteId: "CLI-001",
    clienteNombre: "Residencias Altamira Plaza C.A.",
    clienteRif: "J-30129481-2",
    clienteTelefono: "0414-2391022",
    proyectoAscensor: "Modernización Completa Ascensor Carga Torre A",
    items: [
      {
        id: "ITM-P1",
        descripcion: "Suministro de Cuadro de Mando Integrado Monarch Nice3000+",
        cantidad: 1,
        precioUnitarioUSD: 1850
      },
      {
        id: "ITM-P2",
        descripcion: "Instalación de Botonera Inoxidable COP con Display TFT de 7\"",
        cantidad: 1,
        precioUnitarioUSD: 380
      },
      {
        id: "ITM-P3",
        descripcion: "Mano de Obra Certificada de Modernización e Integración Tecno Elevatev",
        cantidad: 1,
        precioUnitarioUSD: 800
      }
    ],
    subtotalUSD: 3030,
    ivaUSD: 484.8,
    totalUSD: 3514.8,
    estado: "ENVIADO",
    notasValidez: "Presupuesto válido por 30 días continuos. Tasa oficial BCV del día de facturación.",
    division: "MODERNIZACION"
  }
];

// 5. RECIBOS Y NOTAS DE ENTREGA (DEMO)
export const DEMO_RECIBOS: ReciboNota[] = [
  {
    correlativo: "REC-2026-0800",
    tipo: "RECIBO_PAGO",
    fecha: "2026-08-01",
    clienteNombre: "Cliente Corporativo / Implementación Axon ERP",
    clienteRif: "J-50019283-0",
    concepto: "Pago Total por Servicio de Licenciamiento, Instalación Local y Puesta en Marcha del Sistema Axon ERP Enterprise ($800 USD)",
    montoUSD: 800,
    montoBs: 29200,
    formaPago: "TRANSFERENCIA",
    referenciaPago: "REF-AXON-800USD",
    status: "ACTIVO",
    division: "MODERNIZACION"
  },
  {
    correlativo: "REC-000311",
    tipo: "RECIBO_PAGO",
    fecha: "2026-07-18",
    clienteNombre: "Residencias Altamira Plaza C.A.",
    clienteRif: "J-30129481-2",
    concepto: "Abono 50% por servicio de reparación de cortina fotoeléctrica y abono mensual",
    montoUSD: 300,
    montoBs: 10950,
    formaPago: "TRANSFERENCIA",
    referenciaPago: "REF-99201834",
    status: "ACTIVO",
    division: "MANTENIMIENTO"
  },
  {
    correlativo: "NE-000452",
    tipo: "NOTA_ENTREGA",
    fecha: "2026-07-25",
    clienteNombre: "Hotel Suites Las Mercedes",
    clienteRif: "J-50112839-4",
    concepto: "Despacho de 2 Zapatas de Guía Teplón 16mm y 1 Garrafa de Aceite Sintético Shell ISO 220",
    montoUSD: 89,
    montoBs: 3248.5,
    formaPago: "EFECTIVO",
    status: "ACTIVO",
    division: "MANTENIMIENTO"
  }
];

// 6. CONTABILIDAD (MOVIMIENTOS) (DEMO)
export const DEMO_MOVIMIENTOS: MovimientoContable[] = [
  {
    id: "MOV-1001",
    fecha: "2026-07-15",
    tipo: "INGRESO",
    categoria: "Facturación de Servicios",
    descripcion: "Cobro Factura FACT-001001 Residencias Altamira Plaza",
    montoUSD: 626.4,
    montoBs: 22863.6,
    comprobanteReferencia: "FACT-001001",
    proveedorOCliente: "Residencias Altamira Plaza C.A.",
    division: "MANTENIMIENTO"
  },
  {
    id: "MOV-1002",
    fecha: "2026-07-18",
    tipo: "COMPRA_INVENTARIO",
    categoria: "Repuestos y Componentes",
    descripcion: "Adquisición de Lote de Variadores Yaskawa L1000A e Importación",
    montoUSD: 2900,
    montoBs: 105850,
    comprobanteReferencia: "COMPRA-8812",
    proveedorOCliente: "Importadora Yaskawa Latam",
    division: "MODERNIZACION"
  },
  {
    id: "MOV-1003",
    fecha: "2026-07-20",
    tipo: "EGRESO",
    categoria: "Nómina y Cesta Ticket",
    descripcion: "Pago de Nómina quincenal de técnicos elevadoristas",
    montoUSD: 1450,
    montoBs: 52925,
    comprobanteReferencia: "NOM-2026-13",
    proveedorOCliente: "Personal Tecno Elevatev C.A.",
    division: "MANTENIMIENTO"
  }
];

// 7. GESTIÓN DE NÓMINA (EMPLEADOS, PRÉSTAMOS, NÓMINA PROCESADA) (DEMO)
export const DEMO_EMPLEADOS: Empleado[] = [
  {
    id: "EMP-001",
    cedula: "V-18.239.401",
    nombre: "Ing. Alejandro Mendoza",
    cargo: "INGENIERO_JEFE",
    fechaIngreso: "2021-03-15",
    sueldoBaseUSD: 650,
    cestaTicketUSD: 40,
    cuentaBancaria: "0102-0192-88-0100293812",
    estatus: "ACTIVO"
  },
  {
    id: "EMP-002",
    cedula: "V-21.902.182",
    nombre: "Téc. Francisco Rivas",
    cargo: "TECNICO_ELEVADORISTA",
    fechaIngreso: "2022-06-01",
    sueldoBaseUSD: 420,
    cestaTicketUSD: 40,
    cuentaBancaria: "0108-0022-11-0100998823",
    estatus: "ACTIVO"
  },
  {
    id: "EMP-003",
    cedula: "V-24.119.823",
    nombre: "Téc. Carlos Eduardo Silva",
    cargo: "AYUDANTE_TECNICO",
    fechaIngreso: "2023-01-10",
    sueldoBaseUSD: 320,
    cestaTicketUSD: 40,
    cuentaBancaria: "0134-0992-33-0100445511",
    estatus: "ACTIVO"
  },
  {
    id: "EMP-004",
    cedula: "V-19.882.102",
    nombre: "Lic. Carola Martínez",
    cargo: "ADMINISTRATIVO",
    fechaIngreso: "2022-09-15",
    sueldoBaseUSD: 450,
    cestaTicketUSD: 40,
    cuentaBancaria: "0105-0112-44-0100556677",
    estatus: "ACTIVO"
  }
];

// PRÉSTAMOS (DEMO)
export const DEMO_PRESTAMOS: PrestamoEmpleado[] = [
  {
    id: "PREST-001",
    empleadoId: "EMP-002",
    fecha: "2026-06-10",
    montoUSD: 150,
    motivo: "Adelanto para herramientas personales de medición",
    cuotasTotales: 3,
    cuotasPagadas: 1,
    estado: "PENDIENTE"
  }
];

// NÓMINA (DEMO)
export const DEMO_NOMINA_HISTORIAL: RegistroNomina[] = [
  {
    id: "NOM-1001",
    periodo: "Primera Quincena Julio 2026",
    fechaPago: "2026-07-15",
    empleadoId: "EMP-001",
    empleadoNombre: "Ing. Alejandro Mendoza",
    cargo: "INGENIERO_JEFE",
    sueldoBaseUSD: 325,
    cestaTicketUSD: 20,
    bonificacionEspecialUSD: 50,
    descuentoPrestamosUSD: 0,
    netoAPagarUSD: 395,
    netoAPagarBs: 14417.5,
    estado: "PAGADA"
  },
  {
    id: "NOM-1002",
    periodo: "Primera Quincena Julio 2026",
    fechaPago: "2026-07-15",
    empleadoId: "EMP-002",
    empleadoNombre: "Téc. Francisco Rivas",
    cargo: "TECNICO_ELEVADORISTA",
    sueldoBaseUSD: 210,
    cestaTicketUSD: 20,
    bonificacionEspecialUSD: 30,
    descuentoPrestamosUSD: 50,
    netoAPagarUSD: 210,
    netoAPagarBs: 7665,
    estado: "PAGADA"
  }
];

// 8. TRIBUTARIO (RETENCIONES DE IVA, ISLR, MUNICIPAL) (DEMO)
export const DEMO_RETENCIONES: RetencionTributaria[] = [
  {
    id: "RET-2026-0001",
    correlativoComprobante: "20260700000012",
    fechaEmision: "2026-07-18",
    tipoRetencion: "IVA_COMPRA",
    proveedorNombre: "Importadora Yaskawa Latam C.A.",
    proveedorRif: "J-31992019-8",
    nroFacturaAfectada: "FACT-8812",
    nroControlAfectado: "00-001289",
    montoBaseUSD: 2500,
    porcentajeRetencion: 75,
    montoRetenidoUSD: 300,
    montoRetenidoBs: 10950,
    division: "MODERNIZACION"
  },
  {
    id: "RET-2026-0002",
    correlativoComprobante: "20260700000013",
    fechaEmision: "2026-07-20",
    tipoRetencion: "ISLR",
    proveedorNombre: "Servicios Técnicos ElevaTech C.A.",
    proveedorRif: "J-40112938-1",
    nroFacturaAfectada: "FACT-0021",
    nroControlAfectado: "00-000021",
    montoBaseUSD: 800,
    porcentajeRetencion: 2,
    montoRetenidoUSD: 16,
    montoRetenidoBs: 584,
    division: "MANTENIMIENTO"
  }
];

// VALES & SOLICITUDES COMPATIBLES (DEMO)
export const DEMO_NOTES: Nota[] = [
  {
    NroVale: "1001",
    Fecha: "2026-07-11 10:15 AM",
    Responsable: "Ing. Alejandro Mendoza",
    Destino: "RESIDENCIAS ALTAMIRA PLAZA - ASCENSOR TORRE A",
    ProyectoDesc: "Sustitución de Variador de Frecuencia VVVF",
    TipoDespacho: "Nota de Entrega",
    Productos: JSON.stringify([
      { val_c: "ASC-001", val_mo: "YASKAWA L1000A", val_d: "Variador de Frecuencia VVVF 15HP", val_m: "Yaskawa", cantidad: 1 }
    ]),
    Firma: "MOCK_SIGNATURE_DATA_SVG_LINE",
    Status: "ACTIVO",
    division: "MODERNIZACION",
    Rif: "J-30129481-2"
  }
];

export const DEMO_SOLICITUDES: SolicitudProyecto[] = [
  {
    id: "REQ1001",
    Fecha: "2026-07-12 09:00 AM",
    Ingeniero: "Ing. Alejandro Mendoza",
    Proyecto: "HOTEL SUITES LAS MERCEDES",
    Descripcion: "Lote de zapatas autolubricantes de 16mm y aceite ISO 220",
    Status: "PENDIENTE",
    division: "MANTENIMIENTO",
    Productos: JSON.stringify([
      { val_c: "MNT-002", cantidad: 4 },
      { val_c: "MNT-001", cantidad: 1 }
    ])
  }
];

export const DEMO_KARDEX: EntradaKardex[] = [
  {
    id: "K-1001",
    sku: "ASC-001",
    fecha: "2026-07-11 10:15 AM",
    tipo: "SALIDA",
    referencia: "Vale Nro. 1001 - Altamira Plaza",
    cambioStock: -1,
    stockResultante: 6,
    division: "MODERNIZACION"
  }
];

// HELPER FUNCTIONS Y ESTRUCTURAS DE FAMILIA PARA INVENTARIO
export const MOCK_COSTS: Record<string, number> = {
  "ASC-001": 1450,
  "ASC-002": 680,
  "ASC-003": 1850,
  "ASC-004": 12,
  "ASC-005": 320,
  "MNT-001": 85,
  "MNT-002": 45,
  "MNT-003": 180,
  "MNT-004": 150
};

export const FAMILIAS_INVENTARIO = [
  { key: "CONTROL", label: "Maniobras y Control VVVF", minVal: 3 },
  { key: "PUERTAS", label: "Puertas y Operadores Fermator", minVal: 5 },
  { key: "TRACCION", label: "Cables y Poleas de Tracción", minVal: 10 },
  { key: "SEGURIDAD", label: "Limites y Fotocélulas", minVal: 4 },
  { key: "LUBRICACION", label: "Aceites y Lubricación", minVal: 3 },
  { key: "GENERAL", label: "Componentes Generales", minVal: 2 }
];

export function clasificarFamilia(descripcion: string) {
  const d = descripcion.toLowerCase();
  if (d.includes('variador') || d.includes('control') || d.includes('maniobra') || d.includes('tarjeta') || d.includes('cuadro')) {
    return FAMILIAS_INVENTARIO[0];
  }
  if (d.includes('puerta') || d.includes('fermator') || d.includes('operador')) {
    return FAMILIAS_INVENTARIO[1];
  }
  if (d.includes('cable') || d.includes('tracción') || d.includes('polea') || d.includes('motor')) {
    return FAMILIAS_INVENTARIO[2];
  }
  if (d.includes('fotocélula') || d.includes('límite') || d.includes('pesacargas') || d.includes('freno')) {
    return FAMILIAS_INVENTARIO[3];
  }
  if (d.includes('aceite') || d.includes('lubricante') || d.includes('zapata')) {
    return FAMILIAS_INVENTARIO[4];
  }
  return FAMILIAS_INVENTARIO[5];
}

export function coincidenPalabrasClave(producto: Producto, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const d = (producto.val_d + " " + producto.val_m + " " + producto.val_mo + " " + producto.val_c)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const words = q.split(/\s+/).filter(Boolean);
  return words.every(w => d.includes(w));
}

export function normalizarTexto(txt: string): string {
  if (!txt) return "";
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// 10. REPORTES TÉCNICOS DE CAMPO E INSPECCIÓN EN OBRA (DEMO)
export const DEMO_REPORTES_TECNICOS: ReporteTecnicoCampo[] = [
  {
    id: "REP-OBRA-001",
    correlativo: "REP-2026-001",
    fecha: "2026-07-28",
    tecnicoNombre: "Ing. Carlos Mendoza",
    clienteNombre: "Residencias Altamira Plaza",
    clienteRif: "J-30491823-1",
    ubicacionObra: "Av. Luis Roche, Res. Altamira Plaza, Chacao, Caracas",
    equipoAscensor: "Ascensor Principal Torre A (14 Paradas)",
    tipoReporte: "INSPECCION_DANIOS",
    prioridadAtencion: "CRITICA",
    diagnosticoDanio: "Se detectó variador de frecuencia sobrecalentado con falla de sobrecorriente. Contactores principales desgastados y patina defectuosa en operador de puerta.",
    repuestosFaltantes: [
      { id: "1", repuestoNombre: "Variador de Frecuencia VVVF Yaskawa 15HP", cantidadRequerida: 1, prioridad: "URGENTE", observaciones: "Reemplazo inmediato por avería eléctrica" },
      { id: "2", repuestoNombre: "Juego de Contactores 220V Schmersal", cantidadRequerida: 2, prioridad: "ALTA", observaciones: "Contactos flameados" }
    ],
    requierePresupuesto: true,
    montoEstimadoRepuestosUSD: 1850,
    observacionesCotizacion: "Requiere cotización de repuestos urgentes + mano de obra de instalación.",
    fotosEvidenciaCount: 3,
    firmaTecnico: "C. Mendoza - C.I. 16.482.102",
    firmaClienteObra: "Javier Rivas (Junta de Condominio)",
    estado: "PENDIENTE_COTIZACION",
    division: "MODERNIZACION"
  },
  {
    id: "REP-OBRA-002",
    correlativo: "REP-2026-002",
    fecha: "2026-07-25",
    tecnicoNombre: "Téc. Manuel Guerra",
    clienteNombre: "Centro Empresarial Capital",
    clienteRif: "J-40182930-4",
    ubicacionObra: "Calle El Recreo, Sabana Grande, Caracas",
    equipoAscensor: "Ascensor Carga y Pasajeros #3",
    tipoReporte: "VISITA_PRESUPUESTO",
    prioridadAtencion: "NORMAL",
    diagnosticoDanio: "Visita técnica de levantamiento para modernización de cuadro de control electromecánico a control electrónico con tecnología VVVF e iluminación LED.",
    repuestosFaltantes: [
      { id: "1", repuestoNombre: "Cuadro de Mando Integrado Monarch Nice-3000+", cantidadRequerida: 1, prioridad: "ALTA" },
      { id: "2", repuestoNombre: "Cable de Tracción 10mm (Metros)", cantidadRequerida: 120, prioridad: "MEDIA" }
    ],
    requierePresupuesto: true,
    montoEstimadoRepuestosUSD: 3400,
    observacionesCotizacion: "El cliente solicitó presupuesto de modernización completa con 12 meses de garantía.",
    fotosEvidenciaCount: 5,
    firmaTecnico: "M. Guerra",
    firmaClienteObra: "Ing. Beatriz Paredes",
    estado: "EN_REPARACION",
    division: "MODERNIZACION"
  },
  {
    id: "REP-OBRA-003",
    correlativo: "REP-2026-003",
    fecha: "2026-07-29",
    tecnicoNombre: "Téc. Roberto Gómez",
    clienteNombre: "Torre Financiera Las Mercedes",
    clienteRif: "J-30918234-8",
    ubicacionObra: "Calle Paris, Torre Las Mercedes, Baruta",
    equipoAscensor: "Ascensor VIP Directo a PH",
    tipoReporte: "FALTANTE_REPUESTOS",
    prioridadAtencion: "ALTA",
    diagnosticoDanio: "Durante revisión periódica se constató falta de patines de fricción y cortina infrarroja de seguridad averiada.",
    repuestosFaltantes: [
      { id: "1", repuestoNombre: "Cortina Fotocélula Infrarroja WECO (220 Haces)", cantidadRequerida: 1, prioridad: "URGENTE", observaciones: "Seguridad de pasajeros" },
      { id: "2", repuestoNombre: "Zapatillas de Fricción Nylo-Guía 16mm", cantidadRequerida: 4, prioridad: "MEDIA" }
    ],
    requierePresupuesto: true,
    montoEstimadoRepuestosUSD: 420,
    observacionesCotizacion: "Se requiere enviar propuesta urgente para evitar suspensión del equipo.",
    fotosEvidenciaCount: 2,
    firmaTecnico: "R. Gómez",
    firmaClienteObra: "Supervisión de Mantenimiento",
    estado: "REPUESTOS_SOLICITADOS",
    division: "MANTENIMIENTO"
  }
];

// 11. SOLICITUDES Y COTIZACIONES EN LÍNEA DE CLIENTES (DEMO)
export const DEMO_SOLICITUDES_CLIENTES: import('./types').SolicitudCotizacionCliente[] = [
  {
    id: "SOL-WEB-8821",
    correlativo: "SOL-2026-001",
    fecha: "2026-08-14",
    hora: "08:15 AM",
    clienteNombre: "Residencias Park Palace, C.A.",
    clienteRif: "J-30491823-1",
    personaContacto: "Ing. Carlos Mendoza (Junta Condominio)",
    telefono: "+58 412 555-0199",
    email: "condominio.parkpalace@gmail.com",
    edificioUbicacion: "Residencias Park Palace, Av. Principal de Altamira, Chacao",
    apartamentoTorre: "Torre A (Ascensor Principal #3)",
    tipoServicio: "MODERNIZACION",
    paradas: 14,
    capacidadPersonas: 8,
    detalles: "El ascensor 3 presenta constantes descalibraciones en piso 7 y 12. Solicitamos cotización para modernización de cuadro a tecnología VVVF y botonera.",
    estado: "NUEVA",
    subidoAExcel: false
  },
  {
    id: "SOL-WEB-8822",
    correlativo: "SOL-2026-002",
    fecha: "2026-08-14",
    hora: "09:30 AM",
    clienteNombre: "Torre Financiera Caracas, C.A.",
    clienteRif: "J-40812934-5",
    personaContacto: "Lic. Elena Rivas (Gerente Operaciones)",
    telefono: "+58 414 234-9012",
    email: "administracion@torrefinanciera.com",
    edificioUbicacion: "Torre Financiera Caracas, Av. Francisco de Miranda, El Rosal",
    apartamentoTorre: "Torre Principal (Batería 4 Ascensores)",
    tipoServicio: "MANTENIMIENTO",
    paradas: 22,
    capacidadPersonas: 15,
    detalles: "Requerimos propuesta formal de contrato de mantenimiento mensual preventivo 24/7 para nuestros 4 equipos de pasajeros.",
    estado: "EN_EVALUACION",
    subidoAExcel: false
  },
  {
    id: "SOL-WEB-8823",
    correlativo: "SOL-2026-003",
    fecha: "2026-08-13",
    hora: "04:45 PM",
    clienteNombre: "Condominio Residencias Altamira",
    clienteRif: "J-29831092-4",
    personaContacto: "Sra. Beatriz Blanco (Administradora)",
    telefono: "+58 416 789-0123",
    email: "res.altamira.chacao@gmail.com",
    edificioUbicacion: "Residencias Altamira, 3ra Transversal, Los Palos Grandes",
    apartamentoTorre: "Ascensor Carga y Servicios",
    tipoServicio: "REPUESTOS",
    paradas: 10,
    capacidadPersonas: 6,
    detalles: "Se necesita cotizar reemplazo de guayas de tracción de 10mm y zapatas de freno.",
    estado: "COTIZADO",
    presupuestoGeneradoCorrelativo: "PRES-2026-003",
    subidoAExcel: true,
    fechaSubidoExcel: "2026-08-13 17:30"
  }
];

// ==========================================
// LISTAS INICIALES EN LIMPIO (INICIO DESDE CERO - 0 DATOS DE PRUEBA)
// ==========================================
export const INITIAL_PRODUCTS: Producto[] = [];
export const INITIAL_PRESTAMOS_HERRAMIENTAS: any[] = [];
export const INITIAL_CLIENTES: Cliente[] = [];
export const INITIAL_FACTURAS: Factura[] = [];
export const INITIAL_PRESUPUESTOS: Presupuesto[] = [];
export const INITIAL_RECIBOS: ReciboNota[] = [];
export const INITIAL_MOVIMIENTOS: MovimientoContable[] = [];
export const INITIAL_EMPLEADOS: Empleado[] = [];
export const INITIAL_PRESTAMOS: PrestamoEmpleado[] = [];
export const INITIAL_NOMINA_HISTORIAL: RegistroNomina[] = [];
export const INITIAL_RETENCIONES: RetencionTributaria[] = [];
export const INITIAL_NOTES: Nota[] = [];
export const INITIAL_SOLICITUDES: SolicitudProyecto[] = [];
export const INITIAL_KARDEX: EntradaKardex[] = [];
export const INITIAL_REPORTES_TECNICOS: ReporteTecnicoCampo[] = [];
export const INITIAL_SOLICITUDES_CLIENTES: import('./types').SolicitudCotizacionCliente[] = [];


