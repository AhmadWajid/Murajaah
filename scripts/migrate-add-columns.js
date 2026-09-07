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
    // Add new columns to user_settings
    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS favorite_reciters JSONB`;
    console.log('Added favorite_reciters column');

    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS review_settings JSONB`;
    console.log('Added review_settings column');

    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS reading_layout TEXT DEFAULT 'verse'`;
    console.log('Added reading_layout column');

    await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hide_words_delay INTEGER DEFAULT 500`;
    console.log('Added hide_words_delay column');

    console.log('Migration complete!');
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}
run();
