import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { coincidenPalabrasClave, normalizarTexto } from '../data';
import { Producto, Nota } from '../types';
import { Search, Plus, Trash2, Signature, Printer, AlertTriangle, User, MapPin, Briefcase, FileSignature, CheckCircle, FileText, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRScannerModal } from './QRScannerModal';

export default function DespachoTab() {
  const { products, activeDivision, crearVale, registrarProductoEmergencia } = useApp();

  // Estados del Formulario de Despacho
  const [tipoDespacho, setTipoDespacho] = useState<string>("Nota de Entrega");
  const [responsable, setResponsable] = useState<string>("");
  const [destino, setDestino] = useState<string>("");
  const [rif, setRif] = useState<string>("");
  const [proyectoDesc, setProyectoDesc] = useState<string>("");

  // Carrito de Despacho
  // Array de { producto: Producto, cantidad: number }
  const [cart, setCart] = useState<Array<{ producto: Producto; cantidad: number }>>([]);

  // Búsqueda de Productos
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [inputQty, setInputQty] = useState<number>(1);

  // Registro de Emergencia
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emModelo, setEmModelo] = useState<string>("");
  const [emDesc, setEmDesc] = useState<string>("");
  const [emB, setEmB] = useState<string>("");
  const [emM, setEmM] = useState<string>("");
  const [emR, setEmR] = useState<string>("");
  const [emU, setEmU] = useState<string>("Und");
  const [emStock, setEmStock] = useState<number>(10);

  // Firma Digital Táctil
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSigned, setHasSigned] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const isDrawing = useRef<boolean>(false);

  // Modal de Vista de Impresión / PDF
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printedVale, setPrintedVale] = useState<any>(null);
  const [printFormat, setPrintFormat] = useState<'TICKET' | 'LETTER'>('LETTER');

  // Modal Escáner QR
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  const handleScanProductForCart = (scannedProduct: Producto) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.producto.val_c === scannedProduct.val_c);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          cantidad: updated[existingIdx].cantidad + 1
        };
        return updated;
      } else {
        return [...prev, { producto: scannedProduct, cantidad: 1 }];
      }
    });
  };

  // Filtrado predictivo de productos del almacén central único
  const matchedPredictions = products
    .filter(p => coincidenPalabrasClave(p, searchQuery))
    .slice(0, 8); // Máximo 8 predicciones para limpieza visual

  // Manejo de la Firma
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#22d3ee'; // Cian
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    isDrawing.current = true;
    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    // Guardar firma en State
    if (canvasRef.current && hasSigned) {
      setSignatureDataUrl(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    setSignatureDataUrl("");
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Inicializar Canvas en Negro
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 120;
    }
  }, [canvasRef]);

  // Selección de predicción
  const selectPrediction = (p: Producto) => {
    setSelectedProduct(p);
    setSearchQuery(`${p.val_c} - ${p.val_mo} (${p.val_m})`);
    setShowPredictions(false);
  };

  // Añadir al Carrito
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Validar cantidad
    if (inputQty <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.producto.val_c === selectedProduct.val_c);
      if (existing) {
        // Acumular cantidad cuidando el inventario lógico local
        const nuevaCant = existing.cantidad + inputQty;
        return prev.map(item => item.producto.val_c === selectedProduct.val_c ? { ...item, cantidad: nuevaCant } : item);
      }
      return [...prev, { producto: selectedProduct, cantidad: inputQty }];
    });

    // Reset de inputs
    setSelectedProduct(null);
    setSearchQuery("");
    setInputQty(1);
  };

  // Remover del Carrito
  const removeCartItem = (sku: string) => {
    setCart(prev => prev.filter(item => item.producto.val_c !== sku));
  };

  // Someter Registro de Emergencia
  const handleSaveEmergencyProduct = () => {
    if (!emModelo || !emDesc || !emM) return;

    const dummyProd: Omit<Producto, 'val_c' | 'val_s' | 'division'> = {
      val_mo: emModelo,
      val_d: emDesc.toUpperCase(),
      val_b: emB || `EM-${Date.now().toString().slice(-6)}`,
      val_m: emM,
      val_r: emR || "N/A",
      val_u: emU
    };

    const registered = registrarProductoEmergencia(dummyProd, emStock);
    
    // Auto-seleccionar el producto de emergencia creado
    setSelectedProduct(registered);
    setSearchQuery(`${registered.val_c} - ${registered.val_mo} (${registered.val_m})`);
    
    // Cleanup modal states
    setShowEmergencyModal(false);
    setEmModelo("");
    setEmDesc("");
    setEmB("");
    setEmM("");
    setEmR("");
    setEmStock(10);
  };

  // Procesar vale final de despacho
  const handleProcessDespacho = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!responsable || !destino) return;

    const numVale = Math.floor(Math.random() * 90000 + 10000).toString();

    // Estructurar items de despacho simplificado para el JSON String
    const arrayItems = cart.map(item => ({
      val_c: item.producto.val_c,
      val_mo: item.producto.val_mo,
      val_d: item.producto.val_d,
      val_m: item.producto.val_m,
      cantidad: item.cantidad
    }));

    const notaDespacho: Omit<Nota, 'Fecha' | 'Status'> = {
      NroVale: numVale,
      Responsable: responsable,
      Destino: destino,
      ProyectoDesc: proyectoDesc || "N/A",
      TipoDespacho: tipoDespacho,
      Productos: JSON.stringify(arrayItems),
      Firma: signatureDataUrl || undefined,
      division: activeDivision,
      Rif: rif || undefined
    };

    crearVale(notaDespacho);

    // Preparar preview de impresión inmediata
    setPrintedVale({
      ...notaDespacho,
      Fecha: new Date().toLocaleDateString('es-ES') + " " + new Date().toLocaleTimeString('es-ES')
    });
    setShowPrintModal(true);

    // Limpiar formulario y carrito
    setCart([]);
    setResponsable("");
    setDestino("");
    setRif("");
    setProyectoDesc("");
    clearSignature();
  };

  return (
    <div className="space-y-6" id="despacho-tab">
      
      {/* SECCION CENTRAL: DOBLE COLUMNA FORMULARIO Y CARRITO */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* COLUMNA 1: FORMULARIO BÚSQUEDA Y CARRITO (3 Columnas) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* BUSCADOR DE CARRITO Y SELECCIÓN */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide">
                Añadir Componentes al Carro
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="text-[10px] bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 py-1.5 px-3 rounded-lg font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Aperturar escáner de cámara o lector de código QR para añadir al carro"
                >
                  <Scan size={13} className="text-cyan-400" />
                  <span>📷 Escanear QR</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="text-[10px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/60 py-1.5 px-3 rounded-lg font-mono font-medium transition flex items-center gap-1.5"
                >
                  <Plus size={12} />
                  Registro Emergencia
                </button>
              </div>
            </div>

            {/* BUSQUEDA PREDICTIVA */}
            <div className="relative">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                Buscar Modelo, Código SKU, Descripción o Barra:
              </label>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Escriba marca, modelo o código..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowPredictions(true);
                  }}
                  onFocus={() => setShowPredictions(true)}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2.5 pl-9 pr-4 focus:outline-none focus:border-cyan-500 transition font-mono"
                />
                <Search size={14} className="text-zinc-500 absolute left-3" />
              </div>

              {/* DROPDOWN PREDICTIVO */}
              {showPredictions && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 bg-slate-950 border border-zinc-800 mt-2 rounded-lg py-1 max-h-56 overflow-y-auto z-10 shadow-2xl">
                  {matchedPredictions.length === 0 ? (
                    <div className="text-center text-[11px] text-zinc-500 py-4 font-mono">
                      No hay coincidencias en esta división.
                    </div>
                  ) : (
                    matchedPredictions.map(p => (
                      <div 
                        key={p.val_c}
                        onClick={() => selectPrediction(p)}
                        className="px-4 py-2 hover:bg-slate-900 cursor-pointer flex justify-between items-center transition"
                      >
                        <div className="text-left">
                          <span className="font-mono text-xs font-semibold text-cyan-400">{p.val_c}</span>
                          <span className="text-zinc-400 text-[11px] ml-2 font-sans">{p.val_mo} ({p.val_m})</span>
                          <p className="text-[10px] text-zinc-500 truncate max-w-sm font-sans mt-0.5">{p.val_d}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            p.val_s === 0 ? 'bg-red-950 text-red-400' : 'bg-slate-900 text-zinc-400'
                          }`}>
                            Piso: {p.val_s} {p.val_u || 'Und'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SELECCIÓN ACTUAL & CANTIDAD CONTROLES */}
            {selectedProduct && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row justify-between items-center gap-4"
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-400 py-0.5 px-2 rounded">
                      {selectedProduct.val_c}
                    </span>
                    <span className="text-xs font-sans text-zinc-200">
                      Mod: {selectedProduct.val_mo} ({selectedProduct.val_m})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 font-sans">{selectedProduct.val_d}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                  <div className="flex flex-col">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Cantidad Solicitada:</label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="number"
                        min="1"
                        max={selectedProduct.val_s}
                        value={inputQty}
                        onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-slate-900 text-center text-xs text-zinc-100 border border-slate-800 rounded-l py-1.5 focus:outline-none"
                      />
                      <span className="bg-slate-850 px-2.5 py-1.5 text-[10px] font-mono text-zinc-400 border border-l-0 border-slate-800 rounded-r">
                        {selectedProduct.val_u || 'Und'}
                      </span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleAddToCart}
                    className="h-10 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-semibold px-4 rounded-lg transition self-end flex items-center gap-1 shrink-0"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* LISTA DEL CARRITO DE DESPACHO */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide">
                Componentes a Despachar
              </h3>
              <span className="text-[10px] font-mono bg-slate-950 text-zinc-400 px-2 py-0.5 rounded">
                {cart.length} líneas cargadas
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10">
                <AlertTriangle className="text-zinc-500 mx-auto mb-2" size={30} />
                <span className="text-xs text-zinc-400 font-sans block">El carrito de despacho está vacío.</span>
                <span className="text-[10px] text-zinc-600 font-mono block mt-1">Seleccione un componente usando el buscador superior.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div 
                      key={item.producto.val_c}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-slate-950/50 border border-slate-850 py-2.5 px-3 rounded-lg flex justify-between items-center gap-4 transition hover:border-slate-800"
                    >
                      <div className="text-left">
                        <span className="text-xs font-mono font-semibold text-zinc-300">{item.producto.val_c}</span>
                        <span className="text-[11px] font-sans text-zinc-400 ml-2">Mod: {item.producto.val_mo}</span>
                        <p className="text-[10px] text-zinc-500 truncate max-w-xs">{item.producto.val_d}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-400 block">
                            Cant: {item.cantidad} {item.producto.val_u || 'Und'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 block">
                            Re-Stock: {item.producto.val_s - item.cantidad} unids
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeCartItem(item.producto.val_c)}
                          className="p-1 px-2 border border-rose-900/30 hover:border-rose-900 bg-rose-950/20 text-rose-400 rounded transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA 2: FORMULARIO METADATA, FIRMA Y SUBMIT (2 Columnas) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleProcessDespacho} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wide">
                  Datos de Despacho
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">DIV: {activeDivision}</span>
              </div>

              {/* SELECT TIPO DESPACHO */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Tipo de Despacho / Canal de salida
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Nota de Entrega", "Talonario Interno", "Factura de Ventas"].map(tipo => (
                    <button 
                      key={tipo}
                      type="button"
                      onClick={() => setTipoDespacho(tipo)}
                      className={`py-1.5 px-2 text-[10px] font-mono border rounded-lg transition ${
                        tipoDespacho === tipo 
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-400' 
                          : 'bg-slate-950 border-slate-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {tipo === "Nota de Entrega" ? "Entrega" : tipo === "Talonario Interno" ? "Interno" : "Factura"}
                    </button>
                  ))}
                </div>
              </div>

              {/* CLIENTE / RESPONSABLE / DESTINO */}
              <div className="space-y-3">
                <div className="relative">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Autorizado / Conductor / Supervisor:</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      required
                      placeholder="Nombre del personal receptor..."
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <User size={12} className="text-zinc-500 absolute left-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Obra / Proyecto de Destino:</label>
                    <div className="relative flex items-center">
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Planta Central Alfa..."
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-cyan-500 transition"
                      />
                      <MapPin size={12} className="text-zinc-500 absolute left-3" />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Cédula o RIF:</label>
                    <div className="relative flex items-center">
                      <input 
                        type="text"
                        placeholder="Ej: J-122948-0..."
                        value={rif}
                        onChange={(e) => setRif(e.target.value)}
                        className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-cyan-500 transition font-mono"
                      />
                      <Briefcase size={12} className="text-zinc-500 absolute left-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Descripción Amplia del Proyecto asignado:</label>
                  <textarea 
                    placeholder="Escriba especificaciones físicas del proyecto..."
                    value={proyectoDesc}
                    onChange={(e) => setProyectoDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>
              </div>

              {/* PANEL DE FIRMA DIGITAL INDEPENDIENTE */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Signature size={12} className="text-pink-500" />
                    Firma Táctil Conductor
                  </span>
                  <button 
                    type="button" 
                    onClick={clearSignature}
                    className="text-pink-500 hover:text-pink-400 underline font-semibold transition"
                  >
                    Borrar
                  </button>
                </div>

                <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden relative">
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair bg-slate-950 block w-full"
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 text-[10px] text-zinc-500 font-mono uppercase">
                      Firmar Aquí (Mouse o Táctil Mobile)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
              <button 
                type="submit"
                disabled={cart.length === 0 || !responsable || !destino}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-zinc-600 font-sans font-bold text-zinc-950 text-xs rounded-lg transition shadow-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileSignature size={16} />
                Confirmar y Registrar Despacho
              </button>
              <p className="text-[9px] text-zinc-500 text-center font-mono">
                Al confirmar, se actualizará el stock lógico e iniciará el resguardo de audit.
              </p>
            </div>
          </form>
        </div>

      </div>

      {/* MODAL 1: REGISTRO DE EMERGENCIA (TIPO DRAWER) */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 text-rose-500">
                <AlertTriangle size={16} />
                Alta de Artículo de Emergencia
              </span>
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Registre un artículo en caliente que no existía inicialmente en el maestro. Se auto-asignará un código correlativo con nomenclatura <span className="font-mono text-cyan-400 font-bold">{activeDivision === 'AUTOMATION' ? 'AU_EMXXXX' : 'HP_EMXXXX'}</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Modelo Técnico *</label>
                <input 
                  type="text"
                  placeholder="Ej: SGD-TEMP-V1..."
                  value={emModelo}
                  onChange={(e) => setEmModelo(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Descripción del Artículo *</label>
                <input 
                  type="text"
                  placeholder="Descripción técnica extensa..."
                  value={emDesc}
                  onChange={(e) => setEmDesc(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Marca *</label>
                  <input 
                    type="text"
                    placeholder="Ej: Apex Electrics..."
                    value={emM}
                    onChange={(e) => setEmM(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Referencia de diseño</label>
                  <input 
                    type="text"
                    placeholder="Ej: REF-EM-01"
                    value={emR}
                    onChange={(e) => setEmR(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Código Barra / Serial</label>
                  <input 
                    type="text"
                    placeholder="Si posee lector..."
                    value={emB}
                    onChange={(e) => setEmB(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Unidad Medida</label>
                  <select 
                    value={emU}
                    onChange={(e) => setEmU(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-2 focus:outline-none"
                  >
                    <option value="Und">Und (Unidades)</option>
                    <option value="Mts">Mts (Metros)</option>
                    <option value="Juego">Juego (Set)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Stock Inicial de Piso Cargado *</label>
                <input 
                  type="number"
                  min="1"
                  value={emStock}
                  onChange={(e) => setEmStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 text-xs text-zinc-100 border border-slate-800 rounded py-2 px-3 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-xs text-zinc-400 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSaveEmergencyProduct}
                disabled={!emModelo || !emDesc || !emM}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-zinc-950 px-5 py-2 text-xs font-semibold rounded-lg transition"
              >
                Crear y Cargar a Despacho
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: MOTOR DE IMPRESIÓN PROFESIONAL (PDF GENERATOR / TICKET STYLE PREVIEW) */}
      <AnimatePresence>
        {showPrintModal && printedVale && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm font-sans font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                  <Printer size={16} />
                  Vista Previa de Impresión Digital
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPrintFormat('LETTER')}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition ${printFormat === 'LETTER' ? 'bg-cyan-950 border border-cyan-500 text-cyan-400' : 'bg-slate-950 border border-slate-850 text-zinc-500'}`}
                  >
                    Formato Carta (oficina)
                  </button>
                  <button 
                    onClick={() => setPrintFormat('TICKET')}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition ${printFormat === 'TICKET' ? 'bg-cyan-950 border border-cyan-500 text-cyan-400' : 'bg-slate-950 border border-slate-850 text-zinc-500'}`}
                  >
                    Talonario térmico (80mm)
                  </button>
                  <span className="text-zinc-600 mr-2">|</span>
                  <button 
                    onClick={() => {
                      setShowPrintModal(false);
                      setPrintedVale(null);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 font-mono text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* VISTA DEL TICKET IMPRIMIBLE */}
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-lg text-left overflow-y-auto max-h-[350px]">
                <div 
                  id="printable-area" 
                  className={`mx-auto bg-white text-zinc-950 p-6 font-sans ${printFormat === 'TICKET' ? 'max-w-[340px] text-xs' : 'max-w-[700px] text-sm'}`}
                  style={{ color: '#09090b', fontFamily: 'system-ui, sans-serif' }}
                >
                  {/* CABECERA MEMBRETADA */}
                  <div className="text-center border-b-2 border-dashed border-zinc-300 pb-4 mb-4">
                    <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 uppercase">
                      {activeDivision === 'AUTOMATION' ? 'SUBSEC: DIVISION AUTOMATION CNC' : 'SUBSEC: DIVISION HEAVY POWER S.A.'}
                    </h2>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">
                      WMS Corporativo Interno No-Falsificable
                    </p>
                    {printedVale.Rif && (
                      <p className="text-[10px] text-zinc-700 font-mono">ID Fiscal / RIF: {printedVale.Rif}</p>
                    )}
                    <p className="text-[9px] text-zinc-500">Fecha Serv: {printedVale.Fecha}</p>
                  </div>

                  {/* CONTENIDO METADATOS */}
                  <div className="space-y-1 mb-4 text-[11px] border-b border-dashed border-zinc-200 pb-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">DOCUMENTO:</span>
                      <span className="font-mono text-zinc-900">{printedVale.TipoDespacho}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">NUMERO VALE:</span>
                      <span className="font-mono font-bold text-zinc-900">#N-000{printedVale.NroVale}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">DESTINO OBRA:</span>
                      <span className="font-semibold text-zinc-900 uppercase">{printedVale.Destino}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-zinc-700">DESPONSABLE:</span>
                      <span className="text-zinc-800">{printedVale.Responsable}</span>
                    </div>
                    {printedVale.ProyectoDesc && (
                      <div className="mt-2 text-[10px] bg-zinc-100 p-2 rounded text-zinc-600 italic">
                        Nota Proy: {printedVale.ProyectoDesc}
                      </div>
                    )}
                  </div>

                  {/* ARTICULOS */}
                  <div className="mb-6">
                    <span className="font-bold text-xs border-b border-zinc-300 block pb-1 mb-2">PRODUCTOS DESPACHADOS</span>
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-300 text-zinc-500 uppercase font-bold text-[9px]">
                          <th className="py-1">Cód. SKU</th>
                          <th className="py-1">Nombre Modelo / Desc</th>
                          <th className="py-1 text-right">Cant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {JSON.parse(printedVale.Productos).map((p: any) => (
                          <tr key={p.val_c} className="border-b border-zinc-150 py-1.5">
                            <td className="font-mono font-bold py-1 text-zinc-900">{p.val_c}</td>
                            <td className="py-1">
                              <span className="font-semibold text-zinc-800">{p.val_mo}</span>
                              <div className="text-[9px] text-zinc-500 truncate max-w-[200px]">{p.val_d}</div>
                            </td>
                            <td className="text-right font-mono font-bold py-1 text-zinc-900">{p.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AREA DE CONTROL DE FIRMADO */}
                  <div className="mt-8 pt-4 border-t-2 border-dashed border-zinc-300 flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Firma de Conformidad Digital</span>
                    {printedVale.Firma ? (
                      <img 
                        src={printedVale.Firma} 
                        alt="Firma Digitalizada" 
                        referrerPolicy="no-referrer"
                        className="h-16 w-auto max-w-[220px] object-contain border border-zinc-100 rounded my-2 p-1"
                      />
                    ) : (
                      <div className="h-12 border border-zinc-300 border-dashed w-full max-w-[200px] flex items-center justify-center text-[10px] text-zinc-400 my-2">
                        Autorizado Sin Firma Electrónica
                      </div>
                    )}
                    <span className="text-[11px] text-zinc-900 font-bold border-t border-zinc-300 pt-1 w-full max-w-[220px] text-center">
                      Recibido por: {printedVale.Responsable}
                    </span>
                    <span className="text-[8px] text-zinc-400 mt-2 block font-mono">UUID: SEC-{Date.now().toString()}</span>
                  </div>
                </div>
              </div>

              {/* ACCIONES DEL PREVIEW */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintedVale(null);
                  }}
                  className="bg-slate-950 hover:bg-slate-850 px-4 py-2 text-xs text-zinc-400 rounded-lg transition"
                >
                  Cerrar Ventana
                </button>
                <button 
                  onClick={() => {
                    // Acción de impresión real enfocada
                    const printContent = document.getElementById('printable-area')?.innerHTML;
                    const originalContent = document.body.innerHTML;
                    if (printContent) {
                      const popupWin = window.open('', '_blank', 'width=800,height=600');
                      if (popupWin) {
                        popupWin.document.open();
                        popupWin.document.write(`
                          <html>
                            <head>
                              <title>Imprimir Nota de Entrega</title>
                              <style>
                                body { font-family: sans-serif; background-color: white; margin: 20px; }
                                #printable-area { width: 100%; max-width: 600px; margin: 0 auto; color: black; }
                                .text-center { text-align: center; }
                                .flex { display: flex; }
                                .justify-between { justify-content: space-between; }
                                .border-b-2 { border-bottom: 2px dashed #ccc; }
                                .pb-4 { padding-bottom: 16px; }
                                .mb-4 { margin-bottom: 16px; }
                                .space-y-1 > * { margin-bottom: 4px; }
                                .table { width: 100%; border-collapse: collapse; }
                                .border-t-2 { border-top: 2px dashed #ccc; }
                                .pt-4 { padding-top: 16px; }
                                .text-right { text-align: right; }
                              </style>
                            </head>
                            <body onload="window.print();window.close()">
                              <div id="printable-area">
                                ${printContent}
                              </div>
                            </body>
                          </html>
                        `);
                        popupWin.document.close();
                      }
                    }
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-5 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  Imprimir Ticket en Vivo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Escáner QR Almacén Despacho */}
      {showScannerModal && (
        <QRScannerModal
          onScanProduct={handleScanProductForCart}
          onClose={() => setShowScannerModal(false)}
          title="Escáner QR - Picking de Despacho"
          subtitle="Escanea los códigos QR de los repuestos en almacén para agregarlos a la Nota de Entrega"
        />
      )}

    </div>
  );
}
