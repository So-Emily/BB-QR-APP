import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import StoreProfile from "@/components/Dashboard/StoreProfile";
import TopItem from "@/components/Dashboard/TopItem";
import TopStore from "@/components/Dashboard/TopStore";
import Filters from "@/components/Dashboard/Filters";
import ChartComponent from "@/components/Dashboard/ChartComponent";

const StoreDashboard = () => {
  const { status, data: session } = useSession();
  const storeId = session?.user?.id || "64c2f1e91ab0f1a1b8c7b6c2"; // Example storeId
  const [selectedStore, setSelectedStore] = useState("all");

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-customGray-500 text-black">
      <Navbar />

      <div className="flex flex-1 justify-center items-center">
        <div className="w-full max-w-[1300px] h-auto px-4 flex flex-col">
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Left Panel */}
            <section className="col-span-1 flex flex-col items-center bg-customGray-300 shadow-md rounded-2xl p-4">
              <StoreProfile />

              {/* Grid for 2x2 stat cards */}
              <div className="bg-customGray-400 rounded-2xl p-4 grid grid-cols-2 gap-4 w-full">
                <TopItem />
                <TopStore />

                {/* Placeholders */}
                <div className="bg-customGray-300 shadow-lg rounded-xl p-1 flex flex-col items-center w-full">
                  <h2 className="text-md font-semibold flex items-center gap-2">💀Unpopular</h2>
                  <img
                    src="/images/wholefoods.png"
                    alt="Whole Foods logo"
                    className="w-20 h-20 rounded-full object-cover shadow-md mt-2"
                  />
                  <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
                  <p className="text-gray-600 text-sm">(scans)</p>
                </div>

                <div className="bg-customGray-300 shadow-lg rounded-xl p-1 flex flex-col items-center w-full">
                  <h2 className="text-md font-semibold flex items-center gap-2">👻Ghost Town</h2>
                  <img
                    src="/images/wholefoods.png"
                    alt="Whole Foods logo"
                    className="w-20 h-20 rounded-full object-cover shadow-md mt-2"
                  />
                  <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
                  <p className="text-gray-600 text-sm">(scans)</p>
                </div>
              </div>
            </section>

            {/* Right Panel */}
            <section className="flex flex-col col-span-2 gap-4 overflow-auto">
              {/* Banner */}
              <div className="bg-customGray-300 h-[20vh] max-h-[150px] min-h-[100px] rounded-xl shadow-inner flex items-center justify-center text-black-400">
                Banner Placeholder
              </div>

              {/* Chart Section */}
              <div className="bg-customGray-300 shadow-md rounded-2xl p-4 flex flex-col justify-between flex-grow overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Filters selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
                  <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Overview
                  </button>
                  <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    By Store
                  </button>
                  <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Top 5
                  </button>
                  <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Daily
                  </button>
                  <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
                    Monthly
                  </button>
                </div>

                <ChartComponent userId={storeId} selectedStore={selectedStore} />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;