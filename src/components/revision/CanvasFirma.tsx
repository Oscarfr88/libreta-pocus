import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

type Punto = [number, number]; // coordenadas normalizadas 0–1
type Trazo = Punto[];

export interface ManejadorFirma {
  borrar: () => void;
  /** PNG con fondo transparente, o null si no hay firma. */
  aPNG: () => string | null;
}

interface Props {
  deshabilitado?: boolean;
  /** Avisa si el recuadro tiene o no una firma. */
  onCambio: (tieneFirma: boolean) => void;
  etiqueta: string;
}

const ANCHO_PNG = 900;
const ALTO_PNG = 300;
const TINTA = '#0f172a';

/** Dibuja los trazos (normalizados) en un contexto de ancho×alto px. */
function dibujar(ctx: CanvasRenderingContext2D, trazos: Trazo[], ancho: number, alto: number, grosor: number) {
  ctx.clearRect(0, 0, ancho, alto);
  ctx.strokeStyle = TINTA;
  ctx.fillStyle = TINTA;
  ctx.lineWidth = grosor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const t of trazos) {
    const p = t.map(([x, y]) => [x * ancho, y * alto] as Punto);
    if (p.length === 1) {
      ctx.beginPath();
      ctx.arc(p[0][0], p[0][1], grosor / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Curvas suaves que pasan por los puntos medios de cada segmento.
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2;
      const my = (p[i][1] + p[i + 1][1]) / 2;
      ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    const u = p[p.length - 1];
    ctx.lineTo(u[0], u[1]);
    ctx.stroke();
  }
}

/** Recuadro para firmar con el dedo, un lápiz o el mouse. */
export const CanvasFirma = forwardRef<ManejadorFirma, Props>(function CanvasFirma({ deshabilitado, onCambio, etiqueta }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const trazos = useRef<Trazo[]>([]);
  const actual = useRef<Trazo | null>(null);

  const redibujar = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    if (c.width !== Math.round(width * dpr) || c.height !== Math.round(height * dpr)) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    dibujar(ctx, trazos.current, c.width, c.height, 2.6 * dpr);
  }, []);

  // Al cambiar el tamaño (girar el teléfono) se redibuja sin perder la firma.
  useEffect(() => {
    redibujar();
    const obs = new ResizeObserver(redibujar);
    if (canvas.current) obs.observe(canvas.current);
    return () => obs.disconnect();
  }, [redibujar]);

  useImperativeHandle(ref, () => ({
    borrar: () => {
      trazos.current = [];
      actual.current = null;
      redibujar();
      onCambio(false);
    },
    aPNG: () => {
      if (!trazos.current.length) return null;
      const c = document.createElement('canvas');
      c.width = ANCHO_PNG;
      c.height = ALTO_PNG;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      dibujar(ctx, trazos.current, ANCHO_PNG, ALTO_PNG, 5);
      return c.toDataURL('image/png');
    },
  }));

  const punto = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): Punto => {
    const r = canvas.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };

  return (
    <div className="relative">
      <canvas
        ref={canvas}
        role="img"
        aria-label={etiqueta}
        className={`block aspect-[3/1] w-full touch-none select-none rounded-xl border-2 bg-white ${
          deshabilitado ? 'cursor-not-allowed border-slate-200 opacity-50' : 'cursor-crosshair border-slate-300'
        }`}
        onPointerDown={(e) => {
          if (deshabilitado || (e.pointerType === 'mouse' && e.button !== 0)) return;
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* Algunos navegadores no permiten capturar este puntero; se dibuja igual. */
          }
          actual.current = [punto(e)];
          trazos.current.push(actual.current);
          redibujar();
        }}
        onPointerMove={(e) => {
          if (!actual.current) return;
          const eventos = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
          for (const ev of eventos.length ? eventos : [e.nativeEvent]) actual.current.push(punto(ev));
          redibujar();
        }}
        onPointerUp={() => {
          if (!actual.current) return;
          actual.current = null;
          onCambio(trazos.current.length > 0);
        }}
        onPointerCancel={() => {
          actual.current = null;
          onCambio(trazos.current.length > 0);
        }}
      />
      {/* Línea guía (no forma parte de la imagen de la firma) */}
      <div className="pointer-events-none absolute inset-x-6 bottom-[22%] border-b border-dashed border-slate-300" aria-hidden />
    </div>
  );
});
