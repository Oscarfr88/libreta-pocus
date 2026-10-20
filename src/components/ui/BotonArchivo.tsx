import { useRef, type ReactNode } from 'react';
import { Boton } from './Boton';

interface Props {
  acepta: string;
  onArchivo: (archivo: File) => void;
  children: ReactNode;
  icono?: ReactNode;
  variante?: 'primario' | 'secundario';
  bloque?: boolean;
  disabled?: boolean;
  /** Etiqueta accesible del selector de archivo. */
  etiqueta?: string;
}

/** Botón que abre el selector de archivos del dispositivo. */
export function BotonArchivo({ acepta, onArchivo, children, icono, variante = 'secundario', bloque, disabled, etiqueta }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Boton variante={variante} icono={icono} bloque={bloque} disabled={disabled} onClick={() => input.current?.click()}>
        {children}
      </Boton>
      <input
        ref={input}
        type="file"
        accept={acepta}
        aria-label={etiqueta ?? (typeof children === 'string' ? children : 'Elegir archivo')}
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = '';
          if (archivo) onArchivo(archivo);
        }}
      />
    </>
  );
}
