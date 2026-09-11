import { type Page, expect } from '@playwright/test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/** Estado de sesión guardado por global-setup para cada rol. */
export const asRole = (role: 'admin' | 'reception' | 'accountant' | 'member') => join(here, '.auth', `${role}.json`);

export async function loginWithForm(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('tu@gimnasio.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
