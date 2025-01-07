import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { Product } from '@/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProductPageProps {
    product: Product & { id?: string }; // Add optional `id` field for MongoDB
}

const ProductPage = ({ product }: ProductPageProps) => {
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

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="relative w-full h-48">
                    {product.backgroundUrl && (
                        <Image
                            src={product.backgroundUrl}
                            alt="Background"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                    />
                </div>
                <h1 className="text-2xl font-bold mt-4 text-center">{product.name}</h1>
                <p className="mt-2 text-center">{product.description}</p>
                {product.pairing.length > 0 && (
                    <div className="mt-2 text-center">
                        <h3 className="font-bold">Pairing:</h3>
                        <ul>
                            {product.pairing.map((pair, index) => (
                                <li key={index}>{pair}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-2 text-center">
                    <h3 className="font-bold">Origin:</h3>
                    <p>
                        {product.location.city}
                        {product.location.state && `, ${product.location.state}`}
                        {product.location.country && `, ${product.location.country}`}
                    </p>
                </div>
                {product.taste && product.taste.length > 0 && (
                    <div className="mt-2 text-center">
                        <h3 className="font-bold">Taste:</h3>
                        <ul>
                            {product.taste.map((t, index) => (
                                <li key={index}>{t}</li>
                            ))}
                        </ul>
                    </div>
                )}
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

        return {
            props: {
                product: productData,
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
