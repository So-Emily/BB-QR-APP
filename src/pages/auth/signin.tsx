// src/pages/auth/signin.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { signIn } from 'next-auth/react';

const SignInPage = () => {
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        const result = await signIn('credentials', {
            redirect: false,
            identifier: data.identifier,
            password: data.password,
        });

        if (result?.error) {
            setError(result.error);
        } else {
            if (role === 'supplier') {
                router.push('/supplier/dashboard');
            } else if (role === 'store-manager') {
                router.push('/store/dashboard');
            } else {
                setError('Invalid role');
            }
        }
    };

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-5xl font-bold mb-4 text-white">Booze Buddy</h1>
                <h2 className="text-xl font-bold mb-6 text-white">sign in as</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {!role && (
                    <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                        <button
                            onClick={() => setRole('store-manager')}
                            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Store Manager
                        </button>
                        <button
                            onClick={() => setRole('supplier')}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Supplier
                        </button>
                        <p className="text-white">or</p>
                        <button
                            onClick={() => router.push('/auth/signup')}
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Create an Account
                        </button>
                    </div>
                )}
                {role && (
                    <form onSubmit={handleSignIn} className="mt-6 space-y-4 w-full max-w-md">
                        <h2 className="text-2xl font-semibold text-white">
                            {role === 'supplier' ? 'Supplier' : 'Store Manager'} Login
                        </h2>
                        <input
                            type="text"
                            name="identifier"
                            placeholder="Username or Email"
                            required
                            className="w-full px-4 py-2 border rounded"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            className="w-full px-4 py-2 border rounded"
                        />
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole(null)}
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Back
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
};

export default SignInPage;