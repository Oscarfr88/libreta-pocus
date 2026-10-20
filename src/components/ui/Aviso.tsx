import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type Tipo = 'info' | 'atencion' | 'error' | 'exito';

const estilos: Record<Tipo, { caja: string; icono: ReactNode }> = {
  info: { caja: 'border-sky-200 bg-sky-50 text-sky-900', icono: <Info size={18} className="text-sky-700" /> },
  atencion: { caja: 'border-amber-300 bg-amber-50 text-amber-900', icono: <AlertTriangle size={18} className="text-amber-700" /> },
  error: { caja: 'border-rose-300 bg-rose-50 text-rose-900', icono: <XCircle size={18} className="text-rose-700" /> },
  exito: { caja: 'border-emerald-300 bg-emerald-50 text-emerald-900', icono: <CheckCircle2 size={18} className="text-emerald-700" /> },
};

export function Aviso({ tipo = 'info', children, className = '' }: { tipo?: Tipo; children: ReactNode; className?: string }) {
  const e = estilos[tipo];
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${e.caja} ${className}`}>
      <span className="mt-0.5 shrink-0">{e.icono}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
