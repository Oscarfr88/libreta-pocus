import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type { Bloque, Configuracion, Membrete, Textos } from '../types';
import { CLAVE_CONFIG } from '../config';
import { completarCursosPredefinidos, configuracionInicial } from '../data/configuracionInicial';
import { guardarJSON, leerJSON } from '../utils/almacenamiento';
import { aplicarColorPrimario } from '../utils/color';
import { depurarInstructores } from '../utils/instructores';
import { nuevoId } from '../utils/ids';
import { normalizarTexto } from '../utils/texto';
import { sanearConfiguracion } from '../utils/validacion';

export type AccionConfig =
  | { tipo: 'reemplazar'; config: Configuracion }
  | { tipo: 'membrete'; cambios: Partial<Membrete> }
  | { tipo: 'textos'; cambios: Partial<Textos> }
  | { tipo: 'agregarCurso'; nombre: string; id?: string }
  | { tipo: 'renombrarCurso'; id: string; nombre: string }
  | { tipo: 'eliminarCurso'; id: string }
  | { tipo: 'catalogoCurso'; id: string; bloques: Bloque[] }
  | { tipo: 'instructores'; lista: string[] };

function reducer(estado: Configuracion, a: AccionConfig): Configuracion {
  switch (a.tipo) {
    case 'reemplazar':
      return completarCursosPredefinidos(a.config);
    case 'membrete':
      return { ...estado, membrete: { ...estado.membrete, ...a.cambios } };
    case 'textos':
      return { ...estado, textos: { ...estado.textos, ...a.cambios } };
    case 'agregarCurso': {
      const nombre = normalizarTexto(a.nombre);
      if (!nombre) return estado;
      return { ...estado, cursos: [...estado.cursos, { id: a.id ?? nuevoId('curso'), nombre, bloques: [] }] };
    }
    case 'renombrarCurso': {
      const nombre = normalizarTexto(a.nombre);
      if (!nombre) return estado;
      return { ...estado, cursos: estado.cursos.map((c) => (c.id === a.id ? { ...c, nombre } : c)) };
    }
    case 'eliminarCurso':
      return { ...estado, cursos: estado.cursos.filter((c) => c.id !== a.id) };
    case 'catalogoCurso':
      return { ...estado, cursos: estado.cursos.map((c) => (c.id === a.id ? { ...c, bloques: a.bloques } : c)) };
    case 'instructores':
      return { ...estado, instructores: depurarInstructores(a.lista) };
  }
}

function cargarInicial(): Configuracion {
  const base = configuracionInicial();
  return completarCursosPredefinidos(sanearConfiguracion(leerJSON(CLAVE_CONFIG), base) ?? base);
}

interface Valor {
  config: Configuracion;
  dispatch: (a: AccionConfig) => void;
  /** true si el último guardado en el dispositivo falló. */
  errorGuardado: boolean;
}

const Ctx = createContext<Valor | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatchBase] = useReducer(reducer, undefined, cargarInicial);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const ultimoError = useRef(false);
  useEffect(() => {
    const error = !guardarJSON(CLAVE_CONFIG, config);
    // Solo se actualiza el estado si cambió (evita renders extra en cada guardado).
    if (error !== ultimoError.current) {
      ultimoError.current = error;
      setErrorGuardado(error);
    }
  }, [config]);

  useEffect(() => {
    aplicarColorPrimario(config.membrete.colorPrimario);
  }, [config.membrete.colorPrimario]);

  // Si la app está abierta en otra pestaña y cambia la configuración, se sincroniza.
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key !== CLAVE_CONFIG) return;
      const nueva = sanearConfiguracion(leerJSON(CLAVE_CONFIG), configuracionInicial());
      if (nueva) dispatchBase({ tipo: 'reemplazar', config: nueva });
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const dispatch = useCallback((a: AccionConfig) => dispatchBase(a), []);
  return <Ctx.Provider value={{ config, dispatch, errorGuardado }}>{children}</Ctx.Provider>;
}

export function useConfig(): Valor {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConfig debe usarse dentro de ConfigProvider');
  return v;
}
