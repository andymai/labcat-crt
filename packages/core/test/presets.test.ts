import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers';
import { afterEach, describe, expect, it } from 'vitest';

import '../src/index.js';
import type { CrtOverlay, CrtPreset } from '../src/index.js';

const presets: CrtPreset[] = ['pvm', 'consumer', 'amber', 'green', 'p4-white'];

async function mount(preset: CrtPreset): Promise<CrtOverlay> {
  return fixture<CrtOverlay>(html`<crt-overlay preset=${preset}></crt-overlay>`);
}

function hostVar(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/*
 * Gradient-bearing vars (--crt-scanlines, --crt-grille, …) live on .overlay
 * because a container cannot query its own cqb/cqi units — they have to
 * resolve in a descendant of :host.
 */
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
    });
  }

  it('PVM has no chromatic aberration', async () => {
    const el = await mount('pvm');
    const aberr = hostVar(el, '--crt-aberration-shadow');
    expect(aberr).toMatch(/transparent/);
  });

  it('consumer preset enables sub-pixel aberration', async () => {
    const el = await mount('consumer');
    const aberr = hostVar(el, '--crt-aberration-shadow');
    expect(aberr).toMatch(/rgba?\(/);
    expect(aberr).not.toMatch(/^\s*0\s+0\s+0\s+transparent\s*$/);
  });

  it('monochrome presets disable the aperture grille', async () => {
    const amber = await mount('amber');
    const green = await mount('green');
    const p4 = await mount('p4-white');
    expect(overlayVar(amber, '--crt-grille')).toBe('none');
    expect(overlayVar(green, '--crt-grille')).toBe('none');
    expect(overlayVar(p4, '--crt-grille')).toBe('none');
  });

  it('color presets enable the aperture grille', async () => {
    const pvm = await mount('pvm');
    const cons = await mount('consumer');
    expect(overlayVar(pvm, '--crt-grille')).toContain('linear-gradient');
    expect(overlayVar(cons, '--crt-grille')).toContain('linear-gradient');
  });

  it('consumer grille layers an aperture stripe with a horizontal interruption', async () => {
    const cons = await mount('consumer');
    const grille = overlayVar(cons, '--crt-grille');
    expect(grille.match(/repeating-linear-gradient/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  const expectedLines: Record<CrtPreset, string> = {
    pvm: '480',
    consumer: '480',
    amber: '400',
    green: '350',
    'p4-white': '364',
  };
  const expectedTriads: Record<CrtPreset, string> = {
    pvm: '480',
    consumer: '320',
    amber: '480',
    green: '480',
    'p4-white': '480',
  };
  for (const preset of presets) {
    it(`${preset} sets historical --crt-lines and --crt-triads constants`, async () => {
      const el = await mount(preset);
      expect(hostVar(el, '--crt-lines')).toBe(expectedLines[preset]);
      expect(hostVar(el, '--crt-triads')).toBe(expectedTriads[preset]);
    });
  }

  it('--crt-aberration-x is a public override hook', async () => {
    const el = await mount('pvm');
    el.style.setProperty('--crt-aberration-x', '1.5px');
    expect(hostVar(el, '--crt-aberration-x')).toBe('1.5px');
  });
});
