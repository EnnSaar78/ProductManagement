import { getLocale, getTranslations } from "next-intl/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { Field, PageHeader } from "@/components/ui";
import { createSignal } from "@/lib/actions/content";
import { listCategories, listCompanies, listMarkets, listProducts, listTrendTags } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

const TYPES = ["launch", "price_change", "discontinue", "partnership", "m_and_a", "regulation", "technology", "financials", "analyst", "other"] as const;

export default async function NewSignalPage() {
  await requireRole("admin", "editor");
  const t = await getTranslations("signals");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const markets = (await listMarkets());
  const companies = (await listCompanies());
  const products = (await listProducts());
  const categories = (await listCategories());
  const tags = (await listTrendTags());
  const sources = await db.select({ id: schema.sources.id, title: schema.sources.title }).from(schema.sources).orderBy(desc(schema.sources.fetchedAt)).limit(200).all();
  const tn = (x: { nameEt: string; nameEn: string }) => (locale === "en" ? x.nameEn : x.nameEt);
  return (
    <>
      <PageHeader title={t("new")} />
      <form action={createSignal} className="card grid max-w-4xl gap-3 md:grid-cols-3">
        <Field label={tc("name")} className="md:col-span-2"><input name="title" required /></Field>
        <Field label={tc("type")}>
          <select name="type" defaultValue="launch">{TYPES.map((x) => <option key={x} value={x}>{t(`types.${x}`)}</option>)}</select>
        </Field>
        <Field label={t("summary")} className="md:col-span-3"><textarea name="summary" rows={3} /></Field>
        <Field label={tc("country")}>
          <select name="marketId" defaultValue=""><option value="">{tc("none")}</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </Field>
        <Field label={tc("company")}>
          <select name="companyId" defaultValue=""><option value="">{tc("none")}</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.marketCode})</option>)}</select>
        </Field>
        <Field label="Toode">
          <select name="productId" defaultValue=""><option value="">{tc("none")}</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.companyName}</option>)}</select>
        </Field>
        <Field label={tc("category")}>
          <select name="categoryId" defaultValue=""><option value="">{tc("none")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.code} {tn(c)}</option>)}</select>
        </Field>
        <Field label={t("occurredAt")}><input name="occurredAt" type="date" /></Field>
        <Field label={t("horizon")}>
          <select name="horizon" defaultValue="now">{(["now", "near", "far"] as const).map((h) => <option key={h} value={h}>{t(`horizons.${h}`)}</option>)}</select>
        </Field>
        <Field label={`${t("novelty")} (1–5)`}><input name="novelty" type="number" min={1} max={5} defaultValue={3} /></Field>
        <Field label={`${t("impact")} (1–5)`}><input name="impact" type="number" min={1} max={5} defaultValue={3} /></Field>
        <Field label={`${t("confidence")} (1–5)`}><input name="confidence" type="number" min={1} max={5} defaultValue={3} /></Field>
        <Field label={t("soWhat")} className="md:col-span-3"><textarea name="soWhat" rows={2} /></Field>
        <Field label={tc("source")} className="md:col-span-3">
          <select name="sourceId" defaultValue=""><option value="">{tc("noSource")}</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        </Field>
        <fieldset className="md:col-span-3">
          <label>{t("tags")}</label>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((x) => (
              <label key={x.id} className="flex items-center gap-2 text-sm font-normal normal-case text-[var(--text)]">
                <input type="checkbox" name="tagIds" value={x.id} className="w-auto" /> {tn(x)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="md:col-span-3"><button className="btn">{tc("save")}</button></div>
      </form>
    </>
  );
}
