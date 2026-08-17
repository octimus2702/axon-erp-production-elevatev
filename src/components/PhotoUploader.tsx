import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Eye, Image as ImageIcon, Plus, X, CloudCheck, Loader2 } from 'lucide-react';
import { uploadFotoEvidencia, isSupabaseConfigured } from '../services/supabaseClient';
import { compressImage } from '../utils/imageCompressor';

interface PhotoUploaderProps {
  photos?: string[];
  onChange?: (photos: string[]) => void;
  maxPhotos?: number;
  readOnly?: boolean;
  label?: string;
  photoUrl?: string;
  onPhotoCaptured?: (url: string) => void;
  carpeta?: 'inspecciones' | 'cotizaciones' | 'repuestos' | 'comprobantes';
}

export default function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 6,
  readOnly = false,
  label = 'Fotos & Evidencias Visuales de Campo (Supabase Storage)',
  photoUrl,
  onPhotoCaptured,
  carpeta = 'inspecciones'
}: PhotoUploaderProps) {
  // Garantizar que safePhotos y activePhotos sean arreglos de cadenas válidos
  const safePhotos: string[] = Array.isArray(photos)
    ? photos.filter((p): p is string => typeof p === 'string' && Boolean(p.trim()))
    : (typeof photos === 'string' && (photos as string).trim() ? [photos as string] : []);

  const safePhotoUrl: string[] = typeof photoUrl === 'string' && photoUrl.trim() ? [photoUrl] : [];
  const activePhotos: string[] = safePhotos.length > 0 ? safePhotos : safePhotoUrl;

  const [isProcessing, setIsProcessing] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseReady = isSupabaseConfigured();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newPhotos: string[] = [...activePhotos];

    try {
      for (let i = 0; i < files.length; i++) {
        if (newPhotos.length >= maxPhotos) break;
        const file = files[i];
        
        setUploadStatus(`Optimizando y subiendo (${i + 1}/${files.length})...`);
        
        // Optimizar en cliente (1200px máx, calidad 80%) y subir a Bucket 'evidencias'
        const subida = await uploadFotoEvidencia(file, carpeta, `foto_${Date.now()}`);
        
        if (subida.url) {
          newPhotos.push(subida.url);
        }
      }

      if (onPhotoCaptured && newPhotos.length > 0) {
        onPhotoCaptured(newPhotos[newPhotos.length - 1]);
      }
      if (onChange) {
        onChange(newPhotos);
      }
    } catch (err) {
      console.error('Error al procesar/comprimir imagen:', err);
    } finally {
      setIsProcessing(false);
      setUploadStatus(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (readOnly) return;
    const updated = activePhotos.filter((_, idx) => idx !== index);
    if (onPhotoCaptured) {
      onPhotoCaptured(updated.length > 0 ? updated[updated.length - 1] : '');
    }
    if (onChange) {
      onChange(updated);
    }
  };

  return (
    <div className="space-y-3" id="photo-uploader-container">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon size={15} className="text-cyan-400" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          {supabaseReady ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Supabase Storage (evidencias)
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
              Compresión Activa (1200px / 80%)
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {activePhotos.length} / {maxPhotos}
          </span>
        </div>
      </div>

      {/* Grid de Fotos Existentes */}
      {activePhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {activePhotos.map((url, index) => {
            const isStorageUrl = typeof url === 'string' && url.includes('supabase.co');
            return (
              <div 
                key={index} 
                className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md transition hover:border-cyan-500/60"
              >
                <img 
                  src={url} 
                  alt={`Evidencia ${index + 1}`} 
                  className="w-full h-full object-cover cursor-pointer transition group-hover:scale-105"
                  onClick={() => setActivePreview(url)}
                  loading="lazy"
                />

                {isStorageUrl && (
                  <div className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-sm text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                    ☁️ Cloud URL
                  </div>
                )}

                {/* Acciones sobre la foto */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreview(url)}
                    className="p-2 bg-slate-900/90 text-cyan-400 hover:text-white rounded-xl border border-slate-700 cursor-pointer shadow-lg"
                    title="Ver en Grande"
                  >
                    <Eye size={16} />
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="p-2 bg-rose-950/90 text-rose-400 hover:text-white rounded-xl border border-rose-800 cursor-pointer shadow-lg"
                      title="Eliminar Foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botones de Captura / Subida */}
      {!readOnly && activePhotos.length < maxPhotos && (
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {/* Input oculto de cámara */}
          <input 
            type="file" 
            ref={cameraInputRef}
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={handleFileSelect}
          />

          {/* Input oculto de archivos / galería */}
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            multiple
            className="hidden" 
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{uploadStatus || 'Procesando...'}</span>
              </>
            ) : (
              <>
                <Camera size={16} />
                <span>📷 Tomar Foto con Cámara</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-800 hover:border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <Upload size={16} />
            <span>📁 Seleccionar de Galería / Archivos</span>
          </button>
        </div>
      )}

      {/* Modal de Previsualización en Grande */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950 text-slate-400 hover:text-white rounded-full border border-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="mt-8 mb-4 max-h-[75vh] overflow-auto flex items-center justify-center">
              <img 
                src={activePreview} 
                alt="Vista Previa Evidencia" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl border border-slate-800 shadow-xl"
              />
            </div>
            <div className="flex items-center justify-between w-full pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
              <span className="truncate max-w-md">{activePreview.startsWith('http') ? activePreview : 'Imagen Base64 Optimizada'}</span>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 cursor-pointer"
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
