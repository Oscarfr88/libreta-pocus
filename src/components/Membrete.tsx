import type { ReactNode } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { NOMBRE_APP } from '../config';
import { useConfig } from '../context/ConfigContext';

/** Encabezado de la pantalla de inicio con el membrete configurado. */
export function Membrete({ acciones }: { acciones?: ReactNode }) {
  const { membrete } = useConfig().config;
  const institucion = membrete.institucion.trim();
  const subtitulo = membrete.subtitulo.trim();
  return (
    <header className="barra-superior bg-primario text-primario-sobre">
      <div className="mx-auto max-w-3xl px-4 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          {membrete.logo ? (
            <span className="flex h-14 max-w-[75%] items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm sm:h-16">
              <img src={membrete.logo} alt={institucion ? `Logo de ${institucion}` : 'Logo de la institución'} className="max-h-full max-w-full object-contain" />
            </span>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15" aria-hidden>
              <BookOpenCheck size={26} />
            </span>
          )}
          {acciones}
        </div>
        <div className="mt-3">
          {institucion && <p className="text-sm font-semibold opacity-90">{institucion}</p>}
          <h1 className="text-xl font-bold leading-tight">{NOMBRE_APP}</h1>
          {subtitulo && <p className="mt-0.5 text-xs opacity-85">{subtitulo}</p>}
        </div>
      </div>
    </header>
  );
}
