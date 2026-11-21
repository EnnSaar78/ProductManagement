import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { Db } from "../db";
import type { MappingEnv } from "./env";
import { createLlm, type CompanyContext, type Llm, type Usage } from "./llm";
import { fetchPage } from "./fetch";
import { extractLinks, extractSitemapUrls, htmlToText, sha256, slugify } from "./html";
import type { MergedProduct, PageExtraction } from "./schemas";

const MAX_TEXT = 60_000; // märki lehe kohta LLM-ile
const MAX_CANDIDATES = 400;
const newId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();
const nz = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

export function dbFor(env: MappingEnv): Db {
  return drizzle(env.DB, { schema });
}

export type JobContext = {
  db: Db;
  env: MappingEnv;
  jobId: string;
  job: typeof schema.mappingJobs.$inferSelect;
  config: typeof schema.mappingConfigs.$inferSelect;
  company: typeof schema.companies.$inferSelect;
  market: typeof schema.markets.$inferSelect;
  ctx: CompanyContext;
  llm: Llm;
};

export async function loadJobContext(env: MappingEnv, jobId: string): Promise<JobContext> {
  const db = dbFor(env);
  const job = await db.select().from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  if (!job) throw new Error(`Töö ${jobId} puudub`);
  const config = (job.configSnapshot ? (JSON.parse(job.configSnapshot) as typeof schema.mappingConfigs.$inferSelect) : null) ?? (await db.select().from(schema.mappingConfigs).where(eq(schema.mappingConfigs.companyId, job.companyId)).get());
  if (!config) throw new Error("Kaardistuse seadistus puudub");
  const company = (await db.select().from(schema.companies).where(eq(schema.companies.id, job.companyId)).get())!;
  const market = (await db.select().from(schema.markets).where(eq(schema.markets.id, company.marketId)).get())!;
  const ctx: CompanyContext = { name: company.name, market: market.name, website: company.website, type: company.type, segment: config.segment, language: config.language };
  const llm = createLlm(env, config.extractModel, config.synthesisModel);
  return { db, env, jobId, job, config, company, market, ctx, llm };
}

export async function log(db: Db, jobId: string, level: "info" | "warn" | "error", msg: string) {
  const row = await db.select({ log: schema.mappingJobs.log }).from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  const arr = (row?.log ? (JSON.parse(row.log) as { at: string; level: string; msg: string }[]) : []).slice(-300);
  arr.push({ at: nowIso(), level, msg });
  await db.update(schema.mappingJobs).set({ log: JSON.stringify(arr) }).where(eq(schema.mappingJobs.id, jobId)).run();
}

async function addUsage(db: Db, jobId: string, u: Usage) {
  const row = await db.select({ i: schema.mappingJobs.inputTokens, o: schema.mappingJobs.outputTokens }).from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  await db.update(schema.mappingJobs).set({ inputTokens: (row?.i ?? 0) + u.input, outputTokens: (row?.o ?? 0) + u.output }).where(eq(schema.mappingJobs.id, jobId)).run();
}

async function isCancelled(db: Db, jobId: string) {
  const row = await db.select({ status: schema.mappingJobs.status }).from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  return row?.status === "cancelled";
}

function fetchOpts(env: MappingEnv) {
  return { userAgent: env.MAPPING_USER_AGENT ?? "TelcoIntelBot/0.1", allowPrivate: env.ALLOW_PRIVATE_FETCH === "1" };
}

async function categoriesText(db: Db, segment: "B2B" | "B2C" | "ALL") {
  const rows = await db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)).all();
  return rows
    .filter((c) => segment === "ALL" || c.segment === segment)
    .map((c) => `${c.code} = ${c.nameEt} (${c.subcategories ?? ""})`)
    .join("\n");
}

async function archetypesText(db: Db) {
  const rows = await db.select().from(schema.archetypes).all();
  return rows.map((a) => `${a.code} = ${a.nameEt}: ${a.description ?? ""}`).join("\n");
}

// ---------- 1. Avastus ----------
export async function discover(env: MappingEnv, jobId: string): Promise<string[]> {
  const c = await loadJobContext(env, jobId);
  const { db, config } = c;
  await db.update(schema.mappingJobs).set({ status: "running", phase: "discover", startedAt: nowIso() }).where(eq(schema.mappingJobs.id, jobId)).run();
  const seeds = config.seedUrls.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (seeds.length === 0) throw new Error("Seeme-URL-id puuduvad");
  const excludes = (config.excludePatterns ?? "").split(/\r?\n|,/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const candidates = new Map<string, string>();
  const add = (url: string, text = "") => {
    const key = url.replace(/\/$/, "");
    if (excludes.some((x) => key.toLowerCase().includes(x))) return;
    if (!candidates.has(key) || (!candidates.get(key) && text)) candidates.set(key, text);
  };
  for (const s of seeds) add(s, "seeme");
  await log(db, jobId, "info", `Avastus: ${seeds.length} seeme-URL-i`);

  for (const seed of seeds) {
    const r = await fetchPage(seed, fetchOpts(env));
    if (!r.ok) {
      await log(db, jobId, "warn", `Seeme ${seed}: ${r.error}`);
      continue;
    }
    const links = extractLinks(r.html, r.finalUrl);
    for (const l of links) add(l.url, l.text);
    await log(db, jobId, "info", `${seed}: ${links.length} linki`);
    // teine tase: seemnelt leitud lingid, mis sisaldavad vihjeid
    const hints = (config.includeHints ?? "").split(/,|\n/).map((h) => h.trim().toLowerCase()).filter(Boolean);
    const second = links.filter((l) => hints.length === 0 || hints.some((h) => l.url.toLowerCase().includes(h) || l.text.toLowerCase().includes(h))).slice(0, 12);
    for (const l of second) {
      if (l.url === seed.replace(/\/$/, "")) continue;
      const r2 = await fetchPage(l.url, fetchOpts(env));
      if (!r2.ok) continue;
      for (const l2 of extractLinks(r2.html, r2.finalUrl)) add(l2.url, l2.text);
    }
  }
  // sitemap
  try {
    const origin = new URL(seeds[0]).origin;
    const sm = await fetchPage(`${origin}/sitemap.xml`, { ...fetchOpts(env), timeoutMs: 15_000 });
    if (sm.ok) {
      const urls = extractSitemapUrls(sm.html);
      const nested = urls.filter((u) => /sitemap/i.test(u)).slice(0, 5);
      let count = 0;
      for (const u of urls.filter((u) => !/sitemap/i.test(u))) {
        add(u);
        if (++count > 1500) break;
      }
      for (const n of nested) {
        const r = await fetchPage(n, { ...fetchOpts(env), timeoutMs: 15_000 });
        if (r.ok) for (const u of extractSitemapUrls(r.html).slice(0, 500)) add(u);
      }
      await log(db, jobId, "info", `Sitemap: ${urls.length} URL-i`);
    }
  } catch {
    /* sitemap puudub */
  }

  // eelfilter: vihjed ettepoole, seejärel LLM-i valik
  const hints = (config.includeHints ?? "").split(/,|\n/).map((h) => h.trim().toLowerCase()).filter(Boolean);
  const all = [...candidates.entries()].map(([url, text]) => ({ url, text }));
  const scored = all
    .map((x) => ({ ...x, score: (hints.some((h) => x.url.toLowerCase().includes(h)) ? 2 : 0) + (x.text === "seeme" ? 3 : 0) + (/\/(business|enterprise|yritys|yrityksille|foretag|företag|bedrift|erhverv|zakelijk|business-customers|ariklient|ettevott|b2b|produkt|product|tooted|teenused|services|solutions|loesninger|losningar|ratkaisut|hinnad|pricing|prices|hinnasto|priser)/i.test(x.url) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
  await log(db, jobId, "info", `Kandidaate kokku ${all.length}, LLM-ile ${scored.length}`);
  const sel = await c.llm.selectUrls(c.ctx, scored.map(({ url, text }) => ({ url, text })), config.maxPages, config.includeHints);
  await addUsage(db, jobId, sel.usage);
  const known = new Set(scored.map((s) => s.url));
  const chosen = sel.data.urls
    .filter((u) => known.has(u.url.replace(/\/$/, "")) || known.has(u.url))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, config.maxPages);
  const pageIds: string[] = [];
  for (const u of chosen) {
    const id = newId();
    pageIds.push(id);
    await db.insert(schema.mappingPages).values({ id, jobId, companyId: c.company.id, url: u.url, status: "queued" }).run();
  }
  await db.update(schema.mappingJobs).set({ pagesTotal: pageIds.length, phase: "pages" }).where(eq(schema.mappingJobs.id, jobId)).run();
  await log(db, jobId, "info", `Valitud ${pageIds.length} lehte`);
  return pageIds;
}

// ---------- 2. Leht ----------
export async function processPage(env: MappingEnv, jobId: string, pageId: string): Promise<void> {
  const c = await loadJobContext(env, jobId);
  const { db } = c;
  if (await isCancelled(db, jobId)) return;
  const page = await db.select().from(schema.mappingPages).where(eq(schema.mappingPages.id, pageId)).get();
  if (!page || page.status !== "queued") return;
  const r = await fetchPage(page.url, fetchOpts(env));
  if (!r.ok) {
    await db.update(schema.mappingPages).set({ status: "failed", httpStatus: r.status, error: r.error, fetchedAt: nowIso() }).where(eq(schema.mappingPages.id, pageId)).run();
    await bumpDone(db, jobId);
    await log(db, jobId, "warn", `${page.url}: ${r.error}`);
    return;
  }
  const { title, text, description } = htmlToText(r.html);
  const clipped = text.slice(0, MAX_TEXT);
  const hash = await sha256(clipped);

  // sama sisu varasemast tööst: taaskasuta väljavõtet
  const prev = await db
    .select({ extracted: schema.mappingPages.extracted, productsFound: schema.mappingPages.productsFound })
    .from(schema.mappingPages)
    .where(and(eq(schema.mappingPages.companyId, c.company.id), eq(schema.mappingPages.url, page.url), eq(schema.mappingPages.contentHash, hash), eq(schema.mappingPages.status, "extracted"), ne(schema.mappingPages.jobId, jobId)))
    .orderBy(desc(schema.mappingPages.fetchedAt))
    .get();

  const sourceId = newId();
  await db
    .insert(schema.sources)
    .values({ id: sourceId, url: r.finalUrl, type: "product_page", title: title || page.url, publisher: c.company.name, reliability: 4, excerpt: (description || clipped.slice(0, 400)).trim(), companyId: c.company.id, notes: `Kaardistus ${jobId}` })
    .run();

  let extraction: PageExtraction;
  if (prev?.extracted) {
    extraction = JSON.parse(prev.extracted) as PageExtraction;
    await log(db, jobId, "info", `${page.url}: sisu muutumatu, taaskasutan väljavõtet (${prev.productsFound} toodet)`);
  } else {
    if (clipped.length < 200) {
      await db.update(schema.mappingPages).set({ status: "skipped", httpStatus: r.status, title, contentHash: hash, textLength: clipped.length, text: clipped, sourceId, error: "Liiga vähe teksti", fetchedAt: nowIso() }).where(eq(schema.mappingPages.id, pageId)).run();
      await bumpDone(db, jobId);
      return;
    }
    const cats = await categoriesText(db, c.config.segment);
    const res = await c.llm.extractPage(c.ctx, page.url, title, clipped, cats);
    await addUsage(db, jobId, res.usage);
    extraction = res.data;
  }
  await db
    .update(schema.mappingPages)
    .set({ status: "extracted", httpStatus: r.status, title, contentHash: hash, textLength: clipped.length, text: clipped, extracted: JSON.stringify(extraction), productsFound: extraction.products.length, sourceId, fetchedAt: nowIso() })
    .where(eq(schema.mappingPages.id, pageId))
    .run();
  await bumpDone(db, jobId);
  await log(db, jobId, "info", `${page.url}: ${extraction.page_kind}, ${extraction.products.length} toodet`);
}

async function bumpDone(db: Db, jobId: string) {
  const row = await db.select({ n: schema.mappingJobs.pagesDone }).from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  await db.update(schema.mappingJobs).set({ pagesDone: (row?.n ?? 0) + 1 }).where(eq(schema.mappingJobs.id, jobId)).run();
}

// ---------- 3. Ühendamine ja salvestus ----------
export async function mergeAndUpsert(env: MappingEnv, jobId: string): Promise<string[]> {
  const c = await loadJobContext(env, jobId);
  const { db } = c;
  if (await isCancelled(db, jobId)) return [];
  await db.update(schema.mappingJobs).set({ phase: "merge" }).where(eq(schema.mappingJobs.id, jobId)).run();
  const pages = await db.select().from(schema.mappingPages).where(and(eq(schema.mappingPages.jobId, jobId), eq(schema.mappingPages.status, "extracted"))).all();
  const withProducts = pages.map((p, i) => ({ index: i + 1, url: p.url, sourceId: p.sourceId, extraction: JSON.parse(p.extracted ?? "{}") as PageExtraction })).filter((p) => p.extraction.products?.length > 0);
  const found = withProducts.reduce((n, p) => n + p.extraction.products.length, 0);
  await db.update(schema.mappingJobs).set({ productsFound: found }).where(eq(schema.mappingJobs.id, jobId)).run();
  if (found === 0) {
    await log(db, jobId, "warn", "Ühtegi toodet ei leitud");
    return [];
  }
  const cats = await categoriesText(db, c.config.segment);
  const arch = await archetypesText(db);
  const merged = await mergeInChunks(c, withProducts.map(({ index, url, extraction }) => ({ index, url, extraction })), cats, arch);
  await log(db, jobId, "info", `Ühendatud ${merged.data.products.length} toodet (${found} leidu)`);

  const categories = await db.select().from(schema.categories).all();
  const archetypes = await db.select().from(schema.archetypes).all();
  const catByCode = new Map(categories.map((x) => [x.code, x.id]));
  const archByCode = new Map(archetypes.map((x) => [x.code, x.id]));
  const fallbackCat = catByCode.get("B-DIG") ?? categories[0].id;
  const sourceByIndex = new Map(withProducts.map((p) => [p.index, p.sourceId]));

  let created = 0;
  let updated = 0;
  const productIds: string[] = [];
  for (const mp of merged.data.products) {
    const sourceKey = `co:${c.company.id}:${slugify(mp.name)}`;
    const primarySource = mp.source_page_indexes.map((i) => sourceByIndex.get(i)).find((x): x is string => !!x) ?? null;
    const base = productFields(mp, catByCode.get(mp.category_code) ?? fallbackCat);
    let existing = await db.select().from(schema.products).where(eq(schema.products.sourceKey, sourceKey)).get();
    if (!existing) existing = await db.select().from(schema.products).where(and(eq(schema.products.companyId, c.company.id), eq(schema.products.name, mp.name))).get();
    let productId: string;
    if (existing) {
      productId = existing.id;
      await db.update(schema.products).set({ ...base, sourceKey, reviewStatus: "unreviewed", lastMappedAt: nowIso(), updatedAt: nowIso() }).where(eq(schema.products.id, productId)).run();
      updated++;
    } else {
      productId = newId();
      await db.insert(schema.products).values({ id: productId, companyId: c.company.id, ...base, sourceKey, status: "new", reviewStatus: "unreviewed", lastMappedAt: nowIso() }).run();
      created++;
    }
    productIds.push(productId);
    // paketid ja lisateenused: kaardistus on nende omanik
    await db.delete(schema.productPlans).where(eq(schema.productPlans.productId, productId)).run();
    await db.delete(schema.productAddons).where(eq(schema.productAddons.productId, productId)).run();
    let order = 0;
    for (const pl of mp.plans) {
      await db
        .insert(schema.productPlans)
        .values({
          id: newId(), productId, name: pl.name, tier: nz(pl.tier), price: pl.price, currency: nz(pl.currency) ?? c.market.currency, priceEur: (nz(pl.currency) ?? c.market.currency).toUpperCase() === "EUR" ? pl.price : null,
          priceUnit: pl.price_unit === "unknown" ? "month" : pl.price_unit, contractMonths: pl.contract_months, users: nz(pl.users), sla: nz(pl.sla), included: pl.included.join("\n"),
          attributes: pl.attributes.length ? JSON.stringify(Object.fromEntries(pl.attributes.map((a) => [a.key, a.value]))) : null, sortOrder: order++,
        })
        .run();
    }
    for (const ad of mp.addons) {
      await db.insert(schema.productAddons).values({ id: newId(), productId, name: ad.name, price: ad.price, currency: nz(ad.currency) ?? c.market.currency, priceUnit: ad.price_unit === "unknown" ? null : ad.price_unit, description: nz(ad.description) }).run();
    }
    // arhetüübid
    await db.delete(schema.productArchetypes).where(eq(schema.productArchetypes.productId, productId)).run();
    for (const code of new Set(mp.archetype_codes)) {
      const archetypeId = archByCode.get(code);
      if (archetypeId) await db.insert(schema.productArchetypes).values({ productId, archetypeId }).run();
    }
    // väärtussõnumid: asenda allikast pärit kirjed
    await db.delete(schema.valueMessages).where(and(eq(schema.valueMessages.productId, productId), eq(schema.valueMessages.origin, "source"))).run();
    const msg = (kind: "headline" | "supporting" | "proof" | "differentiator", text: string, originalText: string | null = null) =>
      db.insert(schema.valueMessages).values({ id: newId(), productId, kind, text, originalText, origin: "source", sourceId: primarySource }).run();
    if (nz(mp.headline)) await msg("headline", mp.headline, nz(mp.original_headline));
    for (const s of mp.supporting_messages) await msg("supporting", s);
    for (const s of mp.proof_points) await msg("proof", s);
    for (const s of mp.differentiators) await msg("differentiator", s);
    // allikad toote külge
    const srcIds = mp.source_page_indexes.map((i) => sourceByIndex.get(i)).filter((x): x is string => !!x);
    if (srcIds.length) await db.update(schema.sources).set({ productId }).where(inArray(schema.sources.id, srcIds)).run();
  }
  await db.update(schema.mappingJobs).set({ productsCreated: created, productsUpdated: updated, phase: "synthesize" }).where(eq(schema.mappingJobs.id, jobId)).run();
  await log(db, jobId, "info", `Salvestatud: ${created} uut, ${updated} uuendatud`);
  return productIds;
}

/** Suur leiuhulk ühendatakse osade kaupa (<= MERGE_CHUNK leidu korraga), seejärel lõplik ühendamine. */
const MERGE_CHUNK = 22;
async function mergeInChunks(c: JobContext, pages: { index: number; url: string; extraction: PageExtraction }[], cats: string, arch: string) {
  const total = pages.reduce((n, p) => n + p.extraction.products.length, 0);
  if (total <= MERGE_CHUNK + 6) {
    const r = await c.llm.mergeProducts(c.ctx, pages, cats, arch);
    await addUsage(c.db, c.jobId, r.usage);
    return r;
  }
  const groups: (typeof pages)[] = [];
  let cur: typeof pages = [];
  let n = 0;
  for (const p of pages) {
    if (n > 0 && n + p.extraction.products.length > MERGE_CHUNK) {
      groups.push(cur);
      cur = [];
      n = 0;
    }
    cur.push(p);
    n += p.extraction.products.length;
  }
  if (cur.length) groups.push(cur);
  await log(c.db, c.jobId, "info", `Ühendamine ${groups.length} osas (${total} leidu)`);
  const validIdx = new Set(pages.map((p) => p.index));
  const pseudo: { index: number; url: string; extraction: PageExtraction; orig: number[] }[] = [];
  for (let g = 0; g < groups.length; g++) {
    const r = await c.llm.mergeProducts(c.ctx, groups[g], cats, arch);
    await addUsage(c.db, c.jobId, r.usage);
    const orig = groups[g].map((p) => p.index);
    pseudo.push({ index: 1000 + g, url: `osa ${g + 1}: ${groups[g].map((p) => p.url).join(", ")}`, extraction: { page_kind: "category_overview", notes: "", products: r.data.products }, orig });
    await log(c.db, c.jobId, "info", `Osa ${g + 1}/${groups.length}: ${r.data.products.length} toodet`);
  }
  const final = await c.llm.mergeProducts(c.ctx, pseudo.map(({ index, url, extraction }) => ({ index, url, extraction })), cats, arch);
  await addUsage(c.db, c.jobId, final.usage);
  for (const mp of final.data.products) {
    const real = mp.source_page_indexes.filter((i) => validIdx.has(i));
    if (real.length === 0) {
      const fromPseudo = mp.source_page_indexes.flatMap((i) => pseudo.find((p) => p.index === i)?.orig ?? []);
      mp.source_page_indexes = fromPseudo.length ? fromPseudo : pseudo.flatMap((p) => p.orig);
    } else mp.source_page_indexes = real;
  }
  return final;
}

function productFields(mp: MergedProduct, categoryId: string) {
  return {
    categoryId,
    name: mp.name,
    status: mp.status,
    summary: mp.summary,
    targetCustomer: nz(mp.target_customer),
    components: mp.components.join("\n") || null,
    addonsSummary: mp.addons.map((a) => a.name).join("\n") || null,
    slaNotes: nz(mp.sla_notes),
    pricingModel: mp.pricing_model,
    priceNotes: [nz(mp.price_notes), nz(mp.terms) ? `Tingimused: ${mp.terms.trim()}` : null].filter(Boolean).join("\n") || null,
    channel: nz(mp.channel),
    technology: nz(mp.technology),
    partners: nz(mp.partners),
  };
}

// ---------- 4. Süntees: canvas, pain–gain, SWOT ----------
export async function synthesizeProduct(env: MappingEnv, jobId: string, productId: string): Promise<void> {
  const c = await loadJobContext(env, jobId);
  const { db } = c;
  if (await isCancelled(db, jobId)) return;
  const product = await db.select().from(schema.products).where(eq(schema.products.id, productId)).get();
  if (!product) return;
  const plans = await db.select().from(schema.productPlans).where(eq(schema.productPlans.productId, productId)).all();
  const addons = await db.select().from(schema.productAddons).where(eq(schema.productAddons.productId, productId)).all();
  const messages = await db.select().from(schema.valueMessages).where(eq(schema.valueMessages.productId, productId)).all();
  const category = await db.select().from(schema.categories).where(eq(schema.categories.id, product.categoryId)).get();
  const src = await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.productId, productId)).orderBy(desc(schema.sources.fetchedAt)).get();
  const payload = {
    name: product.name, category: category ? `${category.code} ${category.nameEt}` : null, summary: product.summary, target_customer: product.targetCustomer, components: product.components,
    addons: addons.map((a) => ({ name: a.name, price: a.price, currency: a.currency, unit: a.priceUnit, description: a.description })),
    plans: plans.map((p) => ({ name: p.name, tier: p.tier, price: p.price, currency: p.currency, unit: p.priceUnit, contract_months: p.contractMonths, sla: p.sla, included: p.included, attributes: p.attributes })),
    pricing_model: product.pricingModel, price_notes: product.priceNotes, sla_notes: product.slaNotes, channel: product.channel, technology: product.technology, partners: product.partners,
    messages: messages.map((m) => ({ kind: m.kind, text: m.text })),
  };
  const res = await c.llm.synthesize(c.ctx, JSON.stringify(payload, null, 1));
  await addUsage(db, jobId, res.usage);
  const s = res.data;
  const sourceId = src?.id ?? null;
  await db.delete(schema.canvasItems).where(and(eq(schema.canvasItems.productId, productId), eq(schema.canvasItems.origin, "source"))).run();
  for (const [block, items] of Object.entries(s.canvas) as [keyof typeof s.canvas, string[]][]) {
    for (const text of items) await db.insert(schema.canvasItems).values({ id: newId(), productId, block, text, origin: "source", sourceId }).run();
  }
  await db.delete(schema.painGainItems).where(and(eq(schema.painGainItems.productId, productId), eq(schema.painGainItems.origin, "source"))).run();
  for (const pg of s.pain_gain) {
    await db.insert(schema.painGainItems).values({ id: newId(), productId, kind: pg.kind, customerText: pg.customer_text, productResponse: nz(pg.product_response), fitScore: pg.fit_score, origin: "source", sourceId }).run();
  }
  await db.delete(schema.swotItems).where(and(eq(schema.swotItems.productId, productId), eq(schema.swotItems.origin, "source"))).run();
  const quadrants = { strength: s.swot.strengths, weakness: s.swot.weaknesses, opportunity: s.swot.opportunities, threat: s.swot.threats } as const;
  for (const [quadrant, items] of Object.entries(quadrants) as [keyof typeof quadrants, string[]][]) {
    for (const text of items) await db.insert(schema.swotItems).values({ id: newId(), productId, quadrant, text, origin: "source", sourceId }).run();
  }
  await log(db, jobId, "info", `Süntees: ${product.name}`);
}

// ---------- 5. Lõpetamine ----------
export async function finishJob(env: MappingEnv, jobId: string, status: "done" | "failed", error?: string) {
  const db = dbFor(env);
  const job = await db.select().from(schema.mappingJobs).where(eq(schema.mappingJobs.id, jobId)).get();
  if (!job) return;
  if (job.status === "cancelled") return;
  await db.update(schema.mappingJobs).set({ status, phase: "finish", finishedAt: nowIso(), error: error ?? null }).where(eq(schema.mappingJobs.id, jobId)).run();
  const cfg = await db.select().from(schema.mappingConfigs).where(eq(schema.mappingConfigs.companyId, job.companyId)).get();
  if (cfg) {
    const next = cfg.scheduleDays > 0 ? new Date(Date.now() + cfg.scheduleDays * 86400_000).toISOString() : null;
    await db.update(schema.mappingConfigs).set({ lastRunAt: nowIso(), nextRunAt: next }).where(eq(schema.mappingConfigs.id, cfg.id)).run();
  }
  await log(db, jobId, status === "done" ? "info" : "error", status === "done" ? "Kaardistus lõpetatud" : `Kaardistus ebaõnnestus: ${error}`);
}
