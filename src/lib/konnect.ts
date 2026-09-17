import "server-only";

/**
 * Konnect Network payment gateway (https://docs.konnect.network).
 * - POST {base}/payments/init-payment  -> { payUrl, paymentRef }
 * - GET  {base}/payments/:paymentRef   -> { payment: { status: "completed" | "pending", amount, orderId, ... } }
 * - Webhook: GET <our url>?payment_ref=... (no signature: always re-fetch the payment from Konnect).
 *
 * Amounts are in millimes for TND, which is also how this shop stores prices.
 */

const BASE_URLS = {
  sandbox: "https://api.sandbox.konnect.network/api/v2",
  production: "https://api.konnect.network/api/v2",
} as const;

function cfg() {
  const env = (process.env.KONNECT_ENV ?? "sandbox") as keyof typeof BASE_URLS;
  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_WALLET_ID;
  if (!apiKey || !walletId) throw new Error("KONNECT_API_KEY and KONNECT_WALLET_ID must be set");
  // KONNECT_BASE_URL lets tests point to a local mock.
  const base = process.env.KONNECT_BASE_URL ?? BASE_URLS[env] ?? BASE_URLS.sandbox;
  return { base: base.replace(/\/$/, ""), apiKey, walletId };
}

export type InitPaymentInput = {
  amount: number;
  orderId: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  webhook: string;
  successUrl: string;
  failUrl: string;
  locale?: string;
};

export async function initPayment(input: InitPaymentInput): Promise<{ payUrl: string; paymentRef: string }> {
  const { base, apiKey, walletId } = cfg();
  const res = await fetch(`${base}/payments/init-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      receiverWalletId: walletId,
      token: "TND",
      amount: input.amount,
      type: "immediate",
      description: input.description.slice(0, 250),
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      lifespan: 30,
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      orderId: input.orderId,
      webhook: input.webhook,
      successUrl: input.successUrl,
      failUrl: input.failUrl,
      theme: "light",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Konnect init-payment failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { payUrl?: string; paymentRef?: string };
  if (!data.payUrl || !data.paymentRef) throw new Error("Konnect init-payment: unexpected response");
  return { payUrl: data.payUrl, paymentRef: data.paymentRef };
}

export type KonnectPayment = {
  status: string;
  amount: number;
  orderId?: string;
  token?: string;
};

export async function getPayment(paymentRef: string): Promise<KonnectPayment> {
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(paymentRef)) throw new Error("Invalid payment ref");
  const { base, apiKey } = cfg();
  const res = await fetch(`${base}/payments/${encodeURIComponent(paymentRef)}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Konnect get payment failed: ${res.status}`);
  const data = (await res.json()) as { payment?: KonnectPayment } & Partial<KonnectPayment>;
  const payment = data.payment ?? (data as KonnectPayment);
  if (typeof payment.status !== "string") throw new Error("Konnect get payment: unexpected response");
  return payment;
}
