import type { Filas } from './excel';
import { depurarInstructores } from './instructores';
import { claveComparacion } from './texto';

export interface ResultadoInstructores {
  nombres: string[];
  formato: 'una-columna' | 'dos-columnas';
  conEncabezado: boolean;
  /** Filas leídas (sin contar el encabezado). */
  filasLeidas: number;
  /** Filas vacías o repetidas que no se incorporaron. */
  descartadas: number;
}

const COLUMNA_COMPLETA = ['nombre y apellido', 'nombre y apellidos', 'nombre completo', 'instructor', 'instructora', 'instructores', 'docente'];
const COLUMNA_NOMBRE = ['nombre', 'nombres'];
const COLUMNA_APELLIDO = ['apellido', 'apellidos'];

/**
 * Lista de instructores desde una planilla. Acepta:
 * - una columna "Nombre y apellido", o
 * - dos columnas "Nombre" y "Apellido",
 * con o sin fila de encabezado. Recorta espacios, elimina duplicados y ordena.
 */
export function instructoresDesdeFilas(filas: Filas): ResultadoInstructores {
  if (!filas.length) throw new Error('La planilla está vacía.');
  const claves = filas[0].map(claveComparacion);
  const iNombre = claves.findIndex((k) => COLUMNA_NOMBRE.includes(k));
  const iApellido = claves.findIndex((k) => COLUMNA_APELLIDO.includes(k));
  const iCompleta = claves.findIndex((k) => COLUMNA_COMPLETA.includes(k));

  let crudos: string[];
  let formato: ResultadoInstructores['formato'];
  let conEncabezado = true;
  let datos = filas.slice(1);

  if (iNombre >= 0 && iApellido >= 0) {
    formato = 'dos-columnas';
    crudos = datos.map((f) => [f[iNombre] ?? '', f[iApellido] ?? ''].filter(Boolean).join(' '));
  } else if (iCompleta >= 0 || iNombre >= 0) {
    formato = 'una-columna';
    const i = iCompleta >= 0 ? iCompleta : iNombre;
    crudos = datos.map((f) => f[i] ?? '');
  } else {
    // Sin encabezado: primera columna = nombre (o nombre y apellido), segunda = apellido.
    conEncabezado = false;
    datos = filas;
    formato = datos.some((f) => (f[1] ?? '') !== '') ? 'dos-columnas' : 'una-columna';
    crudos = datos.map((f) => [f[0] ?? '', f[1] ?? ''].filter(Boolean).join(' '));
  }

  const nombres = depurarInstructores(crudos);
  if (!nombres.length) throw new Error('No se encontraron nombres de instructores en la planilla.');
  return { nombres, formato, conEncabezado, filasLeidas: datos.length, descartadas: datos.length - nombres.length };
}
