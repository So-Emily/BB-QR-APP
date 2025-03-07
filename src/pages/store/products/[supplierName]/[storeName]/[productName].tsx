import { GetServerSideProps } from 'next';
import { fetchProductDataFromS3 } from '@/lib/s3';
import Navbar from '@/components/Navbar/Navbar';
import Card from '@/components/Card/Card';
import styles from '@/components/Card/Card.module.css';
import { useEffect, useState } from 'react';
import { Product } from '@/types';
import ProductModel from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';


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
        if (!product || !product._id) {  // ✅ Make sure product exists before accessing _id
            console.warn('⚠️ Product ID is missing or product is undefined. Skipping scan tracking.');
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

            console.log(`✅ Scan tracked for product: ${product._id}`);
        } catch (err) {
            console.error('❌ Error tracking scan count:', err);
            setError('Failed to track scan count.');
        }
    };

    if (product && product._id) {  // ✅ Prevents errors by only running when product is ready
        trackScan();
    }
}, [product]);  // ✅ Changed dependency from `product._id` to `product` to ensure it's ready


    if (!product) {
        return <div>Product not found</div>;
    }

    const formattedSupplierName = supplierName.replace(/\b\w/g, char => char.toUpperCase());

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
            <h1 className="text-2xl font-bold">{formattedSupplierName}</h1>
            
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