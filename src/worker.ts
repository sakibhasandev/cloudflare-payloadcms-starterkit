// @ts-ignore Ignore missing build output from OpenNext.js
import { default as handler } from "../.open-next/worker";

export default {
    fetch: handler.fetch,
} satisfies ExportedHandler<CloudflareEnv>;
