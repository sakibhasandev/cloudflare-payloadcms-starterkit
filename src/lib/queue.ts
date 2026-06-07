import { cloudflare } from "@context";
import type { CollectionAfterChangeHook, CollectionConfig, Job } from "payload";

// Cloudflare Queues cap the delivery delay at 12 hours.
const MAX_QUEUE_DELAY_SECONDS = 43200;
// How long to wait before redelivering a job whose run failed.
const RETRY_DELAY_SECONDS = 60;

/**
 * Body of each message on the jobs queue. `waitUntil` (epoch ms) is carried so
 * the consumer can detect a job delivered before its run time — because the
 * delay was clamped to the 12h cap, or due to clock slop — and re-chain another
 * bounded delay instead of running (and dropping) it.
 */
export type JobMessageBody = {
    jobId?: string | number;
    waitUntil?: number;
};

/**
 * Producer: runs whenever a row is written to the `payload-jobs` collection
 * (i.e. when `payload.jobs.queue()` enqueues a job). On `create` it pushes the
 * new job's id onto the Cloudflare Queue so `handlerQueue` below can pick it up
 * and trigger `/api/payload-jobs/run` for that single job.
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
        const waitUntil = doc.waitUntil
            ? new Date(doc.waitUntil).getTime()
            : undefined;
        await queue.send({ jobId: doc.id, waitUntil }, delayUntil(waitUntil));
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
 * Cloudflare Queue delay options that hold a message until `waitUntilMs` (epoch
 * ms), clamped to the 12h cap. Returns undefined (deliver immediately) when the
 * target time is absent or already in the past. Used both to schedule a job's
 * first delivery and to re-chain delays for waits longer than the 12h cap.
 */
const delayUntil = (waitUntilMs: number | undefined) => {
    if (!waitUntilMs) return undefined;

    const secondsUntilRun = Math.round((waitUntilMs - Date.now()) / 1000);
    if (secondsUntilRun <= 0) return undefined;

    return { delaySeconds: Math.min(secondsUntilRun, MAX_QUEUE_DELAY_SECONDS) };
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

type HandlerQueue = ExportedHandler<CloudflareEnv, JobMessageBody>["queue"];

type JobMessage = Parameters<NonNullable<HandlerQueue>>[0]["messages"][number];
type WorkerBinding = NonNullable<CloudflareEnv["WORKER_SELF_REFERENCE"]>;
type JobQueue = CloudflareEnv["QUEUE"];

/**
 * Consumer: triggers a single Payload job run via the self-reference binding.
 * Acks on success, retries (after a delay) only on failure, and acks-and-skips
 * messages that carry no usable jobId.
 */
const runJobMessage = async (
    message: JobMessage,
    worker: WorkerBinding,
    queue: JobQueue,
) => {
    const { jobId, waitUntil } = message.body;
    if (!jobId) {
        console.warn(
            `Message ${message.id} does not contain a valid jobId. Skipping.`,
        );
        message.ack();
        return;
    }

    // Not due yet: the 12h delay cap (or clock slop) delivered this early.
    // Payload's runner only picks up jobs whose `waitUntil` has passed, so
    // running now would no-op and silently drop the job. Re-enqueue a fresh
    // message with another bounded delay instead — a new message (rather than
    // `message.retry()`) resets the delivery-attempt counter, so chaining hops
    // for waits longer than 12h doesn't exhaust `max_retries`.
    if (waitUntil && Date.now() < waitUntil) {
        await queue.send(message.body, delayUntil(waitUntil));
        message.ack();
        return;
    }

    try {
        // `allQueues=true`: the exact-id filter already targets one job, so this
        // just lifts the default-queue constraint and lets jobs on any named
        // Payload queue run. `disableScheduling=true`: schedule evaluation is
        // owned solely by the Cron Trigger (`./cron.ts`), so per-job runs don't
        // redundantly re-check it.
        const url = `https://worker/api/payload-jobs/run?limit=1&allQueues=true&disableScheduling=true&where[id][equals]=${encodeURIComponent(
            String(jobId),
        )}`;
        const response = await worker.fetch(url, {
            method: "GET",
            headers: {
                "X-Payload-Secret": process.env.PAYLOAD_SECRET || "",
                "X-Queue-Message-Id": message.id,
                "X-Job-Id": String(jobId),
            },
        });

        if (!response.ok) {
            throw new Error(
                `Job run failed with status ${response.status}: ${await response.text()}`,
            );
        }

        message.ack();
    } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        // Redeliver only on failure — successful messages are already acked.
        message.retry({ delaySeconds: RETRY_DELAY_SECONDS });
    }
};

export const handlerQueue: HandlerQueue = async (event, env) => {
    if (!env.WORKER_SELF_REFERENCE) {
        console.warn(
            "WORKER_SELF_REFERENCE is not defined. Messages will not be processed.",
        );
        return;
    }

    if (event.queue == "payload-jobs-queue") {
        for (const message of event.messages) {
            await runJobMessage(message, env.WORKER_SELF_REFERENCE, env.QUEUE);
        }
        return;
    }

    console.warn(
        `Received message for unexpected queue ${event.queue}. Skipping.`,
    );
};
