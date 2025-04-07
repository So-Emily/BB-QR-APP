import React from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar/Navbar";
import ChartComponent from "@/components/ChartComponent"; // Adjust path as needed

const capitalizeName = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const Dashboard = () => {
  const { status, data: session } = useSession();

  // Replace this with the actual userId from session
  const userId = session?.user?.id || "64c2f1e91ab0f1a1b8c7b6c2"; // Example userId

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;
  }

  return (
    <div className="min-h-screen bg-dark-400 text-black">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="p-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        {/* Left Panel */}
        <section className="bg-gray-100 shadow-md rounded-lg p-6 w-full md:w-1/3">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-3xl font-bold">A</span>
            </div>
            <h2 className="text-lg font-bold mb-4">
              {capitalizeName(session?.user?.name || "Supplier Name")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Placeholder items */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-300 rounded mb-2"></div>
              <span className="text-sm">Top Item</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-300 rounded mb-2"></div>
              <span className="text-sm">Top Store</span>
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <section className="bg-gray-100 shadow-md rounded-lg p-6 flex-1">
          <h1 className="text-lg font-bold mb-4">Product Scan Count Test</h1>
          <div className="h-64 bg-gray-300 flex items-center justify-center rounded">
            <ChartComponent userId={userId} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;