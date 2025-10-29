import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  category: 'men' | 'women' | 'kids';
  price: number;
  image: string;
  description?: string;
  stock?: number;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['men', 'women', 'kids'],
      message: 'Category must be men, women, or kids'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  description: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  }
}, {
  timestamps: true
});

// Create index for category filtering

export default mongoose.model<IProduct>('Product', ProductSchema);
