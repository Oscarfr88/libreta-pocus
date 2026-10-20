/** Identificador único con prefijo legible (p. ej. "lib-3f2a…"). */
export function nuevoId(prefijo: string): string {
  const aleatorio =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${prefijo}-${aleatorio}`;
}
