// Saneamiento de datos que vienen del almacenamiento del dispositivo o de archivos importados.
// Nunca se confía en la forma del JSON: lo inválido se descarta o se completa con valores por defecto.
import type { Bloque, Configuracion, Curso, Firma, Libreta, Membrete, Textos } from '../types';
import { PRACTICAS_REQUERIDAS, VERSION_ESQUEMA } from '../config';
import { esHexValido } from './color';
import { esFechaISOValida } from './fechas';
import { depurarInstructores } from './instructores';
import { nuevoId } from './ids';
import { normalizarTexto } from './texto';

type Obj = Record<string, unknown>;
const esObjeto = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const dos = (n: number) => String(n).padStart(2, '0');

/** Texto multilínea: conserva saltos de línea, recorta extremos. */
function textoLargo(x: unknown, porDefecto: string): string {
  return typeof x === 'string' ? x.normalize('NFC').replace(/\r\n?/g, '\n').trim() : porDefecto;
}

function esImagenDataUrl(x: unknown, tipos: string[]): x is string {
  return typeof x === 'string' && tipos.some((t) => x.startsWith(`data:${t};base64,`));
}

/**
 * Bloques de un catálogo. Acepta competencias como texto o como {id, nombre}.
 * Conserva los ids si son válidos y únicos (las fechas de una libreta dependen de ellos);
 * si no, los regenera por posición.
 */
export function sanearBloques(x: unknown): Bloque[] {
  if (!Array.isArray(x)) return [];
  const bloques = x
    .filter(esObjeto)
    .map((b) => ({
      id: typeof b.id === 'string' ? b.id : '',
      nombre: normalizarTexto(b.nombre),
      competencias: (Array.isArray(b.competencias) ? b.competencias : [])
        .map((c) =>
          esObjeto(c)
            ? { id: typeof c.id === 'string' ? c.id : '', nombre: normalizarTexto(c.nombre) }
            : { id: '', nombre: normalizarTexto(c) },
        )
        .filter((c) => c.nombre),
    }))
    .filter((b) => b.nombre && b.competencias.length > 0);

  const ids = bloques.flatMap((b) => [b.id, ...b.competencias.map((c) => c.id)]);
  const idsValidos = ids.every(Boolean) && new Set(ids).size === ids.length;
  if (idsValidos) return bloques;
  return bloques.map((b, i) => {
    const idBloque = `b${dos(i + 1)}`;
    return {
      id: idBloque,
      nombre: b.nombre,
      competencias: b.competencias.map((c, j) => ({ id: `${idBloque}-c${dos(j + 1)}`, nombre: c.nombre })),
    };
  });
}

export function sanearCursos(x: unknown): Curso[] {
  if (!Array.isArray(x)) return [];
  const vistos = new Set<string>();
  const cursos: Curso[] = [];
  for (const c of x) {
    if (!esObjeto(c)) continue;
    const nombre = normalizarTexto(c.nombre);
    if (!nombre) continue;
    let id = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : nuevoId('curso');
    if (vistos.has(id)) id = nuevoId('curso');
    vistos.add(id);
    cursos.push({ id, nombre, bloques: sanearBloques(c.bloques) });
  }
  return cursos;
}

function sanearMembrete(x: unknown, base: Membrete): Membrete {
  if (!esObjeto(x)) return base;
  return {
    logo: x.logo === null ? null : esImagenDataUrl(x.logo, ['image/png', 'image/jpeg']) ? x.logo : base.logo,
    institucion: typeof x.institucion === 'string' ? normalizarTexto(x.institucion) : base.institucion,
    subtitulo: typeof x.subtitulo === 'string' ? normalizarTexto(x.subtitulo) : base.subtitulo,
    colorPrimario: esHexValido(x.colorPrimario) ? x.colorPrimario.toLowerCase() : base.colorPrimario,
    pie: typeof x.pie === 'string' ? normalizarTexto(x.pie) : base.pie,
  };
}

function sanearTextos(x: unknown, base: Textos): Textos {
  if (!esObjeto(x)) return base;
  return {
    instrucciones: textoLargo(x.instrucciones, base.instrucciones),
    validacionFinal: textoLargo(x.validacionFinal, base.validacionFinal),
  };
}

/**
 * Configuración completa. Lo que falte se toma de `base`.
 * Devuelve null si el contenido no parece una configuración de esta app.
 */
export function sanearConfiguracion(x: unknown, base: Configuracion): Configuracion | null {
  if (!esObjeto(x)) return null;
  const tieneAlgo = ['membrete', 'textos', 'cursos', 'instructores'].some((k) => k in x);
  if (!tieneAlgo) return null;
  return {
    version: VERSION_ESQUEMA,
    membrete: sanearMembrete(x.membrete, base.membrete),
    textos: sanearTextos(x.textos, base.textos),
    cursos: 'cursos' in x ? sanearCursos(x.cursos) : base.cursos,
    instructores: Array.isArray(x.instructores) ? depurarInstructores(x.instructores) : base.instructores,
  };
}

function sanearFirma(x: unknown): Firma | null {
  if (!esObjeto(x)) return null;
  const instructor = normalizarTexto(x.instructor);
  const fecha = typeof x.fecha === 'string' && !Number.isNaN(Date.parse(x.fecha)) ? x.fecha : '';
  if (!instructor || !fecha || !esImagenDataUrl(x.imagen, ['image/png'])) return null;
  return { instructor, imagen: x.imagen, fecha };
}

/** Una libreta. Devuelve null si le faltan datos esenciales. */
export function sanearLibreta(x: unknown): Libreta | null {
  if (!esObjeto(x) || !esObjeto(x.alumno)) return null;
  const catalogo = sanearBloques(x.catalogo);
  const cursoNombre = normalizarTexto(x.cursoNombre);
  const nombre = normalizarTexto(x.alumno.nombre);
  const apellido = normalizarTexto(x.alumno.apellido);
  if (!catalogo.length || !cursoNombre || !nombre || !apellido) return null;

  const requeridas =
    typeof x.practicasRequeridas === 'number' && Number.isInteger(x.practicasRequeridas) && x.practicasRequeridas > 0
      ? x.practicasRequeridas
      : PRACTICAS_REQUERIDAS;
  const anio = Number(x.alumno.anio);
  const practicasCrudas = esObjeto(x.practicas) ? x.practicas : {};
  const practicas: Libreta['practicas'] = {};
  for (const b of catalogo) {
    for (const c of b.competencias) {
      const f = practicasCrudas[c.id];
      const lista = Array.isArray(f) ? f : [];
      practicas[c.id] = Array.from({ length: requeridas }, (_, i) => (esFechaISOValida(lista[i]) ? lista[i] : null));
    }
  }
  const ahora = new Date().toISOString();
  return {
    id: typeof x.id === 'string' && x.id ? x.id : nuevoId('lib'),
    cursoId: typeof x.cursoId === 'string' && x.cursoId ? x.cursoId : 'sin-curso',
    cursoNombre,
    catalogo,
    practicasRequeridas: requeridas,
    alumno: { nombre, apellido, anio: Number.isInteger(anio) && anio > 1900 ? anio : new Date().getFullYear() },
    practicas,
    firma: sanearFirma(x.firma),
    creada: typeof x.creada === 'string' ? x.creada : ahora,
    actualizada: typeof x.actualizada === 'string' ? x.actualizada : ahora,
  };
}

export function sanearLibretas(x: unknown): Libreta[] {
  if (!Array.isArray(x)) return [];
  const vistos = new Set<string>();
  const salida: Libreta[] = [];
  for (const item of x) {
    const lib = sanearLibreta(item);
    if (!lib || vistos.has(lib.id)) continue;
    vistos.add(lib.id);
    salida.push(lib);
  }
  return salida;
}
