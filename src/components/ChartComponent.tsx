import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ProductData {
  name: string;
  totalScans: number;
  perStoreScans: { storeId: string; scanCount: number }[];
}

const ChartComponent = ({ userId, selectedStore }: { userId: string; selectedStore: string }) => {
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/scans/fetch-scans?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch chart data");
        }

        const data: ProductData[] = await response.json();

        // 🔹 Filter based on selected store
        const filteredData = data.map((item) => {
          if (selectedStore === "all") {
            return {
              name: item.name,
              scanCount: item.totalScans, // Show total scans across all stores
            };
          } else {
            const storeData = item.perStoreScans.find((store) => store.storeId === selectedStore);
            return {
              name: item.name,
              scanCount: storeData ? storeData.scanCount : 0, // Show scans only for selected store
            };
          }
        });

        const sortedData = [...filteredData].sort((a, b) => b.scanCount - a.scanCount);
        
        const labels = sortedData.map((item) => item.name);
        const scanCounts = sortedData.map((item) => item.scanCount);

        setChartData({
          labels,
          datasets: [
            {
              label: "Total Scans per Product",
              data: scanCounts,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });

      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [userId, selectedStore]); // 🔹 Re-fetch data when the store changes

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  if (!chartData) {
    return <div>No data available</div>;
  }

  return (
    <div className="bg-customGray-300 w-full max-w-3xl mx-auto h-80 flex items-center justify-center">
      
      <div className="bg-customGray-400 shadow-md rounded-lg p-4 w-full h-full">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
                position: "top",
              },
            },
            scales: {
              x: {
                title: {
                  display: false,
                  text: "Products",
                },
                ticks: {
                  display: false,
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: false,
                  text: "Scan Count",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );

}

export default ChartComponent;