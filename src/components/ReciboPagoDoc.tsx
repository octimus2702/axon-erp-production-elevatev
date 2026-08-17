import React from 'react';
import { ReciboNota, EmpresaConfig } from '../types';
import CompanyLogo from './CompanyLogo';

interface ReciboPagoDocProps {
  recibo: ReciboNota;
  empresa: EmpresaConfig;
  tasaCambioBCV?: number;
  isPrintMode?: boolean;
}

export default function ReciboPagoDoc({
  recibo,
  empresa,
  tasaCambioBCV = 36.5,
  isPrintMode = false
}: ReciboPagoDocProps) {
  const formatNum = (num: number) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const emailEmpresa = empresa.email || 'gerencia.elevatev@gmail.com';
  const telEmpresa = empresa.telefono || '(0412)983.49.95 / (0412)619.02.55';
  const dirEmpresa = empresa.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
  const nombreEmpresa = (empresa.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();

  return (
    <div 
      id={`document-recibo-${recibo.id || recibo.correlativo}`}
      className="bg-white text-slate-900 font-mono text-[11px] leading-tight p-6 sm:p-10 max-w-3xl mx-auto select-text shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
      style={{ fontFamily: 'Courier, "Courier New", monospace, Consolas, sans-serif' }}
    >
      {/* 1. MEMBRETE / ENCABEZADO CON LOGO OFICIAL */}
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="shrink-0 pt-0.5">
          <CompanyLogo empresa={empresa} size={38} showText={false} theme="light" />
        </div>
        <div className="text-right flex-1 text-[11px]">
          <h1 className="font-bold text-sm tracking-tight text-slate-900">{nombreEmpresa}</h1>
          <p className="text-slate-700 text-[10px] mt-0.5">RIF: {empresa.rif || 'J-40382654-4'}</p>
          <p className="text-slate-800 text-[10px]">{dirEmpresa}</p>
          <p className="text-slate-800 text-[10px]">Telefono: {telEmpresa}</p>
        </div>
      </div>

      {/* 2. TÍTULO DEL DOCUMENTO */}
      <div className="text-center my-3">
        <h2 className="text-sm font-black tracking-widest uppercase border-b border-transparent inline-block pb-0.5 text-slate-900">
          {recibo.tipo === 'RECIBO_PAGO' ? 'RECIBO DE PAGO' : 'NOTA DE ENTREGA / RECIBO'}
        </h2>
      </div>

      {/* 3. LÍNEA NRO RECIBO Y FECHA */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
        <div>
          <span>Nro Recibo: </span>
          <span>{recibo.correlativo}</span>
        </div>
        <div>
          <span>Emision: </span>
          <span>{recibo.fecha}</span>
        </div>
      </div>

      {/* 4. BLOQUE 2 COLUMNAS: DATOS DEL CLIENTE / DETALLE DEL RECIBO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 mb-4 text-[11px]">
        {/* Columna Izquierda */}
        <div>
          <div className="font-black text-xs border-b border-slate-800 pb-0.5 mb-1.5 uppercase">
            DATOS DEL CLIENTE
          </div>
          <div className="space-y-0.5">
            <div><span className="font-bold">Cliente: </span>{recibo.clienteNombre}</div>
            <div><span className="font-bold">ID: </span>{recibo.clienteRif || 'J-00000000'}</div>
            <div><span className="font-bold">Telefono: </span>{recibo.clienteTelefono || '-'}</div>
            <div><span className="font-bold">Email: </span>{recibo.clienteEmail || '-'}</div>
            <div><span className="font-bold">Direccion: </span>{recibo.clienteDireccion || 'Caracas, Venezuela'}</div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div>
          <div className="font-black text-xs border-b border-slate-800 pb-0.5 mb-1.5 uppercase">
            DETALLE DEL RECIBO
          </div>
          <div className="space-y-0.5">
            <div><span className="font-bold">Concepto: </span>{recibo.concepto}</div>
            <div><span className="font-bold">Observaciones: </span>{recibo.observaciones || '-'}</div>
            {recibo.formaPago && (
              <div><span className="font-bold">Forma de Pago: </span>{recibo.formaPago} {recibo.referenciaPago ? `(Ref: ${recibo.referenciaPago})` : ''}</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. TABLA DE ÍTEMS / SERVICIOS */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-t border-b border-slate-800 font-bold text-[11px] text-slate-900">
              <th className="py-1.5 w-16 text-center">Cant.</th>
              <th className="py-1.5 pl-2">Descripcion</th>
              <th className="py-1.5 w-28 text-right pr-2">Precio / Unit. $</th>
              <th className="py-1.5 w-28 text-right">Total $</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {recibo.items && recibo.items.length > 0 ? (
              recibo.items.map((item, idx) => (
                <tr key={idx} className="text-[11px]">
                  <td className="py-1.5 text-center">{item.cantidad}</td>
                  <td className="py-1.5 pl-2">{item.descripcion}</td>
                  <td className="py-1.5 text-right pr-2">{formatNum(item.precioUnitarioUSD || item.precio || 0)}</td>
                  <td className="py-1.5 text-right font-bold">{formatNum((item.cantidad || 1) * (item.precioUnitarioUSD || item.precio || 0))}</td>
                </tr>
              ))
            ) : (
              <tr className="text-[11px]">
                <td className="py-2 text-center">1</td>
                <td className="py-2 pl-2">{recibo.concepto}</td>
                <td className="py-2 text-right pr-2">{formatNum(recibo.montoUSD)}</td>
                <td className="py-2 text-right font-bold">{formatNum(recibo.montoUSD)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-b border-slate-800 font-bold text-xs">
              <td colSpan={3} className="py-2 text-left uppercase">Total</td>
              <td className="py-2 text-right font-black">${formatNum(recibo.montoUSD)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 6. FIRMA DEL CLIENTE */}
      <div className="my-8 pt-4">
        <div className="w-56 text-left">
          <div className="border-b border-slate-700 w-full mb-1"></div>
          <p className="text-[11px] font-bold text-slate-800">Firma del cliente</p>
        </div>
      </div>

      {/* 7. CUADRO DE INFORMACIÓN DE PAGO (BORDEADO) */}
      <div className="border border-slate-800 text-[10.5px] mb-8">
        <div className="font-bold border-b border-slate-800 px-3 py-1 bg-slate-50 uppercase text-[11px]">
          INFORMACION DE PAGO
        </div>
        <div className="p-3 space-y-1.5">
          <p className="font-bold">1. Se podra realizar deposito o transferencia a las siguientes cuentas bancarias:</p>
          <div className="pl-3 text-slate-700 space-y-0.5">
            <p>a) Cuentas bancarias configuradas o cuenta corriente de {nombreEmpresa}.</p>
          </div>
          <p className="text-slate-800">* Puede notificar deposito o transferencia al correo <span className="font-bold">{emailEmpresa}</span>.</p>
          
          <div className="border-t border-slate-300 pt-2 mt-2 text-slate-800">
            <p>
              El recibo tiene un valor equivalente en Bolivares a la tasa de cambio publicada por el Banco Central de Venezuela (B.C.V.) al momento de la cancelacion en caso de realizar el pago en Bolivares.
            </p>
          </div>
        </div>
      </div>

      {/* 8. PIE DE PÁGINA CENTRADO */}
      <div className="text-center text-[10px] text-slate-600 border-t border-slate-200 pt-3 space-y-0.5">
        <p>Direccion: {dirEmpresa}</p>
        <p>Telefono: {telEmpresa}</p>
        <p>E-mail: {emailEmpresa}</p>
      </div>
    </div>
  );
}
