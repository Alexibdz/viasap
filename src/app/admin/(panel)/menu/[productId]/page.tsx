import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import { emptyProductDraft, toProductDraft } from "@/lib/admin-forms";
import { isOfferProduct } from "@/lib/menu";
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
    offers: category.kind === "offers",
    groups: category.subcategories.map(({ id, name }) => ({ id, name })),
  }));
  // Lo que se puede sumar a una oferta: todo el menú menos otras ofertas.
  const catalog = store.menu.flatMap((category) =>
    category.subcategories.flatMap((group) =>
      group.products
        .filter((product) => !isOfferProduct(product, category))
        .map(({ id, name, price, variants }) => ({ id, name, price, variants, category: category.name })),
    ),
  );
  return <ProductEditor key={productId} initial={draft} categories={categories} catalog={catalog} />;
}
