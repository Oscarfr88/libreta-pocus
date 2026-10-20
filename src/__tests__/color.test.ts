import { describe, expect, it } from 'vitest';
import { contraste, paletaPrimaria } from '../utils/color';

describe('paleta del color principal', () => {
  it.each(['#0e7490', '#ffeb3b', '#ffffff', '#000000', '#e11d48', '#a3e635'])('mantiene texto legible con %s', (hex) => {
    const p = paletaPrimaria(hex);
    expect(contraste(p.texto, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.sobre, p.primario)).toBeGreaterThanOrEqual(3);
  });
});
