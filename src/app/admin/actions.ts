"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { syncPayment } from "@/lib/payments";
import { requireAdmin } from "@/lib/require-admin";

// Admin pages are protected by HTTP Basic auth in src/middleware.ts; actions re-check it (see requireAdmin).

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(schema.orderStatus.enumValues).parse(formData.get("status"));
  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function updateQuoteStatus(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(schema.quoteStatus.enumValues).parse(formData.get("status"));
  // answeredAt records when the shop first replied, for the "waiting" column in the list.
  const current = await db.query.quotes.findFirst({ where: eq(schema.quotes.id, id) });
  const answeredAt = current?.answeredAt ?? (status === "NEW" ? null : new Date());
  await db.update(schema.quotes).set({ status, answeredAt }).where(eq(schema.quotes.id, id));
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");
}

export async function recheckPayment(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
  if (order?.konnectPaymentRef) await syncPayment(order.konnectPaymentRef);
  revalidatePath(`/admin/orders/${id}`);
}
