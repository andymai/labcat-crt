import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { animationStyles } from './styles/animations.js';
import { baseStyles } from './styles/base.js';
import { presetStyles } from './styles/presets.js';

export type CrtPreset = 'bvm' | 'ntsc' | 'lisa' | 'vt220' | 'ibm-5151';

/* Set, not a counter: HMR can disconnect instances that never finished
   connecting; a counter would underflow. */
const fullscreenInstances = new Set<CrtOverlay>();

const HALATION_VARS = ['--crt-glow-shadow', '--crt-aberration-shadow'] as const;

function readHalationVars(host: HTMLElement): Record<string, string> {
  const styles = getComputedStyle(host);
  const out: Record<string, string> = {};
  for (const v of HALATION_VARS) {
    const value = styles.getPropertyValue(v).trim();
    if (value) out[v] = value;
  }
  return out;
}

function publishToDocumentElement(vars: Record<string, string>): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

function clearDocumentElement(): void {
  const root = document.documentElement;
  for (const v of HALATION_VARS) {
    root.style.removeProperty(v);
  }
}

/**
 * `<crt-overlay>` paints a subtle CRT phosphor effect on its slotted content
 * (per-container) or on the viewport (`fullscreen`). Tuned for editorial
 * restraint — scanlines and grain are atmospheric, not foregrounded.
 *
 * Presets (hardware-referenced, all sharing editorial restraint):
 *   `bvm`      (default) — Sony broadcast monitor white. Cool, near-flat
 *                          vignette, sharp scanlines.
 *   `ntsc`               — Home NTSC receiver. Warm cast, deeper vignette,
 *                          softer scanlines, more grain.
 *   `lisa`               — Apple Lisa / P4 white phosphor. Neutral
 *                          warm-white, designed for reading flow.
 *   `vt220`              — DEC VT220 amber terminal. Wider phosphor bloom,
 *                          slight scanline drift.
 *   `ibm-5151`           — IBM monochrome green phosphor. Tighter scanline
 *                          pitch, terminal feel.
 *
 * Halation: tag bright elements with `class="crt-glow"` and import
 * `@labcat/crt/glow.css` once. The component publishes `--crt-glow-shadow`
 * on the host; glow.css binds it to that class.
 *
 * Realism scales with the container: grille triad pitch derives from
 * container query units (cqi); scanline pitch from the small viewport
 * block-size, so a 200×150 widget and a 4K fullscreen both render a
 * coherent CRT.
 *
 * @element crt-overlay
 * @slot - Content to overlay. Ignored in `fullscreen` mode.
 * @csspart overlay - The painted overlay layer (scanlines, grain, vignette).
 * @cssprop [--crt-z=9999] - z-index for fullscreen mode.
 * @cssprop [--crt-lines=480] - Target vertical scanline count.
 * @cssprop [--crt-scanline-strength=0.22] - Scanline dark-stop opacity, 0..1.
 * @cssprop [--crt-vignette-strength=0.16] - Vignette darkening at corners, 0..0.5.
 * @cssprop [--crt-glow-strength=1] - Halation alpha multiplier, 0..2.
 * @cssprop [--crt-breathing-amplitude=0.025] - Idle brightness pulse amplitude, 0..0.05.
 */
@customElement('crt-overlay')
export class CrtOverlay extends LitElement {
  static override styles = [baseStyles, animationStyles, presetStyles];

  /**
   * Which preset to render.
   * @attr preset
   */
  @property({ type: String, reflect: true })
  preset: CrtPreset = 'bvm';

  /**
   * When set, the overlay covers the viewport and the slot is hidden.
   * Halation vars publish to `document.documentElement` so `.crt-glow`
   * elements anywhere on the page inherit them.
   * @attr fullscreen
   */
  @property({ type: Boolean, reflect: true })
  fullscreen = false;

  /**
   * Turn the effect off without unmounting. Halation vars unpublish.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.fullscreen && !this.disabled) this.#registerFullscreen();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unregisterFullscreen();
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('fullscreen') || changed.has('disabled') || changed.has('preset')) {
      if (this.fullscreen && !this.disabled) this.#registerFullscreen();
      else this.#unregisterFullscreen();
    }
  }

  override render() {
    return html`
      <slot></slot>
      <div part="overlay" class="overlay" aria-hidden="true"></div>
    `;
  }

  #registerFullscreen(): void {
    fullscreenInstances.add(this);
    // rAF (not updateComplete) lets the preset's var cascade settle without
    // racing attributeChangedCallback microtasks.
    requestAnimationFrame(() => {
      if (!fullscreenInstances.has(this)) return;
      publishToDocumentElement(readHalationVars(this));
    });
  }

  #unregisterFullscreen(): void {
    fullscreenInstances.delete(this);
    if (fullscreenInstances.size === 0) clearDocumentElement();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'crt-overlay': CrtOverlay;
  }
}
