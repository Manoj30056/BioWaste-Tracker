import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Hardcoded Neon database URL as fallback
const DEFAULT_DB_URL = "postgresql://neondb_owner:npg_7tTx5DXyEBCj@ep-orange-tooth-ax0ms69v-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

const databaseUrl = process.env.DATABASE_URL || DEFAULT_DB_URL;

const globalForDb = globalThis as typeof globalThis & {
  __pool?: Pool;
};

export const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon") ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pool = pool;
}

export const db = drizzle(pool);
