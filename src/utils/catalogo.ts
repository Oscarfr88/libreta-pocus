import type { Bloque, CatalogoSimple } from '../types';
import { normalizarTexto } from './texto';

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * Convierte un catálogo en formato simple (nombres) al formato interno con ids.
 * Los ids dependen de la posición: son estables dentro de un mismo catálogo,
 * y cada libreta guarda su propia copia, así que no hace falta más.
 */
export function catalogoDesdeSimple(c: CatalogoSimple): Bloque[] {
  return c.bloques
    .map((b) => ({
      nombre: normalizarTexto(b.nombre),
      competencias: b.competencias.map(normalizarTexto).filter(Boolean),
    }))
    .filter((b) => b.nombre && b.competencias.length > 0)
    .map((b, i) => {
      const idBloque = `b${dos(i + 1)}`;
      return {
        id: idBloque,
        nombre: b.nombre,
        competencias: b.competencias.map((nombre, j) => ({ id: `${idBloque}-c${dos(j + 1)}`, nombre })),
      };
    });
}

/** Formato interno → formato simple (para exportar o editar a mano). */
export function catalogoASimple(bloques: Bloque[]): CatalogoSimple {
  return {
    bloques: bloques.map((b) => ({ nombre: b.nombre, competencias: b.competencias.map((c) => c.nombre) })),
  };
}

export function contarCompetencias(bloques: Bloque[]): number {
  return bloques.reduce((n, b) => n + b.competencias.length, 0);
}
