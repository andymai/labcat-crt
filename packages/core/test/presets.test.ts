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
        expect(hostVar(el, '--crt-scanlines')).toContain('linear-gradient');
      });

      it('resolves --crt-vignette to a gradient', async () => {
        const el = await mount(preset);
        expect(hostVar(el, '--crt-vignette')).toContain('gradient');
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
    expect(hostVar(amber, '--crt-grille')).toBe('none');
    expect(hostVar(green, '--crt-grille')).toBe('none');
    expect(hostVar(p4, '--crt-grille')).toBe('none');
  });

  it('color presets enable the aperture grille', async () => {
    const pvm = await mount('pvm');
    const cons = await mount('consumer');
    expect(hostVar(pvm, '--crt-grille')).toContain('linear-gradient');
    expect(hostVar(cons, '--crt-grille')).toContain('linear-gradient');
  });
});
