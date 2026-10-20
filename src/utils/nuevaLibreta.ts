import type { Alumno, Curso, Libreta } from '../types';
import { PRACTICAS_REQUERIDAS } from '../config';
import { nuevoId } from './ids';

/** Crea una libreta vacía con una copia del catálogo actual del curso. */
export function crearLibreta(curso: Curso, alumno: Alumno, requeridas = PRACTICAS_REQUERIDAS): Libreta {
  const catalogo = structuredClone(curso.bloques);
  const practicas: Libreta['practicas'] = {};
  for (const b of catalogo) for (const c of b.competencias) practicas[c.id] = Array(requeridas).fill(null);
  const ahora = new Date().toISOString();
  return {
    id: nuevoId('lib'),
    cursoId: curso.id,
    cursoNombre: curso.nombre,
    catalogo,
    practicasRequeridas: requeridas,
    alumno,
    practicas,
    firma: null,
    creada: ahora,
    actualizada: ahora,
  };
}
