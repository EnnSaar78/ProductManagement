import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge, Card, Empty, LinkButton, PageHeader, Score } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteSignal } from "@/lib/actions/content";
import { listSignals, trendRadar } from "@/lib/queries";
import { canEdit, requireUser } from "@/lib/auth";

export default async function SignalsPage() {
  const user = await requireUser();
  const editable = canEdit(user);
  const t = await getTranslations("signals");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const signals = (await listSignals());
  const radar = (await trendRadar()).filter((r) => r.n > 0);
  const tn = (x: { nameEt: string; nameEn: string }) => (locale === "en" ? x.nameEn : x.nameEt);
  return (
    <>
      <PageHeader title={t("title")} actions={editable ? <LinkButton href="/signals/new">{t("new")}</LinkButton> : undefined} />
      {radar.length > 0 && (
        <Card title={t("radar")} className="mb-4">
          <p className="muted mb-2 text-xs">{t("radarHint")}</p>
          <div className="flex flex-wrap gap-2">
            {radar.map((r) => (
              <div key={r.code} className="rounded border border-[var(--border)] px-3 py-2 text-sm">
                <div className="font-medium">{tn(r)}</div>
                <div className="muted text-xs">
                  {r.n} · {t("impact")} {Number(r.avgImpact).toFixed(1)} · {t("novelty")} {Number(r.avgNovelty).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        {signals.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("score")}</th>
                <th>{tc("name")}</th>
                <th>{tc("type")}</th>
                <th>{tc("company")}</th>
                <th>{t("impact")}</th>
                <th>{t("horizon")}</th>
                <th>{t("tags")}</th>
                <th>{t("occurredAt")}</th>
                {editable && <th></th>}
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono">{s.score}</td>
                  <td>
                    <div className="font-medium">{s.title}</div>
                    {s.summary && <div className="muted text-xs">{s.summary}</div>}
                    {s.soWhat && <div className="mt-1 text-xs"><span className="muted">{t("soWhat")}:</span> {s.soWhat}</div>}
                    {s.productId && <Link href={`/products/${s.productId}`} className="text-xs text-[var(--accent)] underline">→ toode</Link>}
                  </td>
                  <td>{t(`types.${s.type}`)}</td>
                  <td>{s.companyId ? <Link href={`/companies/${s.companyId}`} className="hover:underline">{s.companyName}</Link> : tc("none")}{s.marketName ? <div className="muted text-xs">{s.marketName}</div> : null}</td>
                  <td><Score value={s.impact} /></td>
                  <td>{t(`horizons.${s.horizon}`)}</td>
                  <td><div className="flex flex-wrap gap-1">{s.tags.map((x) => <Badge key={x.code}>{tn(x)}</Badge>)}</div></td>
                  <td>{s.occurredAt ?? s.createdAt.slice(0, 10)}</td>
                  {editable && (<td><form action={deleteSignal.bind(null, s.id)}><ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton></form></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
