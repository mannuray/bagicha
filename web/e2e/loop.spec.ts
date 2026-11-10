import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const LEAF = path.join(import.meta.dirname, 'fixtures', 'leaf.jpg');
const SHOTS = path.join(import.meta.dirname, '..', 'test-results', 'screens');

/** Every screen must fit a 360px phone: no sideways scrolling. */
async function checkScreen(page: Page, name: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${name} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

test('the core loop: sign in → onboard → add a tree → log → scan → complete the task → season review', async ({ page }) => {
  // Sign in with the dev OTP (enabled only outside production).
  await page.goto('/login');
  await checkScreen(page, '01-login');
  await page.getByLabel(/phone number/i).fill('9999988888');
  await page.getByRole('button', { name: /send code/i }).click();
  await page.getByLabel(/verification code/i).fill('123456');
  await page.getByRole('button', { name: /verify/i }).click();

  // Onboarding (fresh database, so it always runs).
  await checkScreen(page, '02-language');
  await page.getByRole('button', { name: /english/i }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await checkScreen(page, '03-region');
  await page.getByLabel(/district/i).fill('Patna');
  await expect(page.getByText(/east india/i)).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /fruit trees/i }).click();
  await page.getByRole('button', { name: /start gardening/i }).click();
  await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible();
  await checkScreen(page, '04-dashboard-empty');

  // Add a tree via the catalogue.
  await page.getByRole('link', { name: /add a tree/i }).click();
  await page.getByLabel(/tree name/i).fill('Aam');
  await page.getByLabel(/^species/i).fill('mango');
  await page.getByRole('option').first().click();
  await page.getByLabel(/year planted/i).fill('2015');
  await checkScreen(page, '05-add-tree');
  await page.getByRole('button', { name: /add to sanctuary/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Aam' })).toBeVisible();

  // Log a moment with a photo; it shows on the timeline with its image.
  await page.getByRole('link', { name: /log a moment/i }).click();
  await page.getByRole('button', { name: /^flowering$/i }).click();
  await page.getByLabel(/add a photo/i).setInputFiles(LEAF);
  await page.getByLabel(/note/i).fill('Panicles opening');
  await checkScreen(page, '06-log-moment');
  await page.getByRole('button', { name: /save to biography/i }).click();
  await expect(page.getByText('Panicles opening')).toBeVisible();
  await expect(page.locator('ol img').first()).toBeVisible();
  await checkScreen(page, '07-tree-biography');

  // Scan → diagnose (fake AI) → saved to Aam with a follow-up task.
  // Detail and result screens have a back button, not the bottom bar; go via the tab.
  await page.goto('/scan');
  await page.getByRole('button', { name: /what's wrong/i }).click();
  await page.getByLabel(/which tree/i).selectOption({ label: 'Aam' });
  await page.getByLabel(/take or choose a photo/i).setInputFiles(LEAF);
  await checkScreen(page, '08-scan');
  await page.getByRole('button', { name: /^diagnose$/i }).click();
  await expect(page.getByRole('heading', { name: /pest/i })).toBeVisible();
  await expect(page.getByText(/saved to aam/i)).toBeVisible();
  await expect(page.getByRole('article', { name: /spray neem oil/i })).toBeVisible();
  await checkScreen(page, '09-diagnosis');

  // Dashboard: the follow-up is due this week; complete it.
  await page.goto('/');
  const task = page.getByRole('article', { name: /spray neem oil/i });
  await expect(task).toBeVisible();
  await checkScreen(page, '10-dashboard');
  await task.getByRole('button', { name: /mark done/i }).click();
  await expect(task).toBeHidden();

  // The Daily Path: the done task sits in Closed history.
  await page.getByRole('link', { name: /see all/i }).click();
  const closed = page.getByRole('region', { name: /closed history/i });
  await expect(closed.getByRole('article', { name: /spray neem oil/i })).toBeVisible();
  await checkScreen(page, '10b-daily-path');
  await page.goto('/');

  // Season review for Aam.
  await page.getByRole('link', { name: /plants/i }).click();
  await page.getByRole('link', { name: /aam/i }).click();
  await page.getByRole('link', { name: /season review/i }).click();
  await expect(page.getByRole('heading', { name: /season \d{4}/i })).toBeVisible();
  await checkScreen(page, '11-season-review');

  // A lost tree: mark Aam as died of disease, find it under Past trees, then restore it.
  await page.goBack();
  await page.getByRole('button', { name: /mark as ended/i }).click();
  const sheet = page.getByRole('dialog', { name: /mark as ended/i });
  await sheet.getByRole('button', { name: /disease or pest/i }).click();
  await sheet.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText(/died · .* · disease or pest/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /log a moment/i })).toBeHidden();
  await checkScreen(page, '11b-ended-tree');
  await page.goto('/plants');
  await page.getByRole('tab', { name: /past trees/i }).click();
  await page.getByRole('link', { name: /aam/i }).click();
  await page.getByRole('button', { name: /restore/i }).click();
  await expect(page.getByRole('link', { name: /log a moment/i })).toBeVisible();
  await page.goto('/plants');
  await expect(page.getByRole('link', { name: /aam/i })).toBeVisible();

  // Vegetables: want to grow palak, start with seeds in a new grow-bag, harvest, end the season.
  await page.goto('/crops');
  const palakCard = page.getByRole('article', { name: /spinach \(palak\)/i });
  await palakCard.getByRole('button', { name: /add to want to grow/i }).click();
  await expect(palakCard.getByText(/on your list/i)).toBeVisible();
  await page.goto('/plants');
  await page.getByRole('tab', { name: /want to grow/i }).click();
  await page.getByRole('link', { name: /spinach \(palak\)/i }).click();
  await page.getByRole('button', { name: /^start$/i }).click();
  const start = page.getByRole('dialog', { name: /start growing/i });
  await start.getByRole('button', { name: /i have seeds/i }).click();
  await start.getByRole('button', { name: /add a place/i }).click();
  await start.getByLabel(/place name/i).fill('Terrace bag');
  await start.getByRole('button', { name: /^add$/i }).click();
  await start.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('article', { name: /seedlings have come up/i })).toBeVisible();
  await checkScreen(page, '13-crop-journey');
  await page.getByRole('link', { name: /log a harvest/i }).click();
  await page.getByRole('button', { name: /^harvest$/i }).click();
  await page.getByRole('button', { name: /save to biography/i }).click();
  await page.getByRole('button', { name: /end season/i }).click();
  await expect(page.getByRole('button', { name: /^start$/i })).toBeVisible();
  await page.goto('/plants');
  await page.getByRole('tab', { name: /want to grow/i }).click();
  await expect(page.getByRole('link', { name: /spinach \(palak\)/i })).toBeVisible();

  await page.goto('/profile');
  await checkScreen(page, '12-profile');
});
