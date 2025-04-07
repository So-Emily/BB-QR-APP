import { useEffect, useState } from "react";
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

const TestPage = () => {
  const [chartData, setChartData] = useState<ChartData<"bar"> | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const response = await fetch(
          "/api/scans/fetch-scans?userId=677d7cdf0da446ea1fe172c5"
        ); // Replace with a valid userId
        if (!response.ok) {
          throw new Error("Failed to fetch test data");
        }

        const result: ProductData[] = await response.json();

        // Extract labels (product names) and scanCounts
        const labels = result.map((item: ProductData) => item.name);
        const counts = result.map((item: ProductData) => item.scanCount);

        // Create Chart.js data
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
        console.error(error);
      }
    };

    fetchTestData();
  }, []);

  if (!chartData) {
    return <div>Loading chart data...</div>;
  }

  return (
    <div>
      <h1>Test Page</h1>
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
    </div>
  );
};

export default TestPage;
