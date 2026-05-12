# @labcat/crt-demo

Visual snapshot host for `@labcat/crt`. Five routes:

- `/` — 2x2 preset gallery, all four presets side-by-side
- `/pvm/`, `/consumer/`, `/amber/`, `/green/` — one preset per route, identical reference content

The snapshot tests in `tests/presets.spec.ts` lock each route's rendered
output. Sub-pixel CSS effects diff differently across OS and font-renderer
combinations, so baselines must be regenerated from the same environment
they will run in.

## Regenerating snapshots

Linux is the canonical environment. Run:

```
pnpm exec playwright install chromium
pnpm test:update
```

For CI parity, do this inside the official Playwright Docker image:

```
docker run --rm -it -v "$(pwd):/work" -w /work/apps/demo \
  mcr.microsoft.com/playwright:v1.49.1-jammy \
  pnpm test:update
```

Commit the resulting files under `tests/__snapshots__/`. Out-of-band
local snapshots (macOS, Windows) are gitignored to prevent OS-specific
baselines from polluting the locked set.
