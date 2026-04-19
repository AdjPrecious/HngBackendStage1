require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/db');
const { runMigrations } = require('./src/db/migrate');

const PORT = process.env.PORT || 3000;

async function start() {
 await runMigrations();
  app.listen(PORT, () => {
    console.log(`Profile Intelligence Service running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
