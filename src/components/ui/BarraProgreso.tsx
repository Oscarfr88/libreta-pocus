interface Props {
  porcentaje: number;
  etiqueta: string;
  completo?: boolean;
  delgada?: boolean;
}

export function BarraProgreso({ porcentaje, etiqueta, completo, delgada }: Props) {
  const p = Math.max(0, Math.min(100, porcentaje));
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-slate-200 ${delgada ? 'h-1.5' : 'h-2.5'}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${completo ? 'bg-emerald-600' : 'bg-primario'}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
