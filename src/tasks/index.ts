import { TaskConfig } from "payload";

/**
 * Example scheduled task. The `schedule` array makes Payload queue this task on
 * a cron; the actual tick is driven by the Cloudflare Cron Trigger in
 * `wrangler.jsonc` -> the Worker `scheduled` handler (see `src/lib/cron.ts`) ->
 * Payload's `/api/payload-jobs/handle-schedules`. Remember the trigger interval
 * is the *resolution*:
 * this task can fire no more often than the Cron Trigger runs.
 *
 * Delete or replace this with your own tasks.
 */
const heartbeat: TaskConfig<"heartbeat"> = {
    slug: "heartbeat",
    schedule: [
        {
            cron: "*/5 * * * *", // every 5 minutes
            // A named (non-default) queue — the consumer in `src/lib/queue.ts`
            // runs jobs on any queue, so this works end-to-end.
            queue: "scheduled",
        },
    ],
    handler: ({ req }) => {
        req.payload.logger.info("[heartbeat] scheduled task ran");
        return { output: {} };
    },
};

/**
 * Register your tasks here.
 */
export const tasks: TaskConfig[] = [heartbeat];
