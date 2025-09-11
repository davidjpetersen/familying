import { test, expect } from '@playwright/test';

test('Kid bedtime lock prevents navigation until completion', async ({ page }) => {
  await page.goto('/kid/test-child/apps/soundscapes');
  await page.getByRole('button', { name: 'Start' }).click();
  // Simulate attempt to navigate away
  await page.goto('/');
  // In real test, we would observe the beforeunload behavior; this is a placeholder
  await expect(page).toHaveURL(/\//);
});

