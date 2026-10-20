/** Descarga un archivo generado en el dispositivo. */
export function descargarBlob(nombre: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function descargarJSON(nombre: string, contenido: string): void {
  descargarBlob(nombre, new Blob([contenido], { type: 'application/json' }));
}
