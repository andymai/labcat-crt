# @labcat/crt

A `<crt-overlay>` web component. Renders phosphor scanlines, aperture
grille, vignette, and halation onto its slotted content or onto the full
viewport. Five presets: Sony PVM, NTSC consumer TV, VT220 amber, IBM 5151
green, P4 white-phosphor PC monitor.

- **2.4 KB gzip** when Lit is already on the page, **7.95 KB** standalone.
- Framework-agnostic (Lit web component). Drop into Astro, vanilla HTML,
  React, Vue, anything that renders a custom element.
- Halation is opt-in per element, not per container. Tag bright text with
  `class="crt-glow"`; everything else gets only the structural overlay.
- Respects `prefers-reduced-motion`, `forced-colors`, and `print`.
- 31 vitest specs + Playwright snapshot lock per preset.

## Install

```
pnpm add @labcat/crt
```

(Not yet published. Until then, link locally with
`"@labcat/crt": "link:../labcat-crt/packages/core"`.)

## Quick start

### Per-container

```html
<script type="module">
  import '@labcat/crt';
</script>
<link rel="stylesheet" href="@labcat/crt/glow.css" />

<crt-overlay preset="pvm">
  <h1 class="crt-glow">labcat.dev</h1>
  <p>regular paragraphs get the structural overlay only.</p>
  <code class="crt-glow">npm install @labcat/crt</code>
</crt-overlay>
```

### Fullscreen

```html
<crt-overlay fullscreen preset="pvm"></crt-overlay>
```

The element is empty in fullscreen mode. It paints over the viewport.
Halation reaches any `.crt-glow` element anywhere on the page because the
component publishes the halation CSS vars to `document.documentElement`.

## API

### Attributes

| Attribute    | Type    | Default | Description                                                                                  |
| ------------ | ------- | ------- | -------------------------------------------------------------------------------------------- |
| `preset`     | string  | `pvm`   | One of `pvm`, `consumer`, `amber`, `green`, `p4-white`.                                      |
| `fullscreen` | boolean | `false` | When set, the overlay covers the viewport. Slot is hidden.                                   |
| `disabled`   | boolean | `false` | Turns the effect off without unmounting. Animations pause cleanly so re-enabling is instant. |

The component does not own persistence. To remember an enabled/disabled
state across page loads, set `disabled` from your own localStorage hook
before paint:

```html
<script>
  // run before <crt-overlay> upgrades
  if (localStorage.getItem('crt') === 'off') {
    document.querySelector('crt-overlay')?.setAttribute('disabled', '');
  }
</script>
```

### Presets

| Preset     | Archetype                          | Animations             | Aberration | Grille          |
| ---------- | ---------------------------------- | ---------------------- | ---------- | --------------- |
| `pvm`      | Sony PVM/BVM broadcast monitor     | none                   | none       | RGB aperture    |
| `consumer` | Generic NTSC consumer TV           | scanline drift, 60Hz shimmer | sub-pixel  | RGB shadow-mask |
| `amber`    | DEC VT220 amber monochrome terminal | scanline drift        | none       | none            |
| `green`    | IBM 5151 P31 green monochrome       | scanline drift        | none       | none            |
| `p4-white` | Early-80s mono PC monitor (Apple Lisa, IBM PC mono adapter, Tandy CM-1) | scanline drift | none | none |

### CSS properties

Every visual layer is driven by a CSS variable. Override at the host to
tweak any preset:

```html
<crt-overlay preset="pvm" style="--crt-scanline-alpha: 0.3"></crt-overlay>
```

Or disable an individual layer entirely:

```html
<crt-overlay preset="pvm" style="--crt-grille: none"></crt-overlay>
```

| Variable                  | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `--crt-noise`             | Phosphor noise data-URL (`url(...)` or `none`).        |
| `--crt-grille`            | Aperture grille gradient (`gradient(...)` or `none`).  |
| `--crt-scanlines`         | Scanline gradient (`gradient(...)` or `none`).         |
| `--crt-vignette`          | Vignette radial gradient.                              |
| `--crt-corner-warm`       | Warm corner chromatic fringe.                          |
| `--crt-corner-cool`       | Cool corner chromatic fringe.                          |
| `--crt-gamma-contrast`    | `backdrop-filter` contrast multiplier (default 1).     |
| `--crt-gamma-brightness`  | `backdrop-filter` brightness multiplier (default 1).   |
| `--crt-gamma-saturate`    | `backdrop-filter` saturation multiplier (default 1).   |
| `--crt-glow-color`        | Halation color. Defaults to `currentColor`.            |
| `--crt-glow-shadow`       | Composed text-shadow stack for `.crt-glow`. Don't override directly; use `--crt-glow-color` and your own preset CSS file. |
| `--crt-aberration-shadow` | Sub-pixel chromatic aberration shadow stack.           |
| `--crt-z`                 | z-index in fullscreen mode (default `9999`).           |

### Halation

The component publishes `--crt-glow-shadow` and `--crt-aberration-shadow`
as CSS variables. The companion stylesheet `@labcat/crt/glow.css` binds
them to the `.crt-glow` class:

```css
.crt-glow {
  text-shadow:
    var(--crt-aberration-shadow, 0 0 0 transparent),
    var(--crt-glow-shadow, none);
}
```

Import it once in your app:

```js
import '@labcat/crt/glow.css';
```

Then tag any element that should glow:

```html
<h1 class="crt-glow">bright headline</h1>
<code class="crt-glow">bright inline</code>
```

`.crt-glow` is inert when no `<crt-overlay>` is mounted (the vars
default to `none`), so it's safe to ship the class globally.

## Accessibility

- `prefers-reduced-motion: reduce` disables all animations.
- `forced-colors: active` hides the overlay (Windows High Contrast Mode
  needs to win unmodified).
- `@media print` hides the overlay (no scanlines on paper).

## Browser support

Evergreen browsers from 2023+. The hard floor is `color-mix()` in CSS
(Safari 16.2, Dec 2022; Firefox 113, May 2023; Chromium 111, Mar 2023).
No polyfills.

## Not in scope

Things we deliberately don't ship, and why:

- **Barrel/curvature distortion.** CSS `transform: perspective()` breaks
  click coordinates and stacking. SVG `feDisplacementMap` blurs text on
  most browsers. A canvas/WebGL backend is the only correct approach but
  would dwarf the rest of the library. Reserved for v2.
- **Roll bar, sweep line, glitch shake.** All read as "broken signal"
  rather than "CRT character." Pro monitors didn't do this; consumer
  presets land closer to nostalgic TV without going full malfunction.
- **Phosphor afterglow trails.** A real artifact, but pulling it off
  without breaking subpixel readability requires a separate compositor
  pass (filter: blur on a clone, or a shader). Reserved for v2.
- **Per-effect enable toggles.** The CSS-var system already lets a
  consumer disable any individual layer (`style="--crt-grille: none"`).
  Adding parallel `enable-grille` attributes would double the API
  surface for no new capability.

## Local development

```
pnpm install
pnpm build       # vite + tsc + asset copy
pnpm test        # vitest in headless chromium
pnpm typecheck
pnpm size        # size-limit budgets
pnpm cem         # regenerate custom-elements.json
```

Demo site lives at `../../apps/demo`. Playwright snapshot baselines are
checked into `apps/demo/tests/presets.spec.ts-snapshots/` and are
canonical on Linux only; see `apps/demo/README.md` for the Docker
regeneration recipe.

## License

MIT.
