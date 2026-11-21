"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db, newId, schema } from "@/db";
import { requireRole, requireUser } from "@/lib/auth";
import { CANVAS_BLOCKS } from "@/db/schema";
import { hashPassword } from "@/lib/password";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  if (v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const num = (fd: FormData, k: string) => {
  const s = str(fd, k);
  if (s === null || s === undefined) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const int = (fd: FormData, k: string, lo: number, hi: number, dflt: number) => {
  const n = num(fd, k);
  if (n === null) return dflt;
  return Math.max(lo, Math.min(hi, Math.round(n)));
};
const oneOf = <T extends string>(fd: FormData, k: string, allowed: readonly T[], dflt: T): T => {
  const s = str(fd, k);
  return s && (allowed as readonly string[]).includes(s) ? (s as T) : dflt;
};

async function editor() {
  return requireRole("admin", "editor");
}

async function audit(userId: string, entity: string, entityId: string, action: string) {
  await db.insert(schema.auditLog).values({ userId, entity, entityId, action }).run();
}

// ---------- Ettevõtted ----------
export async function createCompany(fd: FormData) {
  const u = await editor();
  const id = newId();
  await db.insert(schema.companies)
    .values({
      id,
      marketId: str(fd, "marketId")!,
      parentId: str(fd, "parentId"),
      name: str(fd, "name")!,
      brands: str(fd, "brands"),
      type: oneOf(fd, "type", ["incumbent", "challenger", "mvno", "cable", "it_arm", "integrator", "wholesale", "other"] as const, "incumbent"),
      group: str(fd, "group"),
      website: str(fd, "website"),
      segments: str(fd, "segments"),
      strategy: str(fd, "strategy"),
      notes: str(fd, "notes"),
    })
    .run();
  await audit(u.id, "company", id, "create");
  revalidatePath("/companies");
  redirect(`/companies/${id}`);
}

export async function updateCompany(id: string, fd: FormData) {
  const u = await editor();
  await db.update(schema.companies)
    .set({
      marketId: str(fd, "marketId")!,
      parentId: str(fd, "parentId"),
      name: str(fd, "name")!,
      brands: str(fd, "brands"),
      type: oneOf(fd, "type", ["incumbent", "challenger", "mvno", "cable", "it_arm", "integrator", "wholesale", "other"] as const, "incumbent"),
      group: str(fd, "group"),
      website: str(fd, "website"),
      segments: str(fd, "segments"),
      strategy: str(fd, "strategy"),
      notes: str(fd, "notes"),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.companies.id, id))
    .run();
  await audit(u.id, "company", id, "update");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function addCompanyKpi(companyId: string, fd: FormData) {
  const u = await editor();
  const value = num(fd, "value");
  if (value === null) return;
  const id = newId();
  await db.insert(schema.companyKpis)
    .values({
      id,
      companyId,
      metric: str(fd, "metric")!,
      period: str(fd, "period")!,
      value,
      unit: str(fd, "unit") ?? "",
      currency: str(fd, "currency"),
      scope: str(fd, "scope"),
      sourceId: str(fd, "sourceId"),
      note: str(fd, "note"),
    })
    .run();
  await audit(u.id, "company_kpi", id, "create");
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteCompanyKpi(companyId: string, id: string) {
  const u = await editor();
  await db.delete(schema.companyKpis).where(eq(schema.companyKpis.id, id)).run();
  await audit(u.id, "company_kpi", id, "delete");
  revalidatePath(`/companies/${companyId}`);
}

// ---------- Tooted ----------
const PRICING = ["subscription", "usage", "freemium", "one_off", "revenue_share", "hybrid", "unknown"] as const;
const STATUS = ["new", "active", "discontinued", "sample"] as const;

function productValues(fd: FormData) {
  return {
    companyId: str(fd, "companyId")!,
    categoryId: str(fd, "categoryId")!,
    name: str(fd, "name")!,
    brand: str(fd, "brand"),
    status: oneOf(fd, "status", STATUS, "active"),
    launchDate: str(fd, "launchDate"),
    url: str(fd, "url"),
    summary: str(fd, "summary"),
    targetCustomer: str(fd, "targetCustomer"),
    components: str(fd, "components"),
    addonsSummary: str(fd, "addonsSummary"),
    slaNotes: str(fd, "slaNotes"),
    pricingModel: oneOf(fd, "pricingModel", PRICING, "subscription"),
    priceNotes: str(fd, "priceNotes"),
    channel: str(fd, "channel"),
    technology: str(fd, "technology"),
    partners: str(fd, "partners"),
    notes: str(fd, "notes"),
  };
}

async function syncArchetypes(productId: string, fd: FormData) {
  const ids = fd.getAll("archetypeIds").map(String).filter(Boolean);
  await db.delete(schema.productArchetypes).where(eq(schema.productArchetypes.productId, productId)).run();
  for (const archetypeId of ids) await db.insert(schema.productArchetypes).values({ productId, archetypeId }).run();
}

export async function createProduct(fd: FormData) {
  const u = await editor();
  const id = newId();
  await db.insert(schema.products).values({ id, ...productValues(fd), createdBy: u.id }).run();
  await syncArchetypes(id, fd);
  await audit(u.id, "product", id, "create");
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export async function updateProduct(id: string, fd: FormData) {
  const u = await editor();
  await db.update(schema.products).set({ ...productValues(fd), updatedAt: new Date().toISOString() }).where(eq(schema.products.id, id)).run();
  await syncArchetypes(id, fd);
  await audit(u.id, "product", id, "update");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  const u = await requireRole("admin");
  await db.delete(schema.products).where(eq(schema.products.id, id)).run();
  await audit(u.id, "product", id, "delete");
  revalidatePath("/products");
  redirect("/products");
}

// ---------- Paketid ja lisateenused ----------
export async function addPlan(productId: string, fd: FormData) {
  const u = await editor();
  const attrs = str(fd, "attributes");
  if (attrs) {
    try {
      JSON.parse(attrs);
    } catch {
      return;
    }
  }
  const id = newId();
  await db.insert(schema.productPlans)
    .values({
      id,
      productId,
      name: str(fd, "name")!,
      tier: str(fd, "tier"),
      price: num(fd, "price"),
      currency: str(fd, "currency") ?? "EUR",
      priceEur: num(fd, "priceEur"),
      priceUnit: str(fd, "priceUnit") ?? "month",
      contractMonths: num(fd, "contractMonths"),
      users: str(fd, "users"),
      sla: str(fd, "sla"),
      included: str(fd, "included"),
      attributes: attrs,
      sortOrder: num(fd, "sortOrder") ?? 0,
    })
    .run();
  await audit(u.id, "plan", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function deletePlan(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.productPlans).where(eq(schema.productPlans.id, id)).run();
  await audit(u.id, "plan", id, "delete");
  revalidatePath(`/products/${productId}`);
}

export async function addAddon(productId: string, fd: FormData) {
  const u = await editor();
  const id = newId();
  await db.insert(schema.productAddons)
    .values({ id, productId, name: str(fd, "name")!, price: num(fd, "price"), currency: str(fd, "currency") ?? "EUR", priceUnit: str(fd, "priceUnit"), description: str(fd, "description") })
    .run();
  await audit(u.id, "addon", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function deleteAddon(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.productAddons).where(eq(schema.productAddons.id, id)).run();
  await audit(u.id, "addon", id, "delete");
  revalidatePath(`/products/${productId}`);
}

// ---------- Analüüsiplokid ----------
function originOf(fd: FormData) {
  const sourceId = str(fd, "sourceId");
  return { sourceId, origin: (sourceId ? "source" : "manual") as "source" | "manual" };
}

export async function addCanvasItem(target: { productId?: string; companyId?: string }, fd: FormData) {
  const u = await editor();
  const text = str(fd, "text");
  if (!text) return;
  const block = oneOf(fd, "block", CANVAS_BLOCKS, "value_propositions");
  const id = newId();
  await db.insert(schema.canvasItems).values({ id, productId: target.productId ?? null, companyId: target.companyId ?? null, block, text, ...originOf(fd), authorId: u.id }).run();
  await audit(u.id, "canvas_item", id, "create");
  revalidatePath(target.productId ? `/products/${target.productId}` : `/companies/${target.companyId}`);
}

export async function deleteCanvasItem(path: string, id: string) {
  const u = await editor();
  await db.delete(schema.canvasItems).where(eq(schema.canvasItems.id, id)).run();
  await audit(u.id, "canvas_item", id, "delete");
  revalidatePath(path);
}

export async function addPainGain(productId: string, fd: FormData) {
  const u = await editor();
  const customerText = str(fd, "customerText");
  if (!customerText) return;
  const id = newId();
  await db.insert(schema.painGainItems)
    .values({
      id,
      productId,
      kind: oneOf(fd, "kind", ["job", "pain", "gain"] as const, "pain"),
      customerText,
      productResponse: str(fd, "productResponse"),
      fitScore: int(fd, "fitScore", 0, 3, 0),
      ...originOf(fd),
      authorId: u.id,
    })
    .run();
  await audit(u.id, "pain_gain", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function updatePainGainFit(productId: string, id: string, fitScore: number) {
  const u = await editor();
  await db.update(schema.painGainItems).set({ fitScore: Math.max(0, Math.min(3, fitScore)) }).where(eq(schema.painGainItems.id, id)).run();
  await audit(u.id, "pain_gain", id, "update");
  revalidatePath(`/products/${productId}`);
}

export async function deletePainGain(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.painGainItems).where(eq(schema.painGainItems.id, id)).run();
  await audit(u.id, "pain_gain", id, "delete");
  revalidatePath(`/products/${productId}`);
}

export async function addSwot(productId: string, fd: FormData) {
  const u = await editor();
  const text = str(fd, "text");
  if (!text) return;
  const id = newId();
  await db.insert(schema.swotItems)
    .values({ id, productId, quadrant: oneOf(fd, "quadrant", ["strength", "weakness", "opportunity", "threat"] as const, "strength"), text, ...originOf(fd), authorId: u.id })
    .run();
  await audit(u.id, "swot", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function deleteSwot(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.swotItems).where(eq(schema.swotItems.id, id)).run();
  await audit(u.id, "swot", id, "delete");
  revalidatePath(`/products/${productId}`);
}

export async function addValueMessage(productId: string, fd: FormData) {
  const u = await editor();
  const text = str(fd, "text");
  if (!text) return;
  const id = newId();
  await db.insert(schema.valueMessages)
    .values({
      id,
      productId,
      kind: oneOf(fd, "kind", ["headline", "supporting", "proof", "differentiator", "tagline"] as const, "supporting"),
      text,
      originalText: str(fd, "originalText"),
      tone: str(fd, "tone"),
      messageType: str(fd, "messageType"),
      ...originOf(fd),
      authorId: u.id,
    })
    .run();
  await audit(u.id, "value_message", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function deleteValueMessage(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.valueMessages).where(eq(schema.valueMessages.id, id)).run();
  await audit(u.id, "value_message", id, "delete");
  revalidatePath(`/products/${productId}`);
}

export async function addProductKpi(productId: string, fd: FormData) {
  const u = await editor();
  const value = num(fd, "value");
  if (value === null) return;
  const id = newId();
  await db.insert(schema.productKpis)
    .values({
      id,
      productId,
      metric: str(fd, "metric")!,
      period: str(fd, "period")!,
      value,
      unit: str(fd, "unit") ?? "",
      isEstimate: fd.get("isEstimate") === "on",
      method: str(fd, "method"),
      sourceId: str(fd, "sourceId"),
      note: str(fd, "note"),
    })
    .run();
  await audit(u.id, "product_kpi", id, "create");
  revalidatePath(`/products/${productId}`);
}

export async function deleteProductKpi(productId: string, id: string) {
  const u = await editor();
  await db.delete(schema.productKpis).where(eq(schema.productKpis.id, id)).run();
  await audit(u.id, "product_kpi", id, "delete");
  revalidatePath(`/products/${productId}`);
}

export async function saveInsight(productId: string, fd: FormData) {
  const u = await editor();
  const existing = await db.select().from(schema.insights).where(eq(schema.insights.productId, productId)).get();
  const values = {
    relevance: int(fd, "relevance", 1, 5, 3),
    hypothesis: str(fd, "hypothesis"),
    nextStep: str(fd, "nextStep"),
    owner: str(fd, "owner"),
    authorId: u.id,
    updatedAt: new Date().toISOString(),
  };
  if (existing) await db.update(schema.insights).set(values).where(eq(schema.insights.id, existing.id)).run();
  else await db.insert(schema.insights).values({ id: newId(), productId, ...values }).run();
  await audit(u.id, "insight", productId, existing ? "update" : "create");
  revalidatePath(`/products/${productId}`);
}

// ---------- Allikad ----------
const SOURCE_TYPES = ["product_page", "press", "annual_report", "quarterly_report", "investor_presentation", "regulator", "analyst", "media", "other"] as const;

export async function addSource(fd: FormData) {
  const u = await editor();
  const id = newId();
  const productId = str(fd, "productId");
  const companyId = str(fd, "companyId");
  await db.insert(schema.sources)
    .values({
      id,
      url: str(fd, "url"),
      type: oneOf(fd, "type", SOURCE_TYPES, "other"),
      title: str(fd, "title") ?? str(fd, "url") ?? "Allikas",
      publisher: str(fd, "publisher"),
      publishedAt: str(fd, "publishedAt"),
      reliability: int(fd, "reliability", 1, 5, 3),
      excerpt: str(fd, "excerpt"),
      productId,
      companyId,
      notes: str(fd, "notes"),
      createdBy: u.id,
    })
    .run();
  await audit(u.id, "source", id, "create");
  revalidatePath("/sources");
  if (productId) revalidatePath(`/products/${productId}`);
  if (companyId) revalidatePath(`/companies/${companyId}`);
  const back = str(fd, "redirectTo");
  if (back) redirect(back);
}

export async function deleteSource(id: string, redirectTo?: string) {
  const u = await editor();
  await db.delete(schema.sources).where(eq(schema.sources.id, id)).run();
  await audit(u.id, "source", id, "delete");
  revalidatePath("/sources");
  if (redirectTo) revalidatePath(redirectTo);
}

// ---------- Signaalid ----------
const SIGNAL_TYPES = ["launch", "price_change", "discontinue", "partnership", "m_and_a", "regulation", "technology", "financials", "analyst", "other"] as const;

export async function createSignal(fd: FormData) {
  const u = await editor();
  const id = newId();
  await db.insert(schema.signals)
    .values({
      id,
      title: str(fd, "title")!,
      summary: str(fd, "summary"),
      type: oneOf(fd, "type", SIGNAL_TYPES, "other"),
      marketId: str(fd, "marketId"),
      companyId: str(fd, "companyId"),
      productId: str(fd, "productId"),
      categoryId: str(fd, "categoryId"),
      novelty: int(fd, "novelty", 1, 5, 3),
      impact: int(fd, "impact", 1, 5, 3),
      confidence: int(fd, "confidence", 1, 5, 3),
      horizon: oneOf(fd, "horizon", ["now", "near", "far"] as const, "now"),
      soWhat: str(fd, "soWhat"),
      sourceId: str(fd, "sourceId"),
      occurredAt: str(fd, "occurredAt"),
      createdBy: u.id,
    })
    .run();
  for (const tagId of fd.getAll("tagIds").map(String).filter(Boolean)) {
    await db.insert(schema.signalTags).values({ signalId: id, tagId }).run();
  }
  await audit(u.id, "signal", id, "create");
  revalidatePath("/signals");
  revalidatePath("/");
  redirect("/signals");
}

export async function deleteSignal(id: string) {
  const u = await editor();
  await db.delete(schema.signals).where(eq(schema.signals.id, id)).run();
  await audit(u.id, "signal", id, "delete");
  revalidatePath("/signals");
}

// ---------- Kasutajad ----------
export async function createUser(fd: FormData) {
  const u = await requireRole("admin");
    const email = (str(fd, "email") ?? "").toLowerCase();
  const password = str(fd, "password") ?? "";
  if (!email || password.length < 10) return;
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) return;
  const id = newId();
  await db.insert(schema.users)
    .values({ id, email, name: str(fd, "name") ?? email, passwordHash: await hashPassword(password), role: oneOf(fd, "role", ["admin", "editor", "viewer"] as const, "viewer") })
    .run();
  await audit(u.id, "user", id, "create");
  revalidatePath("/admin/users");
}

export async function setUserActive(id: string, active: boolean) {
  const u = await requireRole("admin");
  if (id === u.id) return;
  await db.update(schema.users).set({ active }).where(eq(schema.users.id, id)).run();
  if (!active) await db.delete(schema.sessions).where(eq(schema.sessions.userId, id)).run();
  await audit(u.id, "user", id, active ? "activate" : "deactivate");
  revalidatePath("/admin/users");
}

export async function setUserRole(id: string, fd: FormData) {
  const u = await requireRole("admin");
  if (id === u.id) return;
  await db.update(schema.users).set({ role: oneOf(fd, "role", ["admin", "editor", "viewer"] as const, "viewer") }).where(eq(schema.users.id, id)).run();
  await audit(u.id, "user", id, "role");
  revalidatePath("/admin/users");
}

export async function resetUserPassword(id: string, fd: FormData) {
  const u = await requireRole("admin");
    const password = str(fd, "password") ?? "";
  if (password.length < 10) return;
  await db.update(schema.users).set({ passwordHash: await hashPassword(password) }).where(eq(schema.users.id, id)).run();
  await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, id))).run();
  await audit(u.id, "user", id, "password_reset");
  revalidatePath("/admin/users");
}

export async function seedReference() {
  const u = await requireRole("admin");
  const { seedReferenceData } = await import("@/db/seed");
  await seedReferenceData(db);
  await audit(u.id, "seed", "reference", "run");
  revalidatePath("/", "layout");
  redirect("/admin/users?seeded=1");
}
