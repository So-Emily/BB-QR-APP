import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3, uploadFileToS3 } from '@/lib/s3';
import { Product } from '@/types';
import { SketchPicker } from 'react-color';
import { useSession } from 'next-auth/react';

interface EditProductPageProps {
    product: Product;
}

const EditProductPage = ({ product }: EditProductPageProps) => {
    const [activeTab, setActiveTab] = useState('front');
    const [name] = useState(product.name);
    const [description, setDescription] = useState(product.description);
    const [pairing, setPairing] = useState(product.pairing);
    const [taste, setTaste] = useState(product.taste);
    const [location, setLocation] = useState(product.location);
    const [image, setImage] = useState<File | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [styles, setStyles] = useState(product.styles);
    const [backsideDescription, setBacksideDescription] = useState('');
    const [backsideMessage, setBacksideMessage] = useState('');
    const [error, setError] = useState('');
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
    const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        const fetchBacksideInfo = async () => {
            if (!session || !session.user || !session.user.name) {
                setError('User not authenticated');
                return;
            }

            const supplierName = session.user.name.replace(/\s+/g, '-').toLowerCase();
            const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;

            try {
                const fetchedBacksideInfo = await fetchProductDataFromS3(backsideInfoKey);
                setBacksideDescription(fetchedBacksideInfo.description);
                setBacksideMessage(fetchedBacksideInfo.message);
            } catch (err) {
                console.error('Failed to fetch backside info:', err);
            }
        };

        if (session) {
            fetchBacksideInfo();
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const supplierName = router.query.supplierName as string;
        const formattedSupplierName = supplierName.replace(/\s+/g, '-').toLowerCase();
        const formattedProductName = name.replace(/\s+/g, '-').toLowerCase();
        const productKey = `suppliers/${formattedSupplierName}/products/${formattedProductName}`;

        try {
            let imageUrl = product.imageUrl;
            if (image) {
                const imageBuffer = await image.arrayBuffer();
                const imageUpload = await uploadFileToS3(`${productKey}/${image.name}`, Buffer.from(imageBuffer), image.type);
                imageUrl = imageUpload.Location || '';
            }

            let backgroundUrl = product.backgroundUrl;
            if (background) {
                const backgroundBuffer = await background.arrayBuffer();
                const backgroundUpload = await uploadFileToS3(`${productKey}/backgrounds/${background.name}`, Buffer.from(backgroundBuffer), background.type);
                backgroundUrl = backgroundUpload.Location || '';
            }

            const updatedProductInfo = {
                name,
                description,
                pairing: pairing.filter(pair => pair !== ''),
                taste: taste.filter(t => t !== ''),
                location,
                imageUrl,
                backgroundUrl,
                styles,
            };

            await uploadFileToS3(`${productKey}/product.json`, JSON.stringify(updatedProductInfo), 'application/json');

            // Save backside info to a separate JSON file
            const backsideInfo = {
                description: backsideDescription,
                message: backsideMessage,
            };
            const backsideInfoKey = `suppliers/${formattedSupplierName}/backsideInfo.json`;
            await uploadFileToS3(backsideInfoKey, JSON.stringify(backsideInfo), 'application/json');

            router.push('/supplier/view-products');
        } catch (err) {
            setError('Failed to update product: ' + err);
        }
    };

    const addPairing = () => {
        if (pairing.length < 3) {
            setPairing([...pairing, '']);
        }
    };

    const addTaste = () => {
        if (taste.length < 3) {
            setTaste([...taste, '']);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="mb-4">
                    <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'front' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setActiveTab('front')}
                    >
                        Front
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 ${activeTab === 'back' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                        onClick={() => setActiveTab('back')}
                    >
                        Back
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'front' && (
                        <>
                            {/* <label className="block">Item Name*</label>
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded text-black"
                            /> */}
                            <label className="block">Item Description*</label>
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded text-black"
                            />
                            <label className="block">Pairing</label>
                            <div className="space-y-2">
                                {pairing.map((pair, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        placeholder={`Pairing ${index + 1}`}
                                        value={pair}
                                        onChange={(e) => {
                                            const newPairing = [...pairing];
                                            newPairing[index] = e.target.value;
                                            setPairing(newPairing);
                                        }}
                                        className="w-full px-4 py-2 border rounded text-black"
                                    />
                                ))}
                                {pairing.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={addPairing}
                                        className="px-4 py-2 bg-gray-200 text-black rounded"
                                    >
                                        Add Pairing
                                    </button>
                                )}
                            </div>
                            <label className="block">Taste</label>
                            <div className="space-y-2">
                                {taste.map((t, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        placeholder={`Taste ${index + 1}`}
                                        value={t}
                                        onChange={(e) => {
                                            const newTaste = [...taste];
                                            newTaste[index] = e.target.value;
                                            setTaste(newTaste);
                                        }}
                                        className="w-full px-4 py-2 border rounded text-black"
                                    />
                                ))}
                                {taste.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={addTaste}
                                        className="px-4 py-2 bg-gray-200 text-black rounded"
                                    >
                                        Add Taste
                                    </button>
                                )}
                            </div>
                            <label className="block">Location</label>
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={location.city}
                                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={location.state}
                                    onChange={(e) => setLocation({ ...location, state: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                <input
                                    type="text"
                                    placeholder="Country"
                                    value={location.country}
                                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                            </div>
                            <div>
                                <label className="block">Item Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setImage(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                            </div>
                            <div>
                                <label className="block">Item Background</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setBackground(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                            </div>
                            <label className="block">Card Styles</label>
                            <div className="flex space-x-4">
                                <div>
                                    <button type="button" className="px-4 py-2 bg-gray-200 text-black rounded" onClick={() => setShowTextColorPicker(!showTextColorPicker)}>
                                        Text Color
                                    </button>
                                    {showTextColorPicker && (
                                        <SketchPicker
                                            color={styles.textColor}
                                            onChangeComplete={(color) => setStyles({ ...styles, textColor: color.hex })}
                                        />
                                    )}
                                </div>
                                <div>
                                    <button type="button" className="px-4 py-2 bg-gray-200 text-black rounded" onClick={() => setShowBodyColorPicker(!showBodyColorPicker)}>
                                        Body Color
                                    </button>
                                    {showBodyColorPicker && (
                                        <SketchPicker
                                            color={styles.bodyColor}
                                            onChangeComplete={(color) => setStyles({ ...styles, bodyColor: color.hex })}
                                        />
                                    )}
                                </div>
                                <div>
                                    <button type="button" className="px-4 py-2 bg-gray-200 text-black rounded" onClick={() => setShowBorderColorPicker(!showBorderColorPicker)}>
                                        Border Color
                                    </button>
                                    {showBorderColorPicker && (
                                        <SketchPicker
                                            color={styles.borderColor}
                                            onChangeComplete={(color) => setStyles({ ...styles, borderColor: color.hex })}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'back' && (
                        <>
                            <h2 className="text-xl font-bold mb-4">Backside of Card - Supplier Information</h2>
                            <label className="block">Description</label>
                            <textarea
                                placeholder="Supplier Description"
                                value={backsideDescription}
                                onChange={(e) => setBacksideDescription(e.target.value)}
                                className="w-full px-4 py-2 border rounded text-black"
                            />

                            <label className="block">Message</label>
                            <textarea
                                placeholder="Supplier Message"
                                value={backsideMessage}
                                onChange={(e) => setBacksideMessage(e.target.value)}
                                className="w-full px-4 py-2 border rounded text-black"
                            />
                        </>
                    )}
                    <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Update Product
                    </button>
                </form>
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { supplierName, productName } = context.params as { supplierName: string; productName: string };
    const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);

    return {
        props: {
            product: productData,
        },
    };
};

export default EditProductPage;