const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// ── Register ────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        next(error);
    }
});

// ── Login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        next(error);
    }
});

// ── Get Current User ────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user.toJSON() });
});

// ── Update Profile ──────────────────────────────────────────
router.put('/profile', auth, async (req, res, next) => {
    try {
        const { username, avatar } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (avatar) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
        res.json({ user: user.toJSON() });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
