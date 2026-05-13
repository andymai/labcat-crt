import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { crtFilters } from './filters.js';
import { animationStyles } from './styles/animations.js';
import { baseStyles } from './styles/base.js';
import { presetStyles } from './styles/presets.js';

export type CrtPreset = 'pvm' | 'consumer' | 'amber' | 'green' | 'p4-white';
export type CrtFidelity = 'standard' | 'high' | 'max';

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
 * `<crt-overlay>` paints a CRT phosphor effect on its slotted content
 * (per-container) or on the viewport (`fullscreen`).
 *
 * Presets: `pvm` (Sony broadcast monitor, default), `consumer` (NTSC TV
 * with shimmer), `amber` (VT220 monochrome), `green` (IBM 5151 monochrome),
 * `p4-white` (early-80s mono PC monitor).
 *
 * Fidelity tiers:
 *   `standard` (default) — pure CSS gradients, scanlines, em-based halation
 *                          via `.crt-glow` class binding.
 *   `high`               — adds SVG-filter brightness-aware bloom on the
 *                          slotted content (all bright pixels glow, not
 *                          just `.crt-glow`-tagged) and channel-split
 *                          chromatic aberration on the consumer preset.
 *   `max`                — adds NTSC composite artifacts (consumer only —
 *                          PVMs were RGB-direct) and subtle screen
 *                          curvature via `transform: perspective`.
 *
 * To enable halation on bright text, import `@labcat/crt/glow.css` once in
 * your app and tag elements with `class="crt-glow"`. The component publishes
 * the halation CSS vars; the imported stylesheet binds them to that class.
 *
 * Realism scales with the container: every pitch derives from container query
 * units (cqi/cqb fallback) so a 200×150 widget and a 4K fullscreen both
 * render a coherent CRT rather than a fixed-pixel screen filter.
 *
 * `prefers-reduced-transparency: reduce` silently downgrades `fidelity` to
 * `standard`. Note that at `fidelity='max'` the `.content` wrapper's
 * `transform: perspective` becomes a containing block for fixed-positioned
 * descendants — slotted `position: fixed` dialogs will anchor to `.content`,
 * not the viewport.
 *
 * @element crt-overlay
 * @slot - Content to overlay. Ignored in `fullscreen` mode.
 * @csspart overlay - The painted overlay layer (scanlines, grille, vignette).
 * @csspart content - The slotted-content wrapper (target of SVG filter chain).
 * @cssprop [--crt-z=9999] - z-index for fullscreen mode.
 * @cssprop [--crt-lines=480] - Target vertical scanline count.
 * @cssprop [--crt-triads=480] - Target horizontal RGB triad count.
 * @cssprop [--crt-aberration-x] - Chromatic aberration horizontal offset
 *   for the text-shadow halation (em or px). 0 = no aberration.
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
   * When set, the overlay covers the viewport and the slot is hidden.
   * Halation vars publish to `document.documentElement` so `.crt-glow`
   * elements anywhere on the page inherit them.
   * @attr fullscreen
   */
  @property({ type: Boolean, reflect: true })
  fullscreen = false;

  /**
   * Turn the effect off without unmounting. Animations pause cleanly so
   * re-enabling resumes from a stable state. Halation vars unpublish.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Visual fidelity tier. `standard` is pure CSS. `high` adds SVG-filter
   * bloom and (on the consumer preset) chromatic aberration. `max` adds NTSC
   * artifacts (consumer only) and curvature. Auto-downgrades to `standard`
   * under `prefers-reduced-transparency`.
   * @attr fidelity
   */
  @property({ type: String, reflect: true })
  fidelity: CrtFidelity = 'standard';

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
      <div part="content" class="content"><slot></slot></div>
      <div part="overlay" class="overlay" aria-hidden="true"></div>
      ${crtFilters}
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
