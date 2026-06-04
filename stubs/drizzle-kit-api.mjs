const unsupported = (name) => () => {
    throw new Error(
        `drizzle-kit/api.${name}() is not available at runtime. ` +
            `This stub is loaded in the Cloudflare Workers bundle because drizzle-kit ` +
            `is a build-time only dependency (used for schema generation / migrations).`,
    );
};

export const generateDrizzleJson = unsupported("generateDrizzleJson");
export const generateMigration = unsupported("generateMigration");
export const pushSchema = unsupported("pushSchema");
export const startStudioPostgresServer = unsupported("startStudioPostgresServer");

export const generateSQLiteDrizzleJson = unsupported("generateSQLiteDrizzleJson");
export const generateSQLiteMigration = unsupported("generateSQLiteMigration");
export const pushSQLiteSchema = unsupported("pushSQLiteSchema");
export const startStudioSQLiteServer = unsupported("startStudioSQLiteServer");

export const generateMySQLDrizzleJson = unsupported("generateMySQLDrizzleJson");
export const generateMySQLMigration = unsupported("generateMySQLMigration");
export const pushMySQLSchema = unsupported("pushMySQLSchema");
export const startStudioMySQLServer = unsupported("startStudioMySQLServer");

export const generateSingleStoreDrizzleJson = unsupported("generateSingleStoreDrizzleJson");
export const generateSingleStoreMigration = unsupported("generateSingleStoreMigration");
export const pushSingleStoreSchema = unsupported("pushSingleStoreSchema");
export const startStudioSingleStoreServer = unsupported("startStudioSingleStoreServer");

export const upPgSnapshot = unsupported("upPgSnapshot");

export default {};
