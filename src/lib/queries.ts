import "server-only";
import { asc, desc, eq, or, count, sql, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export async function listMarkets() {
  return db.select().from(schema.markets).orderBy(asc(schema.markets.priority), asc(schema.markets.name)).all();
}

export async function listCompanies() {
  return db
    .select({
      id: schema.companies.id,
      name: schema.companies.name,
      type: schema.companies.type,
      website: schema.companies.website,
      group: schema.companies.group,
      parentId: schema.companies.parentId,
      marketId: schema.companies.marketId,
      marketName: schema.markets.name,
      marketCode: schema.markets.code,
      marketPriority: schema.markets.priority,
    })
    .from(schema.companies)
    .innerJoin(schema.markets, eq(schema.markets.id, schema.companies.marketId))
    .orderBy(asc(schema.markets.priority), asc(schema.markets.name), asc(schema.companies.name))
    .all();
}

export async function listCategories(segment?: "B2B" | "B2C") {
  const q = db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
  return segment ? q.where(eq(schema.categories.segment, segment)).all() : q.all();
}

export async function listArchetypes() {
  return db.select().from(schema.archetypes).orderBy(asc(schema.archetypes.nameEt)).all();
}

export async function listTrendTags() {
  return db.select().from(schema.trendTags).orderBy(asc(schema.trendTags.nameEt)).all();
}

export async function listProducts(filter?: { categoryId?: string; companyId?: string; marketId?: string; segment?: "B2B" | "B2C" }) {
  const rows = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      status: schema.products.status,
      pricingModel: schema.products.pricingModel,
      summary: schema.products.summary,
      updatedAt: schema.products.updatedAt,
      companyId: schema.companies.id,
      companyName: schema.companies.name,
      marketId: schema.markets.id,
      marketName: schema.markets.name,
      marketCode: schema.markets.code,
      categoryId: schema.categories.id,
      categoryCode: schema.categories.code,
      categoryNameEt: schema.categories.nameEt,
      categoryNameEn: schema.categories.nameEn,
      segment: schema.categories.segment,
    })
    .from(schema.products)
    .innerJoin(schema.companies, eq(schema.companies.id, schema.products.companyId))
    .innerJoin(schema.markets, eq(schema.markets.id, schema.companies.marketId))
    .innerJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
    .orderBy(asc(schema.categories.sortOrder), asc(schema.markets.name), asc(schema.companies.name), asc(schema.products.name))
    .all();
  return rows.filter(
    (r) =>
      (!filter?.categoryId || r.categoryId === filter.categoryId) &&
      (!filter?.companyId || r.companyId === filter.companyId) &&
      (!filter?.marketId || r.marketId === filter.marketId) &&
      (!filter?.segment || r.segment === filter.segment),
  );
}

export async function productSources(productId: string, companyId?: string) {
  const cond = companyId ? or(eq(schema.sources.productId, productId), eq(schema.sources.companyId, companyId)) : eq(schema.sources.productId, productId);
  return db.select().from(schema.sources).where(cond).orderBy(desc(schema.sources.fetchedAt)).all();
}

export type SourceRef = { id: string; title: string; url: string | null };

export async function sourceMap(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  const map = new Map<string, SourceRef>();
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: schema.sources.id, title: schema.sources.title, url: schema.sources.url })
    .from(schema.sources)
    .where(inArray(schema.sources.id, unique))
    .all();
  for (const s of rows) map.set(s.id, s);
  return map;
}

export async function getProductFull(id: string) {
  const product = await db.select().from(schema.products).where(eq(schema.products.id, id)).get();
  if (!product) return null;
  const company = (await db.select().from(schema.companies).where(eq(schema.companies.id, product.companyId)).get())!;
  const [market, category, plans, addons, archetypes, canvas, painGain, swot, messages, kpis, insight, sources] = await Promise.all([
    db.select().from(schema.markets).where(eq(schema.markets.id, company.marketId)).get(),
    db.select().from(schema.categories).where(eq(schema.categories.id, product.categoryId)).get(),
    db.select().from(schema.productPlans).where(eq(schema.productPlans.productId, id)).orderBy(asc(schema.productPlans.sortOrder), asc(schema.productPlans.price)).all(),
    db.select().from(schema.productAddons).where(eq(schema.productAddons.productId, id)).all(),
    db
      .select({ id: schema.archetypes.id, code: schema.archetypes.code, nameEt: schema.archetypes.nameEt, nameEn: schema.archetypes.nameEn })
      .from(schema.productArchetypes)
      .innerJoin(schema.archetypes, eq(schema.archetypes.id, schema.productArchetypes.archetypeId))
      .where(eq(schema.productArchetypes.productId, id))
      .all(),
    db.select().from(schema.canvasItems).where(eq(schema.canvasItems.productId, id)).orderBy(asc(schema.canvasItems.createdAt)).all(),
    db.select().from(schema.painGainItems).where(eq(schema.painGainItems.productId, id)).orderBy(asc(schema.painGainItems.kind), desc(schema.painGainItems.fitScore)).all(),
    db.select().from(schema.swotItems).where(eq(schema.swotItems.productId, id)).orderBy(asc(schema.swotItems.createdAt)).all(),
    db.select().from(schema.valueMessages).where(eq(schema.valueMessages.productId, id)).orderBy(asc(schema.valueMessages.createdAt)).all(),
    db.select().from(schema.productKpis).where(eq(schema.productKpis.productId, id)).orderBy(asc(schema.productKpis.metric), desc(schema.productKpis.period)).all(),
    db.select().from(schema.insights).where(eq(schema.insights.productId, id)).get(),
    productSources(id, company.id),
  ]);
  const srcMap = await sourceMap([
    ...canvas.map((x) => x.sourceId),
    ...painGain.map((x) => x.sourceId),
    ...swot.map((x) => x.sourceId),
    ...messages.map((x) => x.sourceId),
    ...kpis.map((x) => x.sourceId),
  ]);
  return { product, company, market: market!, category: category!, plans, addons, archetypes, canvas, painGain, swot, messages, kpis, insight: insight ?? null, sources, srcMap };
}

export async function dashboardStats() {
  const n = async (q: { get: () => Promise<{ n: number } | undefined> }) => (await q.get())?.n ?? 0;
  const [markets, companies, products, signals, sources] = await Promise.all([
    n(db.select({ n: count() }).from(schema.markets)),
    n(db.select({ n: count() }).from(schema.companies)),
    n(db.select({ n: count() }).from(schema.products)),
    n(db.select({ n: count() }).from(schema.signals)),
    n(db.select({ n: count() }).from(schema.sources)),
  ]);
  return { markets, companies, products, signals, sources };
}

export async function listSignals(limit = 200) {
  const rows = await db
    .select({
      id: schema.signals.id,
      title: schema.signals.title,
      summary: schema.signals.summary,
      type: schema.signals.type,
      novelty: schema.signals.novelty,
      impact: schema.signals.impact,
      confidence: schema.signals.confidence,
      horizon: schema.signals.horizon,
      soWhat: schema.signals.soWhat,
      occurredAt: schema.signals.occurredAt,
      createdAt: schema.signals.createdAt,
      sourceId: schema.signals.sourceId,
      companyId: schema.signals.companyId,
      productId: schema.signals.productId,
      companyName: schema.companies.name,
      marketName: schema.markets.name,
    })
    .from(schema.signals)
    .leftJoin(schema.companies, eq(schema.companies.id, schema.signals.companyId))
    .leftJoin(schema.markets, eq(schema.markets.id, schema.companies.marketId))
    .orderBy(desc(schema.signals.createdAt))
    .limit(limit)
    .all();
  const tags = rows.length
    ? await db
        .select({ signalId: schema.signalTags.signalId, code: schema.trendTags.code, nameEt: schema.trendTags.nameEt, nameEn: schema.trendTags.nameEn })
        .from(schema.signalTags)
        .innerJoin(schema.trendTags, eq(schema.trendTags.id, schema.signalTags.tagId))
        .where(inArray(schema.signalTags.signalId, rows.map((r) => r.id)))
        .all()
    : [];
  const tagMap = new Map<string, typeof tags>();
  for (const t of tags) {
    const arr = tagMap.get(t.signalId) ?? [];
    arr.push(t);
    tagMap.set(t.signalId, arr);
  }
  return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [], score: Math.round(((r.novelty + r.impact * 2 + r.confidence) / 4) * 10) / 10 }));
}

export async function trendRadar() {
  return db
    .select({
      code: schema.trendTags.code,
      nameEt: schema.trendTags.nameEt,
      nameEn: schema.trendTags.nameEn,
      n: count(schema.signalTags.signalId),
      avgImpact: sql<number>`coalesce(avg(${schema.signals.impact}), 0)`,
      avgNovelty: sql<number>`coalesce(avg(${schema.signals.novelty}), 0)`,
    })
    .from(schema.trendTags)
    .leftJoin(schema.signalTags, eq(schema.signalTags.tagId, schema.trendTags.id))
    .leftJoin(schema.signals, eq(schema.signals.id, schema.signalTags.signalId))
    .groupBy(schema.trendTags.id)
    .orderBy(desc(count(schema.signalTags.signalId)))
    .all();
}

export async function userCount() {
  return (await db.select({ n: count() }).from(schema.users).get())?.n ?? 0;
}
