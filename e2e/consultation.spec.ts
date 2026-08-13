import { test, expect } from '@playwright/test';

/**
 * G1 – Consultation des lots d'un pays
 * Nécessite le stack Docker complet en cours d'exécution :
 *   docker compose up -d
 * et le frontend Vite en mode dev ou preview sur http://localhost:5173
 */
test('G1 – consultation des lots BRA', async ({ page }) => {
  await page.goto('/');

  // L'application doit afficher le sélecteur de pays
  const countrySelect = page.locator('#country-select');
  await expect(countrySelect).toBeVisible({ timeout: 10_000 });

  // Sélectionner le Brésil
  await countrySelect.selectOption('BRA');

  // La table des lots doit apparaître (ou un message vide)
  const lotsArea = page.locator('.lots-table, .empty-message');
  await expect(lotsArea).toBeVisible({ timeout: 10_000 });
});
