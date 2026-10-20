import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

export function Campo({ etiqueta, error, ayuda, id, className = '', ...resto }: Props) {
  const idCampo = id ?? `campo-${etiqueta.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className={className}>
      <label htmlFor={idCampo} className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? `${idCampo}-nota` : undefined}
        className={`block min-h-[44px] w-full rounded-xl border bg-white px-3 text-base text-slate-900 outline-none transition focus:border-primario-texto focus:ring-2 focus:ring-primario/30 ${error ? 'border-rose-400' : 'border-slate-300'}`}
        {...resto}
      />
      {(error || ayuda) && (
        <p id={`${idCampo}-nota`} className={`mt-1 text-xs ${error ? 'text-rose-700' : 'text-slate-500'}`}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
