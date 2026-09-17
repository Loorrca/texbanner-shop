/**
 * Drawn previews available for products (see src/components/ProductPreview.tsx).
 * `keys` lists the option keys each drawing reads, so the admin can wire options to it.
 */
export const PREVIEW_KINDS = [
  { value: "pavillon", label: "Drapeau sur mât", keys: "country" },
  { value: "pavillon-logo", label: "Drapeau publicitaire (logo)", keys: "logo, background" },
  { value: "guirlande", label: "Guirlande de drapeaux", keys: "country" },
  { value: "guirlande-mixte", label: "Guirlande drapeau + emblème", keys: "country, logo" },
  { value: "guirlande-logo", label: "Guirlande au logo", keys: "logo" },
  { value: "guirlande-triangles", label: "Guirlande triangles colorés", keys: "—" },
  { value: "banderole-texte", label: "Banderole avec texte", keys: "text, color" },
  { value: "banderole-logo", label: "Banderole logo + drapeau", keys: "logo, country" },
  { value: "banderole-drapeaux", label: "Banderole motif drapeaux", keys: "country, orientation (horizontal/vertical)" },
  { value: "oriflamme", label: "Oriflamme drapeau", keys: "country" },
  { value: "oriflamme-logo", label: "Oriflamme à l'emblème", keys: "logo, color" },
  { value: "fanion-salon", label: "Fanion de salon (satin frangé)", keys: "country" },
  { value: "fanion-table", label: "Fanion de table", keys: "country, model (simple/double), country2" },
  { value: "fanion-club", label: "Fanion de club", keys: "logo, text" },
  { value: "beachflag", label: "Beach flag", keys: "text, logo, color, shape (goutte/rectangle), height (2.5m/3.5m), kit" },
] as const;

/** Colour values understood by the drawings for `color` / `background` choices. */
export const PREVIEW_COLORS = ["red", "white", "blue", "black", "green", "gold"];

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
