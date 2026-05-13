import { css } from 'lit';

/*
 * Drift distance is calc(var(--crt-pitch) * 20) so perceived line-rate is
 * identical across viewport sizes — a small overlay drifts the same number
 * of pitches per second as a 4K fullscreen one.
 *
 * Breathing: 8s ambient brightness/saturation pulse on the overlay's
 * backdrop-filter at ~2-3% amplitude. Below conscious perception but adds
 * an 'on, alive' feel; reduced-motion suppresses it.
 */
export const animationStyles = css`
  @keyframes crt-scanline-drift {
    from { background-position-y: 0px, 0, 0; }
    to   { background-position-y: 0px, 0, calc(var(--crt-pitch) * 20); }
  }

  @keyframes crt-breathing {
    0%, 100% {
      filter: brightness(calc(1 - var(--crt-breathing-amplitude) * 0.5))
              saturate(calc(1 - var(--crt-breathing-amplitude) * 0.4));
    }
    50% {
      filter: brightness(calc(1 + var(--crt-breathing-amplitude) * 0.5))
              saturate(calc(1 + var(--crt-breathing-amplitude) * 0.4));
    }
  }

  :host([preset='vt220']) .overlay,
  :host([preset='ibm-5151']) .overlay {
    animation: crt-scanline-drift 36s linear infinite;
  }

  :host(:not([disabled])) .overlay {
    animation-name: var(--crt-overlay-animations, none);
  }

  /* Breathing applies to the overlay's backdrop-filter independently of
     scanline-drift so both can run together. */
  :host(:not([disabled])) {
    animation: crt-breathing 8s ease-in-out infinite;
  }

  :host([disabled]) .overlay,
  :host([disabled]) {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :host .overlay,
    :host {
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
