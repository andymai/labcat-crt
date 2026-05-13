import { css } from 'lit';

/*
 * Size-aware realism: grille pitch derives from the host's container width
 * (cqi); scanline pitch falls back to the small viewport block-size (svb).
 * `container-type: inline-size` (rather than `size`) deliberately avoids
 * block-direction size containment — under `size`, the host's intrinsic
 * height ignores descendants, which clamps the box to any explicit
 * min-height and lets tall content visually overflow below the painted
 * overlay layer.
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
    container-type: inline-size;

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

  /* Content wrapper: target of the SVG filter chain at fidelity ≥ high.
     z-index keeps it below .overlay (which paints scanlines on top, crisp
     and unfiltered — bloom on gradient layers would muddy them). */
  .content {
    position: relative;
    z-index: 0;
  }

  /* SVG filter defs container — must be in the DOM for filter URLs to
     resolve, but occupies no layout space. */
  .crt-filters {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /* Brightness-aware bloom on slotted content at fidelity ≥ high.
     isolation: isolate scopes the blend-mode inside the screen composite
     of the SVG filter so it can't bleed into ancestor stacking contexts. */
  :host([fidelity='high']) .content,
  :host([fidelity='max']) .content {
    filter: url(#crt-bloom);
    isolation: isolate;
  }

  /* Consumer preset gets raster-level chromatic aberration on top of
     bloom. PVM was an RGB monitor with perfect convergence; monochrome
     terminals had a single phosphor so the concept doesn't apply. */
  :host([fidelity='high'][preset='consumer']) .content,
  :host([fidelity='max'][preset='consumer']) .content {
    filter: url(#crt-bloom) url(#crt-aberration);
  }

  /* Fidelity 'max': subtle screen curvature for every preset.
     Slight pitch (rotateX) reads as a CRT tube without warping individual
     pixels — feDisplacementMap-based barrel was overkill for the effect. */
  :host([fidelity='max']) .content {
    transform: perspective(800px) rotateX(0.4deg);
    transform-origin: center top;
  }

  /* Consumer preset at 'max' also picks up NTSC composite artifacts. */
  :host([fidelity='max'][preset='consumer']) .content {
    filter: url(#crt-bloom) url(#crt-aberration) url(#crt-ntsc);
  }

  /* Reduced-motion / reduced-transparency: silently fall back to standard.
     Same CSS rule for both since both signal "less visual noise please". */
  @media (prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce) {
    :host([fidelity='high']) .content,
    :host([fidelity='max']) .content {
      filter: none;
      transform: none;
    }
  }
`;
