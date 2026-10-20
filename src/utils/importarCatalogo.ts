import type { Bloque, CatalogoSimple } from '../types';
import type { Filas } from './excel';
import { catalogoDesdeSimple, contarCompetencias } from './catalogo';
import { claveComparacion, normalizarTexto } from './texto';

export interface ResultadoCatalogo {
  bloques: Bloque[];
  competencias: number;
  avisos: string[];
}

const COLUMNA_BLOQUE = ['bloque', 'bloques'];
const COLUMNA_COMPETENCIA = ['competencia', 'competencias'];

/**
 * Catálogo desde una planilla con columnas "Bloque" y "Competencia" (una fila por competencia, en orden).
 * Si la celda del bloque queda vacía, se toma el bloque de la fila anterior (útil con celdas combinadas).
 */
export function catalogoDesdeFilas(filas: Filas): ResultadoCatalogo {
  const iEncabezado = filas.slice(0, 5).findIndex((f) => {
    const k = f.map(claveComparacion);
    return k.some((x) => COLUMNA_BLOQUE.includes(x)) && k.some((x) => COLUMNA_COMPETENCIA.includes(x));
  });
  if (iEncabezado < 0) {
    throw new Error('No se encontraron las columnas "Bloque" y "Competencia". La primera fila de la planilla debe tener esos títulos.');
  }
  const claves = filas[iEncabezado].map(claveComparacion);
  const iBloque = claves.findIndex((x) => COLUMNA_BLOQUE.includes(x));
  const iComp = claves.findIndex((x) => COLUMNA_COMPETENCIA.includes(x));

  const avisos: string[] = [];
  const bloques: CatalogoSimple['bloques'] = [];
  let actual: CatalogoSimple['bloques'][number] | null = null;
  let sinBloque = 0;
  let repetidas = 0;

  for (const fila of filas.slice(iEncabezado + 1)) {
    const nombreBloque = normalizarTexto(fila[iBloque]);
    const competencia = normalizarTexto(fila[iComp]);
    if (nombreBloque) {
      const existente = bloques.find((b) => claveComparacion(b.nombre) === claveComparacion(nombreBloque));
      actual = existente ?? { nombre: nombreBloque, competencias: [] };
      if (!existente) bloques.push(actual);
    }
    if (!competencia) continue;
    if (!actual) {
      sinBloque++;
      continue;
    }
    if (actual.competencias.some((c) => claveComparacion(c) === claveComparacion(competencia))) {
      repetidas++;
      continue;
    }
    actual.competencias.push(competencia);
  }

  if (sinBloque) avisos.push(`${sinBloque} competencia(s) sin bloque al comienzo de la planilla no se incorporaron.`);
  if (repetidas) avisos.push(`${repetidas} competencia(s) repetidas dentro del mismo bloque se omitieron.`);
  const vacios = bloques.filter((b) => b.competencias.length === 0);
  if (vacios.length) avisos.push(`Se omitieron bloques sin competencias: ${vacios.map((b) => b.nombre).join(', ')}.`);

  const resultado = catalogoDesdeSimple({ bloques });
  if (!resultado.length) throw new Error('La planilla no tiene competencias debajo de los títulos "Bloque" y "Competencia".');
  return { bloques: resultado, competencias: contarCompetencias(resultado), avisos };
}

/**
 * Catálogo desde un .json: formato simple {"bloques": [{"nombre", "competencias": [...]}]}
 * o un archivo de configuración completo (se toma el curso con el mismo nombre).
 */
export function catalogoDesdeJSON(datos: unknown, nombreCurso: string): ResultadoCatalogo {
  const obj = (typeof datos === 'object' && datos !== null ? datos : {}) as Record<string, unknown>;
  const config = (obj.configuracion ?? obj) as Record<string, unknown>;
  let fuente: unknown = obj.bloques;
  if (!fuente && Array.isArray(config.cursos)) {
    const curso = (config.cursos as Record<string, unknown>[]).find(
      (c) => typeof c?.nombre === 'string' && claveComparacion(c.nombre) === claveComparacion(nombreCurso),
    );
    if (!curso) throw new Error(`El archivo de configuración no tiene un curso llamado "${nombreCurso}".`);
    fuente = curso.bloques;
  }
  if (!Array.isArray(fuente)) throw new Error('El archivo .json no contiene un catálogo de competencias.');
  const simple: CatalogoSimple = {
    bloques: fuente
      .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
      .map((b) => ({
        nombre: normalizarTexto(b.nombre),
        competencias: (Array.isArray(b.competencias) ? b.competencias : []).map((c) =>
          normalizarTexto(typeof c === 'object' && c !== null ? (c as Record<string, unknown>).nombre : c),
        ),
      })),
  };
  const bloques = catalogoDesdeSimple(simple);
  if (!bloques.length) throw new Error('El catálogo del archivo está vacío.');
  return { bloques, competencias: contarCompetencias(bloques), avisos: [] };
}

/** Filas para exportar un catálogo a Excel (mismo formato que se importa). */
export function filasDeCatalogo(bloques: Bloque[]): string[][] {
  return [['Bloque', 'Competencia'], ...bloques.flatMap((b) => b.competencias.map((c) => [b.nombre, c.nombre]))];
}
