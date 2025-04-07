import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3, uploadFileToS3 } from '@/lib/s3';
import { Product } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import QRCodeSVG from 'qrcode-svg';
import styles from '@/styles/send-qr.module.css';

const SendQRCodesPage = () => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<{ storeName: string; storeNumber: string; name: string }[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [selectedStores, setSelectedStores] = useState<{ storeName: string; storeNumber: string; name: string }[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            return;
        }
    
        const fetchProductsAndStores = async () => {
            try {
                const supplierName = session.user.name?.replace(/\s+/g, '-').toLowerCase() ?? '';
    
                // ✅ Fetch products from MongoDB first
                const mongoResponse = await fetch('/api/products/get'); // Fetch from MongoDB
                const mongoProducts = await mongoResponse.json();
    
                if (!mongoResponse.ok) {
                    throw new Error('Failed to fetch products from MongoDB');
                }
    
                console.log("🚀 MongoDB Products:", mongoProducts);
    
                // ✅ Fetch product details from S3
                const productKeys = await listFilesInS3(`suppliers/${supplierName}/products/`);
                const jsonKeys = productKeys.filter((key): key is string => key !== undefined && key.endsWith('product.json'));
    
                const productPromises = jsonKeys.map(async (key: string) => {
                    try {
                        const productData = await fetchProductDataFromS3(key);
    
                        // ✅ Find the corresponding MongoDB product by name
                        const mongoProduct = mongoProducts.find((p: Product) => p.name === productData.name);

                        if (mongoProduct) {
                            return { ...productData, _id: mongoProduct._id, status: mongoProduct.status, scanCount: mongoProduct.scanCount };
                        } else {
                            return productData; // No MongoDB entry found
                        }
                    } catch (err) {
                        console.error(`Failed to fetch product data for key ${key}:`, err);
                        return null;
                    }
                });
    
                const products = (await Promise.all(productPromises)).filter(product => product !== null);
    
                console.log("✅ Final Merged Products:", products);
                setProducts(products);
    
                // ✅ Fetch store managers
                const storeResponse = await fetch('/api/store-managers');
                if (!storeResponse.ok) {
                    throw new Error('Failed to fetch store managers');
                }
                const storeData = await storeResponse.json();
                setStores(storeData.map((store: { name: string; storeDetails: { storeName: string; storeNumber: string } }) => ({
                    ...store.storeDetails,
                    name: store.name
                })));
            } catch (err) {
                setError('Failed to fetch products or stores: ' + err);
            }
        };
    
        fetchProductsAndStores();
    }, [session]);
    

    const handleProductSelection = (productId: string) => {
        setSelectedProducts(prevSelected =>
            prevSelected.includes(productId)
                ? prevSelected.filter(id => id !== productId)
                : [...prevSelected, productId]
        );
    };

    const handleStoreSelection = (store: { storeName: string; storeNumber: string; name: string }) => {
        setSelectedStores(prevSelected =>
            prevSelected.includes(store)
                ? prevSelected.filter(s => s !== store)
                : [...prevSelected, store]
        );
    };

    const handleSubmit = async () => {
        try {
            const supplierName = session?.user.name?.replace(/\s+/g, '-').toLowerCase() ?? '';
            const selectedProductData = products.filter(product => selectedProducts.includes(product.name));
    
            for (const product of selectedProductData) {
                for (const store of selectedStores) {
                    const storeIdentifier = `${store.storeName.replace(/\s+/g, '-').toLowerCase()}-${store.storeNumber}`;
    
                    console.log("🚀 Assigning Product:", product);
                    console.log("Product ID:", product._id);
                    console.log("Store ID:", storeIdentifier);
    
                    if (!product._id) {
                        console.error("❌ Error: Product ID is missing", product);
                        continue; // Skip this product if `_id` is missing
                    }
    
                    // ✅ First, update MongoDB with storeId
                    const assignResult = await assignProductToStore(product._id, storeIdentifier);
                    if (assignResult === false) {
                        console.error(`Failed to assign product ${product.name} to store ${storeIdentifier}`);
                        continue; // Skip QR generation if assignment fails
                    }
    
                    // ✅ Then, generate the QR code
                    console.log("🚀 Generating QR Code for Product:", product.name);
                    console.log("Supplier Name:", supplierName);
                    console.log("Store Identifier:", storeIdentifier);
                    
                    if (!supplierName) console.error("❌ ERROR: supplierName is undefined!");
                    if (!storeIdentifier) console.error("❌ ERROR: storeIdentifier is undefined!");
                    
                    const qrCodeURL = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${supplierName}/${storeIdentifier}/${product.name.replace(/\s+/g, '-').toLowerCase()}`;
                    
                    try {
                        const qr = new QRCodeSVG({
                            content: qrCodeURL,
                            padding: 4,
                            // Get a full aspect ratiom QR code
                            width: 256,
                            height: 256,
                            color: "#000000",
                            background: "#ffffff",
                            ecl: "H"
                        });
                        const qrCodeSVG = qr.svg();
                        const qrCodeBuffer = Buffer.from(qrCodeSVG, 'utf-8'); // Convert SVG string to buffer
                    
                        const productFolder = `suppliers/${supplierName}/stores/${storeIdentifier}/${product.name.replace(/\s+/g, '-').toLowerCase()}`;
                        const qrCodeKey = `${productFolder}/${product.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
                        const productInfoKey = `${productFolder}/info.json`;
                    
                        const productInfo = {
                            productName: product.name.replace(/\s+/g, '-').toLowerCase(),
                            supplierName,
                            storeUsername: store.name.replace(/\s+/g, '-').toLowerCase(),
                            storeName: store.storeName.replace(/\s+/g, '-').toLowerCase(),
                            storeNumber: store.storeNumber.replace(/\s+/g, '-').toLowerCase(),
                        };
                    
                        await uploadFileToS3(qrCodeKey, qrCodeBuffer, 'image/svg+xml');
                        await uploadFileToS3(productInfoKey, JSON.stringify(productInfo), 'application/json');
                    } catch (qrError) {
                        console.error('Error generating or uploading QR Code:', qrError);
                    }
                }
            }
    
            alert('QR codes sent and products assigned successfully!');
        } catch (err) {
            setError('Failed to send QR codes: ' + err);
        }
    };

    // Function to assign a product to a store in MongoDB
    const assignProductToStore = async (productId: string, storeId: string) => {
        try {
            console.log("🚀 Assigning product:", productId, "to store:", storeId); // Debugging output

            const response = await fetch('/api/products/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, storeId }),
            });

            const data = await response.json();
            console.log("✅ Assign API Response:", data); // Log API response

            if (!response.ok) {
                if (data.error === 'Product not found or already assigned') {
                    return 'already-assigned';
                }
                throw new Error(data.error || 'Failed to assign product');
            }

            return true;
        } catch (error) {
            console.error('❌ Error assigning product:', error);
            if (error instanceof Error) {
                alert(`Error: ${error.message}`);
            } else {
                alert('An unknown error occurred');
            }
            return false;
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4" style={{ marginLeft: 15, paddingLeft: 0 }}>
                <h1 className="text-2xl font-bold mb-4">Send QR Codes</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${styles.scrollableSection}`}>
                        <h2 className="text-xl font-bold mb-2">Select Products</h2>
                        {products.map((product, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id={`product-${index}`}
                                    checked={selectedProducts.includes(product.name)}
                                    onChange={() => handleProductSelection(product.name)}
                                    className="mr-2"
                                />
                                <label htmlFor={`product-${index}`}>{product.name}</label>
                            </div>
                        ))}
                    </div>
                    <div className={`${styles.scrollableSection}`}>
                        <h2 className="text-xl font-bold mb-2">Select Stores</h2>
                        {stores.map((store, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id={`store-${index}`}
                                    checked={selectedStores.includes(store)}
                                    onChange={() => handleStoreSelection(store)}
                                    className="mr-2"
                                />
                                <label htmlFor={`store-${index}`}>{`${store.storeName}-${store.storeNumber}`}</label>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Preview</h2>
                        {selectedProducts.map((productId, index) => {
                            const product = products.find(p => p.name === productId);
                            if (!product) return null;
                            return (
                                <div key={index} className="border rounded shadow p-4 flex flex-col items-center mb-4">
                                    <h2 className="text-xl font-bold mt-4 text-center">{product.name}</h2>
                                    {selectedStores.map((store, storeIndex) => (
                                        <div key={storeIndex} className="mb-4">
                                            <h3 className="text-lg font-semibold">{`${store.storeName}`}</h3>
                                            <QRCodeCanvas
                                                value={`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/store/products/${session?.user.name?.replace(/\s+/g, '-').toLowerCase()}/${store.storeName.replace(/\s+/g, '-').toLowerCase()}-${store.storeNumber}/${product.name.replace(/\s+/g, '-').toLowerCase()}`}
                                                size={128}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    className="fixed bottom-4 left-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Send QR Codes
                </button>
            </div>
        </div>
    );
};

export default SendQRCodesPage;