import { defineConfig } from 'astro/config';

/*
 * GitHub Pages serves at https://<user>.github.io/<repo>/. `base` prefixes all
 * built asset URLs so they resolve under the subpath. Drop the base (or set to
 * '/') if a custom domain ever lands at the apex.
 */
export default defineConfig({
  site: 'https://andymai.github.io',
  base: '/labcat-crt',
  output: 'static',
  vite: {
    optimizeDeps: {
      include: ['@labcat/crt'],
    },
  },
});
