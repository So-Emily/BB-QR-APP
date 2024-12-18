// src/pages/supplier/dashboard.tsx
import Navbar from '@/components/Navbar/Navbar';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import styles from './Dashboard.module.css';

// import Link from 'next/link';

const SupplierDashboard = ({ username }: { username: string }) => {
    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <div>
            <Navbar />
            <main>
                <h1 className={styles.title}>Welcome, {capitalizeFirstLetter(username)}!</h1>

                {/* Centered Add Product Button */}
                {/* <div className="flex justify-center mt-5">
                    <Link href="/supplier/add-product">
                        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Add Product
                        </button>
                    </Link>
                </div> */}
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);

    if (!session) {
        return {
            redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        };
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
            headers: {
                cookie: context.req.headers.cookie || '',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        return {
            props: {
                username: data.name,
            },
        };
    } catch (error) {
        return {
            props: {
                username: '' + error,
            },
        };
    }
};

export default SupplierDashboard;