/** Shop-wide settings. Prices in millimes. */
export const SHOP = {
  name: "Tex Banner",
  legalName: "Sté Tex Banner",
  address: "38 Rue Ibn El Moatez, Borj Zouara, Bab Saadoune 1029 Tunis",
  phone: "71 576 701",
  mobile: "98 619 811",
  email: "ste.texbanner@gmail.com",
  facebook: "https://www.facebook.com/search/top?q=Ste%20TexBanner",
  shippingFlat: Number(process.env.SHIPPING_FLAT_MILLIMES ?? 8000),
  freeShippingFrom: Number(process.env.FREE_SHIPPING_FROM_MILLIMES ?? 200000),
  maxQuantityPerLine: 500,
};

export function shippingFor(subtotal: number) {
  return subtotal >= SHOP.freeShippingFrom ? 0 : SHOP.shippingFlat;
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
