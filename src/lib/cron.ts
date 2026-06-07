/**
 * Payload registers `GET /api/payload-jobs/handle-schedules` automatically when
 * any task/workflow defines a `schedule`. It runs `payload.jobs.handleSchedules()`
 * and is guarded by `jobs.access.run` (our `X-Payload-Secret` check in
 * `src/access/jobs.ts`). `allQueues=true` evaluates schedules across every queue.
 */
const HANDLE_SCHEDULES_URL =
    "https://worker/api/payload-jobs/handle-schedules?allQueues=true";

/**
 * Cron Trigger handler. Cloudflare invokes this on the schedule(s) declared in
 * the `triggers.crons` block of `wrangler.jsonc`. It calls Payload's built-in
 * schedule endpoint through the `WORKER_SELF_REFERENCE` binding (mirroring the
 * Queue consumer in `./queue.ts`), which queues any due scheduled jobs. Those
 * jobs then flow through the normal Queue path — this only *queues* them, it
 * never runs them inline, keeping a single execution path.
 *
 * Note: a Cron Trigger only fires in deployed Workers, not under `next dev`. To
 * exercise schedules locally, run `wrangler dev --test-scheduled` and hit
 * `http://localhost:8787/cdn-cgi/handler/scheduled`, or just GET
 * `/api/payload-jobs/handle-schedules` with the `X-Payload-Secret` header.
 */
export const handlerScheduled: ExportedHandler<CloudflareEnv>["scheduled"] =
    async (_controller, env) => {
        const worker = env.WORKER_SELF_REFERENCE;
        if (!worker) {
            console.warn(
                "WORKER_SELF_REFERENCE is not defined. Scheduled jobs will not be queued.",
            );
            return;
        }

        const response = await worker.fetch(HANDLE_SCHEDULES_URL, {
            method: "GET",
            headers: {
                "X-Payload-Secret": process.env.PAYLOAD_SECRET || "",
            },
        });

        if (!response.ok) {
            // Throwing surfaces the failure in the Worker's invocation logs; the
            // next Cron tick will retry the evaluation.
            throw new Error(
                `Schedule evaluation failed with status ${response.status}: ${await response.text()}`,
            );
        }
    };
