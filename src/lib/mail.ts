import "server-only";
import nodemailer from "nodemailer";
import { SHOP, appUrl } from "./config";
import { GOVERNORATES } from "./governorates";
import { formatTND } from "./money";
import type { schema } from "@/db";

/**
 * Optional SMTP notification. Everything here is best-effort: the shop must keep working
 * when the mail server is down, so callers never await the result and never let it throw.
 * Unconfigured (no SMTP_HOST) simply logs once per send and does nothing.
 */

const cfg = () => {
  const host = process.env.SMTP_HOST?.trim();
  const to = process.env.QUOTE_NOTIFY_EMAIL?.trim() || SHOP.email;
  if (!host || !to) return null;
  const port = Number(process.env.SMTP_PORT ?? 587) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  return {
    host,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from: process.env.SMTP_FROM?.trim() || user || to,
    to,
  };
};

export function mailConfigured() {
  return cfg() !== null;
}

async function send(subject: string, text: string, replyTo?: string) {
  const c = cfg();
  if (!c) {
    console.info("[mail] SMTP not configured, skipping:", subject);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: c.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  await transport.sendMail({ from: c.from, to: c.to, replyTo, subject, text });
  return true;
}

const govLabel = (code: string) => (code ? (GOVERNORATES.find((g) => g.code === code)?.fr ?? code) : "");

const line = (i: schema.QuoteItem) =>
  [
    `• ${i.quantity} × ${i.productName} (indicatif ${formatTND(i.unitPrice, "fr")} l'unité)`,
    ...i.selections.filter((s) => s.type !== "upload").map((s) => `    ${s.label} : ${s.valueLabel}`),
    ...i.selections.filter((s) => s.type === "upload").map((s) => `    ${s.label} : fichier joint (voir le back-office)`),
  ].join("\n");

/** Tells the shop a quote request came in. Fire and forget — never blocks the customer. */
export function notifyNewQuote(quote: schema.Quote, items: schema.QuoteItem[]) {
  const who = [quote.firstName, quote.lastName].join(" ").trim();
  const body = [
    `Nouvelle demande de devis ${quote.number}`,
    "",
    `Client    : ${who}${quote.company ? ` — ${quote.company}` : ""}`,
    `Téléphone : ${quote.phone}`,
    `E-mail    : ${quote.email}`,
    quote.governorate || quote.city ? `Livraison : ${[quote.city, govLabel(quote.governorate)].filter(Boolean).join(", ")}` : null,
    quote.deadline ? `Délai     : ${quote.deadline}` : null,
    "",
    "Articles :",
    items.map(line).join("\n"),
    "",
    `Total indicatif au tarif catalogue : ${formatTND(quote.indicativeTotal, "fr")}`,
    "(indicatif seulement — c'est à vous de fixer le prix du devis)",
    quote.message ? `\nMessage du client :\n${quote.message}` : "",
    "",
    `Fiche complète : ${appUrl()}/admin/quotes`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  // Reply-to the customer, so answering the notification answers them directly.
  void send(`Devis ${quote.number} — ${who}`, body, quote.email).catch((e) =>
    console.error("[mail] quote notification failed", quote.number, e),
  );
}
