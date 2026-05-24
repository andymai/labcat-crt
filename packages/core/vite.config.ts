import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/*
 * Copy hand-authored CSS that ships with the package but isn't part of the
 * JS bundle. Runs after each bundle so watch mode reseeds the file after
 * Vite's emptyOutDir wipe.
 */
function copyStaticAssets(): Plugin {
  const here = import.meta.dirname;
  const distDir = resolve(here, 'dist');
  const assets = [['src/glow.css', 'glow.css']] as const;
  return {
    name: 'labcat-crt:copy-static-assets',
    closeBundle() {
      mkdirSync(distDir, { recursive: true });
      for (const [from, to] of assets) {
        copyFileSync(resolve(here, from), resolve(distDir, to));
      }
    },
  };
}

export default defineConfig({
  plugins: [copyStaticAssets()],
  build: {
    target: 'es2022',
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: ['lit', /^lit\//],
      output: {
        assetFileNames: (asset) => {
          if (!asset.name) return '[name]';
          if (asset.name === 'glow.css') return 'glow.css';
          return asset.name;
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
    minify: false,
  },
});
