import { memo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Competencia, FechaISO } from '../../types';
import { practicasFueraDeOrden } from '../../utils/progreso';
import { SelectorFecha } from './SelectorFecha';

interface Props {
  competencia: Competencia;
  fechas: (FechaISO | null)[];
  soloLectura: boolean;
  onCambiar: (competenciaId: string, indice: number, fecha: FechaISO | null) => void;
}

/** Mensajes del tipo "La práctica 2 es anterior a la práctica 1". */
function avisosDeOrden(fechas: (FechaISO | null)[]): string[] {
  return practicasFueraDeOrden(fechas).map((i) => {
    const previa = fechas.findIndex((f, j) => j < i && f !== null && f > (fechas[i] as string));
    return `La práctica ${i + 1} tiene fecha anterior a la práctica ${previa + 1}.`;
  });
}

export const FilaCompetencia = memo(function FilaCompetencia({ competencia, fechas, soloLectura, onCambiar }: Props) {
  const hechas = fechas.filter(Boolean).length;
  const completa = hechas === fechas.length;
  const fuera = practicasFueraDeOrden(fechas);
  const avisos = avisosDeOrden(fechas);

  return (
    <li className={`px-3 py-3 sm:px-4 ${completa ? 'bg-emerald-50/50' : ''}`}>
      <div className="mb-2 flex items-start gap-2">
        {completa ? (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Competencia completa" />
        ) : (
          <span
            className="mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full border border-slate-300 px-1 text-[10px] font-bold text-slate-500"
            aria-label={`${hechas} de ${fechas.length} prácticas`}
          >
            {hechas}/{fechas.length}
          </span>
        )}
        <p className={`text-sm leading-snug ${completa ? 'font-medium text-emerald-900' : 'text-slate-800'}`}>{competencia.nombre}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:pl-7">
        {fechas.map((f, i) => (
          <SelectorFecha
            key={i}
            numero={i + 1}
            fecha={f}
            contexto={competencia.nombre}
            soloLectura={soloLectura}
            fueraDeOrden={fuera.includes(i)}
            onCambiar={(fecha) => onCambiar(competencia.id, i, fecha)}
          />
        ))}
      </div>
      {avisos.map((a) => (
        <p key={a} className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 sm:pl-7">
          <AlertTriangle size={13} className="shrink-0" aria-hidden />
          {a} Revisá si es correcto.
        </p>
      ))}
    </li>
  );
});
