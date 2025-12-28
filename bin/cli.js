#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const open = require('open');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const startServer = () => {
    const serverProcess = spawn(npmCommand, ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true, // 🔑 REQUIRED on Windows for .cmd
    });

    setTimeout(() => {
        open('http://localhost:3000');
    }, 3000);

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
};

startServer();
