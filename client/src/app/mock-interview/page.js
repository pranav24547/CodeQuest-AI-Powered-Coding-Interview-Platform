'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import styles from './page.module.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function MockInterviewContent() {
    const { user } = useAuth();
    const [started, setStarted] = useState(false);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [question, setQuestion] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [review, setReview] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const [running, setRunning] = useState(false);
    const [runOutput, setRunOutput] = useState(null);
    const [timer, setTimer] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [previousQuestions, setPreviousQuestions] = useState([]);
    const [resumeText, setResumeText] = useState('');
    const [useResume, setUseResume] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const starterTemplates = {
        javascript: '// Write your solution here\nfunction solution(input) {\n  // Your code here\n  \n  return result;\n}\n\n// Test with example\nconsole.log(solution());',
        python: '# Write your solution here\ndef solution(input):\n    # Your code here\n    pass\n\n# Test with example\nprint(solution())',
        java: '// Write your solution here\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n        System.out.println("Hello World");\n    }\n}',
        cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    cout << "Hello World" << endl;\n    return 0;\n}',
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        setCode(starterTemplates[newLang] || starterTemplates.javascript);
        setRunOutput(null);
    };

    // Handle resume file upload (.txt or paste)
    const handleResumeFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100000) {
            setError('Resume file too large. Please keep it under 100KB.');
            return;
        }

        try {
            const text = await file.text();
            setResumeText(text);
            setError('');
        } catch {
            setError('Could not read the file. Please paste your resume text instead.');
        }
    };

    const fallbackQuestions = [
        { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.', examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }], constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9' },
        { title: 'Reverse String', description: 'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.', examples: [{ input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }], constraints: '1 <= s.length <= 10^5' },
        { title: 'Valid Parentheses', description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.', examples: [{ input: 's = "()"', output: 'true' }, { input: 's = "()[]{ }"', output: 'true' }, { input: 's = "(]"', output: 'false' }], constraints: '1 <= s.length <= 10^4' },
        { title: 'Maximum Subarray', description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.', examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }], constraints: '1 <= nums.length <= 10^5' },
        { title: 'Climbing Stairs', description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?', examples: [{ input: 'n = 2', output: '2', explanation: '1+1 or 2' }, { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }], constraints: '1 <= n <= 45' },
        { title: 'Contains Duplicate', description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.', examples: [{ input: 'nums = [1,2,3,1]', output: 'true' }, { input: 'nums = [1,2,3,4]', output: 'false' }], constraints: '1 <= nums.length <= 10^5' },
        { title: 'Palindrome Check', description: 'Given a string s, return true if it is a palindrome, or false otherwise.\n\nA string is a palindrome if it reads the same forward and backward after converting all uppercase letters to lowercase and removing all non-alphanumeric characters.', examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: 'true' }, { input: 's = "race a car"', output: 'false' }], constraints: '1 <= s.length <= 2 * 10^5' },
        { title: 'Binary Search', description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.', examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' }, { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }], constraints: '1 <= nums.length <= 10^4' },
    ];

    const startInterview = async () => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (useResume && resumeText.trim().length >= 20) {
                // Resume-based question generation
                data = await api.getResumeBasedQuestion(resumeText, difficulty, previousQuestions);
            } else {
                // Topic-based question generation
                data = await api.getMockQuestion(topic, difficulty, previousQuestions);
            }
            setQuestion(data.question);
            setCode(starterTemplates[language] || starterTemplates.javascript);
            setStarted(true);
            setReview(null);
            setRunOutput(null);
            setQuestionCount(q => q + 1);
            setPreviousQuestions(prev => [...prev, data.question?.title]);

            // Start timer
            const start = Date.now();
            const interval = setInterval(() => {
                setTimer(Math.floor((Date.now() - start) / 1000));
            }, 1000);
            setTimerInterval(interval);
        } catch (err) {
            console.error('Question generation error:', err);
            // Pick a question from the pool that hasn't been asked yet
            const available = fallbackQuestions.filter(q => !previousQuestions.includes(q.title));
            const pool = available.length > 0 ? available : fallbackQuestions;
            const picked = pool[Math.floor(Math.random() * pool.length)];

            setQuestion(picked);
            setCode(starterTemplates[language] || starterTemplates.javascript);
            setStarted(true);
            setReview(null);
            setRunOutput(null);
            setQuestionCount(q => q + 1);
            setPreviousQuestions(prev => [...prev, picked.title]);

            // Start timer in fallback too
            const start = Date.now();
            const interval = setInterval(() => {
                setTimer(Math.floor((Date.now() - start) / 1000));
            }, 1000);
            setTimerInterval(interval);
        } finally {
            setLoading(false);
        }
    };

    // ── Run code ──
    const handleRun = async () => {
        setRunning(true);
        setRunOutput(null);
        setError('');
        try {
            const { executeCode } = await import('@/lib/codeRunner');
            const result = await executeCode(code, language, '');
            setRunOutput(result);
        } catch (err) {
            setRunOutput({ success: false, output: err.message });
        } finally {
            setRunning(false);
        }
    };

    // ── Submit answer — runs code + gets AI evaluation ──
    const submitAnswer = async () => {
        if (timerInterval) clearInterval(timerInterval);
        setReviewing(true);
        setRunOutput(null);
        setError('');

        let executionOutput = '';

        // Step 1: Execute the code to get output
        try {
            const { executeCode } = await import('@/lib/codeRunner');
            const execResult = await executeCode(code, language, '');
            setRunOutput(execResult);
            executionOutput = execResult?.output || '';
        } catch (err) {
            const errResult = { success: false, output: `Execution error: ${err.message}` };
            setRunOutput(errResult);
            executionOutput = errResult.output;
        }

        // Step 2: Get AI evaluation using the dedicated endpoint
        try {
            const data = await api.evaluateInterviewAnswer(
                code,
                language,
                question.title,
                question.description,
                executionOutput
            );
            setReview(data.evaluation);
        } catch (err) {
            console.error('Evaluation API error:', err);
            // Try the general review endpoint as fallback
            try {
                const data = await api.getAIReview(code, language, question.title, question.description);
                // Map the review response to evaluation format
                setReview({
                    ...data.review,
                    correctness: data.review.score,
                    efficiency: Math.round(data.review.score * 0.8),
                    strengths: ['Code was submitted successfully'],
                    weaknesses: [],
                    isCorrect: data.review.score >= 60,
                    wouldPass: data.review.score >= 65,
                });
            } catch (err2) {
                console.error('Fallback review also failed:', err2);
                // Final fallback: smart client-side evaluation
                setReview(analyzeCode(code, executionOutput));
            }
        } finally {
            setReviewing(false);
        }
    };

    // Client-side code analysis fallback
    const analyzeCode = (codeStr, execOutput) => {
        const trimmed = codeStr.trim();
        const lines = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#'));

        if (lines.length <= 2) {
            return {
                score: 5, correctness: 0, efficiency: 0,
                feedback: 'Your code is essentially empty. Please write a solution before submitting.',
                timeComplexity: 'N/A', spaceComplexity: 'N/A',
                suggestions: ['Write actual solution code', 'Read the problem statement carefully', 'Start with a brute-force approach'],
                codeQuality: 'Poor', strengths: [], weaknesses: ['No solution provided'],
                isCorrect: false, wouldPass: false,
            };
        }

        let score = 25;
        const strengths = [];
        const weaknesses = [];
        const suggestions = [];

        const hasFunc = /function\s+\w+|const\s+\w+\s*=\s*\(|=>|def\s+\w+|public\s+(static\s+)?(void|int|String)/.test(trimmed);
        const hasLoops = /for\s*\(|while\s*\(|forEach|\.map\(|for\s+\w+\s+in\s|range\(/.test(trimmed);
        const hasReturn = /return\s|print\(|System\.out\.print|cout\s*<<|console\.log/.test(trimmed);
        const hasConditionals = /if\s*\(|if\s+\w+|else\s|elif/.test(trimmed);
        const usesDS = /Map|Set|dict|list|Array|Hash|defaultdict|Counter|\[\]|\{\}/.test(trimmed);
        const hasOutput = execOutput && !execOutput.includes('Error') && !execOutput.includes('No output') && execOutput.trim().length > 0;

        if (hasFunc) { score += 12; strengths.push('Properly structured code'); }
        else { weaknesses.push('Code not in a function'); suggestions.push('Wrap your code in a function'); }

        if (hasLoops) { score += 10; strengths.push('Uses iteration'); }
        if (hasReturn) { score += 8; strengths.push('Has output statements'); }
        else { weaknesses.push('No return/print statement'); suggestions.push('Add output for your answer'); }

        if (hasConditionals) { score += 8; strengths.push('Handles conditions'); }
        else { weaknesses.push('No edge case handling'); suggestions.push('Add edge case checks'); }

        if (usesDS) { score += 8; strengths.push('Uses data structures'); }
        if (hasOutput) { score += 15; strengths.push('Code executes and produces output'); }
        else { weaknesses.push('Code did not produce valid output'); }

        if (lines.length >= 5) score += 4;
        if (lines.length >= 10) score += 4;
        if (lines.length >= 15) score += 4;

        score = Math.min(score, 90);

        let quality = 'Poor';
        if (score >= 75) quality = 'Good';
        else if (score >= 55) quality = 'Average';
        else if (score >= 35) quality = 'Needs Improvement';

        if (suggestions.length === 0) suggestions.push('Consider optimization for large inputs');

        return {
            score, correctness: hasOutput ? score : Math.round(score * 0.5),
            efficiency: Math.round(score * 0.7),
            codeQuality: quality,
            timeComplexity: hasLoops ? (usesDS ? 'O(n)' : 'O(n²)') : 'O(1)',
            spaceComplexity: usesDS ? 'O(n)' : 'O(1)',
            feedback: score >= 70
                ? `Good attempt on "${question?.title}"! Your code structure is solid.`
                : score >= 45
                    ? `Partial solution for "${question?.title}". The approach needs more work.`
                    : `Your solution for "${question?.title}" needs significant improvement.`,
            strengths, weaknesses, suggestions,
            isCorrect: hasOutput && score >= 50,
            wouldPass: score >= 65,
        };
    };

    const nextQuestion = () => {
        setReview(null);
        setRunOutput(null);
        setTimer(0);
        startInterview();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ════════════════════════════════════════════════════════
    // Setup Screen (Before Interview Starts)
    // ════════════════════════════════════════════════════════
    if (!started) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.setupContainer}>
                        <div className={styles.setupCard}>
                            <div className={styles.setupIcon}>🎤</div>
                            <h1>Mock Interview</h1>
                            <p>Simulate a real coding interview with AI-generated questions and instant feedback</p>

                            {error && <div className={styles.errorMsg}>{error}</div>}

                            {/* Resume Upload Section */}
                            <div className={styles.resumeSection}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={useResume}
                                        onChange={(e) => setUseResume(e.target.checked)}
                                    />
                                    <span className={styles.toggleSwitch}></span>
                                    <span>Generate questions based on my resume</span>
                                </label>

                                {useResume && (
                                    <div className={styles.resumeUpload}>
                                        <p className={styles.resumeHint}>
                                            📄 Paste your resume text or upload a .txt file. Questions will be tailored to your skills and experience.
                                        </p>
                                        <div className={styles.resumeActions}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                📁 Upload .txt file
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".txt,.text"
                                                style={{ display: 'none' }}
                                                onChange={handleResumeFile}
                                            />
                                            {resumeText && (
                                                <span className={styles.resumeLoaded}>
                                                    ✅ Resume loaded ({resumeText.length} chars)
                                                </span>
                                            )}
                                        </div>
                                        <textarea
                                            className={styles.resumeTextarea}
                                            placeholder="Paste your resume text here... (skills, experience, projects, technologies)"
                                            value={resumeText}
                                            onChange={(e) => setResumeText(e.target.value)}
                                            rows={6}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.setupFields}>
                                {!useResume && (
                                    <div className={styles.field}>
                                        <label>Topic (optional)</label>
                                        <select
                                            className={styles.select}
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                        >
                                            <option value="">Random</option>
                                            <option value="Arrays">Arrays</option>
                                            <option value="Strings">Strings</option>
                                            <option value="Linked Lists">Linked Lists</option>
                                            <option value="Trees">Trees</option>
                                            <option value="Graphs">Graphs</option>
                                            <option value="Dynamic Programming">Dynamic Programming</option>
                                            <option value="Hash Tables">Hash Tables</option>
                                        </select>
                                    </div>
                                )}
                                <div className={styles.field}>
                                    <label>Difficulty</label>
                                    <select
                                        className={styles.select}
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={startInterview}
                                className="btn btn-primary btn-lg"
                                disabled={loading || (useResume && resumeText.trim().length < 20)}
                                style={{ width: '100%', marginTop: '16px' }}
                            >
                                {loading ? 'Generating Question...' : useResume ? '🎯 Start Resume-Based Interview' : '🚀 Start Interview'}
                            </button>

                            {useResume && resumeText.trim().length < 20 && resumeText.length > 0 && (
                                <p className={styles.resumeWarning}>Please add more resume content (at least 20 characters)</p>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ════════════════════════════════════════════════════════
    // Interview Screen
    // ════════════════════════════════════════════════════════
    return (
        <>
            <Navbar />
            <div className={styles.interviewLayout}>
                {/* ── Left: Question ────────────────── */}
                <div className={styles.questionPanel}>
                    <div className={styles.interviewHeader}>
                        <div className={styles.timerDisplay}>
                            <span className={styles.timerIcon}>⏱</span>
                            <span className={styles.timerValue}>{formatTime(timer)}</span>
                        </div>
                        <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty}</span>
                        <span className={styles.questionNum}>Q{questionCount}</span>
                    </div>

                    <div className={styles.questionContent}>
                        <h2>{question?.title}</h2>
                        {question?.resumeRelevance && (
                            <div className={styles.resumeRelevance}>
                                🎯 <em>{question.resumeRelevance}</em>
                            </div>
                        )}
                        <p className={styles.questionDesc}>{question?.description}</p>

                        {question?.examples?.length > 0 && (
                            <div className={styles.examples}>
                                <h3>Examples</h3>
                                {question.examples.map((ex, i) => (
                                    <div key={i} className={styles.exampleBox}>
                                        <div><strong>Input:</strong> <code>{ex.input}</code></div>
                                        <div><strong>Output:</strong> <code>{ex.output}</code></div>
                                        {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {question?.constraints && (
                            <div className={styles.constraintsBox}>
                                <h3>Constraints</h3>
                                <pre>{question.constraints}</pre>
                            </div>
                        )}

                        {question?.hints?.length > 0 && (
                            <div className={styles.hintsSection}>
                                <details>
                                    <summary>💡 Hints (click to reveal)</summary>
                                    <ul>
                                        {question.hints.map((h, i) => (
                                            <li key={i}>{h}</li>
                                        ))}
                                    </ul>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* ── Review Panel ──────────────────── */}
                    {review && (
                        <div className={styles.reviewPanel}>
                            <h3>🤖 AI Evaluation</h3>

                            {/* Score Circle */}
                            <div className={styles.reviewScore}>
                                <div className={styles.scoreCircle} data-score={review.score >= 70 ? 'high' : review.score >= 40 ? 'mid' : 'low'}>
                                    <span className={styles.scoreNum}>{review.score}</span>
                                    <span className={styles.scoreOf}>/ 100</span>
                                </div>
                                <span className={`badge ${review.score >= 70 ? 'badge-easy' : review.score >= 40 ? 'badge-medium' : 'badge-hard'}`}>
                                    {review.codeQuality}
                                </span>
                                {review.wouldPass !== undefined && (
                                    <span className={`badge ${review.wouldPass ? 'badge-easy' : 'badge-hard'}`}>
                                        {review.wouldPass ? '✅ Would Pass' : '❌ Would Not Pass'}
                                    </span>
                                )}
                            </div>

                            {/* Complexity */}
                            {(review.timeComplexity || review.spaceComplexity) && (
                                <div className={styles.complexityRow}>
                                    {review.timeComplexity && <span>⏱ Time: <strong>{review.timeComplexity}</strong></span>}
                                    {review.spaceComplexity && <span>💾 Space: <strong>{review.spaceComplexity}</strong></span>}
                                </div>
                            )}

                            {/* Feedback */}
                            <p className={styles.reviewFeedback}>{review.feedback}</p>

                            {/* Correctness & Efficiency bars */}
                            {(review.correctness !== undefined || review.efficiency !== undefined) && (
                                <div className={styles.metricsSection}>
                                    {review.correctness !== undefined && (
                                        <div className={styles.metricBar}>
                                            <span>Correctness</span>
                                            <div className={styles.barTrack}>
                                                <div className={styles.barFill} style={{ width: `${review.correctness}%`, background: review.correctness >= 70 ? '#22c55e' : review.correctness >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                                            </div>
                                            <span>{review.correctness}%</span>
                                        </div>
                                    )}
                                    {review.efficiency !== undefined && (
                                        <div className={styles.metricBar}>
                                            <span>Efficiency</span>
                                            <div className={styles.barTrack}>
                                                <div className={styles.barFill} style={{ width: `${review.efficiency}%`, background: review.efficiency >= 70 ? '#22c55e' : review.efficiency >= 40 ? '#f59e0b' : '#ef4444' }}></div>
                                            </div>
                                            <span>{review.efficiency}%</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Strengths */}
                            {review.strengths?.length > 0 && (
                                <div className={styles.evalSection}>
                                    <h4>✅ Strengths</h4>
                                    {review.strengths.map((s, i) => (
                                        <div key={i} className={styles.strengthItem}>• {s}</div>
                                    ))}
                                </div>
                            )}

                            {/* Weaknesses */}
                            {review.weaknesses?.length > 0 && (
                                <div className={styles.evalSection}>
                                    <h4>⚠️ Weaknesses</h4>
                                    {review.weaknesses.map((w, i) => (
                                        <div key={i} className={styles.weaknessItem}>• {w}</div>
                                    ))}
                                </div>
                            )}

                            {/* Suggestions */}
                            {review.suggestions?.length > 0 && (
                                <div className={styles.evalSection}>
                                    <h4>💡 Suggestions</h4>
                                    {review.suggestions.map((s, i) => (
                                        <div key={i} className={styles.suggestion}>💡 {s}</div>
                                    ))}
                                </div>
                            )}

                            <button onClick={nextQuestion} className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
                                Next Question →
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right: Editor ─────────────────── */}
                <div className={styles.editorPanel}>
                    <div className={styles.editorTop}>
                        <select className={styles.langSelect} value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        <div className={styles.editorBtns}>
                            <button
                                onClick={handleRun}
                                className="btn btn-secondary btn-sm"
                                disabled={running || reviewing}
                            >
                                {running ? '⏳ Running...' : '▶ Run'}
                            </button>
                            <button
                                onClick={submitAnswer}
                                className="btn btn-success btn-sm"
                                disabled={reviewing || running}
                            >
                                {reviewing ? '⏳ Evaluating...' : '📤 Submit'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.editorBody}>
                        <MonacoEditor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', monospace",
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                tabSize: 2,
                                automaticLayout: true,
                                padding: { top: 16 },
                            }}
                        />
                    </div>

                    {/* ── Run Output ──────────────────── */}
                    {runOutput && (
                        <div className={styles.runOutputPanel}>
                            <div className={styles.runOutputHeader}>
                                <span>{runOutput.success ? '✅ Output' : '❌ Error'}</span>
                                <button onClick={() => setRunOutput(null)} className={styles.closeBtn}>✕</button>
                            </div>
                            <pre className={`${styles.runOutputBody} ${!runOutput.success ? styles.errorOutput : ''}`}>
                                {runOutput.output || '(No output)'}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function MockInterviewPage() {
    return (
        <AuthProvider>
            <MockInterviewContent />
        </AuthProvider>
    );
}
