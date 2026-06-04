import {
    CloudflareContext,
    getCloudflareContext,
} from "@opennextjs/cloudflare";
import fs from "node:fs";
import path from "node:path";
import { PayloadLogger } from "payload";
import { GetPlatformProxyOptions } from "wrangler";

const realpath = (value: string) =>
    fs.existsSync(value) ? fs.realpathSync(value) : undefined;

const isCLI = process.argv.some((value) =>
    realpath(value)?.endsWith(path.join("payload", "bin.js")),
);
export const isProduction = process.env.NODE_ENV === "production";

const createLog =
    (level: string, fn: typeof console.log) =>
    (objOrMsg: object | string, msg?: string) => {
        if (typeof objOrMsg === "string") {
            fn(JSON.stringify({ level, msg: objOrMsg }));
        } else {
            fn(
                JSON.stringify({
                    level,
                    ...objOrMsg,
                    msg: msg ?? (objOrMsg as { msg?: string }).msg,
                }),
            );
        }
    };

export const cloudflareLogger = {
    level: process.env.PAYLOAD_LOG_LEVEL || "info",
    trace: createLog("trace", console.debug),
    debug: createLog("debug", console.debug),
    info: createLog("info", console.log),
    warn: createLog("warn", console.warn),
    error: createLog("error", console.error),
    fatal: createLog("fatal", console.error),
    silent: () => {},
} as unknown as PayloadLogger;

export const cloudflare =
    isCLI || !isProduction
        ? await getCloudflareContextFromWrangler()
        : await getCloudflareContext({ async: true });

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
async function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
    const { getPlatformProxy } = await import(
        /* webpackIgnore: true */ `${"__wrangler".replaceAll("_", "")}`
    );
    return getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
    } satisfies GetPlatformProxyOptions);
}
