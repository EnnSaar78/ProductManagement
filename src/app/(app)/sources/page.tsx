import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { Card, PageHeader } from "@/components/ui";
import { SourceForm } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { canEdit, requireUser } from "@/lib/auth";

export default async function SourcesPage() {
  const user = await requireUser();
  const editable = canEdit(user);
  const t = await getTranslations("sources");
  const sources = await db.select().from(schema.sources).orderBy(desc(schema.sources.fetchedAt)).limit(500).all();
  const companyNames = new Map((await db.select({ id: schema.companies.id, name: schema.companies.name }).from(schema.companies).all()).map((c) => [c.id, c.name]));
  const productNames = new Map((await db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products).all()).map((p) => [p.id, p.name]));
  void eq;
  return (
    <>
      <PageHeader title={t("title")} />
      {editable && (
        <Card title={t("new")} className="mb-4">
          <SourceForm redirectTo="/sources" />
        </Card>
      )}
      <Card className="overflow-x-auto">
        <SourceList
          sources={sources}
          editable={editable}
          redirectTo="/sources"
          extra={(s) => (
            <span className="text-xs">
              {s.productId && productNames.has(s.productId) && <Link href={`/products/${s.productId}`} className="text-[var(--accent)] underline">{productNames.get(s.productId)}</Link>}
              {s.productId && s.companyId && " · "}
              {s.companyId && companyNames.has(s.companyId) && <Link href={`/companies/${s.companyId}`} className="text-[var(--accent)] underline">{companyNames.get(s.companyId)}</Link>}
            </span>
          )}
        />
      </Card>
    </>
  );
}
