import { GetServerSideProps } from 'next';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import Navbar from '@/components/Navbar/Navbar';
import Card from '@/components/Card/Card';

interface StoreProductPageProps {
    product: Product;
    supplierName: string;
    storeName: string;
    backsideInfo: { description: string; message: string };
}

const StoreProductPage = ({ product, supplierName, storeName, backsideInfo }: StoreProductPageProps) => {
    console.log(`Supplier Name: ${supplierName}`);
    console.log(`Store Name: ${storeName}`);
    console.log(`Product Name: ${product.name}`);

    const [error, setError] = useState('');

    // Track scan count when the page loads
    useEffect(() => {
        const trackScan = async () => {
            if (!product._id) {
                console.error('Product ID is missing. Cannot track scan count.');
                return;
            }

            try {
                const response = await fetch(`/api/scans/${product._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Failed to track scan count.');
                }

                console.log(`Scan tracked for product: ${product._id}`);
            } catch (err) {
                console.error('Error tracking scan count:', err);
                setError('Failed to track scan count.');
            }
        };

        trackScan();
    }, [product._id]);

    if (!product) {
        return <div>Product not found</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
                {error && <p className="text-red-500 text-center">{error}</p>}
                <Card
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
                />
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { supplierName, storeName, productName } = context.params as { supplierName: string; storeName: string; productName: string };

    try {
        // Increment the scan count
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/increment-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplierName, productName }),
        });

        console.log(`Supplier Name: ${supplierName}`);
        console.log(`Store Name: ${storeName}`);
        console.log(`Product Name: ${productName}`);

        // Fetch product data from S3
        const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);
        const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;
        let backsideInfo = { description: '', message: '' };

        try {
            backsideInfo = await fetchProductDataFromS3(backsideInfoKey);
        } catch (err) {
            console.error('Failed to fetch backside info:', err);
        }

        return {
            props: {
                product: productData,
                storeName,
                supplierName,
                backsideInfo,
            },
        };
    } catch (err) {
        console.error('Failed to fetch product data:', err);
        return {
            props: {
                product: null,
            },
        };
    }
};

export default StoreProductPage;