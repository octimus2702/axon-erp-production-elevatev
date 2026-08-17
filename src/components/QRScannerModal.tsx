import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Producto } from '../types';
import { useApp } from '../context/AppContext';
import { X, Camera, Scan, CheckCircle2, AlertCircle, Keyboard, Volume2 } from 'lucide-react';

interface QRScannerModalProps {
  onScanProduct: (product: Producto) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  onScanProduct,
  onClose,
  title = "Escáner QR / Barcode de Almacén",
  subtitle = "Apunta la cámara al código QR del producto o ingresa el código SKU"
}) => {
  const { products, activeDivision, addToast } = useApp();
  const [lastScannedProduct, setLastScannedProduct] = useState<Producto | null>(null);
  const [manualCode, setManualCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const scannerContainerId = "qr-reader-region";
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Reproducir Tono Beep de Escáner sin archivos externos
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz (A5)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio Beep no soportado en este navegador:', e);
    }
  };

  // Buscar Producto en Inventario por Texto de Escaneo
  const processScannedText = (decodedText: string) => {
    setErrorMessage("");
    let rawCode = decodedText.trim();

    // Si es JSON enviado por nuestras etiquetas QR
    if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawCode);
        if (parsed.sku) rawCode = parsed.sku;
      } catch (e) {
        // seguir con string crudo
      }
    }

    const cleanedCode = rawCode.trim().toUpperCase();

    // Filtrar en productos de la división activa o global
    const foundProduct = products.find(p => 
      p.val_c.toUpperCase() === cleanedCode ||
      p.val_b.toUpperCase() === cleanedCode ||
      p.val_c.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanedCode.replace(/[^A-Z0-9]/g, '')
    );

    if (foundProduct) {
      playScanBeep();
      setLastScannedProduct(foundProduct);
      addToast(`✅ Producto detectado: ${foundProduct.val_c} - ${foundProduct.val_mo}`, 'success');
      onScanProduct(foundProduct);
    } else {
      setErrorMessage(`No se encontró ningún producto con el código SKU: "${cleanedCode}"`);
    }
  };

  // Inicializar Escáner de Cámara con Html5QrcodeScanner
  useEffect(() => {
    let isMounted = true;

    try {
      const scanner = new Html5QrcodeScanner(
        scannerContainerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0, 1] // CAMERA, FILE
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          if (isMounted) {
            processScannedText(decodedText);
          }
        },
        (error) => {
          // Errores menores de cuadro no detectado (normal durante movimiento de cámara)
        }
      );
    } catch (e) {
      console.warn('Error inicializando Html5QrcodeScanner:', e);
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.warn('Clear scanner err:', err));
      }
    };
  }, []);

  // Manejar Búsqueda Manual / Lector Láser USB (simula Enter)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processScannedText(manualCode);
    setManualCode("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Camera size={18} />
            <span>{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle */}
        <div className="px-5 py-2.5 bg-slate-950/30 text-xs text-slate-400 font-mono border-b border-slate-800/60 flex items-center justify-between">
          <span>{subtitle}</span>
          <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
            <Volume2 size={12} />
            <span>Audio Beep On</span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* Region de Cámara HTML5 Scanner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 overflow-hidden shadow-inner min-h-[260px]">
            <div id={scannerContainerId} className="w-full text-white [&>#html5-qrcode-anchor-scan-type-change]:text-cyan-400 [&>button]:bg-cyan-600 [&>button]:px-3 [&>button]:py-1.5 [&>button]:rounded-lg [&>button]:text-xs"></div>
          </div>

          {/* Notificación de Producto Escaneado */}
          {lastScannedProduct && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300 font-mono">
                    {lastScannedProduct.val_c} - {lastScannedProduct.val_m}
                  </div>
                  <div className="text-[11px] text-emerald-200/90 line-clamp-1">
                    {lastScannedProduct.val_mo} ({lastScannedProduct.val_d})
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-800/80 text-emerald-100 px-2 py-1 rounded-md shrink-0 font-mono">
                +1 Agregado
              </span>
            </div>
          )}

          {/* Error si no existe */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl flex items-center gap-2 text-red-300 text-xs font-medium">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario Entrada Manual / Lector USB */}
          <form onSubmit={handleManualSubmit} className="pt-2">
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard size={13} className="text-cyan-400" />
              <span>Lector USB de Pistola o Entrada Manual SKU</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: ASC-001 o escanea con pistola..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Procesar
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">Escaneos ilimitados para despacho o entrada</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Finalizar / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
