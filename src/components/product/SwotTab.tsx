import { getTranslations } from "next-intl/server";
import { OriginBadge, SourceLink } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addSwot, deleteSwot } from "@/lib/actions/content";
import type { schema } from "@/db";

type Item = typeof schema.swotItems.$inferSelect;
const Q = ["strength", "weakness", "opportunity", "threat"] as const;
const COLORS: Record<(typeof Q)[number], string> = {
  strength: "border-emerald-200 bg-emerald-50/40",
  weakness: "border-amber-200 bg-amber-50/40",
  opportunity: "border-sky-200 bg-sky-50/40",
  threat: "border-red-200 bg-red-50/40",
};

export async function SwotTab({ productId, items, sources, srcMap, editable }: { productId: string; items: Item[]; sources: { id: string; title: string }[]; srcMap: Map<string, { id: string; title: string; url: string | null }>; editable: boolean }) {
  const t = await getTranslations("products.swot");
  const tc = await getTranslations("common");
  const labels = { source: tc("originSource"), manual: tc("originManual") };
  return (
    <div>
      <p className="muted mb-3 text-xs">{t("hint")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {Q.map((q) => (
          <div key={q} className={`rounded-lg border p-4 ${COLORS[q]}`}>
            <h3 className="mb-2 text-sm font-semibold">{t(`quadrants.${q}`)}</h3>
            <ul className="space-y-1.5">
              {items.filter((i) => i.quadrant === q).map((i) => (
                <li key={i.id} className="rounded bg-white/80 p-2 text-sm">
                  <div>{i.text}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <OriginBadge origin={i.origin} labels={labels} />
                    <SourceLink source={i.sourceId ? srcMap.get(i.sourceId) : null} />
                    {editable && (
                      <form action={deleteSwot.bind(null, productId, i.id)} className="ml-auto">
                        <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {editable && (
              <form action={addSwot.bind(null, productId)} className="mt-2 space-y-1">
                <input type="hidden" name="quadrant" value={q} />
                <textarea name="text" rows={2} required placeholder="…" />
                <div className="flex gap-1">
                  <select name="sourceId" defaultValue="" className="flex-1">
                    <option value="">{tc("noSource")}</option>
                    {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
                  </select>
                  <button className="btn-secondary">{tc("add")}</button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
