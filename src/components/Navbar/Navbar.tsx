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
                    {/* Home changes depending on user being logged in or not */}
                    <Link href={session ? (session.user.role === 'supplier' ? '/supplier/dashboard' : '/store/dashboard') : '/'} passHref>
                        <span role="link" className={styles.navItem}>Home</span>
                    </Link>
                </li>
                <li className={styles.rightAligned}>
                    {status === 'authenticated' ? (
                        <>
                            {/* Signout Button */}
                            <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.navItem}>Logout</button>
                        </>
                    ) : (
                        // Login Button
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