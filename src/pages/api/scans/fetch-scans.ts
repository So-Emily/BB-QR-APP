import { ObjectId } from 'mongodb';
import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;
  
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    if (req.method === 'GET') {
      try {
        await connectToDatabase();
  
        if (!ObjectId.isValid(userId)) {
          return res.status(400).json({ error: 'Invalid User ID format' });
        }
        const userIdAsObjectId = new ObjectId(userId);
  
        const products = await Product.find({ userId: userIdAsObjectId }, 'name scanCount').lean();
  
        // Disable caching
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching scan data:', error);
        res.status(500).json({ error: 'Failed to fetch scan data' });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  
