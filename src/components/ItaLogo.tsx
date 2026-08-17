import React from 'react';

interface ItaLogoProps {
  size?: number; // Tamaño del emblema en px (default: 36)
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export default function ItaLogo({ 
  size = 36, 
  showText = false, 
  textColor = 'text-white',
  className = '' 
}: ItaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblema Tecnológico ITA Ascensores (Flechas de Ascensor VVVF & Escudo Amber/Cyan) */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        {/* Fondo Escudo Tecnológico Octagonal */}
        <path 
          d="M 20 10 L 80 10 L 95 30 L 95 70 L 80 90 L 20 90 L 5 70 L 5 30 Z" 
          fill="#0F172A" 
          stroke="#F59E0B"
          strokeWidth="3"
        />

        {/* Flecha Subida Amber VVVF */}
        <path 
          d="M 35 48 L 35 75 L 48 75 L 48 48 L 56 48 L 41.5 22 L 27 48 Z" 
          fill="#F59E0B" 
        />

        {/* Flecha Bajada Cyan CanBus */}
        <path 
          d="M 65 52 L 65 25 L 52 25 L 52 52 L 44 52 L 58.5 78 L 73 52 Z" 
          fill="#06B6D4" 
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-sans font-semibold tracking-wide text-amber-400">
            Ascensores Barbaroza, C.A.
          </span>
          <span className={`text-base font-black tracking-wider uppercase font-sans ${textColor}`}>
            ITA ASCENSORES
          </span>
          <span className="text-[9px] font-mono font-bold text-cyan-400/90 tracking-widest">
            RIF: J-29993664-2
          </span>
        </div>
      )}
    </div>
  );
}
