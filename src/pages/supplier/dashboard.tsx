import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import UserProfile from "@/components/Dashboard/UserProfile";
import TopItem from "@/components/Dashboard/TopItem";
import TopStore from "@/components/Dashboard/TopStore";
import Filters from "@/components/Dashboard/Filters";
import ChartComponent from "@/components/Dashboard/ChartComponent";

const Dashboard = () => {
  const { status, data: session } = useSession();
  const userId = session?.user?.id;
  const [selectedStore, setSelectedStore] = useState("all");

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-customGray-500 text-black">
      <Navbar />

      <div className="w-full max-w-[1200px] mx-auto px-4 flex-1 flex flex-col">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 flex-1 overflow-hidden">

          {/* Left Panel */}
          <section className="col-span-1 flex flex-col items-center bg-customGray-300 shadow-md rounded-2xl p-4">

            <UserProfile />

            {/* Grid for 2x2 stat cards */}
            <div className="bg-customGray-400 rounded-2xl p-4 grid grid-cols-2 gap-4 w-full h-full max-h-[320px]">

              <TopItem />
              <TopStore />

              {/* Placeholders */}
              <div className="bg-customGray-300 shadow-lg rounded-xl p-4 flex flex-col items-center w-full">
                <h2 className="text-md font-semibold flex items-center gap-2">📦 Placeholder 1</h2>
                <div className="w-20 h-24 bg-gray-200 mt-2 rounded-md" />
                <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
              </div>

              <div className="bg-customGray-300 shadow-lg rounded-xl p-4 flex flex-col items-center w-full">
                <h2 className="text-md font-semibold flex items-center gap-2">🔒 Placeholder 2</h2>
                <div className="w-20 h-24 bg-gray-200 mt-2 rounded-md" />
                <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE WRAPPER */}
          <section className="flex flex-col col-span-2 gap-4 overflow-auto">
            {/* Banner */}
            <div className="bg-customGray-300 h-[20vh] max-h-[150px] min-h-[100px] rounded-xl shadow-inner flex items-center justify-center text-black-400">
              Banner Placeholder
            </div>

            {/* Chart Section */}
            <div className="bg-customGray-300 shadow-md rounded-2xl p-4 flex flex-col justify-between flex-grow overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Filters selectedStore={selectedStore} setSelectedStore={setSelectedStore} />

                <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">Overview</button>
                <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">By Store</button>
                <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">Top 5</button>
                <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">Daily</button>
                <button className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">Monthly</button>
              </div>

              <ChartComponent userId={userId!} selectedStore={selectedStore} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
