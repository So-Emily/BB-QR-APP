import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import styles from '@/styles/print-qrcodes.module.css';
import { truncate } from 'fs';

interface QRCode {
    key: string;
    signedUrl: string;
    productName: string;
    supplierName: string;
    storeName: string;
}

const PrintQRCodesPage = () => {
    const { data: session } = useSession();
    const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
    const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [qrCodeSize, setQRCodeSize] = useState(128); // Default size
    const [customSize, setCustomSize] = useState<string>(''); // Custom size input

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        const fetchQRCodes = async () => {
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
                const supplierNames = Array.from(
                    new Set(
                        supplierKeys
                            .filter((key): key is string => key !== undefined && key.includes('/stores/'))
                            .map(key => key.split('/')[1])
                    )
                );

                const qrCodePromises = supplierNames.flatMap(supplierName => {
                    if (!supplierName) return [];
                    return listFilesInS3(`suppliers/${supplierName}/stores/${storeName}/`).then(qrCodeKeys => {
                        return qrCodeKeys
                            .filter((key): key is string => key !== undefined && key.endsWith('info.json'))
                            .map(async (key: string) => {
                                try {
                                    const productInfo = await fetchProductDataFromS3(key);
                                    const qrCodeKey = key.replace('info.json', `${productInfo.productName.replace(/\s+/g, '-').toLowerCase()}.svg`);
                                    const qrCodeUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${productInfo.supplierName}/${productInfo.storeName}-${productInfo.storeNumber}/${productInfo.productName}`;
                                    return {
                                        key: qrCodeKey,
                                        signedUrl: qrCodeUrl,
                                        productName: productInfo.productName,
                                        supplierName: productInfo.supplierName,
                                        storeName: `${productInfo.storeName}-${productInfo.storeNumber}`,
                                    };
                                } catch (err) {
                                    console.error(`Failed to fetch QR code data for key ${key}:`, err);
                                    return null;
                                }
                            });
                    });
                });

                const qrCodes = (await Promise.all((await Promise.all(qrCodePromises)).flat()))
                    .filter((qrCode): qrCode is QRCode => qrCode !== null);

                // Remove duplicates based on the `key` property
                const uniqueQRCodes = Array.from(new Map(qrCodes.map(qrCode => [qrCode.key, qrCode])).values());

                setQRCodes(uniqueQRCodes);
                setLoading(false);
            } catch {
                setError('Failed to fetch QR codes');
                setLoading(false);
            }
        };

        fetchQRCodes();
    }, [session]);

    const handlePrint = () => {
        if (selectedQRCodes.length === 0) {
            alert('Please select at least one QR code to print.');
            return;
        }
        window.print();
    };

    const handleSelectAll = () => {
        if (selectedQRCodes.length === qrCodes.length) {
            setSelectedQRCodes([]); // Deselect all
        } else {
            setSelectedQRCodes(qrCodes.map(qrCode => qrCode.key)); // Select all
        }
    };

    const handleCheckboxChange = (key: string) => {
        setSelectedQRCodes(prev =>
            prev.includes(key) ? prev.filter(selectedKey => selectedKey !== key) : [...prev, key]
        );
    };

    const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!isNaN(Number(value)) && Number(value) > 0) {
            setQRCodeSize(Number(value));
        }
        setCustomSize(value);
    };

    // Format product name
    const formatProductName = (name: string) => {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Truncate ... helper
    const truncate = (text: string, max: number) => {
        return text.length > max ? text.slice(0, max) + '...' : text;
    };

    if (loading) {
        return <div>Loading QR codes...</div>;
    }

    return (
        <div>
            {session && session.user && <Navbar />}
            <div className="container mx-auto p-4" style={{ marginLeft: 15, paddingLeft: 0 }}>
                <h1 className="text-2xl font-bold mb-4">Print QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}

                {/* Dropdown and custom input for QR code size */}
                <div className="mb-4">
                    <label htmlFor="qrCodeSize" className="block text-sm font-medium text-gray-100">
                        Select QR Code Size:
                    </label>
                    <select
                        id="qrCodeSize"
                        value={qrCodeSize}
                        onChange={(e) => {
                            setQRCodeSize(Number(e.target.value));
                            setCustomSize(''); // Clear custom size when selecting from dropdown
                        }}
                        className="mt-1 block w-25 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800"
                    >
                        <option value={96}>Small (96px)</option>
                        <option value={128}>Medium (128px)</option>
                        <option value={192}>Large (192px)</option>
                    </select>
                    <label htmlFor="customSize" className="block text-sm font-medium text-gray-100 mt-4">
                        Or Enter Custom Size (px):
                    </label>
                    <input
                        id="customSize"
                        type="text"
                        value={customSize}
                        onChange={handleCustomSizeChange}
                        placeholder="Enter a custom size"
                        className="mt-1 block w-25 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800"
                    />
                </div>

                {/* Product Selection Section */}
                <div className="mb-4">
                    <h2 className="text-lg font-bold mb-2">Select Products to Print</h2>
                    <button
                        onClick={handleSelectAll}
                        className="mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        {selectedQRCodes.length === qrCodes.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {qrCodes.map((qrCode, index) => (
                            <div key={index} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedQRCodes.includes(qrCode.key)}
                                    onChange={() => handleCheckboxChange(qrCode.key)}
                                    className="mr-2"
                                />
                                <label>{qrCode.productName}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QR Code Display Section */}
                <div className={styles.printContainer}>
                    <div className={styles.printWrapper}>
                        <div
                            className={styles.printableGrid}
                            style={{
                                gridTemplateColumns: `repeat(auto-fit, minmax(${qrCodeSize + 32}px, 1fr))`,
                            }}
                        >
                            {qrCodes
                                .filter(qrCode => selectedQRCodes.includes(qrCode.key))
                                .map((qrCode, index) => (
                                    <div key={index} className={styles.printableItem}>
                                        <p className="text-xs text-center">
                                            {truncate(formatProductName(qrCode.productName), 21)}
                                        </p>
                                        <QRCodeCanvas
                                            value={qrCode.signedUrl}
                                            size={qrCodeSize}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Print QR Codes
                </button>
            </div>
        </div>
    );
};

export default PrintQRCodesPage;