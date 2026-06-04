import { cloudflare } from "@context";
import type { CollectionAfterChangeHook, CollectionConfig, Job } from "payload";

/**
 * Producer: runs whenever a row is written to the `payload-jobs` collection
 * (i.e. when `payload.jobs.queue()` enqueues a job). On `create` it pushes the
 * new job's id onto the Cloudflare Queue so `handlerQueue` below can pick it up
 * and trigger `/api/payload-jobs/run` for that single job.
 *
 */
const enqueueJob: CollectionAfterChangeHook<Job> = async ({
    doc,
    operation,
    req,
}) => {
    if (operation !== "create") return doc;

    const queue = cloudflare.env.QUEUE;
    if (!queue) {
        req.payload.logger.warn(
            "QUEUE binding is not defined. Job will not be dispatched.",
        );
        return doc;
    }

    try {
        // Honor scheduled jobs: Payload stores the run-after time in `waitUntil`.
        // Cloudflare Queues cap delivery delay at 12h (43200s).
        const runAt = doc.waitUntil ? new Date(doc.waitUntil).getTime() : 0;
        const delaySeconds = runAt
            ? Math.min(
                  Math.max(0, Math.round((runAt - Date.now()) / 1000)),
                  43200,
              )
            : undefined;

        await queue.send(
            { jobId: doc.id },
            delaySeconds ? { delaySeconds } : undefined,
        );
    } catch (error) {
        // Don't fail job creation if dispatch fails — the row persists and can
        // be retried by a fallback runner. Just surface the error.
        req.payload.logger.error({
            msg: `Failed to enqueue job ${doc.id} onto the Cloudflare Queue`,
            err: error,
        });
    }

    return doc;
};

/**
 * Wires the `enqueueJob` producer into the default `payload-jobs` collection so
 * every newly created job row is dispatched onto the Cloudflare Queue. Passed to
 * `jobs.jobsCollectionOverrides` in the Payload config.
 */
export const jobsCollectionOverrides = ({
    defaultJobsCollection,
}: {
    defaultJobsCollection: CollectionConfig;
}): CollectionConfig => {
    defaultJobsCollection.hooks = {
        ...defaultJobsCollection.hooks,
        afterChange: [
            ...(defaultJobsCollection.hooks?.afterChange ?? []),
            enqueueJob,
        ],
    };
    return defaultJobsCollection;
};

type HandlerQueue = ExportedHandler<
    CloudflareEnv,
    { jobId?: string | number }
>["queue"];

export const handlerQueue: HandlerQueue = async (event, env) => {
    if (!env.WORKER_SELF_REFERENCE) {
        console.warn(
            "WORKER_SELF_REFERENCE is not defined. Messages will not be processed.",
        );
        return;
    }

    for await (const message of event.messages) {
        try {
            const jobId = message.body.jobId
                ? encodeURIComponent(String(message.body.jobId))
                : undefined;
            if (!jobId) {
                console.warn(
                    `Message ${message.id} does not contain a valid jobId. Skipping.`,
                );
                message.ack();
                continue;
            }

            const response = await env.WORKER_SELF_REFERENCE.fetch(
                `https://worker/api/payload-jobs/run?limit=1&where[id][equals]=${jobId}`,
                {
                    method: "GET",
                    headers: {
                        "X-Payload-Secret": process.env.PAYLOAD_SECRET || "",
                        "X-Queue-Message-Id": message.id,
                        "X-Job-Id": String(jobId),
                    },
                },
            );

            if (!response.ok) {
                const body = await response.text();
                throw new Error(
                    `Job run failed with status ${response.status}: ${body}`,
                );
            }

            message.ack();
        } catch (error) {
            console.error(`Error processing message ${message.id}:`, error);
        } finally {
            message.retry({ delaySeconds: 60 });
        }
    }
};
