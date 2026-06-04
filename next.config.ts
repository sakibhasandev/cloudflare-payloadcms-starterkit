import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    turbopack: {
        resolveAlias: {
            "drizzle-kit/api": "./stubs/drizzle-kit-api.mjs",
        },
    },
};

export default withPayload(nextConfig);

initOpenNextCloudflareForDev();
