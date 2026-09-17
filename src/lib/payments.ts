import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getPayment } from "./konnect";

/**
 * Re-fetch a payment from Konnect and update the matching order.
 * Idempotent: safe to call from the webhook, the return page and the admin.
 * Konnect webhooks are unsigned, so we never trust the query string, only Konnect's API.
 */
export async function syncPayment(paymentRef: string) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.konnectPaymentRef, paymentRef) });
  if (!order) return null;
  if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") return order;

  const payment = await getPayment(paymentRef);
  if (payment.status !== "completed") return order;

  const amountOk = payment.amount === order.total && (payment.token ?? "TND") === "TND";
  const orderOk = !payment.orderId || payment.orderId === order.number;
  if (!amountOk || !orderOk) {
    console.error("[konnect] payment mismatch", { paymentRef, order: order.number, payment });
    return order;
  }

  // Status guard in WHERE: concurrent webhook deliveries cannot double-process.
  const [updated] = await db
    .update(schema.orders)
    .set({ status: "PAID", paidAt: new Date() })
    .where(and(eq(schema.orders.id, order.id), inArray(schema.orders.status, ["PENDING_PAYMENT", "PAYMENT_FAILED"])))
    .returning();
  return updated ?? (await db.query.orders.findFirst({ where: eq(schema.orders.id, order.id) }));
}
