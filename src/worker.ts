import { handlerScheduled } from "@/lib/cron";
import { handlerQueue, type JobMessageBody } from "@/lib/queue";
// @ts-ignore Ignore missing build output from OpenNext.js
import { default as handler } from "@handler";

export default {
    fetch: handler.fetch,
    queue: handlerQueue,
    scheduled: handlerScheduled,
} satisfies ExportedHandler<CloudflareEnv, JobMessageBody>;
