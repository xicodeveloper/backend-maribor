import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    
    console.log(' MongoDB Connected Successfully!');
    console.log(`Database: ${mongoose.connection.name}`);
    
    // List collections
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (collectionNames.length > 0) {
        console.log(`Collections: ${collectionNames.join(', ')}`);
      } else {
        console.log('No collections yet (will be created when data is added)');
      }
    }
    
  } catch (error) {
    console.error('MongoDB Connection Error:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    console.error('   Check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('\nMongoDB connection closed');
  process.exit(0);
});
