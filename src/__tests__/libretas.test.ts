import { describe, expect, it } from 'vitest';
import type { Libreta } from '../types';
import { configuracionInicial } from '../data/configuracionInicial';
import { reducerLibretas } from '../context/LibretasContext';
import { crearLibreta } from '../utils/nuevaLibreta';
import { estadoLibreta, practicasFueraDeOrden, progresoLibreta } from '../utils/progreso';
import { esFechaISOValida, formatearFecha, hoyISO } from '../utils/fechas';
import { sanearLibreta, sanearLibretas } from '../utils/validacion';

const FIRMA = { instructor: 'Ana Pérez', imagen: 'data:image/png;base64,AAAA', fecha: '2026-10-19T12:00:00.000Z' };

function libretaNueva(): Libreta {
  const curso = configuracionInicial().cursos.find((c) => c.id === 'pocus-ii')!;
  return crearLibreta(curso, { nombre: 'Juan', apellido: 'Gómez', anio: 2026 });
}

function completar(lib: Libreta): Libreta[] {
  let estado = [lib];
  for (const b of lib.catalogo)
    for (const c of b.competencias)
      for (let i = 0; i < lib.practicasRequeridas; i++)
        estado = reducerLibretas(estado, { tipo: 'fecha', id: lib.id, competenciaId: c.id, indice: i, fecha: `2026-0${i + 1}-10` });
  return estado;
}

describe('fechas', () => {
  it('formatea dd/mm/aaaa y valida fechas reales', () => {
    expect(formatearFecha('2026-03-07')).toBe('07/03/2026');
    expect(esFechaISOValida('2026-02-30')).toBe(false);
    expect(esFechaISOValida('2024-02-29')).toBe(true);
    expect(hoyISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('progreso', () => {
  it('libreta nueva: 0 % y 258 prácticas requeridas', () => {
    const p = progresoLibreta(libretaNueva());
    expect(p).toMatchObject({ porcentaje: 0, practicasTotales: 258, competenciasTotales: 86 });
  });

  it('detecta prácticas fuera de orden sin bloquear', () => {
    expect(practicasFueraDeOrden(['2026-05-10', '2026-05-01', null])).toEqual([1]);
    expect(practicasFueraDeOrden(['2026-05-10', null, '2026-05-01'])).toEqual([2]);
    expect(practicasFueraDeOrden(['2026-05-01', '2026-05-01', '2026-05-02'])).toEqual([]);
  });
});

describe('reglas de la libreta', () => {
  it('no acepta fechas futuras', () => {
    const lib = libretaNueva();
    const c = lib.catalogo[0].competencias[0].id;
    const [r] = reducerLibretas([lib], { tipo: 'fecha', id: lib.id, competenciaId: c, indice: 0, fecha: '2999-01-01' });
    expect(r.practicas[c][0]).toBeNull();
  });

  it('no se puede firmar una libreta incompleta', () => {
    const lib = libretaNueva();
    const [r] = reducerLibretas([lib], { tipo: 'firmar', id: lib.id, firma: FIRMA });
    expect(r.firma).toBeNull();
  });

  it('completa → se firma → queda bloqueada → reabrir elimina la firma', () => {
    const lib = libretaNueva();
    let estado = completar(lib);
    expect(progresoLibreta(estado[0]).porcentaje).toBe(100);
    expect(estadoLibreta(estado[0])).toBe('lista');

    estado = reducerLibretas(estado, { tipo: 'firmar', id: lib.id, firma: FIRMA });
    expect(estadoLibreta(estado[0])).toBe('validada');

    const c = lib.catalogo[0].competencias[0].id;
    const bloqueada = reducerLibretas(estado, { tipo: 'fecha', id: lib.id, competenciaId: c, indice: 0, fecha: null });
    expect(bloqueada[0].practicas[c][0]).toBe('2026-01-10');
    const sinCambioAlumno = reducerLibretas(estado, { tipo: 'alumno', id: lib.id, alumno: { nombre: 'X', apellido: 'Y', anio: 2025 } });
    expect(sinCambioAlumno[0].alumno.nombre).toBe('Juan');

    estado = reducerLibretas(estado, { tipo: 'reabrir', id: lib.id });
    expect(estado[0].firma).toBeNull();
    estado = reducerLibretas(estado, { tipo: 'fecha', id: lib.id, competenciaId: c, indice: 0, fecha: null });
    expect(estado[0].practicas[c][0]).toBeNull();
  });

  it('las libretas de distintos cursos se mantienen separadas', () => {
    const cfg = configuracionInicial();
    const otro = { id: 'pocus-i', nombre: 'POCUS I', bloques: [{ id: 'b01', nombre: 'A', competencias: [{ id: 'b01-c01', nombre: 'x' }] }] };
    const a = libretaNueva();
    const b = crearLibreta(otro, { nombre: 'Juan', apellido: 'Gómez', anio: 2026 });
    let estado = reducerLibretas([a], { tipo: 'crear', libreta: b });
    estado = reducerLibretas(estado, { tipo: 'fecha', id: b.id, competenciaId: 'b01-c01', indice: 0, fecha: '2026-01-01' });
    // Mismo id de competencia en ambos catálogos: la fecha solo va a la libreta indicada.
    expect(estado[0].practicas['b01-c01']).toEqual([null, null, null]);
    expect(estado[1].practicas['b01-c01']).toEqual(['2026-01-01', null, null]);
    expect(estado[0].cursoId).toBe('pocus-ii');
    expect(estado[1].cursoId).toBe('pocus-i');
    expect(cfg.cursos).toHaveLength(3);
  });
});

describe('saneamiento de datos guardados', () => {
  it('una libreta sobrevive JSON sin pérdidas', () => {
    const estado = completar(libretaNueva());
    const firmada = reducerLibretas(estado, { tipo: 'firmar', id: estado[0].id, firma: FIRMA })[0];
    expect(firmada.firma).toEqual(FIRMA);
    expect(sanearLibreta(JSON.parse(JSON.stringify(firmada)))).toEqual(firmada);
  });

  it('descarta datos inválidos', () => {
    expect(sanearLibretas([{ hola: 1 }, null, 'x'])).toEqual([]);
    const lib = libretaNueva();
    const c = lib.catalogo[0].competencias[0].id;
    const roto = { ...lib, practicas: { [c]: ['no-es-fecha', '2026-13-01', '2026-01-02'] } };
    expect(sanearLibreta(roto)!.practicas[c]).toEqual([null, null, '2026-01-02']);
  });
});
