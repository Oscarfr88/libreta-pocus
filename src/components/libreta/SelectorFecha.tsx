import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { FechaISO } from '../../types';
import { esFechaISOValida, esFutura, formatearFecha, hoyISO } from '../../utils/fechas';

interface Props {
  numero: number;
  fecha: FechaISO | null;
  /** Descripción para lectores de pantalla (p. ej. nombre de la competencia). */
  contexto: string;
  onCambiar: (fecha: FechaISO | null) => void;
  soloLectura?: boolean;
  fueraDeOrden?: boolean;
}

/**
 * Ficha táctil de fecha: muestra dd/mm/aaaa y, al tocarla, abre el calendario nativo
 * del dispositivo (que queda invisible encima). No acepta fechas futuras.
 */
export function SelectorFecha({ numero, fecha, contexto, onCambiar, soloLectura, fueraDeOrden }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const hoy = hoyISO();

  const abrirCalendario = () => {
    try {
      input.current?.showPicker();
    } catch {
      /* Sin soporte o ya abierto: el toque directo sobre el campo alcanza. */
    }
  };

  const borde = error
    ? 'border-rose-400 bg-rose-50'
    : fueraDeOrden
      ? 'border-amber-400 bg-amber-50'
      : fecha
        ? 'border-emerald-300 bg-emerald-50/60'
        : 'border-dashed border-slate-300 bg-white';

  return (
    <div>
      <div
        className={`relative rounded-xl border px-2 py-1.5 text-center transition ${borde} ${
          soloLectura ? '' : 'focus-within:ring-2 focus-within:ring-primario/40 hover:border-primario-texto'
        }`}
      >
        <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">Práctica {numero}</span>
        <span className={`block text-sm tabular-nums ${fecha ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
          {fecha ? formatearFecha(fecha) : soloLectura ? '—' : 'dd/mm/aaaa'}
        </span>
        {!soloLectura && (
          <input
            ref={input}
            type="date"
            max={hoy}
            value={fecha ?? ''}
            aria-label={`Fecha de la práctica ${numero} de ${contexto}${fecha ? `: ${formatearFecha(fecha)}` : ': sin fecha'}`}
            onClick={abrirCalendario}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setError(null);
                onCambiar(null);
              } else if (!esFechaISOValida(v)) {
                setError('Fecha no válida.');
              } else if (esFutura(v, hoy)) {
                setError('No se permiten fechas futuras.');
              } else {
                setError(null);
                onCambiar(v);
              }
            }}
            className="input-fecha-invisible absolute inset-0 h-full w-full cursor-pointer appearance-none text-base opacity-0"
          />
        )}
        {!soloLectura && fecha && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              onCambiar(null);
            }}
            aria-label={`Borrar la fecha de la práctica ${numero} de ${contexto}`}
            className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm hover:border-rose-400 hover:text-rose-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-center text-[11px] leading-tight text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
