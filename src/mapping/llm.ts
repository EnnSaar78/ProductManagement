import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { MappingEnv } from "./env";
import {
  MergeResultSchema,
  PageExtractionSchema,
  SynthesisSchema,
  UrlSelectionSchema,
  type MergeResult,
  type PageExtraction,
  type Synthesis,
  type UrlSelection,
} from "./schemas";

export type Usage = { input: number; output: number };
export type LlmResult<T> = { data: T; usage: Usage };

export type CompanyContext = { name: string; market: string; website: string | null; type: string; segment: "B2B" | "B2C" | "ALL"; language: string };

export interface Llm {
  selectUrls(ctx: CompanyContext, candidates: { url: string; text: string }[], max: number, hints: string | null): Promise<LlmResult<UrlSelection>>;
  extractPage(ctx: CompanyContext, url: string, title: string, text: string, categories: string): Promise<LlmResult<PageExtraction>>;
  mergeProducts(ctx: CompanyContext, pages: { index: number; url: string; extraction: PageExtraction }[], categories: string, archetypes: string): Promise<LlmResult<MergeResult>>;
  synthesize(ctx: CompanyContext, productJson: string): Promise<LlmResult<Synthesis>>;
}

const LANG: Record<string, string> = { et: "eesti keeles", en: "in English", fi: "suomeksi" };

function systemBase(ctx: CompanyContext) {
  return [
    "Oled telekommunikatsiooni- ja IT-sektori äriarenduse analüütik. Kaardistad operaatorite tooteid ja ärimudeleid ühtses struktuuris.",
    `Ettevõte: ${ctx.name} (${ctx.market}, tüüp: ${ctx.type}, veeb: ${ctx.website ?? "-"}). Fookus: ${ctx.segment === "ALL" ? "B2B ja B2C" : ctx.segment} teenused.`,
    `Kirjuta kõik vabatekstiväljad ${LANG[ctx.language] ?? LANG.et}, lühidalt ja faktipõhiselt. Ära mõtle välja hindu ega tingimusi: kui infot ei ole, jäta tekstiväli tühjaks stringiks, arv null-iks ja loend tühjaks.`,
    "Rahasummad kirjuta numbrina ilma valuutata ja märgi valuuta eraldi (ISO kood). Käibemaksuta ja -ga hinna puhul eelista lehel kuvatud põhihinda ja märgi price_notes väljale, kumb see on.",
  ].join("\n");
}

class RealLlm implements Llm {
  private client: Anthropic;
  constructor(apiKey: string, private extractModel: string, private synthesisModel: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 3, timeout: 10 * 60 * 1000 });
  }

  private async call<S extends z.ZodType>(model: string, effort: "low" | "medium" | "high", system: string, user: string, schema: S, maxTokens = 16000): Promise<LlmResult<z.infer<S>>> {
    // Voogedastus: suured väljundid (mõtlemine + JSON) ei jookse HTTP ajalimiiti
    const stream = this.client.beta.messages.stream({
      model,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      output_config: { format: betaZodOutputFormat(schema), effort },
    });
    let res: Awaited<ReturnType<typeof stream.finalMessage>>;
    try {
      res = await stream.finalMessage();
    } catch (e) {
      // SDK viskab parsimisvea enne, kui saame stop_reason'it vaadata: anna selgem teade
      const msg = e instanceof Error ? e.message : String(e);
      if (/Failed to parse structured output|Unterminated|Unexpected end/i.test(msg)) throw new Error(`Väljund katkes enne JSON-i lõppu (max_tokens ${maxTokens} on liiga väike või sisend liiga suur): ${msg.slice(0, 160)}`);
      throw e;
    }
    const usage = { input: (res.usage.input_tokens ?? 0) + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0), output: res.usage.output_tokens ?? 0 };
    if (res.stop_reason === "refusal") throw new Error(`Mudel keeldus: ${res.stop_details?.category ?? "?"}`);
    if (res.stop_reason === "max_tokens") throw new Error(`Vastus katkes max_tokens (${maxTokens}) piiril`);
    if (!res.parsed_output) throw new Error("Struktureeritud väljundit ei õnnestunud parsida");
    return { data: res.parsed_output as z.infer<S>, usage };
  }

  selectUrls(ctx: CompanyContext, candidates: { url: string; text: string }[], max: number, hints: string | null) {
    const list = candidates.map((c, i) => `${i + 1}. ${c.url}${c.text ? ` — "${c.text}"` : ""}`).join("\n");
    const user = [
      `Vali alloleva URL-ide loendi hulgast kuni ${max} lehte, millelt on kõige tõenäolisem leida ${ctx.segment === "ALL" ? "" : ctx.segment + " "}toodete ja teenuste kirjeldusi, hindu, pakette, lisateenuseid ja tingimusi.`,
      "Eelista tootelehti, hinnakirju ja teenuste ülevaateid. Väldi uudiseid, karjääri, tugiteenuse artikleid, juriidilisi lehti ja blogi.",
      hints ? `Vihjed, millised URL-id või teemad on olulised: ${hints}` : "",
      "Anna igale valitud URL-ile põhjendus ja prioriteet 1 (madal) kuni 5 (kõrge). Kasuta URL-e täpselt loendi kujul.",
      "",
      list,
    ].join("\n");
    return this.call(this.extractModel, "low", systemBase(ctx), user, UrlSelectionSchema, 16000);
  }

  extractPage(ctx: CompanyContext, url: string, title: string, text: string, categories: string) {
    const user = [
      `Loe järgnev veebileht läbi ja too välja kõik sellel kirjeldatud tooted ja teenused koos parameetrite, pakettide, hindade, tingimuste ja lisateenustega.`,
      "Kui leht on kategooria ülevaade mitme tootega, too iga toode eraldi. Kui lehel tooteid ei ole, tagasta tühi loend.",
      "category_code vali järgmiste hulgast (kood ja kirjeldus):",
      categories,
      "headline on lehe peamine väärtuslubadus tõlgituna; original_headline sama originaalkeeles.",
      "confidence väljendab, kui kindel oled, et tegemist on päris müüdava tootega (0–1).",
      "",
      `URL: ${url}`,
      `Pealkiri: ${title}`,
      "--- LEHE TEKST ---",
      text,
    ].join("\n");
    return this.call(this.extractModel, "medium", systemBase(ctx), user, PageExtractionSchema, 40000);
  }

  mergeProducts(ctx: CompanyContext, pages: { index: number; url: string; extraction: PageExtraction }[], categories: string, archetypes: string) {
    const body = pages.map((p) => `### Leht ${p.index}: ${p.url}\n${JSON.stringify(p.extraction.products)}`).join("\n\n");
    const user = [
      "Allpool on erinevatelt lehtedelt välja loetud tooted. Ühenda need üheks kanooniliseks tooteloendiks:",
      "- sama toode mitmel lehel liida kokku (täienda pakette, lisateenuseid, sõnumeid; ära dubleeri);",
      "- hoia tooted eraldi, kui need on päriselt erinevad pakkumised;",
      "- jäta välja kirjed, mis ei ole müüdavad tooted (uudised, üldlehed, confidence alla 0,4);",
      "- source_page_indexes loetleb lehtede indeksid, kust toode pärineb; kui sisendtoodetel on juba source_page_indexes olemas, kasuta neid originaalväärtusi;",
      "- hoia väljund kompaktne: included ja components lühikeste fraasidena, mitte lausetena;",
      "- archetype_codes vali loendist:",
      archetypes,
      "- category_code vali loendist:",
      categories,
      "",
      body,
    ].join("\n");
    return this.call(this.extractModel, "medium", systemBase(ctx), user, MergeResultSchema, 64000);
  }

  synthesize(ctx: CompanyContext, productJson: string) {
    const user = [
      "Koosta alloleva toote kohta analüüs ainult toote faktide ja telekomituru üldteadmiste põhjal:",
      "1) Business Model Canvas (Osterwalder) 9 plokki, igas 2–5 lühikest konkreetset punkti;",
      "2) Pain–Gain maatriks: 3–6 kliendi tööd (job), 4–8 valu (pain), 3–6 kasu (gain); igale valule/kasule toote vastus (leevendaja/kasulooja) või null ja sobivuse hinne 0–3 (0 = toode ei kata, 3 = katab täielikult);",
      "3) SWOT turu kontekstis: 2–5 punkti kvadrandi kohta.",
      "Ole konkreetne ja väldi üldsõnalisust. Kui toote andmetes infot ei ole, ära mõtle fakte välja: sõnasta eeldusena.",
      "",
      "--- TOODE ---",
      productJson,
    ].join("\n");
    return this.call(this.synthesisModel, "high", systemBase(ctx), user, SynthesisSchema, 32000);
  }
}

/** Deterministlik mock testimiseks ilma API võtmeta. */
class MockLlm implements Llm {
  private usage = { input: 0, output: 0 };
  async selectUrls(_ctx: CompanyContext, candidates: { url: string; text: string }[], max: number): Promise<LlmResult<UrlSelection>> {
    return { data: { urls: candidates.slice(0, max).map((c) => ({ url: c.url, reason: "mock", priority: 3 })) }, usage: this.usage };
  }
  async extractPage(_ctx: CompanyContext, url: string, title: string, text: string): Promise<LlmResult<PageExtraction>> {
    const priceMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(€|EUR|SEK|kr)/);
    const hasProduct = /hind|price|€|EUR|kuus|\/kk|paket/i.test(text);
    if (!hasProduct) return { data: { page_kind: "other", products: [], notes: "mock: tooteid ei leitud" }, usage: this.usage };
    const name = title.split(/[|–-]/)[0].trim() || url;
    return {
      data: {
        page_kind: "product",
        notes: "",
        products: [
          {
            name,
            category_code: /turv|secur/i.test(text) ? "B-SEC" : "B-CON",
            segment: "B2B",
            summary: `Mock-kokkuvõte lehelt ${url}`,
            target_customer: "Keskmise suurusega ettevõtted",
            components: ["Komponent A", "Komponent B"],
            addons: [{ name: "Lisateenus X", price: 10, currency: "EUR", price_unit: "month", description: "" }],
            plans: [{ name: `${name} Standard`, tier: "S", price: priceMatch ? Number(priceMatch[1].replace(",", ".")) : null, currency: "EUR", price_unit: "month", contract_months: 12, users: "", sla: "99,9 %", included: ["Tugi 24/7"], attributes: [{ key: "bandwidth", value: "1 Gbit/s" }] }],
            pricing_model: "subscription",
            price_notes: "mock",
            terms: "12 kuu leping",
            sla_notes: "",
            channel: "Otsemüük",
            technology: "",
            partners: "",
            headline: `Mock-peasõnum: ${name}`,
            original_headline: title,
            supporting_messages: ["Toetav sõnum 1"],
            proof_points: [],
            differentiators: ["Eristusväide 1"],
            confidence: 0.9,
          },
        ],
      },
      usage: this.usage,
    };
  }
  async mergeProducts(_ctx: CompanyContext, pages: { index: number; url: string; extraction: PageExtraction }[]): Promise<LlmResult<MergeResult>> {
    const byName = new Map<string, MergeResult["products"][number]>();
    for (const p of pages) {
      for (const prod of p.extraction.products) {
        const key = prod.name.toLowerCase();
        const ex = byName.get(key);
        if (ex) ex.source_page_indexes.push(p.index);
        else byName.set(key, { ...prod, source_page_indexes: [p.index], archetype_codes: ["managed_service"], status: "active" });
      }
    }
    return { data: { products: [...byName.values()] }, usage: this.usage };
  }
  async synthesize(): Promise<LlmResult<Synthesis>> {
    return {
      data: {
        canvas: {
          customer_segments: ["Mock: SME"], value_propositions: ["Mock: üks partner"], channels: ["Mock: otsemüük"], customer_relationships: ["Mock: haldur"],
          revenue_streams: ["Mock: kuutasu"], key_resources: ["Mock: võrk"], key_activities: ["Mock: haldus"], key_partners: ["Mock: tootjad"], cost_structure: ["Mock: opex"],
        },
        pain_gain: [
          { kind: "pain", customer_text: "Mock-valu", product_response: "Mock-leevendaja", fit_score: 2 },
          { kind: "gain", customer_text: "Mock-kasu", product_response: "", fit_score: 0 },
          { kind: "job", customer_text: "Mock-töö", product_response: "", fit_score: 1 },
        ],
        swot: { strengths: ["Mock S"], weaknesses: ["Mock W"], opportunities: ["Mock O"], threats: ["Mock T"] },
      },
      usage: this.usage,
    };
  }
}

export function createLlm(env: MappingEnv, extractModel: string, synthesisModel: string): Llm {
  if (env.LLM_MOCK === "1") return new MockLlm();
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY puudub Workeri saladustest");
  return new RealLlm(env.ANTHROPIC_API_KEY, extractModel, synthesisModel);
}
