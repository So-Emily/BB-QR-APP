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
                '/supplier/qrcodes',
                '/supplier/test',

                '/store/products/[supplierName]/[storeName]/[productName]',
            ];

            const storeManagerPaths = [
                '/store/dashboard',
                '/store/download-qrcodes',

                '/store/products/[supplierName]/[storeName]/[productName]',
                
            ];

            const isSupplierProductPage = router.pathname.startsWith('/supplier/products/');
            const isStoreProductPage = router.pathname.startsWith('/store/products/');

            if (session.user.role === 'supplier' && !supplierPaths.includes(router.pathname) && !isSupplierProductPage) {
                router.push('/supplier/dashboard');
            } else if (session.user.role === 'store-manager' && !storeManagerPaths.includes(router.pathname) && !isStoreProductPage) {
                router.push('/store/dashboard');
            }
        } else if (status === 'unauthenticated') {
            const publicPaths = [
                '/store/products/[supplierName]/[storeName]/[productName]',
            ];

            const isPublicPage = publicPaths.some(path => router.pathname.startsWith(path));

            if (!isPublicPage) {
                
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