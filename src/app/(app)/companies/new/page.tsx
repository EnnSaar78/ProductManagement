import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { CompanyForm } from "@/components/CompanyForm";
import { createCompany } from "@/lib/actions/content";
import { listCompanies, listMarkets } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

export default async function NewCompanyPage() {
  await requireRole("admin", "editor");
  const t = await getTranslations("companies");
  return (
    <>
      <PageHeader title={t("new")} />
      <CompanyForm action={createCompany} markets={(await listMarkets())} companies={(await listCompanies())} />
    </>
  );
}
