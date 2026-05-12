import { expect, test } from '@playwright/test';

const presets = ['pvm', 'consumer', 'amber', 'green', 'p4-white'] as const;

for (const preset of presets) {
  test(`${preset} preset snapshot`, async ({ page }) => {
    await page.goto(`/${preset}/`);
    await page.waitForFunction(() => Boolean(customElements.get('crt-overlay')));
    const host = page.locator('crt-overlay').first();
    await host.waitFor({ state: 'attached' });
    await page.waitForFunction(() => {
      const el = document.querySelector('crt-overlay') as
        | (HTMLElement & {
            updateComplete?: Promise<unknown>;
          })
        | null;
      return Boolean(el?.shadowRoot);
    });
    await expect(page).toHaveScreenshot(`${preset}.png`);
  });
}

test('gallery index snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(customElements.get('crt-overlay')));
  const cells = page.locator('crt-overlay');
  await expect(cells).toHaveCount(5);
  await page.waitForFunction(() => document.querySelectorAll('crt-overlay').length === 5);
  await page.waitForTimeout(120);
  await expect(page).toHaveScreenshot('gallery.png');
});
