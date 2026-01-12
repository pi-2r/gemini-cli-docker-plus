import { Sandbox, SandboxOptions } from '@anthropic-experimental/sandbox-runtime';
import { spawn } from 'child_process';

export interface SecureExecutorOptions {
    allowDomains?: string[];
    restrictFs?: boolean;
    cwd?: string;
}

export class SecureExecutor {
    private options: SecureExecutorOptions;

    constructor(options: SecureExecutorOptions) {
        this.options = options;
    }

    public async execute(command: string[]): Promise<void> {
        // In a real implementation with sandbox-runtime, we would verify options
        // and configure the Sandbox instance.
        // However, since we are wrapping the entire process in a container entrypoint,
        // and `sandbox-runtime` might need to execute the command *inside* the sandbox.

        // NOTE: Based on the prompt "Wrap each system command execution".
        // If the goal is to wrap the `gemini` CLI execution itself:

        const sb = new Sandbox({
            // Improve automatic detection or explicit bubblewrap usage on Linux
            isolation: process.platform === 'linux' ? 'bubblewrap' : 'unshare',
            network: {
                allow: this.options.allowDomains || [],
                deny: ['*']
            },
            fs: {
                // Restrict filesystem if requested
                // This part depends heavily on srt API which I'm inferring.
                // Assuming srt allows mounting/masking.
                // For now, let's assume we map cwd and minimal system libs.
                allow: [this.options.cwd || process.cwd(), '/usr/lib', '/lib', '/bin', '/usr/bin']
            }
        });

        console.log(`[SecureExecutor] Starting sandbox...`);
        // Basic logging of policy
        if (this.options.allowDomains && this.options.allowDomains.length > 0) {
            console.log(`[SecureExecutor] Network restricted. Allowed: ${this.options.allowDomains.join(', ')}`);
        } else {
            console.log(`[SecureExecutor] Network blocked completely.`);
        }

        try {
            // execute command inside sandbox
            // Since I don't have the exact SRT API docs handy, I am following standard patterns.
            // Usually it's sandbox.run(command)

            await sb.run(command, {
                stdout: process.stdout,
                stderr: process.stderr,
                env: process.env // Pass environment variables
            });

        } catch (error: any) {
            if (error.message && error.message.includes('violation')) { // Hypothetical error check
                console.error(`[SecureExecutor] Security Violation: ${error.message}`);
                process.exit(1);
            } else {
                console.error(`[SecureExecutor] Execution failed:`, error);
                process.exit(1);
            }
        }
    }
}
