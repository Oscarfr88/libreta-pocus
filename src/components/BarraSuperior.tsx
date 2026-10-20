import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  titulo: string;
  subtitulo?: string;
  onVolver?: () => void;
  acciones?: ReactNode;
  children?: ReactNode;
}

/** Barra fija superior con el color principal de la institución. */
export function BarraSuperior({ titulo, subtitulo, onVolver, acciones, children }: Props) {
  return (
    <header className="barra-superior sticky top-0 z-30 bg-primario text-primario-sobre shadow-md">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 py-1.5 sm:px-4">
        {onVolver && (
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className={`min-w-0 flex-1 ${onVolver ? '' : 'pl-2'}`}>
          <h1 className="truncate text-base font-semibold leading-tight">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs opacity-85">{subtitulo}</p>}
        </div>
        {acciones}
      </div>
      {children && <div className="mx-auto max-w-3xl px-4 pb-3">{children}</div>}
    </header>
  );
}
