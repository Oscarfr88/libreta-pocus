/** Lectura/escritura en localStorage sin romper la app si el almacenamiento falla. */

export function leerJSON(clave: string): unknown {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo guardar (p. ej. espacio lleno o almacenamiento bloqueado). */
export function guardarJSON(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
