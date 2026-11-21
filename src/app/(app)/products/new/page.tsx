import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";
import { createProduct } from "@/lib/actions/content";
import { listArchetypes, listCategories, listCompanies } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  await requireRole("admin", "editor");
  const { company } = await searchParams;
  const t = await getTranslations("products");
  return (
    <>
      <PageHeader title={t("new")} />
      <ProductForm action={createProduct} companies={(await listCompanies())} categories={(await listCategories())} archetypes={(await listArchetypes())} defaultCompanyId={company} />
    </>
  );
}
