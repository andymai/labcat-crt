import { css } from 'lit';

/*
 * Size-aware realism: every visible feature derives from container query
 * units so one preset renders a "real" CRT at any viewport size. In
 * fullscreen mode the host is `display: contents` (no box) and cqb/cqi fall
 * back to the small viewport per spec — same "constant line count" feel,
 * no conditional formula.
 *
 * Halation vars (--crt-glow-shadow, --crt-aberration-shadow) are in em so
 * bloom scales with text size, matching how real phosphor bloom intensifies
 * with stroke width. glow.css binds them to .crt-glow.
 */
export const baseStyles = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;
    container-type: size;

    --crt-lines: 480;
    --crt-triads: 480;

    --crt-glow-color: currentColor;
    --crt-glow-shadow:
      0 0 0.03em var(--crt-glow-color),
      0 0 0.25em color-mix(in srgb, var(--crt-glow-color) 70%, transparent),
      0 0 0.875em color-mix(in srgb, var(--crt-glow-color) 30%, transparent);

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

    /* Declared on .overlay (not :host) because a container cannot query
       itself; cqb/cqi must resolve in a descendant.
       Pitch floor is 3px (not 1px or less) because Safari's gradient
       rasterizer collapses sub-pixel stops into solid bands — our
       gradients carry 7 stops per pitch, and the spacing has to stay
       above one device pixel for Safari to render scanlines as scanlines. */
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

    mix-blend-mode: var(--crt-blend-mode, normal);

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
