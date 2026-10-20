import { useEffect, useState } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { COLOR_PRIMARIO_POR_DEFECTO, NOMBRE_APP } from '../../config';
import { useConfig } from '../../context/ConfigContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { esHexValido } from '../../utils/color';
import { prepararLogo } from '../../utils/imagen';
import { Tarjeta } from '../ui/Tarjeta';
import { Campo } from '../ui/Campo';
import { Boton } from '../ui/Boton';
import { BotonArchivo } from '../ui/BotonArchivo';

const COLORES_SUGERIDOS = ['#0e7490', '#1d4ed8', '#334155', '#15803d', '#7c2d12', '#be123c', '#6d28d9'];

export function SeccionMembrete() {
  const { config, dispatch } = useConfig();
  const notificar = useNotificar();
  const m = config.membrete;
  const [hex, setHex] = useState(m.colorPrimario);
  useEffect(() => setHex(m.colorPrimario), [m.colorPrimario]);

  const cambiarColor = (valor: string) => {
    setHex(valor);
    if (esHexValido(valor)) dispatch({ tipo: 'membrete', cambios: { colorPrimario: valor.toLowerCase() } });
  };

  return (
    <>
      <Tarjeta titulo="Vista previa" subtitulo="Así se ve en la app y en el encabezado del PDF.">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 bg-primario px-3 py-3 text-primario-sobre">
            {m.logo && (
              <span className="flex h-10 max-w-[35%] items-center rounded-lg bg-white px-1.5 py-1">
                <img src={m.logo} alt="" className="max-h-full max-w-full object-contain" />
              </span>
            )}
            <div className="min-w-0">
              {m.institucion.trim() && <p className="truncate text-xs font-semibold opacity-90">{m.institucion}</p>}
              <p className="text-sm font-bold">{NOMBRE_APP}</p>
              {m.subtitulo.trim() && <p className="truncate text-[11px] opacity-80">{m.subtitulo}</p>}
            </div>
          </div>
          <div className="bg-white px-4 py-3">
            <div className="flex items-center gap-3 border-b-2 border-primario pb-2">
              {m.logo && <img src={m.logo} alt="" className="h-9 max-w-[30%] object-contain" />}
              <div className="min-w-0 text-[11px] leading-tight">
                <p className="font-bold text-slate-900">{m.institucion.trim() || 'Nombre de la institución'}</p>
                <p className="text-slate-500">{m.subtitulo.trim() || 'Subtítulo'}</p>
              </div>
            </div>
            <div className="my-3 space-y-1.5" aria-hidden>
              <div className="h-2 w-2/3 rounded bg-slate-200" />
              <div className="h-2 w-1/2 rounded bg-slate-200" />
            </div>
            <div className="flex justify-between gap-2 border-t border-slate-200 pt-1.5 text-[9px] text-slate-500">
              <span className="truncate">{m.pie.trim()}</span>
              <span className="shrink-0">LIBRETA DE COMPETENCIAS POCUS II - PÁG. 01</span>
            </div>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Logo" subtitulo="Imagen PNG o JPG. Se recomienda PNG con fondo transparente.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
            {m.logo ? <img src={m.logo} alt="Logo cargado" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-500">Sin logo</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <BotonArchivo
              acepta="image/png,image/jpeg,.png,.jpg,.jpeg"
              icono={<ImagePlus size={18} />}
              etiqueta="Elegir imagen del logo"
              onArchivo={async (archivo) => {
                try {
                  dispatch({ tipo: 'membrete', cambios: { logo: await prepararLogo(archivo) } });
                  notificar('Logo cargado.');
                } catch (e) {
                  notificar((e as Error).message, 'error');
                }
              }}
            >
              {m.logo ? 'Cambiar logo' : 'Cargar logo'}
            </BotonArchivo>
            {m.logo && (
              <Boton variante="peligro" icono={<Trash2 size={18} />} onClick={() => dispatch({ tipo: 'membrete', cambios: { logo: null } })}>
                Quitar
              </Boton>
            )}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Datos del membrete">
        <div className="space-y-3">
          <Campo
            etiqueta="Nombre de la institución"
            value={m.institucion}
            onChange={(e) => dispatch({ tipo: 'membrete', cambios: { institucion: e.target.value } })}
            placeholder="Ej.: nombre de la academia o sociedad"
          />
          <Campo
            etiqueta="Subtítulo"
            value={m.subtitulo}
            onChange={(e) => dispatch({ tipo: 'membrete', cambios: { subtitulo: e.target.value } })}
            placeholder="Ej.: Programa de formación en ultrasonografía clínica"
          />
          <Campo
            etiqueta="Pie de página"
            value={m.pie}
            onChange={(e) => dispatch({ tipo: 'membrete', cambios: { pie: e.target.value } })}
            ayuda="Aparece al pie de cada página del PDF, junto al número de página."
          />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Color principal" subtitulo="Se usa en la app y en el PDF. El texto se ajusta solo para que siempre se lea bien.">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="color-primario" className="mb-1 block text-sm font-medium text-slate-700">
              Elegir color
            </label>
            <input
              id="color-primario"
              type="color"
              value={esHexValido(hex) ? hex : m.colorPrimario}
              onChange={(e) => cambiarColor(e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
          </div>
          <Campo
            etiqueta="Código"
            className="w-32"
            value={hex}
            maxLength={7}
            onChange={(e) => cambiarColor(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
            error={esHexValido(hex) ? undefined : 'Formato #rrggbb'}
          />
          <Boton variante="fantasma" icono={<RotateCcw size={16} />} onClick={() => cambiarColor(COLOR_PRIMARIO_POR_DEFECTO)}>
            Original
          </Boton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Colores sugeridos">
          {COLORES_SUGERIDOS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => cambiarColor(c)}
              aria-label={`Usar el color ${c}`}
              aria-pressed={m.colorPrimario === c}
              className={`h-11 w-11 rounded-full border-2 transition ${m.colorPrimario === c ? 'border-slate-900 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-white shadow'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Tarjeta>
    </>
  );
}
