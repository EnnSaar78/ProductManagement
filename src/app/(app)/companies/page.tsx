import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader, LinkButton, Badge } from "@/components/ui";
import { listCompanies, listMarkets, listProducts } from "@/lib/queries";
import { requireUser, canEdit } from "@/lib/auth";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ market?: string; q?: string }> }) {
  const user = await requireUser();
  const t = await getTranslations("companies");
  const tc = await getTranslations("common");
  const { market, q } = await searchParams;
  const markets = (await listMarkets());
  const products = (await listProducts());
  const pc = new Map<string, number>();
  for (const p of products) pc.set(p.companyId, (pc.get(p.companyId) ?? 0) + 1);
  const rows = (await listCompanies()).filter((c) => (!market || c.marketId === market) && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHeader title={t("title")} actions={canEdit(user) ? <LinkButton href="/companies/new">{t("new")}</LinkButton> : undefined} />
      <form className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-48">
          <label>{tc("country")}</label>
          <select name="market" defaultValue={market ?? ""}>
            <option value="">{tc("all")}</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-56">
          <label>{tc("search")}</label>
          <input name="q" defaultValue={q ?? ""} />
        </div>
        <button className="btn-secondary">{tc("filter")}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>{tc("name")}</th>
              <th>{tc("country")}</th>
              <th>{tc("type")}</th>
              <th>{t("group")}</th>
              <th>{t("listing.title")}</th>
              <th>{tc("website")}</th>
              <th>{t("productsCount")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td>{c.marketName}</td>
                <td>
                  <Badge>{t(`types.${c.type}`)}</Badge>
                </td>
                <td>{c.group ?? tc("none")}</td>
                <td className="text-xs">
                  {c.listingStatus === "listed" || c.listingStatus === "via_parent" ? (
                    <span>
                      {c.stockExchange}{c.ticker ? ` · ${c.ticker}` : ""}
                      {c.listingStatus === "via_parent" && <span className="muted"> ({t("listing.statuses.via_parent")})</span>}
                    </span>
                  ) : (
                    <span className="muted">{t(`listing.statuses.${c.listingStatus}`)}</span>
                  )}
                </td>
                <td>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                      {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </td>
                <td>{pc.get(c.id) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
