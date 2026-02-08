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
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM rs_users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role_id 5 (renter/customer)
    const userResult = await pool.query(
      'INSERT INTO rs_users (email, password, first_name, last_name, phone_number, role_id, active, activated) VALUES ($1, $2, $3, $4, $5, 5, true, true) RETURNING id, email, first_name, last_name, created_at',
      [email, hashedPassword, firstName, lastName, phone]
    );

    const user = userResult.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name }, token });
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
    const { type, minPrice, maxPrice, city, zipcode } = req.query;
    console.log('🔍 GET /api/properties - Query params:', { type, minPrice, maxPrice, city, zipcode });
    
    let query = 'SELECT * FROM rs_properties WHERE active = true';
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

    query += ' ORDER BY created_at DESC';
    console.log('  📝 Final query:', query);
    console.log('  📝 Query params:', params);

    const result = await pool.query(query, params);
    
    // Parse amenities from JSON string to array
    const properties = result.rows.map(property => ({
      ...property,
      amenities: typeof property.amenities === 'string' ? JSON.parse(property.amenities) : (property.amenities || [])
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
      amenities: typeof result.rows[0].amenities === 'string' ? JSON.parse(result.rows[0].amenities) : (result.rows[0].amenities || [])
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
      nearby_mikva, nearby_mikva_distance
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
        nearby_mikva, nearby_mikva_distance, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, true)
      RETURNING *
    `, [
      owner_id, title, property_type, bedroom_count, bathroom_count, guest_count,
      price, currency, street_name, house_number, address, city, state, country, zipcode,
      map_lat, map_lng, map_address, additional_luxury, additional_information,
      amenities ? JSON.stringify(amenities) : '[]', kosher_kitchen || false, shabbos_friendly || false,
      nearby_shul || null, nearby_shul_distance || null, nearby_kosher_shops || null, nearby_kosher_shops_distance || null,
      nearby_mikva || null, nearby_mikva_distance || null
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
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE rs_properties SET ${setClause}, updated_at = NOW() WHERE id = $1 AND owner_id = $2 RETURNING *`,
      [id, req.user.id, ...Object.values(updates)]
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
        guest_count, total_price, email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      property_id,
      customer_id,
      check_in_date,
      check_out_date,
      guest_count,
      total_price,
      email || null,
      phone || null
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
      SELECT r.*, p.title as property_title, p.city, p.state, p.country
      FROM rs_reservations r
      JOIN rs_properties p ON r.property_id = p.id
      WHERE r.customer_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
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
        guest_count, total_price, email, phone
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [1, '2026-03-01', '2026-03-05', 2, 500, 'test@example.com', '+1234567890']);
    
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
