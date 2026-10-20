import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icono?: ReactNode;
  bloque?: boolean;
}

const estilos: Record<Variante, string> = {
  primario:
    'bg-primario text-primario-sobre hover:bg-primario-oscuro border border-transparent shadow-sm disabled:bg-slate-300 disabled:text-slate-500',
  secundario:
    'bg-white text-slate-700 border border-slate-300 hover:border-primario-texto hover:text-primario-texto disabled:text-slate-400 disabled:border-slate-200',
  peligro: 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 disabled:text-slate-400 disabled:border-slate-200',
  fantasma: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 disabled:text-slate-400',
};

/** Botón con altura táctil mínima de 44 px. */
export function Boton({ variante = 'secundario', icono, bloque, className = '', children, type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario-texto disabled:cursor-not-allowed ${estilos[variante]} ${bloque ? 'w-full' : ''} ${className}`}
      {...resto}
    >
      {icono}
      {children}
    </button>
  );
}
