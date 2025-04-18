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

  // Replace this with actual userId from session
  const userId = session?.user?.id

  // 🛠️ NEW: State for selected store
  const [selectedStore, setSelectedStore] = useState("all");

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <Navbar />

      {/* Grid Layout for Dashboard */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Left Panel: User Info & Top Stats */}
        <section className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center col-span-1">
          <UserProfile />
          <div className="flex space-x-4 mt-4">
          <TopItem />
          <TopStore />

          </div>
        </section>

        {/* Right Panel: Filters + Chart */}
        <section className="bg-white shadow-md rounded-lg p-6 flex flex-col col-span-2">
          <Filters selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
          <ChartComponent userId={userId!} selectedStore={selectedStore} />

        </section>
      </main>
    </div>
  );
};

export default Dashboard;


//add hover over scans
// remove scan names below
// Add hover number to top store/product
// add dashboard to store page
// add mobile functionality