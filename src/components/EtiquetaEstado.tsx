import type { EstadoLibreta } from '../types';

const estilos: Record<EstadoLibreta, { texto: string; clase: string }> = {
  'en-curso': { texto: 'En curso', clase: 'bg-slate-100 text-slate-700 border-slate-300' },
  lista: { texto: 'Lista para firmar', clase: 'bg-amber-50 text-amber-800 border-amber-300' },
  validada: { texto: 'Validada', clase: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
};

export function EtiquetaEstado({ estado }: { estado: EstadoLibreta }) {
  const e = estilos[estado];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${e.clase}`}>{e.texto}</span>;
}
