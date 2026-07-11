#!/usr/bin/env node
/**
 * scripts/setup-db.js
 * Ejecuta: db:create → migrate → seed en secuencia
 * Compatible con Windows (sin &&)
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const isReset = args.includes('--reset');

const run = (cmd) => {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: __dirname + '/..' });
};

try {
  if (isReset) {
    run('npx sequelize-cli db:drop');
  }

  run('npx sequelize-cli db:create');
  run('npx sequelize-cli db:migrate');
  run('npx sequelize-cli db:seed:all');

  console.log('\n✅ Base de datos lista.\n');
} catch (err) {
  console.error('\n❌ Error durante la configuración:', err.message);
  process.exit(1);
}
