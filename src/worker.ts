// @ts-ignore Ignore missing build output from OpenNext.js

import { handlerQueue } from "@/lib/queue";
import { default as handler } from "../.open-next/worker";

export default {
    fetch: handler.fetch,
    queue: handlerQueue,
} satisfies ExportedHandler<CloudflareEnv, { jobId?: string | number }>;
