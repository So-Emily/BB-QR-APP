import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, getSignedUrlForS3, fetchProductDataFromS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface QRCode {
    key: string;
    signedUrl: string;
    productName: string;
    supplierName: string;
    storeName: string;
}

const DownloadQRCodesPage = () => {
    const { data: session } = useSession();
    const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredQRCode, setHoveredQRCode] = useState<string | null>(null);
    const [selectedQRCode, setSelectedQRCodes] = useState<QRCode | null>(null);

    // States for suppliers
    const [suppliers, setSuppliers] = useState<{ name: string; profileImageUrl: string }[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [supplierSearch, setSupplierSearch] = useState('');

    const handleMouseEnter = (key: string) => {
        setHoveredQRCode(key);
    };

    const handleMouseLeave = () => {
        setHoveredQRCode(null);
    };

    const handleQRCodeClick = (qrCode: QRCode) => {
        setSelectedQRCodes(qrCode);
    };

    const closeMenu = () => {
        setSelectedQRCodes(null);
    };

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            console.error('User not authenticated');
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

                // Fetch supplier profiles AFTER supplierNames is defined
                const supplierProfiles = await Promise.all(
                    supplierNames.map(async (name) => {
                        try {
                            const url = await getSignedUrlForS3(`suppliers/${name}/profile-img.png`);
                            return { name, profileImageUrl: url };
                        } catch {
                            return { name, profileImageUrl: '/images/profile-placeholder.png' };
                        }
                    })
                );
                setSuppliers(supplierProfiles);

                // Fetch QR codes for each supplier
                // Use flatMap to create an array of promises for each supplier
                const qrCodePromises = supplierNames.flatMap(supplierName => {
                    if (!supplierName) return [];
                    return listFilesInS3(`suppliers/${supplierName}/stores/${storeName}/`).then(qrCodeKeys => {
                        return qrCodeKeys
                            .filter((key): key is string => key !== undefined && key.endsWith('info.json'))
                            .map(async (key: string) => {
                                try {
                                    const productInfo = await fetchProductDataFromS3(key);
                                    const qrCodeKey = key.replace('info.json', `${productInfo.productName.replace(/\s+/g, '-').toLowerCase()}.svg`);
                                    const signedUrl = await getSignedUrlForS3(qrCodeKey);
                                    return {
                                        key: qrCodeKey,
                                        signedUrl,
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

                const qrCodes = (await Promise.all((await Promise.all(qrCodePromises)).flat())).filter((qrCode): qrCode is QRCode => qrCode !== null);

                // Remove duplicates and save to state
                const uniqueQRCodes = Array.from(new Map(qrCodes.map(qrCode => [qrCode.key, qrCode])).values());
                setQRCodes(uniqueQRCodes);
            } catch (err) {
                console.error('Failed to fetch QR codes:', err);
                setError('Failed to fetch QR codes: ' + err);
            } finally {
                setLoading(false);
            }
        };

        fetchQRCodes();
    }, [session]);

    const handleBulkDownload = async () => {
        const zip = new JSZip();
        const folder = zip.folder('qr-codes');
        if (!folder) {
            setError('Failed to create zip folder');
            console.error('Failed to create zip folder');
            return;
        }
        for (const qrCode of qrCodes) {
            const response = await fetch(qrCode.signedUrl);
            const blob = await response.blob();
            folder.file(`${qrCode.productName}.svg`, blob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'qr-codes.zip');
    };

    const handleDownload = async (qrCode: QRCode) => {
        try {
            const response = await fetch(qrCode.signedUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${qrCode.productName}.svg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download QR code:', err);
            setError('Failed to download QR code: ' + err);
        }
    };

    if (loading) {
        return <div>Loading QR codes...</div>;
    }

    const formatProductName = (name: string) => {
        return name
            .split('-') // Split the name by dashes
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
            .join(' '); // Join the words with spaces
    };

    const formatSupplierName = (name: string) => {
        return name
            .split('-') // Split the name by dashes
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
            .join(' '); // Join the words with spaces
    }

    return (
        <div className="bg-customGray-500 min-h-screen">
            <Navbar />

            {/* Main content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <h1 className="text-2xl font-bold mb-4">QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    onClick={handleBulkDownload}
                    className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Download All QR Codes
                </button>

                {/* Supplier Section */}
                <h2 className="text-l font-semibold mb-4">Suppliers</h2>

                {/* Search box */}
                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Search for supplier"
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                        className="px-3 py-2 rounded border w-64"
                    />
                </div>

                {/* Supplier Image Section */}
                <div className="rounded-lg bg-customGray-400 p-4 shadow-md mb-6">
                    <div className="flex gap-4 flex-nowrap overflow-visible">
                        {suppliers
                            .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                            .map((supplier) => (
                            <div
                                key={supplier.name}
                                className={`flex-shrink-0 w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center relative cursor-pointer border-4 ${selectedSupplier === supplier.name ? 'border-green-500' : 'border-transparent'}`}
                                onMouseEnter={() => setHoveredQRCode(supplier.name)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => setSelectedSupplier(selectedSupplier === supplier.name ? null : supplier.name)}
                                style={{
                                    backgroundImage: `url(${supplier.profileImageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {/* Tooltip on hover */}
                                {hoveredQRCode === supplier.name && (
                                    <div
                                        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white text-black text-m p-4 rounded shadow-lg z-10"
                                        style={{
                                            minWidth: '200px',
                                            textAlign: 'left',
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            opacity: 0.95,
                                        }}
                                    >
                                        <span className="font-semibold">Supplier:</span> <span>{formatSupplierName(supplier.name)}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* QR Code Section */}
                <h2 className="text-l font-semibold mb-4">QR Codes</h2>

                {/* little info section */}
                <p className="text-sm text-gray-500 mb-4">
                    Click on a QR code to view options.
                    <br />
                    Hover over a QR code to see supplier and item details.
                </p>

                {/* QR Code Grid */}
                <div className="rounded-lg bg-customGray-400 p-6 shadow-md">
                    <div className="grid grid-cols-2 sm:grid-cols-7 md:grid-cols-5 lg:grid-cols-8 gap-5">
                        {qrCodes
                            .filter(qrCode => !selectedSupplier || qrCode.supplierName === selectedSupplier)
                            .map((qrCode, index) => (
                                <div
                                    key={index}
                                    className="relative flex flex-col items-center"
                                    onMouseEnter={() => handleMouseEnter(qrCode.key)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleQRCodeClick(qrCode)} // Open the menu on click
                                >
                                    <QRCodeCanvas
                                        value={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${qrCode.supplierName}/${qrCode.storeName}/${qrCode.productName}`}
                                        size={128}
                                        level="H"
                                        includeMargin={true}
                                    />
                                    <h2 className="mt-2 text-lg font-semibold text-center">{formatProductName(qrCode.productName)}</h2>

                                    {/* QR hover pop-up with names */}
                                    {hoveredQRCode === qrCode.key && (
                                        <div
                                            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-white text-black text-m p-4 rounded shadow-lg"
                                            style={{
                                                minWidth: '200px',
                                                textAlign: 'left',
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                opacity: 0.95,
                                            }}
                                        >
                                            <p><strong>Supplier:</strong> {formatSupplierName(qrCode.supplierName)}</p>
                                            <p><strong>Item:</strong> {formatProductName(qrCode.productName)}</p>
                                        </div>
                                    )}
                                </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal for QR Code Menu */}
            {selectedQRCode && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-black">
                            Options for {formatProductName(selectedQRCode.productName)}
                        </h2>
                        <button
                            onClick={() => {
                                window.open(
                                    `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${selectedQRCode.supplierName}/${selectedQRCode.storeName}/${selectedQRCode.productName}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                );
                            }}
                            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                        >
                            View Product Page
                        </button>
                        <button
                            onClick={() => handleDownload(selectedQRCode)}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full"
                        >
                            Download QR Code
                        </button>
                        <button
                            onClick={closeMenu}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadQRCodesPage;