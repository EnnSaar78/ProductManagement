"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { login, type LoginState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div>
        <label>{t("email")}</label>
        <input name="email" type="email" autoComplete="email" required defaultValue={state?.email ?? ""} />
      </div>
      <div>
        <label>{t("password")}</label>
        <input name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error && <p className="text-sm text-red-700">{t(`errors.${state.error}`)}</p>}
      <button type="submit" className="btn w-full justify-center" disabled={pending}>
        {t("submit")}
      </button>
    </form>
  );
}
