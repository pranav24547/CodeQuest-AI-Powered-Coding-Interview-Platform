const express = require('express');
const Problem = require('../models/Problem');
const { auth } = require('../middleware/auth');
const seedProblems = require('../data/problems');

const router = express.Router();

// ── Get All Problems ────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { difficulty, topic, search, page = 1, limit = 50 } = req.query;
        const filter = {};

        if (difficulty) filter.difficulty = difficulty;
        if (topic) filter.topics = topic;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Problem.countDocuments(filter);
        const problems = await Problem.find(filter)
            .select('title slug difficulty topics acceptanceRate totalSubmissions order')
            .sort({ order: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            problems,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

// ── Get Single Problem ──────────────────────────────────────
router.get('/:slug', async (req, res, next) => {
    try {
        const problem = await Problem.findOne({ slug: req.params.slug });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Hide hidden test cases from response
        const response = problem.toObject();
        response.testCases = response.testCases.filter(tc => !tc.isHidden);

        res.json({ problem: response });
    } catch (error) {
        next(error);
    }
});

// ── Seed Problems ───────────────────────────────────────────
router.post('/seed', async (req, res, next) => {
    try {
        const existing = await Problem.countDocuments();
        if (existing > 0) {
            return res.json({ message: `Database already has ${existing} problems` });
        }

        await Problem.insertMany(seedProblems);
        res.json({ message: `Seeded ${seedProblems.length} problems successfully` });
    } catch (error) {
        next(error);
    }
});

// ── Get topics list ─────────────────────────────────────────
router.get('/meta/topics', async (req, res, next) => {
    try {
        const topics = await Problem.distinct('topics');
        res.json({ topics });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
