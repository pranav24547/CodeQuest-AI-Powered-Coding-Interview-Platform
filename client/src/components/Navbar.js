'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navLinks = [
        { href: '/problems', label: 'Problems' },
        { href: '/mock-interview', label: 'Mock Interview' },
        { href: '/leaderboard', label: 'Leaderboard' },
    ];

    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>⚡</span>
                    <span className={styles.logoText}>CodeQuest</span>
                </Link>

                <div className={styles.links}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className={styles.actions}>
                    {user ? (
                        <div className={styles.userMenu}>
                            <Link href="/dashboard" className={styles.link}>
                                Dashboard
                            </Link>
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.username}>{user.username}</span>
                            </div>
                            <button onClick={logout} className={`btn btn-ghost btn-sm`}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className={styles.authLinks}>
                            <Link href="/login" className="btn btn-ghost btn-sm">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn btn-primary btn-sm">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
