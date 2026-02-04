import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays';

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to Render PostgreSQL database');

    // Check existing tables
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('\nExisting tables:', tablesResult.rows.map(r => r.tablename));

    // Apply standalone Render schema (no Supabase dependencies)
    console.log('\n→ Applying render-schema.sql...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'render-schema.sql'), 'utf8');
    
    try {
      await client.query(schemaSQL);
      console.log('  ✓ Schema applied successfully');
    } catch (err) {
      console.error('  ✗ Error applying schema:', err.message);
    }

    // Verify final schema
    const finalTables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('\n✓ Final tables:', finalTables.rows.map(r => r.tablename));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
