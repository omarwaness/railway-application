import { randomBytes } from "node:crypto";

import { afterEach, describe, expect, test } from "bun:test";

import { TEST_ENCRYPTION_KEY } from "./index";
import { decryptToken, encryptToken } from "../lib/crypto";

const TOKEN = "e7f2c9a1-4b6d-4e8f-9c1a-2d3b4f5a6ajd";

// Several tests below deliberately break the key; always put it back.
afterEach(() => {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
});

describe("encryptToken / decryptToken", () => {
    test("round-trips a token", () => {
        expect(decryptToken(encryptToken(TOKEN))).toBe(TOKEN);
    });

    test("produces the iv:authTag:ciphertext shape", () => {
        const parts = encryptToken(TOKEN).split(":");

        expect(parts).toHaveLength(3);
        // 12-byte iv and 16-byte auth tag, base64-encoded
        expect(Buffer.from(parts[0]!, "base64")).toHaveLength(12);
        expect(Buffer.from(parts[1]!, "base64")).toHaveLength(16);
    });

    test("never contains the plaintext", () => {
        expect(encryptToken(TOKEN)).not.toContain(TOKEN);
    });

    test("gives different ciphertext each time (random iv)", () => {
        const a = encryptToken(TOKEN);
        const b = encryptToken(TOKEN);

        expect(a).not.toBe(b);
        expect(decryptToken(a)).toBe(decryptToken(b));
    });

    test("handles unicode and very long tokens", () => {
        const unicode = "tökén-🔑-末尾";
        const long = "x".repeat(5000);

        expect(decryptToken(encryptToken(unicode))).toBe(unicode);
        expect(decryptToken(encryptToken(long))).toBe(long);
    });

    test("rejects an empty plaintext", () => {
        expect(() => encryptToken("")).toThrow("Cannot encrypt an empty token");
    });
});

describe("decryptToken rejects bad payloads", () => {
    test.each([
        ["not base64 at all", "garbage"],
        ["too few parts", "aaa:bbb"],
        ["too many parts", "aaa:bbb:ccc:ddd"],
        ["empty string", ""],
    ])("throws on %s", (_label, payload) => {
        expect(() => decryptToken(payload)).toThrow();
    });

    test("throws when the iv is the wrong length", () => {
        const [, authTag, ciphertext] = encryptToken(TOKEN).split(":");
        const shortIv = randomBytes(8).toString("base64");

        expect(() => decryptToken(`${shortIv}:${authTag}:${ciphertext}`)).toThrow(
            "Malformed encrypted token payload",
        );
    });

    test("throws when the ciphertext is tampered with", () => {
        const [iv, authTag, ciphertext] = encryptToken(TOKEN).split(":");
        const bytes = Buffer.from(ciphertext!, "base64");
        bytes[0] ^= 1; // flip a single bit

        expect(() =>
            decryptToken(`${iv}:${authTag}:${bytes.toString("base64")}`),
        ).toThrow();
    });

    test("throws when the auth tag is tampered with", () => {
        const [iv, authTag, ciphertext] = encryptToken(TOKEN).split(":");
        const bytes = Buffer.from(authTag!, "base64");
        bytes[0] ^= 1;

        expect(() =>
            decryptToken(`${iv}:${bytes.toString("base64")}:${ciphertext}`),
        ).toThrow();
    });

    test("throws when decrypting with a different key", () => {
        const payload = encryptToken(TOKEN);
        process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

        expect(() => decryptToken(payload)).toThrow();
    });
});

describe("ENCRYPTION_KEY validation", () => {
    test("throws when the key is missing", () => {
        delete process.env.ENCRYPTION_KEY;

        expect(() => encryptToken(TOKEN)).toThrow("ENCRYPTION_KEY is not set");
    });

    test("throws when the key decodes to the wrong length", () => {
        process.env.ENCRYPTION_KEY = randomBytes(16).toString("base64");

        expect(() => encryptToken(TOKEN)).toThrow("must be 32 bytes");
    });

    test("throws on a non-base64 key (the real-world .env mistake)", () => {
        // underscores are not in the base64 alphabet, so this decodes short
        process.env.ENCRYPTION_KEY = "some_key_that_is_not_base64_encoded_at_all";

        expect(() => encryptToken(TOKEN)).toThrow("must be 32 bytes");
    });
});
