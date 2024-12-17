// src/pages/auth/signup.tsx
import Navbar from '@/components/Navbar/Navbar';
import { useState } from 'react';
import { useRouter } from 'next/router';

const SignUpPage = () => {
    const [role, setRole] = useState('supplier');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            router.push(result.redirectUrl);
        } else {
            setError(result.message);
        }
    };

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <h1 className="text-3xl font-bold mb-6 text-white">Create Account</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 w-full max-w-md">
                    <input
                        name="name"
                        type="text"
                        placeholder="Name"
                        required
                        className="w-full px-4 py-2 border rounded"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full px-4 py-2 border rounded"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        className="w-full px-4 py-2 border rounded"
                    />
                    <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="role"
                                value="supplier"
                                checked={role === 'supplier'}
                                onChange={() => setRole('supplier')}
                                className="form-radio"
                            />
                            <span>Supplier</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="role"
                                value="store-manager"
                                checked={role === 'store-manager'}
                                onChange={() => setRole('store-manager')}
                                className="form-radio"
                            />
                            <span>Store Manager</span>
                        </label>
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
                            onClick={() => router.push('/auth/signin')}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Back
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default SignUpPage;