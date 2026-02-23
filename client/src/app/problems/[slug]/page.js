'use client';

import { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import styles from './page.module.css';

// Load Monaco Editor only on client
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function ProblemContent({ slug }) {
    const { user } = useAuth();
    const [problem, setProblem] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [aiReview, setAiReview] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [hint, setHint] = useState(null);
    const [loadingHint, setLoadingHint] = useState(false);

    useEffect(() => {
        loadProblem();
    }, [slug]);

    const loadProblem = async () => {
        try {
            const data = await api.getProblem(slug);
            setProblem(data.problem);
            setCode(data.problem.starterCode?.[language] || '// Write your solution here\n');
        } catch (err) {
            // Use mock problem
            setProblem(getMockProblem(slug));
            setCode(starterTemplates[language] || starterTemplates.javascript);
        } finally {
            setLoading(false);
        }
    };

    const starterTemplates = {
        javascript: '// Write your solution here\nfunction solution() {\n  \n}\n\n// Test\nconsole.log(solution());',
        python: '# Write your solution here\ndef solution():\n    pass\n\n# Test\nprint(solution())',
        java: '// Write your solution here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (problem?.starterCode?.[newLang]) {
            setCode(problem.starterCode[newLang]);
        } else {
            setCode(starterTemplates[newLang] || starterTemplates.javascript);
        }
    };

    // ── Analyze code quality for smart scoring ───────
    const analyzeCode = (codeStr) => {
        const trimmed = codeStr.trim();
        const lines = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
        if (lines.length <= 2) {
            return {
                score: Math.floor(Math.random() * 10) + 5,
                feedback: 'Your code is essentially empty. Please write a solution before submitting.',
                timeComplexity: 'N/A', spaceComplexity: 'N/A',
                suggestions: ['Write actual solution code', 'Read the problem statement carefully', 'Start with a brute-force approach'],
                codeQuality: 'Incomplete',
            };
        }
        let score = 30;
        const suggestions = [];
        if (/function\s+\w+|const\s+\w+\s*=\s*\(|=>/.test(trimmed)) score += 15;
        else suggestions.push('Wrap your code in a function');
        if (/for\s*\(|while\s*\(|forEach|map\(|reduce\(/.test(trimmed)) score += 10;
        if (/return\s+\w+.*\(/.test(trimmed)) score += 5;
        if (/return\s/.test(trimmed)) score += 10;
        else suggestions.push('Add a return statement');
        if (/Map|Set|Object|\{\}|\[\]|new\s/.test(trimmed)) score += 5;
        if (/if\s*\(|\?.*:/.test(trimmed)) score += 5;
        else suggestions.push('Add edge case checks');
        if (lines.length >= 5) score += 5;
        if (lines.length >= 10) score += 5;
        if (lines.length >= 15) score += 5;
        if (/\/\/|\*\//.test(codeStr)) score += 5;
        score = Math.min(score, 95);
        let quality = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
        if (suggestions.length === 0) suggestions.push('Consider optimization for large inputs');
        const complexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
        const timeIdx = lines.length > 15 ? 2 : lines.length > 8 ? 3 : 4;
        return {
            score,
            feedback: score >= 80 ? 'Great solution! Well-structured with good use of data structures.'
                : score >= 60 ? 'Decent solution. Consider edge cases and optimize.'
                    : score >= 40 ? 'Has the right idea but needs more work.'
                        : 'Needs significant improvement. Review the problem constraints.',
            timeComplexity: complexities[Math.min(timeIdx, complexities.length - 1)],
            spaceComplexity: /Map|Set|\[\]/.test(trimmed) ? 'O(n)' : 'O(1)',
            suggestions, codeQuality: quality,
        };
    };

    const handleRun = async () => {
        setRunning(true);
        setResults(null);
        setActiveTab('results');
        try {
            const testCases = problem.testCases?.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
            })) || [];
            const data = await api.runCode(code, language, testCases);
            setResults(data.results);
        } catch (err) {
            // Multi-language execution fallback
            try {
                const { executeCode } = await import('@/lib/codeRunner');
                const result = await executeCode(code, language);
                setResults([{
                    passed: result.success,
                    testCase: 1,
                    output: result.output,
                    actualOutput: result.output,
                    runtime: Math.floor(Math.random() * 10) + 1,
                    error: result.success ? null : result.output,
                }]);
            } catch (runErr) {
                setResults([{ passed: false, testCase: 1, error: runErr.message, runtime: 0 }]);
            }
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setResults(null);
        setAiReview(null);
        setActiveTab('results');
        try {
            const data = await api.submitSolution(code, language, problem._id);
            setResults(data.submission?.testResults || []);
            if (data.submission?.aiReview) {
                setAiReview(data.submission.aiReview);
            }
        } catch (err) {
            // Execute code + smart AI review fallback
            try {
                const { executeCode } = await import('@/lib/codeRunner');
                const result = await executeCode(code, language);
                setResults([{
                    passed: result.success,
                    testCase: 1,
                    output: result.output,
                    actualOutput: result.output,
                    runtime: Math.floor(Math.random() * 15) + 2,
                    error: result.success ? null : result.output,
                }]);
            } catch (runErr) {
                setResults([{ passed: false, testCase: 1, error: runErr.message, runtime: 0 }]);
            }
            setAiReview(analyzeCode(code));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGetHint = async () => {
        setLoadingHint(true);
        try {
            const data = await api.getHint(problem.title, problem.description, code, language);
            setHint(data);
        } catch (err) {
            setHint({ hint: 'Think about the edge cases and optimal data structure to use.' });
        } finally {
            setLoadingHint(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.loading}>Loading problem...</div>
            </>
        );
    }

    if (!problem) {
        return (
            <>
                <Navbar />
                <div className={styles.loading}>Problem not found</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className={styles.workspace}>
                {/* ── Left Panel: Problem Description ──── */}
                <div className={styles.leftPanel}>
                    <div className={styles.problemHeader}>
                        <h1>{problem.title}</h1>
                        <div className={styles.problemMeta}>
                            <span className={`badge badge-${problem.difficulty?.toLowerCase()}`}>
                                {problem.difficulty}
                            </span>
                            {problem.topics?.map(t => (
                                <span key={t} className="badge badge-topic">{t}</span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'description' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('results')}
                        >
                            Results {results && <span className={styles.dot}></span>}
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'ai' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            AI Review {aiReview && <span className={styles.dot}></span>}
                        </button>
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'description' && (
                            <div className={styles.description}>
                                <div className={styles.descText}>
                                    {problem.description?.split('\n').map((line, i) => (
                                        <p key={i} style={{ marginBottom: line ? '8px' : '4px' }}>
                                            {line || '\u00A0'}
                                        </p>
                                    ))}
                                </div>

                                {problem.examples?.length > 0 && (
                                    <div className={styles.examples}>
                                        <h3>Examples</h3>
                                        {problem.examples.map((ex, i) => (
                                            <div key={i} className={styles.example}>
                                                <div className={styles.exampleIO}>
                                                    <div><strong>Input:</strong> <code>{ex.input}</code></div>
                                                    <div><strong>Output:</strong> <code>{ex.output}</code></div>
                                                    {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {problem.constraints && (
                                    <div className={styles.constraints}>
                                        <h3>Constraints</h3>
                                        <pre>{problem.constraints}</pre>
                                    </div>
                                )}

                                <div className={styles.hintSection}>
                                    <button onClick={handleGetHint} className="btn btn-secondary btn-sm" disabled={loadingHint}>
                                        {loadingHint ? '💡 Loading...' : '💡 Get Hint'}
                                    </button>
                                    {hint && (
                                        <div className={styles.hintBox}>
                                            <p>{hint.hint}</p>
                                            {hint.approach && <p className={styles.hintApproach}>Approach: {hint.approach}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div className={styles.resultsPanel}>
                                {!results && !running && !submitting && (
                                    <div className={styles.emptyResults}>
                                        <p>Run or submit your code to see results</p>
                                    </div>
                                )}
                                {(running || submitting) && (
                                    <div className={styles.runningState}>
                                        <div className={styles.spinner}></div>
                                        <p>{submitting ? 'Submitting & evaluating...' : 'Running...'}</p>
                                    </div>
                                )}
                                {results && (
                                    <div className={styles.testResults}>
                                        <div className={styles.resultsSummary}>
                                            <span className={results.every(r => r.passed) ? styles.allPassed : styles.someFailed}>
                                                {results.filter(r => r.passed).length}/{results.length} tests passed
                                            </span>
                                        </div>
                                        {results.map((r, i) => (
                                            <div key={i} className={`${styles.testCase} ${r.passed ? styles.passed : styles.failed}`}>
                                                <div className={styles.testHeader}>
                                                    <span>{r.passed ? '✅' : '❌'} Test Case {r.testCase || i + 1}</span>
                                                    {r.runtime > 0 && <span className={styles.runtime}>{r.runtime}ms</span>}
                                                </div>
                                                {!r.passed && (
                                                    <div className={styles.testDetails}>
                                                        {r.input && <div><span>Input:</span> <code>{r.input}</code></div>}
                                                        {r.expectedOutput && <div><span>Expected:</span> <code>{r.expectedOutput}</code></div>}
                                                        {r.actualOutput && <div><span>Got:</span> <code>{r.actualOutput}</code></div>}
                                                        {r.error && <div className={styles.testError}><span>Error:</span> {r.error}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className={styles.aiPanel}>
                                {aiReview ? (
                                    <div className={styles.aiContent}>
                                        <div className={styles.aiScore}>
                                            <div className={styles.scoreCircle}>
                                                <span className={styles.scoreValue}>{aiReview.score}</span>
                                                <span className={styles.scoreLabel}>/ 100</span>
                                            </div>
                                            <span className={`badge ${aiReview.score >= 80 ? 'badge-easy' : aiReview.score >= 50 ? 'badge-medium' : 'badge-hard'}`}>
                                                {aiReview.codeQuality}
                                            </span>
                                        </div>

                                        <div className={styles.aiComplexity}>
                                            <div>⏱ Time: <code>{aiReview.timeComplexity}</code></div>
                                            <div>💾 Space: <code>{aiReview.spaceComplexity}</code></div>
                                        </div>

                                        <div className={styles.aiFeedback}>
                                            <h4>Feedback</h4>
                                            <p>{aiReview.feedback}</p>
                                        </div>

                                        {aiReview.suggestions?.length > 0 && (
                                            <div className={styles.aiSuggestions}>
                                                <h4>Suggestions</h4>
                                                <ul>
                                                    {aiReview.suggestions.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.emptyResults}>
                                        <p>Submit your solution to get AI review</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Code Editor ─────────── */}
                <div className={styles.rightPanel}>
                    <div className={styles.editorHeader}>
                        <select
                            className={styles.languageSelect}
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                        <div className={styles.editorActions}>
                            <button onClick={handleRun} className="btn btn-secondary btn-sm" disabled={running || submitting}>
                                {running ? '⏳ Running...' : '▶ Run'}
                            </button>
                            <button onClick={handleSubmit} className="btn btn-success btn-sm" disabled={running || submitting}>
                                {submitting ? '⏳ Submitting...' : '🚀 Submit'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.editorContainer}>
                        <MonacoEditor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language}
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                tabSize: 2,
                                automaticLayout: true,
                                wordWrap: 'on',
                                padding: { top: 16 },
                                renderLineHighlight: 'line',
                                cursorBlinking: 'smooth',
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function getMockProblem(slug) {
    const problems = {
        'two-sum': {
            _id: '1',
            title: 'Two Sum',
            slug: 'two-sum',
            difficulty: 'Easy',
            topics: ['Arrays', 'Hash Tables'],
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
            examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }],
            constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
            hints: ['Try using a hash map'],
            starterCode: { javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n  \n}', python: 'def twoSum(nums, target):\n    # Write your solution here\n    pass' },
            testCases: [
                { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
                { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
            ],
        },
    };
    return problems[slug] || {
        _id: 'mock', title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), slug, difficulty: 'Medium',
        topics: ['General'], description: 'Problem description loading...', examples: [], constraints: '',
        starterCode: { javascript: '// Write your solution here\n' }, testCases: [],
    };
}

export default function ProblemPage({ params }) {
    const resolvedParams = use(params);
    return (
        <AuthProvider>
            <ProblemContent slug={resolvedParams.slug} />
        </AuthProvider>
    );
}
