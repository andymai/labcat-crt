<div align="center">

# labcat-crt

[![CI](https://github.com/andymai/labcat-crt/actions/workflows/ci.yml/badge.svg)](https://github.com/andymai/labcat-crt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/andymai/labcat-crt)](./LICENSE)

A Lit web component that overlays phosphor-grille, scanlines, vignette, and halation onto any container or the full viewport.

[Playground](https://andymai.github.io/labcat-crt/) · [Core package](./packages/core) · [Playground source](./apps/playground)

</div>

---

Monorepo. See [`packages/core`](./packages/core) for the `@labcat/crt` library and [`apps/playground`](./apps/playground) for the interactive control surface deployed to GitHub Pages.

The component renders five hardware-referenced presets (`bvm`, `ntsc`, `lisa`, `vt220`, `ibm-5151`) as CSS-only overlays — no canvas, no WebGL. Realism scales with the container: grille pitch derives from container query units; scanline pitch from the viewport block-size, so a 200×150 widget and a 4K fullscreen both render a coherent CRT.

## Scope

To set expectations, this library deliberately does not:

- **Simulate phosphor decay, burn-in, or persistence over time** — effects are stateless and reset on each frame; there is no memory of prior luminance states
- **Use a GPU shader pipeline** — the overlay is CSS `backdrop-filter`, `repeating-linear-gradient`, and `box-shadow`; no WebGL, no canvas, no Three.js
- **Process or transform video or image content** — it overlays a cosmetic layer; it does not decode, re-encode, or manipulate the underlying media
- **Model per-dot phosphor triads at the pixel level** — grille pitch is a CSS pattern scaled to the container, not a pixel-accurate dot simulation
- **Work as a general signal-effects chain** — there is no composable filter graph; it is a single-element overlay with CSS custom property knobs

## Status

v0.1 in development. Not yet published. Consume locally via:

```
"@labcat/crt": "link:../labcat-crt/packages/core"
```

## License

MIT.
