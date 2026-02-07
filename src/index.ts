import { spawn } from 'child_process';

async function main() {
    // The arguments passed to the script start from index 2
    // node /app/dist/index.js [args...]
    const args = process.argv.slice(2);

    console.error("🚀 Starting Gemini CLI wrapper...");

    // Force SHELL env var to /bin/bash to ensure gemini finds a capable shell
    const env = { ...process.env, SHELL: '/bin/bash' };

    const gemini = spawn('gemini', args, {
        stdio: 'inherit', // Pass stdin/stdout/stderr directly to the parent
        env: env
    });

    // Handle signals and forward them to the child process
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach(signal => {
        process.on(signal, () => {
            console.error(`[WRAPPER] Received signal ${signal}, forwarding to child...`);
            gemini.kill(signal);
        });
    });

    gemini.on('close', (code, signal) => {
        console.error(`[WRAPPER] Gemini process exited with code: ${code}, signal: ${signal}`);
        process.exit(code ?? 0);
    });

    gemini.on('error', (err) => {
        console.error(`[WRAPPER] Failed to start gemini process: ${err.message}`);
        process.exit(1);
    });
}

main().catch(err => {
    console.error(`[WRAPPER] Unhandled error:`, err);
    process.exit(1);
});
