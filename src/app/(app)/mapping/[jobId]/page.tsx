import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { statusBadgeClass } from "@/components/MappingCard";
import { cancelMapping } from "@/lib/actions/mapping";
import { canEdit, requireUser } from "@/lib/auth";

export default async function MappingJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireUser();
  const { jobId } = await params;
  const job = await db.select().from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  if (!job) notFound();
  const company = (await db.select().from(schema.companies).where(eq(schema.companies.id, job.companyId)).get())!;
  const pages = await db.select().from(schema.mappingPages).where(eq(schema.mappingPages.jobId, jobId)).orderBy(asc(schema.mappingPages.url)).all();
  const products = await db
    .select({ id: schema.products.id, name: schema.products.name, reviewStatus: schema.products.reviewStatus, lastMappedAt: schema.products.lastMappedAt })
    .from(schema.products)
    .where(eq(schema.products.companyId, job.companyId))
    .all();
  const touched = job.startedAt ? products.filter((p) => p.lastMappedAt && p.lastMappedAt >= job.startedAt!) : [];
  const t = await getTranslations("mapping");
  const tc = await getTranslations("common");
  const running = job.status === "queued" || job.status === "running";
  const logs = (job.log ? (JSON.parse(job.log) as { at: string; level: string; msg: string }[]) : []).slice().reverse();
  const cost = ((job.inputTokens / 1e6) * 4 + (job.outputTokens / 1e6) * 20).toFixed(2);
  return (
    <>
      {running && <meta httpEquiv="refresh" content="10" />}
      <PageHeader
        title={`${t("jobTitle")}: ${company.name}`}
        subtitle={`${t(`statuses.${job.status}`)}${job.phase ? ` · ${t(`phases.${job.phase}`)}` : ""} · ${t(`triggers.${job.trigger}`)} · ${(job.startedAt ?? job.createdAt).slice(0, 16).replace("T", " ")}`}
        actions={
          <>
            <Link href={`/companies/${company.id}#mapping`} className="btn-secondary">{tc("back")}</Link>
            {running && canEdit(user) && (
              <form action={cancelMapping.bind(null, jobId)}>
                <ConfirmButton message={t("confirmCancel")} className="btn-secondary text-red-700">{t("cancel")}</ConfirmButton>
              </form>
            )}
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          [t("pages"), `${job.pagesDone}/${job.pagesTotal}`],
          [t("found"), String(job.productsFound)],
          [t("created"), String(job.productsCreated)],
          [t("updated"), String(job.productsUpdated)],
          [t("tokens"), `${(job.inputTokens / 1000).toFixed(0)}k / ${(job.outputTokens / 1000).toFixed(0)}k`],
          [t("estCost"), `≈ ${cost} USD`],
        ].map(([k, v]) => (
          <div key={k} className="card">
            <div className="muted text-xs">{k}</div>
            <div className="text-lg font-semibold">{v}</div>
          </div>
        ))}
      </div>
      {job.error && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-800">{job.error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("log")}>
          <ul className="max-h-96 space-y-1 overflow-y-auto font-mono text-xs">
            {logs.map((l, i) => (
              <li key={i} className={l.level === "error" ? "text-red-700" : l.level === "warn" ? "text-amber-700" : ""}>
                <span className="muted">{l.at.slice(11, 19)}</span> {l.msg}
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t("touchedProducts")}>
          {touched.length === 0 ? (
            <p className="muted text-sm">{tc("empty")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {touched.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  <span className={`badge ${p.reviewStatus === "unreviewed" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{t(`review.${p.reviewStatus}`)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title={`${t("pages")} (${pages.length})`} className="mt-4">
        {pages.length === 0 ? (
          <p className="muted text-sm">{tc("empty")}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>URL</th>
                <th>{tc("status")}</th>
                <th>HTTP</th>
                <th>{t("textLength")}</th>
                <th>{t("products")}</th>
                <th>{tc("notes")}</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a href={p.url} target="_blank" rel="noreferrer" className="break-all text-[var(--accent)] underline">{p.url}</a>
                    {p.title && <div className="muted text-xs">{p.title}</div>}
                  </td>
                  <td><span className={`badge ${statusBadgeClass(p.status === "extracted" ? "done" : p.status === "failed" ? "failed" : p.status === "queued" ? "queued" : "cancelled")}`}>{t(`pageStatuses.${p.status}`)}</span></td>
                  <td>{p.httpStatus ?? tc("none")}</td>
                  <td>{p.textLength ?? tc("none")}</td>
                  <td>{p.productsFound}</td>
                  <td className="text-xs">{p.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
