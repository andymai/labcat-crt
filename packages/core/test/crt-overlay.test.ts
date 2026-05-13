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

  it('renders a .content wrapper around the slot for filter targeting', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content');
    expect(content).toBeTruthy();
    expect(content?.querySelector('slot')).toBeTruthy();
  });

  it('ships SVG filter defs in the shadow DOM', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const filters = el.shadowRoot?.querySelector('svg.crt-filters');
    expect(filters).toBeTruthy();
    expect(filters?.querySelector('#crt-bloom')).toBeTruthy();
    expect(filters?.querySelector('#crt-aberration')).toBeTruthy();
    expect(filters?.querySelector('#crt-ntsc')).toBeTruthy();
  });

  it('fidelity attribute reflects and accepts standard/high/max', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fidelity="high"></crt-overlay>`);
    expect(el.fidelity).toBe('high');
    expect(el.getAttribute('fidelity')).toBe('high');
    el.fidelity = 'max';
    await el.updateComplete;
    expect(el.getAttribute('fidelity')).toBe('max');
  });

  it('standard fidelity leaves .content unfiltered', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content') as Element;
    expect(getComputedStyle(content).filter).toBe('none');
  });

  it('attaches SVG bloom filter to .content at fidelity=high', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fidelity="high"></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content') as Element;
    expect(getComputedStyle(content).filter).toMatch(/url\(["']?#?crt-bloom["']?\)/);
  });

  it('consumer preset adds aberration to the filter chain', async () => {
    const el = await fixture<CrtOverlay>(
      html`<crt-overlay preset="consumer" fidelity="high"></crt-overlay>`,
    );
    const content = el.shadowRoot?.querySelector('.content') as Element;
    const f = getComputedStyle(content).filter;
    expect(f).toMatch(/crt-bloom/);
    expect(f).toMatch(/crt-aberration/);
  });

  it('non-consumer presets at fidelity=high get bloom only, no aberration', async () => {
    const el = await fixture<CrtOverlay>(
      html`<crt-overlay preset="pvm" fidelity="high"></crt-overlay>`,
    );
    const content = el.shadowRoot?.querySelector('.content') as Element;
    const f = getComputedStyle(content).filter;
    expect(f).toMatch(/crt-bloom/);
    expect(f).not.toMatch(/crt-aberration/);
  });

  it('fidelity=max adds curvature via transform on .content', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fidelity="max"></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content') as Element;
    const t = getComputedStyle(content).transform;
    // Browsers serialize `perspective(800px) rotateX(0.4deg)` as a 3D matrix.
    expect(t).not.toBe('none');
    expect(t).toMatch(/matrix3d/);
  });

  it('non-max fidelity leaves .content with no transform', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fidelity="high"></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content') as Element;
    expect(getComputedStyle(content).transform).toBe('none');
  });

  it('disabled clears .content filter even at fidelity=max', async () => {
    const el = await fixture<CrtOverlay>(html`<crt-overlay fidelity="max" disabled></crt-overlay>`);
    const content = el.shadowRoot?.querySelector('.content') as Element;
    expect(getComputedStyle(content).filter).toBe('none');
    expect(getComputedStyle(content).transform).toBe('none');
  });
});
