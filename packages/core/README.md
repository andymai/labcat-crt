# @labcat/crt

A `<crt-overlay>` web component. It renders scanlines, vignette, grain,
and halation over its slotted content or over the full viewport. Five
presets: a Sony broadcast monitor, a home NTSC TV, the Apple Lisa white
phosphor, the DEC VT220 amber terminal, and the IBM 5151 green monitor.

- **2.4 KB gzip** when Lit is already on the page, **7.95 KB** standalone.
- Framework-agnostic (Lit web component). Drop into Astro, vanilla HTML,
  React, Vue, anything that renders a custom element.
- Halation is opt-in per element, not per container. Tag bright text with
  `class="crt-glow"`; everything else gets only the structural overlay.
- Respects `prefers-reduced-motion`, `forced-colors`, and `print`.
- Real-browser vitest specs (no JSDOM).

## Install

Install it from a local clone next to your project, with this
dependency in your `package.json`:

```
"@labcat/crt": "link:../labcat-crt/packages/core"
```

## Quick start

### Per-container

```html
<script type="module">
  import '@labcat/crt';
</script>
<link rel="stylesheet" href="@labcat/crt/glow.css" />

<crt-overlay preset="bvm">
  <h1 class="crt-glow">labcat.dev</h1>
  <p>regular paragraphs get the structural overlay only.</p>
  <code class="crt-glow">npm install @labcat/crt</code>
</crt-overlay>
```

### Fullscreen

```html
<crt-overlay fullscreen preset="bvm"></crt-overlay>
```

The element is empty in fullscreen mode. It paints over the viewport.
Halation reaches any `.crt-glow` element anywhere on the page because the
component publishes the halation CSS vars to `document.documentElement`.

## API

### Attributes

| Attribute    | Type    | Default | Description                                                                                  |
| ------------ | ------- | ------- | -------------------------------------------------------------------------------------------- |
| `preset`     | string  | `bvm`   | One of `bvm`, `ntsc`, `lisa`, `vt220`, `ibm-5151`.                                           |
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

| Preset          | Archetype                     | Look                                   | Animation      |
| --------------- | ----------------------------- | -------------------------------------- | -------------- |
| `bvm` (default) | Sony broadcast monitor        | cool-white reference, sharp scanlines  | none           |
| `ntsc`          | home NTSC receiver            | warm cast, deeper vignette, more grain | none           |
| `lisa`          | Apple Lisa P4 white phosphor  | neutral warm-white reading surface     | none           |
| `vt220`         | DEC VT220 amber terminal      | wider bloom                            | scanline drift |
| `ibm-5151`      | IBM 5151 green phosphor       | tighter scanlines                      | scanline drift |

No preset draws an aperture grille or chromatic aberration.

### CSS properties

Every visual layer is driven by a CSS variable. Override at the host to
tweak any preset:

```html
<crt-overlay preset="bvm" style="--crt-scanline-strength: 0.3"></crt-overlay>
```

Or turn a layer off, with a strength of 0:

```html
<crt-overlay preset="bvm" style="--crt-vignette-strength: 0"></crt-overlay>
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
  rather than "CRT character." Pro monitors did not do this. The `ntsc`
  preset comes closer to a nostalgic TV, but stops short of a fault.
- **Phosphor afterglow trails.** A real artifact, but pulling it off
  without breaking subpixel readability requires a separate compositor
  pass (filter: blur on a clone, or a shader). Reserved for v2.
- **Per-effect enable toggles.** The CSS-var system already lets a
  consumer turn off a layer (`style="--crt-vignette-strength: 0"`).
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

Playground site lives at `../../apps/playground` and is deployed to
GitHub Pages at <https://andymai.github.io/labcat-crt/>.

## License

MIT.
