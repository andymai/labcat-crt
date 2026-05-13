import { css, unsafeCSS } from 'lit';

/*
 * Five hardware-referenced presets, all editorial-restrained (no period-
 * accurate loudness; if you want that, override --crt-scanline-strength
 * etc. on the host):
 *   bvm      — Sony broadcast monitor, cool-white reference, sharp scanlines
 *   ntsc     — home NTSC receiver, warm cast, deeper vignette, more grain
 *   lisa     — Apple Lisa P4 phosphor, neutral warm-white reading surface
 *   vt220    — DEC VT220 amber terminal, soft drift, wider bloom
 *   ibm-5151 — IBM monochrome green phosphor, tighter scanlines, terminal
 *
 * Two-tier declarations: host-level vars (glow, gamma) on :host so halation
 * publishing can read them via getComputedStyle. Gradient vars on .overlay
 * because cqb/cqi can't query their own container.
 *
 * Grain is a calmer turbulent SVG noise shared across presets, tuned via
 * --crt-grain-strength rather than re-encoded per preset.
 */

const grainSvg = (alpha: number) =>
  unsafeCSS(
    `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>")`,
  );

/* Scanline gradient builder: dark valley → transparent center → dark valley.
   Six stops (no white peak — that read as harsh on dim editorial palettes).
   Color is per-preset so dark stops can warm or cool the underlying text. */
const scanlines = (rgb: string) =>
  unsafeCSS(`repeating-linear-gradient(
    to bottom,
    rgba(${rgb}, calc(var(--crt-scanline-strength) * 1.4)) 0,
    rgba(${rgb}, calc(var(--crt-scanline-strength) * 0.55)) calc(var(--crt-pitch) * 0.25),
    rgba(${rgb}, 0) calc(var(--crt-pitch) * 0.45),
    rgba(${rgb}, 0) calc(var(--crt-pitch) * 0.55),
    rgba(${rgb}, calc(var(--crt-scanline-strength) * 0.55)) calc(var(--crt-pitch) * 0.75),
    rgba(${rgb}, calc(var(--crt-scanline-strength) * 1.4)) var(--crt-pitch)
  )`);

export const presetStyles = css`
  /* ----- lisa (Apple Lisa P4 white phosphor) -------------------------- */
  :host([preset='lisa']) {
    --crt-lines: 480;
    --crt-gamma-contrast: 1.04;
    --crt-gamma-brightness: 0.99;
    --crt-gamma-saturate: 1.02;
    --crt-glow-color: #fdf4ea;
    --crt-glow-shadow:
      0 0 0.04em var(--crt-glow-color),
      0 0 0.32em color-mix(in srgb, var(--crt-glow-color) calc(50% * var(--crt-glow-strength)), transparent),
      0 0 1em color-mix(in srgb, var(--crt-glow-color) calc(18% * var(--crt-glow-strength)), transparent);
  }
  :host([preset='lisa']) .overlay {
    --crt-noise: ${grainSvg(0.02)};
    --crt-grille: none;
    --crt-scanlines: ${scanlines('10, 10, 12')};
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 55%,
      rgba(0, 0, 0, var(--crt-vignette-strength)) 100%
    );
  }

  /* ----- vt220 (DEC amber terminal) ----------------------------------- */
  :host([preset='vt220']) {
    --crt-lines: 420;
    --crt-gamma-contrast: 1.05;
    --crt-gamma-brightness: 0.97;
    --crt-gamma-saturate: 0.78;
    --crt-glow-color: #ffc879;
    --crt-glow-shadow:
      0 0 0.04em var(--crt-glow-color),
      0 0 0.38em color-mix(in srgb, var(--crt-glow-color) calc(65% * var(--crt-glow-strength)), transparent),
      0 0 1.1em color-mix(in srgb, var(--crt-glow-color) calc(28% * var(--crt-glow-strength)), transparent);
  }
  :host([preset='vt220']) .overlay {
    --crt-noise: ${grainSvg(0.025)};
    --crt-grille: none;
    --crt-scanlines: ${scanlines('22, 12, 4')};
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 50%,
      rgba(28, 14, 0, calc(var(--crt-vignette-strength) * 1.5)) 100%
    );
  }

  /* ----- ibm-5151 (IBM monochrome green phosphor) --------------------- */
  :host([preset='ibm-5151']) {
    --crt-lines: 540;
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.98;
    --crt-gamma-saturate: 0.85;
    --crt-glow-color: #aaf0cf;
    --crt-glow-shadow:
      0 0 0.04em var(--crt-glow-color),
      0 0 0.34em color-mix(in srgb, var(--crt-glow-color) calc(55% * var(--crt-glow-strength)), transparent),
      0 0 0.95em color-mix(in srgb, var(--crt-glow-color) calc(22% * var(--crt-glow-strength)), transparent);
  }
  :host([preset='ibm-5151']) .overlay {
    --crt-noise: ${grainSvg(0.02)};
    --crt-grille: none;
    --crt-scanlines: ${scanlines('4, 18, 10')};
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 55%,
      rgba(0, 14, 8, calc(var(--crt-vignette-strength) * 1.3)) 100%
    );
  }

  /* ----- bvm (default — Sony broadcast monitor) ----------------------- */
  :host,
  :host([preset='bvm']) {
    --crt-lines: 480;
    --crt-gamma-contrast: 1.05;
    --crt-gamma-brightness: 0.99;
    --crt-gamma-saturate: 1;
    --crt-glow-color: #eaf0fa;
    --crt-glow-shadow:
      0 0 0.04em var(--crt-glow-color),
      0 0 0.3em color-mix(in srgb, var(--crt-glow-color) calc(45% * var(--crt-glow-strength)), transparent),
      0 0 0.9em color-mix(in srgb, var(--crt-glow-color) calc(16% * var(--crt-glow-strength)), transparent);
  }
  :host([preset='bvm']) .overlay,
  :host(:not([preset])) .overlay {
    --crt-noise: ${grainSvg(0.018)};
    --crt-grille: none;
    --crt-scanlines: ${scanlines('10, 12, 18')};
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(0, 6, 14, calc(var(--crt-vignette-strength) * 0.85)) 100%
    );
  }

  /* ----- ntsc (home NTSC receiver) ------------------------------------ */
  :host([preset='ntsc']) {
    --crt-lines: 420;
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.96;
    --crt-gamma-saturate: 1.05;
    --crt-glow-color: #ffe9c2;
    --crt-glow-shadow:
      0 0 0.04em var(--crt-glow-color),
      0 0 0.36em color-mix(in srgb, var(--crt-glow-color) calc(58% * var(--crt-glow-strength)), transparent),
      0 0 1.05em color-mix(in srgb, var(--crt-glow-color) calc(24% * var(--crt-glow-strength)), transparent);
  }
  :host([preset='ntsc']) .overlay {
    --crt-noise: ${grainSvg(0.04)};
    --crt-grille: none;
    --crt-scanlines: ${scanlines('26, 14, 4')};
    --crt-vignette: radial-gradient(
      ellipse at center,
      transparent 45%,
      rgba(24, 12, 0, calc(var(--crt-vignette-strength) * 1.6)) 100%
    );
  }
`;
