import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";
import { updateProduct } from "@/lib/actions/content";
import { getProductFull, listArchetypes, listCategories, listCompanies } from "@/lib/queries";
import { requireRole } from "@/lib/auth";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "editor");
  const { id } = await params;
  const full = getProductFull(id);
  if (!full) notFound();
  const t = await getTranslations("products");
  return (
    <>
      <PageHeader title={`${t("edit")}: ${full.product.name}`} />
      <ProductForm
        action={updateProduct.bind(null, id)}
        product={full.product}
        companies={listCompanies()}
        categories={listCategories()}
        archetypes={listArchetypes()}
        selectedArchetypes={full.archetypes.map((a) => a.id)}
      />
    </>
  );
}
