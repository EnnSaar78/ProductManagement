import { getTranslations } from "next-intl/server";
import { CANVAS_BLOCKS, type CanvasBlock } from "@/db/schema";
import { OriginBadge, SourceLink, SourceSelect } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addCanvasItem, deleteCanvasItem } from "@/lib/actions/content";

type Item = { id: string; block: string; text: string; origin: "source" | "manual"; sourceId: string | null };

const LAYOUT: { block: CanvasBlock; className: string }[] = [
  { block: "key_partners", className: "md:col-span-2 md:row-span-2" },
  { block: "key_activities", className: "md:col-span-2" },
  { block: "value_propositions", className: "md:col-span-2 md:row-span-2" },
  { block: "customer_relationships", className: "md:col-span-2" },
  { block: "customer_segments", className: "md:col-span-2 md:row-span-2" },
  { block: "key_resources", className: "md:col-span-2" },
  { block: "channels", className: "md:col-span-2" },
  { block: "cost_structure", className: "md:col-span-5" },
  { block: "revenue_streams", className: "md:col-span-5" },
];

export async function CanvasGrid({
  items,
  target,
  path,
  sources,
  srcMap,
  editable,
}: {
  items: Item[];
  target: { productId?: string; companyId?: string };
  path: string;
  sources: { id: string; title: string }[];
  srcMap: Map<string, { id: string; title: string; url: string | null }>;
  editable: boolean;
}) {
  const t = await getTranslations("products.canvas");
  const tc = await getTranslations("common");
  const labels = { source: tc("originSource"), manual: tc("originManual") };
  return (
    <div>
      <p className="muted mb-3 text-xs">{t("hint")}</p>
      <div className="grid gap-2 md:grid-cols-10">
        {LAYOUT.map(({ block, className }) => {
          const list = items.filter((i) => i.block === block);
          return (
            <div key={block} className={`card flex flex-col ${className}`}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t(`blocks.${block}`)}</h3>
              <ul className="flex-1 space-y-1.5">
                {list.map((i) => (
                  <li key={i.id} className="group rounded bg-[var(--bg)] p-2 text-sm">
                    <div>{i.text}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <OriginBadge origin={i.origin} labels={labels} />
                      <SourceLink source={i.sourceId ? srcMap.get(i.sourceId) : null} />
                      {editable && (
                        <form action={deleteCanvasItem.bind(null, path, i.id)} className="ml-auto">
                          <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {editable && (
                <form action={addCanvasItem.bind(null, target)} className="mt-2 space-y-1">
                  <input type="hidden" name="block" value={block} />
                  <textarea name="text" rows={2} placeholder="…" required />
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <select name="sourceId" defaultValue="">
                        <option value="">{tc("noSource")}</option>
                        {sources.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-secondary">{tc("add")}</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CANVAS_BLOCKS, SourceSelect };
