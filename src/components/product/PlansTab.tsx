import { getLocale, getTranslations } from "next-intl/server";
import { Card, Empty, Field } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addAddon, addPlan, deleteAddon, deletePlan } from "@/lib/actions/content";
import type { schema } from "@/db";

type Plan = typeof schema.productPlans.$inferSelect;
type Addon = typeof schema.productAddons.$inferSelect;
const UNITS = ["month", "user_month", "site_month", "gb", "one_off", "year"] as const;

export async function PlansTab({ productId, plans, addons, currency, editable }: { productId: string; plans: Plan[]; addons: Addon[]; currency: string; editable: boolean }) {
  const t = await getTranslations("products.plans");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const unit = (u: string) => ((UNITS as readonly string[]).includes(u) ? t(`units.${u}`) : u);
  const fmt = (n: number | null) => (n === null ? tc("none") : n.toLocaleString(locale, { maximumFractionDigits: 2 }));
  return (
    <div className="space-y-4">
      <Card title={t("title")}>
        {plans.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{tc("name")}</th>
                  <th>{t("tier")}</th>
                  <th>{t("price")}</th>
                  <th>{t("priceEur")}</th>
                  <th>{t("contract")}</th>
                  <th>{t("users")}</th>
                  <th>{t("sla")}</th>
                  <th>{t("included")}</th>
                  <th>{t("attributes")}</th>
                  {editable && <th></th>}
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.tier ?? tc("none")}</td>
                    <td className="whitespace-nowrap font-mono">
                      {fmt(p.price)} {p.currency} / {unit(p.priceUnit)}
                    </td>
                    <td className="font-mono">{fmt(p.priceEur)}</td>
                    <td>{p.contractMonths ?? tc("none")}</td>
                    <td>{p.users ?? tc("none")}</td>
                    <td>{p.sla ?? tc("none")}</td>
                    <td className="whitespace-pre-wrap text-xs">{p.included ?? ""}</td>
                    <td className="text-xs">
                      {p.attributes && (
                        <ul>
                          {Object.entries(JSON.parse(p.attributes) as Record<string, unknown>).map(([k, v]) => (
                            <li key={k}>
                              <span className="muted">{k}:</span> {String(v)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    {editable && (
                      <td>
                        <form action={deletePlan.bind(null, productId, p.id)}>
                          <ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editable && (
          <form action={addPlan.bind(null, productId)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-4">
            <Field label={tc("name")}><input name="name" required /></Field>
            <Field label={t("tier")}><input name="tier" placeholder="S / M / L / Enterprise" /></Field>
            <Field label={t("price")}><input name="price" inputMode="decimal" /></Field>
            <Field label="Valuuta"><input name="currency" defaultValue={currency} /></Field>
            <Field label={t("priceEur")}><input name="priceEur" inputMode="decimal" /></Field>
            <Field label={t("priceUnit")}>
              <select name="priceUnit" defaultValue="month">
                {UNITS.map((u) => (<option key={u} value={u}>{t(`units.${u}`)}</option>))}
              </select>
            </Field>
            <Field label={t("contract")}><input name="contractMonths" type="number" min={0} /></Field>
            <Field label={t("users")}><input name="users" placeholder="1–50" /></Field>
            <Field label={t("sla")}><input name="sla" placeholder="99,9 %, 4h" /></Field>
            <Field label={t("included")} className="md:col-span-2"><textarea name="included" rows={2} /></Field>
            <Field label={t("attributes")}><textarea name="attributes" rows={2} placeholder='{"bandwidth":"1 Gbit/s","sase":true}' /></Field>
            <div className="flex items-end"><button className="btn">{tc("add")}</button></div>
          </form>
        )}
      </Card>
      <Card title={t("addons")}>
        {addons.length === 0 ? (
          <Empty text={tc("empty")} />
        ) : (
          <table className="table">
            <thead><tr><th>{tc("name")}</th><th>{t("price")}</th><th>{tc("notes")}</th>{editable && <th></th>}</tr></thead>
            <tbody>
              {addons.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td className="font-mono">{a.price !== null ? `${fmt(a.price)} ${a.currency}${a.priceUnit ? ` / ${unit(a.priceUnit)}` : ""}` : tc("none")}</td>
                  <td className="text-xs">{a.description ?? ""}</td>
                  {editable && (<td><form action={deleteAddon.bind(null, productId, a.id)}><ConfirmButton message={tc("confirmDelete")}>{tc("delete")}</ConfirmButton></form></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {editable && (
          <form action={addAddon.bind(null, productId)} className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-5">
            <Field label={tc("name")}><input name="name" required /></Field>
            <Field label={t("price")}><input name="price" inputMode="decimal" /></Field>
            <Field label="Valuuta"><input name="currency" defaultValue={currency} /></Field>
            <Field label={t("priceUnit")}>
              <select name="priceUnit" defaultValue="month">
                {UNITS.map((u) => (<option key={u} value={u}>{t(`units.${u}`)}</option>))}
              </select>
            </Field>
            <div className="flex items-end"><button className="btn">{tc("add")}</button></div>
            <Field label={tc("notes")} className="md:col-span-5"><input name="description" /></Field>
          </form>
        )}
      </Card>
    </div>
  );
}
