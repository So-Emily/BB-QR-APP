import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { uploadFileToS3 } from '@/lib/s3';
import Navbar from '@/components/Navbar/Navbar';
import { useSession } from 'next-auth/react';

const AddProductPage = () => {
    const [activeTab, setActiveTab] = useState('front');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [pairing, setPairing] = useState(['', '', '']);
    const [taste, setTaste] = useState(['', '', '']); // State for taste inputs
    const [location, setLocation] = useState({ city: '', state: '', country: '' });
    const [image, setImage] = useState<File | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [styles, setStyles] = useState({ textColor: '', bodyColor: '', borderColor: '' });
    const [backsideInfo, setBacksideInfo] = useState({ additionalInfo: '' });
    const [error, setError] = useState('');
    const [imageName, setImageName] = useState(''); // State variable for image name
    const [backgroundName, setBackgroundName] = useState(''); // State variable for background name
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        console.log('AddProductPage mounted');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // Validate required fields
        if (!name || !description) {
            setError('Name and description are required');
            return;
        }
    
        if (!image) {
            setError('Please upload an image');
            return;
        }
    
        if (!session || !session.user || !session.user.name || !session.user.id) {
            setError('User not authenticated');
            return;
        }
    
        const supplierName = session.user.name;
        const formattedSupplierName = supplierName.replace(/\s+/g, '-').toLowerCase();
        const formattedProductName = name.replace(/\s+/g, '-').toLowerCase();
        const productKey = `suppliers/${formattedSupplierName}/products/${formattedProductName}`;
    
        try {
            console.log('Starting S3 Uploads...');
            // Upload image to S3
            const imageBuffer = await image.arrayBuffer();
            const imageUpload = await uploadFileToS3(`${productKey}/${image.name}`, Buffer.from(imageBuffer), image.type);
    
            let backgroundUrl = '';
            if (background) {
                const backgroundBuffer = await background.arrayBuffer();
                const backgroundUpload = await uploadFileToS3(`${productKey}/backgrounds/${background.name}`, Buffer.from(backgroundBuffer), background.type);
                backgroundUrl = backgroundUpload.Location || '';
            }
    
            console.log('S3 Uploads Completed.');
    
            // Prepare product information for JSON upload to S3
            const productInfo = {
                name,
                description,
                pairing: pairing.filter(pair => pair !== ''),
                taste: taste.filter(t => t !== ''),
                location,
                imageUrl: imageUpload.Location,
                backgroundUrl,
                styles,
                backsideInfo,
            };
    
            console.log('Uploading JSON to S3...');
            await uploadFileToS3(`${productKey}/product.json`, JSON.stringify(productInfo), 'application/json');
            console.log('JSON Uploaded to S3.');
    
            console.log('Saving Product to MongoDB...');
            // Save product to MongoDB
            const dbProductInfo = {
                userId: session.user.id,
                name,
            };
    
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbProductInfo),
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('MongoDB API Error:', errorText);
                throw new Error('Failed to save product to database');
            }
    
            const result = await response.json();
            console.log('Product saved to MongoDB:', result);
    
            router.push('/supplier/dashboard');
        } catch (err) {
            console.error('Failed to add product:', err);
            setError('Failed to add product. Please try again.');
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
                        Add Product
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProductPage;