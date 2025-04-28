import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, getSignedUrlForS3, fetchProductDataFromS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';
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
                    console.error('Store details not found');
                    setLoading(false);
                    return;
                }

                const storeName = `${storeDetails.storeName.replace(/\s+/g, '-').toLowerCase()}-${storeDetails.storeNumber}`;
                const supplierKeys = await listFilesInS3('suppliers/');
                const supplierNames = supplierKeys
                    .filter((key): key is string => key !== undefined && key.includes('/stores/'))
                    .map(key => key.split('/')[1]);

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

                // Compare with cached QR codes
                const cachedQRCodes = JSON.parse(localStorage.getItem('qrCodes') || '[]');
                const cachedKeys = new Set(cachedQRCodes.map((qrCode: QRCode) => qrCode.key));
                const newQRCodes = uniqueQRCodes.filter(qrCode => !cachedKeys.has(qrCode.key));

                if (newQRCodes.length > 0) {
                    // Update local storage with new QR codes
                    const updatedQRCodes = [...cachedQRCodes, ...newQRCodes];
                    localStorage.setItem('qrCodes', JSON.stringify(updatedQRCodes));
                    setQRCodes(updatedQRCodes);
                } else {
                    setQRCodes(cachedQRCodes);
                }
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

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4" style={{ marginLeft: 15, paddingLeft: 0 }}>
                <h1 className="text-2xl font-bold mb-4">QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <button
                    onClick={handleBulkDownload}
                    className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Download All QR Codes
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {qrCodes.map((qrCode, index) => (
                        <div key={index} className="border rounded shadow p-4 flex flex-col items-center mb-4">
                            <h2 className="text-xl font-bold mt-4 text-center">{qrCode.productName}</h2>
                            <p className="text-center">Supplier: {qrCode.supplierName}</p>
                            <QRCodeCanvas
                                value={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${qrCode.supplierName}/${qrCode.storeName}/${qrCode.productName}`}
                                size={128}
                                level="H"
                                includeMargin={true}
                            />
                            <Link href={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${qrCode.supplierName}/${qrCode.storeName}/${qrCode.productName}`} passHref>
                                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    View Product Page
                                </button>
                            </Link>
                            <button
                                onClick={() => handleDownload(qrCode)}
                                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Download QR Code
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DownloadQRCodesPage;