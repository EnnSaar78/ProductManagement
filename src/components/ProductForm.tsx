import { getLocale, getTranslations } from "next-intl/server";
import { Field } from "@/components/ui";
import type { schema } from "@/db";

type Product = typeof schema.products.$inferSelect;
const STATUS = ["new", "active", "discontinued", "sample"] as const;
const PRICING = ["subscription", "usage", "freemium", "one_off", "revenue_share", "hybrid", "unknown"] as const;

export async function ProductForm({
  action,
  product,
  companies,
  categories,
  archetypes,
  selectedArchetypes = [],
  defaultCompanyId,
}: {
  action: (fd: FormData) => Promise<void>;
  product?: Product;
  companies: { id: string; name: string; marketName: string }[];
  categories: { id: string; code: string; nameEt: string; nameEn: string; segment: string }[];
  archetypes: { id: string; nameEt: string; nameEn: string; description: string | null }[];
  selectedArchetypes?: string[];
  defaultCompanyId?: string;
}) {
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const cname = (c: { nameEt: string; nameEn: string }) => (locale === "en" ? c.nameEn : c.nameEt);
  return (
    <form action={action} className="card grid max-w-4xl gap-3 md:grid-cols-2">
      <Field label={tc("name")}>
        <input name="name" required defaultValue={product?.name} />
      </Field>
      <Field label={t("brand")}>
        <input name="brand" defaultValue={product?.brand ?? ""} />
      </Field>
      <Field label={tc("company")}>
        <select name="companyId" required defaultValue={product?.companyId ?? defaultCompanyId ?? ""}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.marketName})
            </option>
          ))}
        </select>
      </Field>
      <Field label={tc("category")}>
        <select name="categoryId" required defaultValue={product?.categoryId ?? ""}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.segment} · {c.code} {cname(c)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tc("status")}>
        <select name="status" defaultValue={product?.status ?? "active"}>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("launchDate")}>
        <input name="launchDate" type="date" defaultValue={product?.launchDate ?? ""} />
      </Field>
      <Field label={t("url")} className="md:col-span-2">
        <input name="url" type="url" defaultValue={product?.url ?? ""} />
      </Field>
      <Field label={t("summary")} className="md:col-span-2">
        <textarea name="summary" rows={3} defaultValue={product?.summary ?? ""} />
      </Field>
      <Field label={t("targetCustomer")} className="md:col-span-2">
        <textarea name="targetCustomer" rows={2} defaultValue={product?.targetCustomer ?? ""} />
      </Field>
      <Field label={t("components")}>
        <textarea name="components" rows={5} defaultValue={product?.components ?? ""} />
      </Field>
      <Field label={t("addonsSummary")}>
        <textarea name="addonsSummary" rows={5} defaultValue={product?.addonsSummary ?? ""} />
      </Field>
      <Field label={t("slaNotes")} className="md:col-span-2">
        <textarea name="slaNotes" rows={2} defaultValue={product?.slaNotes ?? ""} />
      </Field>
      <Field label={t("pricingModel")}>
        <select name="pricingModel" defaultValue={product?.pricingModel ?? "subscription"}>
          {PRICING.map((p) => (
            <option key={p} value={p}>
              {t(`pricingModels.${p}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("priceNotes")}>
        <textarea name="priceNotes" rows={2} defaultValue={product?.priceNotes ?? ""} />
      </Field>
      <Field label={t("channel")}>
        <textarea name="channel" rows={2} defaultValue={product?.channel ?? ""} />
      </Field>
      <Field label={t("technology")}>
        <textarea name="technology" rows={2} defaultValue={product?.technology ?? ""} />
      </Field>
      <Field label={t("partners")} className="md:col-span-2">
        <textarea name="partners" rows={2} defaultValue={product?.partners ?? ""} />
      </Field>
      <fieldset className="md:col-span-2">
        <label>{t("archetypes")}</label>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {archetypes.map((a) => (
            <label key={a.id} className="flex items-start gap-2 text-sm font-normal normal-case text-[var(--text)]" title={a.description ?? ""}>
              <input type="checkbox" name="archetypeIds" value={a.id} defaultChecked={selectedArchetypes.includes(a.id)} className="mt-1 w-auto" />
              <span>{cname(a)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={tc("notes")} className="md:col-span-2">
        <textarea name="notes" rows={3} defaultValue={product?.notes ?? ""} />
      </Field>
      <div className="md:col-span-2">
        <button className="btn">{tc("save")}</button>
      </div>
    </form>
  );
}
