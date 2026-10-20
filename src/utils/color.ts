import { COLOR_PRIMARIO_POR_DEFECTO } from '../config';

type RGB = [number, number, number];

export function esHexValido(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
}

export function hexARgb(hex: string): RGB {
  const h = esHexValido(hex) ? hex : COLOR_PRIMARIO_POR_DEFECTO;
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

export function rgbAHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
}

/** Mezcla dos colores: t = 0 → a, t = 1 → b. */
function mezclar(a: RGB, b: RGB, t: number): RGB {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;
}

/** Luminancia relativa WCAG. */
function luminancia([r, g, b]: RGB): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a: RGB, b: RGB): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BLANCO: RGB = [255, 255, 255];
const NEGRO: RGB = [0, 0, 0];
const TINTA: RGB = [15, 23, 42]; // slate-900

export interface PaletaPrimaria {
  primario: RGB;
  /** Para hover / estados activos. */
  oscuro: RGB;
  /** Variante con contraste ≥ 4,5:1 sobre blanco, para texto y bordes finos. */
  texto: RGB;
  /** Fondo muy suave. */
  claro: RGB;
  /** Fondo suave / bordes. */
  suave: RGB;
  /** Color del texto apoyado sobre el color principal (blanco o casi negro). */
  sobre: RGB;
}

/** Deriva, a partir del color elegido, una paleta que mantiene buen contraste. */
export function paletaPrimaria(hex: string): PaletaPrimaria {
  const primario = hexARgb(hex);
  let texto = primario;
  for (let t = 0.1; contraste(texto, BLANCO) < 4.5 && t <= 1; t += 0.1) {
    texto = mezclar(primario, NEGRO, t);
  }
  return {
    primario,
    oscuro: mezclar(primario, NEGRO, 0.18),
    texto,
    claro: mezclar(primario, BLANCO, 0.92),
    suave: mezclar(primario, BLANCO, 0.78),
    sobre: contraste(BLANCO, primario) >= contraste(TINTA, primario) ? BLANCO : TINTA,
  };
}

/** Aplica el color principal a la interfaz (variables CSS y color de la barra del navegador). */
export function aplicarColorPrimario(hex: string): void {
  const p = paletaPrimaria(hex);
  const raiz = document.documentElement.style;
  const v = (c: RGB) => c.map(Math.round).join(' ');
  raiz.setProperty('--primario', v(p.primario));
  raiz.setProperty('--primario-oscuro', v(p.oscuro));
  raiz.setProperty('--primario-texto', v(p.texto));
  raiz.setProperty('--primario-claro', v(p.claro));
  raiz.setProperty('--primario-suave', v(p.suave));
  raiz.setProperty('--sobre-primario', v(p.sobre));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', rgbAHex(p.primario));
}
