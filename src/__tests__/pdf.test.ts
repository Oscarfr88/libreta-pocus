import { describe, expect, it } from 'vitest';
import { configuracionInicial } from '../data/configuracionInicial';
import { crearLibreta } from '../utils/nuevaLibreta';
import { generarPDF, nombreArchivoPDF } from '../utils/pdf/generarPDF';
import { textoPDF } from '../utils/pdf/textoPDF';

// PNG 1×1 transparente
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('texto para el PDF', () => {
  it('conserva el español y reemplaza lo que Helvetica no puede mostrar', () => {
    expect(textoPDF('Ñandú ¿Qué? ¡Sí! º ª € – … E/e´')).toBe('Ñandú ¿Qué? ¡Sí! º ª € – … E/e´');
    expect(textoPDF('Łukasz Đorđe ő')).toBe('Lukasz Dorde o');
    expect(textoPDF('é')).toBe('é');
    expect(textoPDF('漢')).toBe('?');
  });
});

describe('generación del PDF', () => {
  const cfg = configuracionInicial();
  const alumno = { nombre: 'Lucía', apellido: 'Núñez', anio: 2026 };

  it('libreta en curso: genera páginas de bloques + validación, sin logo', () => {
    const lib = crearLibreta(cfg.cursos[1], alumno);
    const doc = generarPDF({ libreta: lib, config: cfg });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
    expect(new TextDecoder().decode(doc.output('arraybuffer').slice(0, 5))).toBe('%PDF-');
    expect(nombreArchivoPDF(lib)).toBe('libreta_POCUS-II_Nunez_Lucia_EN-CURSO.pdf');
  });

  it('libreta validada con logo y firma', () => {
    const lib = crearLibreta(cfg.cursos[1], alumno);
    for (const k of Object.keys(lib.practicas)) lib.practicas[k] = ['2026-01-01', '2026-02-01', '2026-03-01'];
    lib.firma = { instructor: 'Ana Pérez', imagen: PNG, fecha: '2026-10-19T12:00:00Z' };
    const doc = generarPDF({ libreta: lib, config: { ...cfg, membrete: { ...cfg.membrete, logo: PNG, colorPrimario: '#ffeb3b' } } });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
    expect(nombreArchivoPDF(lib)).toBe('libreta_POCUS-II_Nunez_Lucia.pdf');
  });
});
