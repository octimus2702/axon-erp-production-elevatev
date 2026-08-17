import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, QrCode, Copy, Check, Share2, Wrench, Building2, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COMPANIES } from '../config/companyConfig';
import CompanyLogo from './CompanyLogo';

interface PortalTecnicoQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const PortalTecnicoQRModal: React.FC<PortalTecnicoQRModalProps> = ({
  isOpen,
  onClose,
  title = "Código QR - Portal Técnico de Obras"
}) => {
  const { empresaActiva, empresasDisponibles, addToast } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const defaultCompanies = Object.values(COMPANIES) as any[];
  const listCompanies = (empresasDisponibles && empresasDisponibles.length > 0) ? empresasDisponibles : defaultCompanies;
  const fallbackEmpresa = defaultCompanies[0];
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(empresaActiva?.id || listCompanies[0].id);

  if (!isOpen) return null;

  const currentCompany = listCompanies.find(e => e.id === selectedCompanyId) || empresaActiva || fallbackEmpresa;

  // URL del portal técnico para esta empresa
  const baseUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : '';
  const techPublicUrl = `${baseUrl}?tecnico&empresa=${currentCompany.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(techPublicUrl);
    setCopied(true);
    if (addToast) addToast(`Enlace de Portal Técnico copiado al portapapeles.`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=850');
    if (!printWindow) return;

    const qrSvg = printRef.current?.querySelector('svg')?.outerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartel QR de Obra - ${currentCompany.nombreCorto}</title>
          <style>
            @page { size: portrait; margin: 15mm; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #fff;
              color: #0f172a;
            }
            .poster-card {
              border: 3px solid #0f172a;
              border-radius: 16px;
              padding: 24px;
              width: 100%;
              max-width: 450px;
              text-align: center;
              box-sizing: border-box;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .company-tag {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #d97706;
              background: #fef3c7;
              padding: 4px 12px;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .header-title {
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
              margin: 6px 0;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .subtitle {
              font-size: 12px;
              color: #475569;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .qr-wrapper {
              background: #fff;
              padding: 16px;
              border-radius: 16px;
              border: 2px solid #e2e8f0;
              display: inline-block;
              margin: 12px 0;
            }
            .instructions {
              background: #f8fafc;
              border: 1px border #cbd5e1;
              border-radius: 12px;
              padding: 12px;
              margin-top: 16px;
              font-size: 11px;
              color: #334155;
              text-align: left;
            }
            .instructions ol {
              margin: 6px 0 0 18px;
              padding: 0;
            }
            .instructions li {
              margin-bottom: 4px;
            }
            .footer-url {
              font-size: 9px;
              font-family: monospace;
              color: #64748b;
              margin-top: 14px;
              word-break: break-all;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="company-tag">${currentCompany.nombreCorto}</div>
            <div class="header-title">PORTAL TÉCNICO EN OBRA</div>
            <div class="subtitle">Inspecciones • Reporte de Averías • Fotografía de Campo</div>
            
            <div class="qr-wrapper">
              ${qrSvg}
            </div>

            <div style="font-size: 13px; font-weight: bold; color: #b45309; margin-top: 8px;">
              📱 ESCANEE ESTE CÓDIGO CON SU MÓVIL
            </div>

            <div class="instructions">
              <strong>Pasos para el Técnico de Campo:</strong>
              <ol>
                <li>Abre la cámara de tu teléfono o el escáner de WhatsApp.</li>
                <li>Apunta al código QR para abrir el portal web.</li>
                <li>Completa el diagnóstico y toma fotos directamente de la falla.</li>
              </ol>
            </div>

            <div class="footer-url">
              ${techPublicUrl}
            </div>
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛠️ *PORTAL TÉCNICO DE CAMPO (${currentCompany.nombreCorto})*\n\n` +
      `Acceso a inspección de obras, reportes con fotos y pedido de repuestos:\n\n` +
      `🔗 ${techPublicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado del Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
            <QrCode size={20} />
            <span>{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">

          {/* Selector de Empresa */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
              Empresa / División del Código QR:
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs rounded-xl p-2.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              {listCompanies.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.nombreCorto} ({comp.rif})
                </option>
              ))}
            </select>
          </div>

          {/* Tarjeta Visual de Etiqueta QR */}
          <div 
            ref={printRef}
            className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 shadow-inner"
          >
            <div className="flex items-center justify-center p-2 bg-slate-900/80 rounded-xl border border-slate-800">
              <CompanyLogo empresa={currentCompany} size={36} showText={true} textColor="text-zinc-100" />
            </div>

            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider">
              <Wrench size={14} />
              <span>Portal Técnico de Campo en Obra</span>
            </div>

            <h4 className="text-sm font-black text-white text-center">
              Acceso Directo para Técnicos en Obra
            </h4>

            {/* Render del SVG del Código QR */}
            <div className="bg-white p-4 rounded-2xl border-4 border-amber-400/50 shadow-2xl my-1 flex items-center justify-center">
              <QRCodeSVG 
                value={techPublicUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-[11px] font-mono text-slate-400 text-center max-w-xs">
              Apunta la cámara del smartphone para ingresar directamente a las inspecciones de obra y captura de fotos.
            </p>
          </div>

          {/* Campo con URL editable/copiable */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>URL Directa del Portal Técnico (`?tecnico`):</span>
              <a 
                href={techPublicUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
              >
                <span>Probar Enlace</span>
                <ExternalLink size={10} />
              </a>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={techPublicUrl}
                className="bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs rounded-xl p-2.5 w-full outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Acciones de Exportación e Impresión */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handlePrintLabel}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Printer size={16} />
            <span>Imprimir Cartel / Etiqueta QR para Obra</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs font-mono transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow"
          >
            <Share2 size={16} />
            <span>Enviar por WhatsApp</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default PortalTecnicoQRModal;
