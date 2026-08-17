import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Initialize Gemini AI client server-side
  let ai: GoogleGenAI | null = null;
  const getAIClient = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Falta la variable de entorno GEMINI_API_KEY en el servidor.");
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // In-Memory Cloud Sync Store for Multi-Device Realtime Collaboration
  const cloudStore = {
    solicitudesClientes: [] as any[],
    reportesTecnicos: [] as any[],
    emergencias: [] as any[],
    pings: [] as any[],
    lastUpdated: Date.now()
  };

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      cloudItems: {
        solicitudes: cloudStore.solicitudesClientes.length,
        reportes: cloudStore.reportesTecnicos.length,
        emergencias: cloudStore.emergencias.length
      }
    });
  });

  // --- CLOUD SYNC ENDPOINTS (MULTI-DEVICE REAL-TIME BRIDGE) ---
  
  // 1. Obtener estado completo del servidor
  app.get("/api/cloud/sync-state", (req, res) => {
    res.json({
      success: true,
      solicitudesClientes: cloudStore.solicitudesClientes,
      reportesTecnicos: cloudStore.reportesTecnicos,
      emergencias: cloudStore.emergencias,
      pings: cloudStore.pings.slice(0, 20),
      lastUpdated: cloudStore.lastUpdated
    });
  });

  // 2. Registrar Solicitud de Cotización de Cliente desde Portal Móvil/Web
  app.post("/api/cloud/solicitud-cliente", (req, res) => {
    try {
      const solicitud = req.body;
      if (!solicitud || !solicitud.clienteNombre) {
        return res.status(400).json({ error: "Datos de solicitud incompletos." });
      }

      // Evitar duplicados por id o correlativo
      const existsIndex = cloudStore.solicitudesClientes.findIndex(
        s => s.id === solicitud.id || (s.correlativo && s.correlativo === solicitud.correlativo && s.clienteNombre === solicitud.clienteNombre)
      );

      if (existsIndex >= 0) {
        cloudStore.solicitudesClientes[existsIndex] = { ...cloudStore.solicitudesClientes[existsIndex], ...solicitud };
      } else {
        cloudStore.solicitudesClientes.unshift(solicitud);
      }

      cloudStore.lastUpdated = Date.now();
      console.log(`[CLOUD SYNC] 📥 Nueva solicitud recibida de ${solicitud.clienteNombre} (${solicitud.correlativo || solicitud.id})`);

      return res.json({ 
        success: true, 
        message: "Solicitud registrada con éxito en el servidor central.", 
        total: cloudStore.solicitudesClientes.length,
        solicitud
      });
    } catch (err: any) {
      console.error("Error al registrar solicitud en nube:", err);
      return res.status(500).json({ error: err?.message || "Error al procesar solicitud." });
    }
  });

  // 3. Listar solicitudes
  app.get("/api/cloud/solicitudes-clientes", (req, res) => {
    res.json({
      success: true,
      solicitudes: cloudStore.solicitudesClientes,
      lastUpdated: cloudStore.lastUpdated
    });
  });

  // 4. Actualizar estado de solicitud
  app.patch("/api/cloud/solicitud-cliente/:id", (req, res) => {
    const { id } = req.params;
    const { estado, presupuestoGeneradoCorrelativo } = req.body;
    
    const item = cloudStore.solicitudesClientes.find(s => s.id === id);
    if (item) {
      if (estado) item.estado = estado;
      if (presupuestoGeneradoCorrelativo) item.presupuestoGeneradoCorrelativo = presupuestoGeneradoCorrelativo;
      cloudStore.lastUpdated = Date.now();
      return res.json({ success: true, item });
    }
    return res.status(404).json({ error: "Solicitud no encontrada." });
  });

  // 5. Eliminar solicitud
  app.delete("/api/cloud/solicitud-cliente/:id", (req, res) => {
    const { id } = req.params;
    cloudStore.solicitudesClientes = cloudStore.solicitudesClientes.filter(s => s.id !== id);
    cloudStore.lastUpdated = Date.now();
    res.json({ success: true });
  });

  // 6. Registrar Reporte Técnico de Campo
  app.post("/api/cloud/reporte-tecnico", (req, res) => {
    try {
      const reporte = req.body;
      if (!reporte || (!reporte.clienteNombre && !reporte.ubicacionObra && !reporte.edificioCliente && !reporte.correlativo && !reporte.id)) {
        return res.status(400).json({ error: "Datos de reporte técnico incompletos." });
      }

      // Normalizar nombre de cliente/obra
      const itemToSave = {
        ...reporte,
        clienteNombre: reporte.clienteNombre || reporte.edificioCliente || 'Obra en Sitio',
        ubicacionObra: reporte.ubicacionObra || reporte.edificioCliente || 'Ubicación General',
        id: reporte.id || `REP-OBRA-${Date.now()}`,
        correlativo: reporte.correlativo || `REP-2026-${String(cloudStore.reportesTecnicos.length + 1).padStart(3, '0')}`,
        fecha: reporte.fecha || new Date().toISOString().split('T')[0]
      };

      const existsIndex = cloudStore.reportesTecnicos.findIndex(
        r => r.id === itemToSave.id || (r.correlativo && r.correlativo === itemToSave.correlativo)
      );

      if (existsIndex >= 0) {
        cloudStore.reportesTecnicos[existsIndex] = { ...cloudStore.reportesTecnicos[existsIndex], ...itemToSave };
      } else {
        cloudStore.reportesTecnicos.unshift(itemToSave);
      }

      cloudStore.lastUpdated = Date.now();
      console.log(`[CLOUD SYNC] 👷 Nuevo reporte técnico recibido: ${itemToSave.clienteNombre} (${itemToSave.correlativo})`);

      return res.json({ success: true, total: cloudStore.reportesTecnicos.length, reporte: itemToSave });
    } catch (err: any) {
      console.error("Error al registrar reporte técnico en nube:", err);
      return res.status(500).json({ error: err?.message || "Error al procesar reporte." });
    }
  });

  // 7. Listar reportes técnicos
  app.get("/api/cloud/reportes-tecnicos", (req, res) => {
    res.json({
      success: true,
      reportes: cloudStore.reportesTecnicos,
      lastUpdated: cloudStore.lastUpdated
    });
  });

  // 8. Registrar Emergencia
  app.post("/api/cloud/emergencia", (req, res) => {
    const emergencia = {
      ...req.body,
      id: req.body.id || `EMG-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    cloudStore.emergencias.unshift(emergencia);
    cloudStore.lastUpdated = Date.now();
    console.log(`[CLOUD SYNC] 🚨 ALERTA DE EMERGENCIA: ${emergencia.edificioUbicacion || 'Ubicación Desconocida'}`);
    res.json({ success: true, emergencia });
  });

  // 9. Registrar Ping de enlace en vivo desde móviles/portales
  app.post("/api/cloud/ping", (req, res) => {
    const pingData = {
      id: `PING-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      device: req.body.device || req.headers['user-agent'] || 'Navegador Web',
      role: req.body.role || 'PORTAL_CLIENTE',
      clientName: req.body.clientName || 'Usuario Remoto',
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    cloudStore.pings.unshift(pingData);
    if (cloudStore.pings.length > 50) cloudStore.pings.pop();
    cloudStore.lastUpdated = Date.now();
    res.json({ success: true, ping: pingData, serverTime: Date.now() });
  });

  // 10. Feed de eventos recientes (Polling rápido para todos los clientes y Gestor)
  app.get("/api/cloud/feed", (req, res) => {
    const since = Number(req.query.since) || 0;
    res.json({
      success: true,
      serverTime: Date.now(),
      lastUpdated: cloudStore.lastUpdated,
      hasChanges: cloudStore.lastUpdated > since,
      solicitudesClientes: cloudStore.solicitudesClientes,
      reportesTecnicos: cloudStore.reportesTecnicos,
      emergencias: cloudStore.emergencias.slice(0, 10),
      recentPings: cloudStore.pings.slice(0, 5)
    });
  });

  // API Endpoint: AI Stock Part Recognition from Report Image
  app.post("/api/gemini/analyze-stock-part", async (req, res) => {
    try {
      const { imageBase64, mimeType, catalog } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No se proporcionó ninguna imagen." });
      }

      const client = getAIClient();

      // Format catalog to simplify payload size for Gemini prompt
      const catalogSummary = Array.isArray(catalog) ? catalog.map((p: any) => ({
        val_c: p.val_c,
        val_d: p.val_d,
        val_m: p.val_m,
        val_mo: p.val_mo,
        val_s: p.val_s,
        val_u: p.val_u || 'Und',
        precioUSD: p.precioUSD,
        val_r: p.val_r || ''
      })) : [];

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Eres el Asistente Técnico y Gestor de Inventarios de AXON ERP (Especializado en Ascensores, Mantenimiento Industrial y Repuestos).
Examina la fotografía adjunta tomada en un reporte técnico de campo de inspección/daños.
1. Identifica el repuesto, componente electrónico, tarjeta, patín, bobina, contactor, rodamiento o pieza mecánica presente en la imagen.
2. Compara la pieza con la lista actual de nuestro catálogo de inventario:
${JSON.stringify(catalogSummary.slice(0, 300))}

Instrucciones de respuesta:
- Indica si la pieza fue identificada en la imagen.
- Da un nombre y descripción técnica clara de lo que ves en la imagen.
- Si existe un repuesto en el catálogo que coincida o sea equivalente, proporciona su código de inventario "val_c".
- Nivel de coincidencia: "ALTO", "MEDIO", "BAJO", "NINGUNO".
- Proporciona una explicación ejecutiva para el gestor sobre si el repuesto está disponible en el stock actual, su cantidad o si debe comprarse/cotizarse.`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              identificado: { type: Type.BOOLEAN },
              nombrePiezaIdentificada: { type: Type.STRING },
              descripcionVisual: { type: Type.STRING },
              codigoCoincidente: { type: Type.STRING },
              nivelCoincidencia: { type: Type.STRING },
              explicacion: { type: Type.STRING }
            },
            required: ["identificado", "nombrePiezaIdentificada", "descripcionVisual", "nivelCoincidencia", "explicacion"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      return res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.error("Error al analizar la imagen del repuesto:", err);
      return res.status(500).json({ error: err?.message || "Error al procesar el análisis de la imagen." });
    }
  });

  // API Endpoint: AI Market Competitive Pricing Suggestion
  app.post("/api/gemini/suggest-competitive-price", async (req, res) => {
    try {
      const { model, description, brand, code, photoUrl, imageBase64 } = req.body;

      if (!model && !description && !code) {
        return res.status(400).json({ error: "Debe proporcionar al menos Modelo, Descripción o Código del repuesto." });
      }

      const client = getAIClient();
      const contents: any[] = [];

      let imageAttached = false;
      const rawImage = imageBase64 || photoUrl;
      if (rawImage && typeof rawImage === 'string' && rawImage.startsWith('data:image/')) {
        const mimeTypeMatch = rawImage.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        const cleanBase64 = rawImage.replace(/^data:image\/\w+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          }
        });
        imageAttached = true;
      }

      contents.push({
        text: `Eres el Especialista de Precios y Competitividad de Mercado para Repuestos de Ascensores y Elevadores Industriales de AXON ERP.
Analiza la siguiente información de repuesto de ascensor:
- Modelo Técnico: ${model || 'No especificado'}
- Descripción/Nombre: ${description || 'No especificado'}
- Marca/Fabricante: ${brand || 'Genérico'}
- Código SKU/Pieza: ${code || 'No especificado'}
${imageAttached ? '- Fotografía adjunta incluida para inspección de características físicas.' : ''}

Tu tarea es investigar y estimar tres (3) referencias reales de precios de mercado (USD) para este tipo de componente de ascensor en el mercado industrial/comercial.

Proporciona:
1. Una lista de 3 fuentes/referencias de mercado con su precio estimado en USD y un detalle del tipo de canal (ej. "Distribuidor Autorizado OEM", "Proveedor Multimarca", "Importador de Repuestos Equivalentes").
2. El 'precioSugeridoUSD' óptimo y competitivo, calculado mediante la mediana/promedio con un margen comercial adecuado.
3. El rango estimado de mercado (precioMinimoUSD y precioMaximoUSD).
4. Una 'justificacion' concisa exponiendo el criterio técnico-comercial para esta recomendación de precio.`
      });

      const generateConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            referenciasMercado: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fuente: { type: Type.STRING },
                  precioUSD: { type: Type.NUMBER },
                  detalle: { type: Type.STRING }
                },
                required: ["fuente", "precioUSD", "detalle"]
              }
            },
            precioSugeridoUSD: { type: Type.NUMBER },
            precioMinimoUSD: { type: Type.NUMBER },
            precioMaximoUSD: { type: Type.NUMBER },
            justificacion: { type: Type.STRING }
          },
          required: ["referenciasMercado", "precioSugeridoUSD", "precioMinimoUSD", "precioMaximoUSD", "justificacion"]
        }
      };

      let response;
      try {
        // Intentar primero con búsqueda en tiempo real de Google
        response = await client.models.generateContent({
          model: "gemini-3.6-flash",
          contents,
          config: {
            ...generateConfig,
            tools: [{ googleSearch: {} }]
          }
        });
      } catch (searchError: any) {
        console.warn("Google Search Grounding cuota/error (reintentando con análisis de modelo estándar):", searchError?.message || searchError);
        // Fallback automático sin herramienta de búsqueda para evitar límite de cuota 429
        response = await client.models.generateContent({
          model: "gemini-3.6-flash",
          contents,
          config: generateConfig
        });
      }

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      return res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.error("Error al generar sugerencia de precio competitivo:", err);
      return res.status(500).json({ error: err?.message || "Error al comunicarse con el servicio de análisis de precios." });
    }
  });

  // Endpoint de estructuración de dictado por voz para técnicos (Gemini 3.6 Flash)
  app.post("/api/gemini/parse-voice-request", express.json(), async (req, res) => {
    try {
      const client = getAIClient();
      const { transcript } = req.body || {};

      if (!transcript) {
        return res.status(400).json({ error: "No se proporcionó la transcripción de voz." });
      }

      const prompt = `Eres el Asistente de Control de Voz para AXON ERP de Técnicos de Campo e Ingenieros de Ascensores y Mantenimiento Industrial.
Procesa la siguiente transcripción dictada por un técnico con las manos ocupadas:
"${transcript}"

Extrae y responde en JSON puro:
1. 'ingeniero': Nombre o título del técnico o ingeniero solicitante.
2. 'proyecto': Nombre de la obra, proyecto o cliente/edificio.
3. 'descripcion': Descripción limpia y profesional del requerimiento técnico.
4. 'comandoEnviar': booleano true si el técnico indicó un comando de envío (ej: "enviar a la nube", "guardar", "enviar solicitud").`;

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingeniero: { type: Type.STRING },
              proyecto: { type: Type.STRING },
              descripcion: { type: Type.STRING },
              comandoEnviar: { type: Type.BOOLEAN }
            },
            required: ["ingeniero", "proyecto", "descripcion"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.error("Error al procesar dictado de voz en servidor:", err);
      return res.status(500).json({ error: err?.message || "Error al procesar dictado por voz." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AXON ERP Server running on http://localhost:${PORT}`);
  });
}

startServer();
