const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String, default: '' },
});

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
    },
    topics: [{
        type: String,
        enum: [
            'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
            'Dynamic Programming', 'Sorting', 'Searching', 'Hash Tables',
            'Stack', 'Queue', 'Recursion', 'Math', 'Greedy', 'Backtracking',
            'Bit Manipulation', 'Two Pointers', 'Sliding Window',
        ],
    }],
    testCases: [testCaseSchema],
    starterCode: {
        javascript: { type: String, default: '' },
        python: { type: String, default: '' },
        cpp: { type: String, default: '' },
        java: { type: String, default: '' },
    },
    constraints: { type: String, default: '' },
    hints: [{ type: String }],
    examples: [{
        input: String,
        output: String,
        explanation: String,
    }],
    acceptanceRate: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
}, {
    timestamps: true,
});

problemSchema.index({ slug: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ topics: 1 });

module.exports = mongoose.model('Problem', problemSchema);
