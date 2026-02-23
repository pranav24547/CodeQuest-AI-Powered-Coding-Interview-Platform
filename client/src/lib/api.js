const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('codequest_token');
        }
        return null;
    }

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running.');
            }
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint);
    }

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ── Auth ────────────────────────────────────────────
    login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    register(username, email, password) {
        return this.post('/auth/register', { username, email, password });
    }

    getMe() {
        return this.get('/auth/me');
    }

    // ── Problems ────────────────────────────────────────
    getProblems(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/problems?${query}`);
    }

    getProblem(slug) {
        return this.get(`/problems/${slug}`);
    }

    seedProblems() {
        return this.post('/problems/seed');
    }

    // ── Submissions ─────────────────────────────────────
    runCode(code, language, testCases) {
        return this.post('/submissions/run', { code, language, testCases });
    }

    submitSolution(code, language, problemId) {
        return this.post('/submissions/submit', { code, language, problemId });
    }

    getUserSubmissions(page = 1) {
        return this.get(`/submissions/user?page=${page}`);
    }

    // ── AI ──────────────────────────────────────────────
    getAIReview(code, language, problemTitle, problemDescription) {
        return this.post('/ai/review', { code, language, problemTitle, problemDescription });
    }

    getHint(problemTitle, problemDescription, code, language) {
        return this.post('/ai/hint', { problemTitle, problemDescription, code, language });
    }

    explainMistake(code, language, problemTitle, error, testResults) {
        return this.post('/ai/explain-mistake', { code, language, problemTitle, error, testResults });
    }

    getMockQuestion(topic, difficulty, previousQuestions) {
        return this.post('/ai/mock-interview', { topic, difficulty, previousQuestions });
    }

    getResumeBasedQuestion(resumeText, difficulty, previousQuestions) {
        return this.post('/ai/mock-interview/resume', { resumeText, difficulty, previousQuestions });
    }

    evaluateInterviewAnswer(code, language, questionTitle, questionDescription, executionOutput) {
        return this.post('/ai/mock-interview/evaluate', {
            code, language, questionTitle, questionDescription, executionOutput,
        });
    }

    getWeakTopics() {
        return this.get('/ai/weak-topics');
    }

    // ── Leaderboard ─────────────────────────────────────
    getLeaderboard(page = 1) {
        return this.get(`/leaderboard/global?page=${page}`);
    }

    getUserStats(username) {
        return this.get(`/leaderboard/stats/${username}`);
    }
}

const api = new ApiClient();
export default api;
