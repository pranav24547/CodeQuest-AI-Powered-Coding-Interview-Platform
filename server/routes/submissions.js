const express = require('express');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { executeCode } = require('../services/executionService');
const { reviewSolution } = require('../services/aiService');

const router = express.Router();

// ── Run Code (no save) ─────────────────────────────────────
router.post('/run', auth, async (req, res, next) => {
    try {
        const { code, language, problemId, testCases } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'Code and language are required' });
        }

        const results = await executeCode(code, language, testCases || []);
        res.json({ results });
    } catch (error) {
        next(error);
    }
});

// ── Submit Solution ─────────────────────────────────────────
router.post('/submit', auth, async (req, res, next) => {
    try {
        const { code, language, problemId } = req.body;

        if (!code || !language || !problemId) {
            return res.status(400).json({ error: 'Code, language, and problemId are required' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Execute code against all test cases (including hidden)
        const allTestCases = problem.testCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
        }));

        const results = await executeCode(code, language, allTestCases);

        const passedTests = results.filter(r => r.passed).length;
        const allPassed = passedTests === results.length;

        // Determine status
        let status = 'Wrong Answer';
        if (allPassed) status = 'Accepted';
        else if (results.some(r => r.error && r.error.includes('timeout'))) status = 'Time Limit Exceeded';
        else if (results.some(r => r.error && !r.error.includes('timeout'))) status = 'Runtime Error';

        // Get AI review (async, non-blocking for the response)
        let aiReview = null;
        try {
            aiReview = await reviewSolution(code, language, problem.title, problem.description);
        } catch (e) {
            console.log('AI review skipped:', e.message);
        }

        // Create submission
        const submission = new Submission({
            userId: req.userId,
            problemId,
            code,
            language,
            status,
            runtime: results.reduce((sum, r) => sum + (r.runtime || 0), 0),
            testResults: results.map((r, i) => ({
                testCase: i + 1,
                passed: r.passed,
                input: allTestCases[i].input,
                expectedOutput: allTestCases[i].expectedOutput,
                actualOutput: r.output,
                runtime: r.runtime,
                error: r.error,
            })),
            passedTests,
            totalTests: results.length,
            aiReview,
        });

        await submission.save();

        // Update problem stats
        problem.totalSubmissions += 1;
        if (allPassed) problem.acceptedSubmissions += 1;
        problem.acceptanceRate = Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
        await problem.save();

        // Update user stats
        const user = await User.findById(req.userId);
        user.totalSubmissions += 1;
        if (allPassed) {
            user.acceptedSubmissions += 1;
            const alreadySolved = user.solvedProblems.some(
                sp => sp.problemId.toString() === problemId
            );
            if (!alreadySolved) {
                user.solvedProblems.push({ problemId, language });
                user.rating += problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 20 : 35;
            }
        }

        // Update topic stats
        for (const topic of problem.topics) {
            const stats = user.topicStats.get(topic) || { attempted: 0, solved: 0, avgTime: 0 };
            stats.attempted += 1;
            if (allPassed) stats.solved += 1;
            user.topicStats.set(topic, stats);
        }

        await user.save();

        res.json({
            submission: submission.toObject(),
            status,
            passedTests,
            totalTests: results.length,
        });
    } catch (error) {
        next(error);
    }
});

// ── Get User Submissions ────────────────────────────────────
router.get('/user', auth, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const submissions = await Submission.find({ userId: req.userId })
            .populate('problemId', 'title slug difficulty')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Submission.countDocuments({ userId: req.userId });

        res.json({
            submissions,
            pagination: { page: parseInt(page), limit: parseInt(limit), total },
        });
    } catch (error) {
        next(error);
    }
});

// ── Get Submission by ID ────────────────────────────────────
router.get('/:id', auth, async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('problemId', 'title slug difficulty');

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ submission });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
