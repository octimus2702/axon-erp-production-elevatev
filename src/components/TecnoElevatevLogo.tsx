import React from 'react';

interface TecnoElevatevLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
  logoUrl?: string;
  variant?: 'badge' | 'transparent';
  theme?: 'dark' | 'light';
}

export default function TecnoElevatevLogo({ 
  size = 36, 
  showText = false, 
  textColor = 'text-white',
  className = '',
  logoUrl,
  variant = 'transparent',
  theme = 'dark'
}: TecnoElevatevLogoProps) {
  // Proporción aproximada del logo es ~ 3.2 : 1
  const width = size * 3.2;
  const height = size;
  const letterColor = theme === 'light' ? '#002B49' : '#FFFFFF';
  const rifColor = theme === 'light' ? '#002B49' : '#94A3B8';
  const ovalStroke = theme === 'light' ? '#1D70B8' : '#38BDF8';

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="Tecno Elevatev C.A." 
        style={{ height: size, width: 'auto' }}
        className={`shrink-0 object-contain drop-shadow ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 350 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none"
      >
        <defs>
          {theme === 'dark' && (
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.4" />
            </filter>
          )}
        </defs>

        {/* FONDO CONTENEDOR TIPO BADGE SI SE SOLICITA O MARCO OSCURO ELEGANTE */}
        {variant === 'badge' && (
          <rect
            x="2"
            y="2"
            width="346"
            height="96"
            rx="18"
            fill={theme === 'light' ? '#F8FAFC' : '#060D1A'}
            stroke={theme === 'light' ? '#CBD5E1' : '#1E293B'}
            strokeWidth="2"
          />
        )}

        {/* ÓVALO CENTRAL CIAN/AZUL */}
        <ellipse 
          cx="134" 
          cy="48" 
          rx="62" 
          ry="32" 
          fill="none" 
          stroke={ovalStroke} 
          strokeWidth="4" 
          filter={theme === 'dark' ? "url(#cyanGlow)" : undefined}
        />

        {/* TEXTO SUPERIOR "TECNO" DENTRO DEL ÓVALO */}
        <text 
          x="134" 
          y="29" 
          textAnchor="middle" 
          fontFamily="Montserrat, Arial, Helvetica, sans-serif" 
          fontWeight="900" 
          fontSize="13" 
          fill={ovalStroke} 
          letterSpacing="2"
        >
          TECNO
        </text>

        {/* SECUENCIA PRINCIPAL DE LETRAS */}
        {/* "EL" (Fuera del óvalo a la izquierda) */}
        <text 
          x="28" 
          y="58" 
          fontFamily="Arial Black, Montserrat, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill={letterColor} 
          letterSpacing="-0.5"
        >
          EL
        </text>

        {/* "E" (Dentro del óvalo a la izquierda) */}
        <text 
          x="78" 
          y="58" 
          fontFamily="Arial Black, Montserrat, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill={letterColor}
        >
          E
        </text>

        {/* V TRIÁNGULO INVERTIDO (DENTRO DEL ÓVALO) */}
        <polygon 
          points="105,37 131,37 118,61" 
          fill={letterColor} 
          stroke={ovalStroke} 
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* A TRIÁNGULO HACIA ARRIBA (DENTRO DEL ÓVALO) */}
        <polygon 
          points="135,61 161,61 148,37" 
          fill={letterColor} 
          stroke={ovalStroke} 
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* "T" (Dentro del óvalo a la derecha) */}
        <text 
          x="168" 
          y="58" 
          fontFamily="Arial Black, Montserrat, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill={letterColor}
        >
          T
        </text>

        {/* "EV" (Fuera del óvalo a la derecha) */}
        <text 
          x="198" 
          y="58" 
          fontFamily="Arial Black, Montserrat, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill={letterColor} 
          letterSpacing="-0.5"
        >
          EV
        </text>

        {/* ".C.A" (Continuación) */}
        <text 
          x="250" 
          y="58" 
          fontFamily="Arial Black, Montserrat, sans-serif" 
          fontWeight="900" 
          fontSize="28" 
          fill={letterColor}
        >
          .C.A
        </text>

        {/* RIF EN LA PARTE INFERIOR DERECHA */}
        <text 
          x="320" 
          y="80" 
          textAnchor="end"
          fontFamily="Arial, Helvetica, sans-serif" 
          fontWeight="800" 
          fontSize="12" 
          fill={rifColor}
          letterSpacing="1"
        >
          J-40382654-4
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left leading-tight pl-2 border-l border-slate-700">
          <span className="text-[10px] font-mono font-extrabold tracking-wider text-cyan-400 uppercase">
            Ascensores & Montacargas
          </span>
          <span className={`text-xs font-black tracking-wide uppercase font-sans ${textColor}`}>
            Tecno Elevatev C.A.
          </span>
          <span className="text-[9px] font-mono text-zinc-400 font-bold">
            RIF: J-40382654-4
          </span>
        </div>
      )}
    </div>
  );
}
