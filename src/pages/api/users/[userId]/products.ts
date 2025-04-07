// src/pages/api/users/[userId]/products.ts
import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method === 'GET') {
    try {
      await connectToDatabase();

      const products = await Product.find({ userId });
      if (!products.length) {
        return res.status(404).json({ error: 'No products found for this user' });
      }

      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
