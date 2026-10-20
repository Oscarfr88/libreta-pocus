import { describe, expect, it } from 'vitest';
import { configuracionInicial, textoValidacion } from '../data/configuracionInicial';
import { contarCompetencias } from '../utils/catalogo';

// Listado tal como figura en el pedido original. Única adaptación acordada:
// "Relación E/e ́" (acento combinado suelto, U+0301) se guarda como "Relación E/e´" (U+00B4).
const ORIGINAL = `
FÍSICA Y KNOBOLOGÍA: Cuidados del equipo; Knobología, transductores y comandos básicos; Uso del modo M; Uso de Doppler (color, pulsado, continuo y tisular).
ULTRASONIDO PULMONAR: Exploración pulmonar con ultrasonido; Protocolo BLUE; Identificación de punto pulmonar; Cálculo de LUS Score; Cuantificación ecográfica de derrame pleural.
ABDOMEN / FAST: Protocolo FAST / FASTE; Evaluación de hígado; Evaluación de vesícula biliar; Medición del diámetro de vía biliar; Evaluación de páncreas; Evaluación de bazo; Evaluación de pared intestinal; Evaluación de peristalsis; Evaluación de aorta abdominal con medición; Evaluación de vena porta.
DIAFRAGMA: Medición de excursión diafragmática; Medición de engrosamiento diafragmático.
PROCEDIMIENTOS ECOGUIADOS: Marcación ecográfica para toracocentesis; Marcación ecográfica para paracentesis; Identificación de arterias epigástricas previo a procedimientos.
RENOVESICOPROSTÁTICO (RVP): Exploración ecográfica renal; Mediciones renales (longitudinal, lateral, anteroposterior); Evaluación de corteza y parénquima renal; Evaluación de ecogenicidad cortical; Medición de índice de resistencia (IR); Evaluación de vejiga (paredes y volumen); Verificación de posicionamiento de sonda vesical.
VENTANAS CARDÍACAS: Ventana paraesternal eje largo; Ventana paraesternal eje corto; Ventana apical 4 cámaras; Ventana apical 2 cámaras; Ventana subxifoidea.
ACCESOS VASCULARES: Práctica de accesos vasculares ecoguiados en simuladores; Aplicación del protocolo RaCeVA; Aplicación del protocolo RaPeVA; Aplicación del protocolo RaFeVA.
FUNCIÓN SISTÓLICA: Valoración visual de función sistólica; Medición distancia E-septum; Cálculo FE por método Teicholz; Cálculo FE por método Simpson; Cambio fraccional de área; MAPSE.
FUNCIÓN DIASTÓLICA: Relación E/e ́; Área de aurícula izquierda; Volumen de aurícula izquierda; Doppler de venas pulmonares.
VENA CAVA INFERIOR: Medición de VCI; Evaluación de colapsabilidad / distensibilidad.
CAVIDADES DERECHAS: TAPSE; Medición diámetro de ventrículo derecho; PSAP; Tiempo de aceleración de arteria pulmonar; Cambio fraccional de área de VD; Evaluación del tabique interventricular.
MONITOREO HEMODINÁMICO: Medición de VTI; Cálculo de volumen minuto; Acoplamiento ventrículo-arterial; Test de elevación pasiva de piernas con medición de VTI.
DOPPLER VALVULAR: Doppler válvula tricúspide; Doppler válvula aórtica; Doppler válvula mitral.
ULTRASONOGRAFÍA DEL EJE VENOSO: Evaluación venas superficiales (basílica y cefálica); Evaluación venas profundas del brazo (humerales, axilar, subclavia); Evaluación yugulares; Evaluación venas ilíacas; Evaluación sistema femoral; Evaluación vena poplítea.
NEUROSONOLOGÍA: Doppler ACM (VPS / VM / VD); Doppler ACA; Doppler ACP; Doppler arteria basilar; Índice de Lindegaard; Doppler carótida interna; Índice vertebro-basilar; Doppler de arteria oftálmica; DVNO; Reactividad pupilar; Medición del tercer ventrículo.
POCUS GINECO-OBSTÉTRICO: Evaluación del embarazo temprano: confirmación, viabilidad y descarte inicial de ectópico; Evaluación urgente: FCF y presentación fetal; Valoración cualitativa de líquido amniótico; Identificación de anexos.
`;

function parsearOriginal(texto: string) {
  return texto
    .trim()
    .split('\n')
    .map((linea) => {
      const i = linea.indexOf(': ');
      const nombre = linea.slice(0, i);
      const competencias = linea
        .slice(i + 2)
        .replace(/\.$/, '')
        .split('; ')
        .map((c) => c.replace('E/e ́', 'E/e´'));
      return { nombre, competencias };
    });
}

describe('catálogo precargado de POCUS II', () => {
  const config = configuracionInicial();
  const pocusII = config.cursos.find((c) => c.id === 'pocus-ii')!;

  it('coincide exactamente con el listado original (bloques, ítems y orden)', () => {
    const esperado = parsearOriginal(ORIGINAL);
    const real = pocusII.bloques.map((b) => ({ nombre: b.nombre, competencias: b.competencias.map((c) => c.nombre) }));
    expect(real).toEqual(esperado);
  });

  it('tiene 17 bloques y 86 competencias', () => {
    expect(pocusII.bloques).toHaveLength(17);
    expect(contarCompetencias(pocusII.bloques)).toBe(86);
  });

  it('usa ids únicos', () => {
    const ids = pocusII.bloques.flatMap((b) => [b.id, ...b.competencias.map((c) => c.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los textos están en forma Unicode NFC, sin acentos combinados sueltos', () => {
    for (const b of pocusII.bloques) {
      for (const t of [b.nombre, ...b.competencias.map((c) => c.nombre)]) {
        expect(t).toBe(t.normalize('NFC'));
        expect(t).not.toMatch(/[̀-ͯ]/);
      }
    }
  });

  it('POCUS I y POCUS III existen sin catálogo, y no hay logo por defecto', () => {
    expect(config.cursos.map((c) => c.nombre)).toEqual(['POCUS I', 'POCUS II', 'POCUS III']);
    expect(config.cursos[0].bloques).toEqual([]);
    expect(config.cursos[2].bloques).toEqual([]);
    expect(config.membrete.logo).toBeNull();
  });

  it('el texto de validación usa el curso de la libreta', () => {
    const t = textoValidacion(config.textos.validacionFinal, 'POCUS III');
    expect(t).toBe('Ha completado satisfactoriamente las competencias prácticas del curso POCUS III.');
  });
});
