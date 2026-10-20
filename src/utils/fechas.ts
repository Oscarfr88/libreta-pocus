import type { FechaISO } from '../types';

const dos = (n: number) => String(n).padStart(2, '0');

/** Fecha de hoy en hora local, como 'aaaa-mm-dd'. */
export function hoyISO(d: Date = new Date()): FechaISO {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** true si el texto es una fecha de calendario real con formato 'aaaa-mm-dd'. */
export function esFechaISOValida(s: unknown): s is FechaISO {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, d] = s.split('-').map(Number);
  const f = new Date(a, m - 1, d);
  return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d;
}

/** true si la fecha es posterior a hoy. */
export function esFutura(iso: FechaISO, hoy: FechaISO = hoyISO()): boolean {
  return iso > hoy;
}

/** 'aaaa-mm-dd' → 'dd/mm/aaaa' (cadena vacía si no hay fecha). */
export function formatearFecha(iso: FechaISO | null | undefined): string {
  if (!iso || !esFechaISOValida(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Fecha y hora ISO completa → 'dd/mm/aaaa' en hora local. */
export function formatearFechaHora(isoCompleta: string): string {
  const d = new Date(isoCompleta);
  if (Number.isNaN(d.getTime())) return '';
  return formatearFecha(hoyISO(d));
}
