/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

/** Crea y siembra la base de datos de pruebas antes de ejecutar la suite. */
module.exports = async () => {
  const root = path.resolve(__dirname, '..');
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  const env = { ...process.env, DATABASE_URL: 'file:./test.db' };
  // Base de pruebas desechable: se recrea desde cero en cada ejecución
  for (const f of ['test.db', 'test.db-journal']) fs.rmSync(path.join(root, 'prisma', f), { force: true });
  execSync('npx prisma db push --skip-generate --accept-data-loss', { cwd: root, env, stdio: 'pipe' });
  execSync('npx ts-node --transpile-only prisma/seed.ts', { cwd: root, env, stdio: 'pipe' });
};
