import React from 'react';
import { Factura, EmpresaConfig } from '../types';
import CompanyLogo from './CompanyLogo';

interface FacturaDocProps {
  factura: Factura;
  empresa: EmpresaConfig;
  tasaCambioBCV?: number;
}

export default function FacturaDoc({
  factura,
  empresa,
  tasaCambioBCV = 36.5
}: FacturaDocProps) {
  const formatNum = (num: number) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tasaEfectiva = factura.tasaCambioBs > 0 ? factura.tasaCambioBs : tasaCambioBCV;
  const subtotalUSD = factura.subtotalUSD ?? 0;
  const ivaUSD = factura.ivaMontoUSD ?? (subtotalUSD * ((factura.ivaPorcentaje ?? 16) / 100));
  const totalUSD = factura.totalUSD ?? (subtotalUSD + ivaUSD);

  const subtotalBs = subtotalUSD * tasaEfectiva;
  const ivaBs = ivaUSD * tasaEfectiva;
  const totalBs = totalUSD * tasaEfectiva;

  const emailEmpresa = empresa.email || 'gerencia.elevatev@gmail.com';
  const telEmpresa = empresa.telefono || '(0412)983.49.95 / (0412)619.02.55';
  const dirEmpresa = empresa.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
  const nombreEmpresa = (empresa.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();

  return (
    <div 
      id={`document-factura-${factura.id || factura.correlativo}`}
      className="bg-white text-slate-900 font-mono text-[11px] leading-tight p-6 sm:p-10 max-w-3xl mx-auto select-text shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
      style={{ fontFamily: 'Courier, "Courier New", monospace, Consolas, sans-serif' }}
    >
      {/* 1. MEMBRETE / ENCABEZADO CON LOGO OFICIAL */}
      <div className="flex items-start justify-between gap-4 pb-3 mb-2 border-b border-slate-200">
        <div className="shrink-0 pt-0.5">
          <CompanyLogo empresa={empresa} size={38} showText={false} theme="light" />
        </div>
        <div className="text-right flex-1 text-[11px] text-slate-800">
          <p className="font-bold text-sm tracking-tight text-slate-900">{nombreEmpresa}</p>
          <p className="text-[10px] mt-0.5 text-slate-700">RIF: {empresa.rif || 'J-40382654-4'}</p>
          <p className="text-[10px] text-slate-700">{dirEmpresa}</p>
          <p className="text-[10px] text-slate-700">Telefono: {telEmpresa}</p>
        </div>
      </div>

      {/* 1. TÍTULO CENTRADO "FACTURA" */}
      <div className="text-center my-4">
        <h1 className="text-base font-black tracking-widest uppercase text-slate-900">
          {factura.tipoComprobante || 'FACTURA'}
        </h1>
      </div>

      {/* 2. LÍNEA NRO FACTURA, EMISIÓN Y CONCEPTO */}
      <div className="border-b border-slate-300 pb-2 mb-4 text-xs">
        <div className="flex justify-between items-center font-bold text-slate-900">
          <div>
            <span>N° Factura: </span>
            <span>{factura.correlativo}</span>
          </div>
          <div>
            <span>Emisión: </span>
            <span>{factura.fecha}</span>
          </div>
        </div>
        <div className="mt-1 text-[11px]">
          <span className="font-bold">Concepto: </span>
          <span>{factura.concepto || factura.division || 'Mantenimiento y Servicios Técnicos'}</span>
        </div>
      </div>

      {/* 3. BLOQUE 2 COLUMNAS: DATOS DEL CLIENTE / OBSERVACIONES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 mb-4 text-[11px]">
        {/* Columna Izquierda */}
        <div>
          <div className="font-black text-xs border-b border-slate-800 pb-0.5 mb-1.5 uppercase">
            DATOS DEL CLIENTE
          </div>
          <div className="space-y-0.5">
            <div><span className="font-bold">Cliente: </span>{factura.clienteNombre}</div>
            <div><span className="font-bold">ID: </span>{factura.clienteRif || 'J-00000000'}</div>
            <div><span className="font-bold">Telefono: </span>{factura.clienteTelefono || '-'}</div>
            <div><span className="font-bold">Email: </span>{factura.clienteEmail || '-'}</div>
            <div>
              <span className="font-bold">Direccion: </span>
              <span>"{factura.clienteDireccion || 'Caracas, Venezuela'}"</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div>
          <div className="font-black text-xs border-b border-slate-800 pb-0.5 mb-1.5 uppercase">
            OBSERVACIONES
          </div>
          <div className="space-y-0.5">
            <div><span className="font-bold">Condiciones de pago: </span>{factura.condicionesPago || 'CONTADO'}</div>
            <div><span className="font-bold">Tasa B.C.V.: </span>Bs. {formatNum(tasaEfectiva)}</div>
            <div><span className="font-bold">Fecha de Tasa: </span>{factura.fecha}</div>
            {factura.division && (
              <div><span className="font-bold">División: </span>{factura.division}</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. TABLA DE ÍTEMS EN BOLÍVARES (BS.) */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-t border-b border-slate-800 font-bold text-[11px] text-slate-900">
              <th className="py-1.5 w-14 text-center">Cant.</th>
              <th className="py-1.5 pl-2">Descripcion</th>
              <th className="py-1.5 w-32 text-right pr-2">Precio / Unit. Bs.</th>
              <th className="py-1.5 w-32 text-right">Total Bs.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {factura.items && factura.items.map((it, idx) => {
              const precioUnitBs = (it.precioUnitarioUSD || 0) * tasaEfectiva;
              const totalItemBs = (it.cantidad || 1) * precioUnitBs;
              return (
                <tr key={idx} className="text-[11px]">
                  <td className="py-1.5 text-center">{it.cantidad}</td>
                  <td className="py-1.5 pl-2">{it.descripcion}</td>
                  <td className="py-1.5 text-right pr-2">{formatNum(precioUnitBs)}</td>
                  <td className="py-1.5 text-right">{formatNum(totalItemBs)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. CUADRO DE TOTALES DUALES ($ USD y Bs.) */}
      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-1 text-xs text-right border-t border-slate-800 pt-2 font-mono">
          <div className="flex justify-between items-center py-0.5">
            <span className="font-bold text-left">Subtotal</span>
            <div className="space-x-4">
              <span>$ {formatNum(subtotalUSD)}</span>
              <span className="font-bold">Bs. {formatNum(subtotalBs)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="font-bold text-left">I.V.A ({factura.ivaPorcentaje ?? 16}%)</span>
            <div className="space-x-4">
              <span>$ {formatNum(ivaUSD)}</span>
              <span className="font-bold">Bs. {formatNum(ivaBs)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 text-sm font-black">
            <span className="uppercase text-left">Total</span>
            <div className="space-x-4">
              <span>$ {formatNum(totalUSD)}</span>
              <span>Bs. {formatNum(totalBs)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. PIE DE PÁGINA */}
      <div className="text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
        <p>Documento emitido conforme a las providencias y normativas de facturación vigentes.</p>
        <p>{dirEmpresa} | Contacto: {emailEmpresa}</p>
      </div>
    </div>
  );
}
