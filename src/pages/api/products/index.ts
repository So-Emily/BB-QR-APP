import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            console.log('Incoming Request Body:', req.body);

            const { userId, name } = req.body;

            if (!userId || !name) {
                console.error('Validation Error: Missing userId or name');
                return res.status(400).json({ error: 'userId and name are required' });
            }

            console.log('Connecting to MongoDB...');
            await connectToDatabase(); // No need to destructure `db`
            console.log('MongoDB Connected.');

            console.log('Inserting product...');
            const newProduct = await Product.create({ userId, name, scanCount: 0 });
            console.log('Product Inserted:', newProduct);

            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Error during product creation:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
