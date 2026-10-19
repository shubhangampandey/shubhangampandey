import { test, expect } from '@playwright/test';

test('shows project source and live destinations for all three repositories', async ({ page }) => {
  await page.goto('/#/linktree');
  const links = page.getByRole('region', { name: 'Project repositories and live websites' });
  await expect(links.getByRole('link', { name: 'GitHub repository' })).toHaveCount(3);
  await expect(links.getByRole('link', { name: 'Live website' })).toHaveCount(3);
  await expect(links.locator('a[href="https://github.com/shubhangampandey/AgentFence"]')).toBeVisible();
  await expect(links.locator('a[href="https://github.com/shubhangampandey/CasualScope"]')).toBeVisible();
  await expect(links.locator('a[href="https://shubhangampandey.vercel.app"]')).toBeVisible();
});

test('preserves the message on delivery failure and supports retry', async ({ page }) => {
  await page.route('**/api/contact', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Email delivery is not configured yet.' }) }));
  await page.goto('/#/contact');
  await page.getByLabel('01 / YOUR NAME').fill('Visitor');
  await page.getByLabel('02 / EMAIL ADDRESS').fill('visitor@example.test');
  await page.getByLabel('03 / THE MESSAGE').fill('A project enquiry that should not be lost.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.form-feedback')).toContainText('not configured');
  await expect(page.getByLabel('03 / THE MESSAGE')).toHaveValue('A project enquiry that should not be lost.');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();
});
