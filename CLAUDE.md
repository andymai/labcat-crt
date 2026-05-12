# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm + Turbo monorepo. Node ≥ 22.12, pnpm 10.33.0 (pinned via `packageManager`). Two workspaces:

- `packages/core` — `@labcat/crt`, the publishable Lit web component. Vite library build → ESM only, Lit external. Vitest in real Chromium (Playwright provider, `browser.enabled: true`) — there is no JSDOM path.
- `apps/demo` — `@labcat/crt-demo`, an Astro site that hosts one route per preset (`/pvm/`, `/consumer/`, `/amber/`, `/green/`, `/p4-white/`) plus a gallery at `/`. Used as the host page for Playwright visual snapshot tests. Consumes core via `workspace:^`. **Don't add interactive routes here** — the routes are snapshot-locked and identical content is what makes preset diffs meaningful.
- `apps/playground` — `@labcat/crt-playground`, an Astro site with a single interactive page (`<playground-app>` Lit component) deployed to GitHub Pages at `https://andymai.github.io/labcat-crt/`. Astro `base: '/labcat-crt'` is critical — without it, asset URLs 404 under the subpath. No snapshot tests; UI is dynamic by design.

## Commands

All commands run from the repo root unless noted. Turbo handles cross-package ordering — never `cd` into a workspace just to run its task.

```
pnpm install              # frozen-lockfile in CI; never use --no-frozen-lockfile to "fix" lockfile drift
pnpm build                # vite + tsc + cem analyze (prebuild) across the graph
pnpm dev                  # core: vite watch; demo: astro dev. persistent task.
pnpm typecheck            # tsc --noEmit (core) + astro check (demo)
pnpm lint                 # biome check (no auto-fix)
pnpm lint:fix             # biome check --write
pnpm test                 # vitest in core only (filtered)
pnpm test:visual          # playwright in demo only (filtered) — requires Linux for canonical baselines
pnpm cem                  # regenerate packages/core/custom-elements.json
pnpm size                 # size-limit budgets on packages/core/dist
```

Single-test workflows (run from inside the package):

```
# core unit/component tests
cd packages/core && pnpm vitest run test/fullscreen-refcount.test.ts
cd packages/core && pnpm vitest run -t "publishes halation vars"   # by test name

# demo visual snapshots
cd apps/demo && pnpm playwright test tests/presets.spec.ts -g "pvm preset snapshot"
cd apps/demo && pnpm test:update                                   # regenerate baselines
```

Pre-commit (Husky): `lint-staged` (biome --write on changed files) + full `pnpm typecheck`. Don't bypass with `--no-verify` — typecheck failures here usually mean the cem manifest or build outputs are stale.

## Architecture

### The component is one element with three orthogonal axes

`<crt-overlay>` (`packages/core/src/crt-overlay.ts`) is the entire public surface. Three reflected attributes:

- `preset` — switches a block of CSS variable assignments in `styles/presets.ts`. Five archetypes (`pvm`, `consumer`, `amber`, `green`, `p4-white`). Adding a preset means: (a) extending the `CrtPreset` union in `crt-overlay.ts`, (b) adding a `:host([preset='...'])` block in `presets.ts`, (c) adding a route in `apps/demo/src/pages/`, (d) adding it to the snapshot test loop in `apps/demo/tests/presets.spec.ts`. The CSS-var system is the extension surface — never add per-effect boolean attributes (`enable-grille`, `enable-noise`, …); consumers already disable individual layers with `style="--crt-grille: none"`.
- `fullscreen` — `position: fixed; inset: 0` covering the viewport, slot hidden. Triggers the halation refcount described below.
- `disabled` — pauses animations without unmounting. Halation vars unpublish.

### Fullscreen halation crosses the shadow DOM via documentElement

The non-obvious bit. Halation (`--crt-glow-shadow`, `--crt-aberration-shadow`) needs to reach `.crt-glow` elements that live in light DOM, anywhere on the page — including outside any `<crt-overlay>` ancestor. The solution (`crt-overlay.ts:17-43`):

1. A module-private `Set<CrtOverlay>` tracks currently-connected fullscreen instances.
2. On connect/update, the instance reads its own computed halation vars and writes them onto `document.documentElement.style`.
3. On disconnect, the instance removes itself; when the Set is empty, the document-level vars are cleared.
4. Companion `glow.css` (shipped separately, imported once by the app) binds `--crt-glow-shadow` to `.crt-glow { text-shadow: ... }`.

It's a **Set, not a counter**: HMR can disconnect instances that never finished connecting, and an underflowing counter would leave vars stale. The `requestAnimationFrame` in `#registerFullscreen` is intentional — it lets the preset's CSS-var cascade settle before we read computed values; `updateComplete` races against attribute-change callers.

If you're tempted to make halation work in non-fullscreen mode the same way: don't. Per-container halation is by design scoped to the host's subtree (parent `:host` styles flow into shadow DOM children), and publishing global vars from every mounted instance would conflict.

### Three CSS modules, composed in order

`baseStyles` (structural layers + default vars) → `animationStyles` (motion gated by `prefers-reduced-motion`) → `presetStyles` (per-preset variable assignments override). Order matters: presets win because they're last. Accessibility cutouts live in `baseStyles`:

- `prefers-reduced-motion: reduce` → disable animations
- `forced-colors: active` → hide the overlay entirely (let Windows High Contrast Mode through)
- `@media print` → hide the overlay

When adding new effects, gate motion behind the existing media query rather than introducing a parallel mechanism.

### Build pipeline ordering

`packages/core` `build` script runs `prebuild` (cem analyze) → `vite build` → `tsc -p tsconfig.build.json`. Turbo declares `custom-elements.json` as an output of the `cem` task, so editing source invalidates the manifest cache. `vite.config.ts` has a small post-bundle plugin that copies `src/glow.css` into `dist/glow.css` after each build — it has to run in `closeBundle` because `emptyOutDir: true` wipes the dir first. Watch mode reseeds on every rebuild.

The package ships as ESM only with `lit` and `lit/*` marked external. Don't add CJS or UMD outputs — the size budgets assume external Lit.

### Size budgets are dual

`packages/core/package.json` `size-limit` declares two budgets against the same bundle:

- **Lit bundled** (~12 KB cap, currently ~7.95 KB) — what a vanilla HTML consumer pays.
- **Lit shared** (4 KB cap) — what a Lit-using app pays after dedup.

Both must pass. Adding a runtime dep means re-justifying both numbers; prefer CSS-var configurability or moving logic to a peer-provided stylesheet.

### Visual snapshots are Linux-canonical

Sub-pixel CSS effects (scanlines, halation, phosphor noise SVG) rasterize differently across font renderers, so `apps/demo/tests/presets.spec.ts-snapshots/` is locked to the Playwright Docker image (`mcr.microsoft.com/playwright:v1.49.1-jammy`). `playwright.config.ts` pins `maxDiffPixelRatio: 0.02` to tolerate font jitter while still catching real regressions, and `.gitignore` excludes `__snapshots__/macos/` and `__snapshots__/windows/` so out-of-band baselines can't leak in.

Regenerating baselines:

```
docker run --rm -it -v "$(pwd):/work" -w /work/apps/demo \
  mcr.microsoft.com/playwright:v1.49.1-jammy \
  pnpm test:update
```

Running `pnpm test:visual` locally outside that image will produce failing diffs from font rendering — don't commit those snapshots. The `Snapshots` GitHub workflow runs only when files under `packages/core/src`, `apps/demo/src`, the test dir, or the playwright/workflow configs change.

## TypeScript config

`tsconfig.base.json` is strict including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`. Decorators are enabled (`experimentalDecorators: true`, `useDefineForClassFields: false`) because Lit uses legacy decorator semantics — don't switch to TC39 decorators without verifying Lit support. Vitest's esbuild config in `packages/core/vitest.config.ts` mirrors these settings so test-time and build-time decorator behavior match.

## Lint/format

Biome 1.9.4 handles both. Single quotes, semicolons, trailing commas, 100-col, 2-space indent. Two rules promoted from warn to error: `useImportType` (always `import type` for type-only) and `useNodejsImportProtocol` (`node:fs`, not `fs`). `noExplicitAny` is `warn` — don't suppress; tighten the type.

## CI

`.github/workflows/ci.yml` runs on push to `main` and on PRs: install → lint → typecheck → build → core tests → size budget. `snapshots.yml` runs visual tests in the official Playwright container, conditional on relevant paths changing. `pages.yml` builds `apps/playground` and deploys it to GitHub Pages on push to `main` (or `workflow_dispatch`); uses OIDC-based `actions/deploy-pages` (`permissions: pages: write`, `id-token: write`) — no `gh-pages` branch involved. All three workflows pin pnpm 10.33.0 + Node 22.12; keep these aligned with the root `package.json`'s `packageManager` and `engines` fields.

## Playground architecture

`apps/playground/src/components/playground-app.ts` is the single Lit element that drives the UI. Key constraints embedded there:

- The `<crt-overlay>` lives in the page's **light DOM** (so its own slot stays user-authorable) and is projected into `<playground-app>`'s shadow DOM via `<slot>`. The app grabs the overlay reference from `slot.assignedElements()` and applies state to it directly — no querySelector wiring scripts. `slotchange` re-binds if the projection ever changes.
- Slider initial values are read live from `getComputedStyle(overlay)` rather than hard-coded per preset. This means the playground stays decoupled from `packages/core/src/styles/presets.ts` — adding a preset there doesn't require editing the playground.
- "Copy as HTML" only emits CSS-var overrides the user **explicitly touched** (tracked via the `overrides` Set). Untouched vars fall through to the preset's defaults, so the exported snippet is minimal.
