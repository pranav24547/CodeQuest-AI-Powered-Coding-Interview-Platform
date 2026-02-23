'use client';

import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

function LandingContent() {
  const features = [
    {
      icon: '💻',
      title: 'Online Code Editor',
      desc: 'Full-featured Monaco editor with syntax highlighting, autocomplete, and multi-language support.',
    },
    {
      icon: '🤖',
      title: 'AI Code Review',
      desc: 'Get instant feedback on code quality, time complexity, and optimization suggestions.',
    },
    {
      icon: '📊',
      title: 'Weak-Topic Detection',
      desc: 'AI analyzes your submissions to identify topics that need more practice.',
    },
    {
      icon: '🎤',
      title: 'Mock Interviews',
      desc: 'Realistic interview simulations with AI-generated questions and evaluations.',
    },
    {
      icon: '🏆',
      title: 'Leaderboards & Contests',
      desc: 'Compete with others, climb the ranks, and participate in timed challenges.',
    },
    {
      icon: '🔒',
      title: 'Sandboxed Execution',
      desc: 'Run code safely in Docker containers with real-time output and test results.',
    },
  ];

  const stats = [
    { value: '15+', label: 'Coding Problems' },
    { value: '5', label: 'DSA Topics' },
    { value: 'AI', label: 'Powered Review' },
    { value: '∞', label: 'Practice Sessions' },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* ── Hero Section ──────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={styles.heroOrb1}></div>
            <div className={styles.heroOrb2}></div>
            <div className={styles.heroGrid}></div>
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span>🚀</span> AI-Powered Interview Prep
            </div>
            <h1 className={styles.heroTitle}>
              Master Coding Interviews <br />
              <span className="text-gradient">with AI Guidance</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Practice DSA problems, get AI-powered feedback on your solutions,
              detect weak topics, and simulate real interviews — all in one platform.
            </p>
            <div className={styles.heroCta}>
              <Link href="/register" className="btn btn-primary btn-lg">
                Start Practicing Free →
              </Link>
              <Link href="/problems" className="btn btn-secondary btn-lg">
                Browse Problems
              </Link>
            </div>

            {/* ── Code Preview ────────────────────── */}
            <div className={styles.codePreview}>
              <div className={styles.codeHeader}>
                <div className={styles.codeDots}>
                  <span style={{ background: '#ff5f57' }}></span>
                  <span style={{ background: '#ffbd2e' }}></span>
                  <span style={{ background: '#28c840' }}></span>
                </div>
                <span className={styles.codeTitle}>solution.js</span>
              </div>
              <pre className={styles.codeBody}>
                <code>
                  {`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}`}
                </code>
              </pre>
              <div className={styles.aiReviewBadge}>
                <span>✅ AI Review: 95/100</span>
                <span className={styles.complexity}>O(n) time · O(n) space</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Section ─────────────────────────── */}
        <section className={styles.stats}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </section>

        {/* ── Features Section ──────────────────────── */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2>Everything You Need to <span className="text-gradient">Ace the Interview</span></h2>
            <p>A complete platform designed for serious interview preparation</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature, i) => (
              <div key={i} className={`glass-card ${styles.featureCard}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Section ───────────────────────────── */}
        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2>Ready to Level Up Your Coding Skills?</h2>
            <p>Join CodeQuest and start your journey to FAANG-level problem solving</p>
            <Link href="/register" className="btn btn-primary btn-lg">
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span>⚡ CodeQuest</span>
              <p>AI-Powered Coding Interview Platform</p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/problems">Problems</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/mock-interview">Mock Interview</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 CodeQuest. Built with ❤️ for aspiring engineers.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
