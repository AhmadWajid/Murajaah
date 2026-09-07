const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS bookmarks (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      page INTEGER,
      surah INTEGER,
      ayah INTEGER,
      label TEXT,
      surah_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    console.log('bookmarks table created');

    await sql`CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_unique ON bookmarks(user_id, type, COALESCE(page, 0), COALESCE(surah, 0), COALESCE(ayah, 0))`;
    console.log('indexes created');

    console.log('Migration complete!');
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}
run();
