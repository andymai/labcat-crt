import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const assets = [['src/glow.css', 'dist/glow.css']];

for (const [from, to] of assets) {
  const src = resolve(root, from);
  const dst = resolve(root, to);
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
}
