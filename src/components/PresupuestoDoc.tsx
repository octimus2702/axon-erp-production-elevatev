import React from 'react';
import { Presupuesto, EmpresaConfig } from '../types';
import CompanyLogo from './CompanyLogo';

interface PresupuestoDocProps {
  presupuesto: Presupuesto;
  empresa: EmpresaConfig;
  tasaCambioBCV?: number;
  isTechOrSupervisor?: boolean;
}

export default function PresupuestoDoc({
  presupuesto,
  empresa,
  tasaCambioBCV = 36.5,
  isTechOrSupervisor = false
}: PresupuestoDocProps) {
  const formatNum = (num: number) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const emailEmpresa = empresa.email || 'gerencia.elevatev@gmail.com';
  const telEmpresa = empresa.telefono || '(0412)983.49.95 / (0412)619.02.55';
  const dirEmpresa = empresa.direccion || 'Av. Lecuna del Conjunto Residencial Parque Central, Zona II, Edif. Catuche, Local 2CS4.';
  const nombreEmpresa = (empresa.nombre || 'TECNO ELEVATEV, C.A').toUpperCase();

  // Calcular subtotal, IVA y total si no vinieran calculados
  const subtotal = presupuesto.subtotalUSD ?? presupuesto.items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitarioUSD), 0);
  const iva = presupuesto.ivaUSD ?? (subtotal * 0.16);
  const total = presupuesto.totalUSD ?? (subtotal + iva);

  return (
    <div 
      id={`document-presupuesto-${presupuesto.id || presupuesto.correlativo}`}
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

      {/* 2. LÍNEA NRO PRESUPUESTO, FECHA Y CONCEPTO */}
      <div className="border-b border-slate-300 pb-2 mb-3 text-xs">
        <div className="flex justify-between items-center font-bold text-slate-900">
          <div>
            <span>N° Presupuesto: </span>
            <span>{presupuesto.correlativo}</span>
          </div>
          <div>
            <span>Emision: </span>
            <span>{presupuesto.fecha}</span>
          </div>
        </div>
        <div className="mt-1 text-[11px]">
          <span className="font-bold">Concepto: </span>
          <span>{presupuesto.proyectoAscensor || 'Mantenimiento y Reparación de Ascensores'}</span>
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
            <div><span className="font-bold">Cliente: </span>{presupuesto.clienteNombre}</div>
            <div><span className="font-bold">ID: </span>{presupuesto.clienteRif || 'J-00000000'}</div>
            <div><span className="font-bold">Telefono: </span>{presupuesto.clienteTelefono || '-'}</div>
            <div><span className="font-bold">Email: </span>{presupuesto.clienteEmail || '-'}</div>
            <div><span className="font-bold">Direccion: </span>{presupuesto.clienteDireccion || 'Caracas, Venezuela'}</div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div>
          <div className="font-black text-xs border-b border-slate-800 pb-0.5 mb-1.5 uppercase">
            OBSERVACIONES
          </div>
          <div className="space-y-0.5">
            <div><span className="font-bold">Condiciones de pago: </span>{presupuesto.condicionesPago || 'CONTADO'}</div>
            {presupuesto.notasValidez && (
              <div><span className="font-bold">Nota adicional: </span>{presupuesto.notasValidez}</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. TABLA DE ÍTEMS CON DESGLOSE */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-t border-b border-slate-800 font-bold text-[11px] text-slate-900">
              <th className="py-1.5 w-16 text-center">Cant.</th>
              <th className="py-1.5 pl-2">Descripcion</th>
              {!isTechOrSupervisor && <th className="py-1.5 w-28 text-right pr-2">Precio / Unit. $</th>}
              {!isTechOrSupervisor && <th className="py-1.5 w-28 text-right">Total $</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {presupuesto.items && presupuesto.items.map((it, idx) => (
              <tr key={idx} className="text-[11px]">
                <td className="py-1.5 text-center">{it.cantidad}</td>
                <td className="py-1.5 pl-2">{it.descripcion}</td>
                {!isTechOrSupervisor && <td className="py-1.5 text-right pr-2">{formatNum(it.precioUnitarioUSD)}</td>}
                {!isTechOrSupervisor && <td className="py-1.5 text-right">{formatNum(it.cantidad * it.precioUnitarioUSD)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. TOTALES DESGLOSADOS */}
      {!isTechOrSupervisor && (
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-xs text-right border-t border-slate-800 pt-2">
            <div className="flex justify-between">
              <span className="font-bold">Subtotal</span>
              <span>{formatNum(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">I.V.A (16%)</span>
              <span>{formatNum(iva)}</span>
            </div>
            <div className="flex justify-between font-black text-sm border-t border-slate-800 pt-1">
              <span className="uppercase">Total</span>
              <span>${formatNum(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. CUADRO DE OBSERVACIONES (BORDEADO) */}
      <div className="border border-slate-800 text-[10px] mb-3">
        <div className="font-bold border-b border-slate-800 px-3 py-1 bg-slate-50 uppercase text-[10.5px]">
          OBSERVACIONES
        </div>
        <div className="p-2.5 space-y-1 text-slate-800">
          <p>Presupuesto sin valor comercial ni legal, si no posee Firma del Gerente de Administracion.</p>
          <p className="font-bold pt-0.5">1. Se podra realizar Deposito o Transferencia directamente a nuestras cuentas Bancarias:</p>
          <div className="pl-3 text-slate-700">
            <p>a) Cuentas bancarias configuradas o cuenta corriente de {nombreEmpresa}.</p>
          </div>
          <p>* Pueden notificar deposito o transferencia al correo <span className="font-bold">{emailEmpresa}</span>.</p>
          <p className="pt-0.5">
            2. El presupuesto tiene validez de 15 dias continuos a partir de la fecha de emision. Queda entendido que los montos expresados en el presente presupuesto podran variar una vez transcurrido el tiempo de validez.
          </p>
          <div className="border-t border-slate-300 pt-1 mt-1">
            <p>
              El presupuesto tiene un valor equivalente en Bolivares a la tasa de cambio publicada por el Banco Central de Venezuela (B.C.V.) al momento de la cancelacion en caso de realizar el pago en Bolivares.
            </p>
          </div>
        </div>
      </div>

      {/* 7. CUADRO DE CONDICIONES DE GARANTÍA (BORDEADO) */}
      <div className="border border-slate-800 text-[10px]">
        <div className="font-bold border-b border-slate-800 px-3 py-1 bg-slate-50 uppercase text-[10.5px]">
          CONDICIONES DE GARANTIA
        </div>
        <div className="p-2.5 text-slate-800">
          <p>
            1. La garantia aplica por defectos de fabrica en los repuestos suministrados y por defectos ocasionados durante la instalacion. No aplica por fluctuaciones en el suministro electrico, uso inadecuado, vandalizacion o manipulacion por terceros sin autorizacion. Tiempo de garantia: (2) por repuestos suministrados y (2) por instalacion.
          </p>
        </div>
      </div>
    </div>
  );
}
