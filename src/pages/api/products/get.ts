import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();
        
        const products = await Product.find({}).lean(); 

        console.log("🚀 Products from MongoDB:", products); 

        res.status(200).json(products);
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}