import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;
    console.log("📦 Session user ID:", userId);

    const { db } = await connectToDatabase();

    const products = await db.collection("products").find({
      userId: new ObjectId(userId)
    }).toArray();

    const storeMap: Record<string, boolean> = {};
    const uniqueStores: { storeId: string; storeName: string }[] = [];

    products.forEach((product) => {
      if (Array.isArray(product.stores)) {
        product.stores.forEach((store: { storeId: string; storeName?: string }) => {
          if (!storeMap[store.storeId]) {
            storeMap[store.storeId] = true;
            uniqueStores.push({
              storeId: store.storeId,
              storeName: store.storeName || store.storeId,
            });
          }
        });
      }
    });

    return res.status(200).json(uniqueStores);
  } catch (err) {
    console.error("Error fetching stores for supplier:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}