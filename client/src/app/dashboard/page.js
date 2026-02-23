'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import styles from './page.module.css';

function DashboardContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [weakTopics, setWeakTopics] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            loadDashboard();
        }
    }, [user, authLoading]);

    const loadDashboard = async () => {
        try {
            const [statsData, weakData, subData] = await Promise.allSettled([
                api.getUserStats(user.username),
                api.getWeakTopics(),
                api.getUserSubmissions(1),
            ]);
            if (statsData.status === 'fulfilled') setStats(statsData.value.user);
            if (weakData.status === 'fulfilled') setWeakTopics(weakData.value.topics || []);
            if (subData.status === 'fulfilled') setSubmissions(subData.value.submissions || []);
        } catch (err) {
            console.log('Dashboard load error:', err);
        }
    };

    if (authLoading || !user) {
        return (
            <>
                <Navbar />
                <div className={styles.loading}>Loading...</div>
            </>
        );
    }

    const displayStats = stats || {
        username: user.username,
        rating: user.rating || 0,
        problemsSolved: user.solvedProblems?.length || 0,
        totalSubmissions: user.totalSubmissions || 0,
        acceptanceRate: user.totalSubmissions > 0
            ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
            : 0,
        streak: user.streak || 0,
    };

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.userCard}>
                            <div className={styles.avatar}>
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1>{user.username}</h1>
                                <p className={styles.email}>{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats Grid ──────────────────────── */}
                    <div className={styles.statsGrid}>
                        <div className={`glass-card ${styles.statCard}`}>
                            <div className={styles.statIcon}>🏆</div>
                            <div className={styles.statValue}>{displayStats.rating}</div>
                            <div className={styles.statLabel}>Rating</div>
                        </div>
                        <div className={`glass-card ${styles.statCard}`}>
                            <div className={styles.statIcon}>✅</div>
                            <div className={styles.statValue}>{displayStats.problemsSolved}</div>
                            <div className={styles.statLabel}>Solved</div>
                        </div>
                        <div className={`glass-card ${styles.statCard}`}>
                            <div className={styles.statIcon}>📝</div>
                            <div className={styles.statValue}>{displayStats.totalSubmissions}</div>
                            <div className={styles.statLabel}>Submissions</div>
                        </div>
                        <div className={`glass-card ${styles.statCard}`}>
                            <div className={styles.statIcon}>🎯</div>
                            <div className={styles.statValue}>{displayStats.acceptanceRate}%</div>
                            <div className={styles.statLabel}>Acceptance</div>
                        </div>
                        <div className={`glass-card ${styles.statCard}`}>
                            <div className={styles.statIcon}>🔥</div>
                            <div className={styles.statValue}>{displayStats.streak}</div>
                            <div className={styles.statLabel}>Day Streak</div>
                        </div>
                    </div>

                    <div className={styles.panels}>
                        {/* ── Weak Topics ────────────────────── */}
                        <div className={`glass-card ${styles.panel}`}>
                            <h2>📊 Topic Strength</h2>
                            <div className={styles.topicList}>
                                {weakTopics.length > 0 ? (
                                    weakTopics.map((t, i) => (
                                        <div key={i} className={styles.topicRow}>
                                            <span className={styles.topicName}>{t.topic}</span>
                                            <div className={styles.topicBar}>
                                                <div
                                                    className={styles.topicFill}
                                                    style={{
                                                        width: `${t.strength}%`,
                                                        background: t.strength >= 70 ? 'var(--success)' :
                                                            t.strength >= 40 ? 'var(--warning)' : 'var(--danger)',
                                                    }}
                                                ></div>
                                            </div>
                                            <span className={`badge ${t.status === 'weak' ? 'badge-hard' : t.status === 'strong' ? 'badge-easy' : 'badge-medium'}`}>
                                                {t.status || `${t.strength}%`}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyText}>
                                        Solve more problems to see your topic analysis
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Recent Submissions ─────────────── */}
                        <div className={`glass-card ${styles.panel}`}>
                            <h2>📋 Recent Submissions</h2>
                            <div className={styles.submissionList}>
                                {submissions.length > 0 ? (
                                    submissions.slice(0, 10).map((sub, i) => (
                                        <div key={i} className={styles.submissionRow}>
                                            <div>
                                                <span className={styles.subTitle}>
                                                    {sub.problemId?.title || 'Problem'}
                                                </span>
                                                <span className={styles.subLang}>{sub.language}</span>
                                            </div>
                                            <span className={`badge ${sub.status === 'Accepted' ? 'badge-easy' : 'badge-hard'}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyText}>
                                        No submissions yet. Start solving problems!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function DashboardPage() {
    return (
        <AuthProvider>
            <DashboardContent />
        </AuthProvider>
    );
}
