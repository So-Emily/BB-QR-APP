import { ObjectId } from 'mongodb';
import Product from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { NextApiRequest, NextApiResponse } from 'next';

type TopItemType = {
  name: string;
  totalScans: number;
  imageUrl: string;
  perStoreScans?: { storeId: string; scanCount: number }[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, includeTop } = req.query;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (req.method === 'GET') {
    try {
      await connectToDatabase();

      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid User ID format' });
      }
      const userIdAsObjectId = new ObjectId(userId);

      // 👇 Now also fetch imageUrl
      const products = await Product.find({ userId: userIdAsObjectId }, 'name stores imageUrl').lean();

      const scanData: TopItemType[] = products.map(product => {
        const storesArray = product.stores || [];

        const totalScans = storesArray.reduce(
          (sum: number, store: { scanCount?: number }) => sum + (store.scanCount || 0),
          0
        );

        const perStoreScans = storesArray.map((store: { storeId: string; scanCount?: number }) => ({
          storeId: store.storeId,
          scanCount: store.scanCount || 0
        }));

        return {
          name: product.name,
          totalScans,
          imageUrl: product.imageUrl || '',
          perStoreScans
        };
      });

      // ✅ Use scanData + explicit type to calculate topItem
      const topItem = scanData.reduce<TopItemType>(
        (max, item) => (item.totalScans > max.totalScans ? item : max),
        { name: '', totalScans: 0, imageUrl: '' }
      );

      // ✅ Calculate top store
      const storeScanCounts: { [key: string]: number } = {};
      scanData.forEach(product => {
        product.perStoreScans?.forEach((store) => {
          storeScanCounts[store.storeId] = (storeScanCounts[store.storeId] || 0) + store.scanCount;
        });
      });

      const storeIds = Object.keys(storeScanCounts);
      const topStoreId = storeIds.length > 0
        ? storeIds.reduce((max, storeId) =>
            storeScanCounts[storeId] > storeScanCounts[max] ? storeId : max,
            storeIds[0]
          )
        : null;

      const topStoreScans = topStoreId ? storeScanCounts[topStoreId] : 0;

      if (includeTop === 'true') {
        return res.status(200).json({
          scanData,
          topItem: {
            name: topItem.name,
            totalScans: topItem.totalScans,
            image: topItem.imageUrl // 👈 Match your frontend
          },
          topStore: {
            storeId: topStoreId,
            totalScans: topStoreScans
          }
        });
      }

      return res.status(200).json(scanData);

    } catch (error) {
      console.error('Error fetching scan data:', error);
      return res.status(500).json({ error: 'Failed to fetch scan data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
