// Multi-language code execution
// Priority: 1) Backend server (localhost:5000) → 2) Browser sandbox (JS only)

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Run JavaScript in browser sandbox (instant, no server needed)
function runJavaScript(code, input = '') {
    const logs = [];
    // Simulate input() for JS by providing lines from stdin
    const inputLines = input.split('\n');
    let inputIndex = 0;

    const mockConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => logs.push('ERROR: ' + args.map(a => String(a)).join(' ')),
        warn: (...args) => logs.push('WARN: ' + args.map(a => String(a)).join(' ')),
    };
    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', code);
        const result = fn(mockConsole);
        if (result !== undefined && logs.length === 0) {
            logs.push(typeof result === 'object' ? JSON.stringify(result) : String(result));
        }
        if (logs.length === 0) logs.push('(No output — add console.log() to see results)');
        return { success: true, output: logs.join('\n') };
    } catch (err) {
        return { success: false, output: err.message };
    }
}

// Run via backend /api/execute endpoint
async function runViaBackend(code, language, input = '') {
    const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input }),
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
}

// Main entry point — supports JS, Python, Java, C++
// input = optional stdin string (e.g. example test case inputs)
export async function executeCode(code, language, input = '') {
    // JavaScript: run in browser for instant feedback
    if (language === 'javascript') {
        try {
            return await runViaBackend(code, language, input);
        } catch {
            return runJavaScript(code, input);
        }
    }

    // Python, Java, C++: must use backend
    try {
        return await runViaBackend(code, language, input);
    } catch (err) {
        return {
            success: false,
            output: `Cannot connect to the backend server.\n\nTo run ${language} code:\n1. Start the backend: cd server && node index.js\n2. Make sure ${language === 'python' ? 'Python' : language === 'java' ? 'Java (JDK)' : 'g++ (MinGW)'} is installed on your system`,
        };
    }
}

export default executeCode;
