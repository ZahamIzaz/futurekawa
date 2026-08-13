import { test, expect } from '@playwright/test';

/**
 * G2 – Création d'un lot via le formulaire
 * Nécessite le stack Docker complet en cours d'exécution.
 */
test('G2 – création d\'un lot pour BRA', async ({ page }) => {
  await page.goto('/');

  // Attendre le sélecteur de pays
  const countrySelect = page.locator('#country-select');
  await expect(countrySelect).toBeVisible({ timeout: 10_000 });

  // Sélectionner BRA
  await countrySelect.selectOption('BRA');

  // Attendre que la zone lots soit chargée (tableau ou message vide)
  const lotsArea = page.locator('.lots-table, .empty-message');
  await expect(lotsArea).toBeVisible({ timeout: 10_000 });

  // Mémoriser le nombre de lignes initial (0 si le tableau est absent)
  const initialRowCount = await page.locator('.lots-table tbody tr').count();

  // Cliquer sur le bouton "Ajouter un lot"
  const addButton = page.getByRole('button', { name: /ajouter un lot/i });
  await expect(addButton).toBeVisible({ timeout: 5_000 });
  await addButton.click();

  // Le modal doit s'ouvrir
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Remplir l'entrepôt avec un ID unique pour éviter les conflits
  const uniqueId = `WH-E2E-${Date.now()}`;
  await page.locator('#warehouseId').fill(uniqueId);

  // Soumettre le formulaire
  await page.getByRole('button', { name: /créer le lot/i }).click();

  // Le modal doit se fermer
  await expect(modal).not.toBeVisible({ timeout: 5_000 });

  // Vérifier qu'exactement une ligne supplémentaire est apparue dans le tableau
  await expect(page.locator('.lots-table tbody tr')).toHaveCount(
    initialRowCount + 1,
    { timeout: 10_000 },
  );
});
