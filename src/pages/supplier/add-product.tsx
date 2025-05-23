import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { uploadFileToS3 } from '@/lib/s3';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { useSession } from 'next-auth/react';
import { SketchPicker } from 'react-color';

const AddProductPage = () => {
    const [activeTab, setActiveTab] = useState('front');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pairing, setPairing] = useState<string[]>([]);
    const [taste, setTaste] = useState<string[]>([]);
    const [location, setLocation] = useState({ city: '', state: '', country: '' });
    const [image, setImage] = useState<File | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [styles, setStyles] = useState({ textColor: '#000000', bodyColor: '#ffffff', borderColor: '#000000' });
    const [backsideDescription, setBacksideDescription] = useState('');
    const [backsideMessage, setBacksideMessage] = useState('');
    const [error, setError] = useState('');
    const [imageName, setImageName] = useState('');
    const [backgroundName, setBackgroundName] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // Color Wheel
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
    const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        console.log('AddProductPage mounted');
    }, []);

    // Normalize the name for the S3 key
    const normalizeName = (name: string) => {
        return name.replace(/\s+/g, '-').toLowerCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!image) {
            setError('Please upload an image');
            return;
        }

        if (!session || !session.user || !session.user.name) {
            setError('User not authenticated');
            return;
        }

        const supplierName = session.user.name; // Use the logged-in user's name
        const formattedSupplierName = normalizeName(supplierName);
        const formattedProductName = normalizeName(name);
        const productKey = `suppliers/${formattedSupplierName}/products/${formattedProductName}`;

        try {
            const imageBuffer = await image.arrayBuffer();
            const imageUpload = await uploadFileToS3(`${productKey}/${image.name}`, Buffer.from(imageBuffer), image.type);

            let backgroundUrl = '';
            if (background) {
                const backgroundBuffer = await background.arrayBuffer();
                const backgroundUpload = await uploadFileToS3(`${productKey}/backgrounds/${background.name}`, Buffer.from(backgroundBuffer), background.type);
                backgroundUrl = backgroundUpload.Location || '';
            }

            const productInfo = {
                name,
                description,
                pairing: pairing.filter(pair => pair !== ''),
                taste: taste.filter(t => t !== ''),
                location,
                imageUrl: imageUpload.Location,
                backgroundUrl,
                styles,
                userId: session.user.id, // Store supplier ID
                status: 'pending',
            };

            // Upload product data to S3
            await uploadFileToS3(
                `${productKey}/product.json`, 
                JSON.stringify(productInfo), 
                'application/json'
            );

            // ✅ Add MongoDB request 
            fetch('/api/products/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productInfo),
            }).catch(error => console.error('Failed to save product in MongoDB:', error));

            // Save backside info to a separate JSON file
            const backsideInfoKey = `suppliers/${formattedSupplierName}/backsideInfo.json`;
            let existingBacksideInfo = {};
            try {
                existingBacksideInfo = await fetchProductDataFromS3(backsideInfoKey);
            } catch (err) {
                console.error('Failed to fetch existing backside info:', err);
            }

            // Update backside info only if fields are not empty
            const updatedBacksideInfo = {
                ...existingBacksideInfo,
                ...(backsideDescription && { description: backsideDescription }),
                ...(backsideMessage && { message: backsideMessage }),
            };

            await uploadFileToS3(backsideInfoKey, JSON.stringify(updatedBacksideInfo), 'application/json');

            // Show success modal
            setShowSuccessModal(true);
        } catch (err) {
            setError('Failed to upload product: ' + err);
        }
    };

    const handleAddAnotherProduct = () => {
        // Reset form fields
        setName('');
        setDescription('');
        setPairing([]);
        setTaste([]);
        setLocation({ city: '', state: '', country: '' });
        setImage(null);
        setBackground(null);
        setStyles({ textColor: '#000000', bodyColor: '#ffffff', borderColor: '#000000' });
        setBacksideDescription('');
        setBacksideMessage('');
        setError('');
        setImageName('');
        setBackgroundName('');
        setShowSuccessModal(false);
    };

    const handleGoToDashboard = () => {
        router.push('/supplier/dashboard');
    };

    const handleGoToProducts = () => {
        router.push('/supplier/view-products');
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
                <h1 className="text-2xl font-bold mb-4">Add Product and Create a Card</h1>
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
                                <label className="block">Item Image*</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setImage(e.target.files[0]);
                                            setImageName(e.target.files[0].name); // Set the image name
                                        }
                                    }}
                                    required
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                {imageName && <p className="text-sm text-gray-600 mt-2">Selected file: {imageName}</p>}
                            </div>
                            <div>
                                <label className="block">Item Background</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setBackground(e.target.files[0]);
                                            setBackgroundName(e.target.files[0].name); // Set the background name
                                        }
                                    }}
                                    className="w-full px-4 py-2 border rounded text-black"
                                />
                                {backgroundName && <p className="text-sm text-gray-600 mt-2">Selected file: {backgroundName}</p>}
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
                        Add Product
                    </button>
                </form>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white text-black p-6 rounded shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Product Added Successfully!</h2>
                        <p className="mb-4">Would you like to add another product or go somewhere else?</p>
                        <div className="flex space-x-4">
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleAddAnotherProduct}
                            >
                                Add Another Product
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={handleGoToProducts}
                            >
                                Go to Products
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={handleGoToDashboard}
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddProductPage;