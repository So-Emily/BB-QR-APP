import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from '@/components/Navbar/Navbar'; 
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
    }[];
}

interface ProductData {
    name: string;
    scanCount: number;
}

const Dashboard = () => {
    const { status } = useSession();
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData | null>(null);

    useEffect(() => {
        if (status === "authenticated" || status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === "authenticated") {
            // Fetch scan count data for the chart
            const fetchChartData = async () => {
                try {
                    const response = await fetch('/api/products/scan-data'); // Replace with your API endpoint
                    if (!response.ok) {
                        throw new Error('Failed to fetch chart data');
                    }
                    const data: ProductData[] = await response.json(); // Explicitly define the data structure

                    // Transform data for Chart.js
                    const labels = data.map((item) => item.name);
                    const counts = data.map((item) => item.scanCount);

                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: 'Scan Count',
                                data: counts,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            },
                        ],
                    });
                } catch (error) {
                    console.error('Error fetching chart data:', error);
                }
            };

            fetchChartData();
        }
    }, [status]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header - Using Existing Navbar */}
            <Navbar />

            {/* Main Content */}
            <main className="p-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
                {/* Left Panel */}
                <section className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/3">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            {/* Placeholder for logo */}
                            <span className="text-red-500 text-3xl font-bold">A</span>
                        </div>
                        <h2 className="text-lg font-bold mb-4">Breakthru Beverage</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded mb-2"></div>
                            <span className="text-sm">Top Item</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded mb-2"></div>
                            <span className="text-sm">Top Store</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded mb-2"></div>
                            <span className="text-sm">???????</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-200 rounded mb-2"></div>
                            <span className="text-sm">???????</span>
                        </div>
                    </div>
                </section>

                {/* Right Panel */}
                <section className="bg-white shadow-md rounded-lg p-6 flex-1">
                    <div className="flex justify-between mb-4">
                        <select className="border border-gray-300 rounded px-4 py-2">
                            <option>Account</option>
                            <option>Woodlands 3197</option>
                        </select>
                        <select className="border border-gray-300 rounded px-4 py-2">
                            <option>Category</option>
                            <option>Breakthru Top 5</option>
                        </select>
                    </div>
                    <div className="h-64 bg-gray-200 flex items-center justify-center rounded">
                        {chartData ? (
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top',
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <span className="text-gray-500">Loading Chart...</span>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

console.log("Rendering Supplier Portfolio Page");

export default Dashboard;