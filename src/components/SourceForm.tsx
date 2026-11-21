import { getTranslations } from "next-intl/server";
import { Field } from "@/components/ui";
import { addSource } from "@/lib/actions/content";

const TYPES = ["product_page", "press", "annual_report", "quarterly_report", "investor_presentation", "regulator", "analyst", "media", "other"] as const;

export async function SourceForm({ productId, companyId, redirectTo }: { productId?: string; companyId?: string; redirectTo?: string }) {
  const t = await getTranslations("sources");
  const tc = await getTranslations("common");
  return (
    <form action={addSource} className="grid gap-2 md:grid-cols-3">
      {productId && <input type="hidden" name="productId" value={productId} />}
      {companyId && <input type="hidden" name="companyId" value={companyId} />}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <Field label={t("url")} className="md:col-span-2">
        <input name="url" type="url" placeholder="https://" />
      </Field>
      <Field label={tc("type")}>
        <select name="type" defaultValue="product_page">
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`types.${x}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tc("name")} className="md:col-span-2">
        <input name="title" required />
      </Field>
      <Field label={t("publisher")}>
        <input name="publisher" />
      </Field>
      <Field label={t("publishedAt")}>
        <input name="publishedAt" type="date" />
      </Field>
      <Field label={t("reliability")}>
        <input name="reliability" type="number" min={1} max={5} defaultValue={3} />
      </Field>
      <div className="flex items-end">
        <button className="btn">{tc("add")}</button>
      </div>
      <Field label={t("excerpt")} className="md:col-span-3">
        <textarea name="excerpt" rows={2} />
      </Field>
    </form>
  );
}
