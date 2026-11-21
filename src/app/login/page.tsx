import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { next } = await searchParams;
  const t = await getTranslations("login");
  const ta = await getTranslations("app");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-bold">{ta("name")}</div>
            <div className="muted text-xs">{ta("tagline")}</div>
          </div>
          <LocaleSwitcher />
        </div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="muted mb-4 text-sm">{t("subtitle")}</p>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
