'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import styles from './page.module.css';

function ProblemsContent() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [topic, setTopic] = useState('');

    useEffect(() => {
        loadProblems();
    }, [difficulty, topic]);

    const loadProblems = async () => {
        try {
            setLoading(true);
            const params = {};
            if (difficulty) params.difficulty = difficulty;
            if (topic) params.topic = topic;
            if (search) params.search = search;
            const data = await api.getProblems(params);
            setProblems(data.problems || []);
        } catch (err) {
            setError(err.message);
            // Use mock data if server unavailable
            setProblems(getMockProblems());
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadProblems();
    };

    const filteredProblems = problems.filter(p =>
        !search || p.title.toLowerCase().includes(search.toLowerCase())
    );

    const topics = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Hash Tables', 'Stack', 'Sorting', 'Searching', 'Two Pointers', 'Sliding Window', 'Greedy', 'Recursion'];

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Problems</h1>
                        <p>Practice coding problems across all difficulty levels and topics</p>
                    </div>

                    {/* ── Filters ──────────────────────────── */}
                    <div className={styles.filters}>
                        <form onSubmit={handleSearch} className={styles.searchForm}>
                            <input
                                className="input"
                                placeholder="Search problems..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>

                        <div className={styles.filterGroup}>
                            <select
                                className={styles.select}
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="">All Difficulty</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>

                            <select
                                className={styles.select}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            >
                                <option value="">All Topics</option>
                                {topics.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Problem List ─────────────────────── */}
                    <div className={styles.problemList}>
                        <div className={styles.listHeader}>
                            <span className={styles.colNum}>#</span>
                            <span className={styles.colTitle}>Title</span>
                            <span className={styles.colDiff}>Difficulty</span>
                            <span className={styles.colTopics}>Topics</span>
                            <span className={styles.colAccept}>Acceptance</span>
                        </div>

                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className={styles.skeleton}>
                                    <div className="skeleton" style={{ height: '48px', width: '100%' }}></div>
                                </div>
                            ))
                        ) : error && problems.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>⚠️ {error}</p>
                                <button onClick={loadProblems} className="btn btn-primary">Retry</button>
                            </div>
                        ) : filteredProblems.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No problems found</p>
                            </div>
                        ) : (
                            filteredProblems.map((problem, i) => (
                                <Link
                                    key={problem._id || i}
                                    href={`/problems/${problem.slug}`}
                                    className={styles.problemRow}
                                >
                                    <span className={styles.colNum}>{problem.order || i + 1}</span>
                                    <span className={styles.colTitle}>{problem.title}</span>
                                    <span className={styles.colDiff}>
                                        <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>
                                            {problem.difficulty}
                                        </span>
                                    </span>
                                    <span className={styles.colTopics}>
                                        {problem.topics?.slice(0, 2).map(t => (
                                            <span key={t} className="badge badge-topic">{t}</span>
                                        ))}
                                    </span>
                                    <span className={styles.colAccept}>
                                        {problem.acceptanceRate || 0}%
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function getMockProblems() {
    return [
        { _id: '1', title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', topics: ['Arrays', 'Hash Tables'], acceptanceRate: 49, order: 1 },
        { _id: '2', title: 'Reverse String', slug: 'reverse-string', difficulty: 'Easy', topics: ['Strings', 'Two Pointers'], acceptanceRate: 75, order: 2 },
        { _id: '3', title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'Easy', topics: ['Stack', 'Strings'], acceptanceRate: 42, order: 3 },
        { _id: '4', title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'Medium', topics: ['Arrays', 'Dynamic Programming'], acceptanceRate: 50, order: 4 },
        { _id: '5', title: 'Longest Substring Without Repeating', slug: 'longest-substring-without-repeating', difficulty: 'Medium', topics: ['Strings', 'Sliding Window'], acceptanceRate: 34, order: 5 },
        { _id: '6', title: 'Binary Search', slug: 'binary-search', difficulty: 'Easy', topics: ['Arrays', 'Searching'], acceptanceRate: 60, order: 6 },
        { _id: '7', title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists', difficulty: 'Easy', topics: ['Linked Lists'], acceptanceRate: 62, order: 7 },
        { _id: '8', title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'Easy', topics: ['Dynamic Programming'], acceptanceRate: 52, order: 8 },
        { _id: '9', title: 'Container With Most Water', slug: 'container-with-most-water', difficulty: 'Medium', topics: ['Arrays', 'Two Pointers'], acceptanceRate: 55, order: 9 },
        { _id: '10', title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'Medium', topics: ['Graphs'], acceptanceRate: 45, order: 10 },
        { _id: '11', title: 'Coin Change', slug: 'coin-change', difficulty: 'Medium', topics: ['Dynamic Programming'], acceptanceRate: 42, order: 11 },
        { _id: '12', title: 'Validate BST', slug: 'validate-bst', difficulty: 'Medium', topics: ['Trees'], acceptanceRate: 32, order: 12 },
        { _id: '13', title: 'LRU Cache', slug: 'lru-cache', difficulty: 'Hard', topics: ['Hash Tables', 'Linked Lists'], acceptanceRate: 40, order: 13 },
        { _id: '14', title: 'Trapping Rain Water', slug: 'trapping-rain-water', difficulty: 'Hard', topics: ['Arrays', 'Two Pointers'], acceptanceRate: 60, order: 14 },
        { _id: '15', title: 'Word Break', slug: 'word-break', difficulty: 'Medium', topics: ['Dynamic Programming', 'Strings'], acceptanceRate: 46, order: 15 },
    ];
}

export default function ProblemsPage() {
    return (
        <AuthProvider>
            <ProblemsContent />
        </AuthProvider>
    );
}
