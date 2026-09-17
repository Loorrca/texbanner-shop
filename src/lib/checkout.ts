import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { appUrl } from "./config";
import { initPayment } from "./konnect";

export function newOrderNumber() {
  // 8 chars from an unambiguous alphabet: TB-7K2QX9MP
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  return "TB-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const newAccessToken = () => randomBytes(24).toString("base64url");

/** Checks that every referenced upload exists and is not already attached to another order. */
export async function uploadsAvailable(ids: string[]) {
  if (!ids.length) return true;
  const unique = [...new Set(ids)];
  if (!unique.every((id) => /^[0-9a-f-]{36}$/.test(id))) return false;
  const rows = await db.select({ id: schema.uploads.id }).from(schema.uploads).where(and(inArray(schema.uploads.id, unique), isNull(schema.uploads.orderItemId)));
  return rows.length === unique.length;
}

/** Creates a Konnect payment for an order and stores its reference. */
export async function startPayment(order: schema.Order) {
  const base = appUrl();
  const orderUrl = `${base}/${order.locale}/commande/${order.accessToken}`;
  const { payUrl, paymentRef } = await initPayment({
    amount: order.total,
    orderId: order.number,
    description: `Tex Banner — commande ${order.number}`,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phoneNumber: order.phone,
    webhook: `${base}/api/konnect/webhook`,
    successUrl: `${orderUrl}?result=success`,
    failUrl: `${orderUrl}?result=fail`,
  });
  await db.update(schema.orders).set({ konnectPaymentRef: paymentRef, status: "PENDING_PAYMENT" }).where(eq(schema.orders.id, order.id));
  return payUrl;
}
