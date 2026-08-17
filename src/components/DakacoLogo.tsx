import React from 'react';

interface DakacoLogoProps {
  size?: number; // Tamaño del emblema en px (default: 36)
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export default function DakacoLogo({ 
  size = 36, 
  showText = false, 
  textColor = 'text-white',
  className = '' 
}: DakacoLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Emblema Triangular 3 Colores (Amarillo, Azul, Naranja) */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        {/* Barra Superior Izquierda - Amarillo Golden */}
        <path 
          d="M 46 12 L 18 60 L 32 60 L 58 12 Z" 
          fill="#EAB308" 
        />
        <path 
          d="M 46 12 L 58 12 L 64 22 L 52 22 Z" 
          fill="#FACC15" 
        />

        {/* Barra Derecha - Azul Cobalto */}
        <path 
          d="M 60 14 L 88 64 L 74 64 L 48 18 Z" 
          fill="#2563EB" 
        />
        <path 
          d="M 60 14 L 48 18 L 54 28 L 64 22 Z" 
          fill="#60A5FA" 
        />

        {/* Barra Inferior - Naranja Warm */}
        <path 
          d="M 12 68 L 86 68 L 72 82 L 26 82 Z" 
          fill="#F97316" 
        />
        <path 
          d="M 12 68 L 26 82 L 20 82 L 8 68 Z" 
          fill="#FB923C" 
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-sans font-medium tracking-wide text-slate-300">
            Soluciones Integrales
          </span>
          <span className={`text-base font-black tracking-wider uppercase font-sans ${textColor}`}>
            DAKACO
          </span>
          <span className="text-[9px] font-mono font-bold text-amber-400/90 tracking-widest">
            RIF: J-409780457
          </span>
        </div>
      )}
    </div>
  );
}
