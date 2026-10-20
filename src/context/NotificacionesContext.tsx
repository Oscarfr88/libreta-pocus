import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

type Tipo = 'exito' | 'error';
interface Notificacion {
  id: number;
  texto: string;
  tipo: Tipo;
}

const Ctx = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

/** Mensajes breves al pie de la pantalla ("Respaldo exportado", etc.). */
export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Notificacion[]>([]);
  const siguiente = useRef(1);

  const notificar = useCallback((texto: string, tipo: Tipo = 'exito') => {
    const id = siguiente.current++;
    setLista((l) => [...l.slice(-2), { id, texto, tipo }]);
    setTimeout(() => setLista((l) => l.filter((n) => n.id !== id)), tipo === 'error' ? 7000 : 4000);
  }, []);

  return (
    <Ctx.Provider value={notificar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {lista.map((n) => (
          <div
            key={n.id}
            role={n.tipo === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-md animate-fade-in items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
              n.tipo === 'error' ? 'bg-rose-700' : 'bg-slate-900'
            }`}
          >
            {n.tipo === 'error' ? <XCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />}
            {n.texto}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useNotificar() {
  return useContext(Ctx);
}
