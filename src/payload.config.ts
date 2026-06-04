import { canRunJobs } from "@/access/jobs";
import { jobsCollectionOverrides } from "@/lib/queue";
import { tasks } from "@/tasks";
import { cloudflare, cloudflareLogger, isProduction } from "@context";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { r2Storage } from "@payloadcms/storage-r2";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Media } from "./collections/media";
import { Users } from "./collections/users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    jobs: {
        tasks,
        access: {
            run: canRunJobs,
        },
        jobsCollectionOverrides,
    },
    collections: [Users, Media],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || "",
    typescript: {
        outputFile: path.resolve(dirname, "../payload-types.d.ts"),
    },
    logger: isProduction ? cloudflareLogger : undefined,
    db: sqliteD1Adapter({
        idType: "number",
        blocksAsJSON: true,
        autoIncrement: true,
        binding: cloudflare.env.D1,
        migrationDir: path.resolve(dirname, "../migrations"),
        generateSchemaOutputFile: path.resolve(dirname, "db/schema.ts"),
    }),
    plugins: [
        r2Storage({
            bucket: cloudflare.env.R2,
            collections: { media: true },
        }),
    ],
});
