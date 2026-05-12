import { css } from 'lit';

/*
 * Animations are preset-locked: a consumer can't accidentally turn flicker on
 * for PVM via a CSS-var override because the keyframes aren't bound to that
 * preset's selector. Reduced-motion always wins. Disabled state pauses
 * animations, not unbinds them (so resume is instant).
 *
 * scanline-drift: ~30s slow vertical scroll of the scanline pattern. Sells
 *   "electron beam tracing" without distracting. Bound on amber, green, and
 *   consumer (any preset that isn't a calibrated broadcast monitor).
 *
 * phosphor-shimmer: ~120ms opacity wobble on the overlay layer. Cheated
 *   well below 60Hz refresh so it reads as analog drift instead of stuttery
 *   flashing. Consumer preset only.
 */
export const animationStyles = css`
  @keyframes crt-scanline-drift {
    from { background-position-y: 0px, 0, 0; }
    to   { background-position-y: 0px, 0, 60px; }
  }

  @keyframes crt-phosphor-shimmer {
    0%   { opacity: 1; }
    45%  { opacity: 0.97; }
    55%  { opacity: 1; }
    100% { opacity: 0.985; }
  }

  :host([preset='consumer']) .overlay,
  :host([preset='amber']) .overlay,
  :host([preset='green']) .overlay {
    animation: crt-scanline-drift 30s linear infinite;
  }

  :host([preset='consumer']) .overlay {
    animation:
      crt-scanline-drift 30s linear infinite,
      crt-phosphor-shimmer 120ms steps(2, end) infinite;
  }

  :host([disabled]) .overlay {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :host .overlay {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    :host,
    :host([fullscreen]) {
      display: none;
    }
  }

  @media print {
    :host,
    :host([fullscreen]) {
      display: none;
    }
  }
`;
