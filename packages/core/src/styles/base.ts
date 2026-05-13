import { css } from 'lit';

/*
 * Editorial restraint: every default is tuned so the effect reads as
 * atmosphere rather than a filter. Public strength vars let consumers
 * crank any individual effect.
 *
 * Size-aware: grille pitch derives from the host's container inline-size
 * (cqi); scanline pitch falls back to the small viewport block-size (svb).
 * `container-type: inline-size` (not `size`) avoids block-direction size
 * containment so the host grows with content.
 */
export const baseStyles = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;
    container-type: inline-size;

    --crt-lines: 480;
    --crt-triads: 480;

    /* Editorial defaults — overridable on the host. */
    --crt-scanline-strength: 0.22;
    --crt-vignette-strength: 0.16;
    --crt-glow-strength: 1;
    --crt-breathing-amplitude: 0.025;

    --crt-glow-color: currentColor;
    --crt-glow-shadow:
      0 0 0.03em var(--crt-glow-color),
      0 0 0.22em color-mix(in srgb, var(--crt-glow-color) calc(60% * var(--crt-glow-strength)), transparent),
      0 0 0.7em color-mix(in srgb, var(--crt-glow-color) calc(25% * var(--crt-glow-strength)), transparent);

    --crt-aberration-x: 0;
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

    /* Pitch floor is 3px because Safari's gradient rasterizer collapses
       sub-pixel stops into solid bands. */
    --crt-pitch: clamp(3px, 100cqb / var(--crt-lines), 6px);
    --crt-grille-pitch: clamp(3px, 100cqi / var(--crt-triads), 6px);
    --crt-noise-size: clamp(120px, 18cqmin, 360px);

    background-image:
      var(--crt-noise, none),
      var(--crt-grille, none),
      var(--crt-scanlines, none);
    background-size:
      var(--crt-noise-size) var(--crt-noise-size),
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
    background: var(--crt-vignette, transparent);
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
