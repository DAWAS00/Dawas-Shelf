import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('learning guide is discoverable, source-linked, accessible, and fits the viewport', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Learning', exact: true }).click();
  await expect(page).toHaveURL(/\/learning\/$/);
  await page.getByRole('link', { name: 'Read the guide', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Better prompts, one experiment at a time');
  await expect(page.locator('.learning-prose table').nth(1).locator('tbody tr')).toHaveCount(9);
  await expect(page.getByRole('link', { name: 'Original tutorial' })).toHaveAttribute('href', 'https://github.com/anthropics/prompt-eng-interactive-tutorial');
  await expect(page.locator('.learning-prose')).toContainText('does not reproduce the course');
  const anchorTargetsExist = await page.getByRole('navigation', { name: 'In this guide' }).locator('a').evaluateAll(links => links.every(link => document.getElementById(decodeURIComponent(link.getAttribute('href')!.slice(1)))));
  expect(anchorTargetsExist).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
});
