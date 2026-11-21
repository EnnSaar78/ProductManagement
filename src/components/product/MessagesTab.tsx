import { getTranslations } from "next-intl/server";
import { Card, Empty, Field, OriginBadge, SourceLink, Badge } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addValueMessage, deleteValueMessage } from "@/lib/actions/content";
import type { schema } from "@/db";

type Item = typeof schema.valueMessages.$inferSelect;
const KINDS = ["headline", "tagline", "supporting", "differentiator", "proof"] as const;
const TONES = ["simplicity", "freedom", "security", "price", "quality", "sustainability", "partnership", "innovation"] as const;
const MTYPES = ["functional", "emotional", "economic", "social"] as const;

export async function MessagesTab({ productId, items, sources, srcMap, editable }: { productId: string; items: Item[]; sources: { id: string; title: string }[]; srcMap: Map<string, { id: string; title: string; url: string | null }>; editable: boolean }) {
  const t = await getTranslations("products.messages");
  const tc = await getTranslations("common");
  const labels = { source: tc("originSource"), manual: tc("originManual") };
  const tone = (x: string | null) => (x && (TONES as readonly string[]).includes(x) ? t(`tones.${x}`) : x);
  const mtype = (x: string | null) => (x && (MTYPES as readonly string[]).includes(x) ? t(`messageTypes.${x}`) : x);
  return (
    <div className="space-y-4">
      <p className="muted text-xs">{t("hint")}</p>
      {KINDS.map((k) => {
        const list = items.filter((i) => i.kind === k);
        if (list.length === 0 && !editable) return null;
        return (
          <Card key={k} title={t(`kinds.${k}`)}>
            {list.length === 0 ? (
              <Empty text={tc("empty")} />
            ) : (
              <ul className="space-y-2">
                {list.map((i) => (
                  <li key={i.id} className="rounded bg-[var(--bg)] p-3">
                    <div className={k === "headline" ? "text-lg font-semibold" : "text-sm"}>{i.text}</div>
                    {i.originalText && <div className="muted mt-1 text-xs italic">„{i.originalText}“</div>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {i.tone && <Badge>{tone(i.tone)}</Badge>}
                      {i.messageType && <Badge>{mtype(i.messageType)}</Badge>}
                      <OriginBadge origin={i.origin} labels={labels} />
                      <SourceLink source={i.sourceId ? srcMap.get(i.sourceId) : null} />
                      {editable && (
                        <form action={deleteValueMessage.bind(null, productId, i.id)} className="ml-auto">
                          <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      {editable && (
        <Card title={tc("add")}>
          <form action={addValueMessage.bind(null, productId)} className="grid gap-2 md:grid-cols-4">
            <Field label={t("kind")}>
              <select name="kind" defaultValue="headline">
                {KINDS.map((k) => (<option key={k} value={k}>{t(`kinds.${k}`)}</option>))}
              </select>
            </Field>
            <Field label={t("tone")}>
              <select name="tone" defaultValue="">
                <option value="">{tc("none")}</option>
                {TONES.map((x) => (<option key={x} value={x}>{t(`tones.${x}`)}</option>))}
              </select>
            </Field>
            <Field label={t("messageType")}>
              <select name="messageType" defaultValue="">
                <option value="">{tc("none")}</option>
                {MTYPES.map((x) => (<option key={x} value={x}>{t(`messageTypes.${x}`)}</option>))}
              </select>
            </Field>
            <Field label={tc("source")}>
              <select name="sourceId" defaultValue="">
                <option value="">{tc("noSource")}</option>
                {sources.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
              </select>
            </Field>
            <Field label={t("text")} className="md:col-span-2"><textarea name="text" rows={2} required /></Field>
            <Field label={t("originalText")} className="md:col-span-2"><textarea name="originalText" rows={2} /></Field>
            <div><button className="btn">{tc("add")}</button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
