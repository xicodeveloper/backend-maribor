import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Database connection function
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/storemari';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'StoreMari API is running',
    version: '1.0.0',
    database: 'MongoDB'
  });
});

// Test connection endpoint
app.get('/api/test-connection', async (_req: Request, res: Response) => {
  try {
    const collections = await require('mongoose').connection.db.listCollections().toArray();
    const collectionNames = collections.map((c: any) => c.name);
    
    res.json({
      success: true,
      collections: collectionNames,
      message: 'Connection successful!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log('\n🚀 Starting server...');
      console.log(`📍 Application is running at: http://localhost:${PORT}`);
      console.log('⏰ Server started at:', new Date().toLocaleString());
      console.log('\n✨ Press Ctrl+C to stop\n');
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Failed to start server');
    }
    process.exit(1);
  }
};

startServer();

export { connectDatabase };
