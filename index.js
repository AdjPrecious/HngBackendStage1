require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/db');
const { runMigrations } = require('./src/db/migrate');

const PORT = process.env.PORT || 3000;

// async function start() {
//  await runMigrations();
//   app.listen(PORT, () => {
//     console.log(`Profile Intelligence Service running on port ${PORT}`);
//   });
// }

// start().catch((err) => {
//   console.error('Failed to start server:', err);
//   process.exit(1);
// });


if (process.env.NODE_ENV !== 'production') {
  async function start() {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
} else {
  // Vercel calls runMigrations on first request
  let migrated = false;
  app.use(async (req, res, next) => {
    if (!migrated) {
      await runMigrations();
      migrated = true;
    }
    next();
  });
}

module.exports = app;
