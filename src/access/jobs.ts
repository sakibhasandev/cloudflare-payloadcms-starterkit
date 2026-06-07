import type { RunJobAccess } from "payload";

/**
 * Authorizes job-run requests by verifying the shared `X-Payload-Secret`
 * header against `PAYLOAD_SECRET`. The queue handler in `./queue.ts` and the
 * Cron Trigger handler in `./cron.ts` both send this header when triggering
 * work via the self-reference binding. Payload also reuses this access function
 * to guard the built-in `/api/payload-jobs/handle-schedules` endpoint.
 */
export const canRunJobs: RunJobAccess = ({ req: { headers } }) => {
    const headerSecret = headers.get("X-Payload-Secret");

    if (!headerSecret || headerSecret !== process.env.PAYLOAD_SECRET) {
        console.warn(
            "Unauthorized job run attempt with headers:",
            Object.fromEntries(headers.entries()),
        );
        return false;
    }

    return true;
};
