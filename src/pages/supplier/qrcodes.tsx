import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3, uploadFileToS3 } from '@/lib/s3';
import { Product } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import QRCode from 'qrcode';
import Link from 'next/link';

const QRCodePage = () => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            return;
        }

        const fetchProducts = async () => {
            try {
                const supplierName = session.user.name?.replace(/\s+/g, '-').toLowerCase() ?? '';
                const productKeys = await listFilesInS3(`suppliers/${supplierName}/products/`);
                const jsonKeys = productKeys.filter((key): key is string => key !== undefined && key.endsWith('product.json'));
                const productPromises = jsonKeys.map(async (key: string) => {
                    try {
                        const productData = await fetchProductDataFromS3(key);
                        return productData;
                    } catch (err) {
                        console.error(`Failed to fetch product data for key ${key}:`, err);
                        return null;
                    }
                });
                const products = (await Promise.all(productPromises)).filter(product => product !== null);
                setProducts(products);

                // Generate and upload QR codes for each product
                products.forEach(async (product) => {
                    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/supplier/products/${supplierName}/${product.name.replace(/\s+/g, '-').toLowerCase()}`, { errorCorrectionLevel: 'high' });
                    const response = await fetch(qrCodeDataUrl);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const qrCodeKey = `suppliers/${supplierName}/qrcodes/${product.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
                    await uploadFileToS3(qrCodeKey, buffer, 'image/svg');
                });
            } catch (err) {
                setError('Failed to fetch products: ' + err);
            }
        };

        fetchProducts();
    }, [session]);

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-center">QR Codes for Your Products</h1>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product, index) => (
                        <div key={index} className="border rounded shadow p-4 flex flex-col items-center">
                            <h2 className="text-xl font-bold mt-4 text-center">{product.name}</h2>
                            <Link href={`/supplier/products/${session?.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}`} passHref>
                                <div className="cursor-pointer">
                                    <QRCodeCanvas
                                        value={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/supplier/products/${session?.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}`}
                                        size={256} // Increase the size of the QR code
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QRCodePage;