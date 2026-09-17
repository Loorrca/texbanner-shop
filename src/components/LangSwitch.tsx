"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function LangSwitch({ locale, label }: { locale: string; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const search = useSearchParams();
  const other = locale === "ar" ? "fr" : "ar";
  const href = pathname.replace(/^\/(fr|ar)(?=\/|$)/, `/${other}`) + (search?.size ? `?${search}` : "");
  return (
    <Link href={href} className="rounded-full px-3 py-1.5 text-sm font-bold text-stone-200 ring-1 ring-white/20 transition hover:bg-white/10" hrefLang={other}>
      {label}
    </Link>
  );
}
