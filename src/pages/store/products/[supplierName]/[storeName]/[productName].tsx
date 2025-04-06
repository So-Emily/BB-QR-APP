import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3, getSignedUrlForS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import styles from '@/styles/print-qrcodes.module.css';

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
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
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
                    return;
                }

                const storeName = `${storeDetails.storeName.replace(/\s+/g, '-').toLowerCase()}-${storeDetails.storeNumber}`;
                const supplierKeys = await listFilesInS3('suppliers/');
                const supplierNames = supplierKeys
                    .filter((key): key is string => key !== undefined && key.includes('/stores/'))
                    .map(key => key.split('/')[1]);

                const qrCodePromises = supplierNames.flatMap(supplierName =>
                    listFilesInS3(`suppliers/${supplierName}/stores/${storeName}/`).then(qrCodeKeys =>
                        qrCodeKeys
                            .filter((key): key is string => key !== undefined && key.endsWith('info.json'))
                            .map(async key => {
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
                            })
                    )
                );

                const qrCodes = (await Promise.all((await Promise.all(qrCodePromises)).flat())).filter(
                    (qrCode): qrCode is QRCode => qrCode !== null
                );

                setQRCodes(qrCodes);
            } catch (err) {
                setError('Failed to fetch QR codes: ' + err);
            }
        };

        fetchQRCodes();
    }, [session]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            {session && session.user && <Navbar />}
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Print QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className={styles.printableGrid}>
                    {qrCodes.map((qrCode, index) => (
                        <div key={index} className={styles.printableItem}>
                            <p className="text-sm font-semibold text-center mb-2">{qrCode.productName}</p>
                            <QRCodeCanvas
                                value={qrCode.signedUrl}
                                size={128}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    ))}
                </div>
                <button
                    onClick={handlePrint}
                    className={`${styles.floatingButton} px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600`}
                >
                    Print QR Codes
                </button>
            </div>
        </div>
    );
};

export default PrintQRCodesPage;