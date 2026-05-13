import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { animationStyles } from './styles/animations.js';
import { baseStyles } from './styles/base.js';
import { presetStyles } from './styles/presets.js';

export type CrtPreset = 'pvm' | 'consumer' | 'amber' | 'green' | 'p4-white';

/*
 * Set, not a counter: disconnects from instances that never connected (HMR)
 * must not underflow. First-in publishes halation vars on documentElement,
 * last-out clears them.
 */
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
 * `<crt-overlay>` paints a CRT phosphor effect on its slotted content
 * (per-container) or on the viewport (`fullscreen`).
 *
 * Presets: `pvm` (Sony broadcast monitor, default), `consumer` (NTSC TV
 * with shimmer), `amber` (VT220 monochrome), `green` (IBM 5151 monochrome),
 * `p4-white` (early-80s mono PC monitor).
 *
 * To enable halation on bright text, import `@labcat/crt/glow.css` once in
 * your app and tag elements with `class="crt-glow"`. The component publishes
 * the halation CSS vars; the imported stylesheet binds them to that class.
 *
 * Realism scales with the container: every pitch derives from container query
 * units (cqb/cqi/cqmin) so a 200×150 widget and a 4K fullscreen both render
 * a coherent CRT rather than a fixed-pixel screen filter. The per-preset
 * archetype is set by `--crt-lines` (vertical scanline count) and
 * `--crt-triads` (horizontal RGB triad count); consumers override either to
 * retune any preset without touching the gradients.
 *
 * @element crt-overlay
 * @slot - Content to overlay. Ignored in `fullscreen` mode.
 * @csspart overlay - The painted overlay layer (scanlines, grille, vignette).
 * @cssprop [--crt-z=9999] - z-index for fullscreen mode.
 * @cssprop [--crt-lines=480] - Target vertical scanline count. Per-preset
 *   default (480 NTSC, 400 VT220, 350 IBM 5151, 364 Apple Lisa).
 * @cssprop [--crt-triads=480] - Target horizontal RGB triad count.
 *   Per-preset default (480 PVM, 320 consumer NTSC).
 * @cssprop [--crt-aberration-x] - Chromatic aberration horizontal offset
 *   (em or px). 0 = no aberration. Override to retune any preset's
 *   convergence strength without rebuilding the shadow.
 * @cssprop [--crt-pitch] - Derived vertical scanline pitch (read-only;
 *   override `--crt-lines` instead).
 * @cssprop [--crt-grille-pitch] - Derived horizontal RGB triad pitch
 *   (read-only; override `--crt-triads` instead).
 * @cssprop [--crt-noise-size] - Derived phosphor-noise tile size (read-only).
 * @cssprop [--crt-blend-mode=normal] - mix-blend-mode for the painted
 *   overlay layer. Default `normal` plays cleanly with backdrop-filter.
 *   Try `overlay` or `soft-light` for a stronger contrast-pumped look.
 */
@customElement('crt-overlay')
export class CrtOverlay extends LitElement {
  static override styles = [baseStyles, animationStyles, presetStyles];

  /**
   * Which CRT archetype to emulate.
   * @attr preset
   */
  @property({ type: String, reflect: true })
  preset: CrtPreset = 'pvm';

  /**
   * When set, the overlay covers the viewport (`position: fixed; inset: 0`)
   * and the slot is hidden. Halation vars publish to `document.documentElement`
   * so `.crt-glow` elements anywhere on the page inherit them.
   * @attr fullscreen
   */
  @property({ type: Boolean, reflect: true })
  fullscreen = false;

  /**
   * Turn the effect off without unmounting. Animations pause cleanly so
   * re-enabling resumes from a stable state. Halation vars are unpublished.
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
