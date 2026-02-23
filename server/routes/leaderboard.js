const express = require('express');
const User = require('../models/User');

const router = express.Router();

// ── Global Leaderboard ──────────────────────────────────────
router.get('/global', async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const users = await User.find()
            .select('username avatar rating solvedProblems totalSubmissions acceptedSubmissions streak')
            .sort({ rating: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments();

        const leaderboard = users.map((user, index) => ({
            rank: (page - 1) * limit + index + 1,
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
            problemsSolved: user.solvedProblems?.length || 0,
            totalSubmissions: user.totalSubmissions,
            acceptanceRate: user.totalSubmissions > 0
                ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
                : 0,
            streak: user.streak,
        }));

        res.json({
            leaderboard,
            pagination: { page: parseInt(page), limit: parseInt(limit), total },
        });
    } catch (error) {
        next(error);
    }
});

// ── User Stats ──────────────────────────────────────────────
router.get('/stats/:username', async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username avatar rating solvedProblems topicStats totalSubmissions acceptedSubmissions streak createdAt');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                username: user.username,
                avatar: user.avatar,
                rating: user.rating,
                problemsSolved: user.solvedProblems?.length || 0,
                totalSubmissions: user.totalSubmissions,
                acceptanceRate: user.totalSubmissions > 0
                    ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
                    : 0,
                streak: user.streak,
                topicStats: user.topicStats,
                joinedAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
