// PDF A4 de la libreta, generado en el dispositivo con jsPDF + jspdf-autotable.
// No usa el DOM: funciona igual en el navegador y en Node (pruebas).
import { GState, jsPDF } from 'jspdf';
import { autoTable, type CellHookData } from 'jspdf-autotable';
import type { Configuracion, Libreta } from '../../types';
import { textoValidacion } from '../../data/configuracionInicial';
import { formatearFecha, formatearFechaHora, hoyISO } from '../fechas';
import { estadoLibreta, fechasDe, progresoBloque, progresoLibreta } from '../progreso';
import { paletaPrimaria } from '../color';
import { aNombreArchivo } from '../respaldo';
import { textoPDF as t } from './textoPDF';

type RGB = [number, number, number];
type DocConTabla = jsPDF & { lastAutoTable?: { finalY?: number } };

// Medidas en mm (A4: 210 × 297)
const ANCHO = 210;
const ALTO = 297;
const M = 15; // margen lateral
const UTIL = ANCHO - 2 * M;
const TOPE_PAGINAS = 30; // contenido desde acá en páginas 2+
const PIE = 20; // reservado al pie

const TINTA: RGB = [15, 23, 42];
const GRIS: RGB = [100, 116, 139];
const GRIS_CLARO: RGB = [203, 213, 225];
const VERDE: RGB = [21, 128, 61];
const AMBAR: RGB = [180, 83, 9];

export interface DatosPDF {
  libreta: Libreta;
  config: Pick<Configuracion, 'membrete' | 'textos'>;
}

function formatoImagen(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/** Dimensiones del logo para que entre en una caja sin deformarse. */
function medidaLogo(doc: jsPDF, logo: string, maxAncho: number, maxAlto: number) {
  const { width, height } = doc.getImageProperties(logo);
  const escala = Math.min(maxAncho / width, maxAlto / height);
  return { w: width * escala, h: height * escala };
}

export function nombreArchivoPDF(lib: Libreta): string {
  const sufijo = lib.firma ? '' : '_EN-CURSO';
  return `libreta_${aNombreArchivo(lib.cursoNombre, lib.alumno.apellido, lib.alumno.nombre)}${sufijo}.pdf`;
}

export function generarPDF({ libreta, config }: DatosPDF): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }) as DocConTabla;
  const { membrete, textos } = config;
  const paleta = paletaPrimaria(membrete.colorPrimario);
  const primario = paleta.primario.map(Math.round) as RGB;
  const primarioTexto = paleta.texto.map(Math.round) as RGB;
  const sobrePrimario = paleta.sobre.map(Math.round) as RGB;
  const primarioClaro = paleta.claro.map(Math.round) as RGB;

  const curso = libreta.cursoNombre;
  const alumno = `${libreta.alumno.nombre} ${libreta.alumno.apellido}`;
  const prog = progresoLibreta(libreta);
  const estado = estadoLibreta(libreta);
  const etiquetaEstado = estado === 'validada' ? 'VALIDADA' : estado === 'lista' ? 'PENDIENTE DE FIRMA' : 'EN CURSO';
  const colorEstado = estado === 'validada' ? VERDE : AMBAR;
  const institucion = membrete.institucion.trim();
  const logo = membrete.logo;

  doc.setProperties({
    title: t(`Libreta de competencias ${curso} - ${alumno}`),
    subject: t(`Libreta de competencias ${curso}`),
    author: t(institucion || 'Libreta de competencias POCUS'),
    creator: 'Libreta de competencias POCUS',
  });

  const texto = (s: string, x: number, y: number, opciones?: Parameters<jsPDF['text']>[3]) => doc.text(t(s), x, y, opciones);
  const fuente = (estilo: 'normal' | 'bold', tamano: number, color: RGB = TINTA) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamano);
    doc.setTextColor(...color);
  };

  /** Recorta a una sola línea del ancho dado (con la fuente actual), agregando "…" si no entra. */
  const unaLinea = (s: string, ancho: number): string => {
    const limpio = t(s);
    if (doc.getTextWidth(limpio) <= ancho) return limpio;
    let corte = limpio;
    while (corte.length > 1 && doc.getTextWidth(corte + '…') > ancho) corte = corte.slice(0, -1);
    return corte.trimEnd() + '…';
  };

  /** Etiqueta con borde redondeado (EN CURSO, VALIDADA…), alineada a la derecha en xDer. */
  const etiqueta = (s: string, xDer: number, yCentro: number, tamano: number, color: RGB) => {
    fuente('bold', tamano, color);
    const w = doc.getTextWidth(t(s)) + 5;
    const h = tamano * 0.55;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.4);
    doc.roundedRect(xDer - w, yCentro - h / 2, w, h, 1.2, 1.2, 'S');
    texto(s, xDer - w / 2, yCentro, { align: 'center', baseline: 'middle' });
  };

  // ── Página 1: membrete ──────────────────────────────────────────────────
  let y = 14;
  let xTexto = M;
  let altoLogo = 0;
  if (logo) {
    const { w, h } = medidaLogo(doc, logo, 50, 20);
    doc.addImage(logo, formatoImagen(logo), M, y, w, h, 'logo');
    xTexto = M + w + 6;
    altoLogo = h;
  }
  let yTexto = y + 5;
  if (institucion) {
    fuente('bold', 13);
    const lineas = doc.splitTextToSize(t(institucion), ANCHO - M - xTexto) as string[];
    doc.text(lineas, xTexto, yTexto);
    yTexto += lineas.length * 5.4;
  }
  if (membrete.subtitulo.trim()) {
    fuente('normal', 9.5, GRIS);
    const lineas = doc.splitTextToSize(t(membrete.subtitulo.trim()), ANCHO - M - xTexto) as string[];
    doc.text(lineas, xTexto, yTexto);
    yTexto += lineas.length * 4.2;
  }
  y = Math.max(y + altoLogo, yTexto - 2) + 4;
  doc.setFillColor(...primario);
  doc.rect(M, y, UTIL, 0.9, 'F');

  y += 11;
  fuente('bold', 17);
  texto('Libreta de competencias', M, y);
  fuente('bold', 13, primarioTexto);
  texto(curso, M, y + 7);
  etiqueta(etiquetaEstado, ANCHO - M, y - 1.5, 10, colorEstado);
  y += 13;

  // ── Datos del alumno ────────────────────────────────────────────────────
  const situacion =
    estado === 'validada' && libreta.firma
      ? `Validada el ${formatearFechaHora(libreta.firma.fecha)} por ${libreta.firma.instructor}`
      : estado === 'lista'
        ? 'Prácticas completas · validación final pendiente'
        : `En curso · faltan ${prog.practicasTotales - prog.practicasHechas} prácticas`;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: TOPE_PAGINAS, bottom: PIE },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 1.3, bottom: 1.3, left: 2.5, right: 2.5 }, textColor: TINTA },
    columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold', textColor: GRIS } },
    body: [
      ['Alumno', `${libreta.alumno.apellido}, ${libreta.alumno.nombre}`],
      ['Curso', `${curso} · año ${libreta.alumno.anio}`],
      ['Avance', `${prog.porcentaje} % · ${prog.competenciasCompletas}/${prog.competenciasTotales} competencias · ${prog.practicasHechas}/${prog.practicasTotales} prácticas`],
      ['Estado', situacion],
    ].map((fila) => fila.map(t)),
    tableLineColor: GRIS_CLARO,
    tableLineWidth: 0.3,
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 7;

  // ── Instrucciones ──────────────────────────────────────────────────────
  if (textos.instrucciones.trim()) {
    fuente('bold', 10.5);
    texto('Instrucciones', M, y);
    y += 5;
    fuente('normal', 9.5, [51, 65, 85]);
    const lineas = doc.splitTextToSize(t(textos.instrucciones.trim()), UTIL) as string[];
    doc.text(lineas, M, y, { lineHeightFactor: 1.35 });
    y += lineas.length * 4.6 + 5;
  }

  fuente('bold', 10.5);
  texto('Registro de prácticas supervisadas', M, y);
  y += 3;

  // ── Una tabla por bloque ────────────────────────────────────────────────
  const n = libreta.practicasRequeridas;
  const anchoFecha = Math.min(27, 90 / n);
  for (const bloque of libreta.catalogo) {
    const { completas, total } = progresoBloque(libreta, bloque);
    const filas = bloque.competencias.map((c) => [t(c.nombre), ...fechasDe(libreta, c.id).map((f) => (f ? formatearFecha(f) : '—'))]);
    const completasFila = bloque.competencias.map((c) => fechasDe(libreta, c.id).every(Boolean));
    autoTable(doc, {
      startY: y + 3,
      margin: { left: M, right: M, top: TOPE_PAGINAS, bottom: PIE },
      pageBreak: 'avoid',
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.6,
        textColor: TINTA,
        lineColor: GRIS_CLARO,
        lineWidth: 0.2,
        cellPadding: { top: 1.6, bottom: 1.6, left: 2.2, right: 2.2 },
        valign: 'middle',
      },
      headStyles: { fillColor: primarioClaro, textColor: TINTA, fontStyle: 'bold', fontSize: 8 },
      columnStyles: Object.fromEntries([
        [0, { cellWidth: 'auto', cellPadding: { top: 1.6, bottom: 1.6, left: 6.5, right: 2.2 } }],
        ...Array.from({ length: n }, (_, i) => [i + 1, { cellWidth: anchoFecha, halign: 'center' as const }]),
      ]),
      head: [
        [
          {
            content: t(bloque.nombre),
            colSpan: n,
            styles: { fillColor: primario, textColor: sobrePrimario, fontSize: 9.2, cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2 } },
          },
          {
            content: `${completas}/${total}`,
            styles: { fillColor: primario, textColor: sobrePrimario, fontSize: 9.2, halign: 'right' },
          },
        ],
        ['Competencia', ...Array.from({ length: n }, (_, i) => `Práctica ${i + 1}`)].map(t),
      ],
      body: filas,
      didParseCell: (d: CellHookData) => {
        if (d.section === 'body' && d.column.index > 0 && d.cell.raw === '—') d.cell.styles.textColor = GRIS_CLARO;
      },
      didDrawCell: (d: CellHookData) => {
        // Tilde verde en las competencias completas.
        if (d.section !== 'body' || d.column.index !== 0 || !completasFila[d.row.index]) return;
        const cx = d.cell.x + 3.3;
        const cy = d.cell.y + d.cell.height / 2;
        doc.setDrawColor(...VERDE);
        doc.setLineWidth(0.55);
        doc.lines(
          [
            [0.9, 0.9],
            [1.7, -2],
          ],
          cx - 1.3,
          cy + 0.1,
        );
      },
    });
    y = doc.lastAutoTable?.finalY ?? y;
  }

  // ── Página final: validación ───────────────────────────────────────────
  doc.addPage();
  y = TOPE_PAGINAS + 6;
  fuente('bold', 15);
  texto('Validación final', M, y);
  etiqueta(estado === 'validada' ? 'VALIDADA' : 'PENDIENTE', ANCHO - M, y - 1.5, 10, colorEstado);
  y += 9;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: TOPE_PAGINAS, bottom: PIE },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: { top: 1.6, bottom: 1.6, left: 2.5, right: 2.5 }, textColor: TINTA },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold', textColor: GRIS } },
    body: [
      ['Alumno', alumno],
      ['Curso', `${curso} · año ${libreta.alumno.anio}`],
    ].map((fila) => fila.map(t)),
    tableLineColor: GRIS_CLARO,
    tableLineWidth: 0.3,
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 9;

  const firma = libreta.firma;
  // Sin firma, la frase se muestra como lo que el instructor certificará, no como un hecho.
  if (!firma) {
    fuente('bold', 9, GRIS);
    texto('Al validar, el instructor certifica:', M, y);
    y += 5.5;
  }
  fuente('normal', 11, firma ? TINTA : GRIS);
  const frase = doc.splitTextToSize(t(textoValidacion(textos.validacionFinal, curso).trim()), UTIL) as string[];
  doc.text(frase, M, y, { lineHeightFactor: 1.4 });
  y += frase.length * 5.5 + 10;

  const campo = (rotulo: string, valor: string, yy: number, pendiente = false) => {
    fuente('bold', 10, GRIS);
    texto(rotulo, M, yy);
    fuente(pendiente ? 'normal' : 'bold', 11, pendiente ? AMBAR : TINTA);
    texto(valor, M + 48, yy);
  };

  if (firma) {
    campo('Instructor responsable', firma.instructor, y);
    y += 12;
    fuente('bold', 10, GRIS);
    texto('Firma', M, y);
    const w = 80;
    const h = w / 3;
    doc.addImage(firma.imagen, 'PNG', M + 48, y - 8, w, h);
    doc.setDrawColor(...GRIS);
    doc.setLineWidth(0.3);
    doc.line(M + 48, y - 8 + h, M + 48 + w, y - 8 + h);
    fuente('normal', 8, GRIS);
    texto(firma.instructor, M + 48 + w / 2, y - 8 + h + 4, { align: 'center' });
    y += h + 6;
    campo('Fecha de validación', formatearFechaHora(firma.fecha), y);
  } else {
    const motivo =
      estado === 'lista'
        ? 'Todas las prácticas están registradas. Falta la firma del instructor.'
        : `La libreta está en curso: faltan ${prog.practicasTotales - prog.practicasHechas} prácticas en ${prog.competenciasTotales - prog.competenciasCompletas} competencias.`;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(...AMBAR);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y - 6, UTIL, 16, 2, 2, 'FD');
    fuente('bold', 11, AMBAR);
    texto('Validación final pendiente', M + 4, y);
    fuente('normal', 9.5, [120, 53, 15]);
    texto(motivo, M + 4, y + 5.5);
    y += 22;
    campo('Instructor responsable', 'pendiente', y, true);
    y += 12;
    campo('Firma', 'pendiente', y, true);
    y += 12;
    campo('Fecha de validación', 'pendiente', y, true);
  }

  // ── Encabezado (páginas 2+), marca de agua y pie en todas las páginas ──
  const paginas = doc.getNumberOfPages();
  const pie = `LIBRETA DE COMPETENCIAS ${curso.toLocaleUpperCase('es')}`;
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);

    if (p > 1) {
      let x = M;
      if (logo) {
        const { w, h } = medidaLogo(doc, logo, 30, 9);
        doc.addImage(logo, formatoImagen(logo), M, 9 + (9 - h) / 2, w, h, 'logo');
        x = M + w + 4;
      }
      const ancho = ANCHO - M - x - 42;
      fuente('bold', 8.5);
      doc.text(unaLinea(institucion || 'Libreta de competencias POCUS', ancho), x, 12.5);
      fuente('normal', 8, GRIS);
      doc.text(unaLinea(`${curso} · ${libreta.alumno.apellido}, ${libreta.alumno.nombre}`, ancho), x, 16.5);
      etiqueta(etiquetaEstado, ANCHO - M, 14, 7.5, colorEstado);
      doc.setFillColor(...primario);
      doc.rect(M, 21, UTIL, 0.5, 'F');
    }

    if (estado !== 'validada') {
      // Marca de agua diagonal para que una libreta sin validar no pase por validada.
      doc.saveGraphicsState();
      doc.setGState(new GState({ opacity: 0.07 }));
      fuente('bold', 64, AMBAR);
      const marca = estado === 'lista' ? 'SIN VALIDAR' : 'EN CURSO';
      const ang = 35;
      const rad = (ang * Math.PI) / 180;
      const w = doc.getTextWidth(marca);
      doc.text(marca, ANCHO / 2 - (w / 2) * Math.cos(rad), ALTO / 2 + (w / 2) * Math.sin(rad), { angle: ang });
      doc.restoreGraphicsState();
    }

    doc.setDrawColor(...GRIS_CLARO);
    doc.setLineWidth(0.3);
    doc.line(M, ALTO - 14, ANCHO - M, ALTO - 14);
    fuente('bold', 7.8, [71, 85, 105]);
    texto(`${pie} - PÁG. ${String(p).padStart(2, '0')}`, ANCHO - M, ALTO - 9.5, { align: 'right' });
    fuente('normal', 7.5, GRIS);
    const izquierda = [membrete.pie.trim(), `Generado el ${formatearFecha(hoyISO())}`].filter(Boolean).join(' · ');
    doc.text(unaLinea(izquierda, UTIL - 78), M, ALTO - 9.5);
  }

  return doc;
}
