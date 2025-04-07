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
  scanCount: number;
}

const ChartComponent = ({ userId }: { userId: string }) => {
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

        // Transform data for Chart.js
        const labels = data.map((item) => item.name);
        const counts = data.map((item) => item.scanCount);

        setChartData({
          labels,
          datasets: [
            {
              label: "Scan Count",
              data: counts,
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
  }, [userId]);

  if (loading) {
    return <div>Loading chart data...</div>;
  }

  if (!chartData) {
    return <div>No data available</div>;
  }

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Products",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Scan Count",
            },
          },
        },
      }}
    />
  );
};

export default ChartComponent;
