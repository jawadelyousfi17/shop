"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sendProductEmail } from "@/lib/email";

const ProductSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens only"),
  shortDescription: z.string().min(1).max(280),
  description: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default("usd"),
  category: z.string().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = ProductSchema.safeParse({
    ...raw,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const coverPath = await uploadIfPresent(
    formData.get("coverImage"),
    `covers/${data.slug}`,
  );
  const filePath = await uploadIfPresent(
    formData.get("digitalFile"),
    `files/${data.slug}`,
  );

  try {
    await prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.price,
        currency: data.currency.toLowerCase(),
        category: data.category || null,
        isActive: data.isActive ?? true,
        coverImagePath: coverPath,
        digitalFilePath: filePath,
      },
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save product",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = ProductSchema.safeParse({
    ...raw,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const coverPath = await uploadIfPresent(
    formData.get("coverImage"),
    `covers/${data.slug}`,
  );
  const filePath = await uploadIfPresent(
    formData.get("digitalFile"),
    `files/${data.slug}`,
  );

  try {
    await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.price,
        currency: data.currency.toLowerCase(),
        category: data.category || null,
        isActive: data.isActive ?? true,
        ...(coverPath ? { coverImagePath: coverPath } : {}),
        ...(filePath ? { digitalFilePath: filePath } : {}),
      },
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update product",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${data.slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id } });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete",
    };
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function resendOrderEmail(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order) return { ok: false, error: "Order not found" };
  try {
    await sendProductEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      productTitle: order.product.title,
      orderId: order.id,
      downloadUrl: `${env.siteUrl}/download/${order.downloadToken}`,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Send failed",
    };
  }
  return { ok: true };
}

async function uploadIfPresent(
  fileLike: FormDataEntryValue | null,
  pathPrefix: string,
): Promise<string | null> {
  if (!fileLike || typeof fileLike === "string") return null;
  const file = fileLike as File;
  if (!file.size || !file.name) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const path = `${pathPrefix}-${Date.now()}${ext ? `.${ext}` : ""}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin()
    .storage.from(env.bucket)
    .upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}
