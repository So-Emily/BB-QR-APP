import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

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

        console.log("🚀 Attempting to assign product:", productId, "to store:", storeId);

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: new ObjectId(productId), status: 'pending' }, // Ensure it's pending
            { $set: { storeId: storeId, status: 'assigned' } }, 
            { new: true }
        );

        if (!updatedProduct) {
            console.error("❌ Product not found or already assigned:", productId);
            return res.status(400).json({ error: 'Product not found or already assigned' });
        }

        console.log("✅ Product assigned successfully:", updatedProduct);
        res.status(200).json({ message: 'Product assigned to store', product: updatedProduct });

    } catch (error) {
        console.error('❌ Error assigning product:', error);
        res.status(500).json({ error: 'Failed to assign product' });
    }
}
