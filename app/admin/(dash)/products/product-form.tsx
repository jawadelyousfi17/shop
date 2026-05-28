"use client";

import { useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/lib/admin-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  category: string | null;
  isActive: boolean;
};

export function ProductForm({ product }: { product?: Product }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);
      if (res && "ok" in res && !res.ok) setError(res.error);
    });
  }

  return (
    <form action={handleSubmit} className="grid max-w-3xl gap-6">
      <div className="grid gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={product?.title} required />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={product?.slug}
          placeholder="e.g. design-systems-guide"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="shortDescription">Short description</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          defaultValue={product?.shortDescription}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">Full description</Label>
        <Textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={product?.description}
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="price">Price (cents)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={product?.price ?? 1900}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={product?.currency ?? "usd"}
            required
            maxLength={3}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            placeholder="optional"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="coverImage">Cover image</Label>
        <Input
          id="coverImage"
          name="coverImage"
          type="file"
          accept="image/*"
        />
        <p className="text-xs text-[var(--muted)]">
          {product ? "Leave empty to keep the current image." : ""}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="digitalFile">Digital file</Label>
        <Input
          id="digitalFile"
          name="digitalFile"
          type="file"
        />
        <p className="text-xs text-[var(--muted)]">
          {product ? "Leave empty to keep the current file." : "PDF, ZIP, etc."}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
        />
        Active (visible in store)
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
