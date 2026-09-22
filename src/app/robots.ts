import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";

/**
 * Without this file the origin returns 404 for /robots.txt and Cloudflare serves a
 * placeholder of its own, which mentions no sitemap.
 *
 * The disallowed paths are private rather than secret: the back office is behind Basic auth
 * and order and quote pages need an unguessable token. Listing them only keeps crawlers from
 * wasting their budget on pages that can never be indexed.
 */
// Must be built per request: the image is built in CI, where APP_URL is not set, so a
// static robots.txt would ship with the sitemap pointing at http://localhost:3000.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/media/", "/fr/panier", "/ar/panier", "/fr/commande", "/ar/commande", "/fr/devis", "/ar/devis"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
    host: appUrl(),
  };
}
