import { useMemo, useState } from 'react';
import { ChevronRight, NotebookPen, Plus, Settings, Upload } from 'lucide-react';
import type { Libreta } from '../../types';
import { useLibretas } from '../../context/LibretasContext';
import { useConfig } from '../../context/ConfigContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { libretaDesdeRespaldo } from '../../utils/respaldo';
import { formatearFechaHora } from '../../utils/fechas';
import { nuevoId } from '../../utils/ids';
import { estadoLibreta, progresoLibreta } from '../../utils/progreso';
import { compararEs } from '../../utils/texto';
import { Membrete } from '../Membrete';
import { EtiquetaEstado } from '../EtiquetaEstado';
import { Boton } from '../ui/Boton';
import { BarraProgreso } from '../ui/BarraProgreso';
import { Aviso } from '../ui/Aviso';
import { BotonArchivo } from '../ui/BotonArchivo';
import { Modal } from '../ui/Modal';

interface Props {
  navegar: (destino: string) => void;
}

function TarjetaLibreta({ lib, onAbrir }: { lib: Libreta; onAbrir: () => void }) {
  const p = progresoLibreta(lib);
  const estado = estadoLibreta(lib);
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-soft transition hover:border-primario-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-primario-texto"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold text-slate-900">
            {lib.alumno.apellido}, {lib.alumno.nombre}
          </p>
          <EtiquetaEstado estado={estado} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {lib.cursoNombre} · Año {lib.alumno.anio}
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <BarraProgreso porcentaje={p.porcentaje} etiqueta={`Avance de la libreta: ${p.porcentaje}%`} completo={estado !== 'en-curso'} />
          <span className="w-11 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800">{p.porcentaje}%</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {p.competenciasCompletas}/{p.competenciasTotales} competencias completas
        </p>
      </div>
      <ChevronRight size={20} className="shrink-0 text-slate-400 group-hover:text-primario-texto" aria-hidden />
    </button>
  );
}

export function InicioView({ navegar }: Props) {
  const { libretas, dispatch, errorGuardado } = useLibretas();
  const { errorGuardado: errorConfig } = useConfig();
  const notificar = useNotificar();
  const [conflicto, setConflicto] = useState<{ nueva: Libreta; existente: Libreta } | null>(null);

  const importar = (lib: Libreta) => {
    dispatch({ tipo: 'importar', libreta: lib });
    notificar(`Libreta de ${lib.alumno.nombre} ${lib.alumno.apellido} (${lib.cursoNombre}) importada.`);
    setConflicto(null);
  };

  const alElegirRespaldo = async (archivo: File) => {
    try {
      const lib = libretaDesdeRespaldo(await archivo.text());
      const existente = libretas.find((l) => l.id === lib.id);
      if (existente) setConflicto({ nueva: lib, existente });
      else importar(lib);
    } catch (e) {
      notificar((e as Error).message, 'error');
    }
  };

  const botonImportar = (
    <BotonArchivo acepta=".json,application/json" icono={<Upload size={18} />} bloque etiqueta="Elegir respaldo de libreta" onArchivo={alElegirRespaldo}>
      Importar respaldo
    </BotonArchivo>
  );

  // Agrupadas por curso, para que las libretas de distintos cursos no se mezclen.
  const grupos = useMemo(() => {
    const porCurso = new Map<string, { nombre: string; libretas: Libreta[] }>();
    for (const l of libretas) {
      const g = porCurso.get(l.cursoId) ?? { nombre: l.cursoNombre, libretas: [] };
      g.libretas.push(l);
      porCurso.set(l.cursoId, g);
    }
    return [...porCurso.values()]
      .sort((a, b) => compararEs(a.nombre, b.nombre))
      .map((g) => ({ ...g, libretas: g.libretas.sort((a, b) => b.actualizada.localeCompare(a.actualizada)) }));
  }, [libretas]);

  return (
    <div className="min-h-screen pb-10">
      <Membrete
        acciones={
          <button
            type="button"
            onClick={() => navegar('/ajustes')}
            aria-label="Ajustes"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current"
          >
            <Settings size={22} />
          </button>
        }
      />
      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
        {(errorGuardado || errorConfig) && (
          <Aviso tipo="error">
            No se pudieron guardar los últimos cambios en este dispositivo (puede que el almacenamiento esté lleno o
            bloqueado). Exportá un respaldo para no perder datos.
          </Aviso>
        )}

        {libretas.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-soft">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primario-claro text-primario-texto">
              <NotebookPen size={28} />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Todavía no tenés libretas</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              Creá tu libreta para el curso que estás haciendo y registrá la fecha de cada práctica supervisada. Todo se
              guarda automáticamente en este dispositivo.
            </p>
            <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2">
              <Boton variante="primario" icono={<Plus size={18} />} onClick={() => navegar('/nueva')}>
                Crear mi libreta
              </Boton>
              {botonImportar}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              ¿La coordinación del curso te pasó un archivo de configuración?{' '}
              <a href="#/ajustes/archivo" className="font-semibold text-primario-texto underline underline-offset-2">
                Importalo acá
              </a>
              .
            </p>
          </section>
        ) : (
          <>
            {grupos.map((g) => (
              <section key={g.nombre} aria-label={`Libretas de ${g.nombre}`}>
                <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500">{g.nombre}</h2>
                <div className="space-y-2.5">
                  {g.libretas.map((l) => (
                    <TarjetaLibreta key={l.id} lib={l} onAbrir={() => navegar(`/libreta/${l.id}`)} />
                  ))}
                </div>
              </section>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <Boton variante="primario" bloque icono={<Plus size={18} />} onClick={() => navegar('/nueva')}>
                Nueva libreta
              </Boton>
              {botonImportar}
            </div>
          </>
        )}
      </main>

      <Modal
        abierto={!!conflicto}
        titulo="Esta libreta ya está en el dispositivo"
        onCerrar={() => setConflicto(null)}
        acciones={
          conflicto && (
            <>
              <Boton onClick={() => setConflicto(null)}>Cancelar</Boton>
              <Boton onClick={() => importar({ ...conflicto.nueva, id: nuevoId('lib') })}>Conservar las dos</Boton>
              <Boton variante="primario" onClick={() => importar(conflicto.nueva)}>
                Reemplazar
              </Boton>
            </>
          )
        }
      >
        {conflicto && (
          <div className="space-y-2">
            <p>
              Ya existe la libreta de <strong>{conflicto.existente.alumno.nombre} {conflicto.existente.alumno.apellido}</strong> ({conflicto.existente.cursoNombre}).
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                En el dispositivo: {progresoLibreta(conflicto.existente).porcentaje}% · modificada el {formatearFechaHora(conflicto.existente.actualizada)}
                {conflicto.existente.firma ? ' · firmada' : ''}
              </li>
              <li>
                En el archivo: {progresoLibreta(conflicto.nueva).porcentaje}% · modificada el {formatearFechaHora(conflicto.nueva.actualizada)}
                {conflicto.nueva.firma ? ' · firmada' : ''}
              </li>
            </ul>
            <p>¿Querés reemplazarla con la del archivo o conservar las dos?</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
