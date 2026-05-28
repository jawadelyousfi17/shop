import { ProductForm } from "../product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-4xl tracking-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          New Product
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add a digital item to your store
        </p>
      </div>
      <div className="rounded-3xl bg-white p-8">
        <ProductForm />
      </div>
    </div>
  );
}
