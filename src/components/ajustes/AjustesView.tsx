import type { ReactNode } from 'react';
import { BookOpen, ChevronRight, FileCog, Palette, ScrollText, Users } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { BarraSuperior } from '../BarraSuperior';
import { SeccionMembrete } from './SeccionMembrete';
import { SeccionTextos } from './SeccionTextos';
import { SeccionCursos } from './SeccionCursos';
import { SeccionInstructores } from './SeccionInstructores';
import { SeccionArchivo } from './SeccionArchivo';

interface Props {
  seccion?: string;
  navegar: (destino: string, opciones?: { reemplazar?: boolean }) => void;
}

const SECCIONES: Record<string, { titulo: string; icono: ReactNode }> = {
  membrete: { titulo: 'Membrete', icono: <Palette size={20} /> },
  textos: { titulo: 'Textos', icono: <ScrollText size={20} /> },
  cursos: { titulo: 'Cursos y competencias', icono: <BookOpen size={20} /> },
  instructores: { titulo: 'Instructores', icono: <Users size={20} /> },
  archivo: { titulo: 'Archivo de configuración', icono: <FileCog size={20} /> },
};

export function AjustesView({ seccion, navegar }: Props) {
  const { config } = useConfig();
  const actual = seccion && SECCIONES[seccion] ? seccion : undefined;

  if (actual) {
    return (
      <div className="min-h-screen pb-16">
        <BarraSuperior titulo={SECCIONES[actual].titulo} subtitulo="Ajustes" onVolver={() => navegar('/ajustes')} />
        <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
          {actual === 'membrete' && <SeccionMembrete />}
          {actual === 'textos' && <SeccionTextos />}
          {actual === 'cursos' && <SeccionCursos />}
          {actual === 'instructores' && <SeccionInstructores />}
          {actual === 'archivo' && <SeccionArchivo />}
        </main>
      </div>
    );
  }

  const conCatalogo = config.cursos.filter((c) => c.bloques.length > 0).length;
  const descripciones: Record<string, string> = {
    membrete: config.membrete.institucion || 'Logo, institución, color y pie de página',
    textos: 'Instrucciones y texto de la validación final',
    cursos: `${config.cursos.length} curso(s), ${conCatalogo} con competencias cargadas`,
    instructores: config.instructores.length ? `${config.instructores.length} instructor(es) cargado(s)` : 'Todavía no hay instructores cargados',
    archivo: 'Exportar o importar la configuración para distribuirla a los alumnos',
  };

  return (
    <div className="min-h-screen pb-10">
      <BarraSuperior titulo="Ajustes" subtitulo="Para la coordinación del curso" onVolver={() => navegar('/')} />
      <main className="mx-auto max-w-3xl px-4 pt-4">
        <nav aria-label="Secciones de ajustes" className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          {Object.entries(SECCIONES).map(([id, s]) => (
            <button
              key={id}
              type="button"
              onClick={() => navegar(`/ajustes/${id}`)}
              className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario-texto"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primario-claro text-primario-texto">{s.icono}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{s.titulo}</span>
                <span className="block truncate text-xs text-slate-500">{descripciones[id]}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-400" aria-hidden />
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
