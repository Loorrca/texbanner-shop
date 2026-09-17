import { NextResponse } from "next/server";
import { syncPayment } from "@/lib/payments";

/**
 * Konnect calls: GET /api/konnect/webhook?payment_ref=...
 * The request is unauthenticated, so syncPayment() re-reads the payment from Konnect's API.
 */
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("payment_ref") ?? "";
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(ref)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const order = await syncPayment(ref);
    if (!order) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    console.error("[konnect] webhook error", ref, e);
    // 5xx so Konnect may retry delivery.
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
