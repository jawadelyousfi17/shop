"use client";

import { useState, useTransition } from "react";
import { resendOrderEmail } from "@/lib/admin-actions";

export function ResendButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"ok" | "err" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function click() {
    setDone(null);
    setMsg(null);
    startTransition(async () => {
      const res = await resendOrderEmail(orderId);
      if (res.ok) {
        setDone("ok");
      } else {
        setDone("err");
        setMsg(res.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={pending}
      className="text-sm hover:underline disabled:opacity-50"
      title={msg ?? ""}
    >
      {pending
        ? "Sending…"
        : done === "ok"
          ? "Sent ✓"
          : done === "err"
            ? "Failed"
            : "Resend email"}
    </button>
  );
}
