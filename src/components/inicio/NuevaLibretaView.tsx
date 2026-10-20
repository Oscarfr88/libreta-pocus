import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { useLibretas } from '../../context/LibretasContext';
import { contarCompetencias } from '../../utils/catalogo';
import { crearLibreta } from '../../utils/nuevaLibreta';
import { BarraSuperior } from '../BarraSuperior';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { Aviso } from '../ui/Aviso';
import { FormAlumno } from './FormAlumno';

interface Props {
  navegar: (destino: string, opciones?: { reemplazar?: boolean }) => void;
}

export function NuevaLibretaView({ navegar }: Props) {
  const { config } = useConfig();
  const { dispatch } = useLibretas();
  const conCatalogo = config.cursos.filter((c) => c.bloques.length > 0);
  const [cursoId, setCursoId] = useState<string | null>(conCatalogo.length === 1 ? conCatalogo[0].id : null);
  const [faltaCurso, setFaltaCurso] = useState(false);

  return (
    <div className="min-h-screen pb-10">
      <BarraSuperior titulo="Nueva libreta" onVolver={() => navegar('/')} />
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        <Tarjeta titulo="1. Elegí el curso">
          {conCatalogo.length === 0 && (
            <Aviso tipo="atencion" className="mb-3">
              Ningún curso tiene sus competencias cargadas todavía. Pedile a la coordinación del curso el archivo de
              configuración e importalo desde Ajustes.
            </Aviso>
          )}
          <fieldset>
            <legend className="sr-only">Curso</legend>
            <div className="space-y-2">
              {config.cursos.map((c) => {
                const disponible = c.bloques.length > 0;
                const elegido = cursoId === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex min-h-[56px] items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                      !disponible
                        ? 'cursor-not-allowed border-dashed border-slate-300 bg-slate-50'
                        : elegido
                          ? 'cursor-pointer border-primario-texto bg-primario-claro ring-1 ring-primario-texto'
                          : 'cursor-pointer border-slate-300 bg-white hover:border-primario-suave'
                    }`}
                  >
                    <input
                      type="radio"
                      name="curso"
                      value={c.id}
                      checked={elegido}
                      disabled={!disponible}
                      onChange={() => {
                        setCursoId(c.id);
                        setFaltaCurso(false);
                      }}
                      className="sr-only"
                    />
                    {elegido ? (
                      <CheckCircle2 size={22} className="shrink-0 text-primario-texto" aria-hidden />
                    ) : (
                      <Circle size={22} className="shrink-0 text-slate-300" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block font-semibold ${disponible ? 'text-slate-900' : 'text-slate-500'}`}>{c.nombre}</span>
                      <span className="block text-xs text-slate-500">
                        {disponible
                          ? `${c.bloques.length} bloques · ${contarCompetencias(c.bloques)} competencias`
                          : 'Sin competencias cargadas: todavía no se puede usar'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {faltaCurso && <p className="mt-2 text-sm text-rose-700">Elegí un curso para continuar.</p>}
        </Tarjeta>

        <Tarjeta titulo="2. Tus datos">
          <FormAlumno
            idFormulario="nueva-libreta"
            onGuardar={(alumno) => {
              const curso = config.cursos.find((c) => c.id === cursoId && c.bloques.length > 0);
              if (!curso) {
                setFaltaCurso(true);
                return;
              }
              const libreta = crearLibreta(curso, alumno);
              dispatch({ tipo: 'crear', libreta });
              navegar(`/libreta/${libreta.id}`, { reemplazar: true });
            }}
          />
        </Tarjeta>

        <Boton type="submit" form="nueva-libreta" variante="primario" bloque disabled={conCatalogo.length === 0}>
          Crear libreta
        </Boton>
      </main>
    </div>
  );
}
