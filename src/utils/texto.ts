/** Normaliza un texto ingresado: forma NFC, sin espacios sobrantes. */
export function normalizarTexto(s: unknown): string {
  if (typeof s !== 'string' && typeof s !== 'number') return '';
  return String(s).normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Clave para comparar textos sin distinguir mayúsculas ni tildes. */
export function claveComparacion(s: string): string {
  return normalizarTexto(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('es');
}

/** Orden alfabético en español (ignora mayúsculas y tildes). */
export function compararEs(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}
