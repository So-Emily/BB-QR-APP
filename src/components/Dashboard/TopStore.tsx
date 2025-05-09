import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchScans } from "@/lib/fetchScans";

const TopStore = () => {
  const { data: session, status } = useSession();

  const [topStore, setTopStore] = useState<{ storeId: string; totalScans: number; image:string } | null>(null);

  useEffect(() => {
    const getTopStore = async () => {
      if (status !== "authenticated") return;

      const userId = session?.user?.id;
      if (!userId) return console.warn("No userId found in session");

      try {
        const { topStore } = await fetchScans(userId);
        setTopStore(topStore);
      } catch (error) {
        console.error("Failed to fetch top store:", error);
      }
    };

    getTopStore();
  }, [session, status]);

  return (
    <div className="bg-customGray-300 shadow-lg rounded-xl p-4 flex flex-col items-center w-full sm:w-[45%] lg:w-[280px] max-w-full">
      <h2 className="text-md font-semibold flex items-center gap-2">
        🏆 Top Store
      </h2>
      {topStore ? (
        <>
          <p className="text-lg font-bold text-center mt-3">{topStore.storeId}</p>
          <p className="text-gray-600 text-sm">({topStore.totalScans} scans)</p>
        </>
      ) : (
        <p className="text-gray-500">No scan data available</p>
      )}
    </div>
  );
};

export default TopStore;
