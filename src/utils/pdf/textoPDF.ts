// Las fuentes estándar del PDF (Helvetica) usan la codificación WinAnsi: cubren el español
// completo (tildes, ñ, ü, ¿, ¡, º) pero no cualquier carácter Unicode. Este paso evita símbolos rotos.

const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const REEMPLAZOS: Record<string, string> = {
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  ı: 'i',
  '′': "'",
  '″': '"',
  '‐': '-',
  '‑': '-',
  '−': '-',
  '́': '´', // acento combinado suelto
};

/** Texto listo para Helvetica/WinAnsi: NFC, sin tabulaciones y con equivalentes para lo no soportado. */
export function textoPDF(s: string): string {
  return [...s.normalize('NFC').replace(/\t/g, ' ')]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      if (REEMPLAZOS[ch]) return REEMPLAZOS[ch];
      if ((c >= 0x20 && c < 0x7f) || (c >= 0xa0 && c <= 0xff) || ch === '\n' || WINANSI_EXTRA.includes(ch)) return ch;
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (base && [...base].every((b) => b.codePointAt(0)! < 0x100)) return base;
      return c < 0x20 ? '' : '?';
    })
    .join('');
}
