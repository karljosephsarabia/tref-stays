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
import { put } from '@vercel/blob';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Configure multer for image uploads (memory storage for Vercel, disk storage locally)
const storage = process.env.VERCEL || process.env.VERCEL_ENV
  ? multer.memoryStorage() // Use memory storage on Vercel
  : multer.diskStorage({
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

// API Routes

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, encrypted_password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );

    const user = userResult.rows[0];

    // Create profile
    await pool.query(
      'INSERT INTO profiles (user_id, first_name, last_name, email, phone) VALUES ($1, $2, $3, $4, $5)',
      [user.id, firstName, lastName, email, phone]
    );

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, email: user.email }, token });
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
      'SELECT u.id, u.email, p.first_name, p.last_name, p.phone FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Property Routes

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, city, country, zipcode } = req.query;
    console.log('🔍 GET /api/properties - Query params:', { type, minPrice, maxPrice, city, country, zipcode });
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND property_type = $${paramCount}`;
      params.push(type);
      paramCount++;
      console.log('  ✓ Filtering by type:', type);
    }

    if (minPrice) {
      query += ` AND price_per_night >= $${paramCount}`;
      params.push(parseFloat(minPrice));
      paramCount++;
      console.log('  ✓ Filtering by minPrice:', minPrice);
    }

    if (maxPrice) {
      query += ` AND price_per_night <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
      console.log('  ✓ Filtering by maxPrice:', maxPrice);
    }

    if (city) {
      query += ` AND city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
      console.log('  ✓ Filtering by city:', city);
    }

    if (country) {
      query += ` AND country = $${paramCount}`;
      params.push(country);
      paramCount++;
      console.log('  ✓ Filtering by country:', country);
    }

    if (zipcode) {
      query += ` AND zipcode = $${paramCount}`;
      params.push(zipcode);
      paramCount++;
      console.log('  ✓ Filtering by zipcode:', zipcode);
    }

    query += ' ORDER BY created_at DESC';
    console.log('  📝 Final query:', query);
    console.log('  📝 Query params:', params);

    const result = await pool.query(query, params);
    console.log(`  ✅ Found ${result.rows.length} properties`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result.rows[0]);
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
      title, description, property_type, bedrooms, bathrooms, max_guests,
      price_per_night, square_feet, address, city, state, country, zipcode,
      latitude, longitude, amenities, nearby_shul, nearby_shul_distance,
      nearby_kosher_shops, nearby_kosher_shops_distance, nearby_mikva,
      nearby_mikva_distance, kosher_kitchen, shabbos_friendly
    } = req.body;

    // Use authenticated user's ID as owner_id
    const owner_id = req.user.id;

    const result = await pool.query(`
      INSERT INTO properties (
        title, description, property_type, bedrooms, bathrooms, max_guests,
        price_per_night, square_feet, address, city, state, country, zipcode,
        latitude, longitude, amenities, nearby_shul, nearby_shul_distance,
        nearby_kosher_shops, nearby_kosher_shops_distance, nearby_mikva,
        nearby_mikva_distance, kosher_kitchen, shabbos_friendly, owner_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, 'approved')
      RETURNING *
    `, [
      title, description, property_type, bedrooms, bathrooms, max_guests,
      price_per_night, square_feet, address, city, state, country, zipcode,
      latitude, longitude, amenities, nearby_shul, nearby_shul_distance,
      nearby_kosher_shops, nearby_kosher_shops_distance, nearby_mikva,
      nearby_mikva_distance, kosher_kitchen, shabbos_friendly, owner_id
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
app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE properties SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
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
    const checkResult = await pool.query('SELECT owner_id FROM properties WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (checkResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this property' });
    }
    
    // Delete property (images will be deleted automatically due to CASCADE)
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);

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

    // Check if running on Vercel with Blob storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('Uploading to Vercel Blob storage...');
      try {
        // Upload to Vercel Blob storage
        const uploadPromises = req.files.map(async (file) => {
          const filename = `tref-stays/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          console.log('Uploading file:', filename, 'Size:', file.buffer?.length || file.size);
          
          const blob = await put(filename, file.buffer, {
            access: 'public',
            contentType: file.mimetype
          });
          console.log('Blob uploaded successfully:', blob.url);
          return blob.url;
        });

        const imageUrls = await Promise.all(uploadPromises);
        console.log('All images uploaded successfully:', imageUrls.length);
        res.json({ imageUrls });
      } catch (blobError) {
        console.error('Vercel Blob upload error:', blobError);
        console.error('Error details:', JSON.stringify(blobError, null, 2));
        throw blobError;
      }
    } else {
      // Local development - use disk storage
      console.log('Using local disk storage...');
      const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      res.json({ imageUrls });
    }
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
      'SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_main DESC, display_order ASC',
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
    const { images } = req.body; // Array of { image_url, is_main, display_order }

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const insertPromises = images.map((img, index) =>
      pool.query(
        'INSERT INTO property_images (property_id, image_url, is_main, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, img.image_url, img.is_main || false, img.display_order !== undefined ? img.display_order : index]
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

// Export the app for Vercel serverless functions
export default app;

// Only start the server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
