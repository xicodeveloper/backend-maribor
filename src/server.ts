import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/astraDb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test connection route
app.get('/api/test-connection', async (req, res) => {
  try {
    const collections = await db.listCollections();
    res.json({ 
      success: true, 
      collections,
      message: 'Connection successful!' 
    });
  } catch (error: any) {
    console.error('Connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// User routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const usersCollection = db.collection('users');
    
    // Check if user exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const result = await usersCollection.insertOne({
      name,
      email,
      password, // In production, hash this!
      createdAt: new Date()
    });

    res.json({ 
      success: true, 
      userId: result.insertedId,
      user: { name, email }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ 
      success: true, 
      user: { 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category as string;
    const productsCollection = db.collection('products');
    
    const filter = category && category !== 'all' ? { category } : {};
    const cursor = productsCollection.find(filter);
    const products = await cursor.toArray();
    
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});