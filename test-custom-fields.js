import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays',
  ssl: { rejectUnauthorized: false }
});

async function testCustomFields() {
  try {
    console.log('🧪 Testing custom fields in database...\n');
    
    // Check if columns exist
    console.log('1️⃣ Checking if columns exist:');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'rs_properties' 
      AND column_name IN ('custom_kosher_amenities', 'custom_nearby_places')
      ORDER BY column_name;
    `);
    
    if (columnsCheck.rows.length === 0) {
      console.log('   ❌ Columns do NOT exist! Migration not run.');
      return;
    }
    
    console.log('   ✅ Columns exist:');
    columnsCheck.rows.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });
    
    // Get a valid user ID
    console.log('\n2️⃣ Getting first user from database:');
    const userResult = await pool.query('SELECT id, email FROM rs_users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('   ❌ No users found in database');
      return;
    }
    
    const testUser = userResult.rows[0];
    console.log(`   ✅ Using user: ${testUser.email} (ID: ${testUser.id})`);
    
    // Test data
    const customKosherAmenities = [
      { name: 'Separate Meat Dishes', checked: true },
      { name: 'Dairy Kitchen', checked: true }
    ];
    
    const customNearbyPlaces = [
      { type: 'Restaurant', name: 'Kosher Deli', distance: '0.5 miles' },
      { type: 'Shul', name: 'Main Synagogue', distance: '0.3 miles' }
    ];
    
    console.log('\n3️⃣ Test data to insert:');
    console.log('   Custom Kosher Amenities:', JSON.stringify(customKosherAmenities));
    console.log('   Custom Nearby Places:', JSON.stringify(customNearbyPlaces));
    
    // Insert test property
    console.log('\n4️⃣ Inserting test property...');
    const insertResult = await pool.query(`
      INSERT INTO rs_properties (
        owner_id, title, property_type, bedroom_count, bathroom_count, guest_count,
        price, currency, street_name, house_number, address, city, state, country, zipcode_id,
        map_lat, map_lng, map_address, additional_luxury, additional_information,
        amenities, kosher_kitchen, shabbos_friendly,
        nearby_shul, nearby_shul_distance, nearby_kosher_shops, nearby_kosher_shops_distance,
        nearby_mikva, nearby_mikva_distance, custom_kosher_amenities, custom_nearby_places, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, true)
      RETURNING id, title, custom_kosher_amenities, custom_nearby_places
    `, [
      testUser.id,
      'TEST Property with Custom Fields',
      'apartment',
      2,
      1,
      4,
      150,
      'USD',
      'Test St',
      '123',
      '123 Test St',
      'Test City',
      'TS',
      'Test Country',
      '12345',
      null,
      null,
      null,
      null,
      'Test description',
      JSON.stringify(['WiFi', 'Kitchen']),
      true,
      false,
      null,
      null,
      null,
      null,
      null,
      null,
      JSON.stringify(customKosherAmenities),
      JSON.stringify(customNearbyPlaces)
    ]);
    
    const inserted = insertResult.rows[0];
    console.log('   ✅ Property created with ID:', inserted.id);
    console.log('   Title:', inserted.title);
    
    // Retrieve and verify
    console.log('\n5️⃣ Retrieving property to verify:');
    const retrieveResult = await pool.query(
      'SELECT id, title, custom_kosher_amenities, custom_nearby_places FROM rs_properties WHERE id = $1',
      [inserted.id]
    );
    
    const retrieved = retrieveResult.rows[0];
    console.log('   Custom Kosher Amenities (raw):', retrieved.custom_kosher_amenities);
    console.log('   Custom Nearby Places (raw):', retrieved.custom_nearby_places);
    
    // Parse if string
    const parsedKosher = typeof retrieved.custom_kosher_amenities === 'string' 
      ? JSON.parse(retrieved.custom_kosher_amenities)
      : retrieved.custom_kosher_amenities;
    
    const parsedNearby = typeof retrieved.custom_nearby_places === 'string'
      ? JSON.parse(retrieved.custom_nearby_places)
      : retrieved.custom_nearby_places;
    
    console.log('\n   Parsed Custom Kosher Amenities:', JSON.stringify(parsedKosher, null, 2));
    console.log('   Parsed Custom Nearby Places:', JSON.stringify(parsedNearby, null, 2));
    
    // Verify data matches
    const kosherMatch = JSON.stringify(parsedKosher) === JSON.stringify(customKosherAmenities);
    const nearbyMatch = JSON.stringify(parsedNearby) === JSON.stringify(customNearbyPlaces);
    
    console.log('\n6️⃣ Verification:');
    console.log('   Custom Kosher Amenities match:', kosherMatch ? '✅' : '❌');
    console.log('   Custom Nearby Places match:', nearbyMatch ? '✅' : '❌');
    
    if (kosherMatch && nearbyMatch) {
      console.log('\n✅ SUCCESS! Custom fields are working correctly in the database.');
    } else {
      console.log('\n❌ FAILURE! Data mismatch detected.');
    }
    
    // Clean up
    console.log('\n7️⃣ Cleaning up test data...');
    await pool.query('DELETE FROM rs_properties WHERE id = $1', [inserted.id]);
    console.log('   ✅ Test property deleted');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

testCustomFields();
