// src/pages/_app.tsx
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../styles/globals.css';

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            const supplierPaths = [
                '/supplier/dashboard',
                '/supplier/add-product',
                '/supplier/view-products',
                '/supplier/send-qr-codes',

                // Other Pages
                '/supplier/qrcodes',
                '/supplier/test',
            ];
            const storeManagerPaths = [
                '/store/dashboard',
                '/store/download-qrcodes',
            ];
            const isSupplierProductPage = router.pathname.startsWith('/supplier/products/');
            if (session.user.role === 'supplier' && !supplierPaths.includes(router.pathname) && !isSupplierProductPage) {
                router.push('/supplier/dashboard');
            } else if (session.user.role === 'store-manager' && !storeManagerPaths.includes(router.pathname)) {
                router.push('/store/dashboard');
            }
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
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