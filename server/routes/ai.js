const express = require('express');
const { auth } = require('../middleware/auth');
const {
    reviewSolution,
    generateHint,
    explainMistake,
    generateInterviewQuestion,
    generateResumeBasedQuestion,
    evaluateInterviewAnswer,
    detectWeakTopics,
} = require('../services/aiService');

const router = express.Router();

// ── AI Code Review ──────────────────────────────────────────
router.post('/review', async (req, res, next) => {
    try {
        const { code, language, problemTitle, problemDescription } = req.body;
        const review = await reviewSolution(code, language, problemTitle, problemDescription);
        res.json({ review });
    } catch (error) {
        next(error);
    }
});

// ── Get Hint ────────────────────────────────────────────────
router.post('/hint', auth, async (req, res, next) => {
    try {
        const { problemTitle, problemDescription, code, language } = req.body;
        const hint = await generateHint(problemTitle, problemDescription, code, language);
        res.json(hint);
    } catch (error) {
        next(error);
    }
});

// ── Explain Mistake ─────────────────────────────────────────
router.post('/explain-mistake', auth, async (req, res, next) => {
    try {
        const { code, language, problemTitle, error, testResults } = req.body;
        const explanation = await explainMistake(code, language, problemTitle, error, testResults);
        res.json(explanation);
    } catch (error) {
        next(error);
    }
});

// ── Mock Interview Question ─────────────────────────────────
router.post('/mock-interview', async (req, res, next) => {
    try {
        const { topic, difficulty, previousQuestions } = req.body;
        const question = await generateInterviewQuestion(topic, difficulty, previousQuestions);
        res.json({ question });
    } catch (error) {
        next(error);
    }
});

// ── Resume-Based Interview Question ─────────────────────────
router.post('/mock-interview/resume', async (req, res, next) => {
    try {
        const { resumeText, difficulty, previousQuestions } = req.body;
        if (!resumeText || resumeText.trim().length < 20) {
            return res.status(400).json({ error: 'Please provide your resume text (at least 20 characters)' });
        }
        const question = await generateResumeBasedQuestion(resumeText, difficulty, previousQuestions);
        res.json({ question });
    } catch (error) {
        next(error);
    }
});

// ── Evaluate Mock Interview Answer ──────────────────────────
router.post('/mock-interview/evaluate', async (req, res, next) => {
    try {
        const { code, language, questionTitle, questionDescription, executionOutput } = req.body;
        if (!code || !language || !questionTitle) {
            return res.status(400).json({ error: 'Code, language, and question title are required' });
        }
        const evaluation = await evaluateInterviewAnswer(
            code, language, questionTitle, questionDescription, executionOutput
        );
        res.json({ evaluation });
    } catch (error) {
        next(error);
    }
});

// ── Detect Weak Topics ──────────────────────────────────────
router.get('/weak-topics', auth, async (req, res, next) => {
    try {
        const topics = await detectWeakTopics(req.user.topicStats);
        res.json({ topics });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
