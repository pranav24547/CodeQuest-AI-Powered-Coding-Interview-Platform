'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import styles from './page.module.css';

function LeaderboardContent() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const data = await api.getLeaderboard();
            setLeaderboard(data.leaderboard || []);
        } catch (err) {
            setLeaderboard(getMockLeaderboard());
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>🏆 Leaderboard</h1>
                        <p>Top performers across all problems</p>
                    </div>

                    {/* ── Top 3 Podium ──────────────────── */}
                    {leaderboard.length >= 3 && (
                        <div className={styles.podium}>
                            {[1, 0, 2].map(idx => {
                                const item = leaderboard[idx];
                                if (!item) return null;
                                return (
                                    <div key={idx} className={`${styles.podiumCard} ${styles[`rank${item.rank}`]}`}>
                                        <div className={styles.podiumRank}>
                                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                                        </div>
                                        <div className={styles.podiumAvatar}>
                                            {item.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.podiumName}>{item.username}</div>
                                        <div className={styles.podiumRating}>{item.rating} pts</div>
                                        <div className={styles.podiumSolved}>
                                            {item.problemsSolved} solved
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Full Table ────────────────────── */}
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <span>Rank</span>
                            <span>User</span>
                            <span>Rating</span>
                            <span>Solved</span>
                            <span>Acceptance</span>
                            <span>Streak</span>
                        </div>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className={styles.skeletonRow}>
                                    <div className="skeleton" style={{ height: '44px', width: '100%' }}></div>
                                </div>
                            ))
                        ) : leaderboard.length === 0 ? (
                            <div className={styles.empty}>
                                <p>No users yet. Be the first on the leaderboard!</p>
                            </div>
                        ) : (
                            leaderboard.map((item, i) => (
                                <div key={i} className={styles.tableRow}>
                                    <span className={styles.rank}>
                                        {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
                                    </span>
                                    <span className={styles.user}>
                                        <div className={styles.userAvatar}>{item.username?.charAt(0).toUpperCase()}</div>
                                        {item.username}
                                    </span>
                                    <span className={styles.rating}>{item.rating}</span>
                                    <span>{item.problemsSolved}</span>
                                    <span>{item.acceptanceRate}%</span>
                                    <span>🔥 {item.streak}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function getMockLeaderboard() {
    return [
        { rank: 1, username: 'AlgoMaster', rating: 2450, problemsSolved: 142, acceptanceRate: 78, streak: 45 },
        { rank: 2, username: 'CodeNinja', rating: 2280, problemsSolved: 128, acceptanceRate: 72, streak: 32 },
        { rank: 3, username: 'DSAQueen', rating: 2150, problemsSolved: 115, acceptanceRate: 69, streak: 28 },
        { rank: 4, username: 'ByteWizard', rating: 1980, problemsSolved: 98, acceptanceRate: 65, streak: 18 },
        { rank: 5, username: 'TreeTraverser', rating: 1850, problemsSolved: 87, acceptanceRate: 61, streak: 14 },
        { rank: 6, username: 'GraphGuru', rating: 1720, problemsSolved: 76, acceptanceRate: 58, streak: 10 },
        { rank: 7, username: 'DPDynamo', rating: 1650, problemsSolved: 68, acceptanceRate: 55, streak: 7 },
        { rank: 8, username: 'StackOverflow', rating: 1500, problemsSolved: 52, acceptanceRate: 50, streak: 5 },
    ];
}

export default function LeaderboardPage() {
    return (
        <AuthProvider>
            <LeaderboardContent />
        </AuthProvider>
    );
}
