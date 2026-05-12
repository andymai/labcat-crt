import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
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
