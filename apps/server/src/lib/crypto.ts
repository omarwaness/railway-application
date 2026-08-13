import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits, the recommended nonce size for GCM
const KEY_LENGTH = 32; // 256 bits

// Read per call rather than cached at import: `env.ts` has already rejected a
// bad key at boot, so this never fires in a running deploy — but keeping the
// lookup dynamic is what lets the tests swap keys to prove that a payload
// encrypted under one key won't decrypt under another.
function getKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) {
        throw new Error(
            "ENCRYPTION_KEY is not set in the .env file",
        );
    }

    const key = Buffer.from(raw, "base64");
    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64), got ${key.length}`,
        );
    }

    return key;
}

/**
 * Encrypts a Railway token for storage in `railway_token.encrypted_token`.
 * Returns "iv:authTag:ciphertext", each part base64.
 */
export function encryptToken(plaintext: string): string {
    if (!plaintext) {
        throw new Error("Cannot encrypt an empty token");
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);

    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        ciphertext.toString("base64"),
    ].join(":");
}

/**
 * Reverses `encryptToken`. Throws if the payload is malformed or if the
 * ciphertext has been tampered with (the GCM auth tag won't verify).
 */
export function decryptToken(payload: string): string {
    const parts = payload.split(":");
    if (parts.length !== 3) {
        throw new Error("Malformed encrypted token payload");
    }

    const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");

    if (iv.length !== IV_LENGTH) {
        throw new Error("Malformed encrypted token payload");
    }

    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString("utf8");
}
