/**
 * Generador y actualizador dinámico de Favicons y Metadatos PWA por Empresa
 */
import { EmpresaConfig } from '../types';

export function updateDynamicFavicon(empresa: EmpresaConfig) {
  if (typeof document === 'undefined') return;

  const id = (empresa.id || '').toUpperCase();
  const logoTipo = empresa.logoTipo || id;

  let primaryColor = empresa.colorPrimario || '#06b6d4';
  let svgContent = '';

  if (logoTipo === 'ELEVADORES_DEL_LAGO' || id.includes('LAGO')) {
    primaryColor = '#0284C7';
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#030712" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#0284C7" stroke-width="3" stroke-opacity="0.8" />
        <path d="M 20 70 Q 50 40 80 70" stroke="#38BDF8" stroke-width="4" fill="none" />
        <line x1="50" y1="20" x2="50" y2="70" stroke="#0284C7" stroke-width="4" />
        <polygon points="50,15 42,28 58,28" fill="#38BDF8" />
        <circle cx="50" cy="50" r="6" fill="#F59E0B" />
      </svg>
    `;
  } else if (logoTipo === 'ITA_ASCENSORES' || id.includes('ITA') || id.includes('BARBAROZA')) {
    primaryColor = '#F59E0B';
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#090D16" />
        <path d="M 22 14 L 78 14 L 90 32 L 90 68 L 78 86 L 22 86 L 10 68 L 10 32 Z" fill="#0F172A" stroke="#F59E0B" stroke-width="4" />
        <path d="M 36 48 L 36 72 L 48 72 L 48 48 L 56 48 L 42 24 L 28 48 Z" fill="#F59E0B" />
        <path d="M 64 52 L 64 28 L 52 28 L 52 52 L 44 52 L 58 76 L 72 52 Z" fill="#06B6D4" />
      </svg>
    `;
  } else if (logoTipo === 'PROYECTOS_VERTICALES' || id.includes('PROYECTOS') || id.includes('VERTICALES')) {
    primaryColor = '#10B981';
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#022c22" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#10B981" stroke-width="3" stroke-opacity="0.8" />
        <rect x="26" y="24" width="48" height="52" rx="8" fill="#064e3b" stroke="#34D399" stroke-width="3" />
        <polygon points="38,48 50,28 62,48" fill="#10B981" />
        <polygon points="38,52 50,72 62,52" fill="#F59E0B" />
      </svg>
    `;
  } else if (logoTipo === 'SOLUCIONES_DAKACO' || logoTipo === 'DAKACO' || id.includes('DAKACO')) {
    primaryColor = '#EAB308';
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#090D16" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#EAB308" stroke-width="3" stroke-opacity="0.8" />
        <rect x="26" y="22" width="48" height="56" rx="8" fill="#0F172A" stroke="#EAB308" stroke-width="3" />
        <path d="M 42 62 L 50 36 L 58 62 L 53 62 L 53 72 L 47 72 L 47 62 Z" fill="#EAB308" />
      </svg>
    `;
  } else {
    // TECNO ELEVATEV C.A.
    primaryColor = '#06B6D4';
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="22" fill="#060D1A" />
        <rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#38BDF8" stroke-width="3" stroke-opacity="0.8" />
        <ellipse cx="50" cy="50" rx="38" ry="24" fill="none" stroke="#38BDF8" stroke-width="3.5" />
        <text x="50" y="38" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="11" fill="#38BDF8">TECNO</text>
        <text x="50" y="66" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">ELEV</text>
      </svg>
    `;
  }

  try {
    const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent.trim());

    // 1. Actualizar Favicon SVG en pestaña del navegador
    let iconSvgLink = document.querySelector('link[rel="icon"][type="image/svg+xml"]') as HTMLLinkElement;
    if (!iconSvgLink) {
      iconSvgLink = document.createElement('link');
      iconSvgLink.rel = 'icon';
      iconSvgLink.type = 'image/svg+xml';
      document.head.appendChild(iconSvgLink);
    }
    iconSvgLink.href = encodedSvg;

    // 2. Actualizar Favicon general
    let iconLink = document.querySelector('link[rel="icon"][type="image/png"]') as HTMLLinkElement;
    if (iconLink) {
      iconLink.href = encodedSvg;
    }

    // 3. Actualizar Apple Touch Icon para móviles
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = encodedSvg;
    }

    // 4. Actualizar Theme Color de la barra de navegación del navegador
    let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeMeta) {
      themeMeta.content = primaryColor;
    }
  } catch (e) {
    console.error('Error actualizando favicon dinámico:', e);
  }
}
