"use client";

import { useState, useTransition } from "react";
import { Send, Check, X } from "lucide-react";
import { testElyosoftWebhook } from "@/lib/admin-actions";

export function TestWebhookButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "ok"; status: number }
    | { kind: "err"; msg: string }
  >({ kind: "idle" });

  function handleClick() {
    setState({ kind: "idle" });
    startTransition(async () => {
      const res = await testElyosoftWebhook();
      if (res.ok) setState({ kind: "ok", status: res.status });
      else setState({ kind: "err", msg: res.error });
    });
  }

  const base =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${base} ${
          state.kind === "ok"
            ? "bg-[var(--color-mint)] text-emerald-900"
            : state.kind === "err"
              ? "bg-[var(--color-peach)] text-amber-900"
              : "bg-[var(--color-sky)] text-[var(--color-ink)] hover:brightness-95"
        } disabled:opacity-60`}
      >
        {state.kind === "ok" ? (
          <Check size={16} strokeWidth={2} />
        ) : state.kind === "err" ? (
          <X size={16} strokeWidth={2} />
        ) : (
          <Send size={16} strokeWidth={1.8} />
        )}
        {pending
          ? "Sending…"
          : state.kind === "ok"
            ? `Webhook OK (${state.status})`
            : state.kind === "err"
              ? "Webhook failed"
              : "Test Elyosoft webhook"}
      </button>
      {state.kind === "err" && (
        <p className="rounded-lg bg-[var(--color-peach)]/60 p-2 text-xs text-amber-900">
          {state.msg}
        </p>
      )}
    </div>
  );
}
