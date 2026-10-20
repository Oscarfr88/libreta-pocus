import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type { Alumno, FechaISO, Firma, Libreta } from '../types';
import { CLAVE_LIBRETAS } from '../config';
import { guardarJSON, leerJSON } from '../utils/almacenamiento';
import { esFutura } from '../utils/fechas';
import { libretaCompleta } from '../utils/progreso';
import { sanearLibretas } from '../utils/validacion';

export type AccionLibretas =
  | { tipo: 'crear'; libreta: Libreta }
  | { tipo: 'fecha'; id: string; competenciaId: string; indice: number; fecha: FechaISO | null }
  | { tipo: 'alumno'; id: string; alumno: Alumno }
  | { tipo: 'eliminar'; id: string }
  /** Agrega o reemplaza (mismo id) una libreta importada desde un respaldo. */
  | { tipo: 'importar'; libreta: Libreta }
  | { tipo: 'firmar'; id: string; firma: Firma }
  | { tipo: 'reabrir'; id: string }
  | { tipo: 'recargar'; libretas: Libreta[] };

const ahora = () => new Date().toISOString();

/** Aplica un cambio a una libreta. Las libretas firmadas no se modifican (salvo reabrir). */
function editar(lista: Libreta[], id: string, cambio: (l: Libreta) => Libreta | null): Libreta[] {
  return lista.map((l) => {
    if (l.id !== id) return l;
    const nueva = cambio(l);
    return nueva ? { ...nueva, actualizada: ahora() } : l;
  });
}

export function reducerLibretas(estado: Libreta[], a: AccionLibretas): Libreta[] {
  switch (a.tipo) {
    case 'crear':
      return [...estado, a.libreta];
    case 'fecha':
      return editar(estado, a.id, (l) => {
        if (l.firma || !(a.competenciaId in l.practicas)) return null;
        if (a.indice < 0 || a.indice >= l.practicasRequeridas) return null;
        if (a.fecha && esFutura(a.fecha)) return null;
        const fechas = [...l.practicas[a.competenciaId]];
        fechas[a.indice] = a.fecha;
        return { ...l, practicas: { ...l.practicas, [a.competenciaId]: fechas } };
      });
    case 'alumno':
      return editar(estado, a.id, (l) => (l.firma ? null : { ...l, alumno: a.alumno }));
    case 'eliminar':
      return estado.filter((l) => l.id !== a.id);
    case 'importar':
      return estado.some((l) => l.id === a.libreta.id)
        ? estado.map((l) => (l.id === a.libreta.id ? a.libreta : l))
        : [...estado, a.libreta];
    case 'firmar':
      return editar(estado, a.id, (l) => (l.firma || !libretaCompleta(l) ? null : { ...l, firma: a.firma }));
    case 'reabrir':
      return editar(estado, a.id, (l) => (l.firma ? { ...l, firma: null } : null));
    case 'recargar':
      return a.libretas;
  }
}

function cargarInicial(): Libreta[] {
  return sanearLibretas(leerJSON(CLAVE_LIBRETAS));
}

interface Valor {
  libretas: Libreta[];
  dispatch: (a: AccionLibretas) => void;
  errorGuardado: boolean;
}

const Ctx = createContext<Valor | null>(null);

export function LibretasProvider({ children }: { children: ReactNode }) {
  const [libretas, dispatchBase] = useReducer(reducerLibretas, undefined, cargarInicial);
  const [errorGuardado, setErrorGuardado] = useState(false);

  // Autoguardado en el dispositivo después de cada cambio.
  const ultimoError = useRef(false);
  useEffect(() => {
    const error = !guardarJSON(CLAVE_LIBRETAS, libretas);
    // Solo se actualiza el estado si cambió (evita renders extra en cada guardado).
    if (error !== ultimoError.current) {
      ultimoError.current = error;
      setErrorGuardado(error);
    }
  }, [libretas]);

  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === CLAVE_LIBRETAS) dispatchBase({ tipo: 'recargar', libretas: cargarInicial() });
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const dispatch = useCallback((a: AccionLibretas) => dispatchBase(a), []);
  return <Ctx.Provider value={{ libretas, dispatch, errorGuardado }}>{children}</Ctx.Provider>;
}

export function useLibretas(): Valor {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibretas debe usarse dentro de LibretasProvider');
  return v;
}
