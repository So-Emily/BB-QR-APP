// src/pages/supplier/view-products.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3 } from '@/lib/s3';
import { Product } from '@/types';
import Card from '@/components/Card/Card';
import Link from 'next/link';
import cardStyles from '@/components/Card/Card.module.css';
import pageStyles from '@/styles/view-products.module.css'; // Import the new CSS module

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const ViewProductsPage = () => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [backsideInfo, setBacksideInfo] = useState({ additionalInfo: '' });
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

                        // Track scan count for the product
                        await trackScanCount(productData.id); // Assuming productData includes an `id` field from MongoDB
                        return productData;
                    } catch (err) {
                        console.error(`Failed to fetch product data for key ${key}:`, err);
                        return null;
                    }
                });
                const products = (await Promise.all(productPromises)).filter(product => product !== null);
                setProducts(products);

                // Fetch backside info
                const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;
                try {
                    const fetchedBacksideInfo = await fetchProductDataFromS3(backsideInfoKey);
                    setBacksideInfo(fetchedBacksideInfo);
                } catch (err) {
                    console.error('Failed to fetch backside info:', err);
                }
            } catch (err) {
                setError('Failed to fetch products: ' + err);
            }
        };

        const trackScanCount = async (productId: string) => {
            if (!productId) {
                console.error('Product ID is missing. Cannot track scan count.');
                return;
            }

            try {
                const response = await fetch(`/api/scans/${productId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    console.error(`Failed to track scan count for product ${productId}`);
                } else {
                    console.log(`Scan count tracked for product ${productId}`);
                }
            } catch (error) {
                console.error(`Error tracking scan count for product ${productId}:`, error);
            }
        };

        fetchProducts();
    }, [session]);

    if (!session || !session.user) {
        return <div>User not authenticated</div>;
    }

    const supplierName = capitalizeWords(session.user.name ?? '');

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Your Products</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className={pageStyles.cardContainer}>
                    {products.map((product, index) => (
                        <Card
                            key={index}
                            frontContent={
                                <div className="p-4">
                                    <h1 className="text-2xl font-bold">{product.name}</h1>
                                    <p>{product.description}</p>
                                    <div className={cardStyles.infoRow}>
                                        {product.pairing.length > 0 && (
                                            <div className={cardStyles.infoColumn}>
                                                <strong>Pairing:</strong>
                                                <div>{product.pairing.join(' ')}</div>
                                            </div>
                                        )}
                                        {product.location && (
                                            <div className={cardStyles.infoColumn}>
                                                <strong>Origin:</strong>
                                                <div>
                                                    {product.location.city && `${product.location.city}`}
                                                    {product.location.city && product.location.state && `, `}
                                                    {product.location.state && `${product.location.state}`}
                                                    {(product.location.city || product.location.state) && product.location.country && `, `}
                                                    {product.location.country}
                                                </div>
                                            </div>
                                        )}
                                        {product.taste.length > 0 && (
                                            <div className={cardStyles.infoColumn}>
                                                <strong>Taste:</strong>
                                                <div>{product.taste.join(' ')}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            }
                            backContent={
                                <div className="p-4">
                                    <h2 className="text-xl font-bold">Additional Info</h2>
                                    <p>{backsideInfo.additionalInfo}</p>
                                </div>
                            }
                            backgroundUrl={product.backgroundUrl}
                            imageUrl={product.imageUrl}
                            supplierName={supplierName} // Pass formatted supplierName prop
                            cardStyles={product.styles} // Pass card styles
                            additionalContent={
                                <div className="flex justify-between">
                                    <Link href={`/supplier/products/${session.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}`} passHref>
                                        <button className={cardStyles.button} onClick={(e) => e.stopPropagation()}>View</button>
                                    </Link>
                                    <Link href={`/supplier/products/${session.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}/edit`} passHref>
                                        <button className={cardStyles.button} onClick={(e) => e.stopPropagation()}>Edit</button>
                                    </Link>
                                </div>
                            }
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewProductsPage;