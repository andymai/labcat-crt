import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers';
import { afterEach, describe, expect, it } from 'vitest';

import '../src/index.js';
import type { CrtOverlay } from '../src/index.js';

function docVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name).trim();
}

async function nextFrame(): Promise<void> {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

describe('fullscreen refcount', () => {
  afterEach(() => {
    fixtureCleanup();
    document.documentElement.removeAttribute('style');
  });

  it('publishes halation vars to documentElement when a fullscreen instance connects', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    await el.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
  });

  it('clears documentElement vars when the last fullscreen instance disconnects', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    await el.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
    el.remove();
    expect(docVar('--crt-glow-shadow')).toBe('');
  });

  it('keeps vars published while at least one instance remains', async () => {
    const a = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    const b = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    await a.updateComplete;
    await b.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
    a.remove();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
    b.remove();
    expect(docVar('--crt-glow-shadow')).toBe('');
  });

  it('does not publish vars for non-fullscreen instances', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    await el.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow')).toBe('');
  });

  it('unpublishes vars when fullscreen is toggled off via attribute', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    await el.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
    el.fullscreen = false;
    await el.updateComplete;
    expect(docVar('--crt-glow-shadow')).toBe('');
  });

  it('unpublishes vars when an instance is disabled', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    await el.updateComplete;
    await nextFrame();
    expect(docVar('--crt-glow-shadow').length).toBeGreaterThan(0);
    el.disabled = true;
    await el.updateComplete;
    expect(docVar('--crt-glow-shadow')).toBe('');
  });
});
