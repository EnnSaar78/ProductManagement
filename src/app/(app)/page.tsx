import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, PageHeader, Score } from "@/components/ui";
import { dashboardStats, listProducts, listSignals } from "@/lib/queries";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");
  const ts = await getTranslations("signals");
  const locale = await getLocale();
  const { forbidden } = await searchParams;
  const stats = dashboardStats();
  const signals = listSignals(8);
  const products = listProducts().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 8);
  const statKeys = ["markets", "companies", "products", "signals", "sources"] as const;
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("scopeNote")} />
      {forbidden && <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{tc("forbidden")}</p>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {statKeys.map((k) => (
          <Link key={k} href={k === "markets" ? "/markets" : `/${k}`} className="card hover:border-[var(--accent)]">
            <div className="muted text-xs">{t(`stats.${k}`)}</div>
            <div className="text-2xl font-semibold">{stats[k]}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("latestSignals")}>
          {signals.length === 0 && <p className="muted text-sm">{tc("empty")}</p>}
          <ul className="space-y-2">
            {signals.map((s) => (
              <li key={s.id} className="border-b border-[var(--border)] pb-2 text-sm last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{s.title}</span>
                  <Score value={s.impact} />
                </div>
                <div className="muted text-xs">
                  {ts(`types.${s.type}`)} · {s.companyName ?? ""} {s.marketName ? `(${s.marketName})` : ""} · {s.occurredAt ?? s.createdAt.slice(0, 10)}
                </div>
                {s.soWhat && <div className="mt-1 text-xs">{s.soWhat}</div>}
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t("latestProducts")}>
          {products.length === 0 && <p className="muted text-sm">{tc("empty")}</p>}
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="border-b border-[var(--border)] pb-2 text-sm last:border-0">
                <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
                <div className="muted text-xs">
                  {p.companyName} · {p.marketName} · {p.categoryCode} {locale === "en" ? p.categoryNameEn : p.categoryNameEt}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
