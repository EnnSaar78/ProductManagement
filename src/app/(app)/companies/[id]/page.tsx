import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { Badge, Card, Empty, Field, LinkButton, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CanvasGrid } from "@/components/CanvasGrid";
import { SourceForm } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { MappingCard } from "@/components/MappingCard";
import { addCompanyKpi, deleteCompanyKpi } from "@/lib/actions/content";
import { listProducts, sourceMap } from "@/lib/queries";
import { canEdit, requireUser } from "@/lib/auth";

const KPI_METRICS = [
  "revenue", "revenue_growth", "service_revenue", "b2b_revenue", "ict_revenue", "ebitda", "ebitda_margin", "capex", "capex_to_sales",
  "mobile_subs", "fixed_subs", "tv_subs", "fmc_subs", "b2b_customers", "arpu_mobile", "arpu_fixed", "arpa_b2b",
  "churn", "nps", "coverage_5g", "fiber_passed", "fiber_connected", "employees", "market_share_mobile", "market_share_fixed",
] as const;

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const editable = canEdit(user);
  const { id } = await params;
  const company = await db.select().from(schema.companies).where(eq(schema.companies.id, id)).get();
  if (!company) notFound();
  const market = (await db.select().from(schema.markets).where(eq(schema.markets.id, company.marketId)).get())!;
  const parent = company.parentId ? await db.select().from(schema.companies).where(eq(schema.companies.id, company.parentId)).get() : null;
  const children = await db.select().from(schema.companies).where(eq(schema.companies.parentId, id)).orderBy(asc(schema.companies.name)).all();
  const kpis = await db.select().from(schema.companyKpis).where(eq(schema.companyKpis.companyId, id)).orderBy(asc(schema.companyKpis.metric), desc(schema.companyKpis.period)).all();
  const canvas = await db.select().from(schema.canvasItems).where(eq(schema.canvasItems.companyId, id)).orderBy(asc(schema.canvasItems.createdAt)).all();
  const sources = await db.select().from(schema.sources).where(eq(schema.sources.companyId, id)).orderBy(desc(schema.sources.fetchedAt)).all();
  const products = (await listProducts({ companyId: id }));
  const srcMap = (await sourceMap([...canvas.map((c) => c.sourceId), ...kpis.map((k) => k.sourceId)]));
  const t = await getTranslations("companies");
  const tc = await getTranslations("common");
  const tp = await getTranslations("products");
  const tsrc = await getTranslations("sources");
  const locale = await getLocale();
  const path = `/companies/${id}`;
  const metricLabel = (m: string) => (KPI_METRICS as readonly string[]).includes(m) ? t(`kpiMetrics.${m}`) : m;

  return (
    <>
      <PageHeader
        title={company.name}
        subtitle={`${market.name} · ${t(`types.${company.type}`)}${company.group ? ` · ${company.group}` : ""}${parent ? ` · ${t("parent")}: ${parent.name}` : ""}`}
        actions={editable ? <LinkButton href={`${path}/edit`} secondary>{tc("edit")}</LinkButton> : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={tc("name")} className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="muted text-xs">{t("listing.title")}</dt>
              <dd>
                <Badge>{t(`listing.statuses.${company.listingStatus}`)}</Badge>
                {company.stockExchange && <span className="ml-2">{company.stockExchange}{company.ticker ? ` · ${company.ticker}` : ""}</span>}
                {company.listedEntity && <div className="muted text-xs">{company.listedEntity}</div>}
              </dd>
            </div>
            {company.brands && (<div><dt className="muted text-xs">{t("brands")}</dt><dd>{company.brands}</dd></div>)}
            {company.website && (<div><dt className="muted text-xs">{tc("website")}</dt><dd><a className="text-[var(--accent)] underline" href={company.website} target="_blank" rel="noreferrer">{company.website}</a></dd></div>)}
            {company.segments && (<div><dt className="muted text-xs">{t("segments")}</dt><dd>{company.segments}</dd></div>)}
            {company.strategy && (<div><dt className="muted text-xs">{t("strategy")}</dt><dd className="whitespace-pre-wrap">{company.strategy}</dd></div>)}
            {company.notes && (<div><dt className="muted text-xs">{tc("notes")}</dt><dd className="whitespace-pre-wrap">{company.notes}</dd></div>)}
            {parent && (<div><dt className="muted text-xs">{t("parent")}</dt><dd><Link href={`/companies/${parent.id}`} className="hover:underline">{parent.name}</Link></dd></div>)}
          </dl>
          {children.length > 0 && (
            <div className="mt-3">
              <div className="muted text-xs">{t("subsidiaries")}</div>
              <ul className="text-sm">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/companies/${c.id}`} className="hover:underline">{c.name}</Link> <Badge>{t(`types.${c.type}`)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Card title={`${tp("title")} (${products.length})`} className="lg:col-span-2">
          {products.length === 0 ? (
            <Empty text={tc("empty")} />
          ) : (
            <table className="table">
              <thead><tr><th>{tc("name")}</th><th>{tc("category")}</th><th>{tc("status")}</th><th>{tp("pricingModel")}</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link></td>
                    <td>{p.categoryCode} {locale === "en" ? p.categoryNameEn : p.categoryNameEt}</td>
                    <td>{tp(`statuses.${p.status}`)}</td>
                    <td>{tp(`pricingModels.${p.pricingModel}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editable && (
            <div className="mt-3">
              <LinkButton href={`/products/new?company=${id}`} secondary>{tp("new")}</LinkButton>
            </div>
          )}
        </Card>
      </div>

      <Card title={t("kpis")} className="mt-4">
        {kpis.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <table className="table">
            <thead><tr><th>{t("metric")}</th><th>{tc("period")}</th><th>{tc("value")}</th><th>{t("scope")}</th><th>{tc("source")}</th><th>{tc("notes")}</th>{editable && <th></th>}</tr></thead>
            <tbody>
              {kpis.map((k) => {
                const s = k.sourceId ? srcMap.get(k.sourceId) : null;
                return (
                  <tr key={k.id}>
                    <td>{metricLabel(k.metric)}</td>
                    <td>{k.period}</td>
                    <td className="font-mono">{k.value.toLocaleString(locale)} {k.unit}{k.currency ? ` ${k.currency}` : ""}</td>
                    <td>{k.scope ?? tc("none")}</td>
                    <td>{s ? (s.url ? <a className="text-[var(--accent)] underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title) : tc("noSource")}</td>
                    <td>{k.note ?? ""}</td>
                    {editable && (<td><form action={deleteCompanyKpi.bind(null, id, k.id)}><ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton></form></td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {editable && (
          <form action={addCompanyKpi.bind(null, id)} className="mt-3 grid gap-2 md:grid-cols-7">
            <Field label={t("metric")}>
              <select name="metric" defaultValue="revenue">
                {KPI_METRICS.map((m) => (<option key={m} value={m}>{t(`kpiMetrics.${m}`)}</option>))}
              </select>
            </Field>
            <Field label={tc("period")}><input name="period" placeholder="2024 / 2025-Q3" required /></Field>
            <Field label={tc("value")}><input name="value" type="text" inputMode="decimal" required /></Field>
            <Field label={tc("unit")}><input name="unit" placeholder="m, k, %" /></Field>
            <Field label="Valuuta"><input name="currency" placeholder={market.currency} /></Field>
            <Field label={t("scope")}><input name="scope" placeholder="riik / segment" /></Field>
            <Field label={tc("source")}>
              <select name="sourceId" defaultValue="">
                <option value="">{tc("noSource")}</option>
                {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
              </select>
            </Field>
            <Field label={tc("notes")} className="md:col-span-6"><input name="note" /></Field>
            <div className="flex items-end"><button className="btn">{t("addKpi")}</button></div>
          </form>
        )}
      </Card>

      <MappingCard companyId={id} website={company.website} editable={editable} />

      <Card title={t("canvas")} className="mt-4">
        <CanvasGrid items={canvas} target={{ companyId: id }} path={path} sources={sources} srcMap={srcMap} editable={editable} />
      </Card>

      <Card title={tsrc("title")} className="mt-4">
        <SourceList sources={sources} editable={editable} redirectTo={path} />
        {editable && (<div className="mt-3 border-t border-[var(--border)] pt-3"><SourceForm companyId={id} redirectTo={path} /></div>)}
      </Card>
    </>
  );
}
