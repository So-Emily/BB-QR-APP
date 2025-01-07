import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        try {
            await connectToDatabase();

            const scanData = await Product.find({ userId }).select('name scanCount');
            res.status(200).json(scanData);
        } catch (error) {
            console.error('Error fetching scan data:', error);
            res.status(500).json({ error: 'Failed to fetch scan data' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
