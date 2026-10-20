import { describe, expect, it } from 'vitest';
import { configuracionInicial } from '../data/configuracionInicial';
import { crearLibreta } from '../utils/nuevaLibreta';
import {
  archivoDeConfiguracion,
  configuracionDesdeArchivo,
  libretaDesdeRespaldo,
  nombreArchivoRespaldo,
  respaldoDeLibreta,
} from '../utils/respaldo';

const LOGO = 'data:image/png;base64,iVBORw0KGgo=';

describe('respaldo de libreta', () => {
  it('exporta e importa sin pérdidas (incluida la firma)', () => {
    const cfg = configuracionInicial();
    const lib = crearLibreta(cfg.cursos[1], { nombre: 'Íñigo', apellido: 'Núñez', anio: 2026 });
    lib.practicas['b01-c01'] = ['2026-01-01', '2026-01-02', null];
    lib.firma = { instructor: 'Ana Pérez', imagen: LOGO, fecha: '2026-10-19T15:00:00.000Z' };
    expect(libretaDesdeRespaldo(respaldoDeLibreta(lib))).toEqual(lib);
    expect(nombreArchivoRespaldo(lib)).toMatch(/^libreta_POCUS-II_Nunez_Inigo_\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('rechaza archivos equivocados o dañados con mensajes claros', () => {
    const cfg = configuracionInicial();
    expect(() => libretaDesdeRespaldo(archivoDeConfiguracion(cfg))).toThrow(/configuración/);
    expect(() => libretaDesdeRespaldo('{no json')).toThrow(/dañado/);
    expect(() => libretaDesdeRespaldo('{"tipo":"libreta-pocus/respaldo-libreta","libreta":{}}')).toThrow();
  });
});

describe('archivo de configuración', () => {
  it('exporta e importa sin pérdidas', () => {
    const cfg = configuracionInicial();
    cfg.membrete = { logo: LOGO, institucion: 'ASARUC Sono Academy', subtitulo: 'Curso POCUS', colorPrimario: '#7c2d12', pie: 'Pie ñ' };
    cfg.textos.instrucciones = 'Línea 1\nLínea 2';
    cfg.instructores = ['Ana Pérez', 'Bruno Díaz'];
    cfg.cursos[0].bloques = [{ id: 'b01', nombre: 'A', competencias: [{ id: 'b01-c01', nombre: 'x' }] }];
    cfg.cursos.push({ id: 'curso-extra', nombre: 'Taller', bloques: [] });
    expect(configuracionDesdeArchivo(archivoDeConfiguracion(cfg), configuracionInicial())).toEqual(cfg);
  });

  it('un respaldo de libreta no se acepta como configuración', () => {
    const cfg = configuracionInicial();
    const lib = crearLibreta(cfg.cursos[1], { nombre: 'A', apellido: 'B', anio: 2026 });
    expect(() => configuracionDesdeArchivo(respaldoDeLibreta(lib), cfg)).toThrow(/respaldo/);
  });
});
