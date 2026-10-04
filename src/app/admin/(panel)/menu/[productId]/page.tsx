import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import { emptyProductDraft, toProductDraft } from "@/lib/admin-forms";
import { requireAdminStore } from "@/lib/server/session";

// /admin/menu/nuevo crea un producto (con ?categoria=<id> se preselecciona la categoría).
export default async function ProductEditorPage({ params, searchParams }: PageProps<"/admin/menu/[productId]">) {
  const store = await requireAdminStore();
  const { productId } = await params;
  const { categoria } = await searchParams;
  const draft =
    productId === "nuevo"
      ? emptyProductDraft(store.menu, typeof categoria === "string" ? categoria : undefined)
      : toProductDraft(store.menu, productId);
  if (!draft) notFound();

  const categories = store.menu.map((category) => ({
    id: category.id,
    name: category.name,
    groups: category.subcategories.map(({ id, name }) => ({ id, name })),
  }));
  return <ProductEditor key={productId} initial={draft} categories={categories} />;
}
