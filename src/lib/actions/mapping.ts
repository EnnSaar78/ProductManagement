"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { db, newId, schema } from "@/db";
import { requireRole } from "@/lib/auth";
import { createAndStartJob } from "@/mapping/jobs";
import type { MappingEnv } from "@/mapping/env";

const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"] as const;
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  if (v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? null : s;
};

function mappingEnv(): MappingEnv {
  return getCloudflareContext().env as unknown as MappingEnv;
}

export async function saveMappingConfig(companyId: string, fd: FormData) {
  await requireRole("admin", "editor");
  const seedUrls = (str(fd, "seedUrls") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .join("\n");
  const model = (k: string) => {
    const v = str(fd, k);
    return v && (MODELS as readonly string[]).includes(v) ? v : "claude-opus-5-5";
  };
  const segRaw = str(fd, "segment");
  const segment = segRaw === "B2C" || segRaw === "ALL" ? segRaw : "B2B";
  const values = {
    seedUrls,
    includeHints: str(fd, "includeHints"),
    excludePatterns: str(fd, "excludePatterns"),
    segment: segment as "B2B" | "B2C" | "ALL",
    maxPages: Math.max(1, Math.min(80, Number(str(fd, "maxPages") ?? 30) || 30)),
    scheduleDays: Math.max(0, Math.min(365, Number(str(fd, "scheduleDays") ?? 0) || 0)),
    extractModel: model("extractModel"),
    synthesisModel: model("synthesisModel"),
    language: str(fd, "language") === "en" ? "en" : "et",
    enabled: fd.get("enabled") === "on",
    updatedAt: new Date().toISOString(),
  };
  const existing = await db.select().from(schema.mappingConfigs).where(eq(schema.mappingConfigs.companyId, companyId)).get();
  const nextRunAt = values.scheduleDays > 0 ? (existing?.nextRunAt ?? new Date(Date.now() + values.scheduleDays * 86400_000).toISOString()) : null;
  if (existing) await db.update(schema.mappingConfigs).set({ ...values, nextRunAt }).where(eq(schema.mappingConfigs.id, existing.id)).run();
  else await db.insert(schema.mappingConfigs).values({ id: newId(), companyId, ...values, nextRunAt }).run();
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}#mapping`);
}

export async function startMapping(companyId: string) {
  const u = await requireRole("admin", "editor");
  const jobId = await createAndStartJob(db, mappingEnv(), companyId, "manual", u.id);
  revalidatePath(`/companies/${companyId}`);
  if (jobId) redirect(`/mapping/${jobId}`);
  redirect(`/companies/${companyId}#mapping`);
}

export async function cancelMapping(jobId: string) {
  await requireRole("admin", "editor");
  const job = await db.select().from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  if (!job || (job.status !== "queued" && job.status !== "running")) return;
  await db.update(schema.mappingJobs).set({ status: "cancelled", finishedAt: new Date().toISOString() }).where(eq(schema.mappingJobs.id, jobId)).run();
  try {
    if (job.workflowInstanceId) {
      const inst = await mappingEnv().MAP_COMPANY.get(job.workflowInstanceId);
      await inst.terminate();
    }
  } catch {
    /* instants võib olla juba lõppenud */
  }
  revalidatePath(`/mapping/${jobId}`);
  revalidatePath(`/companies/${job.companyId}`);
}

export async function markProductReviewed(productId: string) {
  await requireRole("admin", "editor");
  await db.update(schema.products).set({ reviewStatus: "reviewed", updatedAt: new Date().toISOString() }).where(eq(schema.products.id, productId)).run();
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}
