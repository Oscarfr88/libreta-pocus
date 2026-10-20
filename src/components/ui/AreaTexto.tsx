import type { TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  ayuda?: string;
}

export function AreaTexto({ etiqueta, ayuda, id, className = '', ...resto }: Props) {
  const idCampo = id ?? `area-${etiqueta.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <div className={className}>
      <label htmlFor={idCampo} className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <textarea
        id={idCampo}
        aria-describedby={ayuda ? `${idCampo}-ayuda` : undefined}
        className="block min-h-[120px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base leading-relaxed text-slate-900 outline-none transition focus:border-primario-texto focus:ring-2 focus:ring-primario/30"
        {...resto}
      />
      {ayuda && (
        <p id={`${idCampo}-ayuda`} className="mt-1 text-xs text-slate-500">
          {ayuda}
        </p>
      )}
    </div>
  );
}
