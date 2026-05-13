import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers';
import { afterEach, describe, expect, it } from 'vitest';

import { CrtOverlay } from '../src/index.js';

describe('<crt-overlay>', () => {
  afterEach(() => {
    fixtureCleanup();
    document.documentElement.removeAttribute('style');
  });

  it('registers as a custom element', () => {
    expect(customElements.get('crt-overlay')).toBe(CrtOverlay);
  });

  it('renders slotted content in per-container mode', async () => {
    const el = await fixture<CrtOverlay>(html`
      <crt-overlay>
        <h1 id="probe">hello</h1>
      </crt-overlay>
    `);
    const slotted = el.querySelector('#probe');
    expect(slotted).toBeTruthy();
    expect(slotted?.textContent).toBe('hello');
  });

  it('paints an overlay layer in the shadow root', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(overlay).toBeTruthy();
    const cs = getComputedStyle(overlay as Element);
    expect(cs.pointerEvents).toBe('none');
    expect(cs.position).toBe('absolute');
  });

  it('switches overlay positioning to fixed when fullscreen is set', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fullscreen></crt-overlay>`);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(getComputedStyle(overlay as Element).position).toBe('fixed');
  });

  it('hides the overlay layer when disabled', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay disabled></crt-overlay>`);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(getComputedStyle(overlay as Element).display).toBe('none');
  });

  it('reflects attribute changes reactively', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    expect(el.disabled).toBe(false);
    el.disabled = true;
    await el.updateComplete;
    expect(el.hasAttribute('disabled')).toBe(true);
    const overlay = el.shadowRoot?.querySelector('.overlay');
    expect(getComputedStyle(overlay as Element).display).toBe('none');
  });
});
