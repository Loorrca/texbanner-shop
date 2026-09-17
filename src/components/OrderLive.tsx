"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Refreshes the server-rendered order page while the payment is pending (max ~2 min). */
export function OrderAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = setInterval(() => {
      if (++n > 30) return clearInterval(id);
      router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}

export function RetryPayment({ token, label }: { token: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="btn-primary"
        onClick={async () => {
          setBusy(true);
          setErr(false);
          const res = await fetch(`/api/orders/${token}/pay`, { method: "POST" }).catch(() => null);
          const data = await res?.json().catch(() => null);
          if (data?.payUrl) return window.location.assign(data.payUrl);
          if (res?.status === 409) return window.location.reload();
          setErr(true);
          setBusy(false);
        }}
      >
        {label}
      </button>
      {err && <p className="mt-2 text-sm text-brand">⚠</p>}
    </div>
  );
}
