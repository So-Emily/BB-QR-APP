import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    if (req.method === 'POST') {
        try {
            await connectToDatabase();

            const product = await Product.findByIdAndUpdate(
                productId,
                {
                    $inc: { scanCount: 1 },
                    $set: { lastScannedAt: new Date() },
                },
                { new: true }
            );

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.status(200).json({ success: true, product });
        } catch (error) {
            console.error('Error tracking scan:', error);
            res.status(500).json({ error: 'Failed to track scan' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
