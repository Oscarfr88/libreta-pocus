// Lectura y escritura de planillas (Excel / CSV) con SheetJS.
// SheetJS se carga recién cuando hace falta, para no demorar la apertura de la app.
import { normalizarTexto } from './texto';

export type Filas = string[][];

/** Formatos de planilla aceptados en los selectores de archivo. */
export const ACEPTA_PLANILLAS = '.xlsx,.xls,.ods,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

/**
 * Texto de un CSV: UTF-8 si es válido; si no, Windows-1252
 * (lo que guarda Excel en Windows al elegir "CSV (delimitado por comas)").
 */
export function decodificarTexto(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

/** Filas no vacías de la primera hoja con datos, como texto ya normalizado. */
export async function filasDesdeArchivo(nombre: string, buf: ArrayBuffer): Promise<Filas> {
  const XLSX = await import('xlsx');
  const esTexto = /\.(csv|txt)$/i.test(nombre);
  const libro = esTexto
    ? XLSX.read(decodificarTexto(buf), { type: 'string', raw: true })
    : XLSX.read(new Uint8Array(buf), { type: 'array' });
  for (const hoja of libro.SheetNames) {
    const filas = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[hoja], { header: 1, raw: false, defval: '', blankrows: false });
    const limpias = filas
      .map((f) => (Array.isArray(f) ? f : []).map(normalizarTexto))
      .filter((f) => f.some(Boolean));
    if (limpias.length) return limpias;
  }
  return [];
}

/** Lee un archivo elegido por el usuario. Lanza Error con un mensaje para mostrar. */
export async function leerPlanilla(archivo: File): Promise<Filas> {
  if (archivo.size > 10 * 1024 * 1024) throw new Error('El archivo es demasiado grande (máximo 10 MB).');
  try {
    return await filasDesdeArchivo(archivo.name, await archivo.arrayBuffer());
  } catch {
    throw new Error('No se pudo leer el archivo. Verificá que sea una planilla de Excel (.xlsx) o un .csv.');
  }
}

/** Genera un .xlsx (una hoja) a partir de filas de texto. */
export async function planillaXlsx(filas: Filas, nombreHoja: string, anchos?: number[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  if (anchos) hoja['!cols'] = anchos.map((wch) => ({ wch }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.slice(0, 31));
  const datos = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
