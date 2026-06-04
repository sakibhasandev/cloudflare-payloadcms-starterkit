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
