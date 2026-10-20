import { CheckCircle2, ChevronDown } from 'lucide-react';
import type { Bloque, FechaISO, Libreta } from '../../types';
import { fechasDe, progresoBloque } from '../../utils/progreso';
import { BarraProgreso } from '../ui/BarraProgreso';
import { FilaCompetencia } from './FilaCompetencia';

interface Props {
  libreta: Libreta;
  bloque: Bloque;
  /** Competencias visibles según buscador / filtro (subconjunto del bloque). */
  visibles: Bloque['competencias'];
  abierto: boolean;
  onAlternar: () => void;
  onCambiar: (competenciaId: string, indice: number, fecha: FechaISO | null) => void;
}

export function BloqueCompetencias({ libreta, bloque, visibles, abierto, onAlternar, onCambiar }: Props) {
  const { completas, total } = progresoBloque(libreta, bloque);
  const completo = completas === total;
  const idContenido = `bloque-${bloque.id}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <h2>
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={abierto}
          aria-controls={idContenido}
          className="flex min-h-[56px] w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario-texto sm:px-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold uppercase tracking-wide text-slate-800">{bloque.nombre}</span>
            <span className="mt-1.5 flex items-center gap-2.5">
              <BarraProgreso
                delgada
                porcentaje={(completas / total) * 100}
                etiqueta={`${bloque.nombre}: ${completas} de ${total} competencias completas`}
                completo={completo}
              />
            </span>
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
              completo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {completo && <CheckCircle2 size={14} aria-hidden />}
            {completas}/{total}
          </span>
          <ChevronDown size={20} className={`shrink-0 text-slate-500 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </h2>
      {abierto && (
        <ul id={idContenido} className="divide-y divide-slate-100 border-t border-slate-100">
          {visibles.map((c) => (
            <FilaCompetencia
              key={c.id}
              competencia={c}
              fechas={libreta.practicas[c.id] ?? fechasDe(libreta, c.id)}
              soloLectura={!!libreta.firma}
              onCambiar={onCambiar}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
