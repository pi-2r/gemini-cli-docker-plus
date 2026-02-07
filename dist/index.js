"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
async function main() {
    // The arguments passed to the script start from index 2
    // node /app/dist/index.js [args...]
    const args = process.argv.slice(2);
    console.error("🚀 Starting Gemini CLI...");
    const gemini = (0, child_process_1.spawn)('gemini', args, {
        stdio: 'inherit', // Pass stdin/stdout/stderr directly to the parent
        env: process.env // Forward environment variables
    });
    gemini.on('close', (code) => {
        process.exit(code ?? 0);
    });
    gemini.on('error', (err) => {
        console.error(`Failed to start gemini process: ${err.message}`);
        process.exit(1);
    });
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
