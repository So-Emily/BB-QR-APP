import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { supplierName, productName } = req.body;

        if (!supplierName || !productName) {
            return res.status(400).json({ error: 'supplierName and productName are required' });
        }

        try {
            // Connect to MongoDB
            await connectToDatabase();

            // Find the user by supplierName
            const user = await User.findOne({ name: supplierName });
            if (!user) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            // Find and update the product
            const updatedProduct = await Product.findOneAndUpdate(
                { name: productName, userId: user._id },
                { $inc: { scanCount: 1 }, $set: { lastScannedAt: new Date() } },
                { new: true }
            );

            if (!updatedProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.status(200).json({ message: 'Scan count updated', product: updatedProduct });
        } catch (error) {
            console.error('Error updating scan count:', error);
            res.status(500).json({ error: 'Failed to update scan count' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
