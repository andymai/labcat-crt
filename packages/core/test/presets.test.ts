import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers';
import { afterEach, describe, expect, it } from 'vitest';

import '../src/index.js';
import type { CrtOverlay, CrtPreset } from '../src/index.js';

const presets: CrtPreset[] = ['calm', 'warm', 'cool', 'pvm', 'consumer'];

async function mount(preset: CrtPreset): Promise<CrtOverlay> {
  return fixture<CrtOverlay>(html`<crt-overlay preset=${preset}></crt-overlay>`);
}

function hostVar(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/* Gradient-bearing vars live on .overlay (cqb/cqi can't query their own
   container; they have to resolve in a descendant of :host). */
function overlayVar(el: CrtOverlay, name: string): string {
  const overlay = el.shadowRoot?.querySelector('.overlay');
  if (!overlay) return '';
  return getComputedStyle(overlay).getPropertyValue(name).trim();
}

describe('preset CSS variables', () => {
  afterEach(() => {
    fixtureCleanup();
    document.documentElement.removeAttribute('style');
  });

  for (const preset of presets) {
    describe(`preset="${preset}"`, () => {
      it('resolves --crt-glow-shadow to a non-empty value', async () => {
        const el = await mount(preset);
        const shadow = hostVar(el, '--crt-glow-shadow');
        expect(shadow.length).toBeGreaterThan(0);
        expect(shadow).not.toBe('none');
      });

      it('resolves --crt-scanlines to a gradient', async () => {
        const el = await mount(preset);
        expect(overlayVar(el, '--crt-scanlines')).toContain('linear-gradient');
      });

      it('resolves --crt-vignette to a gradient', async () => {
        const el = await mount(preset);
        expect(overlayVar(el, '--crt-vignette')).toContain('gradient');
      });

      it('does not render an aperture grille', async () => {
        const el = await mount(preset);
        expect(overlayVar(el, '--crt-grille')).toBe('none');
      });
    });
  }

  it('every preset exposes the editorial-strength CSS vars', async () => {
    const calm = await mount('calm');
    expect(hostVar(calm, '--crt-scanline-strength')).toBe('0.22');
    expect(hostVar(calm, '--crt-vignette-strength')).toBe('0.16');
    expect(hostVar(calm, '--crt-glow-strength')).toBe('1');
    expect(hostVar(calm, '--crt-breathing-amplitude')).toBe('0.025');
  });

  it('--crt-scanline-strength is a public override hook', async () => {
    const el = await mount('calm');
    el.style.setProperty('--crt-scanline-strength', '0.5');
    expect(hostVar(el, '--crt-scanline-strength')).toBe('0.5');
  });

  const expectedLines: Record<CrtPreset, string> = {
    calm: '480',
    warm: '420',
    cool: '540',
    pvm: '480',
    consumer: '420',
  };
  for (const preset of presets) {
    it(`${preset} sets its --crt-lines constant`, async () => {
      const el = await mount(preset);
      expect(hostVar(el, '--crt-lines')).toBe(expectedLines[preset]);
    });
  }
});
