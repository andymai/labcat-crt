import { css } from 'lit';

/*
 * Animations are preset-locked (bound to preset selectors, not CSS vars) so
 * consumers can't accidentally turn flicker on for PVM. The drift distance
 * is calc(var(--crt-pitch) * 20) so the line-rate the user perceives is
 * identical across viewport sizes — a small overlay drifts the same number
 * of pitches per second as a 4K fullscreen one.
 */
export const animationStyles = css`
  @keyframes crt-scanline-drift {
    from { background-position-y: 0px, 0, 0; }
    to   { background-position-y: 0px, 0, calc(var(--crt-pitch) * 20); }
  }

  @keyframes crt-phosphor-shimmer {
    0%   { opacity: 1; }
    45%  { opacity: 0.97; }
    55%  { opacity: 1; }
    100% { opacity: 0.985; }
  }

  :host([preset='consumer']) .overlay,
  :host([preset='amber']) .overlay,
  :host([preset='green']) .overlay,
  :host([preset='p4-white']) .overlay {
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
