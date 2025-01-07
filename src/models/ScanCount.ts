import mongoose from 'mongoose';

const scanCountSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scans: { type: Number, default: 0 },
  lastScannedAt: { type: Date, default: Date.now },
});

const ScanCount = mongoose.models.ScanCount || mongoose.model('ScanCount', scanCountSchema);
export default ScanCount;
