import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { clasificarFamilia, coincidenPalabrasClave, MOCK_COSTS, FAMILIAS_INVENTARIO } from '../data';
import { Producto } from '../types';
import { Search, Edit, SlidersHorizontal, TriangleAlert, CheckCircle2, RotateCcw, Box, Camera, Plus, Image as ImageIcon, QrCode, Scan, Wrench, Sparkles, DollarSign, TrendingUp, Check, RefreshCw, HelpCircle, PackageCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhotoUploader from './PhotoUploader';
import { ProductQRModal } from './ProductQRModal';
import { QRScannerModal } from './QRScannerModal';

interface InventarioTabProps {
  initialFamilyFilter: string | null;
  clearInitialFamilyFilter: () => void;
}

export default function InventarioTab({ initialFamilyFilter, clearInitialFamilyFilter }: InventarioTabProps) {
  const { products, activeDivision, ajustarStockIndividual, actualizarProducto, agregarProducto, addToast } = useApp();

  // Estados de Filtros
  const [keyword, setKeyword] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<string>("TODOS"); // TODOS, EN_STOCK, BAJO_MINIMO, AGOTADOS

  // Estados para Modal de Edición
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [editDesc, setEditDesc] = useState<string>("");
  const [editBrand, setEditBrand] = useState<string>("");
  const [editRef, setEditRef] = useState<string>("");
  const [editStock, setEditStock] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMotivo, setEditMotivo] = useState<string>("Auditoría regular manual");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>("");
  const [editIsTool, setEditIsTool] = useState<boolean>(false);
  const [editDivision, setEditDivision] = useState<string>("MANTENIMIENTO");

  // Estados de Sugerencia de Precios Competitivos IA
  const [analizandoPrecio, setAnalizandoPrecio] = useState<boolean>(false);
  const [resultadoPrecioIA, setResultadoPrecioIA] = useState<{
    referenciasMercado: Array<{ fuente: string; precioUSD: number; detalle: string }>;
    precioSugeridoUSD: number;
    precioMinimoUSD: number;
    precioMaximoUSD: number;
    justificacion: string;
  } | null>(null);
  const [origenPrecioModal, setOrigenPrecioModal] = useState<'NUEVO' | 'EDICION' | null>(null);
  const [showModalPrecioIA, setShowModalPrecioIA] = useState<boolean>(false);

  const consultarGeminiDirectoCliente = async (
    contexto: { model: string; description: string; brand: string; code: string; photoUrl: string },
    apiKey: string
  ) => {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [];
    let promptText = `Eres un especialista en Inteligencia de Mercado y Repuestos Industriales/Ascensores/Equipos para AXON ERP.
Analiza la siguiente información de un producto o repuesto técnico:
- Modelo: ${contexto.model || "N/A"}
- Descripción: ${contexto.description || "N/A"}
- Marca/Fabricante: ${contexto.brand || "N/A"}
- Código/SKU: ${contexto.code || "N/A"}

Analiza el mercado actual (distribuidores autorizados, importadores, tiendas multimarca).
Responde OBLIGATORIAMENTE con un JSON que contenga:
1. 'referenciasMercado': Un arreglo de 3 objetos con { fuente: string, precioUSD: number, detalle: string }.
2. 'precioSugeridoUSD': Número con el precio unitario sugerido competitivo en USD.
3. 'precioMinimoUSD' y 'precioMaximoUSD': El rango de mercado detectado en USD.
4. 'justificacion': Una justificación concisa para esta recomendación de precio.`;

    if (contexto.photoUrl) {
      const matches = contexto.photoUrl.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        contents.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
        promptText += `\n\nAdicionalmente, se adjunta una fotografía del repuesto. Examínala visualmente para confirmar sus características técnicas.`;
      }
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
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
      }
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText);
  };

  const ejecutarSugerenciaPrecio = async (
    contexto: { model: string; description: string; brand: string; code: string; photoUrl: string },
    origen: 'NUEVO' | 'EDICION'
  ) => {
    if (!contexto.model.trim() && !contexto.description.trim() && !contexto.code.trim()) {
      addToast('Ingrese al menos Modelo, Descripción o Código del repuesto para consultar precios.', 'warning');
      return;
    }

    setAnalizandoPrecio(true);
    setResultadoPrecioIA(null);
    setOrigenPrecioModal(origen);
    setShowModalPrecioIA(true);

    // Lectura de la clave API con formato Vite para cliente público
    const viteApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

    try {
      // 1. Intentar servidor backend primero
      const res = await fetch('/api/gemini/suggest-competitive-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: contexto.model,
          description: contexto.description,
          brand: contexto.brand,
          code: contexto.code,
          photoUrl: contexto.photoUrl
        })
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success && data.result) {
          setResultadoPrecioIA(data.result);
          return;
        }
      }

      console.warn(`Respuesta no exitosa del backend (status ${res.status}). Evaluando llamado directo cliente...`);

      // 2. Si el servidor no responde OK (ej. GitHub Pages / static hosting), usar VITE_GEMINI_API_KEY en el cliente
      if (viteApiKey) {
        console.log('Iniciando consulta directa del cliente a Gemini usando VITE_GEMINI_API_KEY...');
        const resultCliente = await consultarGeminiDirectoCliente(contexto, viteApiKey);
        setResultadoPrecioIA(resultCliente);
        return;
      }

      // Si no hay backend disponible ni clave en el cliente
      if (!viteApiKey) {
        console.error('Error: VITE_GEMINI_API_KEY es undefined y la API backend no respondió exitosamente.');
        addToast(
          'No se pudo conectar con la API backend. Si estás alojando la app en un sitio estático como GitHub Pages, debes configurar la variable VITE_GEMINI_API_KEY.',
          'warning'
        );
      }
    } catch (err: any) {
      console.error('Error en petición a la API:', err);

      // Fallback: Si ocurrió un error de red al intentar conectarse al servidor Node
      if (viteApiKey) {
        try {
          console.log('Realizando reintento directo desde el cliente con VITE_GEMINI_API_KEY...');
          const resultCliente = await consultarGeminiDirectoCliente(contexto, viteApiKey);
          setResultadoPrecioIA(resultCliente);
          return;
        } catch (clientErr: any) {
          console.error('Error en la llamada directa a Gemini con VITE_GEMINI_API_KEY:', clientErr);
          addToast(`Error al consultar Gemini directamente: ${clientErr?.message || clientErr}`, 'error');
        }
      } else {
        addToast(
          'Error de comunicación con el backend. Si la aplicación está en GitHub Pages, define VITE_GEMINI_API_KEY.',
          'error'
        );
      }
    } finally {
      setAnalizandoPrecio(false);
    }
  };

  const aplicarPrecioSugerido = (precio: number) => {
    if (origenPrecioModal === 'NUEVO') {
      setNewPrice(precio);
      addToast(`Precio de $${precio.toFixed(2)} USD inyectado en el nuevo producto`, 'success');
    } else if (origenPrecioModal === 'EDICION') {
      setEditPrice(precio);
      addToast(`Precio de $${precio.toFixed(2)} USD inyectado en el producto actual`, 'success');
    }
    setShowModalPrecioIA(false);
  };

  // Estado para Modales QR y Escáner
  const [qrModalProduct, setQrModalProduct] = useState<Producto | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [isNewEntryLabel, setIsNewEntryLabel] = useState<boolean>(false);
  const [onlyToolsFilter, setOnlyToolsFilter] = useState<boolean>(false);

  // Estado para Modal de Nuevo Producto en Stock
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>("");
  const [newModel, setNewModel] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newBrand, setNewBrand] = useState<string>("");
  const [newStock, setNewStock] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");
  const [newIsTool, setNewIsTool] = useState<boolean>(false);
  const [newDivision, setNewDivision] = useState<string>("MANTENIMIENTO");

  // Estado de Filtro por División (por defecto "TODAS" para mostrar Almacén Único Central completo)
  const [divisionFilter, setDivisionFilter] = useState<string>("TODAS");

  // Obtener productos (por defecto muestra todo el stock unificado del Almacén Central)
  const divisionProducts = divisionFilter === "TODAS"
    ? products
    : products.filter(p => p.division === divisionFilter);

  // Extraer las marcas existentes de forma dinámica para el catálogo de filtros
  const dynamicBrands: string[] = Array.from(new Set(divisionProducts.map(p => p.val_m))).filter(Boolean) as string[];


  // Manejar toggle de marca
  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  // Limpiar todos los filtros aplicados
  const handleResetFilters = () => {
    setKeyword("");
    setSelectedBrands([]);
    setStockStatus("TODOS");
    setDivisionFilter("TODAS");
    setOnlyToolsFilter(false);
    clearInitialFamilyFilter();
  };

  // Filtrar los productos finales a visualizar según las restricciones
  const filteredProducts = divisionProducts.filter(p => {
    // 1. Filtro por familia inicial proveniente del Dashboard
    if (initialFamilyFilter) {
      const fam = clasificarFamilia(p.val_d);
      if (fam.key !== initialFamilyFilter) return false;
    }

    // 2. Filtro por buscador tolerante a diacríticos
    if (keyword.trim() && !coincidenPalabrasClave(p, keyword)) {
      return false;
    }

    // 3. Filtro por marcas seleccionadas en checklists
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.val_m)) {
      return false;
    }

    // 3.5. Filtro exclusivo por Herramientas / Activos de Obra
    if (onlyToolsFilter && !p.esHerramienta) {
      return false;
    }

    // 4. Filtro por radio de stock
    const fam = clasificarFamilia(p.val_d);
    if (stockStatus === "EN_STOCK" && p.val_s === 0) return false;
    if (stockStatus === "BAJO_MINIMO" && p.val_s >= fam.minVal) return false;
    if (stockStatus === "AGOTADOS" && p.val_s > 0) return false;

    return true;
  });

  // Abrir modal de edición
  const handleOpenEditModal = (p: Producto) => {
    setEditingProduct(p);
    setEditDesc(p.val_d);
    setEditBrand(p.val_m);
    setEditRef(p.val_r);
    setEditStock(p.val_s);
    setEditPrice(p.precioUSD || 0);
    setEditPhotoUrl(p.imagenUrl || "");
    setEditIsTool(!!p.esHerramienta);
    setEditDivision(p.division || activeDivision || "MANTENIMIENTO");
    setEditMotivo("Calibración manual de inventario");
  };

  // Someter cambios de edición
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Actualizar campos e foto, etiqueta de herramienta y división destino
    actualizarProducto(editingProduct.val_c, {
      val_d: editDesc,
      val_m: editBrand,
      val_r: editRef,
      precioUSD: editPrice,
      imagenUrl: editPhotoUrl,
      esHerramienta: editIsTool,
      division: editDivision as any
    });

    // Actualizar stock si cambió
    if (editStock !== editingProduct.val_s) {
      ajustarStockIndividual(editingProduct.val_c, editStock, editMotivo);
    }

    // Cerrar modal
    setEditingProduct(null);
  };

  // Someter creación de nuevo repuesto con foto de referencia
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newModel.trim() || !newDesc.trim()) return;

    const nuevoItem: Producto = {
      val_c: newCode.trim().toUpperCase(),
      val_mo: newModel.trim(),
      val_d: newDesc.trim(),
      val_b: newCode.trim().toUpperCase() + '-S',
      val_m: newBrand.trim() || 'Genérico',
      val_r: 'REG-MANUAL',
      val_s: newStock,
      val_u: 'Und',
      precioUSD: newPrice,
      imagenUrl: newPhotoUrl,
      division: (newDivision as any) || activeDivision || 'MANTENIMIENTO',
      esHerramienta: newIsTool
    };

    agregarProducto(nuevoItem);
    handleResetFilters();

    // Abrir Modal de Etiqueta QR para imprimir y pegar en el producto
    setQrModalProduct(nuevoItem);
    setIsNewEntryLabel(true);

    // Resetear formulario
    setNewCode("");
    setNewModel("");
    setNewDesc("");
    setNewBrand("");
    setNewStock(1);
    setNewPrice(0);
    setNewPhotoUrl("");
    setNewIsTool(false);
    setNewDivision("MANTENIMIENTO");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6" id="inventario-tab">
      
      {/* SECCIÓN DE FILTROS SUPERIORES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-800 gap-3">
          <span className="text-xs font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-cyan-400" />
            Controles de Filtro Avanzado & Catálogo
          </span>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {(keyword || selectedBrands.length > 0 || stockStatus !== "TODOS" || initialFamilyFilter) && (
              <button 
                onClick={handleResetFilters}
                className="text-[10px] font-mono text-zinc-400 hover:text-cyan-400 flex items-center gap-1 border border-slate-800 hover:border-cyan-500/30 rounded px-2.5 py-1.5 transition"
              >
                <RotateCcw size={12} />
                Restablecer Filtros
              </button>
            )}

            <button
              onClick={() => setOnlyToolsFilter(!onlyToolsFilter)}
              className={`px-3 py-1.5 border text-xs font-mono rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                onlyToolsFilter 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm' 
                  : 'bg-slate-950 border-slate-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Filtrar solo artículos etiquetados como Herramienta/Equipo de Obra"
            >
              <Wrench size={13} className={onlyToolsFilter ? 'text-amber-400' : 'text-zinc-500'} />
              <span>{onlyToolsFilter ? '🧰 Solo Herramientas (Activo)' : '🧰 Ver Herramientas'}</span>
            </button>

            <button
              onClick={() => setShowScannerModal(true)}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold rounded-lg text-xs font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Aperturar escáner de cámara o lector USB de códigos QR"
            >
              <Scan size={14} className="text-cyan-400" />
              <span>📷 Escanear QR Almacén</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Registrar Entrada / Repuesto (+ Foto)</span>
            </button>
          </div>
        </div>

        {/* BARRA DE SELECCIÓN DE ALMACÉN ÚNICO / DIVISIÓN */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
              <Box size={14} className="text-cyan-400" />
              Vista de Almacén:
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              Almacén Central Único
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setDivisionFilter("TODAS")}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                divisionFilter === "TODAS"
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🏢 Stock Completo ({products.length})</span>
            </button>

            <button
              onClick={() => setDivisionFilter("MANTENIMIENTO")}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                divisionFilter === "MANTENIMIENTO"
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🛠️ Mantenimiento ({products.filter(p => p.division === 'MANTENIMIENTO').length})</span>
            </button>

            <button
              onClick={() => setDivisionFilter("MODERNIZACION")}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition cursor-pointer flex items-center gap-1 ${
                divisionFilter === "MODERNIZACION"
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'text-zinc-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🏗️ Modernización ({products.filter(p => p.division === 'MODERNIZACION').length})</span>
            </button>
          </div>
        </div>

        {initialFamilyFilter && (
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg p-2.5 text-xs text-cyan-400 flex justify-between items-center">
            <span>
              Filtrando exclusivamente por la familia: <strong>{FAMILIAS_INVENTARIO.find(f => f.key === initialFamilyFilter)?.label || initialFamilyFilter}</strong>
            </span>
            <button onClick={clearInitialFamilyFilter} className="hover:text-white underline font-mono text-[10px]">✕ Quitar filtro</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* 1. Buscador */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Tipear Búsqueda Libre</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                placeholder="SKU, modelo, barra..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-slate-950 text-xs text-zinc-200 border border-slate-800 rounded-lg py-2 pl-9 focus:outline-none focus:border-cyan-500 transition font-mono"
              />
              <Search size={14} className="text-zinc-500 absolute left-3" />
            </div>
          </div>

          {/* 2. Checkboxes de Marcas */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Filtrar por Marcas del Almacén simultáneamente</label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 h-16 overflow-y-auto flex flex-wrap gap-1.5">
              {dynamicBrands.length === 0 ? (
                <span className="text-[10px] text-zinc-600 font-mono italic p-2">Sin marcas en catálogo local</span>
              ) : (
                dynamicBrands.map(brand => (
                  <label 
                    key={brand}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded-md border cursor-pointer select-none transition ${
                      selectedBrands.includes(brand)
                        ? 'bg-cyan-950/55 border-cyan-500 text-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                    />
                    {brand}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 3. Radio Buttons de Stock */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Filtro Rápido Stock</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
              {[
                { key: "TODOS", label: "Todos" },
                { key: "EN_STOCK", label: "En Stock" },
                { key: "BAJO_MINIMO", label: "Bajo Mínimo" },
                { key: "AGOTADOS", label: "Sin Stock" }
              ].map(opt => (
                <button 
                  key={opt.key}
                  onClick={() => setStockStatus(opt.key)}
                  className={`py-1 text-[9px] font-mono rounded transition uppercase font-semibold ${
                    stockStatus === opt.key 
                      ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/40' 
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* PLANILLA O TABLA DE DATOS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            
            {/* ENCABEZADOS DE TABLA */}
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center">Foto</th>
                <th className="py-3 px-4">Código SKU</th>
                <th className="py-3 px-4">Modelo Técnico</th>
                <th className="py-3 px-4">Descripción General</th>
                <th className="py-3 px-4">Fabricante / Marca</th>
                <th className="py-3 px-4">Referencia Diseñ.</th>
                <th className="py-3 px-4">Disp. Fis.</th>
                <th className="py-3 px-4">Familia</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>

            {/* CUERPO DE TABLA */}
            <tbody className="divide-y divide-slate-850">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500 text-xs font-mono">
                    <Box size={24} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                    No se localizaron artículos con los filtros designados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const fam = clasificarFamilia(p.val_d);
                  
                  // Color condicional del stock
                  let stockColorClass = "text-cyan-400 bg-cyan-950/20 border-cyan-900/40";
                  let rowBorderClass = "border-l-4 border-l-cyan-500/60";
                  
                  if (p.val_s === 0) {
                    stockColorClass = "text-rose-400 bg-rose-950/30 border-rose-900/50";
                    rowBorderClass = "border-l-4 border-l-rose-500";
                  } else if (p.val_s < fam.minVal) {
                    stockColorClass = "text-amber-400 bg-amber-950/30 border-amber-900/50";
                    rowBorderClass = "border-l-4 border-l-amber-500";
                  }

                  return (
                    <tr 
                      key={p.val_c}
                      className={`hover:bg-slate-950/40 transition ${rowBorderClass}`}
                    >
                      {/* FOTO MINIATURA */}
                      <td className="py-2 px-3 text-center">
                        {p.imagenUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="group relative inline-block cursor-pointer focus:outline-none"
                            title="Ver o cambiar foto de referencia"
                          >
                            <img 
                              src={p.imagenUrl} 
                              alt={p.val_mo}
                              className="w-9 h-9 object-cover rounded-lg border border-cyan-500/50 shadow-sm group-hover:opacity-80 transition"
                            />
                            <span className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                              <Camera size={12} />
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-500 hover:text-cyan-400 rounded-lg transition inline-flex items-center justify-center cursor-pointer"
                            title="Tomar / Cargar foto de referencia para Google Sheets"
                          >
                            <Camera size={14} />
                          </button>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">{p.val_c}</td>
                      
                      {/* MODELO */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-cyan-300">{p.val_mo}</td>
                      
                      {/* DESCRIPCION */}
                      <td className="py-3.5 px-4 text-zinc-400 font-sans max-w-xs" title={p.val_d}>
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate">{p.val_d}</span>
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              p.division === 'MODERNIZACION'
                                ? 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                                : 'text-cyan-300 bg-cyan-950/40 border-cyan-800/50'
                            }`}>
                              {p.division === 'MODERNIZACION' ? '🏗️ Modernización' : '🛠️ Mantenimiento'}
                            </span>
                            {p.esHerramienta && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
                                <Wrench size={10} />
                                HERRAMIENTA
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* MARCA */}
                      <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">{p.val_m}</td>
                      
                      {/* REFERENCIA */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-500">{p.val_r}</td>
                      
                      {/* STOCK CON COLOR CONDICIONAL */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border inline-block ${stockColorClass}`}>
                          {p.val_s} {p.val_u || 'Und'}
                        </span>
                      </td>

                      {/* CATEGORIA/FAMILIA */}
                      <td className="py-3.5 px-4 text-zinc-500 text-[10px] font-sans font-medium">
                        {fam.label}
                      </td>

                      {/* ACCIONES DE FILA (EDIT Y QR) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => { setQrModalProduct(p); setIsNewEntryLabel(false); }}
                            className="p-1.5 hover:bg-cyan-950 hover:text-cyan-300 border border-transparent hover:border-cyan-800 text-cyan-400/90 rounded transition cursor-pointer"
                            title="Ver e Imprimir Etiqueta QR del Producto"
                          >
                            <QrCode size={14} />
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 hover:bg-slate-950 hover:text-cyan-400 border border-transparent hover:border-slate-800 text-zinc-500 rounded transition cursor-pointer"
                            title="Ajustar Stock de forma manual"
                          >
                            <Edit size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* METRICA RAPIDA INFERIOR */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-zinc-400 gap-2">
          <span>Mostrando {filteredProducts.length} de {divisionProducts.length} referencias cargadas</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Seguro</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Bajo Mínimo</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" /> Agotado</span>
          </div>
        </div>

      </div>

      {/* MODAL AJUSTE MANUAL EN CALIENTE Y EDICIÓN DE FOTO */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 my-8"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                  <SlidersHorizontal size={14} />
                  Calibración & Foto de Repuesto
                </span>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="text-zinc-500 hover:text-zinc-300 font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-850 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Código SKU</span>
                  <span className="text-sm font-mono font-bold text-zinc-200">{editingProduct.val_c}</span>
                  <span className="text-xs text-cyan-400 font-mono block mt-0.5">Modelo: {editingProduct.val_mo}</span>
                </div>
                {editPhotoUrl && (
                  <img 
                    src={editPhotoUrl} 
                    alt="Vista previa" 
                    className="w-12 h-12 object-cover rounded-lg border border-cyan-500/40"
                  />
                )}
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Descripción de Ingeniería</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Marca / Fabricante</label>
                    <input 
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Stock Físico Real</label>
                    <input 
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Precio USD ($)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* Botón de Inteligencia de Precios en Edición */}
                <button
                  type="button"
                  onClick={() => ejecutarSugerenciaPrecio({
                    model: editingProduct.val_mo,
                    description: editDesc,
                    brand: editBrand,
                    code: editingProduct.val_c,
                    photoUrl: editPhotoUrl
                  }, 'EDICION')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/10 to-amber-500/20 hover:from-amber-500/20 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  <span>💡 Sugerir Precio Competitivo de Mercado</span>
                </button>

                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
                  <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                    🎯 Destino / División Asignada del Producto
                  </label>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-zinc-100 border border-slate-700 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  >
                    <option value="MANTENIMIENTO">🛠️ Mantenimiento de Ascensores</option>
                    <option value="MODERNIZACION">🏗️ Modernización / Obras</option>
                  </select>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="text-amber-400" size={16} />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">Clasificar como Herramienta / Equipo de Obra</span>
                      <span className="text-[10px] text-amber-400/80">Marca este ítem como activo retornable para control en obras</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editIsTool}
                      onChange={(e) => setEditIsTool(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Fotografía de Referencia Visual (Google Sheets / Drive)</label>
                  <PhotoUploader 
                    photoUrl={editPhotoUrl}
                    onPhotoCaptured={(url) => setEditPhotoUrl(url)}
                    label="Tomar/Cargar Fotografía de Repuesto"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Motivo del Ajuste de Inventario</label>
                  <select 
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-2 focus:outline-none"
                  >
                    <option value="Auditoría regular manual">Auditoría regular manual</option>
                    <option value="Ingreso por devolución de proyecto">Ingreso por devolución de proyecto</option>
                    <option value="Fotografía técnica agregada/actualizada">Fotografía técnica agregada/actualizada</option>
                    <option value="Donación / desecho industrial">Donación / desecho industrial</option>
                    <option value="Pérdida / merma no controlada">Pérdida / merma no controlada</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-xs text-zinc-400 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-5 py-2 text-xs font-bold rounded-lg transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR NUEVO REPUESTO CON FOTO */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 my-8"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                  <Plus size={16} />
                  Registrar Nuevo Repuesto / Componente
                </span>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Código SKU *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: REP-1049"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Modelo Técnico *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: OT-300-X"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Descripción del Componente *</label>
                  <textarea 
                    required
                    placeholder="Descripción técnica del repuesto..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Marca</label>
                    <input 
                      type="text"
                      placeholder="Otis / Fermator..."
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Stock Inicial</label>
                    <input 
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Precio USD ($)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 transition font-mono font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* Botón de Inteligencia de Precios en Creación */}
                <button
                  type="button"
                  onClick={() => ejecutarSugerenciaPrecio({
                    model: newModel,
                    description: newDesc,
                    brand: newBrand,
                    code: newCode,
                    photoUrl: newPhotoUrl
                  }, 'NUEVO')}
                  disabled={!newModel.trim() && !newDesc.trim() && !newCode.trim()}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 border shadow-sm cursor-pointer ${
                    (!newModel.trim() && !newDesc.trim() && !newCode.trim())
                      ? 'bg-slate-950 text-slate-600 border-slate-850 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500/10 to-amber-500/20 hover:from-amber-500/20 hover:to-amber-500/30 text-amber-300 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  <span>💡 Sugerir Precio Competitivo de Mercado</span>
                </button>

                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
                  <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                    🎯 Destino / División Asignada de la Entrada
                  </label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-zinc-100 border border-slate-700 rounded py-2 px-3 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  >
                    <option value="MANTENIMIENTO">🛠️ Mantenimiento de Ascensores</option>
                    <option value="MODERNIZACION">🏗️ Modernización / Obras</option>
                  </select>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="text-amber-400" size={16} />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">Clasificar como Herramienta de Obra</span>
                      <span className="text-[10px] text-amber-400/80">Quedará predeterminado como activo para préstamos</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newIsTool}
                      onChange={(e) => setNewIsTool(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Fotografía del Repuesto (Captura Directa)</label>
                  <PhotoUploader 
                    photoUrl={newPhotoUrl}
                    onPhotoCaptured={(url) => setNewPhotoUrl(url)}
                    label="Tomar / Cargar Foto del Repuesto"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-xs text-zinc-400 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-5 py-2 text-xs font-bold rounded-lg transition"
                  >
                    Registrar e Sincronizar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Etiqueta QR Producto */}
      {qrModalProduct && (
        <ProductQRModal
          product={qrModalProduct}
          onClose={() => { setQrModalProduct(null); setIsNewEntryLabel(false); }}
          isNewEntry={isNewEntryLabel}
        />
      )}

      {/* Modal Escáner QR Almacén */}
      {showScannerModal && (
        <QRScannerModal
          onScanProduct={(scanned) => {
            // Filtrar / Destacar en el inventario
            setKeyword(scanned.val_c);
          }}
          onClose={() => setShowScannerModal(false)}
          title="Escáner QR de Almacén (Inventario)"
          subtitle="Escanea el código QR de un producto para ubicarlo inmediatamente en la lista"
        />
      )}

      {/* MODAL: SUGERENCIA DE PRECIO COMPETITIVO CON IA GEMINI */}
      {showModalPrecioIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles size={20} className="animate-pulse" />
                <h3 className="text-base font-bold text-white">Análisis de Precios Competitivos de Mercado - IA Gemini</h3>
              </div>
              <button
                onClick={() => setShowModalPrecioIA(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {analizandoPrecio ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-slate-950 p-6 rounded-xl border border-slate-800">
                <RefreshCw size={32} className="animate-spin text-amber-400" />
                <p className="text-sm text-amber-300 font-bold text-center">
                  Consultando referencias de mercado en tiempo real...
                </p>
                <p className="text-xs text-slate-400 text-center max-w-md">
                  Investigando distribuidores autorizados OEM, proveedores multimarca e importación directa de componentes de ascensor.
                </p>
              </div>
            ) : resultadoPrecioIA ? (
              <div className="space-y-4 font-mono">
                {/* BANNER PRECIO SUGERIDO */}
                <div className="bg-gradient-to-r from-emerald-950/80 to-slate-950 p-4 rounded-xl border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Precio Competitivo Sugerido</span>
                    <div className="flex items-baseline gap-1 text-2xl font-black text-emerald-300">
                      <span>${resultadoPrecioIA.precioSugeridoUSD?.toFixed(2)}</span>
                      <span className="text-xs font-normal text-emerald-400/80">USD</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Rango de Mercado: ${resultadoPrecioIA.precioMinimoUSD?.toFixed(2)} — ${resultadoPrecioIA.precioMaximoUSD?.toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => aplicarPrecioSugerido(resultadoPrecioIA.precioSugeridoUSD)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    <span>Inyectar en Formulario (${resultadoPrecioIA.precioSugeridoUSD?.toFixed(2)} USD)</span>
                  </button>
                </div>

                {/* TABLA DE LAS 3 REFERENCIAS DE MERCADO ENCONTRADAS */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    3 Referencias de Mercado Identificadas:
                  </span>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {resultadoPrecioIA.referenciasMercado?.map((refItem, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between hover:border-amber-500/30 transition"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">{refItem.fuente}</span>
                          <span className="text-[10px] text-slate-400 block">{refItem.detalle}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-amber-300">${refItem.precioUSD?.toFixed(2)} USD</span>
                          <button
                            type="button"
                            onClick={() => aplicarPrecioSugerido(refItem.precioUSD)}
                            className="block text-[10px] text-cyan-400 hover:underline font-semibold mt-0.5 text-right cursor-pointer"
                          >
                            Usar este valor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* JUSTIFICACIÓN TÉCNICA */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Justificación de la Recomendación</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{resultadoPrecioIA.justificacion}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Sin datos de sugerencia de precios.</p>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModalPrecioIA(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
