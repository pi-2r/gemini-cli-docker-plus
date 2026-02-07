import { spawn } from 'child_process';

console.error("🚀 Starting Test Interactive Shell (sh)...");

const child = spawn('/bin/sh', [], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    console.error(`[TEST] Process exited with code: ${code}`);
    process.exit(code ?? 0);
});

child.on('error', (err) => {
    console.error(`[TEST] Failed to start process: ${err.message}`);
    process.exit(1);
});
