// src/pages/store/products/[supplierName]/[storeName]/[productName].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { Product } from '@/types';
import { useEffect, useState } from 'react';
import styles from '@/components/Card/Card.module.css';

interface ProductPageProps {
    product: Product;
    supplierName: string;
    storeName: string;
}

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const ProductPage = ({ product, supplierName, storeName }: ProductPageProps) => {
    const router = useRouter();
    const [error, setError] = useState('');

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
    const formattedStoreName = capitalizeWords(storeName);

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                {error && <p className="text-red-500">{error}</p>}
                <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
                <p><strong>Supplier:</strong> {formattedSupplierName}</p>
                <p><strong>Store:</strong> {formattedStoreName}</p>
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
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { supplierName, storeName, productName } = context.params as { supplierName: string; storeName: string; productName: string };

    try {
        const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/stores/${storeName}/${productName}.json`);

        return {
            props: {
                product: productData,
                supplierName,
                storeName,
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