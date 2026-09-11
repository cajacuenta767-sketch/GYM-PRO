import { expect, test } from '@playwright/test';
import { asRole, loginWithForm } from './helpers';

test.describe('Inicio de sesión', () => {
  test('entra con el formulario y muestra el tablero', async ({ page }) => {
    await loginWithForm(page, 'admin@gympro.app', 'admin123');
    await expect(page.getByText('Miembros activos')).toBeVisible();
    await expect(page.getByText('Ingresos del mes')).toBeVisible();
  });

  test('rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tu@gimnasio.com').fill('admin@gympro.app');
    await page.getByPlaceholder('••••••••').fill('incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Credenciales incorrectas')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Administración', () => {
  test.use({ storageState: asRole('admin') });

  test('crea un miembro y abre su ficha', async ({ page }) => {
    await page.goto('/miembros');
    await page.getByRole('button', { name: 'Nuevo miembro' }).click();
    const name = `E2E${Date.now().toString().slice(-5)}`;
    await page.getByPlaceholder('Paola', { exact: true }).fill(name);
    await page.getByPlaceholder('Restrepo Vélez', { exact: true }).fill('Prueba');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await expect(page.getByText('Miembro creado')).toBeVisible();
    await page.getByPlaceholder(/Buscar por nombre/).fill(name);
    await page.getByRole('cell', { name: new RegExp(name) }).first().click();
    await expect(page.getByRole('heading', { name: `${name} Prueba` })).toBeVisible();
    await expect(page.getByText('Código de acceso')).toBeVisible();
  });

  test('la búsqueda global encuentra miembros', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Buscar páginas o miembros…').fill('Paola');
    await expect(page.getByText('Miembro · M30824')).toBeVisible();
  });

  test('el horario semanal muestra clases', async ({ page }) => {
    await page.goto('/clases/horario');
    await expect(page.getByRole('heading', { name: 'Horario de clases' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Spinning/ }).first()).toBeVisible();
  });
});

test.describe('Recepción', () => {
  test.use({ storageState: asRole('reception') });

  test('registra asistencia por código de miembro', async ({ page }) => {
    await page.goto('/asistencia');
    await page.getByPlaceholder('Token QR o código de miembro').fill('M30824');
    await page.getByRole('button', { name: 'Registrar' }).click();
    await expect(page.getByText(/registrada/)).toBeVisible();
    await expect(page.getByText('Paola Restrepo Vélez').first()).toBeVisible();
  });
});

test.describe('Contabilidad', () => {
  test.use({ storageState: asRole('accountant') });

  test('no ve la configuración en el menú', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Pagos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configuración general' })).toHaveCount(0);
  });
});
