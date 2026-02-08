# Database Migration: Add Custom Kosher Amenities and Nearby Places

## Migration File
`migrations/add_custom_kosher_and_nearby_places.sql`

## What This Migration Does
Adds two new columns to the `rs_properties` table:
- `custom_kosher_amenities` - Stores a JSON array of custom kosher amenity names
- `custom_nearby_places` - Stores a JSON array of custom nearby places with type, name, and distance

## How to Run the Migration

### Option 1: Using psql (PostgreSQL command line)
```bash
psql $DATABASE_URL -f migrations/add_custom_kosher_and_nearby_places.sql
```

### Option 2: Using psql with connection string
```bash
psql "postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays" -f migrations/add_custom_kosher_and_nearby_places.sql
```

### Option 3: Using Render Dashboard
1. Go to your Render dashboard
2. Navigate to your PostgreSQL database
3. Click on "Shell" or "Console"
4. Copy and paste the SQL from the migration file
5. Execute the commands

### Option 4: Using DBeaver, pgAdmin, or other DB client
1. Connect to your database using the connection string
2. Open the migration file
3. Execute the SQL statements

## Verify Migration
After running the migration, verify the columns were added:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'rs_properties' 
AND column_name IN ('custom_kosher_amenities', 'custom_nearby_places');
```

## Data Format
- `custom_kosher_amenities`: `["Separate Dishes", "Kosher Certification"]`
- `custom_nearby_places`: `[{"type": "Park", "name": "Central Park", "distance": "5 min walk"}]`
