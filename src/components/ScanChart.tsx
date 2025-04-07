import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

interface ScanData {
    name: string;
    scanCount: number;
}

const ScanChart = ({ userId }: { userId: string }) => {
    const [scanData, setScanData] = useState<ScanData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScanData = async () => {
            try {
                const response = await fetch(`/api/scans/fetch-scans?userId=${userId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch scan data');
                }
                const data: ScanData[] = await response.json();
                setScanData(data);
            } catch (error) {
                console.error('Error fetching scan data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScanData();
    }, [userId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    const labels = scanData.map((item) => item.name);
    const data = {
        labels,
        datasets: [
            {
                label: 'Scan Count',
                data: scanData.map((item) => item.scanCount),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return <Bar data={data} />;
};

export default ScanChart;
