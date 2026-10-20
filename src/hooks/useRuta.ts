import { useCallback, useEffect, useState } from 'react';

// Navegación por hash (#/…): funciona en GitHub Pages sin configuración del servidor
// y respeta el botón "atrás" del celular.

export type Ruta =
  | { nombre: 'inicio' }
  | { nombre: 'nueva' }
  | { nombre: 'libreta'; id: string }
  | { nombre: 'presentar'; id: string }
  | { nombre: 'ajustes'; seccion?: string };

export function parsearRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (partes[0] === 'nueva') return { nombre: 'nueva' };
  if (partes[0] === 'libreta' && partes[1]) {
    return partes[2] === 'presentar' ? { nombre: 'presentar', id: partes[1] } : { nombre: 'libreta', id: partes[1] };
  }
  if (partes[0] === 'ajustes') return { nombre: 'ajustes', seccion: partes[1] };
  return { nombre: 'inicio' };
}

export function useRuta(): [Ruta, (destino: string, opciones?: { reemplazar?: boolean }) => void] {
  const [ruta, setRuta] = useState<Ruta>(() => parsearRuta(window.location.hash));

  useEffect(() => {
    const alCambiar = () => {
      setRuta(parsearRuta(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const navegar = useCallback((destino: string, opciones?: { reemplazar?: boolean }) => {
    const hash = '#' + destino;
    if (opciones?.reemplazar) {
      window.history.replaceState(null, '', hash);
      setRuta(parsearRuta(hash));
      window.scrollTo(0, 0);
    } else {
      window.location.hash = destino;
    }
  }, []);

  return [ruta, navegar];
}
