import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    scanCount: { type: Number, default: 0 }, // Initialize with 0
    lastScannedAt: { type: Date, default: null }, // Optional field for the last scan timestamp
    createdAt: { type: Date, default: Date.now }, // Automatically track creation time
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
