import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import UserProfile from "@/components/UserProfile";
import TopItem from "@/components/TopItem";
import TopStore from "@/components/TopStore";
import Filters from "@/components/Filters";
import ChartComponent from "@/components/ChartComponent";

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
    <div className="min-h-screen bg-customGray-500 text-black">
      <Navbar />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-[calc(100vh-80px)]">

        {/* Left Panel */}
        <section className="bg-customGray-300 shadow-md rounded-2xl p-6 flex flex-col items-center col-span-1">
          <UserProfile />
          
          {/* Grid for 2x2 stat cards */}
          <div className="bg-customGray-400 p-8 rounded-2xl grid grid-cols-2 gap-4 mt-6">
            <TopItem />
            <TopStore />
            
            {/* Placeholders */}
            <div className="bg-customGray-300 shadow-lg rounded-xl p-4 flex flex-col items-center w-56">
              <h2 className="text-md font-semibold flex items-center gap-2">
                📦 Placeholder 1
              </h2>
              <div className="w-20 h-24 bg-gray-200 mt-2 rounded-md" />
              <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
            </div>

            <div className="bg-customGray-300 shadow-lg rounded-xl p-4 flex flex-col items-center w-56">
              <h2 className="text-md font-semibold flex items-center gap-2">
                🔒 Placeholder 2
              </h2>
              <div className="w-20 h-24 bg-gray-200 mt-2 rounded-md" />
              <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE WRAPPER */}
        <section className="flex flex-col col-span-2 gap-6">
          {/* ✅ Banner outside the chart box */}
          <div className="bg-customGray-300 h-60 rounded-xl shadow-inner flex items-center justify-center text-black-400">
            Banner Placeholder
          </div>

          {/* Box that holds filters + chart */}
          <div className="bg-customGray-300 shadow-md rounded-2xl p-6 flex flex-col justify-between flex-grow h-full">
          <div className="flex flex-wrap items-center gap-2 mb-4">
  <Filters selectedStore={selectedStore} setSelectedStore={setSelectedStore} />

  {/* 🔘 Tab-style buttons */}
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

            <ChartComponent userId={userId!} selectedStore={selectedStore} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
