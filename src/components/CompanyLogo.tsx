import React from 'react';
import DakacoLogo from './DakacoLogo';
import TecnoElevatevLogo from './TecnoElevatevLogo';
import ItaLogo from './ItaLogo';
import DelLagoLogo from './DelLagoLogo';
import ProyectosVerticalesLogo from './ProyectosVerticalesLogo';
import { Building2 } from 'lucide-react';
import { EmpresaConfig, EmpresaId } from '../types';

interface CompanyLogoProps {
  empresa?: EmpresaConfig | { id: string; logoTipo?: string; nombre?: string; nombreCorto?: string; rif?: string; slogan?: string; colorPrimario?: string } | null;
  logoTipo?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
  variant?: 'transparent' | 'badge' | 'icon-only';
  theme?: 'dark' | 'light';
}

export default function CompanyLogo({
  empresa,
  logoTipo,
  size = 36,
  showText = false,
  textColor = 'text-white',
  className = '',
  variant = 'transparent',
  theme = 'dark'
}: CompanyLogoProps) {
  // Determinar el logoTipo efectivo
  const effectiveLogoTipo = logoTipo || empresa?.logoTipo || (empresa?.id ? String(empresa.id) : '');
  const idStr = String(empresa?.id || '').toUpperCase();
  const nameStr = `${empresa?.nombre || ''} ${empresa?.nombreCorto || ''}`.toUpperCase();

  const isLago = effectiveLogoTipo === 'ELEVADORES_DEL_LAGO' || idStr.includes('LAGO') || nameStr.includes('LAGO');
  const isIta = effectiveLogoTipo === 'ITA_ASCENSORES' || idStr.includes('ITA') || idStr.includes('BARBAROZA') || nameStr.includes('ITA') || nameStr.includes('BARBAROZA');
  const isDakaco = effectiveLogoTipo === 'DAKACO' || effectiveLogoTipo === 'SOLUCIONES_DAKACO' || idStr.includes('DAKACO') || nameStr.includes('DAKACO');
  const isProyectos = effectiveLogoTipo === 'PROYECTOS_VERTICALES' || effectiveLogoTipo === 'PROYECTOS_VERTICALES_AB' || idStr.includes('PROYECTOS') || idStr.includes('VERTICALES') || nameStr.includes('PROYECTOS') || nameStr.includes('VERTICALES');
  const isTecno = effectiveLogoTipo === 'TECNO_ELEVATEV' || idStr.includes('TECNO') || idStr.includes('ELEVATEV') || nameStr.includes('TECNO') || nameStr.includes('ELEVATEV') || (!isLago && !isIta && !isDakaco && !isProyectos);

  if (isLago) {
    return <DelLagoLogo size={size} showText={showText} textColor={textColor} className={className} />;
  }

  if (isIta) {
    return <ItaLogo size={size} showText={showText} textColor={textColor} className={className} />;
  }

  if (isDakaco) {
    return <DakacoLogo size={size} showText={showText} textColor={textColor} className={className} />;
  }

  if (isProyectos) {
    return <ProyectosVerticalesLogo size={size} showText={showText} textColor={textColor} className={className} />;
  }

  // Por defecto Tecno Elevatev C.A.
  return <TecnoElevatevLogo size={size} showText={showText} textColor={textColor} className={className} variant={variant === 'badge' ? 'badge' : 'transparent'} theme={theme} />;
}
