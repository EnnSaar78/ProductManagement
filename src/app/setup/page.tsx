import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { userCount } from "@/lib/queries";
import { setupFirstAdmin } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Field } from "@/components/ui";

export default async function SetupPage() {
  if ((await userCount()) > 0) redirect("/login");
  const t = await getTranslations("setup");
  const ta = await getTranslations("app");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold">{ta("name")}</div>
            <div className="muted text-xs">{ta("tagline")}</div>
          </div>
          <LocaleSwitcher />
        </div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="muted mb-4 text-sm">{t("subtitle")}</p>
        <form action={setupFirstAdmin} className="space-y-3">
          <Field label={t("name")}>
            <input name="name" required />
          </Field>
          <Field label={t("email")}>
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t("password")}>
            <input name="password" type="password" minLength={10} required autoComplete="new-password" />
          </Field>
          <label className="flex items-center gap-2 text-sm font-normal normal-case text-[var(--text)]">
            <input type="checkbox" name="seed" defaultChecked className="w-auto" /> {t("seed")}
          </label>
          <button type="submit" className="btn w-full justify-center">
            {t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
