import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge, Empty, LinkButton, PageHeader } from "@/components/ui";
import { listCategories, listMarkets, listProducts } from "@/lib/queries";
import { canEdit, requireUser } from "@/lib/auth";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; market?: string; segment?: string; q?: string }> }) {
  const user = await requireUser();
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const sp = await searchParams;
  const segment = sp.segment === "B2C" ? "B2C" : sp.segment === "" ? undefined : "B2B";
  const categories = (await listCategories());
  const markets = (await listMarkets());
  const rows = (await listProducts({ categoryId: sp.category || undefined, marketId: sp.market || undefined, segment })).filter(
    (p) => !sp.q || p.name.toLowerCase().includes(sp.q.toLowerCase()) || p.companyName.toLowerCase().includes(sp.q.toLowerCase()),
  );
  const cname = (p: { categoryNameEt: string; categoryNameEn: string }) => (locale === "en" ? p.categoryNameEn : p.categoryNameEt);
  return (
    <>
      <PageHeader title={t("title")} actions={canEdit(user) ? <LinkButton href="/products/new">{t("new")}</LinkButton> : undefined} />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-32">
          <label>{tc("segment")}</label>
          <select name="segment" defaultValue={sp.segment ?? "B2B"}>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
            <option value="">{tc("all")}</option>
          </select>
        </div>
        <div className="w-64">
          <label>{tc("category")}</label>
          <select name="category" defaultValue={sp.category ?? ""}>
            <option value="">{tc("all")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {locale === "en" ? c.nameEn : c.nameEt}
              </option>
            ))}
          </select>
        </div>
        <div className="w-44">
          <label>{tc("country")}</label>
          <select name="market" defaultValue={sp.market ?? ""}>
            <option value="">{tc("all")}</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-52">
          <label>{tc("search")}</label>
          <input name="q" defaultValue={sp.q ?? ""} />
        </div>
        <button className="btn-secondary">{tc("filter")}</button>
      </form>
      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{tc("name")}</th>
                <th>{tc("company")}</th>
                <th>{tc("country")}</th>
                <th>{tc("category")}</th>
                <th>{tc("status")}</th>
                <th>{t("pricingModel")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.summary && <div className="muted line-clamp-2 text-xs">{p.summary}</div>}
                  </td>
                  <td>
                    <Link href={`/companies/${p.companyId}`} className="hover:underline">
                      {p.companyName}
                    </Link>
                  </td>
                  <td>{p.marketName}</td>
                  <td>
                    <Badge>{p.categoryCode}</Badge> {cname(p)}
                  </td>
                  <td>{t(`statuses.${p.status}`)}</td>
                  <td>{t(`pricingModels.${p.pricingModel}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
