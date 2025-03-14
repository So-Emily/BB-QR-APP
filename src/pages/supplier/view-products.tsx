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
    const [backsideInfo, setBacksideInfo] = useState({ description: '', message: '' });
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
                    const response = await fetchProductDataFromS3(backsideInfoKey);
                    if (response) {
                        setBacksideInfo(response);
                    } else {
                        console.warn('Backside info not found');
                    }
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
                            // Pushing all the props to Card.tsx
                            productName={product.name}
                            productDescription={product.description || ''}
                            backgroundUrl={product.backgroundUrl}
                            imageUrl={product.imageUrl}
                            supplierName={supplierName}
                            cardStyles={product.styles}
                            location={product.location}
                            pairing={product.pairing}
                            taste={product.taste}
                            backsideDescription={backsideInfo.description}
                            backsideMessage={backsideInfo.message}

                            //Additional Buttons Below card in View Products
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