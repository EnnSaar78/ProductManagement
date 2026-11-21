import { z } from "zod";

/** Zod-skeemid Claude'i struktureeritud väljunditele.
 * Piirangud: ei mingeid record-tüüpe; nullable/union välju max 16 skeemi kohta, seega tekstiväljad on tühja stringiga "teadmata". */

export const UrlSelectionSchema = z.object({
  urls: z.array(
    z.object({
      url: z.string(),
      reason: z.string(),
      priority: z.number().int().min(1).max(5),
    }),
  ),
});
export type UrlSelection = z.infer<typeof UrlSelectionSchema>;

const PriceUnit = z.enum(["month", "user_month", "site_month", "gb", "one_off", "year", "unknown"]);
const PricingModel = z.enum(["subscription", "usage", "freemium", "one_off", "revenue_share", "hybrid", "unknown"]);

export const PlanSchema = z.object({
  name: z.string(),
  tier: z.string(),
  price: z.number().nullable(),
  currency: z.string(),
  price_unit: PriceUnit,
  contract_months: z.number().int().nullable(),
  users: z.string(),
  sla: z.string(),
  included: z.array(z.string()),
  attributes: z.array(z.object({ key: z.string(), value: z.string() })),
});

export const AddonSchema = z.object({
  name: z.string(),
  price: z.number().nullable(),
  currency: z.string(),
  price_unit: PriceUnit,
  description: z.string(),
});

export const ExtractedProductSchema = z.object({
  name: z.string(),
  category_code: z.string(),
  segment: z.enum(["B2B", "B2C"]),
  summary: z.string(),
  target_customer: z.string(),
  components: z.array(z.string()),
  addons: z.array(AddonSchema),
  plans: z.array(PlanSchema),
  pricing_model: PricingModel,
  price_notes: z.string(),
  terms: z.string(),
  sla_notes: z.string(),
  channel: z.string(),
  technology: z.string(),
  partners: z.string(),
  headline: z.string(),
  original_headline: z.string(),
  supporting_messages: z.array(z.string()),
  proof_points: z.array(z.string()),
  differentiators: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
export type ExtractedProduct = z.infer<typeof ExtractedProductSchema>;

export const PageExtractionSchema = z.object({
  page_kind: z.enum(["product", "category_overview", "pricing", "news", "support", "other"]),
  products: z.array(ExtractedProductSchema),
  notes: z.string(),
});
export type PageExtraction = z.infer<typeof PageExtractionSchema>;

export const MergedProductSchema = ExtractedProductSchema.extend({
  source_page_indexes: z.array(z.number().int()),
  archetype_codes: z.array(z.string()),
  status: z.enum(["new", "active", "discontinued"]),
});
export type MergedProduct = z.infer<typeof MergedProductSchema>;

export const MergeResultSchema = z.object({
  products: z.array(MergedProductSchema),
});
export type MergeResult = z.infer<typeof MergeResultSchema>;

const canvasBlock = z.array(z.string());
export const SynthesisSchema = z.object({
  canvas: z.object({
    customer_segments: canvasBlock,
    value_propositions: canvasBlock,
    channels: canvasBlock,
    customer_relationships: canvasBlock,
    revenue_streams: canvasBlock,
    key_resources: canvasBlock,
    key_activities: canvasBlock,
    key_partners: canvasBlock,
    cost_structure: canvasBlock,
  }),
  pain_gain: z.array(
    z.object({
      kind: z.enum(["job", "pain", "gain"]),
      customer_text: z.string(),
      product_response: z.string(),
      fit_score: z.number().int().min(0).max(3),
    }),
  ),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
});
export type Synthesis = z.infer<typeof SynthesisSchema>;
