import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import SupplierProfile from "@/components/Dashboard/SupplierProfile";
import TopItem from "@/components/Dashboard/TopItem";
import TopStore from "@/components/Dashboard/TopStore";
import Filters from "@/components/Dashboard/Filters";
import ChartComponent from "@/components/Dashboard/ChartComponent";
import Image from "next/image";

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
    <div className="flex flex-col min-h-screen bg-customGray-500 text-black">
      <Navbar />

      <div className="w-full max-w-[1300px] mx-auto px-4 flex-1 flex flex-col">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 flex-1">

          {/* Left Panel */}
          <section className="col-span-1 flex flex-col items-center bg-customGray-300 shadow-md rounded-2xl p-4">

            <SupplierProfile />

            {/* Grid for 2x2 stat cards */}
            <div className="bg-customGray-400 rounded-2xl p-4 grid grid-cols-2 gap-4 w-full ">

              <TopItem />
              <TopStore />

              {/* Placeholders */}
              {/* Placeholders */}
              <div className="bg-customGray-300 shadow-lg rounded-xl p-1 flex flex-col items-center w-full">
                <h2 className="text-md font-semibold flex items-center gap-2">💀Unpopular</h2>
                <Image 
                  src="/images/wholefoods.png"
                  alt="Whole Foods logo"
                  width={80} // Specify width
                  height={80} // Specify height
                  className="w-20 h-20 rounded-full object-cover shadow-md mt-2"
                />
                <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
                <p className="text-gray-600 text-sm">(scans)</p>
              </div>

              <div className="bg-customGray-300 shadow-lg rounded-xl p-1 flex flex-col items-center w-full">
                <h2 className="text-md font-semibold flex items-center gap-2">👻Ghost Town</h2>
                <Image 
                  src="/images/wholefoods.png"
                  alt="Whole Foods logo"
                  width={80} // Specify width
                  height={80} // Specify height
                  className="w-20 h-20 rounded-full object-cover shadow-md mt-2"
                />
                <p className="text-gray-400 text-sm mt-2">(Coming Soon)</p>
                <p className="text-gray-600 text-sm">(scans)</p>
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
