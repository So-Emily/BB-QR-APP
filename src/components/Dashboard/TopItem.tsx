import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchScans } from "@/lib/fetchScans";

const TopItem = () => {
  const { data: session, status } = useSession();

  const [topItem, setTopItem] = useState<{ name: string; totalScans: number; image: string } | null>(null);

  useEffect(() => {
    const getTopItem = async () => {
      if (status !== "authenticated") return;
      
      const userId = session?.user?.id; 
      if (!userId) return console.warn("No userId found in session");

      try {
        const { topItem } = await fetchScans(userId);
        setTopItem(topItem);
      } catch (error) {
        console.error("Failed to fetch top item:", error);
      }
    };

    getTopItem();
  }, [session, status]);

  return (
    <div className="bg-customGray-300 shadow-lg rounded-xl p-1 flex flex-col items-center h-full w-full">
      <h2 className="text-md font-semibold truncate">
        🔥Top Product
      </h2>
      {topItem ? (
        <>
          <img src={topItem.image} alt={topItem.name} className="w-20 h-32 object-cover mt-2 rounded-md" />
          <p className="text-sm font-bold text-center mt-3">{topItem.name}</p>
          <p className="text-gray-600 text-sm">({topItem.totalScans} scans)</p>
        </>
      ) : (
        <p className="text-gray-500">No scan data available</p>
      )}
    </div>
  );
};

export default TopItem;
