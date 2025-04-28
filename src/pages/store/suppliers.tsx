import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3 } from '@/lib/s3';

const SuppliersPage = () => {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        const fetchSuppliers = async () => {
            try {
                const userResponse = await fetch(`/api/user`);
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user details');
                }
                const userData = await userResponse.json();

                const storeDetails = userData.storeDetails;
                if (!storeDetails || storeDetails.length === 0) {
                    setError('Store details not found');
                    setLoading(false);
                    return;
                }

                const storeName = `${storeDetails.storeName.replace(/\s+/g, '-').toLowerCase()}-${storeDetails.storeNumber}`;
                const supplierKeys = await listFilesInS3('suppliers/');
                const supplierNames = supplierKeys
                    .filter((key): key is string => key !== undefined && key.includes(`/stores/${storeName}/`))
                    .map(key => key.split('/')[1]);

                const uniqueSuppliers = Array.from(new Set(supplierNames));
                setSuppliers(uniqueSuppliers);
            } catch (err) {
                console.error('Failed to fetch suppliers:', err);
                setError('Failed to fetch suppliers: ' + err);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, [session]);

    if (loading) {
        return <div>Loading suppliers...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
                {suppliers.length === 0 ? (
                    <p>No suppliers have sent QR codes yet.</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {suppliers.map((supplier, index) => (
                            <li key={index} className="mb-2">
                                {supplier}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SuppliersPage;