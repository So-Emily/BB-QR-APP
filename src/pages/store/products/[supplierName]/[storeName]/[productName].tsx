import { GetServerSideProps } from 'next';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import Navbar from '@/components/Navbar/Navbar';
import { useSession } from 'next-auth/react';
import Card from '@/components/Card/Card';
import ProductModel from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';

interface StoreProductPageProps {
    product: Product | null;
    supplierName: string;
    storeName: string;
    backsideInfo: { description: string; message: string };
}

const StoreProductPage = ({ product, supplierName, backsideInfo }: StoreProductPageProps) => {
    const { data: session } = useSession(); // Get session data to check if the user is logged in
    const [error, setError] = useState('');

    // Track scan count when the page loads
    useEffect(() => {
        const trackScan = async () => {
            if (!product || !product._id) {
                console.error('Product or Product ID is missing. Cannot track scan count.');
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
    }, [product]);

    // If the product is not found, display a message
    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-center">Product data is incomplete. Some features may not be available.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Show the Navbar only if the user is logged in */}
            {session && <Navbar />}
            <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
                {/* Display error message if tracking scan count fails */}
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

    let productData = null;
    let backsideInfo = { description: '', message: '' };

    try {
        await connectToDatabase();

        console.log("🔍 Fetching product from MongoDB with top-level storeId:", { productName, storeName });

        // ✅ Format product name correctly
        const formattedProductName = productName.replace(/-/g, " ");

        console.log("🛠 Querying MongoDB with:", { 
            name: formattedProductName, 
            storeId: storeName 
        });

        // ✅ Find the product using storeId as a top-level field
        const product = await ProductModel.findOne(
            { 
                name: { $regex: new RegExp(`^${formattedProductName}$`, "i") }
            }
        );

        if (product) {
            console.log(`✅ Found Product: ${product.name}`);
        } else {
            console.warn(`⚠️ Product not found in MongoDB for ${formattedProductName} at ${storeName}`);
        }

        // ✅ Fetch product data from S3
        productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);
        const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;

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
                mongoProduct: product || null, // Include MongoDB product if found
            },
        };
    } catch (err) {
        console.error('Failed to fetch product data:', err);
        return {
            props: {
                product: productData, // Return S3 data even if MongoDB fails
                storeName,
                supplierName,
                backsideInfo,
                mongoProduct: null,
            },
        };
    }
};

export default StoreProductPage;