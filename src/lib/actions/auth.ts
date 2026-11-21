"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, setSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/i18n/request";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { seedReferenceData } from "@/db/seed";
import { newId } from "@/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MIN = 15;

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!email || !password) return { error: "missing", email };

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const failed = await db.select({ n: count() })
    .from(schema.loginAttempts)
    .where(and(eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.success, false), gt(schema.loginAttempts.at, since)))
    .get();
  if ((failed?.n ?? 0) >= MAX_ATTEMPTS) return { error: "locked", email };

  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  const ok = !!user && user.active && (await verifyPassword(password, user.passwordHash));
  await db.insert(schema.loginAttempts).values({ email, success: ok }).run();
  if (!ok || !user) return { error: "invalid", email };

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  await db.update(schema.users).set({ lastLoginAt: new Date().toISOString() }).where(eq(schema.users.id, user.id)).run();
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function setLocale(locale: string) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  const store = await cookies();
  store.set("locale", locale as Locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

/** Esmakäivitus: töötab ainult siis, kui ühtegi kasutajat veel ei ole. */
export async function setupFirstAdmin(formData: FormData) {
  const existing = await db.select({ n: count() }).from(schema.users).get();
  if ((existing?.n ?? 0) > 0) redirect("/login");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || email;
  if (!email || password.length < 10) redirect("/setup");
  const id = newId();
  await db.insert(schema.users).values({ id, email, name, passwordHash: await hashPassword(password), role: "admin" }).run();
  if (formData.get("seed") === "on") await seedReferenceData(db);
  const { token, expiresAt } = await createSession(id);
  await setSessionCookie(token, expiresAt);
  redirect("/");
}
