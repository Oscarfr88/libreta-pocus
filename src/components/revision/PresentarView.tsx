import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, CircleDashed, Eraser, FileDown, Lock, LockOpen, PenLine, Users } from 'lucide-react';
import type { FechaISO } from '../../types';
import { useConfig } from '../../context/ConfigContext';
import { useLibretas } from '../../context/LibretasContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { usePDF } from '../../hooks/usePDF';
import { textoValidacion } from '../../data/configuracionInicial';
import { formatearFecha, formatearFechaHora, hoyISO } from '../../utils/fechas';
import { libretaCompleta, progresoBloque, progresoLibreta } from '../../utils/progreso';
import { BarraSuperior } from '../BarraSuperior';
import { BloqueCompetencias } from '../libreta/BloqueCompetencias';
import { Tarjeta } from '../ui/Tarjeta';
import { Aviso } from '../ui/Aviso';
import { Boton } from '../ui/Boton';
import { Modal } from '../ui/Modal';
import { BarraProgreso } from '../ui/BarraProgreso';
import { CanvasFirma, type ManejadorFirma } from './CanvasFirma';
import { ModalReabrir } from './ModalReabrir';

interface Props {
  id: string;
  navegar: (destino: string, opciones?: { reemplazar?: boolean }) => void;
}

export function PresentarView({ id, navegar }: Props) {
  const { config } = useConfig();
  const { libretas, dispatch } = useLibretas();
  const notificar = useNotificar();
  const libreta = libretas.find((l) => l.id === id);

  // Bloques cerrados al entrar: el resumen de arriba lleva a cada uno.
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const [instructor, setInstructor] = useState('');
  const [tieneFirma, setTieneFirma] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [reabriendo, setReabriendo] = useState(false);
  const firma = useRef<ManejadorFirma>(null);
  const pdf = usePDF(libreta);

  const cambiarFecha = useCallback(
    (competenciaId: string, indice: number, fecha: FechaISO | null) => dispatch({ tipo: 'fecha', id, competenciaId, indice, fecha }),
    [dispatch, id],
  );

  if (!libreta) {
    return (
      <div className="min-h-screen">
        <BarraSuperior titulo="Libreta no encontrada" onVolver={() => navegar('/')} />
        <main className="mx-auto max-w-3xl px-4 pt-4">
          <Aviso tipo="atencion">Esta libreta no existe en este dispositivo.</Aviso>
        </main>
      </div>
    );
  }

  const p = progresoLibreta(libreta);
  const completa = libretaCompleta(libreta);
  const faltantes = p.practicasTotales - p.practicasHechas;
  const sinInstructores = config.instructores.length === 0;
  const puedeFirmar = completa && !libreta.firma && !!instructor && tieneFirma;
  const alumno = `${libreta.alumno.nombre} ${libreta.alumno.apellido}`;

  const firmar = () => {
    const imagen = firma.current?.aPNG();
    if (!imagen || !puedeFirmar) return;
    dispatch({ tipo: 'firmar', id, firma: { instructor, imagen, fecha: new Date().toISOString() } });
    setConfirmando(false);
    notificar('Libreta validada y firmada.');
    navegar(`/libreta/${id}`, { reemplazar: true });
  };

  const alternar = (bloqueId: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(bloqueId)) s.delete(bloqueId);
      else s.add(bloqueId);
      return s;
    });

  return (
    <div className="min-h-screen pb-16">
      <BarraSuperior titulo="Presentación al instructor" subtitulo={`${alumno} · ${libreta.cursoNombre}`} onVolver={() => navegar(`/libreta/${id}`)} />

      <main className="mx-auto max-w-3xl space-y-4 px-3 pt-4 sm:px-4">
        <Tarjeta titulo="Datos de la libreta">
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Alumno</dt>
            <dd className="font-semibold text-slate-900">{alumno}</dd>
            <dt className="text-slate-500">Curso</dt>
            <dd className="text-slate-900">
              {libreta.cursoNombre} · Año {libreta.alumno.anio}
            </dd>
            <dt className="text-slate-500">Avance</dt>
            <dd className="text-slate-900">
              {p.porcentaje}% · {p.competenciasCompletas}/{p.competenciasTotales} competencias
            </dd>
          </dl>
          <div className="mt-3">
            <BarraProgreso porcentaje={p.porcentaje} etiqueta={`Avance: ${p.porcentaje}%`} completo={completa} />
          </div>
          {!completa && !libreta.firma && (
            <Aviso tipo="atencion" className="mt-3">
              Faltan {faltantes} práctica(s) en {p.competenciasTotales - p.competenciasCompletas} competencia(s). La firma se habilita cuando
              todas las competencias tengan sus {libreta.practicasRequeridas} fechas.
            </Aviso>
          )}
        </Tarjeta>

        <Tarjeta titulo="Resumen por bloque" subtitulo={libreta.firma ? undefined : 'Tocá un bloque para revisar las fechas. El instructor puede corregirlas.'}>
          <ul className="divide-y divide-slate-100">
            {libreta.catalogo.map((b) => {
              const { completas, total } = progresoBloque(libreta, b);
              const ok = completas === total;
              return (
                <li key={b.id}>
                  <a
                    href={`#bloque-${b.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setAbiertos((prev) => new Set(prev).add(b.id));
                      setTimeout(() => document.getElementById(`seccion-${b.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }}
                    className="flex min-h-[44px] items-center gap-2.5 py-2 text-sm hover:bg-slate-50"
                  >
                    {ok ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-label="Completo" />
                    ) : (
                      <CircleDashed size={18} className="shrink-0 text-amber-600" aria-label="Pendiente" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{b.nombre}</span>
                    <span className={`shrink-0 tabular-nums ${ok ? 'text-emerald-700' : 'font-semibold text-amber-800'}`}>
                      {completas}/{total}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        <div className="space-y-3">
          {libreta.catalogo.map((b) => (
            <div key={b.id} id={`seccion-${b.id}`} className="scroll-mt-20">
              <BloqueCompetencias
                libreta={libreta}
                bloque={b}
                visibles={b.competencias}
                abierto={abiertos.has(b.id)}
                onAlternar={() => alternar(b.id)}
                onCambiar={cambiarFecha}
              />
            </div>
          ))}
        </div>

        <Tarjeta titulo="Validación final">
          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-800">
            <strong>{alumno}</strong>. {textoValidacion(config.textos.validacionFinal, libreta.cursoNombre)}
          </p>

          {libreta.firma ? (
            <div className="mt-4 space-y-3">
              <Aviso tipo="exito">
                <p className="font-semibold">
                  <Lock size={14} className="mr-1 inline" aria-hidden />
                  Libreta validada
                </p>
                <p>
                  Instructor responsable: {libreta.firma.instructor} · {formatearFechaHora(libreta.firma.fecha)}
                </p>
              </Aviso>
              <img src={libreta.firma.imagen} alt={`Firma de ${libreta.firma.instructor}`} className="mx-auto max-h-32 w-full max-w-md rounded-xl border border-slate-200 bg-white object-contain" />
              <div className="flex flex-wrap gap-2">
                <Boton variante="primario" icono={<FileDown size={18} />} onClick={pdf.descargar} disabled={pdf.generando}>
                  {pdf.generando ? 'Generando…' : 'Descargar PDF'}
                </Boton>
                <Boton variante="peligro" icono={<LockOpen size={18} />} onClick={() => setReabriendo(true)}>
                  Reabrir libreta
                </Boton>
              </div>
            </div>
          ) : sinInstructores ? (
            <div className="mt-4 space-y-3">
              <Aviso tipo="atencion">
                No hay instructores cargados en este dispositivo. Para poder firmar, cargá la lista de instructores (o importá el archivo de
                configuración del curso).
              </Aviso>
              <Boton variante="primario" icono={<Users size={18} />} onClick={() => navegar('/ajustes/instructores')}>
                Cargar instructores
              </Boton>
            </div>
          ) : (
            <fieldset disabled={!completa} className="mt-4 space-y-4 disabled:opacity-60">
              <legend className="sr-only">Firma del instructor</legend>
              {!completa && (
                <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Lock size={16} aria-hidden /> Disponible cuando la libreta esté completa.
                </p>
              )}
              <div>
                <label htmlFor="instructor" className="mb-1 block text-sm font-medium text-slate-700">
                  Instructor responsable
                </label>
                <select
                  id="instructor"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="block min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-primario-texto focus:ring-2 focus:ring-primario/30 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">Elegí tu nombre…</option>
                  {config.instructores.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-end justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700" id="etiqueta-firma">
                    Firma (con el dedo o el mouse)
                  </span>
                  <Boton
                    variante="fantasma"
                    className="min-h-[40px] px-2.5"
                    icono={<Eraser size={16} />}
                    disabled={!tieneFirma}
                    onClick={() => firma.current?.borrar()}
                  >
                    Borrar
                  </Boton>
                </div>
                <CanvasFirma ref={firma} deshabilitado={!completa} onCambio={setTieneFirma} etiqueta="Recuadro para la firma del instructor" />
                <p className="mt-1 text-xs text-slate-500">Fecha de validación: {formatearFecha(hoyISO())}</p>
              </div>

              <Boton variante="primario" bloque icono={<PenLine size={18} />} disabled={!puedeFirmar} onClick={() => setConfirmando(true)}>
                Confirmar y firmar
              </Boton>
              {completa && !puedeFirmar && (
                <p className="text-center text-xs text-slate-500">
                  {!instructor ? 'Elegí el instructor' : 'Dibujá la firma'} para continuar.
                </p>
              )}
            </fieldset>
          )}
        </Tarjeta>
      </main>

      <Modal
        abierto={confirmando}
        titulo="¿Confirmar la validación?"
        onCerrar={() => setConfirmando(false)}
        acciones={
          <>
            <Boton onClick={() => setConfirmando(false)}>Cancelar</Boton>
            <Boton variante="primario" icono={<PenLine size={18} />} onClick={firmar}>
              Firmar y validar
            </Boton>
          </>
        }
      >
        <p>
          <strong>{instructor}</strong> valida la libreta de <strong>{alumno}</strong> ({libreta.cursoNombre}) con fecha {formatearFecha(hoyISO())}.
        </p>
        <p className="mt-2">Después de firmar, la libreta queda en modo solo lectura.</p>
      </Modal>

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
    </div>
  );
}
