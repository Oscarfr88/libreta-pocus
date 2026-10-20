import type { ReactNode } from 'react';

interface Props {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  className?: string;
}

export function Tarjeta({ titulo, subtitulo, children, className = '' }: Props) {
  return (
    <section className={`animate-fade-in rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5 ${className}`}>
      {titulo && (
        <header className="mb-3 flex items-start gap-2">
          <span className="mt-1 h-4 w-1 shrink-0 rounded-full bg-primario" aria-hidden />
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-800">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
