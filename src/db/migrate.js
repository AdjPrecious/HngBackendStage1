const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // 1. Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL      PRIMARY KEY,
        filename    TEXT        NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Get list of already-applied migrations
    const { rows: applied } = await client.query(
      'SELECT filename FROM _migrations ORDER BY id'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // 3. Read all .sql files sorted by name
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrations] No migration files found.');
      return;
    }

    // 4. Run pending migrations inside a transaction each
    let ranCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrations] Skipping (already applied): ${file}`);
        continue;
      }

      const filepath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filepath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[migrations] Applied: ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrations] FAILED on ${file}:`, err.message);
        throw err;
      }
    }

    if (ranCount === 0) {
      console.log('[migrations] All migrations already up to date.');
    } else {
      console.log(`[migrations] ${ranCount} migration(s) applied successfully.`);
    }
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };