import React from 'react';

interface ProyectosVerticalesLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
  logoUrl?: string;
}

export default function ProyectosVerticalesLogo({
  size = 36,
  showText = false,
  textColor = 'text-white',
  className = '',
  logoUrl
}: ProyectosVerticalesLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Proyectos Verticales AB, C.A."
        style={{ height: size, width: 'auto' }}
        className={`shrink-0 object-contain drop-shadow ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblema Proyectos Verticales AB (Torres de Elevación & Vértice Esmeralda/Teal) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          <linearGradient id="pvBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>
          <linearGradient id="pvEmeraldGrad" x1="0" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="pvGoldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* Contorno Hexagonal Elegante */}
        <path
          d="M 50 5 L 90 25 L 90 75 L 50 95 L 10 75 L 10 25 Z"
          fill="url(#pvBgGrad)"
          stroke="#10B981"
          strokeWidth="3.5"
        />

        {/* Torres Verticales de Elevación (Elevadores) */}
        <rect x="26" y="32" width="12" height="42" rx="2" fill="url(#pvEmeraldGrad)" opacity="0.85" />
        <rect x="44" y="20" width="12" height="54" rx="2" fill="url(#pvEmeraldGrad)" />
        <rect x="62" y="38" width="12" height="36" rx="2" fill="url(#pvEmeraldGrad)" opacity="0.85" />

        {/* Flecha Vertical Ascendente Central (Punta Dorada/Verde) */}
        <path
          d="M 50 14 L 62 28 L 54 28 L 54 44 L 46 44 L 46 28 L 38 28 Z"
          fill="url(#pvGoldGrad)"
        />

        {/* Rieles Horizontales de Estructura de Torre */}
        <line x1="26" y1="44" x2="38" y2="44" stroke="#A7F3D0" strokeWidth="1.5" opacity="0.7" />
        <line x1="26" y1="56" x2="38" y2="56" stroke="#A7F3D0" strokeWidth="1.5" opacity="0.7" />
        <line x1="44" y1="36" x2="56" y2="36" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="44" y1="52" x2="56" y2="52" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="44" y1="64" x2="56" y2="64" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="62" y1="50" x2="74" y2="50" stroke="#A7F3D0" strokeWidth="1.5" opacity="0.7" />

        {/* Iniciales 'AB' Base */}
        <text
          x="50"
          y="87"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="900"
          fontSize="13"
          fill="#34D399"
          letterSpacing="2"
        >
          PV AB
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-sans font-semibold tracking-wide text-emerald-400">
            Ingeniería & Montajes Verticales
          </span>
          <span className={`text-sm font-extrabold tracking-wide uppercase font-sans ${textColor}`}>
            Proyectos Verticales AB
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-400/80">
            RIF: J-40485349-9
          </span>
        </div>
      )}
    </div>
  );
}
