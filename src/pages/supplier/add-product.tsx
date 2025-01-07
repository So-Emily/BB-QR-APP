import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { uploadFileToS3, listFilesInS3 } from '@/lib/s3';
import Navbar from '@/components/Navbar/Navbar';
import { useSession } from 'next-auth/react';
import { SketchPicker } from 'react-color';

const AddProductPage = () => {
    const [activeTab, setActiveTab] = useState('front');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pairing, setPairing] = useState(['', '', '']);
    const [taste, setTaste] = useState(['', '', '']); // State for taste inputs
    const [location, setLocation] = useState({ city: '', state: '', country: '' });
    const [image, setImage] = useState<File | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [styles, setStyles] = useState({ textColor: '#000000', bodyColor: '#ffffff', borderColor: '#000000' });
    const [backsideInfo, setBacksideInfo] = useState({ additionalInfo: '' });
    const [error, setError] = useState('');
    const [imageName, setImageName] = useState(''); // State variable for image name
    const [backgroundName, setBackgroundName] = useState(''); // State variable for background name
    const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
    // Color Settings
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBodyColorPicker, setShowBodyColorPicker] = useState(false);
    const [showBorderColorPicker, setShowBorderColorPicker] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        console.log('AddProductPage mounted');
    }, []);

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

        // Check if a product with the same name already exists
        try {
            const existingProductKeys = await listFilesInS3(`suppliers/${formattedSupplierName}/products/`);
            const existingProductNames = existingProductKeys
                .filter((key): key is string => key !== undefined)
                .map((key: string | undefined) => key?.split('/').pop()?.replace('.json', ''))
                .filter((key): key is string => key !== undefined)
                .map(normalizeName);
            if (existingProductNames.includes(formattedProductName)) {
                setError('A product with this name already exists. Please choose a different name.');
                return;
            }
        } catch (err) {
            setError('Failed to check existing products: ' + err);
            return;
        }

        console.log('productKey:', productKey);
        console.log('image.name:', image.name);

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
                pairing: pairing.filter(pair => pair !== ''), // Filter out empty pairings
                taste: taste.filter(t => t !== ''), // Filter out empty taste inputs
                location,
                imageUrl: imageUpload.Location,
                backgroundUrl,
                styles,
            };

            await uploadFileToS3(`${productKey}/product.json`, JSON.stringify(productInfo), 'application/json');

            // Save backside info to a separate JSON file
            if (backsideInfo.additionalInfo.trim()) {
                const backsideInfoKey = `suppliers/${formattedSupplierName}/backsideInfo.json`;
                await uploadFileToS3(backsideInfoKey, JSON.stringify(backsideInfo), 'application/json');
            }

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
        setPairing(['', '', '']);
        setTaste(['', '', '']);
        setLocation({ city: '', state: '', country: '' });
        setImage(null);
        setBackground(null);
        setStyles({ textColor: '#000000', bodyColor: '#ffffff', borderColor: '#000000' });
        setBacksideInfo({ additionalInfo: '' });
        setError('');
        setImageName('');
        setBackgroundName('');
        setShowSuccessModal(false);
    };

    const handleGoToDashboard = () => {
        router.push('/supplier/dashboard');
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
                        Add Product
                    </button>
                </form>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white text-black p-6 rounded shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Product Added Successfully!</h2>
                        <p className="mb-4">Would you like to add another product or go to your dashboard?</p>
                        <div className="flex space-x-4">
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleAddAnotherProduct}
                            >
                                Add Another Product
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