import { expect, test } from '@playwright/test';
import { asRole } from './helpers';

test.describe('Portal del miembro', () => {
  test.use({ storageState: asRole('member') });

  test('muestra el carnet con QR', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText('Miembro M30824')).toBeVisible();
    await expect(page.getByText('Muestra este código en la entrada')).toBeVisible();
  });

  test('no puede abrir el panel de administración', async ({ page }) => {
    await page.goto('/miembros');
    await expect(page).toHaveURL(/\/portal/);
  });

  test('reserva una clase desde el horario', async ({ page }) => {
    await page.goto('/portal/clases');
    const slot = page.locator('li button').first();
    await expect(slot).toBeVisible();
    await slot.click();
    await page.getByRole('button', { name: 'Reservar cupo' }).click();
    await expect(page.getByText(/Reserva confirmada|lista de espera|ya tiene una reserva/)).toBeVisible();
  });
});

test.describe('Página pública', () => {
  test('muestra planes y horario sin iniciar sesión', async ({ page }) => {
    await page.goto('/publico');
    await expect(page.getByRole('heading', { name: 'Planes de membresía' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Horario de clases' })).toBeVisible();
  });
});
