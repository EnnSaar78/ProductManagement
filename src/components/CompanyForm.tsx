import { getTranslations } from "next-intl/server";
import { Field } from "@/components/ui";
import type { schema } from "@/db";

type Company = typeof schema.companies.$inferSelect;
const TYPES = ["incumbent", "challenger", "mvno", "cable", "it_arm", "integrator", "wholesale", "other"] as const;

export async function CompanyForm({
  action,
  company,
  markets,
  companies,
}: {
  action: (fd: FormData) => Promise<void>;
  company?: Company;
  markets: { id: string; name: string }[];
  companies: { id: string; name: string }[];
}) {
  const t = await getTranslations("companies");
  const tc = await getTranslations("common");
  return (
    <form action={action} className="card grid max-w-3xl gap-3 md:grid-cols-2">
      <Field label={tc("name")}>
        <input name="name" required defaultValue={company?.name} />
      </Field>
      <Field label={tc("country")}>
        <select name="marketId" required defaultValue={company?.marketId ?? ""}>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tc("type")}>
        <select name="type" defaultValue={company?.type ?? "incumbent"}>
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`types.${x}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("parent")}>
        <select name="parentId" defaultValue={company?.parentId ?? ""}>
          <option value="">{tc("none")}</option>
          {companies
            .filter((c) => c.id !== company?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label={t("brands")}>
        <input name="brands" defaultValue={company?.brands ?? ""} />
      </Field>
      <Field label={t("group")}>
        <input name="group" defaultValue={company?.group ?? ""} />
      </Field>
      <Field label={tc("website")}>
        <input name="website" type="url" defaultValue={company?.website ?? ""} />
      </Field>
      <Field label={t("segments")}>
        <input name="segments" defaultValue={company?.segments ?? ""} placeholder="B2C, SME, suurettevõte, avalik sektor, hulgimüük" />
      </Field>
      <Field label={t("strategy")} className="md:col-span-2">
        <textarea name="strategy" rows={4} defaultValue={company?.strategy ?? ""} />
      </Field>
      <Field label={tc("notes")} className="md:col-span-2">
        <textarea name="notes" rows={3} defaultValue={company?.notes ?? ""} />
      </Field>
      <div className="md:col-span-2">
        <button className="btn">{tc("save")}</button>
      </div>
    </form>
  );
}
