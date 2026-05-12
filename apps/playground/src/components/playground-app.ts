import type { CrtOverlay, CrtPreset } from '@labcat/crt';
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

const PRESETS: readonly CrtPreset[] = ['pvm', 'consumer', 'amber', 'green', 'p4-white'] as const;

/*
 * CSS variables exposed in the playground. The slider set is curated: gamma
 * filters and the glow color are the levers most useful for exploration. Layer
 * toggles (scanlines/grille/noise) flip whole var values to `none`.
 */
type SliderSpec = {
  key: 'contrast' | 'brightness' | 'saturate';
  var: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

const SLIDERS: readonly SliderSpec[] = [
  {
    key: 'contrast',
    var: '--crt-gamma-contrast',
    label: 'contrast',
    min: 0.8,
    max: 1.4,
    step: 0.01,
  },
  {
    key: 'brightness',
    var: '--crt-gamma-brightness',
    label: 'brightness',
    min: 0.7,
    max: 1.2,
    step: 0.01,
  },
  { key: 'saturate', var: '--crt-gamma-saturate', label: 'saturate', min: 0, max: 1.5, step: 0.01 },
] as const;

type LayerKey = 'scanlines' | 'grille' | 'noise';
const LAYERS: readonly { key: LayerKey; var: string; label: string }[] = [
  { key: 'scanlines', var: '--crt-scanlines', label: 'scanlines' },
  { key: 'grille', var: '--crt-grille', label: 'aperture grille' },
  { key: 'noise', var: '--crt-noise', label: 'phosphor noise' },
] as const;

@customElement('playground-app')
export class PlaygroundApp extends LitElement {
  @property({ type: String }) preset: CrtPreset = 'pvm';
  @property({ type: Boolean }) fullscreen = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) editing = false;

  @state() private layersOff: Record<LayerKey, boolean> = {
    scanlines: false,
    grille: false,
    noise: false,
  };

  @state() private sliderValues: Record<SliderSpec['key'], number> = {
    contrast: 1,
    brightness: 1,
    saturate: 1,
  };

  @state() private overrides = new Set<string>();

  @state() private glowColorEnabled = false;
  @state() private glowColor = '#ffffff';

  @state() private copyState: 'idle' | 'copied' = 'idle';

  @query('slot') private slotEl!: HTMLSlotElement;

  /*
   * The overlay lives in light DOM (so its own slot stays user-authorable) and
   * gets projected into our shadow DOM via <slot>. We grab it once on first
   * paint and again whenever the slot's assignment changes.
   */
  #overlay: CrtOverlay | null = null;

  override firstUpdated(): void {
    this.#refreshOverlay();
    this.slotEl.addEventListener('slotchange', () => this.#refreshOverlay());
  }

  #refreshOverlay(): void {
    const assigned = this.slotEl.assignedElements({ flatten: true });
    const overlay = assigned.find((el): el is CrtOverlay => el.tagName === 'CRT-OVERLAY') ?? null;
    this.#overlay = overlay;
    if (overlay) {
      this.#applyAll();
      this.#readSliderDefaults();
    }
  }

  /* Read live computed values for sliders so they start in sync with the preset. */
  #readSliderDefaults(): void {
    if (!this.#overlay) return;
    const cs = getComputedStyle(this.#overlay);
    const next = { ...this.sliderValues };
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) continue;
      const raw = cs.getPropertyValue(s.var).trim();
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) next[s.key] = parsed;
    }
    this.sliderValues = next;
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('preset') ||
      changed.has('fullscreen') ||
      changed.has('disabled') ||
      changed.has('editing') ||
      changed.has('layersOff') ||
      changed.has('sliderValues') ||
      changed.has('overrides') ||
      changed.has('glowColorEnabled') ||
      changed.has('glowColor')
    ) {
      this.#applyAll();
    }
    if (changed.has('preset')) {
      // Preset baseline shifted; reset slider readouts (unless user overrode).
      requestAnimationFrame(() => this.#readSliderDefaults());
    }
  }

  #applyAll(): void {
    const o = this.#overlay;
    if (!o) return;

    o.preset = this.preset;
    o.fullscreen = this.fullscreen;
    o.disabled = this.disabled;

    if (this.editing) o.setAttribute('contenteditable', 'true');
    else o.removeAttribute('contenteditable');

    for (const layer of LAYERS) {
      if (this.layersOff[layer.key]) o.style.setProperty(layer.var, 'none');
      else o.style.removeProperty(layer.var);
    }
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) o.style.setProperty(s.var, String(this.sliderValues[s.key]));
      else o.style.removeProperty(s.var);
    }
    if (this.glowColorEnabled) o.style.setProperty('--crt-glow-color', this.glowColor);
    else o.style.removeProperty('--crt-glow-color');
  }

  #setSlider(spec: SliderSpec, value: number): void {
    this.sliderValues = { ...this.sliderValues, [spec.key]: value };
    if (!this.overrides.has(spec.var)) {
      this.overrides = new Set([...this.overrides, spec.var]);
    } else {
      this.overrides = new Set(this.overrides);
    }
  }

  #toggleLayer(key: LayerKey): void {
    this.layersOff = { ...this.layersOff, [key]: !this.layersOff[key] };
  }

  #resetOverrides(): void {
    this.overrides = new Set();
    this.layersOff = { scanlines: false, grille: false, noise: false };
    this.glowColorEnabled = false;
    requestAnimationFrame(() => this.#readSliderDefaults());
  }

  #buildExport(): string {
    const attrs: string[] = [`preset="${this.preset}"`];
    if (this.fullscreen) attrs.push('fullscreen');
    if (this.disabled) attrs.push('disabled');

    const styleParts: string[] = [];
    for (const layer of LAYERS) {
      if (this.layersOff[layer.key]) styleParts.push(`${layer.var}: none`);
    }
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) styleParts.push(`${s.var}: ${this.sliderValues[s.key]}`);
    }
    if (this.glowColorEnabled) styleParts.push(`--crt-glow-color: ${this.glowColor}`);

    const styleAttr = styleParts.length > 0 ? ` style="${styleParts.join('; ')}"` : '';
    const slotted = this.fullscreen ? '' : '\n  …your content…\n';
    return `<crt-overlay ${attrs.join(' ')}${styleAttr}>${slotted}</crt-overlay>`;
  }

  async #copyExport(): Promise<void> {
    const text = this.#buildExport();
    try {
      await navigator.clipboard.writeText(text);
      this.copyState = 'copied';
      setTimeout(() => {
        this.copyState = 'idle';
      }, 1400);
    } catch {
      // clipboard API can be denied (insecure contexts, permissions). Fall back
      // to a transient prompt so the user can still grab the snippet.
      window.prompt('Copy the snippet:', text);
    }
  }

  override render() {
    return html`
      <aside class="panel" aria-label="CRT playground controls">
        <header class="brand">
          <span class="dot"></span>
          <span class="title">@labcat/crt playground</span>
        </header>

        <section class="group">
          <h2>Preset</h2>
          <div class="presets">
            ${PRESETS.map(
              (p) => html`
                <button
                  type="button"
                  class=${p === this.preset ? 'preset on' : 'preset'}
                  @click=${() => {
                    this.preset = p;
                  }}
                >
                  ${p}
                </button>
              `,
            )}
          </div>
        </section>

        <section class="group">
          <h2>Attributes</h2>
          <label class="row">
            <input
              type="checkbox"
              .checked=${this.fullscreen}
              @change=${(e: Event) => {
                this.fullscreen = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>fullscreen</span>
          </label>
          <label class="row">
            <input
              type="checkbox"
              .checked=${this.disabled}
              @change=${(e: Event) => {
                this.disabled = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>disabled</span>
          </label>
          <label class="row">
            <input
              type="checkbox"
              .checked=${this.editing}
              ?disabled=${this.fullscreen}
              @change=${(e: Event) => {
                this.editing = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>edit slot content</span>
          </label>
        </section>

        <section class="group">
          <h2>Layers</h2>
          ${LAYERS.map(
            (layer) => html`
              <label class="row">
                <input
                  type="checkbox"
                  .checked=${!this.layersOff[layer.key]}
                  @change=${() => this.#toggleLayer(layer.key)}
                />
                <span>${layer.label}</span>
              </label>
            `,
          )}
        </section>

        <section class="group">
          <h2>Gamma</h2>
          ${SLIDERS.map(
            (s) => html`
              <label class="slider">
                <span class="slider-label">
                  <span>${s.label}</span>
                  <span class="value">${this.sliderValues[s.key].toFixed(2)}</span>
                </span>
                <input
                  type="range"
                  min=${s.min}
                  max=${s.max}
                  step=${s.step}
                  .value=${String(this.sliderValues[s.key])}
                  @input=${(e: Event) => {
                    const v = Number.parseFloat((e.target as HTMLInputElement).value);
                    this.#setSlider(s, v);
                  }}
                />
              </label>
            `,
          )}
        </section>

        <section class="group">
          <h2>Halation</h2>
          <label class="row">
            <input
              type="checkbox"
              .checked=${this.glowColorEnabled}
              @change=${(e: Event) => {
                this.glowColorEnabled = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>custom glow color</span>
          </label>
          <label class="color-row" ?hidden=${!this.glowColorEnabled}>
            <input
              type="color"
              .value=${this.glowColor}
              @input=${(e: Event) => {
                this.glowColor = (e.target as HTMLInputElement).value;
              }}
            />
            <code>${this.glowColor}</code>
          </label>
        </section>

        <section class="group actions">
          <button type="button" class="primary" @click=${() => this.#copyExport()}>
            ${this.copyState === 'copied' ? 'copied!' : 'copy as HTML'}
          </button>
          <button type="button" class="ghost" @click=${() => this.#resetOverrides()}>
            reset overrides
          </button>
        </section>

        <footer class="foot">
          <a href="https://github.com/andymai/labcat-crt" target="_blank" rel="noopener">
            github.com/andymai/labcat-crt
          </a>
        </footer>
      </aside>

      <main class="stage">
        <slot></slot>
      </main>
    `;
  }

  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: 320px 1fr;
      min-height: 100vh;
      font-family:
        'Berkeley Mono', ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace;
      color: #d5d5d5;
      background: #0d0d0d;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.25rem 1rem;
      border-right: 1px solid #1f1f1f;
      background: #0a0a0a;
      overflow-y: auto;
      max-height: 100vh;
      box-sizing: border-box;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #1f1f1f;
    }
    .brand .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #4cff8a;
      box-shadow: 0 0 8px rgba(76, 255, 138, 0.6);
    }
    .brand .title {
      font-size: 0.85rem;
      letter-spacing: 0.02em;
    }

    h2 {
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.55;
      margin: 0 0 0.55rem;
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .presets {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
    }

    .preset {
      appearance: none;
      background: #141414;
      border: 1px solid #1f1f1f;
      color: #b8b8b8;
      padding: 0.4rem 0.55rem;
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
      text-align: left;
      transition: border-color 120ms ease, color 120ms ease;
    }
    .preset:hover {
      color: #f0f0f0;
      border-color: #2c2c2c;
    }
    .preset.on {
      color: #0a0a0a;
      background: #d5d5d5;
      border-color: #d5d5d5;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .row input[type='checkbox'] {
      accent-color: #d5d5d5;
    }
    .row input[disabled] + span {
      opacity: 0.4;
    }

    .slider {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.78rem;
    }
    .slider-label {
      display: flex;
      justify-content: space-between;
      opacity: 0.85;
    }
    .slider-label .value {
      font-variant-numeric: tabular-nums;
      opacity: 0.6;
    }
    .slider input[type='range'] {
      width: 100%;
      accent-color: #d5d5d5;
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
    }
    .color-row[hidden] {
      display: none;
    }
    .color-row input[type='color'] {
      width: 2.25rem;
      height: 1.6rem;
      padding: 0;
      border: 1px solid #1f1f1f;
      background: transparent;
      cursor: pointer;
    }
    .color-row code {
      opacity: 0.6;
    }

    .actions {
      gap: 0.5rem;
    }
    .actions button {
      appearance: none;
      font: inherit;
      font-size: 0.8rem;
      padding: 0.55rem 0.7rem;
      cursor: pointer;
      border: 1px solid #1f1f1f;
    }
    .actions .primary {
      background: #d5d5d5;
      color: #0a0a0a;
      border-color: #d5d5d5;
    }
    .actions .primary:hover {
      background: #f0f0f0;
    }
    .actions .ghost {
      background: transparent;
      color: #b8b8b8;
    }
    .actions .ghost:hover {
      color: #f0f0f0;
      border-color: #2c2c2c;
    }

    .foot {
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid #1f1f1f;
      font-size: 0.72rem;
      opacity: 0.5;
    }
    .foot a {
      color: inherit;
      text-decoration: none;
    }
    .foot a:hover {
      opacity: 1;
      text-decoration: underline;
    }

    .stage {
      position: relative;
      min-height: 100vh;
      overflow: auto;
    }
    ::slotted(crt-overlay) {
      display: block;
      min-height: 100vh;
    }
    ::slotted(crt-overlay[contenteditable='true']) {
      outline: 1px dashed rgba(76, 255, 138, 0.35);
      outline-offset: -8px;
    }

    @media (max-width: 720px) {
      :host {
        grid-template-columns: 1fr;
      }
      .panel {
        max-height: none;
        border-right: none;
        border-bottom: 1px solid #1f1f1f;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-app': PlaygroundApp;
  }
}
