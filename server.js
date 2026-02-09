import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure multer for image uploads using disk storage for Render
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://trefstays_user:GZDT34HeX7aHIcnYlDHPwr5mZJoXxDjQ@dpg-d61nnksoud1c73agi30g-a.oregon-postgres.render.com/trefstays',
  ssl: { rejectUnauthorized: false }
});

// Middleware - CORS must be first
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.VITE_API_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve Vite built frontend (dist/ folder)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✓ Connected to PostgreSQL at', res.rows[0].now);
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional auth middleware - allows guests
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// API Routes

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM rs_users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign role_id: 4 for property owners, 5 for renters/customers
    const roleId = role === 'owner' ? 4 : 5;

    // Create user with appropriate role
    const userResult = await pool.query(
      'INSERT INTO rs_users (email, password, first_name, last_name, phone_number, role_id, active, activated) VALUES ($1, $2, $3, $4, $5, $6, true, true) RETURNING id, email, first_name, last_name, role_id, created_at',
      [email, hashedPassword, firstName, lastName, phone, roleId]
    );

    const user = userResult.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, roleId: user.role_id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, roleId: user.role_id }, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM rs_users WHERE email = $1 AND activated = true', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, roleId: user.role_id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, roleId: user.role_id }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone_number, role_id, active, activated FROM rs_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ user: { 
      id: user.id, 
      email: user.email, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      phone: user.phone_number,
      roleId: user.role_id,
      active: user.active,
      activated: user.activated
    }});
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Property Routes

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, city, zipcode, includeInactive, start_date, end_date } = req.query;
    console.log('🔍 GET /api/properties - Query params:', { type, minPrice, maxPrice, city, zipcode, includeInactive, start_date, end_date });
    
    let query = 'SELECT * FROM rs_properties WHERE 1=1';
    
    // Only filter by active if includeInactive is not set
    if (!includeInactive) {
      query += ' AND active = true';
    }
    
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND property_type = $${paramCount}`;
      params.push(type);
      paramCount++;
      console.log('  ✓ Filtering by type:', type);
    }

    if (minPrice) {
      query += ` AND price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
      paramCount++;
      console.log('  ✓ Filtering by minPrice:', minPrice);
    }

    if (maxPrice) {
      query += ` AND price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
      console.log('  ✓ Filtering by maxPrice:', maxPrice);
    }

    if (zipcode) {
      query += ` AND zipcode_id = $${paramCount}`;
      params.push(zipcode);
      paramCount++;
      console.log('  ✓ Filtering by zipcode:', zipcode);
    }

    // Filter by availability dates
    if (start_date && end_date) {
      query += ` AND id NOT IN (
        SELECT property_id FROM property_availability
        WHERE status IN ('blocked', 'booked')
        AND (
          (start_date <= $${paramCount} AND end_date >= $${paramCount})
          OR (start_date <= $${paramCount + 1} AND end_date >= $${paramCount + 1})
          OR (start_date >= $${paramCount} AND end_date <= $${paramCount + 1})
        )
      )`;
      params.push(start_date, end_date);
      paramCount += 2;
      console.log('  ✓ Filtering by date range:', start_date, 'to', end_date);
    }

    query += ' ORDER BY created_at DESC';
    console.log('  📝 Final query:', query);
    console.log('  📝 Query params:', params);

    const result = await pool.query(query, params);
    
    // Parse amenities from JSON string to array
    const properties = result.rows.map(property => ({
      ...property,
      amenities: typeof property.amenities === 'string' ? JSON.parse(property.amenities) : (property.amenities || []),
      custom_kosher_amenities: typeof property.custom_kosher_amenities === 'string' ? JSON.parse(property.custom_kosher_amenities) : (property.custom_kosher_amenities || []),
      custom_nearby_places: typeof property.custom_nearby_places === 'string' ? JSON.parse(property.custom_nearby_places) : (property.custom_nearby_places || [])
    }));
    
    console.log(`  ✅ Found ${properties.length} properties`);
    res.json(properties);
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rs_properties WHERE id = $1 AND active = true', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Parse amenities from JSON string to array
    const property = {
      ...result.rows[0],
      amenities: typeof result.rows[0].amenities === 'string' ? JSON.parse(result.rows[0].amenities) : (result.rows[0].amenities || []),
      custom_kosher_amenities: typeof result.rows[0].custom_kosher_amenities === 'string' ? JSON.parse(result.rows[0].custom_kosher_amenities) : (result.rows[0].custom_kosher_amenities || []),
      custom_nearby_places: typeof result.rows[0].custom_nearby_places === 'string' ? JSON.parse(result.rows[0].custom_nearby_places) : (result.rows[0].custom_nearby_places || [])
    };

    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create property
app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    console.log('Creating property for user:', req.user.id);
    console.log('Property data:', req.body);
    
    const {
      title, property_type, bedroom_count, bathroom_count, guest_count,
      price, currency, street_name, house_number, address, city, state, country, zipcode,
      map_lat, map_lng, map_address, additional_luxury, additional_information,
      amenities, kosher_kitchen, shabbos_friendly,
      nearby_shul, nearby_shul_distance, nearby_kosher_shops, nearby_kosher_shops_distance,
      nearby_mikva, nearby_mikva_distance,
      custom_kosher_amenities, custom_nearby_places
    } = req.body;

    // Use authenticated user's ID as owner_id
    const owner_id = req.user.id;

    const result = await pool.query(`
      INSERT INTO rs_properties (
        owner_id, title, property_type, bedroom_count, bathroom_count, guest_count,
        price, currency, street_name, house_number, address, city, state, country, zipcode_id,
        map_lat, map_lng, map_address, additional_luxury, additional_information,
        amenities, kosher_kitchen, shabbos_friendly,
        nearby_shul, nearby_shul_distance, nearby_kosher_shops, nearby_kosher_shops_distance,
        nearby_mikva, nearby_mikva_distance, custom_kosher_amenities, custom_nearby_places, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, true)
      RETURNING *
    `, [
      owner_id, title, property_type, bedroom_count, bathroom_count, guest_count,
      price, currency, street_name, house_number, address, city, state, country, zipcode,
      map_lat, map_lng, map_address, additional_luxury, additional_information,
      amenities ? JSON.stringify(amenities) : '[]', kosher_kitchen || false, shabbos_friendly || false,
      nearby_shul || null, nearby_shul_distance || null, nearby_kosher_shops || null, nearby_kosher_shops_distance || null,
      nearby_mikva || null, nearby_mikva_distance || null,
      custom_kosher_amenities ? JSON.stringify(custom_kosher_amenities) : '[]', custom_nearby_places ? JSON.stringify(custom_nearby_places) : '[]'
    ]);

    console.log('Property created successfully:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create property', details: error.message });
  }
});

// Update property
app.put('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    // Ensure JSON fields are stringified if they were sent as arrays/objects
    ['amenities', 'custom_kosher_amenities', 'custom_nearby_places'].forEach((field) => {
      if (updates[field] && typeof updates[field] !== 'string') {
        updates[field] = JSON.stringify(updates[field]);
      }
    });
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    
    const values = [id, req.user.id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE rs_properties SET ${setClause}, updated_at = NOW() WHERE id = $1 AND owner_id = $2 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // First check if property exists and belongs to user
    const checkResult = await pool.query('SELECT owner_id FROM rs_properties WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (checkResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this property' });
    }
    
    // Soft delete by setting active to false
    await pool.query('UPDATE rs_properties SET active = false WHERE id = $1', [id]);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Image upload endpoint
app.post('/api/upload/images', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files count:', req.files?.length);
    console.log('Has BLOB_READ_WRITE_TOKEN:', !!process.env.BLOB_READ_WRITE_TOKEN);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Use disk storage for Render deployment
    console.log('Using disk storage...');
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ imageUrls });
  } catch (error) {
    console.error('Error uploading images:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Failed to upload images',
      details: error.message,
      name: error.name
    });
  }
});

// Get property images
app.get('/api/properties/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM rs_property_images WHERE property_id = $1 AND active = true ORDER BY id ASC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching property images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Add property images
app.post('/api/properties/:id/images', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body; // Array of { image_url }

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const insertPromises = images.map((img) =>
      pool.query(
        'INSERT INTO rs_property_images (property_id, image_url, active) VALUES ($1, $2, true) RETURNING *',
        [id, img.image_url]
      )
    );

    const results = await Promise.all(insertPromises);
    const insertedImages = results.map(r => r.rows[0]);

    res.status(201).json(insertedImages);
  } catch (error) {
    console.error('Error adding property images:', error);
    res.status(500).json({ error: 'Failed to add images' });
  }
});

// Property Availability Routes

// Check if property is available for a date range
app.get('/api/properties/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    // Check for any conflicting bookings or blocks
    const result = await pool.query(`
      SELECT * FROM property_availability
      WHERE property_id = $1
      AND status IN ('blocked', 'booked')
      AND (
        (start_date <= $2 AND end_date >= $2)
        OR (start_date <= $3 AND end_date >= $3)
        OR (start_date >= $2 AND end_date <= $3)
      )
    `, [id, start_date, end_date]);

    const isAvailable = result.rows.length === 0;
    res.json({ 
      available: isAvailable, 
      conflicts: result.rows 
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get all unavailable dates for a property (for calendar display)
app.get('/api/properties/:id/unavailable-dates', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT start_date, end_date, status, notes
      FROM property_availability
      WHERE property_id = $1
      AND status IN ('blocked', 'booked')
      ORDER BY start_date
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    res.status(500).json({ error: 'Failed to fetch unavailable dates' });
  }
});

// Block or unblock dates (owner only)
app.post('/api/properties/:id/block-dates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, notes, unblock } = req.body;

    // Verify property ownership
    const propertyCheck = await pool.query(
      'SELECT owner_id FROM rs_properties WHERE id = $1',
      [id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (propertyCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to manage this property' });
    }

    if (unblock) {
      // Remove blocked dates
      await pool.query(`
        DELETE FROM property_availability
        WHERE property_id = $1
        AND status = 'blocked'
        AND start_date = $2
        AND end_date = $3
      `, [id, start_date, end_date]);

      res.json({ success: true, message: 'Dates unblocked successfully' });
    } else {
      // Validate dates
      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'start_date and end_date are required' });
      }

      // Check for conflicts
      const conflicts = await pool.query(`
        SELECT * FROM property_availability
        WHERE property_id = $1
        AND (
          (start_date <= $2 AND end_date >= $2)
          OR (start_date <= $3 AND end_date >= $3)
          OR (start_date >= $2 AND end_date <= $3)
        )
      `, [id, start_date, end_date]);

      if (conflicts.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Date range conflicts with existing bookings or blocks',
          conflicts: conflicts.rows 
        });
      }

      // Block dates
      const result = await pool.query(`
        INSERT INTO property_availability (property_id, start_date, end_date, status, notes)
        VALUES ($1, $2, $3, 'blocked', $4)
        RETURNING *
      `, [id, start_date, end_date, notes || null]);

      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error managing blocked dates:', error);
    res.status(500).json({ error: 'Failed to manage blocked dates' });
  }
});

// Get blocked date ranges (owner only)
app.get('/api/properties/:id/blocked-dates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify property ownership
    const propertyCheck = await pool.query(
      'SELECT owner_id FROM rs_properties WHERE id = $1',
      [id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (propertyCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this property' });
    }

    const result = await pool.query(`
      SELECT id, start_date, end_date, notes, created_at
      FROM property_availability
      WHERE property_id = $1
      AND status = 'blocked'
      ORDER BY start_date
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// Reservation Routes

// Create reservation (guests allowed)
app.post('/api/reservations', optionalAuth, async (req, res) => {
  try {
    console.log('Creating reservation for user:', req.user?.id || 'guest');
    console.log('Reservation data:', req.body);
    
    const {
      property_id,
      check_in_date,
      check_out_date,
      guest_count,
      total_price,
      email,
      phone
    } = req.body;

    // Validate required fields
    if (!property_id || !check_in_date || !check_out_date || !guest_count || !total_price || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use authenticated user's ID as customer_id, or NULL for guests
    const customer_id = req.user?.id || null;

    // Use actual column names: date_start and date_end
    const result = await pool.query(`
      INSERT INTO rs_reservations (
        property_id, customer_id, date_start, date_end, 
        guest_count, total_price, email, phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      property_id,
      customer_id,
      check_in_date,
      check_out_date,
      guest_count,
      total_price,
      email || null,
      phone || null,
      'pending'
    ]);

    console.log('Reservation created successfully:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reservation:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
});

// Get user's reservations
app.get('/api/reservations/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
             p.title as property_title, 
             p.address as property_address,
             p.city, 
             p.state, 
             p.country,
             p.currency,
             p.id as property_id
      FROM rs_reservations r
      JOIN rs_properties p ON r.property_id = p.id
      WHERE r.customer_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    
    // Fetch main image for each property
    const reservationsWithImages = await Promise.all(
      result.rows.map(async (reservation) => {
        try {
          const imageResult = await pool.query(
            'SELECT image_url FROM rs_property_images WHERE property_id = $1 ORDER BY id ASC LIMIT 1',
            [reservation.property_id]
          );
          return {
            ...reservation,
            main_image: imageResult.rows[0]?.image_url || null
          };
        } catch (err) {
          console.error(`Error fetching image for property ${reservation.property_id}:`, err);
          return reservation;
        }
      })
    );
    
    res.json(reservationsWithImages);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Test reservations endpoint
app.get('/api/reservations/test', async (req, res) => {
  try {
    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'rs_reservations'
      ORDER BY ordinal_position
    `);
    
    // Try a simple insert with NULL customer_id (guest booking)
    const testInsert = await pool.query(`
      INSERT INTO rs_reservations (
        property_id, customer_id, date_start, date_end, 
        guest_count, total_price, email, phone, status
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [1, '2026-03-01', '2026-03-05', 2, 500, 'test@example.com', '+1234567890', 'pending']);
    
    res.json({ 
      tableStructure: tableInfo.rows,
      testInsert: testInsert.rows[0],
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      tableStructure: 'Check failed',
      success: false 
    });
  }
});

// Update reservation status
app.patch('/api/reservations/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'approved', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Check if reservation exists and user is authorized
    const checkResult = await pool.query(`
      SELECT r.*, p.owner_id 
      FROM rs_reservations r
      JOIN rs_properties p ON r.property_id = p.id
      WHERE r.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = checkResult.rows[0];
    
    // Only property owner or the customer can update status
    const isOwner = reservation.owner_id === req.user.id;
    const isCustomer = reservation.customer_id === req.user.id;
    
    if (!isOwner && !isCustomer) {
      return res.status(403).json({ error: 'Not authorized to update this reservation' });
    }

    // Update status
    const result = await pool.query(`
      UPDATE rs_reservations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    console.log(`Reservation ${id} status updated to ${status} by user ${req.user.id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// Get user's saved properties
app.get('/api/saved-properties', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        sp.id as saved_id,
        sp.created_at as saved_at,
        p.id,
        p.title,
        p.address,
        p.city,
        p.state,
        p.country,
        p.price,
        p.currency,
        p.property_type,
        p.bedroom_count,
        p.bathroom_count,
        p.guest_count,
        (SELECT image_url FROM rs_property_images WHERE property_id = p.id ORDER BY id ASC LIMIT 1) as main_image
      FROM rs_saved_properties sp
      JOIN rs_properties p ON sp.property_id = p.id
      WHERE sp.user_id = $1
      ORDER BY sp.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching saved properties:', error);
    res.status(500).json({ error: 'Failed to fetch saved properties' });
  }
});

// Save a property (add to favorites)
app.post('/api/saved-properties/:propertyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    // Check if property exists
    const propertyCheck = await pool.query('SELECT id FROM rs_properties WHERE id = $1', [propertyId]);
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Insert or ignore if already saved
    const result = await pool.query(`
      INSERT INTO rs_saved_properties (user_id, property_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, property_id) DO NOTHING
      RETURNING *
    `, [userId, propertyId]);

    if (result.rows.length === 0) {
      // Already saved
      return res.status(200).json({ message: 'Property already saved', alreadySaved: true });
    }

    console.log(`User ${userId} saved property ${propertyId}`);
    res.status(201).json({ message: 'Property saved successfully', saved: result.rows[0] });
  } catch (error) {
    console.error('Error saving property:', error);
    res.status(500).json({ error: 'Failed to save property' });
  }
});

// Remove a saved property (unlike/unfavorite)
app.delete('/api/saved-properties/:propertyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const result = await pool.query(`
      DELETE FROM rs_saved_properties
      WHERE user_id = $1 AND property_id = $2
      RETURNING *
    `, [userId, propertyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved property not found' });
    }

    console.log(`User ${userId} removed property ${propertyId} from saved`);
    res.json({ message: 'Property removed from saved' });
  } catch (error) {
    console.error('Error removing saved property:', error);
    res.status(500).json({ error: 'Failed to remove saved property' });
  }
});

// Check if property is saved by user
app.get('/api/saved-properties/check/:propertyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const result = await pool.query(`
      SELECT id FROM rs_saved_properties
      WHERE user_id = $1 AND property_id = $2
    `, [userId, propertyId]);

    res.json({ isSaved: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking saved property:', error);
    res.status(500).json({ error: 'Failed to check saved property' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Environment check endpoint
app.get('/api/env-check', (req, res) => {
  res.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasJwtSecret: !!process.env.JWT_SECRET,
    isVercel: process.env.VERCEL === '1',
    nodeEnv: process.env.NODE_ENV
  });
});

// Catch-all: serve index.html for client-side routing (must be after all API routes)
const distPath2 = path.join(__dirname, 'dist');
if (fs.existsSync(distPath2)) {
  app.use((req, res, next) => {
    // Only handle GET requests for non-API routes
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(distPath2, 'index.html'));
    } else {
      next();
    }
  });
}

// Export the app for Vercel serverless functions
export default app;

// Only start the server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
