import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { listCompanies, listMarkets } from "@/lib/queries";

export default async function MarketsPage() {
  const t = await getTranslations("markets");
  const markets = listMarkets();
  const companies = listCompanies();
  const counts = new Map<string, number>();
  for (const c of companies) counts.set(c.marketId, (counts.get(c.marketId) ?? 0) + 1);
  return (
    <>
      <PageHeader title={t("title")} />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>{t("code")}</th>
              <th>{t("priority")}</th>
              <th>Nimi</th>
              <th>Regioon</th>
              <th>{t("currency")}</th>
              <th>{t("regulator")}</th>
              <th>{t("companiesCount")}</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.id}>
                <td className="font-mono">{m.code}</td>
                <td>{m.priority}</td>
                <td>
                  <Link href={`/companies?market=${m.id}`} className="hover:underline">
                    {m.name}
                  </Link>
                </td>
                <td>{m.region}</td>
                <td>{m.currency}</td>
                <td>{m.regulator}</td>
                <td>{counts.get(m.id) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
