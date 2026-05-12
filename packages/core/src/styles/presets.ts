import { css, unsafeCSS } from 'lit';

/*
 * Per-preset CSS variable assignments. Each preset is a coherent archetype:
 *
 *   pvm      - Sony PVM/BVM broadcast monitor. Crisp horizontal scanlines,
 *              fine vertical RGB aperture grille, near-flat vignette, no
 *              motion, no chromatic aberration (PVMs converged well in the
 *              center). The default.
 *
 *   consumer - Generic NTSC consumer TV. Softer scanlines, heavier vignette,
 *              slight sub-pixel chromatic aberration, faint 60Hz-cheated
 *              shimmer animation.
 *
 *   amber    - DEC VT220-style amber monochrome terminal. Single-phosphor
 *              tube, no aperture grille, warm amber tint, heavier glow,
 *              subtle scanline drift.
 *
 *   green    - IBM 5151 / generic green-phosphor terminal. Same monochrome
 *              treatment as amber, tighter scanline pitch, P31 green tint.
 *
 *   p4-white - Early-80s monochrome PC monitor (Apple Lisa, IBM PC mono
 *              adapter, Tandy CM-1). White P4 phosphor with a slight
 *              warm-cool cast. No grille, tight scanline pitch, no
 *              chromatic aberration, mild vignette.
 *
 * The phosphor-noise SVG is shared across presets; alpha is tuned per
 * preset by re-encoding the data URL.
 */

const noiseSvg = (alpha: number) =>
  unsafeCSS(
    `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
  );

export const presetStyles = css`
  /* ----- PVM (default) ----------------------------------------------- */
  :host,
  :host([preset='pvm']) {
    --crt-noise: ${noiseSvg(0.025)};
    --crt-grille: repeating-linear-gradient(
      to right,
      rgba(255, 80, 80, 0.06) 0px,
      rgba(255, 80, 80, 0.06) 1px,
      rgba(80, 255, 80, 0.06) 1px,
      rgba(80, 255, 80, 0.06) 2px,
      rgba(80, 80, 255, 0.06) 2px,
      rgba(80, 80, 255, 0.06) 3px
    );
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.55) 0px,
      rgba(0, 0, 0, 0.22) 0.6px,
      rgba(0, 0, 0, 0) 1.2px,
      rgba(0, 0, 0, 0) 1.8px,
      rgba(0, 0, 0, 0.22) 2.4px,
      rgba(0, 0, 0, 0.55) 3px
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
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.96;
    --crt-gamma-saturate: 1.1;
    --crt-glow-color: currentColor;
  }

  /* ----- Consumer NTSC TV ------------------------------------------- */
  :host([preset='consumer']) {
    --crt-noise: ${noiseSvg(0.04)};
    /* Softer grille, wider triad pitch. Cheap shadow-mask, not Trinitron. */
    --crt-grille: repeating-linear-gradient(
      to right,
      rgba(255, 60, 60, 0.05) 0px,
      rgba(255, 60, 60, 0.05) 1.5px,
      rgba(60, 255, 60, 0.05) 1.5px,
      rgba(60, 255, 60, 0.05) 3px,
      rgba(60, 60, 255, 0.05) 3px,
      rgba(60, 60, 255, 0.05) 4.5px
    );
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.35) 0px,
      rgba(0, 0, 0, 0.12) 0.8px,
      rgba(0, 0, 0, 0) 1.6px,
      rgba(0, 0, 0, 0) 2.4px,
      rgba(0, 0, 0, 0.12) 3.2px,
      rgba(0, 0, 0, 0.35) 4px
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
    --crt-gamma-contrast: 1.06;
    --crt-gamma-brightness: 0.93;
    --crt-gamma-saturate: 1.04;
    --crt-glow-color: currentColor;
    --crt-aberration-shadow:
      0.5px 0 0 rgba(255, 80, 80, 0.25),
      -0.5px 0 0 rgba(80, 140, 255, 0.25);
  }

  /* ----- Amber monochrome (VT220) ----------------------------------- */
  :host([preset='amber']) {
    --crt-noise: ${noiseSvg(0.03)};
    --crt-grille: none;
    /* Monochrome amber phosphor: scanlines have a warm bias. */
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(20, 8, 0, 0.6) 0px,
      rgba(20, 8, 0, 0.24) 0.6px,
      rgba(20, 8, 0, 0) 1.2px,
      rgba(20, 8, 0, 0) 1.8px,
      rgba(20, 8, 0, 0.24) 2.4px,
      rgba(20, 8, 0, 0.6) 3px
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
    --crt-gamma-contrast: 1.1;
    --crt-gamma-brightness: 0.94;
    --crt-gamma-saturate: 0.6;
    --crt-glow-color: #ffb43a;
    --crt-glow-shadow:
      0 0 0.5px var(--crt-glow-color),
      0 0 5px color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 18px color-mix(in srgb, var(--crt-glow-color) 35%, transparent);
  }

  /* ----- P4 white monochrome (Lisa / IBM mono adapter / Tandy CM-1) --- */
  :host([preset='p4-white']) {
    --crt-noise: ${noiseSvg(0.025)};
    --crt-grille: none;
    /* P4 white phosphor: cool-neutral scanlines, tight pitch matching the
       high-res text terminals these monitors drove. */
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(15, 15, 18, 0.55) 0px,
      rgba(15, 15, 18, 0.22) 0.5px,
      rgba(15, 15, 18, 0) 1px,
      rgba(15, 15, 18, 0) 1.5px,
      rgba(15, 15, 18, 0.22) 2px,
      rgba(15, 15, 18, 0.55) 2.5px
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
    --crt-gamma-contrast: 1.08;
    --crt-gamma-brightness: 0.95;
    --crt-gamma-saturate: 0.4;
    --crt-glow-color: #f0f0e8;
    --crt-glow-shadow:
      0 0 0.5px var(--crt-glow-color),
      0 0 5px color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 16px color-mix(in srgb, var(--crt-glow-color) 30%, transparent);
  }

  /* ----- Green monochrome (IBM 5151) -------------------------------- */
  :host([preset='green']) {
    --crt-noise: ${noiseSvg(0.03)};
    --crt-grille: none;
    /* Tighter pitch than amber. small-screen terminal feel. */
    --crt-scanlines: repeating-linear-gradient(
      to bottom,
      rgba(0, 20, 4, 0.6) 0px,
      rgba(0, 20, 4, 0.24) 0.5px,
      rgba(0, 20, 4, 0) 1px,
      rgba(0, 20, 4, 0) 1.5px,
      rgba(0, 20, 4, 0.24) 2px,
      rgba(0, 20, 4, 0.6) 2.5px
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
    --crt-gamma-contrast: 1.1;
    --crt-gamma-brightness: 0.94;
    --crt-gamma-saturate: 0.5;
    --crt-glow-color: #4cff8a;
    --crt-glow-shadow:
      0 0 0.5px var(--crt-glow-color),
      0 0 5px color-mix(in srgb, var(--crt-glow-color) 75%, transparent),
      0 0 18px color-mix(in srgb, var(--crt-glow-color) 35%, transparent);
  }
`;
