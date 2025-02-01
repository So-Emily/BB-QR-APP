import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, getSignedUrlForS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface QRCode {
    key: string;
    signedUrl: string;
    productName: string | undefined;
    supplierName: string;
    storeName: string;
}

const DownloadQRCodesPage = () => {
    const { data: session } = useSession();
    const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            return;
        }

        const fetchQRCodes = async () => {
            try {
                const storeName = session.user.name?.replace(/\s+/g, '-').toLowerCase() ?? '';
                console.log(`Fetching QR codes for store: ${storeName}`);
                const qrCodeKeys = await listFilesInS3(`suppliers/*/stores/${storeName}/`);
                console.log(`QR code keys: ${qrCodeKeys}`);
                if (qrCodeKeys.length === 0) {
                    console.warn('No QR code keys found');
                }
                const qrCodePromises = qrCodeKeys
                    .filter((key): key is string => key !== undefined)
                    .map(async (key: string) => {
                        try {
                            console.log(`Fetching signed URL for key: ${key}`);
                            const signedUrl = await getSignedUrlForS3(key);
                            const productName = key.split('/').pop()?.replace('.svg', '');
                            const supplierName = key.split('/')[1];
                            return {
                                key,
                                signedUrl,
                                productName,
                                supplierName,
                                storeName,
                            };
                        } catch (err) {
                            console.error(`Failed to fetch QR code data for key ${key}:`, err);
                            return null;
                        }
                    });
                const qrCodes = (await Promise.all(qrCodePromises)).filter(qrCode => qrCode !== null) as QRCode[];
                console.log(`Fetched QR codes: ${qrCodes}`);
                setQRCodes(qrCodes);
            } catch (err) {
                console.error('Failed to fetch QR codes:', err);
                setError('Failed to fetch QR codes: ' + err);
            }
        };

        fetchQRCodes();
    }, [session]);

    const handleBulkDownload = async () => {
        const zip = new JSZip();
        const folder = zip.folder('qr-codes');
        if (!folder) {
            setError('Failed to create zip folder');
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

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Download QR Codes</h1>
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
                                value={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/supplier/products/${qrCode.supplierName}/${qrCode.storeName}/${qrCode.productName}`}
                                size={128}
                                level="H"
                                includeMargin={true}
                            />
                            <Link href={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/supplier/products/${qrCode.supplierName}/${qrCode.storeName}/${qrCode.productName}`} passHref>
                                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    View Product Page
                                </button>
                            </Link>
                            <a
                                href={qrCode.signedUrl}
                                download={`${qrCode.productName}.svg`}
                                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Download QR Code
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DownloadQRCodesPage;