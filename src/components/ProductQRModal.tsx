import React, { useRef } from 'react';
import { CURRENT_COMPANY } from '../config/companyConfig';
import { QRCodeSVG } from 'qrcode.react';
import { Producto } from '../types';
import { X, Printer, Download, QrCode, Tag, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProductQRModalProps {
  product: Producto;
  onClose: () => void;
  title?: string;
  isNewEntry?: boolean;
}

export const ProductQRModal: React.FC<ProductQRModalProps> = ({
  product,
  onClose,
  title = "Etiqueta QR de Producto",
  isNewEntry = false,
}) => {
  const { empresaActiva } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const companyName = empresaActiva?.nombre || CURRENT_COMPANY.nombre;
  const companyShortName = empresaActiva?.nombreCorto || empresaActiva?.nombre || CURRENT_COMPANY.nombreCorto;

  // Payload estructurado para lectura rápida por escáner
  const qrPayload = JSON.stringify({
    sku: product.val_c,
    modelo: product.val_mo,
    marca: product.val_m,
    desc: product.val_d,
    b: product.val_b || product.val_c
  });

  const handlePrintLabel = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=600,height=750');
    if (!printWindow) return;

    const imageHtml = product.imagenUrl 
      ? `<div style="margin: 8px 0; display: flex; justify-content: center;">
           <img src="${product.imagenUrl}" alt="${product.val_d}" style="max-height: 120px; max-width: 100%; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px;" />
         </div>`
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta QR - ${product.val_c}</title>
          <style>
            @page { size: 80mm 90mm; margin: 0; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #fff;
              color: #000;
            }
            .label-box {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 10px;
              width: 100%;
              max-width: 280px;
              text-align: center;
              box-sizing: border-box;
            }
            .company { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #444; }
            .sku { font-size: 18px; font-weight: bold; margin: 4px 0; color: #000; }
            .model { font-size: 12px; font-weight: bold; color: #222; }
            .desc { font-size: 10px; color: #555; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .qr-container { margin: 8px 0; display: flex; justify-content: center; }
            .footer { font-size: 8px; color: #666; font-family: monospace; border-top: 1px dashed #ccc; pt: 4px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="company">${companyName}</div>
            <div class="sku">SKU: ${product.val_c}</div>
            <div class="model">${product.val_m} - ${product.val_mo}</div>
            <div class="desc">${product.val_d}</div>
            ${imageHtml}
            <div class="qr-container">
              ${content.querySelector('svg')?.outerHTML || ''}
            </div>
            <div class="footer">CÓDIGO ÚNICO DE ALMACÉN</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <QrCode size={18} />
            <span>{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          {isNewEntry && (
            <div className="w-full mb-4 p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>Entrada registrada. Puedes imprimir esta etiqueta QR para pegarla al producto físico en el almacén.</span>
            </div>
          )}

          {/* Tarjeta Previa de Etiqueta Imprimible */}
          <div 
            ref={printRef}
            className="w-full bg-white text-slate-900 p-5 rounded-2xl shadow-xl flex flex-col items-center border-2 border-slate-300 select-none"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">
              {companyShortName}
            </div>
            <div className="text-xl font-extrabold text-slate-950 tracking-wide font-mono">
              {product.val_c}
            </div>
            <div className="text-xs font-bold text-cyan-700 mt-0.5 text-center">
              {product.val_m} | {product.val_mo}
            </div>
            <div className="text-[11px] text-slate-600 font-medium text-center line-clamp-2 my-2 px-2">
              {product.val_d}
            </div>

            {/* Fotografía del Producto si está disponible */}
            {product.imagenUrl && (
              <div className="my-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-1 max-w-[200px] max-h-[140px] flex flex-col items-center justify-center shadow-inner">
                <img 
                  src={product.imagenUrl} 
                  alt={product.val_d} 
                  className="max-h-[120px] w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Código QR React Component */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 my-2 shadow-inner">
              <QRCodeSVG 
                value={qrPayload}
                size={160}
                level="M"
                includeMargin={true}
              />
            </div>

            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
              <Tag size={12} />
              <span>STOCK EN ALMACÉN: {product.val_s} {product.val_u || 'Und'}</span>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-400 font-mono">
            Código QR permanente asignado a <span className="text-cyan-300 font-bold">{product.val_c}</span>
          </div>
        </div>

        {/* Footer Acciones */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center gap-3">
          <button
            onClick={handlePrintLabel}
            className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <Printer size={15} />
            <span>Imprimir Etiqueta QR</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
