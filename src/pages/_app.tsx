// src/pages/_app.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            if (session.user.role === 'supplier' && !['/supplier/dashboard', '/supplier/add-product', '/supplier/view-products'].includes(router.pathname)) {
                router.push('/supplier/dashboard');
            } else if (session.user.role === 'store-manager' && router.pathname !== '/store/dashboard') {
                router.push('/store/dashboard');
            }
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    return children;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <SessionProvider session={session}>
            <AuthWrapper>
                <Component {...pageProps} />
            </AuthWrapper>
        </SessionProvider>
    );
}

export default MyApp;