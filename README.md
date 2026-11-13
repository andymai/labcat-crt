<div align="center">

# labcat-crt

[![CI](https://github.com/andymai/labcat-crt/actions/workflows/ci.yml/badge.svg)](https://github.com/andymai/labcat-crt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/andymai/labcat-crt)](./LICENSE)

A Lit web component that puts a CRT screen effect over any element or the full page: scanlines, vignette, grain, and halation. It uses only CSS, with no canvas or WebGL.

[Playground](https://andymai.github.io/labcat-crt/) · [Core package](./packages/core) · [Playground source](./apps/playground)

</div>

---

This repo is a monorepo. [`packages/core`](./packages/core) holds the `@labcat/crt` library. [`apps/playground`](./apps/playground) holds the interactive playground, and GitHub Pages hosts it.

The component has five presets based on real hardware: `bvm`, `ntsc`, `lisa`, `vt220`, and `ibm-5151`. Each preset is a CSS-only overlay, with no canvas and no WebGL. The effect scales with the size of the overlay. The grille pitch comes from container query units, and the scanline pitch comes from the viewport block-size. Thus the overlay draws a consistent CRT pattern on a 200×150 widget and on a 4K full screen.

## Scope

To set expectations, this library deliberately does not:

- **Simulate phosphor decay, burn-in, or persistence over time.** The effects have no state and reset on each frame. They keep no memory of earlier luminance.
- **Use a GPU shader pipeline.** The overlay uses CSS `backdrop-filter` and `repeating-linear-gradient`, and the halation uses `text-shadow`. It uses no WebGL, no canvas, and no Three.js.
- **Process or transform video or image content.** It puts a cosmetic layer over the content. It does not decode, re-encode, or change the media below it.
- **Model per-dot phosphor triads at the pixel level.** The grille is a CSS pattern that scales with the overlay. It is not a pixel-accurate simulation of each dot.
- **Work as a general signal-effects chain.** It has no filter graph that you can compose. It is one overlay element, and you adjust it with CSS custom properties.

## Status

Version 0.1.0 is in development. Install it from a local clone next to your project, with this dependency in your `package.json`:

```
"@labcat/crt": "link:../labcat-crt/packages/core"
```

## License

[MIT](./LICENSE).
