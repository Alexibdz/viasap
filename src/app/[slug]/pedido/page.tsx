import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutView, { CheckoutLoading } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false },
};

export default async function CheckoutPage({ params }: PageProps<"/[slug]/pedido">) {
  const { slug } = await params;
  return (
    // El paso actual vive en la URL (?paso=2): useSearchParams necesita un Suspense.
    <Suspense fallback={<CheckoutLoading storeHref={`/${slug}`} />}>
      <CheckoutView />
    </Suspense>
  );
}
