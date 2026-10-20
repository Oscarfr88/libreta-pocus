import type { CatalogoSimple, Configuracion } from '../types';
import { COLOR_PRIMARIO_POR_DEFECTO, VERSION_ESQUEMA } from '../config';
import { catalogoDesdeSimple } from '../utils/catalogo';
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
 * Solo POCUS II trae catálogo; POCUS I y III se completan importando su catálogo.
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
      { id: 'pocus-i', nombre: 'POCUS I', bloques: [] },
      { id: 'pocus-ii', nombre: 'POCUS II', bloques: catalogoDesdeSimple(catalogoPocusII as CatalogoSimple) },
      { id: 'pocus-iii', nombre: 'POCUS III', bloques: [] },
    ],
    instructores: [],
  };
}

/** Texto de validación final con el curso de la libreta. */
export function textoValidacion(plantilla: string, curso: string): string {
  return plantilla.split('{curso}').join(curso);
}
