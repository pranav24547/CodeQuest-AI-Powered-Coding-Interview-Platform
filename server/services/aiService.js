const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

function getModel() {
    if (!model) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your-gemini-api-key') {
            return null;
        }
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    return model;
}

// Safe JSON parse from AI response
function safeParseJSON(text) {
    // Remove markdown code fences if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Try to find JSON in the text
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        cleaned = jsonMatch[0];
    }
    return JSON.parse(cleaned);
}

// ── Review Solution ─────────────────────────────────────────
async function reviewSolution(code, language, problemTitle, problemDescription) {
    const ai = getModel();
    if (!ai) {
        return getMockReview();
    }

    try {
        const prompt = `You are an expert coding interview evaluator. Analyze this ${language} solution for the problem "${problemTitle}".

Problem: ${problemDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a JSON response with exactly this structure (no markdown, just raw JSON):
{
  "score": <number 0-100>,
  "timeComplexity": "<Big O notation>",
  "spaceComplexity": "<Big O notation>",
  "feedback": "<2-3 sentence overall assessment>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "codeQuality": "<one of: Excellent, Good, Average, Needs Improvement>"
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        console.error('AI review error:', error.message);
        return getMockReview();
    }
}

// ── Generate Hint ───────────────────────────────────────────
async function generateHint(problemTitle, problemDescription, userCode, language) {
    const ai = getModel();
    if (!ai) {
        return { hint: 'Think about the edge cases and try using a different data structure.' };
    }

    try {
        const prompt = `You are a helpful coding tutor. The student is working on "${problemTitle}".

Problem: ${problemDescription}

Their current attempt in ${language}:
\`\`\`${language}
${userCode || 'No code written yet'}
\`\`\`

Give a helpful hint WITHOUT giving away the full solution. Guide them toward the right approach. Respond with JSON:
{
  "hint": "<your hint here>",
  "approach": "<name of the algorithm or technique to consider>",
  "difficulty": "<Easy/Medium/Hard>"
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        return { hint: 'Consider the time complexity of your approach. Can you optimize it?' };
    }
}

// ── Explain Mistake ─────────────────────────────────────────
async function explainMistake(code, language, problemTitle, error, testResults) {
    const ai = getModel();
    if (!ai) {
        return { explanation: 'Check your edge cases and make sure you handle empty inputs.' };
    }

    try {
        const failedTests = testResults?.filter(t => !t.passed)?.slice(0, 3) || [];
        const prompt = `You are a coding mentor. The student's ${language} solution for "${problemTitle}" has issues.

Code:
\`\`\`${language}
${code}
\`\`\`

${error ? `Error: ${error}` : ''}
${failedTests.length ? `Failed test cases: ${JSON.stringify(failedTests)}` : ''}

Explain what went wrong clearly and kindly. Don't give the full solution, but help them understand the mistake. Respond with JSON:
{
  "explanation": "<clear explanation of the mistake>",
  "bugLocation": "<describe where the bug likely is>",
  "conceptToReview": "<what concept they should review>"
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        return { explanation: 'Review your logic carefully. Check boundary conditions and off-by-one errors.' };
    }
}

// ── Mock Interview Question ─────────────────────────────────
async function generateInterviewQuestion(topic, difficulty, previousQuestions) {
    const ai = getModel();
    if (!ai) {
        return getMockInterviewQuestion(topic, difficulty);
    }

    try {
        const prompt = `You are a senior tech interviewer at a FAANG company. Generate a coding interview question.

Topic: ${topic || 'General DSA'}
Difficulty: ${difficulty || 'Medium'}
${previousQuestions?.length ? `Avoid these already-asked questions: ${previousQuestions.join(', ')}` : ''}

Respond with JSON:
{
  "title": "<question title>",
  "description": "<full problem description with examples>",
  "examples": [{"input": "<input>", "output": "<output>", "explanation": "<explanation>"}],
  "constraints": "<constraints>",
  "hints": ["<hint1>", "<hint2>"],
  "followUp": "<a harder follow-up question>",
  "expectedApproach": "<optimal approach name>",
  "timeLimit": <minutes as number>
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        return getMockInterviewQuestion(topic, difficulty);
    }
}

// ── Resume-Based Interview Question ─────────────────────────
async function generateResumeBasedQuestion(resumeText, difficulty, previousQuestions) {
    const ai = getModel();

    // Extract skills/topics from resume for fallback
    const extractedTopics = extractTopicsFromResume(resumeText);

    if (!ai) {
        // Without AI, pick questions based on extracted keywords
        return getResumeBasedFallbackQuestion(extractedTopics, difficulty, previousQuestions);
    }

    try {
        const prompt = `You are a senior tech interviewer at a FAANG company. You have the candidate's resume below. Generate a coding interview question that is DIRECTLY RELEVANT to the skills, technologies, and experience mentioned in their resume. The question should test concepts the candidate claims to know.

RESUME:
${resumeText}

Difficulty: ${difficulty || 'Medium'}
${previousQuestions?.length ? `Avoid these already-asked questions: ${previousQuestions.join(', ')}` : ''}

Important: The question MUST be based on the skills and technologies in the resume. For example:
- If the resume mentions "Python" and "data processing", ask about data structure manipulation
- If the resume mentions "React" and "frontend", ask about DOM-related algorithms or state management patterns
- If the resume mentions "databases", ask about SQL-related data transformations
- If the resume mentions "machine learning", ask about array/matrix operations

Respond with JSON:
{
  "title": "<question title>",
  "description": "<full problem description with examples>",
  "examples": [{"input": "<input>", "output": "<output>", "explanation": "<explanation>"}],
  "constraints": "<constraints>",
  "hints": ["<hint1>", "<hint2>"],
  "followUp": "<a harder follow-up question>",
  "expectedApproach": "<optimal approach name>",
  "timeLimit": <minutes as number>,
  "resumeRelevance": "<1-2 sentence explanation of why this question is relevant to the candidate's resume>"
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        console.error('Resume-based question generation error:', error.message);
        return getResumeBasedFallbackQuestion(extractedTopics, difficulty, previousQuestions);
    }
}

// ── Evaluate Mock Interview Answer ──────────────────────────
async function evaluateInterviewAnswer(code, language, questionTitle, questionDescription, executionOutput) {
    const ai = getModel();
    if (!ai) {
        return getSmartFallbackEvaluation(code, language, questionTitle, questionDescription, executionOutput);
    }

    try {
        const prompt = `You are an expert coding interview evaluator at a FAANG company. A candidate just submitted their solution during a mock interview.

QUESTION: ${questionTitle}
${questionDescription}

CANDIDATE'S CODE (${language}):
\`\`\`${language}
${code}
\`\`\`

${executionOutput ? `CODE EXECUTION OUTPUT:\n${executionOutput}` : 'Code was not executed.'}

Evaluate the solution thoroughly. Consider:
1. Does the code correctly solve the problem?
2. Is the approach optimal?
3. Code quality and readability
4. Edge case handling
5. Time and space complexity

Respond with JSON:
{
  "score": <number 0-100>,
  "correctness": <number 0-100>,
  "efficiency": <number 0-100>,
  "codeQuality": "<one of: Excellent, Good, Average, Needs Improvement, Poor>",
  "timeComplexity": "<Big O notation>",
  "spaceComplexity": "<Big O notation>",
  "feedback": "<3-4 sentence detailed assessment of the solution>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "isCorrect": <true or false>,
  "wouldPass": <true or false - would this pass the interview>
}`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        console.error('AI evaluation error:', error.message);
        return getSmartFallbackEvaluation(code, language, questionTitle, questionDescription, executionOutput);
    }
}

// ── Detect Weak Topics ──────────────────────────────────────
async function detectWeakTopics(topicStats) {
    const ai = getModel();
    const statsArray = [];

    if (topicStats instanceof Map) {
        topicStats.forEach((value, key) => {
            statsArray.push({ topic: key, ...value });
        });
    } else if (typeof topicStats === 'object') {
        Object.entries(topicStats).forEach(([key, value]) => {
            statsArray.push({ topic: key, ...value });
        });
    }

    if (!ai || statsArray.length < 3) {
        return statsArray
            .filter(s => s.attempted > 0)
            .map(s => ({
                topic: s.topic,
                strength: s.attempted > 0 ? Math.round((s.solved / s.attempted) * 100) : 0,
                status: (s.solved / s.attempted) < 0.5 ? 'weak' : (s.solved / s.attempted) < 0.8 ? 'moderate' : 'strong',
            }))
            .sort((a, b) => a.strength - b.strength);
    }

    try {
        const prompt = `Analyze these coding topic statistics and identify weak areas:

${JSON.stringify(statsArray)}

Respond with JSON array of topics sorted by weakness:
[{"topic": "<name>", "strength": <0-100>, "status": "<weak/moderate/strong>", "recommendation": "<study tip>"}]`;

        const result = await ai.generateContent(prompt);
        return safeParseJSON(result.response.text());
    } catch (error) {
        return statsArray.map(s => ({
            topic: s.topic,
            strength: s.attempted > 0 ? Math.round((s.solved / s.attempted) * 100) : 0,
            status: 'unknown',
        }));
    }
}

// ══════════════════════════════════════════════════════════════
// ── Helper Functions ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

// Extract topics/skills from resume text for fallback question selection
function extractTopicsFromResume(resumeText) {
    if (!resumeText) return [];
    const text = resumeText.toLowerCase();

    const skillMap = {
        'Arrays': ['array', 'list', 'vector', 'collection'],
        'Strings': ['string', 'text', 'regex', 'pattern matching', 'parsing'],
        'Linked Lists': ['linked list', 'linkedlist', 'node', 'pointer'],
        'Trees': ['tree', 'binary tree', 'bst', 'binary search tree', 'trie'],
        'Graphs': ['graph', 'bfs', 'dfs', 'shortest path', 'dijkstra', 'network'],
        'Dynamic Programming': ['dynamic programming', 'dp', 'memoization', 'optimization', 'machine learning', 'ml', 'ai'],
        'Hash Tables': ['hash', 'hashmap', 'dictionary', 'map', 'set', 'cache', 'redis'],
        'Sorting': ['sort', 'merge sort', 'quick sort', 'sorting'],
        'Stack & Queue': ['stack', 'queue', 'fifo', 'lifo', 'deque'],
        'Recursion': ['recursion', 'recursive', 'backtracking'],
        'Database': ['sql', 'database', 'mongodb', 'mysql', 'postgresql', 'nosql', 'orm'],
        'API Design': ['api', 'rest', 'graphql', 'endpoint', 'microservice', 'backend'],
        'Frontend': ['react', 'angular', 'vue', 'frontend', 'front-end', 'css', 'html', 'dom', 'ui', 'ux'],
        'Python': ['python', 'django', 'flask', 'pandas', 'numpy'],
        'Java': ['java', 'spring', 'maven', 'gradle', 'jvm'],
        'JavaScript': ['javascript', 'node', 'express', 'typescript', 'next.js', 'react'],
        'System Design': ['system design', 'architecture', 'scalable', 'microservices', 'distributed'],
    };

    const found = [];
    for (const [topic, keywords] of Object.entries(skillMap)) {
        if (keywords.some(kw => text.includes(kw))) {
            found.push(topic);
        }
    }
    return found.length > 0 ? found : ['Arrays', 'Strings', 'Hash Tables'];
}

// Resume-based fallback questions organized by topic
function getResumeBasedFallbackQuestion(topics, difficulty, previousQuestions) {
    const questionPool = {
        'Arrays': [
            { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.', examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1]' }], constraints: '2 <= nums.length <= 10^4', hints: ['Use a hash map for O(n) solution', 'Consider what value you need to find'], expectedApproach: 'Hash Map', timeLimit: 15 },
            { title: 'Maximum Subarray', description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.', examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }], constraints: '1 <= nums.length <= 10^5', hints: ['Consider Kadane\'s algorithm', 'Think about when to reset your running sum'], expectedApproach: 'Kadane\'s Algorithm', timeLimit: 20 },
            { title: 'Product of Array Except Self', description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.', examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'Product of all except self for each position' }], constraints: '2 <= nums.length <= 10^5', hints: ['Use prefix and suffix products', 'Can you do it with O(1) extra space?'], expectedApproach: 'Prefix/Suffix Products', timeLimit: 20 },
        ],
        'Strings': [
            { title: 'Valid Anagram', description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.', examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true' }], constraints: '1 <= s.length, t.length <= 5 * 10^4', hints: ['Count character frequencies', 'Sorting also works but is slower'], expectedApproach: 'Hash Map Counting', timeLimit: 10 },
            { title: 'Longest Substring Without Repeating Characters', description: 'Given a string s, find the length of the longest substring without repeating characters.', examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length 3.' }], constraints: '0 <= s.length <= 5 * 10^4', hints: ['Use sliding window technique', 'Keep track of character positions'], expectedApproach: 'Sliding Window', timeLimit: 20 },
        ],
        'Hash Tables': [
            { title: 'Group Anagrams', description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.', examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }], constraints: '1 <= strs.length <= 10^4', hints: ['Use sorted characters as hash keys', 'Or use character count as key'], expectedApproach: 'Hash Map with sorted key', timeLimit: 20 },
            { title: 'Top K Frequent Elements', description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.', examples: [{ input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' }], constraints: '1 <= nums.length <= 10^5', hints: ['Count frequencies first', 'Use a heap or bucket sort'], expectedApproach: 'Hash Map + Heap', timeLimit: 20 },
        ],
        'Dynamic Programming': [
            { title: 'Climbing Stairs', description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?', examples: [{ input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }], constraints: '1 <= n <= 45', hints: ['This is similar to Fibonacci', 'f(n) = f(n-1) + f(n-2)'], expectedApproach: 'Dynamic Programming', timeLimit: 15 },
            { title: 'Coin Change', description: 'Given an integer array coins representing coin denominations and an integer amount, return the fewest number of coins needed to make up that amount. If not possible, return -1.', examples: [{ input: 'coins = [1,5,11], amount = 15', output: '3', explanation: '15 = 5 + 5 + 5' }], constraints: '1 <= coins.length <= 12', hints: ['Use bottom-up DP', 'dp[i] = min coins to make amount i'], expectedApproach: 'Bottom-up DP', timeLimit: 25 },
        ],
        'Trees': [
            { title: 'Maximum Depth of Binary Tree', description: 'Given the root of a binary tree, return its maximum depth. A binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.', examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '3' }], constraints: 'The number of nodes is in range [0, 10^4]', hints: ['Use recursion: depth = 1 + max(left, right)', 'BFS also works - count levels'], expectedApproach: 'DFS Recursion', timeLimit: 10 },
        ],
        'Graphs': [
            { title: 'Number of Islands', description: 'Given an m x n 2D binary grid which represents a map of "1"s (land) and "0"s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.', examples: [{ input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]', output: '2' }], constraints: 'm, n <= 300', hints: ['Use BFS or DFS to explore connected land', 'Mark visited cells'], expectedApproach: 'BFS/DFS', timeLimit: 20 },
        ],
        'Linked Lists': [
            { title: 'Reverse Linked List', description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.', examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }], constraints: 'The number of nodes is in range [0, 5000]', hints: ['Use three pointers: prev, current, next', 'Can also solve recursively'], expectedApproach: 'Iterative Three Pointers', timeLimit: 15 },
        ],
        'Stack & Queue': [
            { title: 'Valid Parentheses', description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type and in the correct order.', examples: [{ input: 's = "()[]{}"', output: 'true' }, { input: 's = "(]"', output: 'false' }], constraints: '1 <= s.length <= 10^4', hints: ['Use a stack', 'Push opening, pop and match closing'], expectedApproach: 'Stack', timeLimit: 15 },
        ],
        'Sorting': [
            { title: 'Merge Intervals', description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.', examples: [{ input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap' }], constraints: '1 <= intervals.length <= 10^4', hints: ['Sort by start time first', 'Then merge linearly'], expectedApproach: 'Sort + Linear Merge', timeLimit: 20 },
        ],
    };

    // Collect questions from topics found in resume
    let candidates = [];
    for (const topic of topics) {
        if (questionPool[topic]) {
            candidates.push(...questionPool[topic].map(q => ({ ...q, resumeRelevance: `This question tests ${topic} skills found in your resume.` })));
        }
    }

    // Add general DSA fallback
    if (candidates.length === 0) {
        candidates = Object.values(questionPool).flat().map(q => ({ ...q, resumeRelevance: 'General coding skills assessment.' }));
    }

    // Filter out previously asked
    const prevTitles = previousQuestions || [];
    const available = candidates.filter(q => !prevTitles.includes(q.title));
    const pool = available.length > 0 ? available : candidates;

    return pool[Math.floor(Math.random() * pool.length)];
}

// Smart fallback evaluation when AI is unavailable
function getSmartFallbackEvaluation(code, language, questionTitle, questionDescription, executionOutput) {
    const trimmed = (code || '').trim();
    const lines = trimmed.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#'));

    // Completely empty or template-only code
    if (lines.length <= 2) {
        return {
            score: 5,
            correctness: 0,
            efficiency: 0,
            codeQuality: 'Poor',
            timeComplexity: 'N/A',
            spaceComplexity: 'N/A',
            feedback: 'Your submission is essentially empty. Please write a complete solution that addresses the problem before submitting.',
            strengths: [],
            weaknesses: ['No solution code provided', 'The problem was not attempted'],
            suggestions: ['Read the problem statement carefully', 'Start with a brute-force approach', 'Write pseudocode first, then translate to code'],
            isCorrect: false,
            wouldPass: false,
        };
    }

    let correctnessScore = 0;
    let efficiencyScore = 30;
    let qualityScore = 20;

    // Check if the output looks correct
    const hasOutput = executionOutput && !executionOutput.includes('Error') && !executionOutput.includes('error') && executionOutput.trim().length > 0 && !executionOutput.includes('No output');
    if (hasOutput) {
        correctnessScore += 40;
    }

    // Check code structure
    const hasFunctionDef = /function\s+\w+|const\s+\w+\s*=\s*\(|=\>|def\s+\w+|public\s+(static\s+)?(void|int|String|boolean|long|double)/.test(trimmed);
    const hasLoops = /for\s*\(|while\s*\(|forEach|\.map\(|\.reduce\(|for\s+\w+\s+in\s|range\(/.test(trimmed);
    const hasReturn = /return\s|print\(|System\.out\.print|cout\s*<<|console\.log/.test(trimmed);
    const hasConditionals = /if\s*\(|if\s+\w+|else\s|elif|switch\s*\(/.test(trimmed);
    const usesDataStructures = /Map|Set|Object|dict\(|list\(|ArrayList|HashMap|defaultdict|Counter|\[\]|\{\}/.test(trimmed);
    const hasComments = /\/\/|\/*|#\s/.test(code);

    if (hasFunctionDef) { qualityScore += 10; correctnessScore += 10; }
    if (hasLoops) { correctnessScore += 10; efficiencyScore += 10; }
    if (hasReturn) { correctnessScore += 10; }
    if (hasConditionals) { correctnessScore += 10; qualityScore += 5; }
    if (usesDataStructures) { efficiencyScore += 10; }
    if (hasComments) { qualityScore += 5; }
    if (lines.length >= 5) { qualityScore += 5; correctnessScore += 5; }
    if (lines.length >= 10) { qualityScore += 5; }
    if (lines.length >= 15) { qualityScore += 5; }

    // Cap scores
    correctnessScore = Math.min(correctnessScore, 95);
    efficiencyScore = Math.min(efficiencyScore, 90);
    qualityScore = Math.min(qualityScore, 90);

    const score = Math.round(correctnessScore * 0.5 + efficiencyScore * 0.25 + qualityScore * 0.25);

    let quality = 'Poor';
    if (score >= 80) quality = 'Excellent';
    else if (score >= 60) quality = 'Good';
    else if (score >= 40) quality = 'Average';
    else if (score >= 20) quality = 'Needs Improvement';

    const strengths = [];
    const weaknesses = [];
    const suggestions = [];

    if (hasFunctionDef) strengths.push('Code is properly structured in a function');
    else { weaknesses.push('Code is not wrapped in a function'); suggestions.push('Organize your code into a named function'); }

    if (hasLoops) strengths.push('Uses iteration to process data');
    if (hasConditionals) strengths.push('Handles conditional logic');
    else { weaknesses.push('No conditional checks for edge cases'); suggestions.push('Add edge case handling (empty input, single element, etc.)'); }

    if (usesDataStructures) strengths.push('Uses appropriate data structures');
    else suggestions.push('Consider using hash maps or sets for better efficiency');

    if (hasOutput) strengths.push('Code produces output');
    else { weaknesses.push('Code produced no output or had errors'); suggestions.push('Make sure your code compiles and produces output'); }

    if (hasComments) strengths.push('Code has comments for readability');
    if (!hasReturn) { weaknesses.push('Missing return statement'); suggestions.push('Add a return statement for your computed result'); }

    if (suggestions.length === 0) suggestions.push('Consider optimizing for large inputs');

    const complexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
    const timeIdx = hasLoops ? (usesDataStructures ? 2 : (/for.*for|while.*while/.test(trimmed) ? 4 : 2)) : 0;

    const isCorrect = hasOutput && correctnessScore >= 50;

    return {
        score,
        correctness: correctnessScore,
        efficiency: efficiencyScore,
        codeQuality: quality,
        timeComplexity: complexities[Math.min(timeIdx, complexities.length - 1)],
        spaceComplexity: usesDataStructures ? 'O(n)' : 'O(1)',
        feedback: score >= 70
            ? `Good solution for "${questionTitle}"! Your code is well-structured and produces correct output. Consider edge cases and optimization.`
            : score >= 40
                ? `Partial solution for "${questionTitle}". Your approach shows understanding but needs more work on correctness and completeness.`
                : `Your solution for "${questionTitle}" needs significant improvement. Focus on understanding the problem requirements and writing a complete solution.`,
        strengths,
        weaknesses,
        suggestions,
        isCorrect,
        wouldPass: score >= 65,
    };
}

// ── Mock/Fallback Data ──────────────────────────────────────
function getMockReview() {
    return {
        score: 72,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        feedback: 'Your solution works but could be optimized. Consider edge cases and code readability. The overall approach is reasonable.',
        suggestions: [
            'Add input validation for edge cases',
            'Consider using more descriptive variable names',
            'Think about whether a different data structure could improve performance',
        ],
        codeQuality: 'Good',
    };
}

function getMockInterviewQuestion(topic, difficulty) {
    const questions = {
        Easy: {
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume each input has exactly one solution.',
            examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' }],
            constraints: '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9',
            hints: ['Try using a hash map', 'One-pass solution is possible'],
            followUp: 'Can you do it in one pass?',
            expectedApproach: 'Hash Map',
            timeLimit: 15,
        },
        Medium: {
            title: 'Longest Substring Without Repeating Characters',
            description: 'Given a string s, find the length of the longest substring without repeating characters.',
            examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with length 3.' }],
            constraints: '0 <= s.length <= 5 * 10^4',
            hints: ['Use sliding window technique', 'Keep track of character positions'],
            followUp: 'Can you solve it with O(1) extra space for a fixed character set?',
            expectedApproach: 'Sliding Window',
            timeLimit: 20,
        },
        Hard: {
            title: 'Merge K Sorted Lists',
            description: 'You are given an array of k linked-lists, each sorted in ascending order. Merge all lists into one sorted linked-list and return it.',
            examples: [{ input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', explanation: 'Merging all sorted lists into one.' }],
            constraints: 'k == lists.length, 0 <= k <= 10^4',
            hints: ['Use a min-heap / priority queue', 'Divide and conquer approach also works'],
            followUp: 'What is the time complexity of your solution?',
            expectedApproach: 'Min Heap / Divide and Conquer',
            timeLimit: 30,
        },
    };
    return questions[difficulty] || questions['Medium'];
}

module.exports = {
    reviewSolution,
    generateHint,
    explainMistake,
    generateInterviewQuestion,
    generateResumeBasedQuestion,
    evaluateInterviewAnswer,
    detectWeakTopics,
};
