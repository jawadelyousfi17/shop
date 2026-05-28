"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/lib/admin-actions";

export function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function handleClick() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
