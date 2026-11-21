import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SessionUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Nav({ user }: { user: SessionUser }) {
  const t = await getTranslations("nav");
  const ta = await getTranslations("app");
  const items: { href: string; label: string }[] = [
    { href: "/", label: t("dashboard") },
    { href: "/markets", label: t("markets") },
    { href: "/companies", label: t("companies") },
    { href: "/products", label: t("products") },
    { href: "/compare", label: t("compare") },
    { href: "/signals", label: t("signals") },
    { href: "/sources", label: t("sources") },
  ];
  if (user.role === "admin") items.push({ href: "/admin/users", label: t("users") });
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-white">
      <div className="border-b border-[var(--border)] p-4">
        <div className="text-base font-bold">{ta("name")}</div>
        <div className="muted text-xs">{ta("tagline")}</div>
      </div>
      <nav className="flex-1 p-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block rounded px-3 py-2 text-sm hover:bg-[var(--bg)]">
            {i.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t border-[var(--border)] p-3">
        <div className="text-xs">
          <div className="font-medium">{user.name}</div>
          <div className="muted">{user.role}</div>
        </div>
        <LocaleSwitcher />
        <form action={logout}>
          <button className="btn-secondary w-full justify-center text-xs">{t("logout")}</button>
        </form>
      </div>
    </aside>
  );
}
