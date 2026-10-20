import { useState } from 'react';
import type { Libreta } from '../types';
import { useConfig } from '../context/ConfigContext';
import { useNotificar } from '../context/NotificacionesContext';
import { descargarBlob } from '../utils/descargas';

/** El generador (y jsPDF) se carga recién al pedir el primer PDF. */
async function crearArchivo(libreta: Libreta, config: ReturnType<typeof useConfig>['config']) {
  const { generarPDF, nombreArchivoPDF } = await import('../utils/pdf/generarPDF');
  const doc = generarPDF({ libreta, config });
  return new File([doc.output('blob')], nombreArchivoPDF(libreta), { type: 'application/pdf' });
}

function puedeCompartirArchivos(): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'a.pdf', { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

export function usePDF(libreta: Libreta | undefined) {
  const { config } = useConfig();
  const notificar = useNotificar();
  const [generando, setGenerando] = useState(false);

  const ejecutar = async (accion: (archivo: File) => Promise<void> | void) => {
    if (!libreta || generando) return;
    setGenerando(true);
    try {
      await accion(await crearArchivo(libreta, config));
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') notificar('No se pudo generar el PDF. Probá de nuevo.', 'error');
    } finally {
      setGenerando(false);
    }
  };

  return {
    generando,
    puedeCompartir: puedeCompartirArchivos(),
    descargar: () =>
      ejecutar((archivo) => {
        descargarBlob(archivo.name, archivo);
        notificar(`PDF descargado: ${archivo.name}`);
      }),
    compartir: () => ejecutar((archivo) => navigator.share({ files: [archivo], title: archivo.name })),
  };
}
