import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    stores: [{
        storeId: { type: String, required: true },
        scanCount: { type: Number, default: 0 },
        lastScannedAt: { type: Date, default: null }
    }]
});


const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;