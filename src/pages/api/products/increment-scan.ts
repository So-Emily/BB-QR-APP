import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/models/Product';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { supplierName, productName, storeId } = req.body;

    if (!supplierName || !productName || !storeId) {
        console.error("❌ Missing fields:", { supplierName, productName, storeId });
        return res.status(400).json({ error: 'supplierName, productName, and storeId are required' });
    }

    try {
        await connectToDatabase();
        const matchingProducts = await ProductModel.find({ 
          name: { $regex: new RegExp(`^${productName}$`, "i") } // ✅ Case-insensitive search
      });
        console.log("🔍 Products found in DB for name:", productName, matchingProducts);
        // 🔹 FIXED: Query now updates the `stores` array
        const updatedProduct = await ProductModel.findOneAndUpdate(
          { 
              name: { $regex: new RegExp(`^${productName}$`, "i") }, // ✅ Case-insensitive match
              storeId: storeId 
          },
          { 
              $inc: { scanCount: 1 },
              $set: { lastScannedAt: new Date() }
          },
          { new: true }
      );

        if (!updatedProduct) {
            console.error(`❌ Product '${productName}' not found for store '${storeId}'`);
            return res.status(404).json({ error: 'Product not found in this store' });
        }

        console.log(`✅ Scan count updated for '${productName}' in store '${storeId}'`);
        return res.status(200).json({ message: 'Scan count updated', product: updatedProduct });

    } catch (error) {
        console.error('🔥 Error updating scan count:', error);
        return res.status(500).json({ error: 'Failed to update scan count' });
    }
};
