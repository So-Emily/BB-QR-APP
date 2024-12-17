// src/pages/store/dashboard.tsx
import Navbar from '@/components/Navbar/Navbar';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import styles from './Dashboard.module.css';

const StoreDashboard = ({ username }: { username: string }) => {
    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    console.log('Rendering StoreDashboard with username:', username);

    return (
        <div>
            <Navbar />
            <main>
                <h1 className={styles.title}>Welcome, {capitalizeFirstLetter(username)}!</h1>
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    console.log('Fetching session and user data in getServerSideProps');

    const session = await getSession(context);

    if (!session) {
        console.log('No session found, redirecting to sign-in page');
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
        console.log('Fetched user data:', data);

        return {
            props: {
                username: data.name,
            },
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        return {
            props: {
                username: '',
            },
        };
    }
};

export default StoreDashboard;