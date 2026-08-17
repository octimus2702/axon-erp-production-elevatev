import React from 'react';

export type CompanyId = 'ITA_ASCENSORES' | 'SOLUCIONES_DAKACO' | 'TECNO_ELEVATEV' | 'PROYECTOS_VERTICALES_AB' | 'ELEVADORES_DEL_LAGO';

export interface CompanyInfo {
  id: CompanyId;
  nombre: string;
  nombreCorto: string;
  rif: string;
  slogan: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto?: string;
  colorPrimario?: string;
  logoTipo: 'ITA_ASCENSORES' | 'DAKACO' | 'TECNO_ELEVATEV' | 'PROYECTOS_VERTICALES' | 'ELEVADORES_DEL_LAGO';
}

export const COMPANIES: Record<CompanyId, CompanyInfo> = {
  ITA_ASCENSORES: {
    id: 'ITA_ASCENSORES',
    nombre: 'Ascensores Barbaroza, C.A (ITA ASCENSORES)',
    nombreCorto: 'ITA ASCENSORES',
    rif: 'J-29993664-2',
    slogan: 'Ingeniería, Mantenimiento & Control Operativo de Ascensores',
    direccion: 'Av. Elías Rodríguez, Galpón N° 15, Zona Industrial, Las Tejerías, Edo. Aragua',
    telefono: '+58 (412) 123-4567 / +58 (244) 321-8899',
    email: 'mantenimiento.barbaroza@gmail.com',
    logoTipo: 'ITA_ASCENSORES',
  },
  SOLUCIONES_DAKACO: {
    id: 'SOLUCIONES_DAKACO',
    nombre: 'Soluciones Integrales DAKACO, C.A.',
    nombreCorto: 'Soluciones Integrales DAKACO',
    rif: 'J-409780457',
    slogan: 'Servicios Integrales y Mantenimiento de Ascensores',
    direccion: 'Caracas, Venezuela',
    telefono: '+58 (412) 555-0199 / (0212) 409-7804',
    email: 'contacto@dakaco.com',
    logoTipo: 'DAKACO',
  },
  TECNO_ELEVATEV: {
    id: 'TECNO_ELEVATEV',
    nombre: 'TECNO ELEVATEV, C.A',
    nombreCorto: 'TECNO ELEVATEV, C.A',
    rif: 'J-40382654-4',
    slogan: 'Modernización y Mantenimiento de Ascensores',
    direccion: 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.',
    telefono: '(0412)983.49.95 / (0412)619.02.55',
    email: 'gerencia.elevatev@gmail.com',
    logoTipo: 'TECNO_ELEVATEV',
  },
  PROYECTOS_VERTICALES_AB: {
    id: 'PROYECTOS_VERTICALES_AB',
    nombre: 'Proyectos Verticales AB, C.A.',
    nombreCorto: 'Proyectos Verticales AB',
    rif: 'J-40485349-9',
    slogan: 'Ingeniería, Montajes & Soluciones de Elevación Vertical',
    direccion: 'Los Teques, Edo. Miranda, Venezuela',
    telefono: '+58 (412) 888-9900',
    email: 'contacto.proyectosverticalesab@gmail.com',
    contacto: 'Michael Hernández',
    logoTipo: 'PROYECTOS_VERTICALES',
  },
  ELEVADORES_DEL_LAGO: {
    id: 'ELEVADORES_DEL_LAGO',
    nombre: 'Elevadores y Servicios Del Lago, C.A.',
    nombreCorto: 'Elevadores del Lago',
    rif: 'J-407768913',
    slogan: 'Servicios, Mantenimiento & Elevación Vertical',
    direccion: 'Maracaibo, Edo. Zulia - Venezuela',
    telefono: '+58 (412) 776-8913 / +58 (261) 700-4077',
    email: 'contacto@elevadoresdellago.com',
    logoTipo: 'ELEVADORES_DEL_LAGO',
  }
};

// -------------------------------------------------------------
// EMPRESA ACTIVA Y MODO DE PRODUCCIÓN DEL SISTEMA
//
// Opciones para ACTIVE_COMPANY_ID:
// - 'ITA_ASCENSORES'   : Portal 100% Exclusivo para Ascensores Barbaroza C.A. (ITA ASCENSORES)
// - 'TECNO_ELEVATEV'   : Portal Exclusivo para Tecno Elevatev C.A.
// - 'SOLUCIONES_DAKACO': Portal Exclusivo para Soluciones DAKACO
// - 'ELEVADORES_DEL_LAGO': Portal Exclusivo para Elevadores y Servicios Del Lago, C.A.
// - 'TODAS'            : Modo Desarrollo / Plataforma Multi-Empresa Unificada
// -------------------------------------------------------------
export const ACTIVE_COMPANY_ID = 'TECNO_ELEVATEV' as ('TODAS' | CompanyId);

export const CURRENT_COMPANY = COMPANIES[ACTIVE_COMPANY_ID === 'TODAS' ? 'TECNO_ELEVATEV' : ACTIVE_COMPANY_ID];
