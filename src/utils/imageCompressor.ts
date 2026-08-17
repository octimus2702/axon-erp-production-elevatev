/**
 * Utilidad de optimización y compresión de imágenes para Supabase Storage
 * Redimensiona a un ancho máximo de 1200px y comprime a WebP/JPEG al 80% (150KB - 300KB)
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  fileName: string;
}

/**
 * Comprime y redimensiona una imagen (File o base64) para subida ultrarrápida
 * @param source File o string DataURL
 * @param fileName Nombre del archivo base (opcional)
 * @param maxWidth Ancho máximo (default 1200px)
 * @param quality Calidad de compresión (default 0.80 = 80%)
 */
export async function compressImage(
  source: File | string,
  fileName: string = 'evidencia.webp',
  maxWidth: number = 1200,
  quality: number = 0.80
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Función de procesamiento cuando la imagen cargue en memoria
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calcular escala manteniendo la relación de aspecto
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de renderizado de imagen.'));
          return;
        }

        // Renderizar con suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Preferir formato WebP, fallback a JPEG
        const format = 'image/webp';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback a JPEG si WebP no es soportado por el navegador
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    reject(new Error('Fallo en la compresión de la imagen'));
                    return;
                  }
                  const dataUrl = canvas.toDataURL('image/jpeg', quality);
                  const cleanName = fileName.replace(/\.[^/.]+$/, "") + ".jpg";
                  resolve({
                    blob: fallbackBlob,
                    dataUrl,
                    originalSizeKb: typeof source === 'string' ? Math.round(source.length * 0.75 / 1024) : Math.round(source.size / 1024),
                    compressedSizeKb: Math.round(fallbackBlob.size / 1024),
                    fileName: cleanName
                  });
                },
                'image/jpeg',
                quality
              );
              return;
            }

            const dataUrl = canvas.toDataURL(format, quality);
            const cleanName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
            resolve({
              blob,
              dataUrl,
              originalSizeKb: typeof source === 'string' ? Math.round(source.length * 0.75 / 1024) : Math.round(source.size / 1024),
              compressedSizeKb: Math.round(blob.size / 1024),
              fileName: cleanName
            });
          },
          format,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      reject(new Error('No se pudo procesar la imagen seleccionada'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(source);
    }
  });
}
