import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import User, { IUser } from './models/User';
import Product, { IProduct } from './models/Product';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====

// Root
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'StoreMari API is running',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      test: '/api/test-connection',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      products: 'GET /api/products',
      productById: 'GET /api/products/:id',
      createProduct: 'POST /api/products'
    }
  });
});

// Test database connection
app.get('/api/test-connection', async (_req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected'
      });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Count documents
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    
    res.json({
      success: true,
      message: 'Database connection successful!',
      database: mongoose.connection.name,
      collections: collectionNames,
      stats: {
        users: userCount,
        products: productCount
      }
    });
  } catch (error) {
    console.error('❌ Connection test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== AUTH ROUTES =====

// Signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️  Signup failed: User exists - ${email}`);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user (WARNING: Hash password in production!)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    await user.save();
    console.log(`✅ User created: ${user.email} (ID: ${user._id})`);

    res.status(201).json({
      success: true,
      userId: user._id,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Signup failed'
    });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      password 
    });

    if (!user) {
      console.log(`⚠️  Login failed: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

// ===== PRODUCT ROUTES =====

// Get products (all or by category)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let products: IProduct[];
    
    if (category && category !== 'all') {
      products = await Product.find({ category: category as string });
      console.log(`📦 Retrieved ${products.length} products (${category})`);
    } else {
      products = await Product.find();
      console.log(`� Retrieved ${products.length} products (all)`);
    }

    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch products'
    });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch product'
    });
  }
});

// Create product
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();

    console.log(`✅ Product created: ${product.name} (ID: ${product._id})`);

    res.status(201).json({
      success: true,
      productId: product._id,
      product
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create product'
    });
  }
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log('\n🚀 SERVER STARTED');
      console.log('━'.repeat(50));
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌐 CORS: http://localhost:5173`);
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log('━'.repeat(50));
      console.log('\n✨ Press Ctrl+C to stop\n');
    });
  } catch (error) {
    console.error('\n❌ STARTUP FAILED');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

startServer();