import { connectToDatabase } from '@/lib/mongodb';
import ProductModel from '@/models/Product'; // Renamed for clarity
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectToDatabase();

        const { name, description, pairing, taste, location, imageUrl, backgroundUrl, styles, userId } = req.body;

        if (!name || !userId) {
            return res.status(400).json({ error: 'Product name and userId are required' });
        }

        const newProduct = new ProductModel({
            name,
            description,
            pairing,
            taste,
            location,
            imageUrl,
            backgroundUrl,
            styles,
            userId, 
            status: 'pending', 
            stores: [], 
            createdAt: new Date(),
        });

        await newProduct.save();

        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ error: 'Failed to save product' });
    }
}
