#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const open = require('open');

const pkg = require('../package.json');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';


const startServer = () => {
    // Capture the directory where the user invoked the CLI (NOT where this package lives).
    // We'll forward this to the API server so it scaffolds projects in the right place.
    const invocationCwd = process.cwd();

    const serverProcess = spawn(npmCommand, ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        env: {
            ...process.env,
            CREATE_CUSTOM_CWD: invocationCwd,
            // Expose to the Next.js browser bundle so it can tell the API where to write.
            NEXT_PUBLIC_CREATE_CUSTOM_CWD: invocationCwd,
        },
        stdio: 'inherit',
        shell: true, // 🔑 REQUIRED on Windows for .cmd
    });

    setTimeout(() => {
        open('http://localhost:3000');
    }, 3000);

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);

        process.exit(1);
    }
};

const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
    // Print version and exit (useful to confirm what `npx` is running)
    console.log(pkg.version);
    process.exit(0);
}

startServer();
