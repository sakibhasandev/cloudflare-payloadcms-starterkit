import { handlerQueue } from "@/lib/queue";
// @ts-ignore Ignore missing build output from OpenNext.js
import { default as handler } from "@handler";

export default {
    fetch: handler.fetch,
    queue: handlerQueue,
} satisfies ExportedHandler<CloudflareEnv, { jobId?: string | number }>;
