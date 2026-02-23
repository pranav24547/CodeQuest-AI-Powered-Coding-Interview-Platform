const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

// Language configs — maps to local commands
const LANGUAGES = {
    python: { ext: '.py', cmd: 'python', args: [] },
    java: { ext: '.java', cmd: 'javac', runCmd: 'java', args: [] },
    cpp: { ext: '.cpp', cmd: 'g++', args: [] },
    javascript: { ext: '.js', cmd: 'node', args: [] },
};

// Create temp dir for code files
const TEMP_DIR = path.join(os.tmpdir(), 'codequest-exec');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Clean up old temp files (older than 5 min)
function cleanup() {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        files.forEach(f => {
            const fp = path.join(TEMP_DIR, f);
            try {
                const stat = fs.statSync(fp);
                if (now - stat.mtimeMs > 5 * 60 * 1000) fs.unlinkSync(fp);
            } catch (_) { /* ignore */ }
        });
    } catch (_) { /* ignore */ }
}

// Execute code in a given language
router.post('/', async (req, res) => {
    const { code, language, input = '' } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
    }

    const config = LANGUAGES[language];
    if (!config) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    cleanup();

    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
        if (language === 'python') {
            const filePath = path.join(TEMP_DIR, `${id}.py`);
            fs.writeFileSync(filePath, code);

            const result = await runProcess('python', [filePath], input, 10000);
            try { fs.unlinkSync(filePath); } catch (_) { }
            return res.json(result);

        } else if (language === 'javascript') {
            const filePath = path.join(TEMP_DIR, `${id}.js`);
            fs.writeFileSync(filePath, code);

            const result = await runProcess('node', [filePath], input, 10000);
            try { fs.unlinkSync(filePath); } catch (_) { }
            return res.json(result);

        } else if (language === 'java') {
            // Java needs class name = file name
            // Extract class name from code
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : 'Main';
            const filePath = path.join(TEMP_DIR, `${className}.java`);
            fs.writeFileSync(filePath, code);

            // Compile
            const compileResult = await runProcess('javac', [filePath], '', 15000);
            if (!compileResult.success) {
                try { fs.unlinkSync(filePath); } catch (_) { }
                return res.json({ ...compileResult, output: 'Compilation Error:\n' + compileResult.output });
            }

            // Run
            const result = await runProcess('java', ['-cp', TEMP_DIR, className], input, 10000);

            // Cleanup
            try {
                fs.unlinkSync(filePath);
                fs.unlinkSync(path.join(TEMP_DIR, `${className}.class`));
            } catch (_) { }

            return res.json(result);

        } else if (language === 'cpp') {
            const srcPath = path.join(TEMP_DIR, `${id}.cpp`);
            const outPath = path.join(TEMP_DIR, `${id}.exe`);
            fs.writeFileSync(srcPath, code);

            // Compile
            const compileResult = await runProcess('g++', [srcPath, '-o', outPath], '', 15000);
            if (!compileResult.success) {
                try { fs.unlinkSync(srcPath); } catch (_) { }
                return res.json({ ...compileResult, output: 'Compilation Error:\n' + compileResult.output });
            }

            // Run
            const result = await runProcess(outPath, [], input, 10000);

            // Cleanup
            try {
                fs.unlinkSync(srcPath);
                fs.unlinkSync(outPath);
            } catch (_) { }

            return res.json(result);
        }
    } catch (err) {
        return res.status(500).json({ success: false, output: `Server error: ${err.message}` });
    }
});

// Helper: run a process with timeout
function runProcess(cmd, args, input, timeout) {
    return new Promise((resolve) => {
        try {
            const proc = execFile(cmd, args, {
                timeout,
                maxBuffer: 1024 * 1024,
                cwd: TEMP_DIR,
            }, (error, stdout, stderr) => {
                if (error && error.killed) {
                    resolve({ success: false, output: 'Time Limit Exceeded (10s)' });
                } else if (error && !stdout && !stderr) {
                    // Command not found — language not installed
                    resolve({
                        success: false,
                        output: `"${cmd}" not found. Make sure ${cmd} is installed and in your PATH.`,
                    });
                } else if (stderr && !stdout) {
                    resolve({ success: false, output: stderr.trim() });
                } else {
                    const output = stdout ? stdout.trim() : (stderr ? stderr.trim() : '(No output)');
                    resolve({ success: !error, output });
                }
            });

            // Send stdin if provided
            if (input && proc.stdin) {
                proc.stdin.write(input);
                proc.stdin.end();
            }
        } catch (err) {
            resolve({ success: false, output: `Failed to execute: ${err.message}` });
        }
    });
}

module.exports = router;
