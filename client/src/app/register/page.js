'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import styles from '../login/page.module.css';

function RegisterContent() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password);
            router.push('/problems');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <h1>Create Account</h1>
                            <p>Join CodeQuest and start your interview prep</p>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    className="input"
                                    placeholder="codemaster"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    minLength={3}
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className={styles.switchAuth}>
                            Already have an account? <Link href="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function RegisterPage() {
    return (
        <AuthProvider>
            <RegisterContent />
        </AuthProvider>
    );
}
