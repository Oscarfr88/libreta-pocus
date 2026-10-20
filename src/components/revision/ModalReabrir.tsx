import { useEffect, useState } from 'react';
import { LockOpen } from 'lucide-react';
import type { Libreta } from '../../types';
import { formatearFechaHora } from '../../utils/fechas';
import { Modal } from '../ui/Modal';
import { Boton } from '../ui/Boton';

interface Props {
  libreta: Libreta;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
}

/** Reabrir una libreta firmada exige confirmación explícita: se borra la firma. */
export function ModalReabrir({ libreta, abierto, onCerrar, onConfirmar }: Props) {
  const [entendido, setEntendido] = useState(false);
  useEffect(() => {
    if (abierto) setEntendido(false);
  }, [abierto]);
  if (!libreta.firma) return null;

  return (
    <Modal
      abierto={abierto}
      titulo="¿Reabrir la libreta?"
      onCerrar={onCerrar}
      acciones={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="peligro" icono={<LockOpen size={18} />} disabled={!entendido} onClick={onConfirmar}>
            Reabrir y borrar la firma
          </Boton>
        </>
      }
    >
      <p>
        La libreta fue validada por <strong>{libreta.firma.instructor}</strong> el {formatearFechaHora(libreta.firma.fecha)}. Al
        reabrirla se puede volver a editar, pero <strong>se borra la firma</strong> y habrá que firmarla de nuevo.
      </p>
      <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
        <input type="checkbox" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-rose-700" />
        <span className="text-sm text-rose-900">Entiendo que se va a borrar la firma del instructor.</span>
      </label>
    </Modal>
  );
}
