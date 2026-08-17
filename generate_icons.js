import sharp from 'sharp';
import fs from 'fs';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#1e1b2e" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
  </defs>

  <!-- Background rounded rectangle -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="94" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-opacity="0.6" />

  <!-- DAKACO Symbol / Shield & Elevator Arrow -->
  <g transform="translate(256, 210)">
    <!-- Gold Shield Outer Frame -->
    <rect x="-110" y="-120" width="220" height="240" rx="36" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="12" />
    
    <!-- Ascending Elevator Arrow -->
    <path d="M-36,20 L0,-70 L36,20 L16,20 L16,70 L-16,70 L-16,20 Z" fill="url(#goldGrad)" />
    
    <!-- Guide lines -->
    <line x1="-70" y1="-90" x2="-70" y2="90" stroke="#eab308" stroke-width="6" stroke-dasharray="10 8" opacity="0.6" />
    <line x1="70" y1="-90" x2="70" y2="90" stroke="#eab308" stroke-width="6" stroke-dasharray="10 8" opacity="0.6" />
  </g>

  <!-- Company Name DAKACO -->
  <text x="256" y="388" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="46" fill="#ffffff" text-anchor="middle" letter-spacing="3">
    DAKACO
  </text>
  
  <!-- Subtitle AXON ERP -->
  <text x="256" y="435" font-family="monospace" font-weight="700" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="6">
    AXON ERP
  </text>
</svg>
`;

fs.writeFileSync('./public/icon.svg', svgContent.trim());

sharp(Buffer.from(svgContent))
  .resize(512, 512)
  .png()
  .toFile('./public/icon.png')
  .then(() => console.log('Successfully generated public/icon.png and public/icon.svg for Soluciones DAKACO!'))
  .catch(err => console.error('Error generating icon:', err));
