/**
 * Catalog seed, based on the Tex Banner printed catalog.
 *
 * ⚠️ ALL PRICES BELOW ARE PLACEHOLDERS. Confirm every price with the shop
 * and edit them in /admin/products (or here) before going live.
 *
 * Run: npm run db:seed   (idempotent; SEED_OVERWRITE=1 resets products to these values)
 */
import { sql } from "drizzle-orm";
import { OptionsSchema, type ProductOption } from "../lib/options";
import { db, schema } from "./index";

const DT = (n: number) => Math.round(n * 1000);
const C = "/images/catalog";

// ---------- reusable option groups ----------
const country = (key = "country", labelFr = "Pays", labelAr = "الدولة", def = "tn"): ProductOption => ({
  type: "country", key, labelFr, labelAr, default: def, priceDelta: 0,
});
const logo = (required: boolean, labelFr = "Votre logo / emblème", labelAr = "شعاركم"): ProductOption => ({
  type: "upload", key: "logo", labelFr, labelAr, required, priceDelta: 0,
});
const text = (key: string, labelFr: string, labelAr: string, o: Partial<{ required: boolean; maxLength: number; multiline: boolean; priceDelta: number; placeholderFr: string; placeholderAr: string }> = {}): ProductOption => ({
  type: "text", key, labelFr, labelAr, required: o.required ?? false, maxLength: o.maxLength ?? 120, multiline: o.multiline ?? false, priceDelta: o.priceDelta ?? 0, placeholderFr: o.placeholderFr, placeholderAr: o.placeholderAr,
});
const guirlandeFormat: ProductOption = {
  type: "select", key: "format", labelFr: "Format des fanions", labelAr: "مقاس الأعلام",
  choices: [
    { value: "20x30", labelFr: "20 × 30 cm", labelAr: "20 × 30 سم", priceDelta: 0 },
    { value: "30x40", labelFr: "30 × 40 cm", labelAr: "30 × 40 سم", priceDelta: DT(8) },
  ],
};
const guirlandeLength: ProductOption = {
  type: "select", key: "length", labelFr: "Longueur", labelAr: "الطول",
  choices: [
    { value: "10m", labelFr: "10 m", labelAr: "10 م", priceDelta: 0 },
    { value: "25m", labelFr: "25 m", labelAr: "25 م", priceDelta: DT(25) },
    { value: "50m", labelFr: "50 m", labelAr: "50 م", priceDelta: DT(60) },
  ],
};

type Seed = {
  slug: string; nameFr: string; nameAr: string; descFr: string; descAr: string;
  preview?: string; images?: string[]; basePrice: number; options: ProductOption[];
};

const catalog: { slug: string; nameFr: string; nameAr: string; descFr: string; descAr: string; image?: string; products: Seed[] }[] = [
  {
    slug: "pavillons", nameFr: "Pavillons & drapeaux", nameAr: "الأعلام الكبيرة",
    descFr: "Drapeaux pour mât en maille polyester 115 g/m².", descAr: "أعلام للسارية من قماش البوليستر 115 غ/م².",
    image: `${C}/drapeaux-salle.webp`,
    products: [
      {
        slug: "drapeau-pays", nameFr: "Drapeau national (pavillon)", nameAr: "علم وطني",
        descFr: "Le drapeau de n'importe quel pays, imprimé en sublimation sur maille à drapeaux. Ourlet renforcé et œillets ou fourreau pour mât.",
        descAr: "علم أي دولة، مطبوع بالتسامي الحراري على قماش الأعلام. حواف مقواة مع حلقات أو جراب للسارية.",
        preview: "pavillon", images: [`${C}/drapeaux-salle.webp`, `${C}/atelier-impression.webp`], basePrice: DT(25),
        options: [
          country(),
          { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
            { value: "150x100", labelFr: "1,5 m × 1 m", labelAr: "1.5 م × 1 م", priceDelta: 0 },
            { value: "200x150", labelFr: "2 m × 1,5 m", labelAr: "2 م × 1.5 م", priceDelta: DT(20) },
            { value: "300x200", labelFr: "3 m × 2 m", labelAr: "3 م × 2 م", priceDelta: DT(55) },
            { value: "400x300", labelFr: "4 m × 3 m", labelAr: "4 م × 3 م", priceDelta: DT(110) },
          ] },
          { type: "select", key: "finish", labelFr: "Finition", labelAr: "التشطيب", choices: [
            { value: "oeillets", labelFr: "Ourlet + œillets", labelAr: "حواف + حلقات معدنية", priceDelta: 0 },
            { value: "fourreau", labelFr: "Fourreau pour mât", labelAr: "جراب للسارية", priceDelta: DT(3) },
          ] },
        ],
      },
      {
        slug: "drapeau-publicitaire", nameFr: "Drapeau publicitaire à votre logo", nameAr: "علم إشهاري بشعاركم",
        descFr: "Drapeau pour hôtel, entreprise ou événement, imprimé avec votre logo. Format au choix.",
        descAr: "علم للفنادق والشركات والتظاهرات، مطبوع بشعاركم. المقاس حسب الاختيار.",
        preview: "pavillon-logo", images: [`${C}/atelier-impression.webp`], basePrice: DT(45),
        options: [
          logo(true),
          { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
            { value: "150x100", labelFr: "1,5 m × 1 m", labelAr: "1.5 م × 1 م", priceDelta: 0 },
            { value: "200x150", labelFr: "2 m × 1,5 m", labelAr: "2 م × 1.5 م", priceDelta: DT(25) },
            { value: "300x200", labelFr: "3 m × 2 m", labelAr: "3 م × 2 م", priceDelta: DT(65) },
          ] },
          { type: "select", key: "background", labelFr: "Couleur de fond", labelAr: "لون الخلفية", choices: [
            { value: "white", labelFr: "Blanc", labelAr: "أبيض", priceDelta: 0, swatch: "#ffffff" },
            { value: "red", labelFr: "Rouge", labelAr: "أحمر", priceDelta: 0, swatch: "#c8102e" },
            { value: "blue", labelFr: "Bleu", labelAr: "أزرق", priceDelta: 0, swatch: "#1d4ed8" },
            { value: "black", labelFr: "Noir", labelAr: "أسود", priceDelta: 0, swatch: "#111111" },
          ] },
        ],
      },
    ],
  },
  {
    slug: "guirlandes", nameFr: "Guirlandes", nameAr: "زينة الأعلام",
    descFr: "Guirlandes de fanions pour fêtes nationales, mariages et événements.", descAr: "زينة أعلام للأعياد الوطنية والأفراح والتظاهرات.",
    products: [
      {
        slug: "guirlande-pays", nameFr: "Guirlande de drapeaux", nameAr: "زينة أعلام دولة",
        descFr: "Guirlande de fanions rectangulaires au drapeau du pays choisi.", descAr: "زينة من أعلام مستطيلة لدولة من اختياركم.",
        preview: "guirlande", basePrice: DT(15), options: [country(), guirlandeFormat, guirlandeLength],
      },
      {
        slug: "guirlande-mixte", nameFr: "Guirlande mixte drapeau + emblème", nameAr: "زينة مختلطة علم + شعار",
        descFr: "Alternance du drapeau et de l'emblème de votre municipalité, club ou association.", descAr: "تناوب بين العلم وشعار بلديتكم أو ناديكم أو جمعيتكم.",
        preview: "guirlande-mixte", basePrice: DT(22), options: [country(), logo(true, "Emblème à alterner", "الشعار المتناوب"), guirlandeFormat, guirlandeLength],
      },
      {
        slug: "guirlande-personnalisee", nameFr: "Guirlande personnalisée", nameAr: "زينة مخصصة",
        descFr: "Guirlande imprimée à votre logo, sur commande.", descAr: "زينة مطبوعة بشعاركم حسب الطلب.",
        preview: "guirlande-logo", basePrice: DT(25), options: [logo(true), guirlandeFormat, guirlandeLength],
      },
      {
        slug: "guirlande-coloree", nameFr: "Guirlande colorée (triangles)", nameAr: "زينة ملونة (مثلثات)",
        descFr: "Fanions triangulaires multicolores pour toutes les fêtes.", descAr: "أعلام مثلثة متعددة الألوان لكل المناسبات.",
        preview: "guirlande-triangles", basePrice: DT(10), options: [guirlandeLength],
      },
    ],
  },
  {
    slug: "banderoles", nameFr: "Banderoles", nameAr: "اللافتات",
    descFr: "Banderoles imprimées sur satin ou skaï, avec votre texte ou votre logo.", descAr: "لافتات مطبوعة على الساتان أو السكاي، بنصكم أو شعاركم.",
    products: [
      {
        slug: "banderole-texte", nameFr: "Banderole avec votre texte", nameAr: "لافتة بنصكم",
        descFr: "Banderole 5 m × 0,80 m imprimée avec le texte de votre choix, en français ou en arabe.", descAr: "لافتة 5 م × 0.80 م مطبوعة بالنص الذي تختارونه، بالعربية أو الفرنسية.",
        preview: "banderole-texte", basePrice: DT(60),
        options: [
          text("text", "Texte de la banderole", "نص اللافتة", { required: true, maxLength: 140, multiline: true, placeholderFr: "Bienvenue à…", placeholderAr: "مرحبا بكم في…" }),
          { type: "select", key: "material", labelFr: "Support", labelAr: "المادة", choices: [
            { value: "satin", labelFr: "Satin", labelAr: "ساتان", priceDelta: 0 },
            { value: "skai", labelFr: "Skaï", labelAr: "سكاي", priceDelta: DT(15) },
          ] },
          { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
            { value: "500x80", labelFr: "5 m × 0,80 m", labelAr: "5 م × 0.80 م", priceDelta: 0 },
            { value: "300x80", labelFr: "3 m × 0,80 m", labelAr: "3 م × 0.80 م", priceDelta: -DT(20) },
            { value: "800x100", labelFr: "8 m × 1 m", labelAr: "8 م × 1 م", priceDelta: DT(50) },
          ] },
          { type: "select", key: "color", labelFr: "Couleur de fond", labelAr: "لون الخلفية", choices: [
            { value: "red", labelFr: "Rouge", labelAr: "أحمر", priceDelta: 0, swatch: "#c8102e" },
            { value: "white", labelFr: "Blanc", labelAr: "أبيض", priceDelta: 0, swatch: "#ffffff" },
            { value: "green", labelFr: "Vert", labelAr: "أخضر", priceDelta: 0, swatch: "#15803d" },
            { value: "blue", labelFr: "Bleu", labelAr: "أزرق", priceDelta: 0, swatch: "#1d4ed8" },
          ] },
        ],
      },
      {
        slug: "banderole-logo", nameFr: "Banderole personnalisée (logo + drapeau)", nameAr: "لافتة مخصصة (شعار + علم)",
        descFr: "Alternance de votre logo et du drapeau, impression sur satin.", descAr: "تناوب بين شعاركم والعلم، طباعة على الساتان.",
        preview: "banderole-logo", basePrice: DT(70),
        options: [logo(true), country(), { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
          { value: "500x80", labelFr: "5 m × 0,80 m", labelAr: "5 م × 0.80 م", priceDelta: 0 },
          { value: "800x100", labelFr: "8 m × 1 m", labelAr: "8 م × 1 م", priceDelta: DT(50) },
        ] }],
      },
      {
        slug: "banderole-drapeaux", nameFr: "Banderole motif drapeaux", nameAr: "لافتة بنقش الأعلام",
        descFr: "Banderole à motif répété du drapeau, horizontale pour façades ou verticale pour colonnes.", descAr: "لافتة بنقش العلم المتكرر، أفقية للواجهات أو عمودية للأعمدة.",
        preview: "banderole-drapeaux", basePrice: DT(55),
        options: [country(), { type: "select", key: "orientation", labelFr: "Orientation", labelAr: "الاتجاه", choices: [
          { value: "horizontal", labelFr: "Horizontale (5 m × 0,80 m)", labelAr: "أفقية (5 م × 0.80 م)", priceDelta: 0 },
          { value: "vertical", labelFr: "Verticale (0,80 m × 3 m)", labelAr: "عمودية (0.80 م × 3 م)", priceDelta: -DT(10) },
        ] }],
      },
    ],
  },
  {
    slug: "oriflammes", nameFr: "Oriflammes & beach flags", nameAr: "الرايات والأعلام الشاطئية",
    descFr: "Oriflammes pour lampadaires et façades, beach flags publicitaires.", descAr: "رايات لأعمدة الإنارة والواجهات، وأعلام شاطئية إشهارية.",
    image: `${C}/oriflammes-lampadaires.webp`,
    products: [
      {
        slug: "oriflamme-drapeau", nameFr: "Oriflamme drapeau", nameAr: "راية علم",
        descFr: "Oriflamme verticale à pointe, idéale pour lampadaires et avenues.", descAr: "راية عمودية بطرف مدبب، مثالية لأعمدة الإنارة والشوارع.",
        preview: "oriflamme", images: [`${C}/oriflammes-lampadaires.webp`], basePrice: DT(30),
        options: [country(), { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
          { value: "60x200", labelFr: "0,60 m × 2 m", labelAr: "0.60 م × 2 م", priceDelta: 0 },
          { value: "80x300", labelFr: "0,80 m × 3 m", labelAr: "0.80 م × 3 م", priceDelta: DT(18) },
          { value: "100x400", labelFr: "1 m × 4 m", labelAr: "1 م × 4 م", priceDelta: DT(40) },
        ] }],
      },
      {
        slug: "oriflamme-embleme", nameFr: "Oriflamme à votre emblème", nameAr: "راية بشعاركم",
        descFr: "Oriflamme aux couleurs et à l'emblème de votre municipalité, club ou entreprise.", descAr: "راية بألوان وشعار بلديتكم أو ناديكم أو شركتكم.",
        preview: "oriflamme-logo", images: [`${C}/oriflammes-lampadaires.webp`], basePrice: DT(38),
        options: [logo(true), { type: "select", key: "color", labelFr: "Couleur de fond", labelAr: "لون الخلفية", choices: [
          { value: "white", labelFr: "Blanc", labelAr: "أبيض", priceDelta: 0, swatch: "#ffffff" },
          { value: "blue", labelFr: "Bleu", labelAr: "أزرق", priceDelta: 0, swatch: "#1d4ed8" },
          { value: "red", labelFr: "Rouge", labelAr: "أحمر", priceDelta: 0, swatch: "#c8102e" },
          { value: "green", labelFr: "Vert", labelAr: "أخضر", priceDelta: 0, swatch: "#15803d" },
        ] }, { type: "select", key: "size", labelFr: "Dimensions", labelAr: "المقاس", choices: [
          { value: "60x200", labelFr: "0,60 m × 2 m", labelAr: "0.60 م × 2 م", priceDelta: 0 },
          { value: "80x300", labelFr: "0,80 m × 3 m", labelAr: "0.80 م × 3 م", priceDelta: DT(18) },
        ] }],
      },
      {
        slug: "beach-flag", nameFr: "Beach flag publicitaire", nameAr: "علم شاطئي إشهاري",
        descFr: "Voile publicitaire en forme de goutte ou rectangulaire, avec mât et pied en option.", descAr: "راية إشهارية على شكل قطرة أو مستطيل، مع سارية وقاعدة اختيارية.",
        preview: "beachflag", images: [`${C}/beach-flags.webp`], basePrice: DT(90),
        options: [
          text("text", "Texte", "النص", { maxLength: 30, placeholderFr: "Votre marque", placeholderAr: "علامتكم" }),
          logo(false),
          { type: "select", key: "shape", labelFr: "Forme", labelAr: "الشكل", choices: [
            { value: "goutte", labelFr: "Goutte", labelAr: "قطرة", priceDelta: 0 },
            { value: "rectangle", labelFr: "Rectangle", labelAr: "مستطيل", priceDelta: 0 },
          ] },
          { type: "select", key: "height", labelFr: "Hauteur", labelAr: "الارتفاع", choices: [
            { value: "2.5m", labelFr: "2,5 m", labelAr: "2.5 م", priceDelta: 0 },
            { value: "3.5m", labelFr: "3,5 m", labelAr: "3.5 م", priceDelta: DT(35) },
          ] },
          { type: "select", key: "kit", labelFr: "Mât et pied", labelAr: "السارية والقاعدة", choices: [
            { value: "voile", labelFr: "Voile seule", labelAr: "الراية فقط", priceDelta: 0 },
            { value: "kit", labelFr: "Kit complet (mât + pied croix)", labelAr: "طقم كامل (سارية + قاعدة)", priceDelta: DT(70) },
          ] },
          { type: "select", key: "color", labelFr: "Couleur", labelAr: "اللون", choices: [
            { value: "red", labelFr: "Rouge", labelAr: "أحمر", priceDelta: 0, swatch: "#c8102e" },
            { value: "blue", labelFr: "Bleu", labelAr: "أزرق", priceDelta: 0, swatch: "#1d4ed8" },
            { value: "black", labelFr: "Noir", labelAr: "أسود", priceDelta: 0, swatch: "#111111" },
            { value: "gold", labelFr: "Or", labelAr: "ذهبي", priceDelta: 0, swatch: "#c9a227" },
          ] },
        ],
      },
    ],
  },
  {
    slug: "fanions", nameFr: "Fanions", nameAr: "أعلام المكاتب",
    descFr: "Fanions de salon en satin frangé, fanions de table et fanions de club.", descAr: "أعلام قاعات من الساتان بأهداب، أعلام مكاتب وأعلام نوادٍ.",
    image: `${C}/fanion-salon.webp`,
    products: [
      {
        slug: "fanion-salon", nameFr: "Fanion de salon en satin", nameAr: "علم قاعة من الساتان",
        descFr: "Fanion d'honneur en satin avec frange dorée, pour bureaux officiels et salles de réception.", descAr: "علم شرفي من الساتان بأهداب ذهبية، للمكاتب الرسمية وقاعات الاستقبال.",
        preview: "fanion-salon", images: [`${C}/fanion-salon.webp`], basePrice: DT(65),
        options: [country(), { type: "select", key: "kit", labelFr: "Accessoires", labelAr: "الملحقات", choices: [
          { value: "fanion", labelFr: "Fanion seul (1,50 m × 1 m)", labelAr: "العلم فقط (1.50 م × 1 م)", priceDelta: 0 },
          { value: "mat", labelFr: "Avec mât doré", labelAr: "مع سارية ذهبية", priceDelta: DT(45) },
          { value: "complet", labelFr: "Mât doré + socle", labelAr: "سارية ذهبية + قاعدة", priceDelta: DT(85) },
        ] }],
      },
      {
        slug: "fanion-table", nameFr: "Fanion de table", nameAr: "علم مكتب",
        descFr: "Petit drapeau de bureau en satin frangé, simple ou double (deux pays) avec socle.", descAr: "علم مكتب صغير من الساتان بأهداب، مفرد أو مزدوج (دولتان) مع قاعدة.",
        preview: "fanion-table", images: [`${C}/fanions-table.webp`], basePrice: DT(18),
        options: [
          country("country", "Pays (gauche)", "الدولة (يسار)"),
          { type: "select", key: "model", labelFr: "Modèle", labelAr: "النموذج", choices: [
            { value: "simple", labelFr: "Simple", labelAr: "مفرد", priceDelta: 0 },
            { value: "double", labelFr: "Double (deux pays)", labelAr: "مزدوج (دولتان)", priceDelta: DT(12) },
          ] },
          { ...country("country2", "Second pays", "الدولة الثانية", "fr"), showIf: { key: "model", value: "double" } } as ProductOption,
        ],
      },
      {
        slug: "fanion-club", nameFr: "Fanion de club / association", nameAr: "علم نادٍ أو جمعية",
        descFr: "Fanion suspendu à votre emblème, avec cordon et frange — idéal pour échanges et cadeaux protocolaires.", descAr: "علم معلق بشعاركم مع حبل وأهداب — مثالي للتبادل والهدايا البروتوكولية.",
        preview: "fanion-club", images: [`${C}/fanions-table.webp`], basePrice: DT(12),
        options: [logo(true), text("text", "Texte (nom du club, date…)", "النص (اسم النادي، التاريخ…)", { maxLength: 40 })],
      },
    ],
  },
  {
    slug: "cadres", nameFr: "Cadres & emblèmes", nameAr: "الإطارات والشعارات",
    descFr: "Emblèmes et armoiries imprimés et encadrés.", descAr: "شعارات مطبوعة ومؤطرة.",
    image: `${C}/cadres.webp`,
    products: [
      {
        slug: "cadre-embleme", nameFr: "Cadre emblème", nameAr: "إطار شعار",
        descFr: "Emblème de votre institution imprimé et monté dans un cadre doré mouluré.", descAr: "شعار مؤسستكم مطبوع ومركب في إطار ذهبي منقوش.",
        images: [`${C}/cadres.webp`], basePrice: DT(55),
        options: [logo(true, "Emblème à encadrer", "الشعار المراد تأطيره"), { type: "select", key: "size", labelFr: "Format", labelAr: "المقاس", choices: [
          { value: "30x40", labelFr: "30 × 40 cm", labelAr: "30 × 40 سم", priceDelta: 0 },
          { value: "50x70", labelFr: "50 × 70 cm", labelAr: "50 × 70 سم", priceDelta: DT(35) },
          { value: "70x100", labelFr: "70 × 100 cm", labelAr: "70 × 100 سم", priceDelta: DT(80) },
        ] }],
      },
    ],
  },
  {
    slug: "decorations-lumineuses", nameFr: "Décorations lumineuses", nameAr: "الزينة الضوئية",
    descFr: "Rubans LED et motifs lumineux pour rues, façades et fêtes.", descAr: "أشرطة LED ومجسمات ضوئية للشوارع والواجهات والحفلات.",
    image: `${C}/led-motif-arabesque.webp`,
    products: [
      {
        slug: "ruban-led", nameFr: "Ruban LED extérieur", nameAr: "شريط LED خارجي",
        descFr: "Ruban lumineux LED étanche, vendu au rouleau.", descAr: "شريط ضوئي LED مقاوم للماء، يباع باللفة.",
        images: [`${C}/led-ruban-blanc.webp`], basePrice: DT(35),
        options: [
          { type: "select", key: "color", labelFr: "Couleur", labelAr: "اللون", choices: [
            { value: "blanc", labelFr: "Blanc", labelAr: "أبيض", priceDelta: 0, swatch: "#f8fafc", image: `${C}/led-ruban-blanc.webp` },
            { value: "jaune", labelFr: "Jaune", labelAr: "أصفر", priceDelta: 0, swatch: "#f59e0b", image: `${C}/led-ruban-jaune.webp` },
            { value: "bleu", labelFr: "Bleu", labelAr: "أزرق", priceDelta: 0, swatch: "#3b82f6", image: `${C}/led-ruban-bleu.webp` },
            { value: "vert", labelFr: "Vert", labelAr: "أخضر", priceDelta: 0, swatch: "#22c55e", image: `${C}/led-ruban-vert.webp` },
          ] },
          { type: "select", key: "length", labelFr: "Longueur", labelAr: "الطول", choices: [
            { value: "10m", labelFr: "Rouleau 10 m", labelAr: "لفة 10 م", priceDelta: 0 },
            { value: "50m", labelFr: "Rouleau 50 m", labelAr: "لفة 50 م", priceDelta: DT(120) },
            { value: "100m", labelFr: "Rouleau 100 m", labelAr: "لفة 100 م", priceDelta: DT(260) },
          ] },
        ],
      },
      {
        slug: "motif-lumineux", nameFr: "Motif lumineux pour lampadaire", nameAr: "مجسم ضوئي لعمود الإنارة",
        descFr: "Motif décoratif LED pour éclairage public et fêtes (Ramadan, fêtes nationales, fin d'année).", descAr: "مجسم زينة LED للإنارة العمومية والمناسبات (رمضان، الأعياد الوطنية، رأس السنة).",
        images: [`${C}/led-motif-arabesque.webp`, `${C}/led-motif-fleurs.webp`], basePrice: DT(180),
        options: [
          { type: "select", key: "motif", labelFr: "Motif", labelAr: "النقش", choices: [
            { value: "arabesque", labelFr: "Arabesque", labelAr: "زخرفة", priceDelta: 0, image: `${C}/led-motif-arabesque.webp` },
            { value: "fleurs", labelFr: "Fleurs", labelAr: "ورود", priceDelta: DT(20), image: `${C}/led-motif-fleurs.webp` },
          ] },
          { type: "select", key: "height", labelFr: "Hauteur", labelAr: "الارتفاع", choices: [
            { value: "1.2m", labelFr: "1,2 m", labelAr: "1.2 م", priceDelta: 0 },
            { value: "2m", labelFr: "2 m", labelAr: "2 م", priceDelta: DT(90) },
          ] },
        ],
      },
    ],
  },
  {
    slug: "cadeaux", nameFr: "Trophées & cadeaux", nameAr: "الكؤوس والهدايا",
    descFr: "Coupes, trophées et plaques honorifiques gravées.", descAr: "كؤوس ودروع ولوحات تكريمية منقوشة.",
    image: `${C}/trophees.webp`,
    products: [
      {
        slug: "coupe-trophee", nameFr: "Coupe / trophée", nameAr: "كأس",
        descFr: "Coupe métallisée sur socle, avec plaque gravée.", descAr: "كأس معدنية على قاعدة مع لوحة منقوشة.",
        images: [`${C}/trophees.webp`], basePrice: DT(35),
        options: [
          { type: "select", key: "height", labelFr: "Hauteur", labelAr: "الارتفاع", choices: [
            { value: "25cm", labelFr: "25 cm", labelAr: "25 سم", priceDelta: 0 },
            { value: "40cm", labelFr: "40 cm", labelAr: "40 سم", priceDelta: DT(25) },
            { value: "60cm", labelFr: "60 cm", labelAr: "60 سم", priceDelta: DT(60) },
          ] },
          { type: "select", key: "finish", labelFr: "Finition", labelAr: "اللون", choices: [
            { value: "or", labelFr: "Doré", labelAr: "ذهبي", priceDelta: 0, swatch: "#c9a227" },
            { value: "argent", labelFr: "Argenté", labelAr: "فضي", priceDelta: 0, swatch: "#c0c0c0" },
          ] },
          text("engraving", "Gravure", "النقش", { maxLength: 60, priceDelta: DT(5), placeholderFr: "Tournoi 2026 — 1er prix", placeholderAr: "دورة 2026 — المرتبة الأولى" }),
        ],
      },
      {
        slug: "plaque-honorifique", nameFr: "Plaque honorifique", nameAr: "درع تكريمي",
        descFr: "Plaque sur bois verni avec gravure et logo, pour départs en retraite, remerciements et distinctions.", descAr: "درع على خشب لامع مع نقش وشعار، للتكريم والشكر والتقاعد.",
        images: [`${C}/trophees.webp`], basePrice: DT(40),
        options: [
          text("engraving", "Texte gravé", "النص المنقوش", { required: true, maxLength: 200, multiline: true }),
          logo(false),
          { type: "select", key: "size", labelFr: "Format", labelAr: "المقاس", choices: [
            { value: "20x25", labelFr: "20 × 25 cm", labelAr: "20 × 25 سم", priceDelta: 0 },
            { value: "30x40", labelFr: "30 × 40 cm", labelAr: "30 × 40 سم", priceDelta: DT(20) },
          ] },
        ],
      },
    ],
  },
];

async function main() {
  const overwrite = process.env.SEED_OVERWRITE === "1";
  let cSort = 0;
  for (const cat of catalog) {
    const { products, ...c } = cat;
    const [category] = await db
      .insert(schema.categories)
      .values({ ...c, sort: cSort })
      .onConflictDoUpdate({ target: schema.categories.slug, set: { ...c, sort: cSort } })
      .returning();
    cSort++;
    let pSort = 0;
    for (const p of products) {
      const options = OptionsSchema.parse(p.options);
      const data = { ...p, preview: p.preview ?? null, images: p.images ?? [], options, categoryId: category.id, sort: pSort++ };
      // Existing products keep the prices edited in /admin unless SEED_OVERWRITE=1.
      const q = db.insert(schema.products).values(data);
      await (overwrite
        ? q.onConflictDoUpdate({ target: schema.products.slug, set: { ...data, updatedAt: sql`now()` } })
        : q.onConflictDoNothing({ target: schema.products.slug }));
    }
  }
  console.log(`Seeded ${catalog.length} categories, ${catalog.reduce((n, c) => n + c.products.length, 0)} products`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
