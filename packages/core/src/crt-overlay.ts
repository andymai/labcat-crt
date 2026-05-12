import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { animationStyles } from './styles/animations.js';
import { baseStyles } from './styles/base.js';
import { presetStyles } from './styles/presets.js';

export type CrtPreset = 'pvm' | 'consumer' | 'amber' | 'green';

/*
 * Module-private registry of mounted fullscreen instances. The first instance
 * to connect publishes CSS halation vars on document.documentElement so that
 * .crt-glow elements anywhere on the page inherit them; the last instance to
 * disconnect clears them. A Set, not a counter, so disconnects from instances
 * that never connected (defensive paranoia under HMR) don't underflow.
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
 * with shimmer), `amber` (VT220 monochrome), `green` (IBM 5151 monochrome).
 *
 * To enable halation on bright text, import `@labcat/crt/glow.css` once in
 * your app and tag elements with `class="crt-glow"`. The component publishes
 * the halation CSS vars; the imported stylesheet binds them to that class.
 *
 * @element crt-overlay
 * @slot - Content to overlay. Ignored in `fullscreen` mode.
 * @csspart overlay - The painted overlay layer (scanlines, grille, vignette).
 * @cssprop [--crt-z=9999] - z-index for fullscreen mode.
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
    // Re-read after update settles so preset-specific vars resolve correctly.
    // requestAnimationFrame is enough; updateComplete would also work but is
    // a microtask race against attributeChangedCallback callers.
    requestAnimationFrame(() => {
      if (!fullscreenInstances.has(this)) return;
      const vars = readHalationVars(this);
      publishToDocumentElement(vars);
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
