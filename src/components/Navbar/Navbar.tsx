// src/components/Navbar/Navbar.tsx
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className={styles.navbar}>
            <ul className={styles.navList}>
                <li>
                    <Link href={session ? (session.user.role === 'supplier' ? '/supplier/dashboard' : '/store/dashboard') : '/'} passHref>
                        <span role="link" className={styles.navItem}>Home</span>
                    </Link>
                </li>
                {status === 'authenticated' && session.user.role === 'supplier' && (
                    <>
                        <li>
                            <Link href="/supplier/view-products" passHref>
                                <span role="link" className={styles.navItem}>View Products</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/supplier/qrcodes" passHref>
                                <span role="link" className={styles.navItem}>QR Codes</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/supplier/add-product" passHref>
                                <span role="link" className={styles.navItem}>Add Product</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/supplier/test" passHref>
                                <span role="link" className={styles.navItem}>test</span>
                            </Link>
                        </li>
                    </>
                )}
                {status === 'authenticated' && session.user.role === 'store-manager' && (
                    <>
                        <li>
                            <Link href="/store/dashboard" passHref>
                                <span role="link" className={styles.navItem}>Dashboard</span>
                            </Link>
                        </li>
                    </>
                )}
                <li className={styles.rightAligned}>
                    {status === 'authenticated' ? (
                        <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.navItem}>Logout</button>
                    ) : (
                        <Link href="/auth/signin" passHref>
                            <span role="link" className={styles.navItem}>Login</span>
                        </Link>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;