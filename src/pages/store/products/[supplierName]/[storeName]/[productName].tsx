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
    product: Product;
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
    // If the product is not found, display a message
    if (!product) {
        return <div>Product not found</div>;
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
        
        // ✅ Extract storeId from the stores array
        const storeDetails = product?.stores.find((store: { storeId: string; }) => store.storeId === storeName);
        const storeId = storeDetails ? storeDetails.storeId : null;
        
        if (!storeId) {
            console.error(`❌ Store '${storeName}' not found for product '${productName}'`);
            return { props: { product: null, error: "Store not found" } };
        }
        
        console.log(`✅ Found Product: ${product.name} with Store ID: ${storeId}`);
        

        console.log("📋 Product from DB:", product);

        if (!product) {
            console.error(`❌ Product not found in DB for ${formattedProductName} at ${storeName}`);
            return { props: { product: null, error: "Product not found" } };
        }

        console.log(`✅ Found Product: ${product.name} with Store ID: ${product.storeId}`);

        // 🔹 NEW: Send scan request to increment scan count
        console.log("📤 Sending scan request with:", { 
            supplierName, 
            productName: formattedProductName, 
            storeId: storeId 

        });

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/increment-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                supplierName, 
                productName: formattedProductName, 
                storeId: storeId 
 
            }),
        });

        // ✅ Fetch product data from S3
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
                storeId: storeId,
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
