import { useCallback, useMemo, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, ClipboardCheck, Download, FileDown, Lock, LockOpen, Pencil, Search, Share2, Trash2, X } from 'lucide-react';
import type { FechaISO } from '../../types';
import { useLibretas } from '../../context/LibretasContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { usePDF } from '../../hooks/usePDF';
import { descargarJSON } from '../../utils/descargas';
import { nombreArchivoRespaldo, respaldoDeLibreta } from '../../utils/respaldo';
import { formatearFechaHora } from '../../utils/fechas';
import { competenciaCompleta, estadoLibreta, progresoLibreta } from '../../utils/progreso';
import { claveComparacion } from '../../utils/texto';
import { BarraSuperior } from '../BarraSuperior';
import { MenuAcciones } from '../MenuAcciones';
import { EtiquetaEstado } from '../EtiquetaEstado';
import { FormAlumno } from '../inicio/FormAlumno';
import { BarraProgreso } from '../ui/BarraProgreso';
import { Aviso } from '../ui/Aviso';
import { Boton } from '../ui/Boton';
import { Modal } from '../ui/Modal';
import { BloqueCompetencias } from './BloqueCompetencias';
import { ModalReabrir } from '../revision/ModalReabrir';

interface Props {
  id: string;
  navegar: (destino: string, opciones?: { reemplazar?: boolean }) => void;
}

export function LibretaView({ id, navegar }: Props) {
  const { libretas, dispatch } = useLibretas();
  const libreta = libretas.find((l) => l.id === id);
  const notificar = useNotificar();
  const pdf = usePDF(libreta);

  const [busqueda, setBusqueda] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [abiertos, setAbiertos] = useState<Set<string>>(() => {
    // Al entrar, se abre el primer bloque con competencias pendientes.
    const primero = libreta?.catalogo.find((b) => b.competencias.some((c) => !competenciaCompleta(libreta, c.id)));
    return new Set(primero ? [primero.id] : []);
  });
  const [editandoAlumno, setEditandoAlumno] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [reabriendo, setReabriendo] = useState(false);

  const cambiarFecha = useCallback(
    (competenciaId: string, indice: number, fecha: FechaISO | null) =>
      dispatch({ tipo: 'fecha', id, competenciaId, indice, fecha }),
    [dispatch, id],
  );

  // Bloques y competencias visibles según el buscador y el filtro "solo pendientes".
  const visibles = useMemo(() => {
    if (!libreta) return [];
    const q = claveComparacion(busqueda);
    return libreta.catalogo
      .map((b) => {
        const coincideBloque = q !== '' && claveComparacion(b.nombre).includes(q);
        const comps = b.competencias.filter(
          (c) =>
            (!soloPendientes || !competenciaCompleta(libreta, c.id)) &&
            (q === '' || coincideBloque || claveComparacion(c.nombre).includes(q)),
        );
        return { bloque: b, comps };
      })
      .filter((v) => v.comps.length > 0);
  }, [libreta, busqueda, soloPendientes]);

  if (!libreta) {
    return (
      <div className="min-h-screen">
        <BarraSuperior titulo="Libreta no encontrada" onVolver={() => navegar('/')} />
        <main className="mx-auto max-w-3xl px-4 pt-4">
          <Aviso tipo="atencion">Esta libreta no existe en este dispositivo. Puede que se haya eliminado.</Aviso>
        </main>
      </div>
    );
  }

  const p = progresoLibreta(libreta);
  const estado = estadoLibreta(libreta);
  const filtrando = busqueda.trim() !== '' || soloPendientes;
  const todosAbiertos = visibles.length > 0 && visibles.every((v) => abiertos.has(v.bloque.id));

  const alternar = (bloqueId: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(bloqueId)) s.delete(bloqueId);
      else s.add(bloqueId);
      return s;
    });

  return (
    <div className="min-h-screen pb-28">
      <BarraSuperior
        titulo={`${libreta.alumno.nombre} ${libreta.alumno.apellido}`}
        subtitulo={`${libreta.cursoNombre} · Año ${libreta.alumno.anio}`}
        onVolver={() => navegar('/')}
        acciones={
          <MenuAcciones
            items={[
              {
                etiqueta: 'Compartir PDF',
                icono: <Share2 size={18} />,
                onClick: pdf.compartir,
                oculto: !pdf.puedeCompartir,
              },
              {
                etiqueta: 'Exportar respaldo',
                icono: <Download size={18} />,
                onClick: () => {
                  const nombre = nombreArchivoRespaldo(libreta);
                  descargarJSON(nombre, respaldoDeLibreta(libreta));
                  notificar(`Respaldo descargado: ${nombre}`);
                },
              },
              {
                etiqueta: 'Editar mis datos',
                icono: <Pencil size={18} />,
                onClick: () => setEditandoAlumno(true),
                oculto: !!libreta.firma,
              },
              {
                etiqueta: 'Reabrir libreta',
                icono: <LockOpen size={18} />,
                onClick: () => setReabriendo(true),
                oculto: !libreta.firma,
              },
              {
                etiqueta: 'Eliminar libreta',
                icono: <Trash2 size={18} />,
                onClick: () => setConfirmandoBorrado(true),
                peligro: true,
              },
            ]}
          />
        }
      >
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold leading-none tabular-nums" aria-label={`Avance general: ${p.porcentaje}%`}>
            {p.porcentaje}%
          </p>
          <div className="min-w-0 flex-1">
            <div className="rounded-full bg-white/25 p-0.5">
              <BarraProgreso porcentaje={p.porcentaje} etiqueta={`Avance general: ${p.porcentaje}%`} completo={estado !== 'en-curso'} />
            </div>
            <p className="mt-1 truncate text-xs opacity-90">
              {p.competenciasCompletas}/{p.competenciasTotales} competencias · {p.practicasHechas}/{p.practicasTotales} prácticas
            </p>
          </div>
        </div>
      </BarraSuperior>

      <main className="mx-auto max-w-3xl space-y-3 px-3 pt-3 sm:px-4">
        {libreta.firma ? (
          <Aviso tipo="exito">
            <p className="font-semibold">
              <Lock size={14} className="mr-1 inline" aria-hidden />
              Libreta validada
            </p>
            <p>
              Firmada por {libreta.firma.instructor} el {formatearFechaHora(libreta.firma.fecha)}. Está en modo solo lectura.
            </p>
            <button type="button" onClick={() => setReabriendo(true)} className="mt-1 min-h-[44px] font-semibold underline underline-offset-2">
              Reabrir libreta
            </button>
          </Aviso>
        ) : (
          estado === 'lista' && (
            <Aviso tipo="exito">
              ¡Completaste todas las prácticas! Ya podés presentar la libreta a tu instructor para que la firme.
            </Aviso>
          )
        )}

        {/* Buscador y filtros */}
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-soft">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar competencia…"
              aria-label="Buscar competencia"
              className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-base outline-none focus:border-primario-texto focus:ring-2 focus:ring-primario/30"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Borrar búsqueda"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex min-h-[44px] cursor-pointer select-none items-center gap-2.5 px-1 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={soloPendientes}
                onChange={(e) => setSoloPendientes(e.target.checked)}
                className="h-5 w-5 rounded border-slate-400 accent-[rgb(var(--primario-texto))]"
              />
              Solo pendientes
            </label>
            {!filtrando && (
              <Boton
                variante="fantasma"
                className="px-2.5"
                icono={todosAbiertos ? <ChevronsDownUp size={18} /> : <ChevronsUpDown size={18} />}
                onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(libreta.catalogo.map((b) => b.id)))}
              >
                {todosAbiertos ? 'Contraer todo' : 'Expandir todo'}
              </Boton>
            )}
          </div>
        </div>

        {visibles.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            {soloPendientes && !busqueda ? '¡No quedan competencias pendientes!' : 'No hay competencias que coincidan con la búsqueda.'}
          </p>
        )}

        {visibles.map(({ bloque, comps }) => (
          <BloqueCompetencias
            key={bloque.id}
            libreta={libreta}
            bloque={bloque}
            visibles={comps}
            abierto={filtrando || abiertos.has(bloque.id)}
            onAlternar={() => alternar(bloque.id)}
            onCambiar={cambiarFecha}
          />
        ))}

        <p className="px-1 pt-1 text-center text-xs text-slate-500">
          <EtiquetaEstado estado={estado} /> · Los cambios se guardan automáticamente en este dispositivo.
        </p>
      </main>

      {/* Acción principal, siempre a mano */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <Boton icono={<FileDown size={18} />} onClick={pdf.descargar} disabled={pdf.generando} aria-label="Descargar PDF de la libreta">
            {pdf.generando ? 'Generando…' : 'PDF'}
          </Boton>
          <Boton variante="primario" className="flex-1" icono={<ClipboardCheck size={18} />} onClick={() => navegar(`/libreta/${id}/presentar`)}>
            {libreta.firma ? 'Ver validación' : 'Presentar al instructor'}
          </Boton>
        </div>
      </div>

      <ModalReabrir
        libreta={libreta}
        abierto={reabriendo}
        onCerrar={() => setReabriendo(false)}
        onConfirmar={() => {
          dispatch({ tipo: 'reabrir', id });
          setReabriendo(false);
          notificar('Libreta reabierta. Se borró la firma.');
        }}
      />

      <Modal
        abierto={editandoAlumno}
        titulo="Editar mis datos"
        onCerrar={() => setEditandoAlumno(false)}
        acciones={
          <>
            <Boton onClick={() => setEditandoAlumno(false)}>Cancelar</Boton>
            <Boton type="submit" form="editar-alumno" variante="primario">
              Guardar
            </Boton>
          </>
        }
      >
        <FormAlumno
          idFormulario="editar-alumno"
          inicial={libreta.alumno}
          onGuardar={(alumno) => {
            dispatch({ tipo: 'alumno', id, alumno });
            setEditandoAlumno(false);
          }}
        />
      </Modal>

      <Modal
        abierto={confirmandoBorrado}
        titulo="¿Eliminar esta libreta?"
        onCerrar={() => setConfirmandoBorrado(false)}
        acciones={
          <>
            <Boton onClick={() => setConfirmandoBorrado(false)}>Cancelar</Boton>
            <Boton
              variante="peligro"
              icono={<Trash2 size={18} />}
              onClick={() => {
                dispatch({ tipo: 'eliminar', id });
                navegar('/', { reemplazar: true });
              }}
            >
              Eliminar
            </Boton>
          </>
        }
      >
        <p>
          Se va a borrar de este dispositivo la libreta de <strong>{libreta.alumno.nombre} {libreta.alumno.apellido}</strong> ({libreta.cursoNombre}),
          con todas sus fechas{libreta.firma ? ' y la firma del instructor' : ''}. No se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
