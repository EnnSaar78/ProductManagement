"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/lib/actions/auth";

export function LocaleSwitcher() {
  const locale = useLocale();
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1 text-xs">
      {(["et", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => start(() => setLocale(l))}
          className={`rounded px-2 py-1 uppercase ${l === locale ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-white hover:bg-[var(--bg)]"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
