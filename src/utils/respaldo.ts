// Archivos .json de la app: respaldo de una libreta y archivo de configuración.
import type { Configuracion, Libreta } from '../types';
import { VERSION_ESQUEMA } from '../config';
import { sanearConfiguracion, sanearLibreta } from './validacion';
import { hoyISO } from './fechas';

export const TIPO_RESPALDO = 'libreta-pocus/respaldo-libreta';
export const TIPO_CONFIGURACION = 'libreta-pocus/configuracion';

const MAX_BYTES = 20 * 1024 * 1024;

/** Nombre de archivo sin tildes ni símbolos. */
export function aNombreArchivo(...partes: (string | number)[]): string {
  return partes
    .map((p) =>
      String(p)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('_');
}

function parsear(texto: string): Record<string, unknown> {
  if (texto.length > MAX_BYTES) throw new Error('El archivo es demasiado grande.');
  let datos: unknown;
  try {
    datos = JSON.parse(texto.replace(/^﻿/, ''));
  } catch {
    throw new Error('El archivo no es un .json válido o está dañado.');
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) throw new Error('El archivo no tiene el formato esperado.');
  return datos as Record<string, unknown>;
}

// ── Respaldo de libreta ───────────────────────────────────────────────────

export function respaldoDeLibreta(lib: Libreta): string {
  return JSON.stringify({ tipo: TIPO_RESPALDO, version: VERSION_ESQUEMA, exportado: new Date().toISOString(), libreta: lib }, null, 2);
}

export function nombreArchivoRespaldo(lib: Libreta): string {
  return `libreta_${aNombreArchivo(lib.cursoNombre, lib.alumno.apellido, lib.alumno.nombre, hoyISO())}.json`;
}

export function libretaDesdeRespaldo(texto: string): Libreta {
  const datos = parsear(texto);
  if (datos.tipo === TIPO_CONFIGURACION) {
    throw new Error('Este es un archivo de configuración, no el respaldo de una libreta. Importalo desde Ajustes → Archivo de configuración.');
  }
  const lib = sanearLibreta(datos.tipo === TIPO_RESPALDO ? datos.libreta : datos);
  if (!lib) throw new Error('El archivo no contiene una libreta válida.');
  return lib;
}

// ── Archivo de configuración ──────────────────────────────────────────────

export function archivoDeConfiguracion(config: Configuracion): string {
  const { membrete, textos, cursos, instructores } = config;
  return JSON.stringify(
    {
      tipo: TIPO_CONFIGURACION,
      version: VERSION_ESQUEMA,
      exportado: new Date().toISOString(),
      configuracion: { membrete, textos, cursos, instructores },
    },
    null,
    2,
  );
}

export function nombreArchivoConfiguracion(config: Configuracion): string {
  return `configuracion_${aNombreArchivo(config.membrete.institucion || 'libreta-pocus', hoyISO())}.json`;
}

/** Lo que no venga en el archivo se conserva de la configuración actual. */
export function configuracionDesdeArchivo(texto: string, actual: Configuracion): Configuracion {
  const datos = parsear(texto);
  if (datos.tipo === TIPO_RESPALDO) {
    throw new Error('Este es el respaldo de una libreta, no un archivo de configuración. Importalo desde la pantalla de inicio.');
  }
  const config = sanearConfiguracion(datos.tipo === TIPO_CONFIGURACION ? datos.configuracion : datos, actual);
  if (!config) throw new Error('El archivo no contiene una configuración válida.');
  return config;
}
