/**
 * Code Execution Service
 * 
 * Runs user code against test cases. In production, this would use Docker
 * containers for sandboxed execution. For development, it uses Node.js
 * vm module for JavaScript and simulated execution for other languages.
 */

const vm = require('vm');

const TIMEOUT_MS = 5000; // 5 second timeout
const MAX_OUTPUT_LENGTH = 10000;

// ── Execute Code ────────────────────────────────────────────
async function executeCode(code, language, testCases) {
    if (!testCases || testCases.length === 0) {
        return [{ passed: false, output: '', error: 'No test cases provided', runtime: 0 }];
    }

    const results = [];

    for (const testCase of testCases) {
        try {
            let result;
            switch (language) {
                case 'javascript':
                    result = await executeJavaScript(code, testCase);
                    break;
                case 'python':
                case 'cpp':
                case 'java':
                    // Simulated execution for non-JS languages (Docker sandbox in production)
                    result = simulateExecution(code, language, testCase);
                    break;
                default:
                    result = { passed: false, output: '', error: `Unsupported language: ${language}`, runtime: 0 };
            }
            results.push(result);
        } catch (error) {
            results.push({
                passed: false,
                output: '',
                error: error.message || 'Execution error',
                runtime: 0,
            });
        }
    }

    return results;
}

// ── JavaScript Execution (Node.js VM) ───────────────────────
async function executeJavaScript(code, testCase) {
    const startTime = Date.now();

    try {
        // Create a sandbox with captured output
        let capturedOutput = '';
        const sandbox = {
            console: {
                log: (...args) => {
                    capturedOutput += args.map(a =>
                        typeof a === 'object' ? JSON.stringify(a) : String(a)
                    ).join(' ') + '\n';
                },
            },
            result: undefined,
        };

        // Wrap user code to capture return value
        const wrappedCode = `
      ${code}
      
      // Try to call the main function with test input
      try {
        const input = ${JSON.stringify(testCase.input)};
        // Try to parse the input and call the function
        const parsedInput = (function() {
          try {
            return JSON.parse(input);
          } catch(e) {
            return input;
          }
        })();

        // Find the first defined function in the code
        const funcNames = Object.keys(this).filter(k => typeof this[k] === 'function' && k !== 'console');
        if (funcNames.length > 0) {
          const func = this[funcNames[funcNames.length - 1]];
          if (Array.isArray(parsedInput)) {
            result = func(...parsedInput);
          } else {
            result = func(parsedInput);
          }
        }
      } catch(e) {
        // Function might output via console.log instead
      }
    `;

        const context = vm.createContext(sandbox);
        const script = new vm.Script(wrappedCode);
        script.runInContext(context, { timeout: TIMEOUT_MS });

        const runtime = Date.now() - startTime;

        // Get output: prefer return value, then console output
        let output = '';
        if (sandbox.result !== undefined) {
            output = typeof sandbox.result === 'object'
                ? JSON.stringify(sandbox.result)
                : String(sandbox.result);
        } else if (capturedOutput.trim()) {
            output = capturedOutput.trim();
        }

        // Normalize output for comparison
        const normalizedOutput = normalizeOutput(output);
        const normalizedExpected = normalizeOutput(testCase.expectedOutput);
        const passed = normalizedOutput === normalizedExpected;

        return { passed, output, runtime, error: null };
    } catch (error) {
        const runtime = Date.now() - startTime;
        const errorMsg = error.message.includes('Script execution timed out')
            ? 'Time Limit Exceeded (timeout: 5s)'
            : error.message;

        return { passed: false, output: '', runtime, error: errorMsg };
    }
}

// ── Simulated Execution (for non-JS languages) ─────────────
function simulateExecution(code, language, testCase) {
    // In production, this would spin up a Docker container
    // For now, we simulate by returning a note about Docker requirement
    return {
        passed: false,
        output: `[${language} execution requires Docker sandbox]`,
        error: `${language} execution requires Docker. Install Docker and restart the server for full language support.`,
        runtime: 0,
    };
}

// ── Normalize Output for Comparison ─────────────────────────
function normalizeOutput(output) {
    if (!output) return '';
    return String(output)
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\[(\s+)/g, '[')
        .replace(/(\s+)\]/g, ']')
        .toLowerCase();
}

module.exports = { executeCode };
