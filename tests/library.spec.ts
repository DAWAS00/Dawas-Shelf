import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('search, type filters, empty state, reset, and URL restoration work together', async ({ page }) => {
  await page.goto('/resources/');
  // Use Astro's rendered inventory: it already resolves nested and excluded files.
  const total = Number(await page.locator('[data-filter="all"] span').textContent());
  const websites = Number(await page.locator('[data-filter="website"] span').textContent());
  await expect(page.locator('[data-resource]:visible')).toHaveCount(total);
  await page.getByRole('button', { name: /^Websites/ }).click();
  await expect(page.locator('[data-resource]:visible')).toHaveCount(websites);
  await page.getByRole('searchbox').fill('Perplexity');
  await expect(page.locator('[data-resource="perplexity"]')).toBeVisible();
  await expect(page.locator('[data-resource="cursor"]')).toBeHidden();
  await expect(page).toHaveURL(/type=website&q=Perplexity/);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('Perplexity');
  await expect(page.locator('[data-resource="perplexity"]')).toBeVisible();
  await expect(page.locator('[data-resource="cursor"]')).toBeHidden();
  await page.getByRole('searchbox').fill('no-matching-resource-xyz');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button', { name: /Clear all filters/ }).click();
  await expect(page.locator('[data-resource]:visible')).toHaveCount(total);
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByLabel('Sort resources').selectOption('az');
  const alphabetized = await page.locator('[data-resource]:visible').evaluateAll(cards => {
    const titles = cards.map(card => (card as HTMLElement).dataset.title!);
    return titles.every((title, i) => i === 0 || titles[i - 1].localeCompare(title) <= 0);
  });
  expect(alphabetized).toBeTruthy();
});

test('saving persists through detail navigation and reload; removal updates My shelf', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Save Perplexity', exact: true }).click();
  await expect(page.locator('[data-saved-count]')).toHaveText('1');
  await page.goto('/resources/perplexity/');
  await expect(page.locator('.save-detail')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.save-detail')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /My shelf/ }).click();
  await expect(page.locator('[data-resource]:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove Perplexity from my shelf', exact: true }).click();
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('[data-saved-count]')).toHaveText('0');
});

test('blocked storage still allows a shelf for the current page', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new Error('Storage blocked'); } });
  });
  await page.goto('/resources/');
  await page.getByRole('button', { name: 'Save Perplexity', exact: true }).click();
  await expect(page.locator('#toast')).toHaveText(/Storage is unavailable/);
  await page.getByRole('button', { name: 'Saved only' }).click();
  await expect(page.locator('[data-resource]:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Remove Perplexity from my shelf', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('prompt copy sends the complete prompt to the clipboard API', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as unknown as { copiedText: string }).copiedText = text; } } });
  });
  await page.goto('/resources/creative-brief/');
  await page.getByRole('button', { name: 'Copy prompt', exact: true }).first().click();
  await expect(page.locator('#toast')).toHaveText('Copied. Make it your own.');
  const actual = await page.evaluate(() => (window as unknown as { copiedText: string }).copiedText);
  expect(actual).toBe(await page.locator('#copy-content').textContent());
  expect(actual).toContain('[Paste your idea here]');
});

test('failed copying selects the skill text and gives an honest manual fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Not allowed'); } } });
  });
  await page.goto('/resources/research-companion/');
  await page.getByRole('button', { name: 'Copy SKILL.md', exact: true }).first().click();
  await expect(page.locator('#toast')).toHaveText(/copy it manually/);
  expect(await page.evaluate(() => window.getSelection()?.toString())).toContain('name: research-companion');
});

test('enlarged preview traps focus, closes with Escape, and returns focus', async ({ page }) => {
  await page.goto('/resources/perplexity/');
  await page.getByRole('button', { name: 'Enlarge' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('An editorial illustration');
  await expect(page.getByRole('button', { name: 'Close preview' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Enlarge' })).toBeFocused();
});

test('pages have no horizontal overflow and pass essential accessibility checks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/resources/', '/resources/research-companion/', '/resources/creative-brief/', '/resources/idea-to-published/', '/resources/perplexity/', '/about/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', /settled|static/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBeTruthy();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), path).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('reduced motion removes page movement and never loads the hero video automatically', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const selector of ['.screen-mist i', '[data-hero-line]', '.hero-film']) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  }
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).scrollBehavior)).toBe('auto');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('#hero-film')).not.toHaveAttribute('src');
  await expect(page.getByRole('button', { name: 'Play hero video' })).toBeVisible();
  await expect(page.locator('[data-motion-toggle]')).toBeDisabled();
});

test('the exact new name appears in branding and page metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/^Dawas Shlef/);
  await expect(page.getByRole('link', { name: 'Dawas Shlef home' })).toBeVisible();
  await expect(page.locator('footer .brand')).toHaveText('Dawas Shlef.');
});

test('hero video plays, pauses on request, and pauses when it leaves view', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'settled');
  const video = page.locator('#hero-film');
  await video.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  // Mobile browsers can require an explicit gesture, which the film control supports.
  if (await video.evaluate(el => !(el as HTMLVideoElement).paused)) {
    await page.getByRole('button', { name: 'Pause hero video' }).click();
  }
  await page.getByRole('button', { name: 'Play hero video' }).click();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(.05);
  await page.getByRole('button', { name: 'Pause hero video' }).click();
  expect(await video.evaluate(el => (el as HTMLVideoElement).paused)).toBeTruthy();
  await page.getByRole('button', { name: 'Play hero video' }).click();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBeFalsy();
  await page.locator('#library-title').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBeTruthy();
});

test('global motion setting stops the video, settles the text, and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Turn animations off' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  expect(await page.locator('#hero-film').evaluate(el => (el as HTMLVideoElement).paused)).toBeTruthy();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('#hero-film')).not.toHaveAttribute('src');
  await page.getByRole('button', { name: 'Turn animations on' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'settled');
});

test('data saver keeps the poster without downloading a video', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', 'settled');
  await expect(page.locator('#hero-film')).not.toHaveAttribute('src');
  await expect(page.getByRole('button', { name: 'Play hero video' })).toBeVisible();
});

test('Markdown pages and resource links render without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/resources/');
  const total = Number(await page.locator('[data-filter="all"] span').textContent());
  await expect(page.locator('[data-resource]')).toHaveCount(total);
  await page.getByRole('link', { name: 'Research companion', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Research companion', exact: true })).toBeVisible();
  await expect(page.locator('#copy-content')).toContainText('name: research-companion');
  await context.close();
});
