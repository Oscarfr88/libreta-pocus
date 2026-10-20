import { useState } from 'react';
import { FileSpreadsheet, Plus, Trash2, Upload, X } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { ACEPTA_PLANILLAS, leerPlanilla, planillaXlsx } from '../../utils/excel';
import { instructoresDesdeFilas, type ResultadoInstructores } from '../../utils/importarInstructores';
import { descargarBlob } from '../../utils/descargas';
import { claveComparacion, normalizarTexto } from '../../utils/texto';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { BotonArchivo } from '../ui/BotonArchivo';
import { Modal } from '../ui/Modal';
import { Aviso } from '../ui/Aviso';

export function SeccionInstructores() {
  const { config, dispatch } = useConfig();
  const notificar = useNotificar();
  const [vistaPrevia, setVistaPrevia] = useState<(ResultadoInstructores & { archivo: string }) | null>(null);
  const [vaciando, setVaciando] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const lista = config.instructores;

  const guardar = (nombres: string[], mensaje: string) => {
    dispatch({ tipo: 'instructores', lista: nombres });
    notificar(mensaje);
  };

  const agregarManual = () => {
    const n = normalizarTexto(nuevo);
    if (!n) return;
    if (lista.some((x) => claveComparacion(x) === claveComparacion(n))) {
      notificar(`${n} ya está en la lista.`, 'error');
      return;
    }
    guardar([...lista, n], `${n} agregado.`);
    setNuevo('');
  };

  return (
    <>
      <Tarjeta titulo="Cargar desde Excel" subtitulo="Archivo .xlsx o .csv, con o sin fila de títulos.">
        <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Una columna <strong>Nombre y apellido</strong>, o
          </li>
          <li>
            dos columnas <strong>Nombre</strong> y <strong>Apellido</strong>.
          </li>
        </ul>
        <p className="mb-3 text-xs text-slate-500">Se quitan los espacios sobrantes y los nombres repetidos, y la lista se ordena alfabéticamente.</p>
        <div className="flex flex-wrap gap-2">
          <BotonArchivo
            acepta={ACEPTA_PLANILLAS}
            variante="primario"
            icono={<Upload size={18} />}
            etiqueta="Elegir planilla de instructores"
            onArchivo={async (archivo) => {
              try {
                setVistaPrevia({ ...instructoresDesdeFilas(await leerPlanilla(archivo)), archivo: archivo.name });
              } catch (e) {
                notificar((e as Error).message, 'error');
              }
            }}
          >
            Cargar planilla
          </BotonArchivo>
          <Boton
            icono={<FileSpreadsheet size={18} />}
            onClick={async () => descargarBlob('planilla-modelo_instructores.xlsx', await planillaXlsx([['Nombre', 'Apellido']], 'Instructores', [24, 24]))}
          >
            Planilla modelo
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta titulo={`Lista actual (${lista.length})`} subtitulo="Son los nombres que aparecen al firmar la libreta.">
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            agregarManual();
          }}
        >
          <label htmlFor="nuevo-instructor" className="sr-only">
            Nombre y apellido del instructor
          </label>
          <input
            id="nuevo-instructor"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Nombre y apellido"
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-primario-texto focus:ring-2 focus:ring-primario/30"
          />
          <Boton type="submit" icono={<Plus size={18} />} disabled={!normalizarTexto(nuevo)}>
            Agregar
          </Boton>
        </form>

        {lista.length === 0 ? (
          <Aviso tipo="atencion">Todavía no hay instructores. Sin esta lista no se puede firmar ninguna libreta.</Aviso>
        ) : (
          <>
            <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {lista.map((n) => (
                <li key={n} className="flex items-center gap-2 pl-3">
                  <span className="min-w-0 flex-1 truncate py-2 text-sm text-slate-800">{n}</span>
                  <button
                    type="button"
                    onClick={() => guardar(lista.filter((x) => x !== n), `${n} quitado de la lista.`)}
                    aria-label={`Quitar a ${n}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-400 hover:text-rose-600"
                  >
                    <X size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <Boton variante="peligro" className="mt-3" icono={<Trash2 size={18} />} onClick={() => setVaciando(true)}>
              Vaciar lista
            </Boton>
          </>
        )}
      </Tarjeta>

      <Modal
        abierto={!!vistaPrevia}
        titulo="Revisá la lista antes de guardar"
        onCerrar={() => setVistaPrevia(null)}
        acciones={
          vistaPrevia && (
            <>
              <Boton onClick={() => setVistaPrevia(null)}>Cancelar</Boton>
              {lista.length > 0 && (
                <Boton
                  onClick={() => {
                    guardar([...lista, ...vistaPrevia.nombres], 'Instructores agregados a la lista.');
                    setVistaPrevia(null);
                  }}
                >
                  Agregar a la lista actual
                </Boton>
              )}
              <Boton
                variante="primario"
                onClick={() => {
                  guardar(vistaPrevia.nombres, `Lista de instructores guardada (${vistaPrevia.nombres.length}).`);
                  setVistaPrevia(null);
                }}
              >
                {lista.length > 0 ? 'Reemplazar la lista' : 'Guardar lista'}
              </Boton>
            </>
          )
        }
      >
        {vistaPrevia && (
          <div className="space-y-3">
            <p>
              Archivo <strong className="break-all">{vistaPrevia.archivo}</strong>:{' '}
              {vistaPrevia.formato === 'dos-columnas' ? 'columnas Nombre y Apellido' : 'una columna con nombre y apellido'},{' '}
              {vistaPrevia.conEncabezado ? 'con fila de títulos' : 'sin fila de títulos'}.
            </p>
            <p>
              <strong>{vistaPrevia.nombres.length}</strong> instructor(es)
              {vistaPrevia.descartadas > 0 && ` · se descartaron ${vistaPrevia.descartadas} fila(s) vacías o repetidas`}.
            </p>
            <ul className="max-h-[40vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {vistaPrevia.nombres.map((n) => (
                <li key={n} className="px-3 py-1.5 text-sm">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        abierto={vaciando}
        titulo="¿Vaciar la lista de instructores?"
        onCerrar={() => setVaciando(false)}
        acciones={
          <>
            <Boton onClick={() => setVaciando(false)}>Cancelar</Boton>
            <Boton
              variante="peligro"
              onClick={() => {
                guardar([], 'Lista de instructores vaciada.');
                setVaciando(false);
              }}
            >
              Vaciar
            </Boton>
          </>
        }
      >
        Se quitan los {lista.length} instructores. Las libretas ya firmadas conservan el nombre de quien las firmó.
      </Modal>
    </>
  );
}
