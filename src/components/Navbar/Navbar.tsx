import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image'; 
import styles from './Navbar.module.css';

const Navbar = () => {
    const { data: session, status } = useSession();

    return (
        <nav className={styles.navbar}>
            <ul className={styles.navList}>
                {/* Logo */}
                <li className={styles.logo}>
                    <Link href="/" passHref>
                        <Image
                            src="/logo.png"
                            alt="Booze Buddy Logo"
                            width={100} 
                            height={100}
                            className={styles.logoImage}
                            priority 
                        />
                    </Link>
                </li>
                {status === 'authenticated' && (
                    <li>
                        <Link href={session.user.role === 'supplier' ? '/supplier/dashboard' : '/store/dashboard'} passHref>
                            <span role="link" className={styles.navItem}>Home</span>
                        </Link>
                    </li>
                )}
                {status === 'authenticated' && session.user.role === 'supplier' && (
                    <>
                        <li>
                            <Link href="/supplier/view-products" passHref>
                                <span role="link" className={styles.navItem}>View Products</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/supplier/send-qr-codes" passHref>
                                <span role="link" className={styles.navItem}>Send QR Codes</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/supplier/add-product" passHref>
                                <button className={`${styles.navItem} ${styles.greenButton}`}>Add Product</button>
                            </Link>
                        </li>
                    </>
                )}
                {status === 'authenticated' && session.user.role === 'store-manager' && (
                    <>
                        <li>
                            <Link href="/store/download-qrcodes" passHref>
                                <span role="link" className={styles.navItem}>Download QR Codes</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/store/print-qrcodes" passHref>
                                <span role="link" className={styles.navItem}>Print QR Codes</span>
                            </Link>
                        </li>
                    </>
                )}
                <li className={styles.rightAligned}>
                    {status === 'authenticated' ? (
                        <button onClick={() => signOut({ callbackUrl: '/' })} className={`${styles.navItem} ${styles.grayButton}`}>
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.href = '/auth/signin'}
                            className={`${styles.navItem} ${styles.grayButton}`}
                        >
                            Login
                        </button>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;