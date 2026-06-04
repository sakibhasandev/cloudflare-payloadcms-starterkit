import { AnyD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getdbinstance = (db: AnyD1Database) => {
    return drizzle(db, { schema });
};
