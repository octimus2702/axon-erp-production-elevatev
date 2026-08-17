import React from 'react';

interface DelLagoLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export default function DelLagoLogo({
  size = 38,
  showText = false,
  textColor = 'text-white',
  className = ''
}: DelLagoLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblema Elevadores y Servicios Del Lago, C.A. */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-lg"
      >
        <defs>
          {/* Gradiante Azul Engranaje Exterior */}
          <linearGradient id="dellago_blue_gear" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </linearGradient>

          {/* Gradiante Metal / Cromo Anillo */}
          <linearGradient id="dellago_silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Fondo Interno Centro Cabina */}
          <radialGradient id="dellago_center_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#075985" />
          </radialGradient>

          {/* Brillo Cromo Escalera */}
          <linearGradient id="dellago_chrome" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
        </defs>

        {/* Círculo Base Blanco de Contorno */}
        <circle cx="100" cy="100" r="96" fill="#FFFFFF" />

        {/* Dientes de Engranaje Azul Exterior */}
        <g fill="url(#dellago_blue_gear)">
          {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((angle, i) => (
            <rect
              key={i}
              x="93"
              y="10"
              width="14"
              height="18"
              rx="2"
              transform={`rotate(${angle} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="82" />
        </g>

        {/* Anillo de Separación Plata / Cromo */}
        <circle cx="100" cy="100" r="72" fill="url(#dellago_silver)" />
        <circle cx="100" cy="100" r="66" fill="#0369A1" />

        {/* Núcleo Central Azul con Brillo */}
        <circle cx="100" cy="100" r="58" fill="url(#dellago_center_bg)" stroke="#1E293B" strokeWidth="2" />

        {/* Puertas de Ascensor Ilustradas */}
        <g transform="translate(10, 0)">
          {/* Marco Ascensor */}
          <rect x="74" y="65" width="32" height="48" rx="2" fill="none" stroke="url(#dellago_silver)" strokeWidth="3" />
          {/* Indicador de Piso arriba */}
          <rect x="83" y="68" width="14" height="4" rx="1" fill="#38BDF8" />
          {/* Hoja Izquierda */}
          <rect x="77" y="74" width="12" height="37" fill="url(#dellago_silver)" stroke="#475569" strokeWidth="0.5" />
          {/* Hoja Derecha */}
          <rect x="91" y="74" width="12" height="37" fill="url(#dellago_silver)" stroke="#475569" strokeWidth="0.5" />
          <line x1="90" y1="74" x2="90" y2="111" stroke="#334155" strokeWidth="1" />
        </g>

        {/* Escalera Mecánica (Perspectiva Diagonal Isométrica) */}
        <path
          d="M 60 120 L 95 95 L 135 95 L 135 105 L 102 105 L 67 130 Z"
          fill="url(#dellago_chrome)"
          stroke="#1E293B"
          strokeWidth="1.5"
        />
        {/* Pasamanos Azul Escalera */}
        <path
          d="M 58 118 L 95 91 L 135 91"
          stroke="#0284C7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Peldaños de Escalera */}
        <line x1="72" y1="122" x2="72" y2="128" stroke="#475569" strokeWidth="1" />
        <line x1="82" y1="115" x2="82" y2="121" stroke="#475569" strokeWidth="1" />
        <line x1="92" y1="108" x2="92" y2="114" stroke="#475569" strokeWidth="1" />
        <line x1="102" y1="101" x2="102" y2="107" stroke="#475569" strokeWidth="1" />
        <line x1="112" y1="97" x2="112" y2="103" stroke="#475569" strokeWidth="1" />
        <line x1="122" y1="97" x2="122" y2="103" stroke="#475569" strokeWidth="1" />

        {/* Texto "ELEVADORES Y SERVICIOS" curvado en arco superior */}
        <path id="dellago_text_path" d="M 32 110 A 70 70 0 0 1 168 110" fill="none" />
        <text fill="#0F172A" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
          <textPath href="#dellago_text_path" startOffset="50%" textAnchor="middle">
            ELEVADORES Y SERVICIOS
          </textPath>
        </text>

        {/* Banner Inferior "DEL LAGO, C.A." */}
        <path d="M 45 150 Q 100 168 155 150" fill="none" stroke="#FFFFFF" strokeWidth="14" />
        <text x="100" y="156" fill="#0369A1" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          DEL LAGO, C.A.
        </text>

        {/* RIF */}
        <text x="100" y="174" fill="#475569" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          RIF J-407768913
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-sans font-semibold tracking-wide text-sky-400">
            Elevadores y Servicios Del Lago, C.A.
          </span>
          <span className={`text-base font-black tracking-wider uppercase font-sans ${textColor}`}>
            DEL LAGO C.A.
          </span>
          <span className="text-[9px] font-mono font-bold text-sky-300 tracking-widest">
            RIF: J-407768913
          </span>
        </div>
      )}
    </div>
  );
}
