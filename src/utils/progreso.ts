import type { Bloque, EstadoLibreta, FechaISO, Libreta } from '../types';

/** Fechas cargadas de una competencia, siempre con la longitud requerida. */
export function fechasDe(lib: Libreta, competenciaId: string): (FechaISO | null)[] {
  const f = lib.practicas[competenciaId] ?? [];
  return Array.from({ length: lib.practicasRequeridas }, (_, i) => f[i] ?? null);
}

export function competenciaCompleta(lib: Libreta, competenciaId: string): boolean {
  return fechasDe(lib, competenciaId).every((f) => f !== null);
}

export function progresoBloque(lib: Libreta, bloque: Bloque) {
  const completas = bloque.competencias.filter((c) => competenciaCompleta(lib, c.id)).length;
  return { completas, total: bloque.competencias.length };
}

export interface ProgresoLibreta {
  /** Prácticas con fecha / prácticas requeridas, de 0 a 100 (redondeado hacia abajo). */
  porcentaje: number;
  practicasHechas: number;
  practicasTotales: number;
  competenciasCompletas: number;
  competenciasTotales: number;
}

export function progresoLibreta(lib: Libreta): ProgresoLibreta {
  let practicasHechas = 0;
  let competenciasCompletas = 0;
  let competenciasTotales = 0;
  for (const b of lib.catalogo) {
    for (const c of b.competencias) {
      competenciasTotales++;
      const hechas = fechasDe(lib, c.id).filter((f) => f !== null).length;
      practicasHechas += hechas;
      if (hechas === lib.practicasRequeridas) competenciasCompletas++;
    }
  }
  const practicasTotales = competenciasTotales * lib.practicasRequeridas;
  const porcentaje = practicasTotales ? Math.floor((practicasHechas / practicasTotales) * 100) : 0;
  return { porcentaje, practicasHechas, practicasTotales, competenciasCompletas, competenciasTotales };
}

export function libretaCompleta(lib: Libreta): boolean {
  const p = progresoLibreta(lib);
  return p.competenciasTotales > 0 && p.competenciasCompletas === p.competenciasTotales;
}

export function estadoLibreta(lib: Libreta): EstadoLibreta {
  if (lib.firma) return 'validada';
  return libretaCompleta(lib) ? 'lista' : 'en-curso';
}

/**
 * Índices de las prácticas cuya fecha es anterior a la de alguna práctica previa
 * (p. ej. la práctica 2 anterior a la 1). Es solo un aviso: no bloquea.
 */
export function practicasFueraDeOrden(fechas: (FechaISO | null)[]): number[] {
  const fuera: number[] = [];
  let maxPrevia: FechaISO | null = null;
  fechas.forEach((f, i) => {
    if (!f) return;
    if (maxPrevia && f < maxPrevia) fuera.push(i);
    if (!maxPrevia || f > maxPrevia) maxPrevia = f;
  });
  return fuera;
}
