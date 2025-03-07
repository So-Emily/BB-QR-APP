import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/models/Product';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { productId, storeId } = req.body;

    if (!productId || !storeId) {
        console.error("❌ Missing productId or storeId:", { productId, storeId });
        return res.status(400).json({ error: 'productId and storeId are required' });
    }

    try {
        await connectToDatabase();

        console.log("🚀 Assigning product:", productId, "to store:", storeId);

        // ✅ Fetch product and ensure `stores` array exists
        const existingProduct = await ProductModel.findById(productId);
        if (!existingProduct) {
            console.error("❌ Product not found:", productId);
            return res.status(400).json({ error: 'Product not found' });
        }

        if (!existingProduct.stores) {
            existingProduct.stores = []; // ✅ Ensure stores array exists
        }

        // ✅ Prevent duplicate store entries
        const storeExists = existingProduct.stores.some((store: { storeId: string; }) => store.storeId === storeId);
        if (storeExists) {
            console.warn(`⚠️ Store ${storeId} is already assigned to product ${productId}`);
            return res.status(400).json({ error: 'Store already assigned' });
        }

        // ✅ Push new store entry into the stores array
        existingProduct.stores.push({ 
            storeId, 
            scanCount: 0, 
            lastScannedAt: null 
        });
        existingProduct.status = "assigned";

        await existingProduct.save(); // ✅ Save changes to MongoDB

        console.log("✅ Product assigned to store successfully:", existingProduct);
        res.status(200).json({ message: 'Product assigned to store', product: existingProduct });

    } catch (error) {
        console.error('❌ Error assigning product:', error);
        res.status(500).json({ error: 'Failed to assign product' });
    }
}
