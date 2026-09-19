import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import type { ProductOption, ResolvedSelection } from "@/lib/options";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameFr: text("name_fr").notNull(),
  nameAr: text("name_ar").notNull(),
  descFr: text("desc_fr").notNull().default(""),
  descAr: text("desc_ar").notNull().default(""),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    categoryId: text("category_id").notNull().references(() => categories.id),
    nameFr: text("name_fr").notNull(),
    nameAr: text("name_ar").notNull(),
    descFr: text("desc_fr").notNull().default(""),
    descAr: text("desc_ar").notNull().default(""),
    /** Live SVG preview kind (see src/components/previews) or null for photo-only products */
    preview: text("preview"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    /** Price in millimes (1 TND = 1000 millimes) */
    basePrice: integer("base_price").notNull(),
    /** Validated with zod in src/lib/options.ts */
    options: jsonb("options").$type<ProductOption[]>().notNull().default([]),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

export const orderStatus = pgEnum("order_status", [
  "PENDING_PAYMENT",
  "PAID",
  "PAYMENT_FAILED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export type OrderStatus = (typeof orderStatus.enumValues)[number];

export const orders = pgTable(
  "orders",
  {
    id: id(),
    /** Human-readable number, e.g. TB-24F9K2 (also sent to Konnect as orderId) */
    number: text("number").notNull().unique(),
    /** Secret in the customer order URL, prevents enumerating other people's orders */
    accessToken: text("access_token").notNull().unique(),
    status: orderStatus("status").notNull().default("PENDING_PAYMENT"),
    locale: text("locale").notNull().default("fr"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    governorate: text("governorate").notNull(),
    city: text("city").notNull(),
    address: text("address").notNull(),
    postalCode: text("postal_code").notNull().default(""),
    notes: text("notes").notNull().default(""),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),
    konnectPaymentRef: text("konnect_payment_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("orders_payment_ref_idx").on(t.konnectPaymentRef), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  /** Snapshot of the product name at purchase time */
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  selections: jsonb("selections").$type<ResolvedSelection[]>().notNull(),
});

/* -------------------------------------------------------------------- quotes */

/** Quote requests ("demander un devis"), for bulk orders priced case by case. */
export const quoteStatus = pgEnum("quote_status", ["NEW", "ANSWERED", "ACCEPTED", "DECLINED"]);
export type QuoteStatus = (typeof quoteStatus.enumValues)[number];

export const quotes = pgTable(
  "quotes",
  {
    id: id(),
    /** Human-readable number, e.g. DV-7K2QX9MP */
    number: text("number").notNull().unique(),
    /** Secret in the customer's quote URL */
    accessToken: text("access_token").notNull().unique(),
    status: quoteStatus("status").notNull().default("NEW"),
    locale: text("locale").notNull().default("fr"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    company: text("company").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    governorate: text("governorate").notNull().default(""),
    city: text("city").notNull().default(""),
    /** What the customer needs, in their own words */
    message: text("message").notNull().default(""),
    /** Free text: "avant le 15 mars", "fin du mois"… */
    deadline: text("deadline").notNull().default(""),
    /** Sum at catalogue prices, for reference only — the real price is negotiated */
    indicativeTotal: integer("indicative_total").notNull().default(0),
    /** Set once the shop has answered, for the admin list */
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("quotes_created_idx").on(t.createdAt)],
);

export const quoteItems = pgTable("quote_items", {
  id: id(),
  quoteId: text("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  selections: jsonb("selections").$type<ResolvedSelection[]>().notNull(),
});

export const uploads = pgTable("uploads", {
  id: id(),
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull().unique(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
  /**
   * A quote may reference the same file as a later order, so this link is not exclusive:
   * only orderItemId decides whether a file can still be attached to an order.
   */
  quoteItemId: text("quote_item_id").references(() => quoteItems.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/** Extra flags / emblems added from the admin (organisations, clubs, regions…), shown in the flag picker. */
export const emblemGroup = pgEnum("emblem_group", ["organisation", "sport", "region", "autre"]);
export type EmblemGroup = (typeof emblemGroup.enumValues)[number];

export const emblems = pgTable("emblems", {
  id: id(),
  /** Picker code, always prefixed with "x-" so it never collides with ISO country codes */
  code: text("code").notNull().unique(),
  nameFr: text("name_fr").notNull(),
  nameAr: text("name_ar").notNull(),
  group: emblemGroup("group").notNull().default("organisation"),
  /** Public URL of the processed image (/media/…) */
  image: text("image").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

/**
 * Flags kept out of the picker (chosen in /admin/emblems). Any code can be listed:
 * an ISO country, a built-in organisation or region, or a custom "x-" emblem.
 * Existing orders are unaffected — they store their own snapshot of what was chosen.
 */
export const hiddenFlags = pgTable("hidden_flags", {
  code: text("code").primaryKey(),
  createdAt: createdAt(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
export const ordersRelations = relations(orders, ({ many }) => ({ items: many(orderItems) }));
export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  uploads: many(uploads),
}));
export const quotesRelations = relations(quotes, ({ many }) => ({ items: many(quoteItems) }));
export const quoteItemsRelations = relations(quoteItems, ({ one, many }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
  product: one(products, { fields: [quoteItems.productId], references: [products.id] }),
  uploads: many(uploads),
}));
export const uploadsRelations = relations(uploads, ({ one }) => ({
  orderItem: one(orderItems, { fields: [uploads.orderItemId], references: [orderItems.id] }),
  quoteItem: one(quoteItems, { fields: [uploads.quoteItemId], references: [quoteItems.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Emblem = typeof emblems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
