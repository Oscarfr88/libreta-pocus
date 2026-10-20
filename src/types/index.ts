/** Fecha de calendario en formato ISO 'aaaa-mm-dd' (sin hora ni zona horaria). */
export type FechaISO = string;

// ── Catálogo de competencias ──────────────────────────────────────────────

export interface Competencia {
  id: string;
  nombre: string;
}

export interface Bloque {
  id: string;
  nombre: string;
  competencias: Competencia[];
}

export interface Curso {
  id: string;
  nombre: string;
  /** Vacío = curso sin catálogo cargado (no permite crear libretas). */
  bloques: Bloque[];
}

/** Formato simple y editable a mano de un catálogo (archivo de datos / importación .json). */
export interface CatalogoSimple {
  bloques: { nombre: string; competencias: string[] }[];
}

// ── Configuración de la institución ───────────────────────────────────────

export interface Membrete {
  /** Logo como data URL (PNG o JPG), o null si no se cargó. */
  logo: string | null;
  institucion: string;
  subtitulo: string;
  /** Color principal en hex '#rrggbb'. */
  colorPrimario: string;
  pie: string;
}

export interface Textos {
  instrucciones: string;
  /** Admite el marcador {curso}, que se reemplaza por el curso de la libreta. */
  validacionFinal: string;
}

export interface Configuracion {
  version: number;
  membrete: Membrete;
  textos: Textos;
  cursos: Curso[];
  /** "Nombre Apellido", sin duplicados y en orden alfabético. */
  instructores: string[];
}

// ── Libreta del alumno ────────────────────────────────────────────────────

export interface Alumno {
  nombre: string;
  apellido: string;
  anio: number;
}

export interface Firma {
  instructor: string;
  /** Firma dibujada, como data URL PNG. */
  imagen: string;
  /** Fecha y hora de validación (ISO completa). */
  fecha: string;
}

export interface Libreta {
  id: string;
  cursoId: string;
  /** Copia del nombre del curso al crear la libreta. */
  cursoNombre: string;
  /** Copia del catálogo al crear la libreta: los cambios posteriores del curso no la afectan. */
  catalogo: Bloque[];
  practicasRequeridas: number;
  alumno: Alumno;
  /** Por competencia, una fecha (o null) por cada práctica requerida. */
  practicas: Record<string, (FechaISO | null)[]>;
  firma: Firma | null;
  creada: string;
  actualizada: string;
}

export type EstadoLibreta = 'en-curso' | 'lista' | 'validada';
