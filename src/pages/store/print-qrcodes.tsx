import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3, getSignedUrlForS3 } from '@/lib/s3';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, TextField, Checkbox, FormControlLabel } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import styles from '@/styles/print-qrcodes.module.css';

interface QRCode {
    key: string;
    signedUrl: string;
    productName: string;
    supplierName: string;
    storeName: string;
    storeNumber: string;
}

const PrintQRCodesPage = () => {
    const { data: session } = useSession();
    const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
    const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
    const [qrCodeSize, setQRCodeSize] = useState<number>(128);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            return;
        }

        const fetchQRCodes = async () => {
            try {
                const userData = await fetch('/api/user').then(res => res.json());
                console.log('User Data:', userData);

                const storeDetails = userData.storeDetails;
                if (!storeDetails || storeDetails.length === 0) {
                    setError('Store details not found');
                    return;
                }

                const supplierName = storeDetails.supplierName?.replace(/\s+/g, '-').toLowerCase() ?? '';
                const storeName = storeDetails.storeName.replace(/\s+/g, '-').toLowerCase();
                const storeNumber = storeDetails.storeNumber;
                const storeIdentifier = `${storeName}-${storeNumber}`;

                const productKeys = await listFilesInS3(`suppliers/${supplierName}/stores/${storeIdentifier}/`);
                console.log('Product Keys:', productKeys);

                const jsonKeys = productKeys.filter((key): key is string => key !== undefined && key.endsWith('info.json'));
                console.log('JSON Keys:', jsonKeys);

                const productPromises = jsonKeys.map(async (key: string) => {
                    try {
                        const productData = await fetchProductDataFromS3(key);
                        console.log('Product Data:', productData);

                        const qrCodeKey = key.replace('info.json', `${productData.productName.replace(/\s+/g, '-').toLowerCase()}.svg`);
                        const signedUrl = await getSignedUrlForS3(qrCodeKey);
                        console.log('Signed URL:', signedUrl);

                        return {
                            key: qrCodeKey,
                            signedUrl,
                            productName: productData.productName,
                            supplierName,
                            storeName: storeDetails.storeName,
                            storeNumber: storeDetails.storeNumber,
                        };
                    } catch (err) {
                        console.error(`Failed to fetch product data for key ${key}:`, err);
                        return null;
                    }
                });

                const qrCodes = (await Promise.all(productPromises)).filter(qrCode => qrCode !== null) as QRCode[];
                console.log('QR Codes:', qrCodes);
                setQRCodes(qrCodes);
            } catch (err) {
                setError('Failed to fetch QR codes: ' + err);
            }
        };

        fetchQRCodes();
    }, [session]);

    const handleQRCodeSelection = (key: string) => {
        setSelectedQRCodes(prevSelected =>
            prevSelected.includes(key)
                ? prevSelected.filter(selectedKey => selectedKey !== key)
                : [...prevSelected, key]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Print QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="mb-4">
                    <TextField
                        label="QR Code Size"
                        type="number"
                        value={qrCodeSize}
                        onChange={(e) => setQRCodeSize(parseInt(e.target.value))}
                        inputProps={{ min: 64, max: 512 }}
                        className="mr-4"
                    />
                </div>
                <div className="mb-4">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedQRCodes.length === qrCodes.length}
                                onChange={() => setSelectedQRCodes(selectedQRCodes.length === qrCodes.length ? [] : qrCodes.map(qrCode => qrCode.key))}
                            />
                        }
                        label="Select All"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {qrCodes.map((qrCode, index) => (
                        <div key={index} className="border rounded shadow p-4 flex flex-col items-center mb-4">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedQRCodes.includes(qrCode.key)}
                                        onChange={() => handleQRCodeSelection(qrCode.key)}
                                    />
                                }
                                label={qrCode.productName}
                            />
                            <QRCodeCanvas
                                value={qrCode.signedUrl}
                                size={qrCodeSize}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <h2 className="text-xl font-bold mb-2">Selected QR Codes</h2>
                    <div className={styles.printableGrid}>
                        {selectedQRCodes.map((key, index) => {
                            const qrCode = qrCodes.find(qr => qr.key === key);
                            if (!qrCode) return null;
                            return (
                                <div key={index} className={styles.printableItem}>
                                    <p className="text-xs text-center">{qrCode.productName}</p>
                                    <QRCodeCanvas
                                        value={qrCode.signedUrl}
                                        size={qrCodeSize}
                                        level="H"
                                        includeMargin={true}
                                    />
                                    <div className={styles.cutLine}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    className="mt-4"
                >
                    Print Selected QR Codes
                </Button>
            </div>
        </div>
    );
};

export default PrintQRCodesPage;