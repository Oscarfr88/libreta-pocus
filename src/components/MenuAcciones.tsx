import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ItemMenu {
  etiqueta: string;
  icono?: ReactNode;
  onClick: () => void;
  peligro?: boolean;
  oculto?: boolean;
}

/** Menú desplegable "⋮" para acciones secundarias. */
export function MenuAcciones({ items, etiqueta = 'Más opciones' }: { items: ItemMenu[]; etiqueta?: string }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent | TouchEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
      >
        <MoreVertical size={22} />
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-700 shadow-xl">
          {items
            .filter((i) => !i.oculto)
            .map((i) => (
              <button
                key={i.etiqueta}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  i.onClick();
                }}
                className={`flex min-h-[44px] w-full items-center gap-3 px-4 text-left text-sm hover:bg-slate-50 ${i.peligro ? 'text-rose-700' : ''}`}
              >
                {i.icono}
                {i.etiqueta}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
