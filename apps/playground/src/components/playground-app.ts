import type { CrtOverlay, CrtPreset } from '@labcat/crt';
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

const PRESETS: readonly CrtPreset[] = ['bvm', 'ntsc', 'lisa', 'vt220', 'ibm-5151'] as const;

type SliderKey = 'lines' | 'scanlineStrength' | 'glowStrength' | 'vignetteStrength';
type SliderSpec = {
  key: SliderKey;
  var: string;
  label: string;
  min: number;
  max: number;
  step: number;
};

const SLIDERS: readonly SliderSpec[] = [
  {
    key: 'lines',
    var: '--crt-lines',
    label: 'scanline count',
    min: 200,
    max: 700,
    step: 1,
  },
  {
    key: 'scanlineStrength',
    var: '--crt-scanline-strength',
    label: 'scanline opacity',
    min: 0,
    max: 0.6,
    step: 0.01,
  },
  {
    key: 'glowStrength',
    var: '--crt-glow-strength',
    label: 'amount',
    min: 0,
    max: 2,
    step: 0.05,
  },
  {
    key: 'vignetteStrength',
    var: '--crt-vignette-strength',
    label: 'vignette',
    min: 0,
    max: 0.5,
    step: 0.01,
  },
] as const;

const SLIDER_BY_KEY: Record<SliderKey, SliderSpec> = Object.fromEntries(
  SLIDERS.map((s) => [s.key, s]),
) as Record<SliderKey, SliderSpec>;

type LayerKey = 'scanlines';
const LAYERS: readonly { key: LayerKey; var: string; label: string }[] = [
  { key: 'scanlines', var: '--crt-scanlines', label: 'scanlines' },
] as const;

/* Slider, not a checkbox: at preset-default alpha (2.5%–4%) noise is barely
 * perceptible against scanlines + grille, so a toggle reads as a no-op.
 * NOISE_MAX amplifies up to where the pattern is obviously visible. */
const NOISE_MAX = 0.2;
const NOISE_STEP = 0.005;
const NOISE_ALPHA_RE = /0 0 0 (\d*\.?\d+) 0\s*'\s*\/\s*>\s*<rect/;

function buildNoiseSvgUrl(alpha: number): string {
  const a = alpha.toFixed(3);
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${a} 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
}

const NOISE_ALPHA_FALLBACK = 0.03;

function readPresetNoiseAlpha(overlay: CrtOverlay): number {
  const overlayLayer = overlay.shadowRoot?.querySelector('.overlay');
  if (!overlayLayer) return NOISE_ALPHA_FALLBACK;
  const raw = getComputedStyle(overlayLayer).getPropertyValue('--crt-noise').trim();
  const parsed = Number.parseFloat(raw.match(NOISE_ALPHA_RE)?.[1] ?? '');
  return Number.isFinite(parsed) ? parsed : NOISE_ALPHA_FALLBACK;
}

/* Light theme rebinds substrate-coupled vars only: dark-substrate tuning
   reads as grime on cream, while pitch/grille/noise are substrate-invariant
   and stay shared. */
type ContentTheme = 'dark' | 'light';
const LIGHT_THEME = {
  bg: '#f0ece4',
  fg: '#1a1a1a',
  codeBg: 'rgba(0, 0, 0, 0.08)',
  scanlineStrength: 0.13,
  gammaBrightness: 1,
  glowByPreset: {
    bvm: '#3b4660',
    ntsc: '#a36418',
    lisa: '#2e3f55',
    vt220: '#c46c1a',
    'ibm-5151': '#1a8a4a',
  } satisfies Record<CrtPreset, string>,
  glowShadow: `
    0 0 0.04em var(--crt-glow-color),
    0 0 0.24em color-mix(in srgb, var(--crt-glow-color) calc(40% * var(--crt-glow-strength)), transparent),
    0 0 0.55em color-mix(in srgb, var(--crt-glow-color) calc(11% * var(--crt-glow-strength)), transparent)
  `,
  vignette: `radial-gradient(
    ellipse at center,
    transparent 55%,
    rgba(40, 30, 20, calc(var(--crt-vignette-strength) * 0.7)) 100%
  )`,
} as const;

/* Drives the dark-mode removal pass so the set/clear branches can't drift. */
const LIGHT_HOST_VARS = [
  'background',
  'color',
  '--pg-code-bg',
  '--crt-glow-shadow',
  '--crt-gamma-brightness',
] as const;

const CYCLE_INTERVAL_MS = 4000;

@customElement('playground-app')
export class PlaygroundApp extends LitElement {
  @property({ type: String }) preset: CrtPreset = 'bvm';
  @property({ type: Boolean }) fullscreen = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) editing = false;
  @property({ type: String }) contentTheme: ContentTheme = 'dark';

  @state() private cycling = false;

  @state() private advancedOpen = false;
  @state() private installOpen = false;
  @state() private sheetOpen = false;

  @state() private userImageUrl: string | null = null;
  @state() private dragOver = false;

  @state() private layersOff: Record<LayerKey, boolean> = {
    scanlines: false,
  };

  @state() private noiseAlpha = NOISE_ALPHA_FALLBACK;
  @state() private noiseOverridden = false;

  @state() private sliderValues: Record<SliderKey, number> = {
    lines: 480,
    scanlineStrength: 0.22,
    glowStrength: 1,
    vignetteStrength: 0.16,
  };

  @state() private overrides = new Set<string>();

  @state() private glowColorEnabled = false;
  @state() private glowColor = '#ffffff';

  @state() private copyState: 'idle' | 'copied' = 'idle';
  @state() private lineCopied: number | null = null;

  @query('slot') private slotEl!: HTMLSlotElement;
  @query('.stage') private stageEl!: HTMLElement;
  @query('input.file-picker') private filePickerEl!: HTMLInputElement;

  #overlay: CrtOverlay | null = null;
  #cycleTimer: number | null = null;

  override firstUpdated(): void {
    this.#refreshOverlay();
    this.slotEl.addEventListener('slotchange', () => this.#refreshOverlay());
    this.#startCycleIfWanted();
    this.#wireDragDrop();
    this.filePickerEl.addEventListener('change', () => {
      const file = this.filePickerEl.files?.[0];
      if (!file?.type.startsWith('image/')) return;
      this.#userInteracted();
      this.#setUserImage(URL.createObjectURL(file));
      this.filePickerEl.value = '';
    });
    window.addEventListener('keydown', this.#onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopCycle();
    if (this.userImageUrl) {
      URL.revokeObjectURL(this.userImageUrl);
      this.userImageUrl = null;
    }
    window.removeEventListener('keydown', this.#onKeyDown);
  }

  #onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.sheetOpen) this.sheetOpen = false;
  };

  #toggleSheet(): void {
    this.sheetOpen = !this.sheetOpen;
  }

  #refreshOverlay(): void {
    const assigned = this.slotEl.assignedElements({ flatten: true });
    const overlay = assigned.find((el): el is CrtOverlay => el.tagName === 'CRT-OVERLAY') ?? null;
    this.#overlay = overlay;
    if (overlay) {
      this.#applyAll();
      this.#syncDropZones();
      this.#readSliderDefaults();
    }
  }

  /* On first load (when motion is allowed), auto-cycle presets to demonstrate
     the range. The first interaction with any control pins the current preset
     and ends cycling for the session. */
  #startCycleIfWanted(): void {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return;
    this.cycling = true;
    let index = PRESETS.indexOf(this.preset);
    this.#cycleTimer = window.setInterval(() => {
      index = (index + 1) % PRESETS.length;
      this.preset = PRESETS[index] ?? 'bvm';
    }, CYCLE_INTERVAL_MS);
  }

  #stopCycle(): void {
    if (this.#cycleTimer != null) {
      clearInterval(this.#cycleTimer);
      this.#cycleTimer = null;
    }
    this.cycling = false;
  }

  #userInteracted(): void {
    if (this.cycling) this.#stopCycle();
  }

  /* One image mirrored to all vignettes so it persists across preset switches. */
  #wireDragDrop(): void {
    const stage = this.stageEl;
    if (!stage) return;
    stage.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dragOver = true;
    });
    stage.addEventListener('dragleave', (e) => {
      // Only clear when leaving the stage itself, not its children
      if (e.target === stage) this.dragOver = false;
    });
    stage.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      this.dragOver = false;
      const file = e.dataTransfer?.files[0];
      if (!file?.type.startsWith('image/')) return;
      this.#userInteracted();
      this.#setUserImage(URL.createObjectURL(file));
    });
  }

  #setUserImage(url: string): void {
    if (this.userImageUrl) URL.revokeObjectURL(this.userImageUrl);
    this.userImageUrl = url;
  }

  #removeUserImage(): void {
    if (this.userImageUrl) URL.revokeObjectURL(this.userImageUrl);
    this.userImageUrl = null;
  }

  #readSliderDefaults(): void {
    if (!this.#overlay) return;
    const cs = getComputedStyle(this.#overlay);
    const next = { ...this.sliderValues };
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) continue;
      const parsed = Number.parseFloat(cs.getPropertyValue(s.var));
      if (Number.isFinite(parsed)) next[s.key] = parsed;
    }
    this.sliderValues = next;
    if (!this.noiseOverridden) {
      this.noiseAlpha = readPresetNoiseAlpha(this.#overlay);
    }
  }

  override updated(changed: Map<string, unknown>): void {
    // Restricted to keys that change the overlay — UI-only state (toasts,
    // disclosures, cycle indicator) must not trigger #applyAll.
    const overlayKeys = [
      'preset',
      'fullscreen',
      'disabled',
      'editing',
      'layersOff',
      'sliderValues',
      'overrides',
      'glowColorEnabled',
      'glowColor',
      'noiseAlpha',
      'noiseOverridden',
      'contentTheme',
    ];
    if (overlayKeys.some((k) => changed.has(k))) this.#applyAll();
    if (changed.has('userImageUrl') || changed.has('dragOver') || changed.has('preset')) {
      this.#syncDropZones();
    }
    if (changed.has('preset')) {
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

    const layer = o.shadowRoot?.querySelector('.overlay') as HTMLElement | null;
    for (const lyr of LAYERS) {
      if (!layer) break;
      if (this.layersOff[lyr.key]) layer.style.setProperty(lyr.var, 'none');
      else layer.style.removeProperty(lyr.var);
    }
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) {
        o.style.setProperty(s.var, String(this.sliderValues[s.key]));
      } else o.style.removeProperty(s.var);
    }

    const themeGlow = this.contentTheme === 'light' ? LIGHT_THEME.glowByPreset[this.preset] : null;
    const glowOverride = this.glowColorEnabled ? this.glowColor : themeGlow;
    if (glowOverride) o.style.setProperty('--crt-glow-color', glowOverride);
    else o.style.removeProperty('--crt-glow-color');

    if (layer) {
      if (this.noiseOverridden) {
        layer.style.setProperty(
          '--crt-noise',
          this.noiseAlpha <= 0 ? 'none' : buildNoiseSvgUrl(this.noiseAlpha),
        );
      } else {
        layer.style.removeProperty('--crt-noise');
      }
    }

    if (this.contentTheme === 'light') {
      o.style.setProperty('background', LIGHT_THEME.bg);
      o.style.setProperty('color', LIGHT_THEME.fg);
      o.style.setProperty('--pg-code-bg', LIGHT_THEME.codeBg);
      o.style.setProperty('--crt-glow-shadow', LIGHT_THEME.glowShadow);
      o.style.setProperty('--crt-gamma-brightness', String(LIGHT_THEME.gammaBrightness));
      if (!this.overrides.has('--crt-scanline-strength')) {
        o.style.setProperty('--crt-scanline-strength', String(LIGHT_THEME.scanlineStrength));
      }
      if (layer) layer.style.setProperty('--crt-vignette', LIGHT_THEME.vignette);
    } else {
      for (const prop of LIGHT_HOST_VARS) o.style.removeProperty(prop);
      if (layer) layer.style.removeProperty('--crt-vignette');
    }
  }

  /* Drop-zones live in light DOM (index.astro); we mutate them directly. */
  #syncDropZones(): void {
    if (!this.#overlay) return;
    const dropZones = this.#overlay.querySelectorAll<HTMLElement>('.drop-zone');
    for (const dz of dropZones) {
      for (const el of dz.querySelectorAll('img, .remove-btn')) el.remove();
      dz.toggleAttribute('data-dragover', this.dragOver);
      // Use a property to avoid stacking listeners across re-syncs.
      type Tappable = HTMLElement & { __tapHandler?: () => void };
      const tappable = dz as Tappable;
      if (tappable.__tapHandler) {
        dz.removeEventListener('click', tappable.__tapHandler);
        tappable.__tapHandler = undefined;
      }
      if (this.userImageUrl) {
        dz.style.cursor = '';
        const img = document.createElement('img');
        img.src = this.userImageUrl;
        img.alt = 'user-supplied photo through the CRT effect';
        dz.appendChild(img);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'remove-btn';
        rm.textContent = '× remove';
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          this.#userInteracted();
          this.#removeUserImage();
        });
        dz.appendChild(rm);
      } else {
        dz.style.cursor = 'pointer';
        const handler = () => {
          this.#userInteracted();
          this.filePickerEl.click();
        };
        tappable.__tapHandler = handler;
        dz.addEventListener('click', handler);
      }
    }
  }

  #setSlider(spec: SliderSpec, value: number): void {
    this.#userInteracted();
    this.sliderValues = { ...this.sliderValues, [spec.key]: value };
    this.overrides = new Set([...this.overrides, spec.var]);
  }

  #resetSlider(spec: SliderSpec): void {
    if (!this.overrides.has(spec.var)) return;
    const next = new Set(this.overrides);
    next.delete(spec.var);
    this.overrides = next;
    requestAnimationFrame(() => this.#readSliderDefaults());
  }

  #toggleLayer(key: LayerKey): void {
    this.#userInteracted();
    this.layersOff = { ...this.layersOff, [key]: !this.layersOff[key] };
  }

  #resetOverrides(): void {
    this.overrides = new Set();
    this.layersOff = { scanlines: false };
    this.glowColorEnabled = false;
    this.noiseOverridden = false;
    requestAnimationFrame(() => this.#readSliderDefaults());
  }

  #setNoiseAlpha(value: number): void {
    this.#userInteracted();
    this.noiseAlpha = value;
    this.noiseOverridden = true;
  }

  #resetNoise(): void {
    if (!this.noiseOverridden) return;
    this.noiseOverridden = false;
    requestAnimationFrame(() => {
      if (this.#overlay) this.noiseAlpha = readPresetNoiseAlpha(this.#overlay);
    });
  }

  #buildExport(): string {
    const attrs: string[] = [`preset="${this.preset}"`];
    if (this.fullscreen) attrs.push('fullscreen');
    if (this.disabled) attrs.push('disabled');

    const hostStyleParts: string[] = [];
    const partStyleParts: string[] = [];
    for (const s of SLIDERS) {
      if (this.overrides.has(s.var)) {
        hostStyleParts.push(`${s.var}: ${this.sliderValues[s.key]}`);
      }
    }
    if (this.glowColorEnabled) hostStyleParts.push(`--crt-glow-color: ${this.glowColor}`);
    for (const layer of LAYERS) {
      if (this.layersOff[layer.key]) partStyleParts.push(`${layer.var}: none`);
    }
    if (this.noiseOverridden) {
      partStyleParts.push(
        this.noiseAlpha <= 0
          ? '--crt-noise: none'
          : `--crt-noise: ${buildNoiseSvgUrl(this.noiseAlpha)}`,
      );
    }

    const styleAttr = hostStyleParts.length > 0 ? ` style="${hostStyleParts.join('; ')}"` : '';
    const slotted = this.fullscreen ? '' : '\n  …your content…\n';
    const partBlock =
      partStyleParts.length > 0
        ? `<style>\n  crt-overlay::part(overlay) {\n    ${partStyleParts.join(';\n    ')};\n  }\n</style>\n`
        : '';
    return `${partBlock}<crt-overlay ${attrs.join(' ')}${styleAttr}>${slotted}</crt-overlay>`;
  }

  async #copyExport(): Promise<void> {
    this.#userInteracted();
    const text = this.#buildExport();
    try {
      await navigator.clipboard.writeText(text);
      this.copyState = 'copied';
      setTimeout(() => {
        this.copyState = 'idle';
      }, 1400);
    } catch {
      window.prompt('Copy the snippet:', text);
    }
  }

  async #copyLine(index: number, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.lineCopied = index;
      setTimeout(() => {
        if (this.lineCopied === index) this.lineCopied = null;
      }, 1200);
    } catch {
      window.prompt('Copy:', text);
    }
  }

  #renderSlider(s: SliderSpec) {
    const v = this.sliderValues[s.key];
    const display = s.step >= 1 ? v.toFixed(0) : v.toFixed(s.step < 0.05 ? 3 : 2);
    return html`
      <label class="slider">
        <span class="slider-label">
          <span>${s.label}</span>
          <span class="value-cluster">
            <button
              type="button"
              class="reset-btn"
              title="reset to preset default"
              aria-label="reset ${s.label} to preset default"
              ?hidden=${!this.overrides.has(s.var)}
              @click=${(e: Event) => {
                e.preventDefault();
                this.#userInteracted();
                this.#resetSlider(s);
              }}
            >
              ↻
            </button>
            <span class="value">${display}</span>
          </span>
        </span>
        <input
          type="range"
          min=${s.min}
          max=${s.max}
          step=${s.step}
          .value=${String(v)}
          @input=${(e: Event) => {
            const value = Number.parseFloat((e.target as HTMLInputElement).value);
            this.#setSlider(s, value);
          }}
        />
      </label>
    `;
  }

  override render() {
    return html`
      <aside
        class=${this.sheetOpen ? 'panel open' : 'panel'}
        aria-label="CRT playground controls"
      >
        <button
          type="button"
          class="sheet-handle"
          aria-label=${this.sheetOpen ? 'collapse controls' : 'expand controls'}
          aria-expanded=${this.sheetOpen ? 'true' : 'false'}
          @click=${() => this.#toggleSheet()}
        >
          <span class="handle-bar" aria-hidden="true"></span>
        </button>
        <header class="brand">
          <span class="dot"></span>
          <span class="title">@labcat/crt</span>
          <span class="tag">playground</span>
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
                    this.#userInteracted();
                    this.preset = p;
                  }}
                >
                  ${p}
                </button>
              `,
            )}
          </div>
          ${
            this.cycling
              ? html`<p class="cycle-hint">
                <span class="cycle-dot"></span>
                auto-cycling · tap a control to stop
              </p>`
              : ''
          }
        </section>

        <section class="group">
          <h2>Theme</h2>
          <div class="presets two">
            <button
              type="button"
              class=${this.contentTheme === 'dark' ? 'preset on' : 'preset'}
              @click=${() => {
                this.#userInteracted();
                this.contentTheme = 'dark';
              }}
            >
              dark
            </button>
            <button
              type="button"
              class=${this.contentTheme === 'light' ? 'preset on' : 'preset'}
              @click=${() => {
                this.#userInteracted();
                this.contentTheme = 'light';
              }}
            >
              light
            </button>
          </div>
        </section>

        <section class="group">
          <h2>Scanlines</h2>
          ${this.#renderSlider(SLIDER_BY_KEY.lines)}
          ${this.#renderSlider(SLIDER_BY_KEY.scanlineStrength)}
        </section>

        <section class="group">
          <h2>Glow</h2>
          ${this.#renderSlider(SLIDER_BY_KEY.glowStrength)}
          <label class="row">
            <input
              type="checkbox"
              .checked=${this.glowColorEnabled}
              @change=${(e: Event) => {
                this.#userInteracted();
                this.glowColorEnabled = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>custom color</span>
          </label>
          <label class="color-row" ?hidden=${!this.glowColorEnabled}>
            <input
              type="color"
              .value=${this.glowColor}
              @input=${(e: Event) => {
                this.#userInteracted();
                this.glowColor = (e.target as HTMLInputElement).value;
              }}
            />
            <code>${this.glowColor}</code>
          </label>
        </section>

        <section class="group">
          <h2>Noise</h2>
          <label class="slider">
            <span class="slider-label">
              <span>amount</span>
              <span class="value-cluster">
                <button
                  type="button"
                  class="reset-btn"
                  title="reset to preset default"
                  aria-label="reset noise to preset default"
                  ?hidden=${!this.noiseOverridden}
                  @click=${(e: Event) => {
                    e.preventDefault();
                    this.#userInteracted();
                    this.#resetNoise();
                  }}
                >
                  ↻
                </button>
                <span class="value">${this.noiseAlpha.toFixed(3)}</span>
              </span>
            </span>
            <input
              type="range"
              min="0"
              max=${NOISE_MAX}
              step=${NOISE_STEP}
              .value=${String(this.noiseAlpha)}
              @input=${(e: Event) => {
                const v = Number.parseFloat((e.target as HTMLInputElement).value);
                this.#setNoiseAlpha(v);
              }}
            />
          </label>
        </section>

        <section class="group actions">
          <button type="button" class="primary" @click=${() => this.#copyExport()}>
            ${this.copyState === 'copied' ? 'copied!' : 'copy as HTML'}
          </button>
          <button
            type="button"
            class="ghost"
            @click=${() => {
              this.#userInteracted();
              this.#resetOverrides();
            }}
          >
            reset
          </button>
        </section>

        <details
          class="disclosure"
          ?open=${this.advancedOpen}
          @toggle=${(e: Event) => {
            this.advancedOpen = (e.target as HTMLDetailsElement).open;
            if (this.advancedOpen) this.#userInteracted();
          }}
        >
          <summary>Advanced</summary>
          <section class="group">
            <h2>Attributes</h2>
            <label class="row">
              <input
                type="checkbox"
                .checked=${this.fullscreen}
                @change=${(e: Event) => {
                  this.#userInteracted();
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
                  this.#userInteracted();
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
                  this.#userInteracted();
                  this.editing = (e.target as HTMLInputElement).checked;
                }}
              />
              <span>edit text</span>
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
            <h2>Tuning</h2>
            ${this.#renderSlider(SLIDER_BY_KEY.vignetteStrength)}
          </section>
        </details>

        <details
          class="disclosure"
          ?open=${this.installOpen}
          @toggle=${(e: Event) => {
            this.installOpen = (e.target as HTMLDetailsElement).open;
            if (this.installOpen) this.#userInteracted();
          }}
        >
          <summary>Get started</summary>
          <section class="group install">
            ${[
              'pnpm add @labcat/crt',
              "import '@labcat/crt';",
              "import '@labcat/crt/glow.css';",
            ].map(
              (line, i) => html`
                <div class="install-line">
                  <code>${line}</code>
                  <button
                    type="button"
                    class="copy-btn"
                    aria-label="copy ${line}"
                    @click=${() => this.#copyLine(i, line)}
                  >
                    ${this.lineCopied === i ? '✓' : '⎘'}
                  </button>
                </div>
              `,
            )}
            <p class="hint">
              Tag bright elements with <code>class="crt-glow"</code> in your own markup to pick
              up halation. The glow.css file binds the published CSS vars to that class.
            </p>
          </section>
        </details>

      </aside>

      <main class="stage">
        <slot></slot>
        ${
          this.dragOver
            ? html`<div class="drop-hint" aria-hidden="true">drop to load photo</div>`
            : ''
        }
      </main>
      <input class="file-picker" type="file" accept="image/*" aria-hidden="true" tabindex="-1" />
      <div
        class="scrim"
        ?hidden=${!this.sheetOpen}
        @click=${() => {
          this.sheetOpen = false;
        }}
        aria-hidden="true"
      ></div>
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
      --pg-bezel: #050505;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      padding: 1.1rem 1rem;
      border-right: 1px solid #1f1f1f;
      background: #0a0a0a;
      overflow-y: auto;
      max-height: 100vh;
      box-sizing: border-box;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding-bottom: 0.7rem;
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
    .brand .tag {
      margin-left: auto;
      font-size: 0.7rem;
      opacity: 0.45;
      text-transform: uppercase;
      letter-spacing: 0.12em;
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

    .preset,
    .chip {
      appearance: none;
      background: #141414;
      border: 1px solid #1f1f1f;
      color: #b8b8b8;
      padding: 0.4rem 0.55rem;
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
      text-align: left;
      transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
    }
    .preset:hover,
    .chip:hover {
      color: #f0f0f0;
      border-color: #2c2c2c;
    }
    .preset.on,
    .chip.on {
      color: #0a0a0a;
      background: #d5d5d5;
      border-color: #d5d5d5;
    }

    .cycle-hint {
      margin: 0.5rem 0 0;
      font-size: 0.7rem;
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .cycle-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4cff8a;
      animation: cycle-pulse 1.6s ease-in-out infinite;
    }
    @keyframes cycle-pulse {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .cycle-dot {
        animation: none;
      }
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
    .slider-label .value-cluster {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .slider-label .value {
      font-variant-numeric: tabular-nums;
      opacity: 0.6;
    }
    .slider .reset-btn {
      appearance: none;
      background: transparent;
      border: none;
      color: #8a8a8a;
      cursor: pointer;
      font: inherit;
      font-size: 0.85rem;
      line-height: 1;
      padding: 0;
      transition: color 120ms ease;
    }
    .slider .reset-btn:hover {
      color: #f0f0f0;
    }
    .slider .reset-btn[hidden] {
      display: none;
    }
    .slider input[type='range'] {
      width: 100%;
      accent-color: #d5d5d5;
    }

    .hint {
      margin: 0.35rem 0 0;
      font-size: 0.7rem;
      line-height: 1.5;
      opacity: 0.5;
    }
    .hint code {
      font-family: inherit;
      opacity: 0.85;
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

    .disclosure {
      border-top: 1px solid #1f1f1f;
      padding-top: 0.8rem;
    }
    .disclosure > summary {
      cursor: pointer;
      list-style: none;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.7;
      padding: 0.25rem 0;
      user-select: none;
    }
    .disclosure > summary::-webkit-details-marker {
      display: none;
    }
    .disclosure > summary::before {
      content: '▸ ';
      transition: transform 140ms ease;
      display: inline-block;
    }
    .disclosure[open] > summary::before {
      transform: rotate(90deg);
    }
    .disclosure[open] > summary {
      opacity: 1;
    }
    .disclosure > section.group {
      margin-top: 0.9rem;
    }

    .install .install-line {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #141414;
      border: 1px solid #1f1f1f;
      padding: 0.5rem 0.55rem;
      font-size: 0.75rem;
    }
    .install .install-line code {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #d5d5d5;
    }
    .install .copy-btn {
      appearance: none;
      background: transparent;
      border: 1px solid #1f1f1f;
      color: #b8b8b8;
      cursor: pointer;
      font: inherit;
      font-size: 0.85rem;
      line-height: 1;
      padding: 0.2rem 0.4rem;
      transition: color 120ms ease, border-color 120ms ease;
    }
    .install .copy-btn:hover {
      color: #f0f0f0;
      border-color: #2c2c2c;
    }

    /* ──── Stage ──── */
    .stage {
      position: relative;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .stage ::slotted(crt-overlay) {
      display: block;
      min-height: 100vh;
    }

    ::slotted(crt-overlay[contenteditable='true']) {
      outline: 1px dashed rgba(76, 255, 138, 0.35);
      outline-offset: -8px;
    }

    .drop-hint {
      position: absolute;
      inset: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(76, 255, 138, 0.05);
      border: 2px dashed rgba(76, 255, 138, 0.45);
      color: #4cff8a;
      z-index: 5;
    }

    .file-picker {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .sheet-handle {
      display: none;
    }
    .scrim {
      display: none;
    }

    @media (max-width: 720px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
      }
      .panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 88vh;
        border-right: none;
        border-top: 1px solid #1f1f1f;
        border-top-left-radius: 14px;
        border-top-right-radius: 14px;
        padding-top: 0;
        z-index: 10;
        box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.45);
        transform: translateY(calc(100% - var(--sheet-peek, 124px)));
        transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
      }
      .panel.open {
        transform: translateY(0);
      }
      .stage {
        padding-bottom: var(--sheet-peek, 124px);
      }
      .sheet-handle {
        display: flex;
        justify-content: center;
        align-items: center;
        appearance: none;
        background: transparent;
        border: 0;
        width: 100%;
        padding: 0.55rem 0 0.35rem;
        cursor: pointer;
        touch-action: manipulation;
        position: sticky;
        top: 0;
        background: #0a0a0a;
        z-index: 1;
      }
      .sheet-handle .handle-bar {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: #3a3a3a;
        transition: background 160ms ease;
      }
      .sheet-handle:hover .handle-bar,
      .sheet-handle:focus-visible .handle-bar {
        background: #5a5a5a;
      }
      .brand {
        display: none;
      }
      .scrim {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.32);
        z-index: 9;
        animation: scrim-in 180ms ease-out;
      }
      .scrim[hidden] {
        display: none;
      }
    }

    @keyframes scrim-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .panel {
        transition: none;
      }
      .scrim {
        animation: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'playground-app': PlaygroundApp;
  }
}
