// import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';

const HomePage = () => {
    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-screen bg-green-900 text-white">

                <h1 className="text-4xl font-bold mb-20">Welcome to the QR Code <br/><br/> Buddy Booze Application</h1>

                {/* Login Title and Button */}
                {/* <p className="text-lg mb-6 mt-20">Please sign in to continue</p>
                <Link href="/auth/signin" passHref>
                    <button className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Go to Login Page
                    </button>
                </Link> */}
                
            </main>
        </div>
    );
};

export default HomePage;