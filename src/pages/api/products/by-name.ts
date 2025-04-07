import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { name, userId } = req.body;

            if (!name || !userId) {
                return res.status(400).json({ error: 'Name and userId are required' });
            }

            await connectToDatabase();

            const product = await Product.findOne({ name, userId });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.status(200).json(product);
        } catch (error) {
            console.error('Error fetching product by name:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
