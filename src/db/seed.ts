/**
 * Alusandmed: turud, ettevõtted (avalikud faktid: nimi, riik, tüüp, veebileht),
 * tootekategooriate taksonoomia, ärimudeli arhetüübid ja trenditeemad.
 * Tooteid, KPI-sid ega hindu ei seemneta: need tulevad kaardistusest koos allikaviitega.
 */
import { db, newId, schema } from "./index";
import { eq } from "drizzle-orm";

type MarketSeed = { code: string; name: string; region: string; currency: string; regulator: string; priority: number };
const MARKETS: MarketSeed[] = [
  { code: "EE", name: "Eesti", region: "Baltikum", currency: "EUR", regulator: "TTJA", priority: 1 },
  { code: "FI", name: "Soome", region: "Põhjala", currency: "EUR", regulator: "Traficom", priority: 1 },
  { code: "SE", name: "Rootsi", region: "Põhjala", currency: "SEK", regulator: "PTS", priority: 1 },
  { code: "NO", name: "Norra", region: "Põhjala", currency: "NOK", regulator: "Nkom", priority: 1 },
  { code: "DK", name: "Taani", region: "Põhjala", currency: "DKK", regulator: "Styrelsen for Dataforsyning og Infrastruktur", priority: 2 },
  { code: "LV", name: "Läti", region: "Baltikum", currency: "EUR", regulator: "SPRK", priority: 2 },
  { code: "LT", name: "Leedu", region: "Baltikum", currency: "EUR", regulator: "RRT", priority: 2 },
  { code: "NL", name: "Holland", region: "Lääne-Euroopa", currency: "EUR", regulator: "ACM", priority: 1 },
  { code: "BE", name: "Belgia", region: "Lääne-Euroopa", currency: "EUR", regulator: "BIPT", priority: 2 },
  { code: "DE", name: "Saksamaa", region: "Lääne-Euroopa", currency: "EUR", regulator: "Bundesnetzagentur", priority: 1 },
  { code: "AT", name: "Austria", region: "Lääne-Euroopa", currency: "EUR", regulator: "RTR", priority: 2 },
  { code: "CH", name: "Šveits", region: "Lääne-Euroopa", currency: "CHF", regulator: "BAKOM/ComCom", priority: 2 },
  { code: "GB", name: "Suurbritannia", region: "Lääne-Euroopa", currency: "GBP", regulator: "Ofcom", priority: 1 },
  { code: "IE", name: "Iirimaa", region: "Lääne-Euroopa", currency: "EUR", regulator: "ComReg", priority: 2 },
  { code: "FR", name: "Prantsusmaa", region: "Lõuna-Euroopa", currency: "EUR", regulator: "ARCEP", priority: 3 },
  { code: "ES", name: "Hispaania", region: "Lõuna-Euroopa", currency: "EUR", regulator: "CNMC", priority: 3 },
  { code: "PT", name: "Portugal", region: "Lõuna-Euroopa", currency: "EUR", regulator: "ANACOM", priority: 3 },
  { code: "IT", name: "Itaalia", region: "Lõuna-Euroopa", currency: "EUR", regulator: "AGCOM", priority: 3 },
  { code: "PL", name: "Poola", region: "Kesk-Euroopa", currency: "PLN", regulator: "UKE", priority: 4 },
  { code: "US", name: "USA", region: "Põhja-Ameerika", currency: "USD", regulator: "FCC", priority: 5 },
  { code: "JP", name: "Jaapan", region: "Aasia", currency: "JPY", regulator: "MIC", priority: 5 },
  { code: "KR", name: "Lõuna-Korea", region: "Aasia", currency: "KRW", regulator: "MSIT/KCC", priority: 5 },
  { code: "SG", name: "Singapur", region: "Aasia", currency: "SGD", regulator: "IMDA", priority: 5 },
  { code: "AU", name: "Austraalia", region: "Okeaania", currency: "AUD", regulator: "ACMA", priority: 5 },
];

type CompanySeed = { market: string; name: string; type: (typeof schema.companies.$inferInsert)["type"]; website?: string; group?: string; parent?: string; brands?: string };
const COMPANIES: CompanySeed[] = [
  // Eesti
  { market: "EE", name: "Telia Eesti", type: "incumbent", website: "https://www.telia.ee", group: "Telia Company" },
  { market: "EE", name: "Elisa Eesti", type: "challenger", website: "https://www.elisa.ee", group: "Elisa" },
  { market: "EE", name: "Tele2 Eesti", type: "challenger", website: "https://tele2.ee", group: "Tele2" },
  // Soome
  { market: "FI", name: "Elisa", type: "incumbent", website: "https://elisa.fi", group: "Elisa", brands: "Elisa, Saunalahti" },
  { market: "FI", name: "Elisa Santa Monica", type: "it_arm", website: "https://elisa.fi/yrityksille", parent: "Elisa" },
  { market: "FI", name: "Telia Finland", type: "challenger", website: "https://www.telia.fi", group: "Telia Company" },
  { market: "FI", name: "DNA", type: "challenger", website: "https://www.dna.fi", group: "Telenor" },
  // Rootsi
  { market: "SE", name: "Telia Sverige", type: "incumbent", website: "https://www.telia.se", group: "Telia Company", brands: "Telia, Halebop" },
  { market: "SE", name: "Telia Cygate", type: "it_arm", website: "https://www.cygate.se", parent: "Telia Sverige" },
  { market: "SE", name: "Tele2 Sverige", type: "challenger", website: "https://www.tele2.se", group: "Tele2", brands: "Tele2, Comviq" },
  { market: "SE", name: "Telenor Sverige", type: "challenger", website: "https://www.telenor.se", group: "Telenor" },
  { market: "SE", name: "Tre Sverige", type: "challenger", website: "https://www.tre.se", group: "CK Hutchison" },
  // Norra
  { market: "NO", name: "Telenor Norge", type: "incumbent", website: "https://www.telenor.no", group: "Telenor" },
  { market: "NO", name: "Telia Norge", type: "challenger", website: "https://www.telia.no", group: "Telia Company" },
  { market: "NO", name: "Ice", type: "challenger", website: "https://www.ice.no", group: "Lyse" },
  // Taani
  { market: "DK", name: "TDC Net / Nuuday", type: "incumbent", website: "https://www.nuuday.com", brands: "YouSee, Telmore" },
  { market: "DK", name: "Telenor Danmark", type: "challenger", website: "https://www.telenor.dk", group: "Telenor" },
  { market: "DK", name: "Telia Danmark", type: "challenger", website: "https://www.telia.dk", group: "Telia Company" },
  // Läti, Leedu
  { market: "LV", name: "LMT", type: "incumbent", website: "https://www.lmt.lv" },
  { market: "LV", name: "Tet", type: "incumbent", website: "https://www.tet.lv" },
  { market: "LV", name: "Bite Latvija", type: "challenger", website: "https://www.bite.lv", group: "Bité Group" },
  { market: "LT", name: "Telia Lietuva", type: "incumbent", website: "https://www.telia.lt", group: "Telia Company" },
  { market: "LT", name: "Bite Lietuva", type: "challenger", website: "https://www.bite.lt", group: "Bité Group" },
  // Holland, Belgia
  { market: "NL", name: "KPN", type: "incumbent", website: "https://www.kpn.com" },
  { market: "NL", name: "Odido", type: "challenger", website: "https://www.odido.nl" },
  { market: "NL", name: "VodafoneZiggo", type: "cable", website: "https://www.vodafoneziggo.nl", group: "Vodafone / Liberty Global" },
  { market: "BE", name: "Proximus", type: "incumbent", website: "https://www.proximus.be" },
  { market: "BE", name: "Orange Belgium", type: "challenger", website: "https://www.orange.be", group: "Orange" },
  { market: "BE", name: "Telenet", type: "cable", website: "https://www.telenet.be", group: "Liberty Global" },
  // Saksamaa, Austria, Šveits
  { market: "DE", name: "Deutsche Telekom", type: "incumbent", website: "https://www.telekom.de", brands: "Telekom, Magenta" },
  { market: "DE", name: "T-Systems", type: "it_arm", website: "https://www.t-systems.com", parent: "Deutsche Telekom" },
  { market: "DE", name: "Vodafone Deutschland", type: "challenger", website: "https://www.vodafone.de", group: "Vodafone" },
  { market: "DE", name: "Telefónica Deutschland (O2)", type: "challenger", website: "https://www.o2.de", group: "Telefónica" },
  { market: "DE", name: "1&1", type: "challenger", website: "https://www.1und1.de", group: "United Internet" },
  { market: "AT", name: "A1 Telekom Austria", type: "incumbent", website: "https://www.a1.net", group: "A1 Group" },
  { market: "AT", name: "Magenta Telekom", type: "challenger", website: "https://www.magenta.at", group: "Deutsche Telekom" },
  { market: "AT", name: "Drei Austria", type: "challenger", website: "https://www.drei.at", group: "CK Hutchison" },
  { market: "CH", name: "Swisscom", type: "incumbent", website: "https://www.swisscom.ch" },
  { market: "CH", name: "Sunrise", type: "challenger", website: "https://www.sunrise.ch" },
  { market: "CH", name: "Salt", type: "challenger", website: "https://www.salt.ch" },
  // UK, Iirimaa
  { market: "GB", name: "BT Group", type: "incumbent", website: "https://www.bt.com", brands: "BT, EE, Plusnet" },
  { market: "GB", name: "BT Business", type: "it_arm", website: "https://business.bt.com", parent: "BT Group" },
  { market: "GB", name: "VodafoneThree", type: "challenger", website: "https://www.vodafone.co.uk", group: "Vodafone / CK Hutchison" },
  { market: "GB", name: "Virgin Media O2", type: "cable", website: "https://www.virginmediao2.co.uk", group: "Liberty Global / Telefónica" },
  { market: "GB", name: "Sky", type: "mvno", website: "https://www.sky.com", group: "Comcast" },
  { market: "IE", name: "Eir", type: "incumbent", website: "https://www.eir.ie" },
  { market: "IE", name: "Vodafone Ireland", type: "challenger", website: "https://n.vodafone.ie", group: "Vodafone" },
  { market: "IE", name: "Three Ireland", type: "challenger", website: "https://www.three.ie", group: "CK Hutchison" },
  // Lõuna-Euroopa
  { market: "FR", name: "Orange", type: "incumbent", website: "https://www.orange.fr" },
  { market: "FR", name: "Orange Business", type: "it_arm", website: "https://www.orange-business.com", parent: "Orange" },
  { market: "FR", name: "SFR", type: "challenger", website: "https://www.sfr.fr", group: "Altice" },
  { market: "FR", name: "Bouygues Telecom", type: "challenger", website: "https://www.bouyguestelecom.fr" },
  { market: "FR", name: "Free (Iliad)", type: "challenger", website: "https://www.free.fr", group: "Iliad" },
  { market: "ES", name: "Telefónica España", type: "incumbent", website: "https://www.telefonica.es", group: "Telefónica", brands: "Movistar, O2" },
  { market: "ES", name: "MasOrange", type: "challenger", website: "https://www.masorange.es", brands: "Orange, Yoigo, Jazztel, Simyo" },
  { market: "ES", name: "Digi Spain", type: "challenger", website: "https://www.digimobil.es", group: "Digi" },
  { market: "PT", name: "MEO (Altice Portugal)", type: "incumbent", website: "https://www.meo.pt", group: "Altice" },
  { market: "PT", name: "NOS", type: "challenger", website: "https://www.nos.pt" },
  { market: "PT", name: "Vodafone Portugal", type: "challenger", website: "https://www.vodafone.pt", group: "Vodafone" },
  { market: "IT", name: "TIM", type: "incumbent", website: "https://www.tim.it" },
  { market: "IT", name: "Vodafone Italia / Fastweb", type: "challenger", website: "https://www.fastweb.it", group: "Swisscom" },
  { market: "IT", name: "WindTre", type: "challenger", website: "https://www.windtre.it", group: "CK Hutchison" },
  { market: "IT", name: "Iliad Italia", type: "challenger", website: "https://www.iliad.it", group: "Iliad" },
  { market: "PL", name: "Orange Polska", type: "incumbent", website: "https://www.orange.pl", group: "Orange" },
  { market: "PL", name: "Play", type: "challenger", website: "https://www.play.pl", group: "Iliad" },
  { market: "PL", name: "Plus (Polkomtel)", type: "challenger", website: "https://www.plus.pl" },
  { market: "PL", name: "T-Mobile Polska", type: "challenger", website: "https://www.t-mobile.pl", group: "Deutsche Telekom" },
  // Väljaspool Euroopat
  { market: "US", name: "Verizon", type: "incumbent", website: "https://www.verizon.com" },
  { market: "US", name: "AT&T", type: "incumbent", website: "https://www.att.com" },
  { market: "US", name: "T-Mobile US", type: "challenger", website: "https://www.t-mobile.com", group: "Deutsche Telekom" },
  { market: "JP", name: "NTT Docomo", type: "incumbent", website: "https://www.docomo.ne.jp", group: "NTT" },
  { market: "JP", name: "KDDI (au)", type: "challenger", website: "https://www.kddi.com" },
  { market: "JP", name: "SoftBank", type: "challenger", website: "https://www.softbank.jp" },
  { market: "JP", name: "Rakuten Mobile", type: "challenger", website: "https://network.mobile.rakuten.co.jp", group: "Rakuten" },
  { market: "KR", name: "SK Telecom", type: "incumbent", website: "https://www.sktelecom.com" },
  { market: "KR", name: "KT", type: "challenger", website: "https://www.kt.com" },
  { market: "KR", name: "LG Uplus", type: "challenger", website: "https://www.lguplus.com" },
  { market: "SG", name: "Singtel", type: "incumbent", website: "https://www.singtel.com" },
  { market: "SG", name: "StarHub", type: "challenger", website: "https://www.starhub.com" },
  { market: "AU", name: "Telstra", type: "incumbent", website: "https://www.telstra.com.au" },
  { market: "AU", name: "Optus", type: "challenger", website: "https://www.optus.com.au", group: "Singtel" },
];

const CATEGORIES = [
  // B2B (esimene etapp)
  { code: "B-MOB", segment: "B2B", nameEt: "Ärimobiil", nameEn: "Business mobile", sub: "paketid, jagatud andmemaht, MDM, rahvusvahelised paketid", order: 10 },
  { code: "B-CON", segment: "B2B", nameEt: "Ühenduvus", nameEn: "Connectivity", sub: "ärifiiber, Ethernet, MPLS, SD-WAN, SASE, internet-VPN, dedikeeritud juurdepääs", order: 11 },
  { code: "B-P5G", segment: "B2B", nameEt: "Privaatvõrgud ja IoT", nameEn: "Private networks and IoT", sub: "privaat-5G/LTE, NB-IoT, LTE-M, IoT-platvormid, M2M-SIM-haldus", order: 12 },
  { code: "B-UCC", segment: "B2B", nameEt: "Kommunikatsioon (UC&C)", nameEn: "Unified communications", sub: "pilv-PBX, Teams/Webex, kontaktikeskus (CCaaS), SIP-trunk, CPaaS/SMS-API", order: 13 },
  { code: "B-CLD", segment: "B2B", nameEt: "Pilv ja andmekeskus", nameEn: "Cloud and data centre", sub: "IaaS, private cloud, colocation, suveräänne pilv, hübriidpilve haldus, edge", order: 14 },
  { code: "B-SEC", segment: "B2B", nameEt: "Küberturve", nameEn: "Cybersecurity", sub: "MDR/SOC, tulemüür, DDoS-kaitse, identiteet, turvakonsultatsioon", order: 15 },
  { code: "B-WRK", segment: "B2B", nameEt: "Hallatud IT ja töökoht", nameEn: "Managed IT and workplace", sub: "Modern Workplace, hallatud seadmed, helpdesk, M365 teenused, litsentsid", order: 16 },
  { code: "B-DIG", segment: "B2B", nameEt: "Digiteenused ja AI", nameEn: "Digital services and AI", sub: "andmeanalüütika, AI-lahendused, IoT-rakendused, vertikaalsed lahendused", order: 17 },
  { code: "B-WHS", segment: "B2B", nameEt: "Hulgimüük", nameEn: "Wholesale", sub: "MVNO-majutus, transiit, torn-/fiibrijagamine, rändlus", order: 18 },
  // B2C (hilisem etapp)
  { code: "C-MOB", segment: "B2C", nameEt: "Mobiilside", nameEn: "Consumer mobile", sub: "postpaid, prepaid, noorte-/perepaketid, digi-alambränd", order: 30 },
  { code: "C-FIX", segment: "B2C", nameEt: "Koduinternet", nameEn: "Home broadband", sub: "fiiber, kaabel, DSL, FWA", order: 31 },
  { code: "C-TV", segment: "B2C", nameEt: "TV ja meelelahutus", nameEn: "TV and entertainment", sub: "IPTV, OTT, sisupaketid, partnerstriimingud", order: 32 },
  { code: "C-FMC", segment: "B2C", nameEt: "Konvergentsipaketid", nameEn: "Convergence bundles", sub: "mobiil + fiks + TV, perekonto, lojaalsussoodustused", order: 33 },
  { code: "C-DEV", segment: "B2C", nameEt: "Seadmed ja rahastus", nameEn: "Devices and financing", sub: "järelmaks, Device-as-a-Service, vahetusprogrammid, kindlustus", order: 34 },
  { code: "C-VAS", segment: "B2C", nameEt: "Lisateenused", nameEn: "Value-added services", sub: "turvalisus, pilvesalvestus, eSIM/reisi-SIM, nutikodu", order: 35 },
  { code: "C-DIV", segment: "B2C", nameEt: "Diversifikatsioon", nameEn: "Diversification", sub: "energia, kindlustus, fintech, tervis, lojaalsusprogramm", order: 36 },
] as const;

const ARCHETYPES = [
  { code: "fmc", nameEt: "Konvergents (FMC)", nameEn: "Convergence (FMC)", d: "Mobiil + fiks + TV ühes lepingus, soodustus kombineerimisel." },
  { code: "more_for_more", nameEt: "More-for-more", nameEn: "More-for-more", d: "Iga tase annab rohkem kõrgema hinna eest." },
  { code: "simplification", nameEt: "Lihtsustamine", nameEn: "Simplification", d: "1–3 paketti, piiramatu kõik, läbipaistvus." },
  { code: "digital_subbrand", nameEt: "Digi-only alambränd", nameEn: "Digital-only sub-brand", d: "Odav, ainult äpis, minimaalne teenindus." },
  { code: "daas", nameEt: "Seade teenusena (DaaS)", nameEn: "Device-as-a-Service", d: "Seade kuutasuga, vahetusprogramm, kindlustus." },
  { code: "ecosystem", nameEt: "Ökosüsteem / platvorm", nameEn: "Ecosystem / platform", d: "Operaator kui mitme teenuse koondaja." },
  { code: "b2b2c", nameEt: "B2B2C", nameEn: "B2B2C", d: "Partner müüb operaatori teenust oma klientidele." },
  { code: "wholesale_first", nameEt: "Hulgimüügi-first", nameEn: "Wholesale-first", d: "Võrk kui platvorm teistele." },
  { code: "usage_based", nameEt: "Kasutuspõhine", nameEn: "Usage-based", d: "Maksad kasutatu eest (NaaS, IoT, pilv)." },
  { code: "managed_service", nameEt: "Hallatud teenus", nameEn: "Managed service", d: "Operaator vastutab kogu lahenduse eest SLA alusel." },
  { code: "sovereign_cloud", nameEt: "Suveräänne / kohalik pilv", nameEn: "Sovereign / local cloud", d: "Andmed riigis, regulatiivne eelis." },
  { code: "ai_services", nameEt: "AI-teenused", nameEn: "AI services", d: "AI-lisandid ja -lahendused müügiks." },
  { code: "loyalty", nameEt: "Lojaalsus ja kogukond", nameEn: "Loyalty and community", d: "Preemiad, kogukonnaboonused, partnerite eelised." },
  { code: "bundled_security", nameEt: "Turve paketis", nameEn: "Bundled security", d: "Küberturve ühenduvuse või mobiili paketi osana." },
  { code: "marketplace", nameEt: "Turuplats", nameEn: "Marketplace", d: "Kolmandate osapoolte SaaS/IT-teenuste edasimüük ühest kohast." },
];

const TRENDS = [
  ["convergence", "Konvergents ja kombod", "Convergence and bundles"],
  ["price_simplification", "Hinnalihtsustamine", "Price simplification"],
  ["cpi_pricing", "CPI-indekseeritud hinnatõusud", "CPI-indexed price rises"],
  ["5g_sa_slicing", "5G SA ja võrguviilutamine", "5G SA and network slicing"],
  ["fwa", "FWA", "Fixed wireless access"],
  ["fiber_consolidation", "Fiibrikonsolideerumine ja vase sulgemine", "Fibre consolidation and copper switch-off"],
  ["d2d_satellite", "Satelliit-mobiil (D2D)", "Direct-to-device satellite"],
  ["esim_digital_onboarding", "eSIM ja digi-onboarding", "eSIM and digital onboarding"],
  ["ai_ops", "AI klienditeeninduses ja võrgus", "AI in customer service and network"],
  ["ai_products", "AI-teenused müügiks", "AI services for sale"],
  ["mass_security", "Küberturve massturule", "Cybersecurity for the mass market"],
  ["sovereign_cloud", "Suveräänne pilv", "Sovereign cloud"],
  ["private_5g", "Privaat-5G tööstusele", "Private 5G for industry"],
  ["iot_platforms", "IoT platvormid", "IoT platforms"],
  ["b2b_ict_growth", "B2B ICT-käibe kasv", "B2B ICT revenue growth"],
  ["sdwan_sase", "SD-WAN ja SASE", "SD-WAN and SASE"],
  ["ucc_teams", "UC&C ja Teams-integratsioon", "UC&C and Teams integration"],
  ["content_partnerships", "Sisupartnerlused", "Content partnerships"],
  ["diversification", "Energia ja fintech diversifikatsioon", "Energy and fintech diversification"],
  ["sustainability", "Jätkusuutlikkus", "Sustainability"],
  ["infra_carveout", "Torn- ja fiibrivarade eraldamine", "Tower and fibre carve-outs"],
  ["mvno_subbrands", "MVNO ja digi-alambrändid", "MVNOs and digital sub-brands"],
  ["consolidation", "Regulatiivne konsolideerumine (4→3)", "Market consolidation (4→3)"],
  ["network_api", "Võrgu-API-d (CAMARA, Open Gateway)", "Network APIs (CAMARA, Open Gateway)"],
] as const;

function upsertMarkets() {
  const ids = new Map<string, string>();
  for (const m of MARKETS) {
    const ex = db.select().from(schema.markets).where(eq(schema.markets.code, m.code)).get();
    if (ex) {
      ids.set(m.code, ex.id);
      continue;
    }
    const id = newId();
    db.insert(schema.markets).values({ id, code: m.code, name: m.name, region: m.region, currency: m.currency, regulator: m.regulator, priority: m.priority }).run();
    ids.set(m.code, id);
  }
  return ids;
}

function upsertCompanies(marketIds: Map<string, string>) {
  const byName = new Map<string, string>();
  for (const c of COMPANIES) {
    const marketId = marketIds.get(c.market)!;
    const ex = db.select().from(schema.companies).where(eq(schema.companies.name, c.name)).get();
    if (ex) {
      byName.set(c.name, ex.id);
      continue;
    }
    const id = newId();
    db.insert(schema.companies).values({ id, marketId, name: c.name, type: c.type, website: c.website, group: c.group, brands: c.brands }).run();
    byName.set(c.name, id);
  }
  for (const c of COMPANIES) {
    if (!c.parent) continue;
    const parentId = byName.get(c.parent);
    if (parentId) db.update(schema.companies).set({ parentId }).where(eq(schema.companies.id, byName.get(c.name)!)).run();
  }
}

function upsertCategories() {
  for (const c of CATEGORIES) {
    const ex = db.select().from(schema.categories).where(eq(schema.categories.code, c.code)).get();
    if (ex) continue;
    db.insert(schema.categories).values({ id: newId(), code: c.code, segment: c.segment, nameEt: c.nameEt, nameEn: c.nameEn, subcategories: c.sub, sortOrder: c.order }).run();
  }
}

function upsertArchetypes() {
  for (const a of ARCHETYPES) {
    const ex = db.select().from(schema.archetypes).where(eq(schema.archetypes.code, a.code)).get();
    if (ex) continue;
    db.insert(schema.archetypes).values({ id: newId(), code: a.code, nameEt: a.nameEt, nameEn: a.nameEn, description: a.d }).run();
  }
}

function upsertTrends() {
  for (const [code, et, en] of TRENDS) {
    const ex = db.select().from(schema.trendTags).where(eq(schema.trendTags.code, code)).get();
    if (ex) continue;
    db.insert(schema.trendTags).values({ id: newId(), code, nameEt: et, nameEn: en }).run();
  }
}

const marketIds = upsertMarkets();
upsertCompanies(marketIds);
upsertCategories();
upsertArchetypes();
upsertTrends();
console.log(`Seed valmis: ${MARKETS.length} turgu, ${COMPANIES.length} ettevõtet, ${CATEGORIES.length} kategooriat, ${ARCHETYPES.length} arhetüüpi, ${TRENDS.length} trenditeemat.`);
