const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    problems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
    }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, default: 0 },
        solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
        joinedAt: { type: Date, default: Date.now },
    }],
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Contest', contestSchema);
