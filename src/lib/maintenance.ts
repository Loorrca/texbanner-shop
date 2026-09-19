/**
 * Maintenance mode — shown to public visitors only.
 *
 * Turned on with MAINTENANCE=1 in the environment (on the Pi: `./maintenance.sh on`).
 * Only requests that came through the Cloudflare tunnel are held back, so the shop stays
 * completely usable on the local network while the page is up. Edge-compatible: this runs
 * inside src/middleware.ts, so no Node APIs here.
 */

import { NextResponse } from "next/server";
import { SHOP } from "@/lib/config";

export function maintenanceOn() {
  const v = process.env.MAINTENANCE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

/** Cloudflare sets these on everything it proxies; a request from the local network has neither. */
export function fromInternet(req: Request) {
  return req.headers.has("cf-ray") || req.headers.has("cf-connecting-ip");
}

const PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${SHOP.name} — Boutique en maintenance</title>
<link rel="icon" href="/icon.png">
<style>
  :root { --brand:#c8102e; --gold:#c9a227; --ink:#141414; --paper:#faf7f2; }
  * { box-sizing: border-box; }
  body {
    margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    background:var(--paper); color:var(--ink);
    font-family: ui-sans-serif, system-ui, "Segoe UI", Tahoma, Arial, sans-serif; -webkit-font-smoothing:antialiased;
  }
  .card {
    width:100%; max-width:560px; background:#fff; border-radius:24px; padding:40px 32px; text-align:center;
    box-shadow:0 1px 3px rgba(0,0,0,.06); border:1px solid #e7e5e4;
  }
  .logo { height:72px; width:auto; margin:0 auto 24px; display:block; }
  h1 { margin:0 0 10px; font-size:1.5rem; line-height:1.3; }
  p { margin:0 0 6px; color:#57534e; line-height:1.6; }
  .rule { height:3px; width:64px; margin:26px auto; border-radius:3px; background:linear-gradient(90deg,var(--gold),var(--brand)); }
  .ar { direction:rtl; }
  .contact { margin-top:26px; padding-top:22px; border-top:1px solid #f0efed; font-size:.95rem; }
  .contact a { color:var(--brand); font-weight:700; text-decoration:none; }
  .contact a:hover { text-decoration:underline; }
  .ltr { unicode-bidi:isolate; direction:ltr; display:inline-block; }
  .phones { margin-top:10px; font-size:1.05rem; }
</style>
</head>
<body>
  <main class="card">
    <img class="logo" src="/images/logo-texbanner.webp" alt="${SHOP.name}">

    <h1>Boutique en maintenance</h1>
    <p>Notre boutique en ligne est momentanément indisponible.</p>
    <p>Elle sera de retour très bientôt — merci de votre patience.</p>

    <div class="rule"></div>

    <div class="ar">
      <h1>المتجر قيد الصيانة</h1>
      <p>متجرنا الإلكتروني غير متاح مؤقتًا.</p>
      <p>سيعود للعمل قريبًا — شكرًا على تفهمكم.</p>
    </div>

    <div class="contact">
      <p>Pour toute commande ou information :</p>
      <p class="ar">لأي طلب أو استفسار:</p>
      <p class="phones">
        <a href="tel:+21671576701" class="ltr">${SHOP.phone}</a> ·
        <a href="tel:+21698619811" class="ltr">${SHOP.mobile}</a>
      </p>
      <p><a href="mailto:${SHOP.email}">${SHOP.email}</a></p>
    </div>
  </main>
</body>
</html>
`;

/** 503 tells search engines "temporary, come back later" instead of de-indexing the shop. */
export function maintenanceResponse() {
  return new NextResponse(PAGE, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "3600",
    },
  });
}
