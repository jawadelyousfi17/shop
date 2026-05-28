import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-4xl tracking-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Edit Product
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{product.title}</p>
      </div>
      <div className="rounded-3xl bg-white p-8">
        <ProductForm
          product={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            currency: product.currency,
            category: product.category,
            isActive: product.isActive,
          }}
        />
      </div>
    </div>
  );
}
