import { getTranslations } from "next-intl/server";
import { Card, Empty, Field, OriginBadge, SourceLink } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addPainGain, deletePainGain, updatePainGainFit } from "@/lib/actions/content";
import type { schema } from "@/db";

type Item = typeof schema.painGainItems.$inferSelect;
type Src = Map<string, { id: string; title: string; url: string | null }>;

export async function PainGainTab({ productId, items, sources, srcMap, editable }: { productId: string; items: Item[]; sources: { id: string; title: string }[]; srcMap: Src; editable: boolean }) {
  const t = await getTranslations("products.paingain");
  const tc = await getTranslations("common");
  const labels = { source: tc("originSource"), manual: tc("originManual") };
  const kinds = ["job", "pain", "gain"] as const;
  const gaps = items.filter((i) => i.kind !== "job" && i.fitScore <= 1);
  return (
    <div className="space-y-4">
      <p className="muted text-xs">{t("hint")}</p>
      <Card title={t("matrix")}>
        {items.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("kind")}</th>
                <th>{t("customerText")}</th>
                <th>{t("productResponse")}</th>
                <th>{t("fit")}</th>
                <th>{tc("origin")}</th>
                {editable && <th></th>}
              </tr>
            </thead>
            <tbody>
              {kinds.flatMap((k) =>
                items
                  .filter((i) => i.kind === k)
                  .map((i) => (
                    <tr key={i.id}>
                      <td>
                        <span className={`badge ${k === "pain" ? "bg-red-50 text-red-800" : k === "gain" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{t(`kinds.${k}`)}</span>
                      </td>
                      <td>{i.customerText}</td>
                      <td>{i.productResponse ?? <span className="muted">{tc("none")}</span>}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3].map((n) =>
                            editable ? (
                              <form key={n} action={updatePainGainFit.bind(null, productId, i.id, n)}>
                                <button className={`h-6 w-6 rounded text-xs ${i.fitScore === n ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] hover:bg-[var(--border)]"}`} title={String(n)}>
                                  {n}
                                </button>
                              </form>
                            ) : (
                              <span key={n} className={`inline-block h-6 w-6 rounded text-center text-xs leading-6 ${i.fitScore === n ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)]"}`}>{n}</span>
                            ),
                          )}
                        </div>
                      </td>
                      <td>
                        <OriginBadge origin={i.origin} labels={labels} /> <SourceLink source={i.sourceId ? srcMap.get(i.sourceId) : null} />
                      </td>
                      {editable && (
                        <td>
                          <form action={deletePainGain.bind(null, productId, i.id)}>
                            <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                          </form>
                        </td>
                      )}
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        )}
        {editable && (
          <form action={addPainGain.bind(null, productId)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-6">
            <Field label={t("kind")}>
              <select name="kind" defaultValue="pain">
                {kinds.map((k) => (<option key={k} value={k}>{t(`kinds.${k}`)}</option>))}
              </select>
            </Field>
            <Field label={t("customerText")} className="md:col-span-2"><input name="customerText" required /></Field>
            <Field label={t("productResponse")} className="md:col-span-2"><input name="productResponse" /></Field>
            <Field label={t("fit")}><input name="fitScore" type="number" min={0} max={3} defaultValue={0} /></Field>
            <Field label={tc("source")} className="md:col-span-5">
              <select name="sourceId" defaultValue="">
                <option value="">{tc("noSource")}</option>
                {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
              </select>
            </Field>
            <div className="flex items-end"><button className="btn">{tc("add")}</button></div>
          </form>
        )}
      </Card>
      {gaps.length > 0 && (
        <Card title={t("gaps")}>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {gaps.map((g) => (
              <li key={g.id}>
                <span className="muted">{t(`kinds.${g.kind}`)}:</span> {g.customerText}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
