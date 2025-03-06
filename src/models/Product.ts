import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Supplier ID
    storeId: { type: String, default: null }, // Assigned Store (nullable)
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned'], default: 'pending' }, // Tracks assignment
    scanCount: { type: Number, default: 0 }, // Tracks number of scans
    lastScannedAt: { type: Date, default: null }, // Tracks last scan time
    createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;