import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  acciones?: ReactNode;
}

/** Diálogo modal accesible: Escape cierra, el foco entra al abrir y vuelve al cerrar. */
export function Modal({ abierto, titulo, onCerrar, children, acciones }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const enfocable = caja.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-cerrar])');
    (enfocable ?? caja.current)?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current();
    };
    document.addEventListener('keydown', alTeclear);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflow;
      previo?.focus();
    };
  }, [abierto]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onCerrar}>
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full animate-fade-in overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
          <button
            type="button"
            data-cerrar
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-sm text-slate-700">{children}</div>
        {acciones && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{acciones}</div>}
      </div>
    </div>
  );
}
