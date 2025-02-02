// src/pages/supplier/products/[supplierName]/[productName].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { Product } from '@/types';
import { useEffect, useState } from 'react';
import Card from '@/components/Card/Card';
import styles from '@/components/Card/Card.module.css';

interface ProductPageProps {
    product: Product & { id?: string }; // Add optional `id` field for MongoDB
    supplierName: string;
    backsideInfo: { description: string, message: string };
}

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const ProductPage = ({ product, supplierName, backsideInfo }: ProductPageProps) => {
    const router = useRouter();
    const [error, setError] = useState('');

    // Track scan count when the page loads
    useEffect(() => {
        const trackScan = async () => {
            if (!product.id) {
                console.error('Product ID is missing. Cannot track scan count.');
                return;
            }

            try {
                const response = await fetch(`/api/scans/${product.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Failed to track scan count.');
                }

                console.log(`Scan tracked for product: ${product.id}`);
            } catch (err) {
                console.error('Error tracking scan count:', err);
                setError('Failed to track scan count.');
            }
        };

        trackScan();
    }, [product.id]);

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    const formattedSupplierName = capitalizeWords(supplierName);

    const frontContent = (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p>{product.description}</p>
            <div className={styles.infoRow}>
                {product.pairing.length > 0 && (
                    <div className={styles.infoColumn}>
                        <strong>Pairing:</strong>
                        <div>{product.pairing.join(', ')}</div>
                    </div>
                )}
                {product.location && (
                    <div className={styles.infoColumn}>
                        <strong>Origin:</strong>
                        <div>
                            {product.location.city && `${product.location.city}, `}
                            {product.location.state && `${product.location.state}, `}
                            {product.location.country}
                        </div>
                    </div>
                )}
                {product.taste.length > 0 && (
                    <div className={styles.infoColumn}>
                        <strong>Taste:</strong>
                        <div>{product.taste.join(', ')}</div>
                    </div>
                )}
            </div>
        </div>
    );

    const backContent = (
        <div className="p-4">
            <h2 className="text-xl font-bold">Welcome from</h2>
            <h1 className="text-2xl font-bold">{supplierName}</h1>
            
            <label className="text-sm">Description:</label>
            <p>{backsideInfo.description}</p>

            <label className="text-sm">Message:</label>
            <p>{backsideInfo.message} </p>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
                {error && <p className="text-red-500 text-center">{error}</p>}
                <Card
                    frontContent={frontContent}
                    backContent={backContent}
                    backgroundUrl={product.backgroundUrl}
                    imageUrl={product.imageUrl}
                    supplierName={formattedSupplierName} // Pass formatted supplierName prop
                    cardStyles={product.styles} // Pass card styles
                />
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { supplierName, productName } = context.params as { supplierName: string; productName: string };

    try {
        // Increment the scan count
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/increment-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplierName, productName }),
        });

        // Fetch product data from S3
        const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);
        const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;
        let backsideInfo = { additionalInfo: '' };

        try {
            backsideInfo = await fetchProductDataFromS3(backsideInfoKey);
        } catch (err) {
            console.error('Failed to fetch backside info:', err);
        }

        return {
            props: {
                product: productData,
                supplierName, // Pass supplierName as a prop
                backsideInfo, // Pass backsideInfo as a prop
            },
        };
    } catch (error) {
        console.error('Error during getServerSideProps:', error);
        return {
            props: {
                error: 'Failed to load product',
            },
        };
    }
};

export default ProductPage;