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
| Admin `/admin` | Orders by status, production details (flags, texts, logo downloads), status updates |
| Catalogue admin | Category tabs with **+ Catégorie** / **+ Nouveau produit**, photo upload (auto-resized WebP), bilingual texts, prices, **options editor** (choice lists, flag picker, free text, customer logo, conditional options), drawn-preview picker, duplicate / hide / delete |
| Flags & emblems | 249 countries + UN, EU, Arab League, ASEAN, England, Scotland… built in; extra emblems can be added in `/admin/emblems` |

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

**Going public (needed for payments).** Konnect confirms payments by calling `APP_URL/api/konnect/webhook`, so the Pi must be reachable over HTTPS from the internet. On a local network only, checkout stays at "Paiement échoué" and the order keeps a retry button. The usual options are a Cloudflare Tunnel (free HTTPS, no port forwarding, works behind a shared IP) or port forwarding 80/443 with Caddy for the certificate. Once that is in place, set `APP_URL` to the public https address and restart the app.

**Pi notes** — a Pi 4 (4 GB) runs the shop and PostgreSQL comfortably. Prefer an SSD or a good A2 card: the database writes constantly and cheap cards die. `docker logs` is capped at 3 × 10 MB per container.

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
deploy/                  Raspberry Pi compose file, update and backup scripts
.github/workflows/       ARM64 image build and publish to ghcr.io
src/lib/                 i18n, options/pricing, konnect client, payments sync, config
drizzle/                 SQL migrations
public/flags/            249 country flags + organisations/regions (flag-icons, MIT)
public/images/catalog/   processed catalog photos
```
