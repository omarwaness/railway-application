import { createInterface } from "node:readline/promises";

const ENTER = ["\r", "\n"];
const BACKSPACE = [String.fromCharCode(127), "\b"];
const CTRL_C = String.fromCharCode(3);
const EOT = String.fromCharCode(4);

const ESC = String.fromCharCode(27);
const UP = `${ESC}[A`;
const DOWN = `${ESC}[B`;
const CURSOR_UP = `${ESC}[1A`;
const CLEAR_LINE = `${ESC}[2K`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;

/** Thrown when the user aborts a prompt with ctrl-c. */
export class PromptCancelled extends Error {
    constructor() {
        super("Cancelled");
        this.name = "PromptCancelled";
    }
}

/**
 * Reads a line without echoing it, so a token never lands in the terminal
 * scrollback. When stdin isn't a TTY the value is read straight off the pipe,
 * which is what makes `echo $TOKEN | rw init` work.
 */
export async function promptSecret(question: string): Promise<string> {
    if (!process.stdin.isTTY) {
        const piped = await new Response(Bun.stdin.stream()).text();
        return piped.split("\n")[0]?.trim() ?? "";
    }

    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    return await new Promise<string>((resolve, reject) => {
        let value = "";

        const cleanup = () => {
            process.stdin.off("data", onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write("\n");
        };

        const onData = (chunk: string) => {
            for (const char of chunk) {
                if (ENTER.includes(char) || char === EOT) {
                    cleanup();
                    resolve(value);
                    return;
                }

                if (char === CTRL_C) {
                    cleanup();
                    reject(new PromptCancelled());
                    return;
                }

                if (BACKSPACE.includes(char)) {
                    value = value.slice(0, -1);
                    continue;
                }

                // Skip the remaining control characters (arrow keys arrive as
                // escape sequences and would otherwise be typed into the token).
                if (char >= " ") value += char;
            }
        };

        process.stdin.on("data", onData);
    });
}

/** Reads a visible line of input. Returns "" when there's nothing to read. */
export async function promptText(question: string): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        return (await rl.question(question)).trim();
    } finally {
        rl.close();
    }
}

export interface Choice<T> {
    value: T;
    label: string;
    /** Dimmed text after the label, for a word on what the choice does. */
    hint?: string;
}

/**
 * An arrow-key menu. Requires a TTY — anything scripted should pass the
 * equivalent flag instead, so `notTtyMessage` is what explains how.
 */
export async function select<T>(
    question: string,
    choices: Choice<T>[],
    notTtyMessage: string,
): Promise<T> {
    const first = choices[0];
    if (!first) throw new Error("select() needs at least one choice");
    if (!process.stdin.isTTY) throw new Error(notTtyMessage);

    let active = 0;

    const render = (redraw: boolean) => {
        // Every line but the first was drawn below the cursor, so stepping back
        // up over them is what lets the same block be rewritten in place.
        if (redraw) process.stdout.write(`${CURSOR_UP.repeat(choices.length)}\r`);

        for (const [index, choice] of choices.entries()) {
            const selected = index === active;
            const line = `${selected ? BOLD : ""}${selected ? ">" : " "} ${choice.label}${RESET}`;
            const hint = choice.hint ? ` ${DIM}${choice.hint}${RESET}` : "";
            process.stdout.write(`${CLEAR_LINE}${line}${hint}\n`);
        }
    };

    process.stdout.write(`${question}\n`);
    process.stdout.write(HIDE_CURSOR);
    render(false);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    return await new Promise<T>((resolve, reject) => {
        const cleanup = () => {
            process.stdin.off("data", onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write(SHOW_CURSOR);
        };

        const onData = (chunk: string) => {
            if (chunk === UP || chunk === "k") {
                active = (active - 1 + choices.length) % choices.length;
                render(true);
                return;
            }

            if (chunk === DOWN || chunk === "j") {
                active = (active + 1) % choices.length;
                render(true);
                return;
            }

            if (ENTER.includes(chunk)) {
                cleanup();
                // `active` is always a valid index, but TS can't see that.
                resolve((choices[active] ?? first).value);
                return;
            }

            if (chunk === CTRL_C) {
                cleanup();
                reject(new PromptCancelled());
            }
        };

        process.stdin.on("data", onData);
    });
}

/** Asks a yes/no question, defaulting to no. Auto-answers no when not a TTY. */
export async function confirm(question: string): Promise<boolean> {
    if (!process.stdin.isTTY) return false;

    process.stdout.write(`${question} [y/N] `);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    return await new Promise<boolean>((resolve) => {
        const onData = (chunk: string) => {
            process.stdin.off("data", onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();

            const answer = chunk[0]?.toLowerCase() ?? "";
            process.stdout.write(`${answer === "y" ? "y" : "n"}\n`);
            resolve(answer === "y");
        };

        process.stdin.on("data", onData);
    });
}
