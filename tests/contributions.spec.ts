import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('protected form has no direct-provider fallback and closes safely without setup', async ({ page }) => {
  await page.goto('/contribute/');
  await expect(page.locator('#contribution-form')).toHaveAttribute('action', '/api/contributions');
  if (await page.locator('#contribution-form').getAttribute('data-enabled') === 'false') {
    await expect(page.getByRole('button', { name: 'Send to Dawas' })).toBeDisabled();
    await expect(page.locator('main')).toContainText('temporarily closed');
  }
  await expect(page.locator('main')).toContainText('Your email will not be published');
  expect(await page.content()).not.toContain('formspree.io/f/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
test('conditional resource fields remain usable', async ({ page }) => {
  await page.goto('/contribute/');
  await page.getByLabel('Resource type').selectOption('skill');
  await expect(page.locator('#resource-content')).toHaveAttribute('required', '');
  await page.getByLabel('Resource type').selectOption('website');
  await expect(page.locator('#resource-url')).toHaveAttribute('required', '');
});
// Exercise the enabled UI using test-only HTML and a mocked same-origin endpoint.
// No CAPTCHA is solved and no external service receives any data.
async function enabledPage(page: import('@playwright/test').Page) {
  await page.route('**/contribute/', async route => {
    const response = await route.fetch();
    let html = (await response.text()).replace('data-enabled="false"', 'data-enabled="true"');
    html = html.replace('</form>', '<input type="hidden" name="cf-turnstile-response" value="test-token"></form>');
    await route.fulfill({ response, body: html });
  });
  await page.goto('/contribute/');
  await page.getByLabel('Resource type').selectOption('prompt');
  await page.getByLabel('Resource name').fill('Example prompt');
  await page.getByLabel('What does it help with?').fill('This prompt helps me create a well structured first draft.');
  await page.locator('#resource-content').fill('Explain the audience and outline the draft.');
}
test('successful submission resets fields and cooldown survives reload', async ({ page }) => {
  await page.route('**/api/contributions', route => route.fulfill({ json: { ok: true } }));
  await enabledPage(page);
  await page.getByRole('button', { name: 'Send to Dawas' }).click();
  await expect(page.locator('#contribution-status')).toContainText('sent to Dawas for review');
  await expect(page.getByLabel('Resource name')).toBeEmpty();
  await expect(page.getByRole('button', { name: 'Send to Dawas' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Send to Dawas' })).toBeDisabled();
});
test('server rate rejection preserves content and applies retry delay', async ({ page }) => {
  await page.route('**/api/contributions', route => route.fulfill({ status: 429, json: { ok: false, error: 'rate_limit', retryAfter: 3600 } }));
  await enabledPage(page);
  await page.getByRole('button', { name: 'Send to Dawas' }).click();
  await expect(page.locator('#contribution-status')).toContainText('60 minute(s)');
  await expect(page.getByLabel('Resource name')).toHaveValue('Example prompt');
  await expect(page.getByRole('button', { name: 'Send to Dawas' })).toBeDisabled();
});
test('verification and service failures never claim success or clear text', async ({ page }) => {
  await page.route('**/api/contributions', route => route.fulfill({ status: 400, json: { ok: false, error: 'verification' } }));
  await enabledPage(page);
  await page.getByRole('button', { name: 'Send to Dawas' }).click();
  await expect(page.locator('#contribution-status')).toContainText('Verification expired or failed');
  await expect(page.getByLabel('Resource name')).toHaveValue('Example prompt');
  await page.route('**/api/contributions', route => route.fulfill({ status: 503, json: { ok: false, error: 'unavailable' } }));
  await page.getByRole('button', { name: 'Send to Dawas' }).click();
  await expect(page.locator('#contribution-status')).toContainText('temporarily unavailable');
  await expect(page.getByLabel('Resource name')).toHaveValue('Example prompt');
});
