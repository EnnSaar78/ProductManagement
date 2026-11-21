import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export function getDb(): Db {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

/** Päringu-skoopi andmebaas: iga ligipääs lahendab D1 sidumise jooksva päringu kontekstist. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
export const newId = () => crypto.randomUUID();
