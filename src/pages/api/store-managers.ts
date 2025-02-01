import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { db } = await connectToDatabase();

            // Fetch store managers from the database
            const storeManagers = await db.collection('users').find({ role: 'store-manager' }).toArray();

            // Return the list of store managers
            res.status(200).json(storeManagers);
        } catch (error) {
            console.error('Error fetching store managers:', error);
            res.status(500).json({ error: 'Failed to fetch store managers' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}