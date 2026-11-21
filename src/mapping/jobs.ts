import { and, eq, inArray, lte, isNull, or, gt } from "drizzle-orm";
import * as schema from "../db/schema";
import type { Db } from "../db";
import type { MappingEnv } from "./env";

const newId = () => crypto.randomUUID();

/** Loob töö ja käivitab Workflow-instantsi. Tagastab töö id või null, kui ettevõttel on juba töö pooleli. */
export async function createAndStartJob(db: Db, env: MappingEnv, companyId: string, trigger: "manual" | "schedule", userId?: string): Promise<string | null> {
  const config = await db.select().from(schema.mappingConfigs).where(eq(schema.mappingConfigs.companyId, companyId)).get();
  if (!config) return null;
  const active = await db
    .select({ id: schema.mappingJobs.id })
    .from(schema.mappingJobs)
    .where(and(eq(schema.mappingJobs.companyId, companyId), inArray(schema.mappingJobs.status, ["queued", "running"])))
    .get();
  if (active) return null;
  const jobId = newId();
  await db.insert(schema.mappingJobs).values({ id: jobId, companyId, trigger, status: "queued", configSnapshot: JSON.stringify(config), createdBy: userId ?? null, log: JSON.stringify([{ at: new Date().toISOString(), level: "info", msg: "Töö loodud" }]) }).run();
  try {
    const instance = await env.MAP_COMPANY.create({ id: jobId, params: { jobId } });
    await db.update(schema.mappingJobs).set({ workflowInstanceId: instance.id }).where(eq(schema.mappingJobs.id, jobId)).run();
  } catch (e) {
    await db.update(schema.mappingJobs).set({ status: "failed", error: `Workflow käivitus ebaõnnestus: ${e instanceof Error ? e.message : String(e)}`, finishedAt: new Date().toISOString() }).where(eq(schema.mappingJobs.id, jobId)).run();
  }
  return jobId;
}

/** Ajastatud käivitus: kõik lubatud seadistused, mille aeg on käes. */
export async function runDueSchedules(db: Db, env: MappingEnv): Promise<string[]> {
  const now = new Date().toISOString();
  const due = await db
    .select()
    .from(schema.mappingConfigs)
    .where(and(eq(schema.mappingConfigs.enabled, true), gt(schema.mappingConfigs.scheduleDays, 0), or(isNull(schema.mappingConfigs.nextRunAt), lte(schema.mappingConfigs.nextRunAt, now))))
    .all();
  const started: string[] = [];
  for (const cfg of due) {
    const jobId = await createAndStartJob(db, env, cfg.companyId, "schedule");
    // järgmine aeg määratakse kohe, et topeltkäivitust vältida ka ebaõnnestumisel
    await db.update(schema.mappingConfigs).set({ nextRunAt: new Date(Date.now() + cfg.scheduleDays * 86400_000).toISOString() }).where(eq(schema.mappingConfigs.id, cfg.id)).run();
    if (jobId) started.push(jobId);
  }
  return started;
}
