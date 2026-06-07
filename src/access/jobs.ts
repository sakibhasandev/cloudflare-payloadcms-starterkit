import type { RunJobAccess } from "payload";

const SECRET_HEADER = "X-Payload-Secret";

/**
 * Constant-time string comparison. Folds the length difference and every byte
 * into a single accumulator so the work — and timing — is independent of where
 * (or whether) the strings diverge, closing the timing side-channel that `===`
 * opens by short-circuiting on the first mismatching byte. Bytes (not code
 * units) are compared so multi-byte secrets behave correctly.
 */
const timingSafeEqual = (a: string, b: string): boolean => {
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);

    let diff = aBytes.length ^ bBytes.length;
    const length = Math.max(aBytes.length, bBytes.length);
    for (let i = 0; i < length; i++) {
        diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
    }

    return diff === 0;
};

/**
 * Authorizes job-run requests by verifying the shared `X-Payload-Secret`
 * header against `PAYLOAD_SECRET`. The queue handler in `../lib/queue.ts` and
 * the Cron Trigger handler in `../lib/cron.ts` both send this header when
 * triggering work via the self-reference binding. Payload also reuses this
 * access function to guard the built-in `/api/payload-jobs/handle-schedules`
 * endpoint.
 *
 * Fails closed in every branch: a missing header, a wrong secret, or an unset
 * `PAYLOAD_SECRET` all deny the request. The comparison is constant-time, and
 * the request headers are never logged (they would leak the submitted secret
 * guess, cookies, and auth tokens).
 */
export const canRunJobs: RunJobAccess = ({ req: { headers } }) => {
    const expectedSecret = process.env.PAYLOAD_SECRET;
    if (!expectedSecret) {
        // Misconfiguration, not an attack — surface it distinctly so an
        // operator can tell the two apart in the logs.
        console.error(
            "PAYLOAD_SECRET is not set; denying all job-run requests.",
        );
        return false;
    }

    const headerSecret = headers.get(SECRET_HEADER);
    if (!headerSecret || !timingSafeEqual(headerSecret, expectedSecret)) {
        console.warn(
            `Unauthorized job-run attempt (${SECRET_HEADER} ${headerSecret ? "mismatch" : "missing"}).`,
        );
        return false;
    }

    return true;
};
