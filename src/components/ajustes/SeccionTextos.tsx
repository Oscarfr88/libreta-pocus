import { RotateCcw } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import {
  TEXTO_INSTRUCCIONES_POR_DEFECTO,
  TEXTO_VALIDACION_POR_DEFECTO,
  textoValidacion,
} from '../../data/configuracionInicial';
import { Tarjeta } from '../ui/Tarjeta';
import { AreaTexto } from '../ui/AreaTexto';
import { Boton } from '../ui/Boton';

export function SeccionTextos() {
  const { config, dispatch } = useConfig();
  const t = config.textos;

  return (
    <>
      <Tarjeta titulo="Instrucciones" subtitulo="Se muestran en el PDF, debajo de los datos del alumno.">
        <AreaTexto
          etiqueta="Texto de instrucciones"
          rows={6}
          value={t.instrucciones}
          onChange={(e) => dispatch({ tipo: 'textos', cambios: { instrucciones: e.target.value } })}
        />
        {t.instrucciones !== TEXTO_INSTRUCCIONES_POR_DEFECTO && (
          <Boton
            variante="fantasma"
            className="mt-2"
            icono={<RotateCcw size={16} />}
            onClick={() => dispatch({ tipo: 'textos', cambios: { instrucciones: TEXTO_INSTRUCCIONES_POR_DEFECTO } })}
          >
            Volver al texto original
          </Boton>
        )}
      </Tarjeta>

      <Tarjeta titulo="Validación final" subtitulo="Frase de la página de validación, firmada por el instructor.">
        <AreaTexto
          etiqueta="Texto de la validación final"
          rows={3}
          value={t.validacionFinal}
          onChange={(e) => dispatch({ tipo: 'textos', cambios: { validacionFinal: e.target.value } })}
          ayuda="Escribí {curso} donde tenga que aparecer el curso de cada libreta (por ejemplo, POCUS II)."
        />
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Ejemplo para POCUS II</span>
          {textoValidacion(t.validacionFinal, 'POCUS II') || '—'}
        </p>
        {!t.validacionFinal.includes('{curso}') && (
          <p className="mt-2 text-xs text-amber-800">El texto no incluye {'{curso}'}: no va a mencionar el curso de la libreta.</p>
        )}
        {t.validacionFinal !== TEXTO_VALIDACION_POR_DEFECTO && (
          <Boton
            variante="fantasma"
            className="mt-2"
            icono={<RotateCcw size={16} />}
            onClick={() => dispatch({ tipo: 'textos', cambios: { validacionFinal: TEXTO_VALIDACION_POR_DEFECTO } })}
          >
            Volver al texto original
          </Boton>
        )}
      </Tarjeta>
    </>
  );
}
