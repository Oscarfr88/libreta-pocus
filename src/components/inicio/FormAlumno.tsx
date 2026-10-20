import { useState, type FormEvent, type ReactNode } from 'react';
import type { Alumno } from '../../types';
import { normalizarTexto } from '../../utils/texto';
import { Campo } from '../ui/Campo';

interface Props {
  inicial?: Alumno;
  idFormulario: string;
  onGuardar: (alumno: Alumno) => void;
  children?: ReactNode;
}

/** Nombre, apellido y año del alumno, con validación. */
export function FormAlumno({ inicial, idFormulario, onGuardar, children }: Props) {
  const anioActual = new Date().getFullYear();
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [apellido, setApellido] = useState(inicial?.apellido ?? '');
  const [anio, setAnio] = useState(String(inicial?.anio ?? anioActual));
  const [intentado, setIntentado] = useState(false);

  const n = normalizarTexto(nombre);
  const a = normalizarTexto(apellido);
  const anioNum = Number(anio);
  const anioValido = Number.isInteger(anioNum) && anioNum >= 2000 && anioNum <= anioActual + 1;
  const errores = {
    nombre: !n ? 'Completá tu nombre.' : undefined,
    apellido: !a ? 'Completá tu apellido.' : undefined,
    anio: !anioValido ? `Ingresá un año entre 2000 y ${anioActual + 1}.` : undefined,
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (errores.nombre || errores.apellido || errores.anio) return;
    onGuardar({ nombre: n, apellido: a, anio: anioNum });
  };

  return (
    <form id={idFormulario} onSubmit={enviar} noValidate className="space-y-3">
      <Campo
        id={`${idFormulario}-nombre`}
        etiqueta="Nombre"
        autoComplete="given-name"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={intentado ? errores.nombre : undefined}
      />
      <Campo
        id={`${idFormulario}-apellido`}
        etiqueta="Apellido"
        autoComplete="family-name"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        error={intentado ? errores.apellido : undefined}
      />
      <Campo
        id={`${idFormulario}-anio`}
        etiqueta="Año del curso"
        inputMode="numeric"
        maxLength={4}
        value={anio}
        onChange={(e) => setAnio(e.target.value.replace(/\D/g, ''))}
        error={intentado ? errores.anio : undefined}
      />
      {children}
    </form>
  );
}
