import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * Inicia sesión una sola vez por rol a través de la API y guarda el estado de
 * almacenamiento (localStorage) que la web usa para la sesión, evitando repetir
 * logins en cada prueba y el límite de intentos.
 */
const ROLES = {
  admin: ['admin@gympro.app', 'admin123'],
  reception: ['recepcion@gympro.app', 'recepcion123'],
  accountant: ['contador@gympro.app', 'contador123'],
  member: ['paola@gympro.app', 'miembro123'],
} as const;

export default async function globalSetup() {
  const api = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';
  const origin = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
  const dir = join(here, '.auth');
  mkdirSync(dir, { recursive: true });
  for (const [role, [email, password]] of Object.entries(ROLES)) {
    const res = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error(`No se pudo iniciar sesión como ${role}: ${res.status}`);
    const { data } = await res.json();
    const state = { cookies: [], origins: [{ origin, localStorage: [{ name: 'gympro.auth', value: JSON.stringify({ state: { token: data.accessToken, refreshToken: data.refreshToken, user: data.user }, version: 0 }) }] }] };
    writeFileSync(join(dir, `${role}.json`), JSON.stringify(state));
  }
}
