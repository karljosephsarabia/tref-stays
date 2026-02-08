import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Starting migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_custom_kosher_and_nearby_places.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🗄️  Connecting to database...');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Columns added:');
    console.log('  - custom_kosher_amenities (TEXT)');
    console.log('  - custom_nearby_places (TEXT)');
    
    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'rs_properties' 
      AND column_name IN ('custom_kosher_amenities', 'custom_nearby_places')
      ORDER BY column_name;
    `);
    
    console.log('');
    console.log('📋 Verification:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('');
    console.log('🔌 Database connection closed');
  }
}

runMigration();
