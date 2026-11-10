import { expect, test } from '@playwright/test';
import path from 'node:path';

const LEAF = path.join(import.meta.dirname, 'fixtures', 'leaf.jpg');

test('the core loop: sign in → onboard → add a tree → log → scan → complete the task → season review', async ({ page }) => {
  // Sign in with the dev OTP (enabled only outside production).
  await page.goto('/login');
  await page.getByLabel(/phone number/i).fill('9999988888');
  await page.getByRole('button', { name: /send code/i }).click();
  await page.getByLabel(/verification code/i).fill('123456');
  await page.getByRole('button', { name: /verify/i }).click();

  // Onboarding (fresh database, so it always runs).
  await page.getByRole('button', { name: /english/i }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /east india/i }).click();
  await page.getByLabel(/district/i).fill('Patna');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /fruit trees/i }).click();
  await page.getByRole('button', { name: /finish/i }).click();
  await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible();

  // Add a tree via the catalogue.
  await page.getByRole('link', { name: /add a tree/i }).click();
  await page.getByLabel(/^name/i).fill('Aam');
  await page.getByLabel(/what is it/i).fill('mango');
  await page.getByRole('option').first().click();
  await page.getByLabel(/year planted/i).fill('2015');
  await page.getByRole('button', { name: /save tree/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Aam' })).toBeVisible();

  // Log a moment with a photo; it shows on the timeline with its image.
  await page.getByRole('link', { name: /log a moment/i }).click();
  await page.getByRole('button', { name: /^flowering$/i }).click();
  await page.getByLabel(/add a photo/i).setInputFiles(LEAF);
  await page.getByLabel(/note/i).fill('Panicles opening');
  await page.getByRole('button', { name: /save moment/i }).click();
  await expect(page.getByText('Panicles opening')).toBeVisible();
  await expect(page.locator('ol img').first()).toBeVisible();

  // Scan → diagnose (fake AI) → saved to Aam with a follow-up task.
  // Detail and result screens have a back button, not the bottom bar; go via the tab.
  await page.goto('/scan');
  await page.getByRole('button', { name: /what's wrong/i }).click();
  await page.getByLabel(/which tree/i).selectOption({ label: 'Aam' });
  await page.getByLabel(/take or choose a photo/i).setInputFiles(LEAF);
  await page.getByRole('button', { name: /^diagnose$/i }).click();
  await expect(page.getByRole('heading', { name: /pest/i })).toBeVisible();
  await expect(page.getByText(/saved to aam/i)).toBeVisible();
  await expect(page.getByRole('article', { name: /spray neem oil/i })).toBeVisible();

  // Dashboard: the follow-up is due this week; complete it.
  await page.goto('/');
  const task = page.getByRole('article', { name: /spray neem oil/i });
  await expect(task).toBeVisible();
  await task.getByRole('button', { name: /complete/i }).click();
  await expect(task).toBeHidden();

  // Season review for Aam.
  await page.getByRole('link', { name: /plants/i }).click();
  await page.getByRole('link', { name: /aam/i }).click();
  await page.getByRole('link', { name: /season review/i }).click();
  await expect(page.getByRole('heading', { name: /season \d{4}/i })).toBeVisible();
});
