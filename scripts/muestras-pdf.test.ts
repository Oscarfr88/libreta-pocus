// Genera PDFs de muestra para revisarlos a ojo. Solo corre si se indica la carpeta de salida:
//   PDF_SALIDA=/ruta/carpeta npx vitest run scripts/muestras-pdf.test.ts
import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Configuracion, Libreta } from '../src/types';
import { configuracionInicial } from '../src/data/configuracionInicial';
import { crearLibreta } from '../src/utils/nuevaLibreta';
import { generarPDF } from '../src/utils/pdf/generarPDF';

const salida = process.env.PDF_SALIDA;

async function pngDataUrl(svg: string, formato: 'png' | 'jpeg' = 'png') {
  const sharp = (await import('sharp')).default;
  const buf = await (formato === 'png' ? sharp(Buffer.from(svg)).png() : sharp(Buffer.from(svg)).flatten({ background: '#fff' }).jpeg()).toBuffer();
  return `data:image/${formato};base64,${buf.toString('base64')}`;
}

const LOGO_SVG = `<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="150" fill="#7c2d12"/>
  <path d="M120 230 Q200 90 280 230" stroke="#fff" stroke-width="28" fill="none" stroke-linecap="round"/>
  <text x="400" y="185" font-family="Helvetica" font-size="110" font-weight="bold" fill="#7c2d12">LOGO</text>
  <text x="400" y="300" font-family="Helvetica" font-size="70" fill="#444">de prueba</text></svg>`;
const LOGO_ALTO_SVG = `<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="260" height="360" rx="40" fill="#1d4ed8"/><text x="150" y="230" text-anchor="middle" font-family="Helvetica" font-size="90" fill="#fff">ÑU</text></svg>`;
const FIRMA_SVG = `<svg width="900" height="300" xmlns="http://www.w3.org/2000/svg">
  <path d="M90 190 C 150 40, 220 60, 250 230 S 330 120, 380 170 S 470 90, 520 180 S 640 100, 800 200" stroke="#0f172a" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;

function completar(lib: Libreta, hasta = Infinity) {
  let k = 0;
  for (const b of lib.catalogo)
    for (const c of b.competencias)
      lib.practicas[c.id] = lib.practicas[c.id].map((_, i) => (k++ < hasta ? `2026-0${7 + i}-${String(1 + (k % 27)).padStart(2, '0')}` : null));
}

describe.skipIf(!salida)('muestras de PDF', () => {
  it('genera variantes', async () => {
    mkdirSync(salida!, { recursive: true });
    const logo = await pngDataUrl(LOGO_SVG);
    const logoAltoJpg = await pngDataUrl(LOGO_ALTO_SVG, 'jpeg');
    const firma = await pngDataUrl(FIRMA_SVG);
    const base = configuracionInicial();
    const pocusII = base.cursos[1];
    const pocusI = { id: 'pocus-i', nombre: 'POCUS I', bloques: [
      { id: 'b01', nombre: 'PRINCIPIOS FÍSICOS', competencias: [{ id: 'b01-c01', nombre: 'Física del ultrasonido' }, { id: 'b01-c02', nombre: 'Artefactos más frecuentes' }] },
      { id: 'b02', nombre: 'NIÑEZ Y ACCESOS', competencias: [{ id: 'b02-c01', nombre: 'Canalización periférica ecoguiada – técnica “eje corto”…' }] },
    ] };
    const alumno = { nombre: 'Lucía Ñandú', apellido: 'Fernández Ibáñez', anio: 2026 };

    const variantes: { nombre: string; config: Pick<Configuracion, 'membrete' | 'textos'>; libreta: Libreta }[] = [];

    const firmada = crearLibreta(pocusII, alumno);
    completar(firmada);
    firmada.practicas['b01-c01'] = ['2026-10-01', '2026-09-20', '2026-10-10'];
    firmada.firma = { instructor: 'Íñigo Muñoz', imagen: firma, fecha: '2026-10-19T15:00:00.000Z' };
    variantes.push({
      nombre: '1-pocus-ii-validada-logo-marron',
      libreta: firmada,
      config: { textos: base.textos, membrete: { logo, institucion: 'Institución de Prueba Ñandú', subtitulo: 'Programa de formación en ultrasonografía clínica', colorPrimario: '#7c2d12', pie: 'Sede de prueba · Buenos Aires' } },
    });

    const enCurso = crearLibreta(pocusII, alumno);
    completar(enCurso, 100);
    variantes.push({ nombre: '2-pocus-ii-en-curso-sin-logo', libreta: enCurso, config: { textos: base.textos, membrete: { ...base.membrete } } });

    const completa = crearLibreta(pocusII, { nombre: 'Martín', apellido: 'Sáenz', anio: 2025 });
    completar(completa);
    variantes.push({
      nombre: '3-pocus-ii-completa-sin-firma-amarillo-jpg',
      libreta: completa,
      config: { textos: { ...base.textos, instrucciones: base.textos.instrucciones + '\nSegundo párrafo: ¿se respetan los saltos de línea? ¡Sí!' }, membrete: { logo: logoAltoJpg, institucion: 'Academia con un nombre institucional bastante largo para probar el ajuste de línea del membrete', subtitulo: '', colorPrimario: '#facc15', pie: '' } },
    });

    const corta = crearLibreta(pocusI, { nombre: 'Łukasz', apellido: 'Øvergaard', anio: 2026 });
    completar(corta, 4);
    variantes.push({ nombre: '4-pocus-i-en-curso-azul', libreta: corta, config: { textos: { ...base.textos, validacionFinal: 'Aprobó {curso} con éxito.' }, membrete: { logo, institucion: 'Otra institución', subtitulo: 'Subtítulo', colorPrimario: '#1d4ed8', pie: 'Pie con símbolos: º ª € – — “ ” …' } } });

    for (const v of variantes) {
      const doc = generarPDF({ libreta: v.libreta, config: v.config });
      writeFileSync(`${salida}/${v.nombre}.pdf`, Buffer.from(doc.output('arraybuffer')));
    }
  });
});
