const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    testCase: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    input: String,
    expectedOutput: String,
    actualOutput: String,
    runtime: Number, // ms
    error: String,
});

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        enum: ['javascript', 'python', 'cpp', 'java'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error', 'Pending'],
        default: 'Pending',
    },
    runtime: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    testResults: [testResultSchema],
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    aiReview: {
        score: { type: Number, min: 0, max: 100 },
        timeComplexity: String,
        spaceComplexity: String,
        feedback: String,
        suggestions: [String],
        codeQuality: String,
    },
}, {
    timestamps: true,
});

submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
