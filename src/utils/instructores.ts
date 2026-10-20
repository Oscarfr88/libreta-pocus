import { claveComparacion, compararEs, normalizarTexto } from './texto';

/** Recorta espacios, descarta vacíos, elimina duplicados (sin distinguir mayúsculas ni tildes) y ordena. */
export function depurarInstructores(nombres: unknown[]): string[] {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const n of nombres) {
    const limpio = normalizarTexto(n);
    if (!limpio) continue;
    const clave = claveComparacion(limpio);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(limpio);
  }
  return salida.sort(compararEs);
}
