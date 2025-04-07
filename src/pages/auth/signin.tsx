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
            router.push('/dashboard'); // Redirect to a generic dashboard or adjust as needed
        }
    };

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-4xl font-bold mb-6 text-white">Sign Into Your Booze Buddy</h1>
                                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSignIn} className="space-y-4 w-full max-w-md">
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
            </main>
        </div>
    );
};

export default SignInPage;