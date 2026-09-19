import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorization } from "@/lib/admin-auth";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import { fromInternet, maintenanceOn, maintenanceResponse } from "@/lib/maintenance";

/** Order pages stay open during maintenance, so a customer paying right now still sees their order. */
const ALWAYS_OPEN = /^\/(fr|ar)\/commande(\/|$)/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!isAdminAuthorization(req.headers.get("authorization"))) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Tex Banner admin", charset="UTF-8"' },
      });
    }
    return NextResponse.next();
  }

  // Maintenance mode holds back visitors from the internet only: the local network,
  // /admin (above) and the API routes (excluded by the matcher, so Konnect webhooks
  // keep confirming payments) are never affected.
  if (maintenanceOn() && fromInternet(req) && !ALWAYS_OPEN.test(pathname)) {
    return maintenanceResponse();
  }

  const first = pathname.split("/")[1] ?? "";
  if (!isLocale(first)) {
    const preferred = req.headers.get("accept-language")?.toLowerCase().startsWith("ar") ? "ar" : DEFAULT_LOCALE;
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next|flags|images|media|favicon.ico|icon.png|apple-icon.png|opengraph-image|robots.txt|sitemap.xml).*)"],
};
