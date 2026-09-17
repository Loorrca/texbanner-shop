import Link from "next/link";
import { Brand } from "./Brand";
import { SHOP } from "@/lib/config";
import { getDict, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer id="contact" className="mt-24 bg-ink text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">{t.tagline}</p>
        </div>
        <div className="text-sm leading-7">
          <h3 className="mb-2 font-bold text-white">{t.nav.contact}</h3>
          <p dir="ltr" className="text-start">{SHOP.address}</p>
          <p>
            Tél/Fax : <a className="hover:text-gold-light" href="tel:+21671576701" dir="ltr">{SHOP.phone}</a> · GSM :{" "}
            <a className="hover:text-gold-light" href="tel:+21698619811" dir="ltr">{SHOP.mobile}</a>
          </p>
          <p>
            <a className="hover:text-gold-light" href={`mailto:${SHOP.email}`}>{SHOP.email}</a>
          </p>
          <p>
            <a className="hover:text-gold-light" href={SHOP.facebook} rel="noopener noreferrer" target="_blank">Facebook — Ste TexBanner</a>
          </p>
        </div>
        <div className="text-sm leading-7">
          <h3 className="mb-2 font-bold text-white">Tex Banner</h3>
          <p><Link className="hover:text-gold-light" href={`/${locale}#atelier`}>{t.nav.about}</Link></p>
          <p><Link className="hover:text-gold-light" href={`/${locale}/panier`}>{t.nav.cart}</Link></p>
          <p className="mt-3 text-xs text-stone-500">{t.footer.pricesTTC}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {SHOP.legalName}. {t.footer.rights}
      </div>
    </footer>
  );
}
