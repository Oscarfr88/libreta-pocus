import type { CatalogoSimple, Configuracion } from '../types';
import { COLOR_PRIMARIO_POR_DEFECTO, VERSION_ESQUEMA } from '../config';
import { catalogoDesdeSimple } from '../utils/catalogo';
import catalogoPocusI from './catalogo-pocus-i.json';
import catalogoPocusII from './catalogo-pocus-ii.json';

export const TEXTO_INSTRUCCIONES_POR_DEFECTO =
  'Esta libreta registra la adquisición progresiva de competencias prácticas en ultrasonografía clínica (POCUS). ' +
  'Cada competencia debe realizarse al menos 3 veces bajo supervisión docente. ' +
  'Una vez completadas el instructor registrará la fecha y validará la competencia mediante firma.';

/** {curso} se reemplaza por el curso de cada libreta. */
export const TEXTO_VALIDACION_POR_DEFECTO =
  'Ha completado satisfactoriamente las competencias prácticas del curso {curso}.';

/**
 * Configuración con la que arranca la app en un dispositivo nuevo.
 * POCUS I y POCUS II traen su catálogo; POCUS III se completa importando el suyo.
 * Sin logo: lo carga cada institución desde Ajustes.
 */
export function configuracionInicial(): Configuracion {
  return {
    version: VERSION_ESQUEMA,
    membrete: {
      logo: null,
      institucion: '',
      subtitulo: '',
      colorPrimario: COLOR_PRIMARIO_POR_DEFECTO,
      pie: '',
    },
    textos: {
      instrucciones: TEXTO_INSTRUCCIONES_POR_DEFECTO,
      validacionFinal: TEXTO_VALIDACION_POR_DEFECTO,
    },
    cursos: [
      { id: 'pocus-i', nombre: 'POCUS I', bloques: catalogoDesdeSimple(catalogoPocusI as CatalogoSimple) },
      { id: 'pocus-ii', nombre: 'POCUS II', bloques: catalogoDesdeSimple(catalogoPocusII as CatalogoSimple) },
      { id: 'pocus-iii', nombre: 'POCUS III', bloques: [] },
    ],
    instructores: [],
  };
}

/**
 * Completa los cursos predefinidos (mismo id) que estén guardados sin competencias con el catálogo
 * que hoy trae la app: así, un dispositivo que abrió la app antes de que se cargara un catálogo lo recibe.
 * Nunca pisa un catálogo existente ni vuelve a agregar un curso que se eliminó.
 */
export function completarCursosPredefinidos(config: Configuracion): Configuracion {
  const predefinidos = new Map(configuracionInicial().cursos.map((c) => [c.id, c]));
  let cambio = false;
  const cursos = config.cursos.map((c) => {
    const base = predefinidos.get(c.id);
    if (c.bloques.length || !base?.bloques.length) return c;
    cambio = true;
    return { ...c, bloques: base.bloques };
  });
  return cambio ? { ...config, cursos } : config;
}

/** Texto de validación final con el curso de la libreta. */
export function textoValidacion(plantilla: string, curso: string): string {
  return plantilla.split('{curso}').join(curso);
}
