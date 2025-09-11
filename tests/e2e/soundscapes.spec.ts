import { test, expect } from '@playwright/test';

test('Start/Stop/Timer flow (parent view)', async ({ page }) => {
  await page.goto('/apps/soundscapes');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Set' }).click();
  await page.getByRole('button', { name: 'Fade Out' }).click();
  await expect(page).toHaveURL(/\/apps\/soundscapes/);
});

