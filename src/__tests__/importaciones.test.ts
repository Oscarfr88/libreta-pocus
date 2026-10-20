import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { decodificarTexto, filasDesdeArchivo } from '../utils/excel';
import { instructoresDesdeFilas } from '../utils/importarInstructores';
import { catalogoDesdeFilas, catalogoDesdeJSON, filasDeCatalogo } from '../utils/importarCatalogo';
import { configuracionInicial } from '../data/configuracionInicial';

function xlsx(filas: (string | number)[][]): ArrayBuffer {
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), 'Hoja1');
  return XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}
const utf8 = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;
/** Codificación Windows-1252 (Latin-1 alcanza para los caracteres de prueba). */
const latin1 = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;

describe('lectura de planillas', () => {
  it('CSV con punto y coma en Windows-1252 (Excel en español)', async () => {
    const buf = latin1('Nombre;Apellido\r\nMaría José;Núñez\r\n');
    expect(decodificarTexto(buf)).toContain('María José');
    expect(await filasDesdeArchivo('a.csv', buf)).toEqual([['Nombre', 'Apellido'], ['María José', 'Núñez']]);
  });

  it('CSV UTF-8 con BOM y comas', async () => {
    const filas = await filasDesdeArchivo('a.csv', utf8('﻿Bloque,Competencia\nÓRBITA,"Medición, ñandú"\n'));
    expect(filas).toEqual([['Bloque', 'Competencia'], ['ÓRBITA', 'Medición, ñandú']]);
  });

  it('xlsx: saltea filas vacías y recorta espacios', async () => {
    const filas = await filasDesdeArchivo('a.xlsx', xlsx([['  Nombre y apellido '], [''], ['  Ana   Pérez '], [42]]));
    expect(filas).toEqual([['Nombre y apellido'], ['Ana Pérez'], ['42']]);
  });
});

describe('importación de instructores', () => {
  it('una columna "Nombre y apellido" con encabezado', () => {
    const r = instructoresDesdeFilas([['Nombre y apellido'], ['Zoe Álvarez'], ['ana  pérez'], ['Ana Pérez'], ['Bruno Díaz']]);
    expect(r).toMatchObject({ formato: 'una-columna', conEncabezado: true, filasLeidas: 4, descartadas: 1 });
    expect(r.nombres).toEqual(['ana pérez', 'Bruno Díaz', 'Zoe Álvarez']);
  });

  it('dos columnas "Nombre" y "Apellido" con encabezado, en cualquier orden', () => {
    const r = instructoresDesdeFilas([['Apellido', 'Nombre'], ['Pérez', 'Ana'], ['Ñandú', 'Íñigo']]);
    expect(r.formato).toBe('dos-columnas');
    expect(r.nombres).toEqual(['Ana Pérez', 'Íñigo Ñandú']);
  });

  it('sin encabezado: una columna', () => {
    const r = instructoresDesdeFilas([['Carla Gómez'], ['Ana Pérez']]);
    expect(r).toMatchObject({ formato: 'una-columna', conEncabezado: false, filasLeidas: 2 });
    expect(r.nombres).toEqual(['Ana Pérez', 'Carla Gómez']);
  });

  it('sin encabezado: dos columnas', () => {
    const r = instructoresDesdeFilas([['Carla', 'Gómez'], ['Ana', 'Pérez'], ['Ana', 'Pérez']]);
    expect(r).toMatchObject({ formato: 'dos-columnas', conEncabezado: false, descartadas: 1 });
    expect(r.nombres).toEqual(['Ana Pérez', 'Carla Gómez']);
  });

  it('planilla vacía → error', () => {
    expect(() => instructoresDesdeFilas([])).toThrow();
  });
});

describe('importación de catálogos', () => {
  it('agrupa por bloque en orden y arrastra el bloque de celdas vacías', () => {
    const r = catalogoDesdeFilas([
      ['Bloque', 'Competencia'],
      ['BÁSICO', 'Uno'],
      ['', 'Dos'],
      ['AVANZADO', 'Tres'],
      ['básico', 'Cuatro'],
      ['AVANZADO', 'Tres'],
    ]);
    expect(r.bloques.map((b) => [b.nombre, b.competencias.map((c) => c.nombre)])).toEqual([
      ['BÁSICO', ['Uno', 'Dos', 'Cuatro']],
      ['AVANZADO', ['Tres']],
    ]);
    expect(r.competencias).toBe(4);
    expect(r.avisos).toHaveLength(1);
  });

  it('exige los títulos "Bloque" y "Competencia"', () => {
    expect(() => catalogoDesdeFilas([['Área', 'Ítem'], ['A', 'B']])).toThrow(/Bloque/);
  });

  it('exportar → importar el catálogo de POCUS II no pierde nada', async () => {
    const original = configuracionInicial().cursos[1].bloques;
    const filas = await filasDesdeArchivo('c.xlsx', xlsx(filasDeCatalogo(original)));
    expect(catalogoDesdeFilas(filas).bloques).toEqual(original);
  });

  it('desde .json simple o desde un archivo de configuración', () => {
    const simple = { bloques: [{ nombre: 'A', competencias: ['x', 'y'] }] };
    expect(catalogoDesdeJSON(simple, 'POCUS I').competencias).toBe(2);
    const cfg = { configuracion: { cursos: [{ nombre: 'pocus i', bloques: [{ nombre: 'B', competencias: [{ id: 'q', nombre: 'z' }] }] }] } };
    expect(catalogoDesdeJSON(cfg, 'POCUS I').bloques[0].competencias[0].nombre).toBe('z');
    expect(() => catalogoDesdeJSON(cfg, 'POCUS III')).toThrow();
  });
});
