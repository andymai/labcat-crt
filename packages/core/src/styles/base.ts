import { css } from 'lit';

/*
 * Structural + always-on layers.
 *
 * The overlay composes up to three background images (noise + grille +
 * scanlines) plus an ::after pseudo for vignette and corner chromatic fringe.
 * Each layer is driven by a CSS variable so presets can set or unset
 * individual layers (e.g. monochrome presets disable the aperture grille
 * with --crt-grille: none).
 *
 * Halation lives on the host as CSS variables (--crt-glow-shadow,
 * --crt-aberration-shadow). The companion glow.css binds them to .crt-glow.
 */
export const baseStyles = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;

    /* Halation vars are composed from glow + aberration parts so a preset
       can tune one without rewriting the other. Defaults are a tight bloom
       with no aberration; preset rules override per archetype. */
    --crt-glow-color: currentColor;
    --crt-glow-shadow:
      0 0 0.5px var(--crt-glow-color),
      0 0 4px color-mix(in srgb, var(--crt-glow-color) 70%, transparent),
      0 0 14px color-mix(in srgb, var(--crt-glow-color) 30%, transparent);
    --crt-aberration-shadow: 0 0 0 transparent;
  }

  :host([fullscreen]) {
    display: contents;
  }

  :host([fullscreen]) ::slotted(*) {
    display: none;
  }

  .overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;

    background-image:
      var(--crt-noise, none),
      var(--crt-grille, none),
      var(--crt-scanlines, none);
    background-size:
      var(--crt-noise-size, 180px 180px),
      auto,
      auto;
    background-repeat: repeat, repeat, repeat;

    -webkit-backdrop-filter:
      contrast(var(--crt-gamma-contrast, 1))
      brightness(var(--crt-gamma-brightness, 1))
      saturate(var(--crt-gamma-saturate, 1));
    backdrop-filter:
      contrast(var(--crt-gamma-contrast, 1))
      brightness(var(--crt-gamma-brightness, 1))
      saturate(var(--crt-gamma-saturate, 1));
  }

  .overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      var(--crt-corner-warm, transparent),
      var(--crt-corner-cool, transparent),
      var(--crt-vignette, transparent);
  }

  :host([fullscreen]) .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--crt-z, 9999);
  }

  :host([disabled]) .overlay {
    display: none;
  }
  :host([disabled]) {
    --crt-glow-shadow: none;
    --crt-aberration-shadow: 0 0 0 transparent;
  }
`;
