import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { signIn } from 'next-auth/react';

const SignInPage = () => {
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
            // Fetch the session to get the user's role
            const sessionResponse = await fetch('/api/auth/session');
            const session = await sessionResponse.json();

            if (session?.user?.role === 'supplier') {
                router.push('/supplier/dashboard'); // Redirect to supplier dashboard
            } else if (session?.user?.role === 'store-manager') {
                router.push('/store/dashboard'); // Redirect to store manager dashboard
            } else {
                setError('Invalid user role'); // Handle unexpected roles
            }
        }
    };

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-customGray-500 text-white">
                <div className="bg-customGray-700 p-10 rounded-lg shadow-lg w-full max-w-md">
                    <h1 className="text-4xl font-bold mb-5 text-white text-center">Booze Buddy</h1>
                    <h1 className="text-2xl font-bold mb-6 text-white text-center">Sign in</h1>
                    {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <input
                            type="text"
                            name="identifier"
                            placeholder="Username or Email"
                            required
                            className="w-full px-4 py-2 border rounded text-black text-center"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                            className="w-full px-4 py-2 border rounded text-black text-center"
                        />
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="w-2/3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Login
                            </button>
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => router.push('/auth/signup')}
                                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Create an Account
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default SignInPage;