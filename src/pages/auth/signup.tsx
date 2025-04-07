// src/pages/auth/signup.tsx
import Navbar from '@/components/Navbar/Navbar';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface Location {
    city: string;
    state: string;
    country: string;
    zip: string;
    street: string;
}

interface StoreDetails {
    storeName: string;
    storeNumber: string;
}

interface FormData {
    name: string;
    email: string;
    password: string;
    [key: string]: string; // To handle additional fields dynamically
}

const SignUpPage = () => {
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [location, setLocation] = useState<Location>({ city: '', state: '', country: '', zip: '', street: '' });
    const [storeDetails, setStoreDetails] = useState<StoreDetails>({ storeName: '', storeNumber: '' });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        const requestBody = role === 'store-manager' ? { ...formData, role, location, storeDetails } : { ...formData, role };

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok) {
            router.push('/auth/signin');
        } else {
            setError(result.message);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setFormData(Object.fromEntries(formData.entries()) as FormData);
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        setShowConfirmation(false);
        handleSubmit();
    };

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-customGray-500 text-white">
                <div className="bg-customGray-700 p-10 rounded-lg shadow-lg w-full max-w-md">
                    <h1 className="text-4xl font-bold mb-4 text-white text-center">Create Your Account</h1>
                    {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                    {!role && (
                        <div className="flex flex-col items-center space-y-4">
                            <h2 className="text-xl font-bold mb-2 text-white">Are you a</h2>
                            <button
                                onClick={() => setRole('supplier')}
                                className="w-2/3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Supplier
                            </button>
                            <p className="text-white">or</p>
                            <button
                                onClick={() => setRole('store-manager')}
                                className="w-2/3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Store Manager
                            </button>
                            <p className="text-white">otherwise</p>
                            <button
                                onClick={() => router.push('/auth/signin')}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                    {role && (
                        <form
                            onSubmit={handleFormSubmit}
                            className={`mt-6 space-y-4 ${role === 'supplier' ? 'flex flex-col items-center' : ''}`}
                        >
                            <div
                                className={`grid ${
                                    role === 'store-manager' ? 'grid-cols-1 md:grid-cols-2 gap-4' : ''
                                }`}
                            >
                                <div>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="Name"
                                        required
                                        className="w-full px-4 py-2 border rounded text-black"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email"
                                        required
                                        className="w-full px-4 py-2 border rounded text-black"
                                    />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        required
                                        className="w-full px-4 py-2 border rounded text-black"
                                    />
                                </div>
                                {role === 'store-manager' && (
                                    <div>
                                        <input
                                            name="storeName"
                                            type="text"
                                            placeholder="Store Name"
                                            value={storeDetails.storeName}
                                            onChange={(e) =>
                                                setStoreDetails({ ...storeDetails, storeName: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                        <input
                                            name="storeNumber"
                                            type="text"
                                            placeholder="Store Number"
                                            value={storeDetails.storeNumber}
                                            onChange={(e) =>
                                                setStoreDetails({ ...storeDetails, storeNumber: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                        <input
                                            name="state"
                                            type="text"
                                            placeholder="State"
                                            value={location.state}
                                            onChange={(e) =>
                                                setLocation({ ...location, state: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                        <input
                                            name="city"
                                            type="text"
                                            placeholder="City"
                                            value={location.city}
                                            onChange={(e) =>
                                                setLocation({ ...location, city: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                        <input
                                            name="zip"
                                            type="text"
                                            placeholder="Zip Code"
                                            value={location.zip}
                                            onChange={(e) =>
                                                setLocation({ ...location, zip: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                        <input
                                            name="street"
                                            type="text"
                                            placeholder="Street Address"
                                            value={location.street}
                                            onChange={(e) =>
                                                setLocation({ ...location, street: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border rounded text-black"
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Sign Up
                            </button>
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setRole(null)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                    )}
                    {showConfirmation && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white text-black p-6 rounded shadow-lg">
                                <h2 className="text-xl font-bold mb-4">Confirm Your Information</h2>
                                <p><strong>Name:</strong> {formData?.name}</p>
                                <p><strong>Email:</strong> {formData?.email}</p>
                                {role === 'store-manager' && (
                                    <>
                                        <p><strong>Store Name:</strong> {storeDetails.storeName}</p>
                                        <p><strong>Store Number:</strong> {storeDetails.storeNumber}</p>
                                        <p><strong>State:</strong> {location.state}</p>
                                        <p><strong>City:</strong> {location.city}</p>
                                        <p><strong>Zip Code:</strong> {location.zip}</p>
                                        <p><strong>Street Address:</strong> {location.street}</p>
                                    </>
                                )}
                                <div className="flex justify-end space-x-4 mt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        onClick={() => setShowConfirmation(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        onClick={handleConfirm}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SignUpPage;