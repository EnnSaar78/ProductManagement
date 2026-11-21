import { getTranslations } from "next-intl/server";
import { Empty, Score } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteSource } from "@/lib/actions/content";
import type { schema } from "@/db";

type Source = typeof schema.sources.$inferSelect;

export async function SourceList({ sources, editable, redirectTo, extra }: { sources: Source[]; editable: boolean; redirectTo?: string; extra?: (s: Source) => React.ReactNode }) {
  const t = await getTranslations("sources");
  const tc = await getTranslations("common");
  if (sources.length === 0) return <Empty text={tc("empty")} />;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>{tc("name")}</th>
          <th>{tc("type")}</th>
          <th>{t("publisher")}</th>
          <th>{t("publishedAt")}</th>
          <th>{t("fetchedAt")}</th>
          <th>{t("reliability")}</th>
          {extra && <th>{t("linkedTo")}</th>}
          {editable && <th></th>}
        </tr>
      </thead>
      <tbody>
        {sources.map((s) => (
          <tr key={s.id}>
            <td>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              {s.excerpt && <div className="muted mt-1 text-xs">{s.excerpt}</div>}
            </td>
            <td>{t(`types.${s.type}`)}</td>
            <td>{s.publisher ?? tc("none")}</td>
            <td>{s.publishedAt ?? tc("none")}</td>
            <td>{s.fetchedAt.slice(0, 10)}</td>
            <td>
              <Score value={s.reliability} />
            </td>
            {extra && <td>{extra(s)}</td>}
            {editable && (
              <td>
                <form action={deleteSource.bind(null, s.id, redirectTo)}>
                  <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                </form>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
