import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

// ---------- Kasutajad ja sessioonid ----------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "editor", "viewer"] }).notNull().default("viewer"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now()),
  lastLoginAt: text("last_login_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256(token)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(now()),
});

export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  at: text("at").notNull().default(now()),
  success: integer("success", { mode: "boolean" }).notNull(),
});

// ---------- Allikad (päritolu) ----------
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  url: text("url"),
  type: text("type", {
    enum: ["product_page", "press", "annual_report", "quarterly_report", "investor_presentation", "regulator", "analyst", "media", "other"],
  }).notNull().default("other"),
  title: text("title").notNull(),
  publisher: text("publisher"),
  publishedAt: text("published_at"),
  fetchedAt: text("fetched_at").notNull().default(now()),
  reliability: integer("reliability").notNull().default(3), // 1-5
  excerpt: text("excerpt"),
  companyId: text("company_id"),
  productId: text("product_id"),
  notes: text("notes"),
  createdBy: text("created_by"),
});

// ---------- Tasand 1: Turg ----------
export const markets = sqliteTable("markets", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // ISO 3166-1 alpha-2
  name: text("name").notNull(),
  region: text("region"),
  currency: text("currency").notNull().default("EUR"),
  regulator: text("regulator"),
  population: integer("population"),
  gdpPerCapita: real("gdp_per_capita"),
  mobileOperators: integer("mobile_operators"),
  notes: text("notes"),
  priority: integer("priority").notNull().default(5),
});

// ---------- Tasand 2: Ettevõte ----------
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  marketId: text("market_id").notNull().references(() => markets.id),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  brands: text("brands"),
  type: text("type", {
    enum: ["incumbent", "challenger", "mvno", "cable", "it_arm", "integrator", "wholesale", "other"],
  }).notNull().default("incumbent"),
  group: text("group_name"),
  website: text("website"),
  segments: text("segments"),
  strategy: text("strategy"),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull().default(now()),
});

export const companyKpis = sqliteTable(
  "company_kpis",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(), // revenue, service_revenue, ebitda, capex, mobile_subs, fixed_subs, arpu_mobile, arpa_b2b, churn, nps, employees, ict_revenue_share ...
    period: text("period").notNull(), // 2024, 2024-Q3, FY2024
    value: real("value").notNull(),
    unit: text("unit").notNull().default(""), // EUR m, %, k
    currency: text("currency"),
    scope: text("scope"), // riik / segment
    sourceId: text("source_id"),
    note: text("note"),
  },
  (t) => [index("company_kpis_company_idx").on(t.companyId)],
);

// ---------- Tasand 3: Kategooriad ----------
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  segment: text("segment", { enum: ["B2B", "B2C"] }).notNull(),
  nameEt: text("name_et").notNull(),
  nameEn: text("name_en").notNull(),
  subcategories: text("subcategories"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------- Tasand 4: Toode ----------
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id),
    name: text("name").notNull(),
    brand: text("brand"),
    status: text("status", { enum: ["new", "active", "discontinued", "sample"] }).notNull().default("active"),
    launchDate: text("launch_date"),
    url: text("url"),
    summary: text("summary"),
    targetCustomer: text("target_customer"),
    components: text("components"),
    addonsSummary: text("addons_summary"),
    slaNotes: text("sla_notes"),
    pricingModel: text("pricing_model", {
      enum: ["subscription", "usage", "freemium", "one_off", "revenue_share", "hybrid", "unknown"],
    }).notNull().default("subscription"),
    priceNotes: text("price_notes"),
    channel: text("channel"),
    technology: text("technology"),
    partners: text("partners"),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: text("created_at").notNull().default(now()),
    updatedAt: text("updated_at").notNull().default(now()),
  },
  (t) => [index("products_company_idx").on(t.companyId), index("products_category_idx").on(t.categoryId)],
);

// ---------- Tasand 5: Paketid ja lisateenused ----------
export const productPlans = sqliteTable("product_plans", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tier: text("tier"), // S/M/L/XL, Basic/Pro/Enterprise
  price: real("price"),
  currency: text("currency").notNull().default("EUR"),
  priceEur: real("price_eur"),
  priceUnit: text("price_unit").notNull().default("month"), // month, user_month, site_month, gb, one_off
  contractMonths: integer("contract_months"),
  users: text("users_range"), // nt 1-50
  sla: text("sla"),
  included: text("included"),
  attributes: text("attributes"), // JSON kategooriaspetsiifilised väljad
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productAddons = sqliteTable("product_addons", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: real("price"),
  currency: text("currency").notNull().default("EUR"),
  priceUnit: text("price_unit"),
  description: text("description"),
});

// ---------- Arhetüübid ----------
export const archetypes = sqliteTable("archetypes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameEt: text("name_et").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
});

export const productArchetypes = sqliteTable(
  "product_archetypes",
  {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    archetypeId: text("archetype_id").notNull().references(() => archetypes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.archetypeId] })],
);

// ---------- Analüüsiplokid ----------
export const CANVAS_BLOCKS = [
  "customer_segments",
  "value_propositions",
  "channels",
  "customer_relationships",
  "revenue_streams",
  "key_resources",
  "key_activities",
  "key_partners",
  "cost_structure",
] as const;
export type CanvasBlock = (typeof CANVAS_BLOCKS)[number];

const originCol = () => text("origin", { enum: ["source", "manual"] }).notNull().default("manual");

export const canvasItems = sqliteTable(
  "canvas_items",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
    block: text("block", { enum: CANVAS_BLOCKS }).notNull(),
    text: text("text").notNull(),
    origin: originCol(),
    sourceId: text("source_id"),
    authorId: text("author_id"),
    createdAt: text("created_at").notNull().default(now()),
  },
  (t) => [index("canvas_product_idx").on(t.productId), index("canvas_company_idx").on(t.companyId)],
);

export const painGainItems = sqliteTable("pain_gain_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["job", "pain", "gain"] }).notNull(),
  customerText: text("customer_text").notNull(), // kliendi töö / valu / kasu
  productResponse: text("product_response"), // leevendaja / kasulooja
  fitScore: integer("fit_score").notNull().default(0), // 0-3
  origin: originCol(),
  sourceId: text("source_id"),
  authorId: text("author_id"),
  createdAt: text("created_at").notNull().default(now()),
});

export const swotItems = sqliteTable("swot_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quadrant: text("quadrant", { enum: ["strength", "weakness", "opportunity", "threat"] }).notNull(),
  text: text("text").notNull(),
  origin: originCol(),
  sourceId: text("source_id"),
  authorId: text("author_id"),
  createdAt: text("created_at").notNull().default(now()),
});

export const valueMessages = sqliteTable("value_messages", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["headline", "supporting", "proof", "differentiator", "tagline"] }).notNull(),
  text: text("text").notNull(), // eesti keeles
  originalText: text("original_text"),
  tone: text("tone"), // simplicity, freedom, security, price, quality, sustainability
  messageType: text("message_type"), // functional, emotional, economic, social
  origin: originCol(),
  sourceId: text("source_id"),
  authorId: text("author_id"),
  createdAt: text("created_at").notNull().default(now()),
});

export const productKpis = sqliteTable("product_kpis", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(), // users, customers, arpa, price_entry, price_per_unit, attach_rate, growth_yoy, churn, nps, share_of_base
  period: text("period").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull().default(""),
  isEstimate: integer("is_estimate", { mode: "boolean" }).notNull().default(false),
  method: text("method"),
  sourceId: text("source_id"),
  note: text("note"),
});

export const insights = sqliteTable("insights", {
  id: text("id").primaryKey(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
  signalId: text("signal_id"),
  relevance: integer("relevance").notNull().default(3), // 1-5
  hypothesis: text("hypothesis"),
  nextStep: text("next_step"),
  owner: text("owner"),
  authorId: text("author_id"),
  updatedAt: text("updated_at").notNull().default(now()),
});

// ---------- Signaalid ja trendid ----------
export const trendTags = sqliteTable("trend_tags", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameEt: text("name_et").notNull(),
  nameEn: text("name_en").notNull(),
});

export const signals = sqliteTable(
  "signals",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary"),
    type: text("type", {
      enum: ["launch", "price_change", "discontinue", "partnership", "m_and_a", "regulation", "technology", "financials", "analyst", "other"],
    }).notNull().default("other"),
    marketId: text("market_id"),
    companyId: text("company_id"),
    productId: text("product_id"),
    categoryId: text("category_id"),
    novelty: integer("novelty").notNull().default(3),
    impact: integer("impact").notNull().default(3),
    confidence: integer("confidence").notNull().default(3),
    horizon: text("horizon", { enum: ["now", "near", "far"] }).notNull().default("now"),
    soWhat: text("so_what"),
    sourceId: text("source_id"),
    occurredAt: text("occurred_at"),
    createdBy: text("created_by"),
    createdAt: text("created_at").notNull().default(now()),
  },
  (t) => [index("signals_company_idx").on(t.companyId), index("signals_created_idx").on(t.createdAt)],
);

export const signalTags = sqliteTable(
  "signal_tags",
  {
    signalId: text("signal_id").notNull().references(() => signals.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => trendTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.signalId, t.tagId] })],
);

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  at: text("at").notNull().default(now()),
});
