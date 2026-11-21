import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui";
import { CompanyForm } from "@/components/CompanyForm";
import { updateCompany } from "@/lib/actions/content";
import { listCompanies, listMarkets } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "editor");
  const { id } = await params;
  const company = db.select().from(schema.companies).where(eq(schema.companies.id, id)).get();
  if (!company) notFound();
  const tc = await getTranslations("common");
  return (
    <>
      <PageHeader title={`${tc("edit")}: ${company.name}`} />
      <CompanyForm action={updateCompany.bind(null, id)} company={company} markets={listMarkets()} companies={listCompanies()} />
    </>
  );
}
