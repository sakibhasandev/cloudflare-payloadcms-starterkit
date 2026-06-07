import type { RunJobAccessArgs } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { canRunJobs } from "./jobs";

const SECRET = "super-secret-value";

/**
 * Builds the minimal `RunJobAccessArgs` that `canRunJobs` actually reads — a
 * `req` carrying a real `Headers` object. Everything else on `PayloadRequest`
 * is irrelevant to the access check, so it's cast away.
 */
const argsWithHeader = (secret?: string): RunJobAccessArgs => {
    const headers = new Headers();
    if (secret !== undefined) headers.set("X-Payload-Secret", secret);
    return { req: { headers } } as unknown as RunJobAccessArgs;
};

describe("canRunJobs", () => {
    beforeEach(() => {
        process.env.PAYLOAD_SECRET = SECRET;
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.PAYLOAD_SECRET;
    });

    it("authorizes a request whose header matches PAYLOAD_SECRET", () => {
        expect(canRunJobs(argsWithHeader(SECRET))).toBe(true);
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("denies a request with a wrong secret", () => {
        expect(canRunJobs(argsWithHeader("wrong"))).toBe(false);
        expect(console.warn).toHaveBeenCalledOnce();
    });

    it("denies a request with no secret header", () => {
        expect(canRunJobs(argsWithHeader())).toBe(false);
        expect(console.warn).toHaveBeenCalledOnce();
    });

    it("denies a request whose header is an empty string", () => {
        expect(canRunJobs(argsWithHeader(""))).toBe(false);
    });

    it("fails closed (and logs an error, not a warning) when PAYLOAD_SECRET is unset", () => {
        delete process.env.PAYLOAD_SECRET;
        expect(canRunJobs(argsWithHeader(SECRET))).toBe(false);
        expect(console.error).toHaveBeenCalledOnce();
        expect(console.warn).not.toHaveBeenCalled();
    });

    it("denies a secret that is a prefix of the real one (no early-match)", () => {
        expect(canRunJobs(argsWithHeader(SECRET.slice(0, -1)))).toBe(false);
    });

    it("denies a secret that has the real one as a prefix", () => {
        expect(canRunJobs(argsWithHeader(`${SECRET}extra`))).toBe(false);
    });

    it("authorizes a non-ASCII secret (multi-byte UTF-8 path)", () => {
        // Header values are ByteStrings, so each char must fit in a byte;
        // accented Latin chars still encode to >1 byte under UTF-8.
        const secret = "sécrèt-ñøÿ";
        process.env.PAYLOAD_SECRET = secret;
        expect(canRunJobs(argsWithHeader(secret))).toBe(true);
    });

    it("never logs the request headers or the submitted secret guess", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        canRunJobs(argsWithHeader("attacker-guess-12345"));
        const logged = warn.mock.calls.flat().join(" ");
        expect(logged).not.toContain("attacker-guess-12345");
        expect(logged).not.toContain(SECRET);
    });
});
