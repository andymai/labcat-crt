import { css, unsafeCSS } from 'lit';

/*
 * Two-tier declarations: host-level vars (glow, aberration, gamma, lines,
 * triads) must live on :host so halation publishing can read them via
 * getComputedStyle; gradient vars must live on .overlay because cqb/cqi
 * can't query their own container.
 *
 * Each scanline gradient carries a faint white peak at the lit-center stop;
 * combined with the dark valley stops the net luminance modulation across
 * one pitch is near-zero, closer to a real CRT than multiply-only overlays.
 */

const noiseSvg = (alpha: number) =>
  unsafeCSS(
    `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
  );

export const presetStyles = css`
  /* PVM: Sony BVM/PVM broadcast reference, 480 TVL × 480 lines. */
  :host,
  :host([preset='pvm']) {
    --crt-lines: 480;
    --crt-triads: 480;
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.98;
    --crt-gamma-saturate: 1.1;
    --crt-glow-color: currentColor;
  }
  :host([preset='pvm']) .overlay,
  :host(:not([preset])) .overlay {
    --crt-noise: ${noiseSvg(0.025)};
    --crt-grille: repeating-linear-gradient(
      to right,
      rgba(255, 80, 80, 0.06) 0,
      rgba(255, 80, 80, 0.06) calc(var(--crt-grille-pitch) / 3),
      rgba(80, 255, 80, 0.06) calc(var(--crt-grille-pitch) / 3),
      rgba(80, 255, 80, 0.06) calc(var(--crt-grille-pitch) * 2 / 3),
      rgba(80, 80, 255, 0.06) calc(var(--crt-grille-pitch) * 2 / 3),
      rgba(80, 80, 255, 0.06) var(--crt-grille-pitch)
    );
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.55) 0,
      rgba(0, 0, 0, 0.22) calc(var(--crt-pitch) * 0.2),
      rgba(0, 0, 0, 0) calc(var(--crt-pitch) * 0.4),
      rgba(255, 255, 255, 0.14) calc(var(--crt-pitch) * 0.5),
      rgba(0, 0, 0, 0) calc(var(--crt-pitch) * 0.6),
      rgba(0, 0, 0, 0.22) calc(var(--crt-pitch) * 0.8),
      rgba(0, 0, 0, 0.55) var(--crt-pitch)
    );
    --crt-corner-warm: radial-gradient(
      ellipse at center,
      transparent 70%,
      rgba(255, 120, 80, 0.04) 92%,
      transparent 100%
    );
    --crt-corner-cool: radial-gradient(
      ellipse at center,
      transparent 78%,
      rgba(80, 140, 255, 0.04) 100%
    );
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(0, 0, 0, 0.2) 100%
    );
  }

  /* Consumer NTSC: 320 TVL triads plus a horizontal interruption layer to
     read as a shadow mask rather than aperture grille. */
  :host([preset='consumer']) {
    --crt-lines: 480;
    --crt-triads: 320;
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.96;
    --crt-gamma-saturate: 1.04;
    --crt-glow-color: currentColor;
    --crt-aberration-x: 0.04em;
    --crt-aberration-shadow:
      var(--crt-aberration-x) 0 0 rgba(255, 80, 80, 0.25),
      calc(var(--crt-aberration-x) * -1) 0 0 rgba(80, 140, 255, 0.25);
  }
  :host([preset='consumer']) .overlay {
    --crt-noise: ${noiseSvg(0.04)};
    --crt-grille:
      repeating-linear-gradient(
        to right,
        rgba(255, 60, 60, 0.05) 0,
        rgba(255, 60, 60, 0.05) calc(var(--crt-grille-pitch) / 3),
        rgba(60, 255, 60, 0.05) calc(var(--crt-grille-pitch) / 3),
        rgba(60, 255, 60, 0.05) calc(var(--crt-grille-pitch) * 2 / 3),
        rgba(60, 60, 255, 0.05) calc(var(--crt-grille-pitch) * 2 / 3),
        rgba(60, 60, 255, 0.05) var(--crt-grille-pitch)
      ),
      repeating-linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.04) 0,
        rgba(0, 0, 0, 0.04) calc(var(--crt-pitch) * 0.5),
        transparent calc(var(--crt-pitch) * 0.5),
        transparent var(--crt-pitch)
      );
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.35) 0,
      rgba(0, 0, 0, 0.12) calc(var(--crt-pitch) * 0.2),
      rgba(0, 0, 0, 0) calc(var(--crt-pitch) * 0.4),
      rgba(255, 255, 255, 0.1) calc(var(--crt-pitch) * 0.5),
      rgba(0, 0, 0, 0) calc(var(--crt-pitch) * 0.6),
      rgba(0, 0, 0, 0.12) calc(var(--crt-pitch) * 0.8),
      rgba(0, 0, 0, 0.35) var(--crt-pitch)
    );
    --crt-corner-warm: radial-gradient(
      ellipse at center,
      transparent 65%,
      rgba(255, 120, 80, 0.04) 95%,
      transparent 100%
    );
    --crt-corner-cool: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(80, 140, 255, 0.09) 100%
    );
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 40%,
      rgba(0, 0, 0, 0.38) 100%
    );
  }

  /* Amber: VT220-style single-phosphor warm amber, 400 lines. */
  :host([preset='amber']) {
    --crt-lines: 400;
    --crt-triads: 480;
    --crt-gamma-contrast: 1.1;
    --crt-gamma-brightness: 0.97;
    --crt-gamma-saturate: 0.6;
    --crt-glow-color: #ffb43a;
    --crt-glow-shadow:
      0 0 0.03em var(--crt-glow-color),
      0 0 0.31em color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 1.125em color-mix(in srgb, var(--crt-glow-color) 35%, transparent);
  }
  :host([preset='amber']) .overlay {
    --crt-noise: ${noiseSvg(0.03)};
    --crt-grille: none;
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(20, 8, 0, 0.6) 0,
      rgba(20, 8, 0, 0.24) calc(var(--crt-pitch) * 0.2),
      rgba(20, 8, 0, 0) calc(var(--crt-pitch) * 0.4),
      rgba(255, 200, 120, 0.12) calc(var(--crt-pitch) * 0.5),
      rgba(20, 8, 0, 0) calc(var(--crt-pitch) * 0.6),
      rgba(20, 8, 0, 0.24) calc(var(--crt-pitch) * 0.8),
      rgba(20, 8, 0, 0.6) var(--crt-pitch)
    );
    --crt-corner-warm: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(255, 140, 40, 0.06) 100%
    );
    --crt-corner-cool: none;
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 50%,
      rgba(0, 0, 0, 0.32) 100%
    );
  }

  /* P4 white: Apple Lisa / IBM mono adapter, 364 lines (Lisa's 720×364
     bitmap mode). */
  :host([preset='p4-white']) {
    --crt-lines: 364;
    --crt-triads: 480;
    --crt-gamma-contrast: 1.08;
    --crt-gamma-brightness: 0.98;
    --crt-gamma-saturate: 0.4;
    --crt-glow-color: #f0f0e8;
    --crt-glow-shadow:
      0 0 0.03em var(--crt-glow-color),
      0 0 0.31em color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 1em color-mix(in srgb, var(--crt-glow-color) 30%, transparent);
  }
  :host([preset='p4-white']) .overlay {
    --crt-noise: ${noiseSvg(0.025)};
    --crt-grille: none;
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(15, 15, 18, 0.55) 0,
      rgba(15, 15, 18, 0.22) calc(var(--crt-pitch) * 0.2),
      rgba(15, 15, 18, 0) calc(var(--crt-pitch) * 0.4),
      rgba(240, 240, 232, 0.12) calc(var(--crt-pitch) * 0.5),
      rgba(15, 15, 18, 0) calc(var(--crt-pitch) * 0.6),
      rgba(15, 15, 18, 0.22) calc(var(--crt-pitch) * 0.8),
      rgba(15, 15, 18, 0.55) var(--crt-pitch)
    );
    --crt-corner-warm: none;
    --crt-corner-cool: radial-gradient(
      ellipse at center,
      transparent 65%,
      rgba(220, 230, 240, 0.03) 100%
    );
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 55%,
      rgba(0, 0, 0, 0.28) 100%
    );
  }

  /* Green: IBM 5151 P31 green phosphor, 350 lines (text-mode raster). */
  :host([preset='green']) {
    --crt-lines: 350;
    --crt-triads: 480;
    --crt-gamma-contrast: 1.1;
    --crt-gamma-brightness: 0.97;
    --crt-gamma-saturate: 0.5;
    --crt-glow-color: #4cff8a;
    --crt-glow-shadow:
      0 0 0.03em var(--crt-glow-color),
      0 0 0.31em color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 1.125em color-mix(in srgb, var(--crt-glow-color) 35%, transparent);
  }
  :host([preset='green']) .overlay {
    --crt-noise: ${noiseSvg(0.03)};
    --crt-grille: none;
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 20, 4, 0.6) 0,
      rgba(0, 20, 4, 0.24) calc(var(--crt-pitch) * 0.2),
      rgba(0, 20, 4, 0) calc(var(--crt-pitch) * 0.4),
      rgba(120, 255, 160, 0.12) calc(var(--crt-pitch) * 0.5),
      rgba(0, 20, 4, 0) calc(var(--crt-pitch) * 0.6),
      rgba(0, 20, 4, 0.24) calc(var(--crt-pitch) * 0.8),
      rgba(0, 20, 4, 0.6) var(--crt-pitch)
    );
    --crt-corner-warm: none;
    --crt-corner-cool: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(60, 255, 120, 0.05) 100%
    );
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 50%,
      rgba(0, 0, 0, 0.32) 100%
    );
  }
`;
