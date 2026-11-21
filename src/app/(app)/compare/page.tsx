import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getProductFull, listCategories, listProducts } from "@/lib/queries";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ category?: string; ids?: string | string[] }> }) {
  const t = await getTranslations("compare");
  const tp = await getTranslations("products");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const sp = await searchParams;
  const categories = listCategories();
  const categoryId = sp.category || "";
  const candidates = categoryId ? listProducts({ categoryId }) : [];
  const ids = (Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : []).slice(0, 6);
  const selected = ids.map((id) => getProductFull(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const cname = (c: { nameEt: string; nameEn: string }) => (locale === "en" ? c.nameEn : c.nameEt);
  const fmt = (n: number | null | undefined) => (n == null ? tc("none") : n.toLocaleString(locale, { maximumFractionDigits: 2 }));

  const rows: { key: string; render: (p: (typeof selected)[number]) => React.ReactNode }[] = [
    { key: "company", render: (p) => <Link href={`/companies/${p.company.id}`} className="hover:underline">{p.company.name}</Link> },
    { key: "market", render: (p) => p.market.name },
    { key: "status", render: (p) => tp(`statuses.${p.product.status}`) },
    { key: "headline", render: (p) => p.messages.find((m) => m.kind === "headline")?.text ?? tc("none") },
    { key: "summary", render: (p) => p.product.summary ?? tc("none") },
    { key: "targetCustomer", render: (p) => p.product.targetCustomer ?? tc("none") },
    { key: "components", render: (p) => <span className="whitespace-pre-wrap">{p.product.components ?? tc("none")}</span> },
    { key: "addons", render: (p) => (p.addons.length ? <ul className="list-disc pl-4">{p.addons.map((a) => <li key={a.id}>{a.name}{a.price != null ? ` (${fmt(a.price)} ${a.currency})` : ""}</li>)}</ul> : <span className="whitespace-pre-wrap">{p.product.addonsSummary ?? tc("none")}</span>) },
    { key: "pricingModel", render: (p) => tp(`pricingModels.${p.product.pricingModel}`) },
    { key: "plans", render: (p) => (p.plans.length ? <ul className="list-disc pl-4">{p.plans.map((pl) => <li key={pl.id}>{pl.name}{pl.price != null ? `: ${fmt(pl.price)} ${pl.currency}` : ""}{pl.priceEur != null ? ` (≈${fmt(pl.priceEur)} EUR)` : ""}</li>)}</ul> : tc("none")) },
    { key: "entryPrice", render: (p) => { const e = p.plans.map((x) => x.priceEur).filter((x): x is number => x != null); return e.length ? fmt(Math.min(...e)) : tc("none"); } },
    { key: "archetypes", render: (p) => <div className="flex flex-wrap gap-1">{p.archetypes.map((a) => <Badge key={a.id}>{cname(a)}</Badge>)}</div> },
    { key: "technology", render: (p) => p.product.technology ?? tc("none") },
    { key: "partners", render: (p) => p.product.partners ?? tc("none") },
    { key: "painsCovered", render: (p) => { const pains = p.painGain.filter((x) => x.kind === "pain"); const covered = pains.filter((x) => x.fitScore >= 2); return pains.length ? <span>{covered.length}/{pains.length}<ul className="list-disc pl-4 text-xs">{covered.map((x) => <li key={x.id}>{x.customerText}</li>)}</ul></span> : tc("none"); } },
    { key: "strengths", render: (p) => <ul className="list-disc pl-4">{p.swot.filter((s) => s.quadrant === "strength").map((s) => <li key={s.id}>{s.text}</li>)}</ul> },
    { key: "weaknesses", render: (p) => <ul className="list-disc pl-4">{p.swot.filter((s) => s.quadrant === "weakness").map((s) => <li key={s.id}>{s.text}</li>)}</ul> },
  ];

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("hint")} />
      <form className="card mb-4 space-y-3">
        <div className="w-80">
          <label>{t("selectCategory")}</label>
          <select name="category" defaultValue={categoryId}>
            <option value="">{tc("none")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.segment} · {c.code} {cname(c)}
              </option>
            ))}
          </select>
        </div>
        {categoryId && (
          <div>
            <label>{t("selectProducts")}</label>
            {candidates.length === 0 ? (
              <p className="muted text-sm">{tc("empty")}</p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm font-normal normal-case text-[var(--text)]">
                    <input type="checkbox" name="ids" value={p.id} defaultChecked={ids.includes(p.id)} className="w-auto" />
                    {p.name} <span className="muted">· {p.companyName} ({p.marketCode})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        <button className="btn">{t("run")}</button>
      </form>
      {selected.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-40"></th>
                {selected.map((p) => (
                  <th key={p.product.id}>
                    <Link href={`/products/${p.product.id}`} className="hover:underline">{p.product.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="muted text-xs font-semibold uppercase">{t(`rows.${r.key}`)}</td>
                  {selected.map((p) => (
                    <td key={p.product.id} className="text-sm">{r.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
