import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3, uploadFileToS3 } from '@/lib/s3';
import { Product } from '@/types';

interface EditProductPageProps {
    product: Product;
}

const EditProductPage = ({ product }: EditProductPageProps) => {
    const [activeTab, setActiveTab] = useState('front');
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(product.description);
    const [pairing, setPairing] = useState(product.pairing);
    const [taste, setTaste] = useState(product.taste);
    const [location, setLocation] = useState(product.location);
    const [image, setImage] = useState<File | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [styles, setStyles] = useState(product.styles);
    const [backsideInfo, setBacksideInfo] = useState(product.backsideInfo);
    const [error, setError] = useState('');
    const router = useRouter();

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
                backsideInfo,
            };

            await uploadFileToS3(`${productKey}/product.json`, JSON.stringify(updatedProductInfo), 'application/json');

            router.push('/supplier/view-products');
        } catch (err) {
            setError('Failed to update product: ' + err);
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
                            <label className="block">Item Name*</label>
                            <input
                                type="text"
                                placeholder="Item Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded text-black"
                            />
                            <label className="block">Item Description*</label>
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded text-black"
                            />
                            <label className="block">Pairing</label>
                            <div className="flex space-x-4">
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
                            </div>
                            <label className="block">Taste</label>
                            <div className="flex space-x-4">
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
                                <input
                                    type="text"
                                    placeholder="Text Color"
                                    value={styles.textColor}
                                    onChange={(e) => setStyles({ ...styles, textColor: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                <input
                                    type="text"
                                    placeholder="Body Color"
                                    value={styles.bodyColor}
                                    onChange={(e) => setStyles({ ...styles, bodyColor: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                <input
                                    type="text"
                                    placeholder="Border Color"
                                    value={styles.borderColor}
                                    onChange={(e) => setStyles({ ...styles, borderColor: e.target.value })}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                            </div>
                        </>
                    )}
                    {activeTab === 'back' && (
                        <>
                            <label className="block">Backside Supplier Description</label>
                            <textarea
                                placeholder="Supplier Description"
                                value={backsideInfo.additionalInfo}
                                onChange={(e) => setBacksideInfo({ ...backsideInfo, additionalInfo: e.target.value })}
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