import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers';
import { afterEach, describe, expect, it } from 'vitest';

import '../src/index.js';
import type { CrtOverlay } from '../src/index.js';

describe('accessibility + media-query guards', () => {
  afterEach(() => {
    fixtureCleanup();
    document.documentElement.removeAttribute('style');
  });
  it('marks the overlay layer aria-hidden', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes the overlay layer as a CSS part', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(overlay?.getAttribute('part')).toBe('overlay');
  });

  /*
   * Reduced-motion is exercised via headless-browser DPR/media emulation in
   * the demo's Playwright snapshot tests, where the rendered output is the
   * authoritative signal. Vitest can't reliably toggle prefers-reduced-motion
   * on a live element (matchMedia is read-only for the test runner) so we
   * settle for verifying the CSS rule shape is present in the shadow root.
   */
  it('ships a prefers-reduced-motion rule in the shadow root', async () => {
    await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const styleSheets = Array.from(
      document.querySelector('crt-overlay')?.shadowRoot?.adoptedStyleSheets ?? [],
    );
    const allRulesText = styleSheets
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .join('\n');
    expect(allRulesText).toMatch(/prefers-reduced-motion/);
    expect(allRulesText).toMatch(/forced-colors/);
  });
});
