# Tex Banner — e-shop

Online shop for **Sté Tex Banner** (Bab Saadoune, Tunis): flags, garlands, banners, oriflammes, pennants, frames, LED decorations and trophies, with per-product customisation and online payment through **Konnect**.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Drizzle ORM · zod
- **Languages:** French and Arabic (full RTL), under `/fr` and `/ar`
- **Payment:** Konnect (bank card, e-Dinar, wallet), in TND

## Features

| Area | What it does |
|---|---|
| Catalog | 8 categories and 20 products based on the printed catalog (`src/db/seed.ts`) |
| Customiser | Every option is data-driven: choices with price deltas, **country picker (249 flags)**, free text, logo upload, conditional options (e.g. the second country only for double table flags) |
| Live previews | Flags, garlands, banners, oriflammes, pennants and beach flags are **drawn in SVG** from the selected country flag, the uploaded logo and the typed text (`src/components/ProductPreview.tsx`), so no photo is needed per country |
| Photos | Catalog photos cropped, denoised and colour-corrected (`public/images/catalog`) |
| Cart | Stored in localStorage and **re-priced by the server** (`/api/cart/quote`) |
| Checkout | Tunisian address form (24 governorates, phone validation) → order created → redirect to Konnect |
| Payment confirmation | Konnect webhook + return page, both verified against the Konnect API (amount, currency, order number), idempotent |
| Order page | Private URL with a random token; auto-refreshes while payment is pending; retry-payment button |
| Devis | « Demander un devis » on any product and on the cart, for bulk orders priced case by case. The request carries the exact specification, is re-validated server-side, and lands in `/admin/quotes` with an optional email notification |
| Admin `/admin` | Orders by status, production details (flags, texts, logo downloads), status updates |
| Catalogue admin | Category tabs with **+ Catégorie** / **+ Nouveau produit**, photo upload (auto-resized WebP), bilingual texts, prices, **options editor** (choice lists, flag picker, free text, customer logo, conditional options), drawn-preview picker, duplicate / hide / delete |
| Flags & emblems | 249 countries + UN, EU, Arab League, ASEAN, England, Scotland… built in; extra emblems can be added in `/admin/emblems`, and any flag can be taken out of the picker there (**Drapeaux masqués**) — hidden codes are refused server-side too, and a flag that is a product's default cannot be hidden |

## ⚠️ Before going live

1. **Prices are placeholders.** Every price in the seed is an estimate. Confirm them with the shop and edit them in `/admin/products`.
   Only add logos of brands, clubs, leagues or protected emblems (NATO, UNESCO, UNICEF…) with the rights holder's permission. Customers who supply their own logo use the product's « Logo du client » option.
2. **Konnect account:** create the account, test in the sandbox, then set `KONNECT_ENV=production` with the production API key and wallet ID.
3. `APP_URL` must be the public **HTTPS** URL, because Konnect calls `APP_URL/api/konnect/webhook`.
4. Set a strong `ADMIN_PASSWORD`, and serve the site only over HTTPS (Basic auth sends credentials on every request).
   Next.js expands `$NAME` inside env values (even from the real environment): write a literal `$` as `\$`, or avoid `$`.
5. Check shipping costs (`SHIPPING_FLAT_MILLIMES`, `FREE_SHIPPING_FROM_MILLIMES`) and the product texts.
6. Replace the catalog photos with real photo-shoot pictures when possible: the current ones are scans of the printed brochure.

## Run locally

```bash
cp .env.example .env            # fill in the values
npm install
# PostgreSQL 16 running locally, then:
npm run db:migrate              # applies ./drizzle SQL migrations
npm run db:seed                 # loads the catalog (SEED_OVERWRITE=1 resets product prices)
npm run dev                     # http://localhost:3000
```

## Run with Docker (development machine)

```bash
cp .env.example .env            # fill in Konnect, ADMIN_PASSWORD, APP_URL
docker compose up -d --build    # db + app on :3000
```

The container applies pending migrations and checks the catalog at every start (`docker-entrypoint.sh`).
Customer logos (`storage/uploads`, private) and catalogue photos (`storage/media`, public) live in the `storage` volume, the database in `pgdata`. Back up both.

## Deploy on a Raspberry Pi (GitHub → Pi)

GitHub Actions builds an **ARM64** image on every push to `main` and publishes it to `ghcr.io`; the Pi only pulls it. Nothing is compiled on the Pi.

**Once, on GitHub**

```bash
git remote add origin git@github.com:<user>/texbanner-shop.git
git push -u origin main
```

Then open the repository → Packages → `texbanner-shop` → *Package settings* → **Change visibility: Public** (so the Pi can pull without logging in).
For a private package instead: on the Pi, `docker login ghcr.io -u <user>` with a token that has `read:packages`.

**Once, on the Pi** (64-bit Raspberry Pi OS, Pi 4 with 4 GB or more)

```bash
curl -fsSL https://get.docker.com | sh          # Docker + Compose plugin
sudo usermod -aG docker $USER && newgrp docker  # use docker without sudo
sudo timedatectl set-timezone Africa/Tunis

mkdir -p ~/texbanner && cd ~/texbanner
curl -fsSLO https://raw.githubusercontent.com/<user>/texbanner-shop/main/deploy/docker-compose.pi.yml
curl -fsSL  https://raw.githubusercontent.com/<user>/texbanner-shop/main/deploy/.env.example -o .env
for s in update.sh backup.sh maintenance.sh; do
  curl -fsSLO "https://raw.githubusercontent.com/<user>/texbanner-shop/main/deploy/$s"
done
chmod +x *.sh
nano .env                                       # IMAGE, POSTGRES_PASSWORD, ADMIN_PASSWORD, APP_URL…
docker compose -f docker-compose.pi.yml up -d
```

The shop is then on `http://<pi-address>:3000`, the back office on `/admin`. Containers restart by themselves after a power cut (`restart: unless-stopped`), so nothing else is needed at boot.

**Updating** — push to `main`, wait for the build (Actions tab), then on the Pi:

```bash
./update.sh          # or: docker compose -f docker-compose.pi.yml pull && up -d
```

**Backups** — `deploy/backup.sh` writes a database dump plus the `storage` volume to `~/texbanner-backups` and keeps 14 days. Run it nightly with `crontab -e`:

```
30 2 * * * /home/pi/texbanner/backup.sh
```

## Publishing with Cloudflare Tunnel (HTTPS, no open ports)

Konnect confirms payments by calling `APP_URL/api/konnect/webhook`, so the shop needs a public HTTPS address. A Cloudflare Tunnel provides one for free: the Pi opens an outgoing connection to Cloudflare, and no router port is opened.

**1. Domain on Cloudflare** — create a free account, *Add a site*, enter the domain. Copy the two nameservers it gives you into the registrar (GoDaddy → Domain → DNS → Nameservers → custom). Check the DNS records Cloudflare imported, in particular MX records if the company receives email on the domain. Activation usually takes under an hour.

**2. Create the tunnel** — Cloudflare dashboard → **Zero Trust** → Networks → **Tunnels** → *Create a tunnel* → **Cloudflared** → name it (e.g. `pi-texbanner`). The install screen shows a token: copy it (a long string, treat it as a password).

**3. Routes** — on the tunnel's *Routes* tab, add a published application:

| Hostname | Service |
|---|---|
| `texbanner.com` | `http://app:3000` |
| `www.texbanner.com` | `http://app:3000` |

`app` is the service name inside the Compose network, so the tunnel reaches the shop without going through the Pi's ports.

**4. On the Pi**

```bash
cd ~/texbanner
curl -fsSLO https://raw.githubusercontent.com/<user>/texbanner-shop/main/deploy/docker-compose.pi.yml
nano .env           # TUNNEL_TOKEN="…"  and  APP_URL="https://texbanner.com"
docker compose -f docker-compose.pi.yml up -d
docker compose -f docker-compose.pi.yml logs -f cloudflared   # "Registered tunnel connection"
```

Then open `https://texbanner.com`. The certificate is issued and renewed by Cloudflare; there is nothing to install on the Pi.

**Notes** — in Cloudflare, SSL/TLS mode **Full** is the right setting with a tunnel. Turn on **Always Use HTTPS** (SSL/TLS → Edge Certificates) so `http://` visitors are redirected. The free plan caps uploads at 100 MB per request, well above the 15 MB limit of the shop. The Pi stays reachable on the local network at `http://<pi-address>:3000`, which is handy for the back office.

## Maintenance mode

To work on the shop without visitors seeing it, on the Pi:

```bash
./maintenance.sh on      # visitors get a bilingual "boutique en maintenance" page (HTTP 503)
./maintenance.sh off     # back to normal
./maintenance.sh         # current state
```

It flips `MAINTENANCE` in `.env` and recreates the app container (about ten seconds). Only requests that arrive through the Cloudflare tunnel are held back — the app checks for Cloudflare's `cf-ray` / `cf-connecting-ip` headers (`src/lib/maintenance.ts`), which a request from the local network does not have. So while it is on:

- `http://<pi-address>:3000` works normally, which is how you preview your changes;
- `/admin` stays reachable, from the local network and from the internet;
- order pages (`/fr/commande/…`) stay open, so a customer in the middle of a payment still sees their order;
- `/api/…` is untouched, so Konnect webhooks keep confirming payments;
- 503 + `Retry-After` tells search engines to come back later instead of de-indexing the shop.

Cutting the site off completely is still possible — `docker compose -f docker-compose.pi.yml stop cloudflared` — but visitors then get a raw Cloudflare error page instead.

**Pi notes** — a Pi 4 (4 GB) runs the shop and PostgreSQL comfortably. Prefer an SSD or a good A2 card: the database writes constantly and cheap cards die. `docker logs` is capped at 3 × 10 MB per container.

## Quote requests (devis)

The shop prices a line as unit price × quantity, with no volume discount — so bulk buyers are steered to a quote instead. Above `QUOTE_THRESHOLD_QTY` (20 by default) the « Demander un devis » button becomes the main action on the product page and in the cart, with a note about degressive pricing; buying directly always stays possible.

A request is created from the current cart, so it carries the exact specification (country, size, finish, uploaded logo). The lines are re-priced server-side exactly as for an order, which both rejects impossible options and gives the shop an indicative catalogue total to quote against. Requests appear in **`/admin/quotes`**, with a counter on the nav so a new one is noticed, the customer's files to download, and a status (Nouvelle / Répondu / Acceptée / Close).

**Email notification** is optional. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and `QUOTE_NOTIFY_EMAIL`; for Gmail, use an *app password* (Google account → 2-step verification → App passwords), never the account password. The mail is sent with `Reply-To` set to the customer, so replying to the notification answers them directly. Leave `SMTP_HOST` empty to disable mail: requests are still saved and visible in the back office. Mail is fire-and-forget — a dead mail server logs an error and never loses a quote or shows the customer a failure.

## Search engines

- `/sitemap.xml` is generated from the database: home, categories and products, in both languages, each with its `hreflang` alternates. `/robots.txt` points at it and excludes the back office, the API and the cart / order / quote pages.
- Both are **rendered per request**. They must not be static: the image is built in CI without `APP_URL`, so a static `robots.txt` would ship pointing at `http://localhost:3000`.
- Every indexable page declares its own `canonical` and its `fr` / `ar` / `x-default` alternates (`src/lib/seo.ts`). Do not put `alternates` back in `src/app/[locale]/layout.tsx`: Next.js applies layout metadata to every page below it, which made each product page claim the home page as its translation.
- Structured data (`src/lib/structured-data.ts`): `Store` on the home page, `Product` with an offer on product pages, `BreadcrumbList` on category and product pages.
- **`Product` markup publishes the price to Google.** While the catalogue still holds placeholder prices, search results can show them. Fix the prices before inviting anyone to the site.
- `SHOP.hours` in `src/lib/config.ts` is empty on purpose. Fill it in schema.org form (`["Mo-Fr 08:30-17:30", "Sa 08:30-13:00"]`) once confirmed; wrong opening hours are worse than none.
- Off-site, what matters most for a local shop is a **Google Business Profile**, then Search Console (verify the domain with a Cloudflare DNS TXT record and submit the sitemap).

## Health check

`GET /api/health` returns `{"ok":true,"db":true}` when the app and the database answer. Docker uses it, and any uptime monitor can too.

## Schema changes

Edit `src/db/schema.ts`, then run `npm run db:generate` (creates a new SQL file in `drizzle/`), then `npm run db:migrate`.

## Adding or changing products

Everything is done in **`/admin/products`**: categories, products, photos, options and prices. `src/db/seed.ts` is only used to load the initial catalogue on a new installation.

- Options are validated by `src/lib/options.ts` (zod) on every save, so a badly filled form cannot break a product page.
- The drawn previews read options by their **technical key** (tick « Réglages avancés »): e.g. `country`, `text`, `logo`, `color`. The list per preview is in `src/lib/preview-kinds.ts`.
- A product that already appears in orders is hidden instead of deleted, so order history stays intact.

## Payment flow

```
Browser ──POST /api/checkout──▶ server re-prices cart, stores order (PENDING_PAYMENT)
        ◀── payUrl ─────────── server calls Konnect POST /payments/init-payment (amount in millimes)
Browser ──▶ Konnect gateway ──▶ successUrl /fr/commande/<token>?result=success
Konnect ──GET /api/konnect/webhook?payment_ref=…──▶ server GET /payments/:ref
                                                     status=completed & amount & orderId match → PAID
```

Konnect webhooks are not signed, so the server never trusts the query string: it always reads the payment back from the Konnect API.

## Security notes

- Prices are always recomputed on the server. The browser only sends product slugs, option values and quantities.
- Uploads: 10 MB max, type detected from the file's magic bytes (PNG, JPG, WEBP, SVG, PDF), random file names, stored outside `public/`. They can only be downloaded from the admin, as attachments with `CSP: sandbox`.
- An upload can be attached to one order only.
- Unguessable order URLs (192-bit token). Rate limits on upload, checkout and payment retry (in-memory, single instance).
- `/admin` pages and file downloads are protected by Basic auth in `src/middleware.ts`. Server actions can be called from any URL, so each admin action also re-checks the credentials (`src/lib/require-admin.ts`).
- Admin image uploads are decoded and re-encoded with sharp (metadata stripped, SVG rasterised to PNG) before being served from `/media`.
- Security headers are set in `next.config.ts`.

## Project layout

```
src/app/[locale]/        storefront pages (home, category, product, cart, checkout, order)
src/app/admin/           back office
src/app/api/             uploads, quote, checkout, konnect webhook, payment retry
src/components/          UI, ProductPreview (SVG scenes), customiser, cart
src/db/                  drizzle schema, client, migrate script, catalog seed
deploy/                  Raspberry Pi compose file, update / backup / maintenance scripts
.github/workflows/       ARM64 image build and publish to ghcr.io
src/lib/                 i18n, options/pricing, konnect client, payments sync, config
drizzle/                 SQL migrations
public/flags/            249 country flags + organisations/regions (flag-icons, MIT)
public/images/catalog/   processed catalog photos
```
