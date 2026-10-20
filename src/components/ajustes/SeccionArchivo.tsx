import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { Configuracion } from '../../types';
import { useConfig } from '../../context/ConfigContext';
import { useNotificar } from '../../context/NotificacionesContext';
import { contarCompetencias } from '../../utils/catalogo';
import { descargarJSON } from '../../utils/descargas';
import { archivoDeConfiguracion, configuracionDesdeArchivo, nombreArchivoConfiguracion } from '../../utils/respaldo';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { BotonArchivo } from '../ui/BotonArchivo';
import { Modal } from '../ui/Modal';
import { Aviso } from '../ui/Aviso';

function Resumen({ config }: { config: Configuracion }) {
  const m = config.membrete;
  return (
    <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
      <dt className="text-slate-500">Institución</dt>
      <dd className="font-medium text-slate-900">{m.institucion || '—'}</dd>
      <dt className="text-slate-500">Logo</dt>
      <dd>{m.logo ? <img src={m.logo} alt="Logo" className="h-8 max-w-[160px] object-contain" /> : 'Sin logo'}</dd>
      <dt className="text-slate-500">Color</dt>
      <dd className="flex items-center gap-2">
        <span className="inline-block h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: m.colorPrimario }} />
        {m.colorPrimario}
      </dd>
      <dt className="text-slate-500">Cursos</dt>
      <dd>
        <ul>
          {config.cursos.map((c) => (
            <li key={c.id}>
              {c.nombre}: {c.bloques.length ? `${contarCompetencias(c.bloques)} competencias` : <span className="text-amber-800">sin competencias</span>}
            </li>
          ))}
          {config.cursos.length === 0 && <li>—</li>}
        </ul>
      </dd>
      <dt className="text-slate-500">Instructores</dt>
      <dd>{config.instructores.length}</dd>
    </dl>
  );
}

export function SeccionArchivo() {
  const { config, dispatch } = useConfig();
  const notificar = useNotificar();
  const [importada, setImportada] = useState<{ config: Configuracion; archivo: string } | null>(null);

  return (
    <>
      <Aviso tipo="info">
        El archivo de configuración reúne el membrete, los textos, los cursos con sus competencias y la lista de
        instructores. La coordinación lo exporta una vez y lo comparte con los alumnos, que lo importan en su teléfono.
      </Aviso>

      <Tarjeta titulo="Exportar" subtitulo="Descarga un archivo .json con la configuración actual.">
        <Resumen config={config} />
        <Boton
          variante="primario"
          className="mt-4"
          icono={<Download size={18} />}
          onClick={() => {
            const nombre = nombreArchivoConfiguracion(config);
            descargarJSON(nombre, archivoDeConfiguracion(config));
            notificar(`Configuración exportada: ${nombre}`);
          }}
        >
          Exportar configuración
        </Boton>
      </Tarjeta>

      <Tarjeta titulo="Importar" subtitulo="Reemplaza la configuración de este dispositivo. Las libretas no se modifican.">
        <BotonArchivo
          acepta=".json,application/json"
          icono={<Upload size={18} />}
          etiqueta="Elegir archivo de configuración"
          onArchivo={async (archivo) => {
            try {
              setImportada({ config: configuracionDesdeArchivo(await archivo.text(), config), archivo: archivo.name });
            } catch (e) {
              notificar((e as Error).message, 'error');
            }
          }}
        >
          Importar configuración
        </BotonArchivo>
      </Tarjeta>

      <Modal
        abierto={!!importada}
        titulo="¿Usar esta configuración?"
        onCerrar={() => setImportada(null)}
        acciones={
          <>
            <Boton onClick={() => setImportada(null)}>Cancelar</Boton>
            <Boton
              variante="primario"
              onClick={() => {
                if (importada) dispatch({ tipo: 'reemplazar', config: importada.config });
                setImportada(null);
                notificar('Configuración importada.');
              }}
            >
              Reemplazar configuración
            </Boton>
          </>
        }
      >
        {importada && (
          <div className="space-y-3">
            <p>
              Archivo <strong className="break-all">{importada.archivo}</strong>:
            </p>
            <Resumen config={importada.config} />
            <p className="text-xs text-slate-500">Las libretas guardadas en este dispositivo no cambian.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
