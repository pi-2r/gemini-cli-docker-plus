#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { SecureExecutor } from './SecureExecutor';

async function main() {
    const parser = yargs(hideBin(process.argv))
        .option('allow-domain', {
            type: 'array',
            string: true,
            description: 'List of allowed domains for network access'
        })
        .option('restrict-fs', {
            type: 'boolean',
            default: false,
            description: 'Restrict filesystem access to current directory and /tmp'
        })
        .help()
        .alias('help', 'h');

    // Parse arguments but separate the wrapper args from the target command args
    // This is tricky because `gemini --help` might be confused with `wrapper --help`.
    // Convention: `cli-wrapper [wrapper-options] -- [target-command]` is standard, 
    // but we want to be transparent: `docker run ... img [wrapper-options] [gemini-command]`

    // Let's rely on yargs parsing.
    // "unknown" arguments will be treated as the command to run? 
    // Or we specifically look for our flags.

    // Simplification: We assume our flags come first.
    const argv = await parser.parse();

    // Re-construct the command to run. 
    // yargs puts non-option arguments into `_`.
    let command = argv._.map(String);

    if (command.length === 0) {
        // Default to running 'gemini' if no command provided (interactive mode)
        command = ['gemini'];
    } else {
        // If the first arg is not 'gemini', we might assume the user wants to run something else 
        // OR they typed `gemini prompt`.
        // If they typed `gemini prompt`, `gemini` is in `_`.
        // If they typed `prompt`, we might want to prepend `gemini`?
        // The original docker image entrypoint was `ENTRYPOINT ["docke-entrypoint.sh", "gemini"]`.
        // If user ran `docker run ... img foo`, it executed `gemini foo`.
        // So we should probably prepend `gemini` if the first arg is NOT a system command we know.
        // BUT, for a generic sandbox wrapper, we should just run what is given.
        // Let's assume the user (or the docker CMD) provides the full command or at least the args for the default entrypoint.

        // To match original behavior: 
        // The original `ENTRYPOINT` called `gemini`.
        // If we replace ENTRYPOINT with this wrapper, we must default to ensuring `gemini` is called.

        // Let's logic: if `command[0]` is NOT 'gemini', prepend 'gemini'.
        // EXCEPT if the user explicitly wants to run `sh` or `ls` (debug).
        // Let's stick to: If `command` is empty, run `gemini`. If not, run what is there.
        // Users might need to type `docker run ... img gemini prompt`.
        // Wait, original was `ENTRYPOINT [..., "gemini"]`. CMD was empty.
        // If user ran `docker run ... img`, it ran `gemini`.
        // If user ran `docker run ... img arg1`, it ran `gemini arg1`.

        // So if check if we are replacing ENTRYPOINT completely.
        // Yes. So if I want to maintain behavior:
        // If `command[0]` != 'gemini' and != '/usr/bin/gemini', prepend 'gemini'?
        // This is risky if user wants `ls`.
        // Docker default is CMD is appended to ENTRYPOINT.
        // If ENTRYPOINT is `node index.js`, and CMD is `arg1`, then `argv._` is `[arg1]`.
        // We probably want to execute `gemini arg1`.

        if (command[0] !== 'gemini') {
            // Check if it looks like a gemini arg? or just blindly prepend?
            // Safety: prepend `gemini` if it's not a known shell command? No.
            // Let's blindly prepend `gemini` to match the "Image acts as gemini executable" philosophy,
            // UNLESS the first arg looks like an executable path or binary name?
            // Actually, let's keep it simple. If we want this to be a secure GEMINI wrapper, 
            // we effectively effectively hardcode `gemini` as the target executable, 
            // and arguments are passed to it.

            // BUT user wanted `SecureExecutor` to define permissions.

            // Let's assume strict wrapper:
            // execution = ['gemini', ...command]
            command = ['gemini', ...command];
        }
    }

    const allowDomains = (argv.allowDomain as string[]) || [];
    // Hardcode google APIs as always allowed for Gemini to work? 
    // Or is that part of "default block except whitelist"?
    // The user said "Bloquer tout par défaut, sauf une liste blanche paramétrable".
    // But they also said "Gemini CLI execution". Gemini NEEDS network.
    // So I should probably add default whitelist for Gemini API.
    const defaultWhitelist = ['generativelanguage.googleapis.com', 'google.com'];
    const finalWhitelist = [...new Set([...defaultWhitelist, ...allowDomains])];

    const executor = new SecureExecutor({
        allowDomains: finalWhitelist,
        restrictFs: argv.restrictFs as boolean,
        cwd: process.cwd()
    });

    await executor.execute(command);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
