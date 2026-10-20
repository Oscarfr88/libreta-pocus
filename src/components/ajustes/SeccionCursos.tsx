import { useState } from 'react';
import { Download, Eye, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { Curso } from '../../types';
import { useConfig } from '../../context/ConfigContext';
import { useLibretas } from '../../context/LibretasContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { contarCompetencias } from '../../utils/catalogo';
import { ACEPTA_PLANILLAS, leerPlanilla, planillaXlsx } from '../../utils/excel';
import { catalogoDesdeFilas, catalogoDesdeJSON, filasDeCatalogo, type ResultadoCatalogo } from '../../utils/importarCatalogo';
import { descargarBlob } from '../../utils/descargas';
import { aNombreArchivo } from '../../utils/respaldo';
import { claveComparacion, normalizarTexto } from '../../utils/texto';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { BotonArchivo } from '../ui/BotonArchivo';
import { Modal } from '../ui/Modal';
import { Campo } from '../ui/Campo';
import { Aviso } from '../ui/Aviso';
import { MenuAcciones } from '../MenuAcciones';

type Dialogo =
  | { tipo: 'agregar' }
  | { tipo: 'renombrar'; curso: Curso }
  | { tipo: 'eliminar'; curso: Curso }
  | { tipo: 'ver'; curso: Curso }
  | { tipo: 'vistaPrevia'; curso: Curso; resultado: ResultadoCatalogo; archivo: string }
  | null;

async function leerCatalogo(archivo: File, curso: Curso): Promise<ResultadoCatalogo> {
  if (/\.json$/i.test(archivo.name)) {
    let datos: unknown;
    try {
      datos = JSON.parse(await archivo.text());
    } catch {
      throw new Error('El archivo .json no es válido o está dañado.');
    }
    return catalogoDesdeJSON(datos, curso.nombre);
  }
  return catalogoDesdeFilas(await leerPlanilla(archivo));
}

function ListaCatalogo({ curso }: { curso: Pick<Curso, 'bloques'> }) {
  return (
    <ol className="space-y-3">
      {curso.bloques.map((b) => (
        <li key={b.id}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {b.nombre} <span className="font-medium text-slate-500">({b.competencias.length})</span>
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
            {b.competencias.map((c) => (
              <li key={c.id}>{c.nombre}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function SeccionCursos() {
  const { config, dispatch } = useConfig();
  const { libretas } = useLibretas();
  const notificar = useNotificar();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string>();
  const cerrar = () => {
    setDialogo(null);
    setErrorNombre(undefined);
  };

  const nombreDisponible = (n: string, excepto?: string) =>
    !config.cursos.some((c) => c.id !== excepto && claveComparacion(c.nombre) === claveComparacion(n));

  const guardarNombre = () => {
    const n = normalizarTexto(nombre);
    if (!n) return setErrorNombre('Escribí un nombre.');
    if (dialogo?.tipo === 'renombrar') {
      if (!nombreDisponible(n, dialogo.curso.id)) return setErrorNombre('Ya hay otro curso con ese nombre.');
      dispatch({ tipo: 'renombrarCurso', id: dialogo.curso.id, nombre: n });
      notificar('Curso renombrado.');
    } else {
      if (!nombreDisponible(n)) return setErrorNombre('Ya hay un curso con ese nombre.');
      dispatch({ tipo: 'agregarCurso', nombre: n });
      notificar(`Curso "${n}" agregado. Ahora cargá sus competencias.`);
    }
    cerrar();
  };

  const exportarCatalogo = async (curso: Curso) => {
    const blob = await planillaXlsx(filasDeCatalogo(curso.bloques), curso.nombre, [36, 70]);
    descargarBlob(`competencias_${aNombreArchivo(curso.nombre)}.xlsx`, blob);
  };

  return (
    <>
      <Aviso tipo="info">
        Cada curso necesita su lista de competencias para que los alumnos puedan crear su libreta. Cargala desde una
        planilla de Excel (.xlsx o .csv) con dos columnas: <strong>Bloque</strong> y <strong>Competencia</strong>, una
        fila por competencia y en el orden deseado. Las libretas ya creadas conservan la lista con la que se crearon.
      </Aviso>

      <div className="flex flex-wrap gap-2">
        <Boton
          variante="primario"
          icono={<Plus size={18} />}
          onClick={() => {
            setNombre('');
            setDialogo({ tipo: 'agregar' });
          }}
        >
          Agregar curso
        </Boton>
        <Boton
          icono={<FileSpreadsheet size={18} />}
          onClick={async () => descargarBlob('planilla-modelo_competencias.xlsx', await planillaXlsx([['Bloque', 'Competencia']], 'Competencias', [36, 70]))}
        >
          Planilla modelo
        </Boton>
      </div>

      {config.cursos.length === 0 && <p className="text-sm text-slate-600">No hay cursos. Agregá uno para empezar.</p>}

      {config.cursos.map((curso) => {
        const nLibretas = libretas.filter((l) => l.cursoId === curso.id).length;
        const tieneCatalogo = curso.bloques.length > 0;
        return (
          <Tarjeta key={curso.id}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">{curso.nombre}</h2>
                <p className={`text-sm ${tieneCatalogo ? 'text-slate-600' : 'font-medium text-amber-800'}`}>
                  {tieneCatalogo
                    ? `${curso.bloques.length} bloques · ${contarCompetencias(curso.bloques)} competencias`
                    : 'Sin competencias cargadas: los alumnos todavía no pueden crear libretas de este curso.'}
                </p>
                {nLibretas > 0 && <p className="mt-0.5 text-xs text-slate-500">{nLibretas} libreta(s) en este dispositivo</p>}
              </div>
              <MenuAcciones
                etiqueta={`Opciones de ${curso.nombre}`}
                items={[
                  {
                    etiqueta: 'Renombrar',
                    icono: <Pencil size={18} />,
                    onClick: () => {
                      setNombre(curso.nombre);
                      setDialogo({ tipo: 'renombrar', curso });
                    },
                  },
                  { etiqueta: 'Eliminar curso', icono: <Trash2 size={18} />, peligro: true, onClick: () => setDialogo({ tipo: 'eliminar', curso }) },
                ]}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <BotonArchivo
                acepta={`${ACEPTA_PLANILLAS},.json,application/json`}
                variante={tieneCatalogo ? 'secundario' : 'primario'}
                icono={<Upload size={18} />}
                etiqueta={`Importar competencias de ${curso.nombre}`}
                onArchivo={async (archivo) => {
                  try {
                    const resultado = await leerCatalogo(archivo, curso);
                    setDialogo({ tipo: 'vistaPrevia', curso, resultado, archivo: archivo.name });
                  } catch (e) {
                    notificar((e as Error).message, 'error');
                  }
                }}
              >
                {tieneCatalogo ? 'Reemplazar competencias' : 'Importar competencias'}
              </BotonArchivo>
              {tieneCatalogo && (
                <>
                  <Boton icono={<Eye size={18} />} onClick={() => setDialogo({ tipo: 'ver', curso })}>
                    Ver
                  </Boton>
                  <Boton icono={<Download size={18} />} onClick={() => exportarCatalogo(curso)}>
                    Excel
                  </Boton>
                </>
              )}
            </div>
          </Tarjeta>
        );
      })}

      {/* Agregar / renombrar */}
      <Modal
        abierto={dialogo?.tipo === 'agregar' || dialogo?.tipo === 'renombrar'}
        titulo={dialogo?.tipo === 'renombrar' ? 'Renombrar curso' : 'Agregar curso'}
        onCerrar={cerrar}
        acciones={
          <>
            <Boton onClick={cerrar}>Cancelar</Boton>
            <Boton variante="primario" type="submit" form="form-curso">
              Guardar
            </Boton>
          </>
        }
      >
        <form
          id="form-curso"
          onSubmit={(e) => {
            e.preventDefault();
            guardarNombre();
          }}
        >
          <Campo id="nombre-curso" etiqueta="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errorNombre} placeholder="Ej.: POCUS I" />
          {dialogo?.tipo === 'renombrar' && (
            <p className="mt-2 text-xs text-slate-500">Las libretas ya creadas conservan el nombre con el que se crearon.</p>
          )}
        </form>
      </Modal>

      {/* Eliminar */}
      <Modal
        abierto={dialogo?.tipo === 'eliminar'}
        titulo="¿Eliminar este curso?"
        onCerrar={cerrar}
        acciones={
          <>
            <Boton onClick={cerrar}>Cancelar</Boton>
            <Boton
              variante="peligro"
              icono={<Trash2 size={18} />}
              onClick={() => {
                if (dialogo?.tipo === 'eliminar') {
                  dispatch({ tipo: 'eliminarCurso', id: dialogo.curso.id });
                  notificar('Curso eliminado.');
                }
                cerrar();
              }}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        {dialogo?.tipo === 'eliminar' && (
          <p>
            Se quita <strong>{dialogo.curso.nombre}</strong> de la lista de cursos y no se van a poder crear libretas nuevas de
            ese curso. Las libretas que ya existen en este dispositivo se conservan.
          </p>
        )}
      </Modal>

      {/* Ver catálogo */}
      <Modal abierto={dialogo?.tipo === 'ver'} titulo={dialogo?.tipo === 'ver' ? `Competencias de ${dialogo.curso.nombre}` : ''} onCerrar={cerrar}>
        {dialogo?.tipo === 'ver' && <ListaCatalogo curso={dialogo.curso} />}
      </Modal>

      {/* Vista previa de importación */}
      <Modal
        abierto={dialogo?.tipo === 'vistaPrevia'}
        titulo="Revisá las competencias antes de guardar"
        onCerrar={cerrar}
        acciones={
          <>
            <Boton onClick={cerrar}>Cancelar</Boton>
            <Boton
              variante="primario"
              onClick={() => {
                if (dialogo?.tipo === 'vistaPrevia') {
                  dispatch({ tipo: 'catalogoCurso', id: dialogo.curso.id, bloques: dialogo.resultado.bloques });
                  notificar(`Competencias de ${dialogo.curso.nombre} guardadas.`);
                }
                cerrar();
              }}
            >
              Guardar en {dialogo?.tipo === 'vistaPrevia' ? dialogo.curso.nombre : ''}
            </Boton>
          </>
        }
      >
        {dialogo?.tipo === 'vistaPrevia' && (
          <div className="space-y-3">
            <p>
              Archivo <strong className="break-all">{dialogo.archivo}</strong>: {dialogo.resultado.bloques.length} bloques y{' '}
              {dialogo.resultado.competencias} competencias.
            </p>
            {dialogo.resultado.avisos.map((a) => (
              <Aviso key={a} tipo="atencion">
                {a}
              </Aviso>
            ))}
            {dialogo.curso.bloques.length > 0 && (
              <Aviso tipo="atencion">Reemplaza la lista actual de {dialogo.curso.nombre}. Las libretas ya creadas no cambian.</Aviso>
            )}
            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-slate-200 p-3">
              <ListaCatalogo curso={dialogo.resultado} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
