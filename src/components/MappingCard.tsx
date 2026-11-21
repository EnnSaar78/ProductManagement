import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { Card, Field, Badge } from "@/components/ui";
import { saveMappingConfig, startMapping } from "@/lib/actions/mapping";

const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"] as const;

export function statusBadgeClass(status: string) {
  return status === "done" ? "bg-emerald-50 text-emerald-800" : status === "failed" ? "bg-red-50 text-red-800" : status === "running" ? "bg-sky-50 text-sky-800" : status === "cancelled" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800";
}

export async function MappingCard({ companyId, website, editable }: { companyId: string; website: string | null; editable: boolean }) {
  const t = await getTranslations("mapping");
  const tc = await getTranslations("common");
  const config = await db.select().from(schema.mappingConfigs).where(eq(schema.mappingConfigs.companyId, companyId)).get();
  const jobs = await db.select().from(schema.mappingJobs).where(eq(schema.mappingJobs.companyId, companyId)).orderBy(desc(schema.mappingJobs.createdAt)).limit(10).all();
  const active = jobs.find((j) => j.status === "queued" || j.status === "running");
  const schedules = [0, 7, 14, 30, 90];
  return (
    <Card title={t("title")} className="mt-4">
      <span id="mapping" />
      <p className="muted mb-3 text-xs">{t("hint")}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          {editable ? (
            <form action={saveMappingConfig.bind(null, companyId)} className="space-y-2">
              <Field label={t("seedUrls")}>
                <textarea name="seedUrls" rows={3} required defaultValue={config?.seedUrls ?? (website ?? "")} placeholder="https://www.example.com/business" />
              </Field>
              <Field label={t("includeHints")}>
                <input name="includeHints" defaultValue={config?.includeHints ?? ""} placeholder="business, yritys, ariklient, pricing" />
              </Field>
              <Field label={t("excludePatterns")}>
                <input name="excludePatterns" defaultValue={config?.excludePatterns ?? ""} placeholder="/blog, /careers, /news" />
              </Field>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Field label={tc("segment")}>
                  <select name="segment" defaultValue={config?.segment ?? "B2B"}>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                    <option value="ALL">B2B + B2C</option>
                  </select>
                </Field>
                <Field label={t("maxPages")}>
                  <input name="maxPages" type="number" min={1} max={80} defaultValue={config?.maxPages ?? 30} />
                </Field>
                <Field label={t("schedule")}>
                  <select name="scheduleDays" defaultValue={String(config?.scheduleDays ?? 0)}>
                    {schedules.map((d) => (
                      <option key={d} value={d}>
                        {d === 0 ? t("manualOnly") : t("everyDays", { days: d })}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("language")}>
                  <select name="language" defaultValue={config?.language ?? "et"}>
                    <option value="et">eesti</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field label={t("extractModel")}>
                  <select name="extractModel" defaultValue={config?.extractModel ?? "claude-opus-5-5"}>
                    {MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
                <Field label={t("synthesisModel")}>
                  <select name="synthesisModel" defaultValue={config?.synthesisModel ?? "claude-opus-5-5"}>
                    {MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
                <label className="col-span-2 flex items-center gap-2 self-end text-sm font-normal normal-case text-[var(--text)]">
                  <input type="checkbox" name="enabled" defaultChecked={config?.enabled ?? true} className="w-auto" /> {t("enabled")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary">{t("saveConfig")}</button>
                {config && (
                  <span className="muted text-xs">
                    {t("lastRun")}: {config.lastRunAt?.slice(0, 16).replace("T", " ") ?? tc("none")} · {t("nextRun")}: {config.nextRunAt?.slice(0, 16).replace("T", " ") ?? tc("none")}
                  </span>
                )}
              </div>
            </form>
          ) : (
            <p className="muted text-sm">{config ? `${t("seedUrls")}: ${config.seedUrls}` : tc("empty")}</p>
          )}
          {editable && config && (
            <form action={startMapping.bind(null, companyId)} className="mt-3">
              <button className="btn" disabled={!!active}>
                {active ? t("running") : t("runNow")}
              </button>
            </form>
          )}
          {editable && !config && <p className="muted mt-2 text-xs">{t("saveFirst")}</p>}
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("jobs")}</h3>
          {jobs.length === 0 ? (
            <p className="muted text-sm">{tc("empty")}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("started")}</th>
                  <th>{tc("status")}</th>
                  <th>{t("trigger")}</th>
                  <th>{t("pages")}</th>
                  <th>{t("products")}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <Link href={`/mapping/${j.id}`} className="hover:underline">
                        {(j.startedAt ?? j.createdAt).slice(0, 16).replace("T", " ")}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(j.status)}`}>{t(`statuses.${j.status}`)}</span>
                    </td>
                    <td>{t(`triggers.${j.trigger}`)}</td>
                    <td>
                      {j.pagesDone}/{j.pagesTotal}
                    </td>
                    <td>
                      {j.productsCreated + j.productsUpdated}
                      {j.productsFound > 0 && <span className="muted"> ({j.productsFound})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {active && <Badge>{t("inProgress")}</Badge>}
        </div>
      </div>
    </Card>
  );
}
