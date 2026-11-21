import { asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { Card, Field, PageHeader } from "@/components/ui";
import { createUser, resetUserPassword, seedReference, setUserActive, setUserRole } from "@/lib/actions/content";
import { requireRole } from "@/lib/auth";

const ROLES = ["admin", "editor", "viewer"] as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ seeded?: string }> }) {
  const { seeded } = await searchParams;
  const me = await requireRole("admin");
  const t = await getTranslations("users");
  const tc = await getTranslations("common");
  const users = await db.select().from(schema.users).orderBy(asc(schema.users.email)).all();
  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <form action={seedReference}>
            <button className="btn-secondary">{t("seed")}</button>
          </form>
        }
      />
      {seeded && <p className="mb-4 rounded bg-emerald-50 p-2 text-sm text-emerald-800">{t("seedDone")}</p>}
      <Card title={t("new")} className="mb-4">
        <form action={createUser} className="grid gap-2 md:grid-cols-5">
          <Field label="E-post"><input name="email" type="email" required /></Field>
          <Field label={tc("name")}><input name="name" required /></Field>
          <Field label={t("password")}><input name="password" type="password" minLength={10} required autoComplete="new-password" /></Field>
          <Field label={t("role")}>
            <select name="role" defaultValue="viewer">{ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select>
          </Field>
          <div className="flex items-end"><button className="btn">{tc("add")}</button></div>
        </form>
      </Card>
      <Card>
        <table className="table">
          <thead><tr><th>E-post</th><th>{tc("name")}</th><th>{t("role")}</th><th>{t("active")}</th><th>{t("lastLogin")}</th><th>{tc("actions")}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>
                  {u.id === me.id ? t(`roles.${u.role}`) : (
                    <form action={setUserRole.bind(null, u.id)} className="flex gap-1">
                      <select name="role" defaultValue={u.role} className="w-auto">{ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select>
                      <button className="btn-secondary text-xs">{tc("save")}</button>
                    </form>
                  )}
                </td>
                <td>{u.active ? tc("yes") : tc("no")}</td>
                <td>{u.lastLoginAt?.slice(0, 16).replace("T", " ") ?? tc("none")}</td>
                <td>
                  {u.id !== me.id && (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={setUserActive.bind(null, u.id, !u.active)}>
                        <button className="btn-secondary text-xs">{u.active ? t("deactivate") : t("activate")}</button>
                      </form>
                      <form action={resetUserPassword.bind(null, u.id)} className="flex gap-1">
                        <input name="password" type="password" minLength={10} placeholder={t("resetPassword")} className="w-40" autoComplete="new-password" />
                        <button className="btn-secondary text-xs">{tc("save")}</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
