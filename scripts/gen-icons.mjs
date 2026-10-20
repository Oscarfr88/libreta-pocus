// Genera los PNG de la app instalable a partir de src/assets/icon.svg
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'src/assets/icon.svg');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const targets = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32.png' },
];

for (const t of targets) {
  await sharp(src).resize(t.size, t.size).png().toFile(resolve(outDir, t.name));
  console.log('✔', t.name);
}

// Ícono "maskable" con margen de seguridad sobre el color de fondo
const pad = Math.round(512 * 0.12);
await sharp(src)
  .resize(512 - pad * 2, 512 - pad * 2)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#0e7490' })
  .png()
  .toFile(resolve(outDir, 'icon-maskable-512.png'));
console.log('✔ icon-maskable-512.png');
