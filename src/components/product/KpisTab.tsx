import { getLocale, getTranslations } from "next-intl/server";
import { Card, Empty, Field, SourceLink } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addProductKpi, deleteProductKpi } from "@/lib/actions/content";
import type { schema } from "@/db";

type Item = typeof schema.productKpis.$inferSelect;
const METRICS = ["users", "customers", "arpa", "arpu", "price_entry", "price_per_unit", "attach_rate", "share_of_base", "growth_yoy", "churn", "nps", "revenue"] as const;

export async function KpisTab({ productId, items, sources, srcMap, editable }: { productId: string; items: Item[]; sources: { id: string; title: string }[]; srcMap: Map<string, { id: string; title: string; url: string | null }>; editable: boolean }) {
  const t = await getTranslations("products.kpis");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const metric = (m: string) => ((METRICS as readonly string[]).includes(m) ? t(`metrics.${m}`) : m);
  return (
    <Card>
      <p className="muted mb-3 text-xs">{t("hint")}</p>
      {items.length === 0 ? (
        <Empty text={tc("empty")} />
      ) : (
        <table className="table">
          <thead><tr><th>{t("metric")}</th><th>{tc("period")}</th><th>{tc("value")}</th><th>{t("isEstimate")}</th><th>{t("method")}</th><th>{tc("source")}</th><th>{tc("notes")}</th>{editable && <th></th>}</tr></thead>
          <tbody>
            {items.map((k) => (
              <tr key={k.id}>
                <td>{metric(k.metric)}</td>
                <td>{k.period}</td>
                <td className="font-mono">{k.value.toLocaleString(locale)} {k.unit}</td>
                <td>{k.isEstimate ? tc("yes") : tc("no")}</td>
                <td className="text-xs">{k.method ?? ""}</td>
                <td>{k.sourceId ? <SourceLink source={srcMap.get(k.sourceId)} /> : <span className="muted text-xs">{tc("noSource")}</span>}</td>
                <td className="text-xs">{k.note ?? ""}</td>
                {editable && (<td><form action={deleteProductKpi.bind(null, productId, k.id)}><ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton></form></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editable && (
        <form action={addProductKpi.bind(null, productId)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-6">
          <Field label={t("metric")}>
            <select name="metric" defaultValue="customers">
              {METRICS.map((m) => (<option key={m} value={m}>{t(`metrics.${m}`)}</option>))}
            </select>
          </Field>
          <Field label={tc("period")}><input name="period" required placeholder="2025-Q2" /></Field>
          <Field label={tc("value")}><input name="value" inputMode="decimal" required /></Field>
          <Field label={tc("unit")}><input name="unit" placeholder="k, %, EUR" /></Field>
          <Field label={t("isEstimate")}><input type="checkbox" name="isEstimate" className="w-auto" /></Field>
          <Field label={tc("source")}>
            <select name="sourceId" defaultValue="">
              <option value="">{tc("noSource")}</option>
              {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
            </select>
          </Field>
          <Field label={t("method")} className="md:col-span-3"><input name="method" /></Field>
          <Field label={tc("notes")} className="md:col-span-2"><input name="note" /></Field>
          <div className="flex items-end"><button className="btn">{tc("add")}</button></div>
        </form>
      )}
    </Card>
  );
}
