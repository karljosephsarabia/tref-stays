import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays',
  ssl: { rejectUnauthorized: false }
});

async function createTestProperty() {
  try {
    console.log('🧪 Creating permanent test property...\n');
    
    // Get a valid user
    const userResult = await pool.query('SELECT id, email FROM rs_users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('   ❌ No users found');
      return;
    }
    
    const testUser = userResult.rows[0];
    console.log(`✅ Using user: ${testUser.email} (ID: ${testUser.id})\n`);
    
    // Test data
    const customKosherAmenities = [
      { name: 'Separate Meat Dishes', checked: true },
      { name: 'Dairy Kitchen', checked: true },
      { name: 'Pesach Dishes', checked: false }
    ];
    
    const customNearbyPlaces = [
      { type: 'Restaurant', name: 'Kosher Deli', distance: '0.5 miles' },
      { type: 'Grocery', name: 'Kosher Market', distance: '1 mile' }
    ];
    
    console.log('📝 Test data:');
    console.log('Custom Kosher Amenities:', JSON.stringify(customKosherAmenities, null, 2));
    console.log('Custom Nearby Places:', JSON.stringify(customNearbyPlaces, null, 2));
    
    // Insert test property
    console.log('\n🔄 Inserting property...');
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
      '🧪 TEST - Property with Custom Kosher & Nearby Places',
      'apartment',
      2,
      1,
      4,
      150,
      'USD',
      'Test Street',
      '123',
      '123 Test Street',
      'Brooklyn',
      'NY',
      'USA',
      '11211',
      null,
      null,
      null,
      null,
      'This is a test property created to verify custom kosher amenities and custom nearby places functionality.',
      JSON.stringify(['WiFi', 'Kitchen', 'Air Conditioning']),
      true,
      true,
      'Young Israel of Brooklyn',
      '0.2 miles',
      'Kosher Corner Store',
      '0.3 miles',
      'Mikvah Brooklyn',
      '0.4 miles',
      JSON.stringify(customKosherAmenities),
      JSON.stringify(customNearbyPlaces)
    ]);
    
    const inserted = insertResult.rows[0];
    console.log('✅ Property created successfully!');
    console.log('   ID:', inserted.id);
    console.log('   Title:', inserted.title);
    console.log('   Custom Kosher Amenities:', inserted.custom_kosher_amenities);
    console.log('   Custom Nearby Places:', inserted.custom_nearby_places);
    
    console.log('\n✨ Test property created and will remain in database');
    console.log(`   View it at: http://localhost:8080/property/${inserted.id}`);
    console.log(`   Or query: SELECT * FROM rs_properties WHERE id = ${inserted.id};`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

createTestProperty();
